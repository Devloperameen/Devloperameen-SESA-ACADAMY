import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { UserRole } from '../models/User.js';

/**
 * Middleware to check if user can access free preview (Part 1)
 * Allows access to anyone for Part 1, even without authentication
 */
export const allowFreePreview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if course is published and approved
        if (!course.isPublished || course.status !== 'approved') {
            return res.status(403).json({ message: 'This course is not available for preview' });
        }

        // Allow access to free preview for anyone
        req.course = course;
        next();
    } catch (error) {
        console.error('Free preview access middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Middleware to check if user can access full course content
 * Requires enrollment and payment verification
 */
export const requireFullAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        const userId = req.user!.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user is admin or instructor
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;
        const isInstructor = course.instructor.toString() === userId;

        if (isAdmin || isInstructor) {
            req.course = course;
            req.accessLevel = isAdmin ? 'admin' : 'instructor';
            return next();
        }

        // Check enrollment status
        const enrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
            status: 'approved'
        });

        if (!enrollment) {
            return res.status(403).json({ 
                message: 'Enrollment required to access full content',
                suggestion: 'Request enrollment and wait for admin verification'
            });
        }

        // For students, check if they have access to current lesson
        const lessonIndex = parseInt(req.params.lessonIndex || '0');
        
        // Part 1 (index 0) is always free
        if (lessonIndex === 0) {
            req.course = course;
            req.accessLevel = 'student';
            req.lessonAccess = 'free';
            return next();
        }

        // For other lessons, check if student is enrolled and verified
        req.course = course;
        req.accessLevel = 'student';
        req.lessonAccess = 'full';
        next();
    } catch (error) {
        console.error('Full access middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Middleware to check if user can manage course (teacher/admin only)
 */
export const requireCourseManagement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        const userId = req.user!.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user is admin
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;
        
        // Check if user is the course instructor
        const isInstructor = course.instructor.toString() === userId;
        
        // Check if user has instructor role
        const hasInstructorRole = req.user!.role === UserRole.INSTRUCTOR || 
                                 req.user!.role === UserRole.ASSISTANT_INSTRUCTOR;

        if (isAdmin || (isInstructor && hasInstructorRole)) {
            req.course = course;
            next();
        } else {
            return res.status(403).json({ 
                message: 'Not authorized to manage this course',
                suggestion: 'Only course instructors or admins can manage courses'
            });
        }
    } catch (error) {
        console.error('Course management middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Extend AuthRequest interface
declare module './auth.js' {
    interface AuthRequest {
        course?: any;
        accessLevel?: 'admin' | 'instructor' | 'student';
        lessonAccess?: 'free' | 'full';
    }
}