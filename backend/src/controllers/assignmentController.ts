import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Gamification from '../models/Gamification.js';
import { UserRole } from '../models/User.js';

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment
 * @access  Private (Teacher/Admin)
 */
export const createAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, lessonId, title, description, instructions, dueDate, maxPoints, allowLateSubmission, latePenalty, attachments } = req.body;
        const userId = req.user!.id;

        // Verify course exists and user is instructor
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const isInstructor = course.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to create assignment for this course' });
        }

        const assignment = new Assignment({
            courseId,
            lessonId,
            title,
            description,
            instructions,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            maxPoints: maxPoints || 100,
            allowLateSubmission: allowLateSubmission !== false,
            latePenalty: latePenalty || 10,
            attachments: attachments || [],
            createdBy: userId,
            submissions: []
        });

        await assignment.save();

        // Add assignment reference to course
        if (!course.assignments) {
            course.assignments = [];
        }
        course.assignments.push(assignment._id);
        await course.save();

        res.status(201).json({
            message: 'Assignment created successfully',
            assignment
        });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/assignments/course/:courseId
 * @desc    Get all assignments for a course
 * @access  Private
 */
export const getCourseAssignments = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user!.id;

        const assignments = await Assignment.find({ courseId, isActive: true })
            .sort({ createdAt: -1 });

        // For students, include their submission status
        if (req.user!.role === UserRole.STUDENT) {
            const assignmentsWithStatus = assignments.map(assignment => {
                const submission = assignment.submissions.find(
                    sub => sub.studentId.toString() === userId
                );

                return {
                    ...assignment.toObject(),
                    submissions: undefined, // Don't show other students' submissions
                    mySubmission: submission || null,
                    isSubmitted: !!submission,
                    isGraded: submission?.status === 'graded'
                };
            });

            return res.json(assignmentsWithStatus);
        }

        res.json(assignments);
    } catch (error) {
        console.error('Get course assignments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/assignments/:assignmentId
 * @desc    Get assignment details
 * @access  Private
 */
export const getAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user!.id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // For students, only show their own submission
        if (req.user!.role === UserRole.STUDENT) {
            const mySubmission = assignment.submissions.find(
                sub => sub.studentId.toString() === userId
            );

            return res.json({
                ...assignment.toObject(),
                submissions: undefined,
                mySubmission: mySubmission || null
            });
        }

        // For teachers/admins, populate student info
        await assignment.populate('submissions.studentId', 'name email');
        res.json(assignment);
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   POST /api/assignments/:assignmentId/submit
 * @desc    Submit assignment (with files and screenshots)
 * @access  Private (Student)
 */
export const submitAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const { files, screenshots, textSubmission } = req.body;
        const userId = req.user!.id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if already submitted
        const existingSubmission = assignment.submissions.find(
            sub => sub.studentId.toString() === userId
        );

        if (existingSubmission && existingSubmission.status === 'graded') {
            return res.status(400).json({ message: 'Cannot resubmit graded assignment' });
        }

        // Check if late
        const now = new Date();
        const isLate = assignment.dueDate && now > assignment.dueDate;

        if (isLate && !assignment.allowLateSubmission) {
            return res.status(400).json({ message: 'Late submissions not allowed' });
        }

        const submission = {
            studentId: userId,
            files: files || [],
            screenshots: screenshots || [],
            textSubmission: textSubmission || '',
            submittedAt: now,
            status: isLate ? 'late' : 'submitted'
        };

        if (existingSubmission) {
            // Update existing submission
            Object.assign(existingSubmission, submission);
        } else {
            // Add new submission
            assignment.submissions.push(submission as any);
        }

        await assignment.save();

        // Award points for submission
        await awardSubmissionPoints(userId, assignmentId);

        res.json({
            message: 'Assignment submitted successfully',
            submission: {
                ...submission,
                isLate
            }
        });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/assignments/:assignmentId/submissions
 * @desc    Get all submissions for an assignment (Teacher/Admin)
 * @access  Private (Teacher/Admin)
 */
export const getAssignmentSubmissions = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user!.id;

        const assignment = await Assignment.findById(assignmentId)
            .populate('submissions.studentId', 'name email profileImage');

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify authorization
        const course = await Course.findById(assignment.courseId);
        const isInstructor = course?.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json({
            assignmentTitle: assignment.title,
            totalSubmissions: assignment.submissions.length,
            submissions: assignment.submissions
        });
    } catch (error) {
        console.error('Get assignment submissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/assignments/:assignmentId/submissions/:studentId/preview
 * @desc    Preview student submission (screenshots and files) - FIXES ADMIN BUG
 * @access  Private (Teacher/Admin)
 */
export const previewSubmission = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId, studentId } = req.params;
        const userId = req.user!.id;

        const assignment = await Assignment.findById(assignmentId)
            .populate('submissions.studentId', 'name email');

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify authorization
        const course = await Course.findById(assignment.courseId);
        const isInstructor = course?.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const submission = assignment.submissions.find(
            sub => sub.studentId._id.toString() === studentId
        );

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Return submission with all files and screenshots for preview
        res.json({
            student: submission.studentId,
            submittedAt: submission.submittedAt,
            status: submission.status,
            files: submission.files,
            screenshots: submission.screenshots,
            textSubmission: submission.textSubmission,
            grade: submission.grade,
            feedback: submission.feedback,
            isLate: assignment.dueDate && submission.submittedAt > assignment.dueDate
        });
    } catch (error) {
        console.error('Preview submission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   PUT /api/assignments/:assignmentId/grade/:studentId
 * @desc    Grade student submission
 * @access  Private (Teacher/Admin)
 */
export const gradeSubmission = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId, studentId } = req.params;
        const { grade, feedback } = req.body;
        const userId = req.user!.id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify authorization
        const course = await Course.findById(assignment.courseId);
        const isInstructor = course?.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const submission = assignment.submissions.find(
            sub => sub.studentId.toString() === studentId
        );

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Apply late penalty if applicable
        let finalGrade = grade;
        const isLate = assignment.dueDate && submission.submittedAt > assignment.dueDate;
        
        if (isLate && assignment.latePenalty) {
            finalGrade = grade * (1 - assignment.latePenalty / 100);
        }

        submission.grade = Math.max(0, Math.min(finalGrade, assignment.maxPoints));
        submission.feedback = feedback;
        submission.gradedBy = userId as any;
        submission.gradedAt = new Date();
        submission.status = 'graded';

        await assignment.save();

        // Award points for graded assignment
        await awardAssignmentPoints(studentId, assignmentId, submission.grade, assignment.maxPoints);

        res.json({
            message: 'Assignment graded successfully',
            grade: submission.grade,
            feedback: submission.feedback
        });
    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Helper function to award points for assignment submission
 */
async function awardSubmissionPoints(userId: string, assignmentId: string) {
    try {
        let gamification = await Gamification.findOne({ userId });
        
        if (!gamification) {
            gamification = new Gamification({ userId });
        }

        const points = 50; // Base points for submission
        gamification.totalPoints += points;
        gamification.achievements.assignmentsSubmitted += 1;
        
        gamification.pointsHistory.push({
            points,
            reason: 'Assignment submitted',
            source: 'assignment',
            sourceId: assignmentId as any,
            earnedAt: new Date()
        });

        await gamification.save();
    } catch (error) {
        console.error('Award submission points error:', error);
    }
}

/**
 * Helper function to award points for graded assignment
 */
async function awardAssignmentPoints(userId: string, assignmentId: string, grade: number, maxPoints: number) {
    try {
        let gamification = await Gamification.findOne({ userId });
        
        if (!gamification) {
            gamification = new Gamification({ userId });
        }

        // Award points based on grade percentage
        const percentage = (grade / maxPoints) * 100;
        const points = Math.floor(percentage * 5); // Up to 500 points for perfect score

        gamification.totalPoints += points;
        
        gamification.pointsHistory.push({
            points,
            reason: `Assignment graded: ${percentage.toFixed(1)}%`,
            source: 'assignment',
            sourceId: assignmentId as any,
            earnedAt: new Date()
        });

        await gamification.save();
    } catch (error) {
        console.error('Award assignment points error:', error);
    }
}

/**
 * @route   PUT /api/assignments/:assignmentId
 * @desc    Update assignment
 * @access  Private (Teacher/Admin)
 */
export const updateAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const updates = req.body;
        const userId = req.user!.id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify authorization
        const course = await Course.findById(assignment.courseId);
        const isInstructor = course?.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        Object.assign(assignment, updates);
        await assignment.save();

        res.json({
            message: 'Assignment updated successfully',
            assignment
        });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   DELETE /api/assignments/:assignmentId
 * @desc    Delete assignment
 * @access  Private (Teacher/Admin)
 */
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user!.id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify authorization
        const course = await Course.findById(assignment.courseId);
        const isInstructor = course?.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Soft delete
        assignment.isActive = false;
        await assignment.save();

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
