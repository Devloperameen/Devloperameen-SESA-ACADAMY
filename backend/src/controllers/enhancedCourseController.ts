// Enhanced Course Controller with Optimized Queries
import type { Response, NextFunction } from 'express';
import { Course, Analytics, Enrollment } from '../models/EnhancedCourse.js';
import type { AuthRequest } from '../middleware/authEnhanced.js';
import { authenticate, checkEnhancedPermissions } from '../middleware/authEnhanced.js';
import { body, validationResult } from 'express-validator';

// Advanced search with multiple filters
export const searchCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            query,
            category,
            level,
            priceMin,
            priceMax,
            tags,
            instructor,
            isFeatured,
            language,
            duration,
            page = 1,
            limit = 20
        } = req.query;

        // Build search filter
        const filter: any = {};
        
        if (query) {
            const parsedTags = Array.isArray(tags)
                ? tags
                : typeof tags === 'string'
                    ? tags.split(',').map((t) => t.trim()).filter(Boolean)
                    : [];

            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $in: parsedTags } }
            ];
        }
        
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (priceMin !== undefined) filter.price = { $gte: parseFloat(priceMin as string) };
        if (priceMax !== undefined) filter.price = { ...filter.price, $lte: parseFloat(priceMax as string) };
        if (instructor) filter.instructor = instructor;
        if (isFeatured === 'true') filter.isFeatured = true;
        if (language) filter.language = language;
        if (duration) filter.duration = { $lte: parseFloat(duration as string) };

        // Only show published courses
        filter.isPublished = true;

        // Execute query with pagination
        const pageNumber = Math.max(1, parseInt(page as string) || 1);
        const perPage = Math.max(1, parseInt(limit as string) || 20);
        const skip = (pageNumber - 1) * perPage;
        
        const [courses, total] = await Promise.all([
            Course.find(filter)
                .select('title description shortDescription thumbnailUrl price level category instructor rating.average tags isFeatured seo.slug')
                .sort({ createdAt: -1, isFeatured: -1, rating: -1 })
                .skip(skip)
                .limit(perPage)
                .lean(),
            Course.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: courses,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / perPage),
                totalCourses: total,
                hasNext: skip + courses.length < total
            }
        });
    } catch (error) {
        console.error('Search courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search courses',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get course with full analytics
export const getCourseWithAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        
        const course = await Course.findById(courseId)
            .populate('instructor', 'name email profileImage')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'userId',
                    select: 'name profileImage'
                }
            })
            .lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get course analytics
        const analytics = await Analytics.findOne({ courseId }).lean();
        const enrollments = await Enrollment.find({ courseId, status: { $in: ['approved', 'completed'] } })
            .populate('studentId', 'name email')
            .lean();

        // Calculate additional stats
        const totalProgress = enrollments.reduce((sum, enrollment) => sum + (enrollment.progressPercentage || 0), 0);
        const averageProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0;

        res.json({
            success: true,
            data: {
                ...course,
                analytics: analytics || {
                    totalEnrollments: enrollments.length,
                    activeEnrollments: enrollments.filter(e => e.status === 'approved').length,
                    completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
                    averageCompletionTime: 0,
                    averageRating: course.rating?.average || 0,
                    totalRevenue: enrollments.filter(e => e.paymentStatus === 'completed').length * (course.price || 0),
                    averageProgress: Math.round(averageProgress)
                },
                enrollments: enrollments.map((e) => {
                    const student: any = e.studentId || {};
                    return {
                        studentId: e.studentId,
                        studentName: student.name || '',
                        studentEmail: student.email || '',
                        status: e.status,
                        progressPercentage: e.progressPercentage,
                        enrolledAt: e.enrolledAt,
                        completedAt: e.completedAt
                    };
                })
            }
        });
    } catch (error) {
        console.error('Get course analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get course analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Bulk course operations for admin
export const bulkUpdateCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { courseIds, updates } = req.body;
        
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Course IDs array is required'
            });
        }

        const result = await Course.updateMany(
            { _id: { $in: courseIds } },
            { $set: updates, updatedAt: new Date() },
            { new: true }
        );

        res.json({
            success: true,
            message: `Updated ${result.modifiedCount} courses successfully`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Bulk update courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update courses',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get popular courses with caching simulation
export const getPopularCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { limit = 10 } = req.query;
        
        // Aggregation pipeline for popular courses
        const popularCourses = await Course.aggregate([
            {
                $match: { isPublished: true },
                $addFields: {
                    enrollmentCount: { $size: '$currentEnrollments' },
                    averageRating: '$rating.average',
                    reviewCount: { $size: '$reviews' }
                },
                $sort: { enrollmentCount: -1, averageRating: -1, reviewCount: -1 },
                $limit: parseInt(limit as string)
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'instructor',
                    foreignField: '_id',
                    as: 'instructorData'
                }
            },
            {
                $project: {
                    title: 1,
                    shortDescription: 1,
                    thumbnailUrl: 1,
                    price: 1,
                    level: 1,
                    tags: 1,
                    enrollmentCount: 1,
                    averageRating: '$rating.average',
                    reviewCount: 1,
                    'instructorData.name': 1,
                    'instructorData.profileImage': 1,
                    'instructorData.email': 1,
                    createdAt: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: popularCourses,
            cached: false // In production, this would be cached
        });
    } catch (error) {
        console.error('Get popular courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get popular courses',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Course recommendations based on user behavior
export const getRecommendedCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { limit = 5 } = req.query;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get user's enrolled courses and preferences
        const userEnrollments = await Enrollment.find({ 
            studentId: userId, 
            status: { $in: ['approved', 'completed'] } 
        }).populate('courseId').lean();

        const enrolledCourseIds = userEnrollments.map(e => e.courseId);
        const enrolledCategories = await Course.find({ 
            _id: { $in: enrolledCourseIds } 
        }).select('category tags level').lean();

        // Build recommendation logic
        const categoryFrequency: { [key: string]: number } = {};
        enrolledCategories.forEach(course => {
            if (course.category) {
                const categoryKey = course.category.toString();
                categoryFrequency[categoryKey] = (categoryFrequency[categoryKey] || 0) + 1;
            }
        });

        // Find courses in similar categories
        const recommendedCourses = await Course.find({
            _id: { $nin: enrolledCourseIds },
            isPublished: true,
            category: { $in: Object.keys(categoryFrequency).sort((a, b) => categoryFrequency[b] - categoryFrequency[a]).slice(0, 3) }
        })
        .select('title shortDescription thumbnailUrl price level tags instructor.rating.average')
        .sort({ rating: -1, enrollments: -1 })
        .limit(parseInt(limit as string))
        .populate('instructor', 'name profileImage')
        .lean();

        res.json({
            success: true,
            data: recommendedCourses,
            basedOn: 'enrollment_history_and_categories'
        });
    } catch (error) {
        console.error('Get recommended courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
