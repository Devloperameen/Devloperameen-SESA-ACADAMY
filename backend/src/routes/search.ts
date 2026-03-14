import express from 'express';
import type { Response } from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { optionalAuthenticate, type AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

// @route   GET /api/search
// @desc    Full-text course search with filters
// @query   q, category, level, minPrice, maxPrice, page, limit
// @access  Public (results are privacy-filtered)
router.get('/', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const {
            q,
            category,
            level,
            gradeLevel,
            minPrice,
            maxPrice,
            page: pageStr = '1',
            limit: limitStr = '12',
        } = req.query as Record<string, string>;

        const page = Math.max(1, parseInt(pageStr) || 1);
        const limit = Math.min(50, parseInt(limitStr) || 12);
        const skip = (page - 1) * limit;

        // Build filter
        const filter: Record<string, any> = {
            status: 'approved',
            isPublished: true,
            isHidden: { $ne: true },
        };

        // Text search — title OR description (case-insensitive regex)
        if (q && q.trim().length > 0) {
            const safeQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { title: { $regex: safeQ, $options: 'i' } },
                { description: { $regex: safeQ, $options: 'i' } },
                { tags: { $elemMatch: { $regex: safeQ, $options: 'i' } } },
            ];
        }

        if (category) filter.category = category;
        if (gradeLevel) filter.gradeLevel = gradeLevel;
        if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
            filter.level = level;
        }

        // Search within lessons/resources if query is present
        if (q && q.trim().length > 0) {
             const safeQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             filter.$or.push({ 'lessons.title': { $regex: safeQ, $options: 'i' } });
             filter.$or.push({ 'lessons.resources.title': { $regex: safeQ, $options: 'i' } });
        }

        // Price range filter
        const priceFilter: Record<string, number> = {};
        if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
            priceFilter.$gte = parseFloat(minPrice);
        }
        if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
            priceFilter.$lte = parseFloat(maxPrice);
        }
        if (Object.keys(priceFilter).length > 0) {
            filter.price = priceFilter;
        }

        const [courses, instructors, total] = await Promise.all([
            Course.find(filter)
                .populate('instructor', 'name email avatar')
                .populate('category', 'name icon')
                .select('-students -enrolledStudents -pendingApprovals -lessons -lockedContent')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.find({
                role: { $in: [UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR] },
                $or: [
                    { name: { $regex: q || '', $options: 'i' } },
                    { email: { $regex: q || '', $options: 'i' } },
                ]
            })
            .select('name email role avatar')
            .limit(10)
            .lean(),
            Course.countDocuments(filter),
        ]);

        // Strip sensitive URLs for public requests
        const isPrivileged =
            req.user?.role === UserRole.ADMIN ||
            req.user?.role === UserRole.SUPER_ADMIN ||
            req.user?.role === UserRole.INSTRUCTOR;

        const sanitizedCourses = isPrivileged
            ? courses
            : courses.map(({ resourceUrl: _r, ...rest }) => rest);

        res.json({
            courses: sanitizedCourses,
            teachers: instructors,
            query: q || '',
            filters: { category, level, minPrice, maxPrice },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: skip + courses.length < total,
            },
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ message: 'Search failed' });
    }
});

// @route   GET /api/search/suggestions
// @desc    Autocomplete suggestions (top 5 matching titles)
// @access  Public
router.get('/suggestions', async (req: any, res: Response) => {
    try {
        const q = (req.query.q as string || '').trim();
        if (!q || q.length < 2) return res.json({ suggestions: [] });

        const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const [courses, instructors] = await Promise.all([
            Course.find({
                status: 'approved',
                isPublished: true,
                isHidden: { $ne: true },
                title: { $regex: safeQ, $options: 'i' },
            })
                .select('title category level price thumbnailUrl')
                .populate('category', 'name icon')
                .limit(5)
                .lean(),
            User.find({
                role: { $in: [UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR] },
                name: { $regex: safeQ, $options: 'i' }
            })
            .select('name role avatar')
            .limit(3)
            .lean()
        ]);

        res.json({ 
            suggestions: {
                courses,
                teachers: instructors
            }
        });
    } catch (err) {
        console.error('Suggestion error:', err);
        res.status(500).json({ message: 'Suggestion failed' });
    }
});

export default router;
