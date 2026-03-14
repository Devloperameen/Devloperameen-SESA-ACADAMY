import React, { useCallback, useEffect, useMemo, useState } from 'react';
import apiService from '../utils/api';
import type { StudentCourse } from '../components/dashboard/CourseCard';
import {
    BookOpen,
    Users,
    Clock3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import type { Course } from '../types';
import ModeratorDashboard from '../components/dashboard/ModeratorDashboard';
import AssistantDashboard from '../components/dashboard/AssistantDashboard';
import PremiumStudentDashboard from '../components/dashboard/PremiumStudentDashboard';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import InstructorDashboard from '../components/dashboard/InstructorDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import { toast } from 'react-toastify';

interface DashboardUserRecord {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface PendingQueueRecord {
    courseId: string;
    courseTitle: string;
    student: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    requestedAt: string;
}

interface RevenueStats {
    totalRevenue: number;
    monthlyRevenue: number;
    totalApprovedEnrollments: number;
    totalCourses: number;
    totalUsers: number;
}

interface DashboardDataResponse {
    role: string;
    users?: DashboardUserRecord[];
    students?: DashboardUserRecord[];
    courses?: Course[];
    pendingCourses?: Course[];
    pendingQueue?: PendingQueueRecord[];
    enrollmentStats?: {
        approved: number;
        pending: number;
        rejected: number;
    };
    revenueStats?: RevenueStats;
}

const normalizeEnrollmentStatus = (course: Course): 'approved' | 'pending' => {
    const pendingCount = course.pendingApprovals?.length ?? 0;
    const enrolledCount = course.enrolledStudents?.length ?? 0;

    if (pendingCount > 0 && enrolledCount === 0) return 'pending';
    return 'approved';
};

const mapCourseToStudentCard = (course: Course, status: 'approved' | 'pending', index: number): StudentCourse => {
    const progressPercent = status === 'approved' ? Math.min(100, 55 + (index % 5) * 9) : 20;
    const totalLessons = 16;
    const completedLessons = Math.round((progressPercent / 100) * totalLessons);

    return {
        id: course._id,
        title: course.title,
        summary: course.description,
        instructor: course.instructor?.name || 'SESA Mentor',
        progressPercent,
        totalLessons,
        completedLessons,
        durationLabel: status === 'approved' ? `${Math.max(1, totalLessons - completedLessons)} lessons left` : 'Waiting for approval',
        difficulty: progressPercent >= 75 ? 'Advanced' : progressPercent >= 45 ? 'Intermediate' : 'Beginner',
        isLive: index === 0,
        lastOpenedLabel: status === 'approved' ? 'Continue learning' : 'Pending admin review',
        instructorId: course.instructor?._id || (typeof course.instructor === 'string' ? course.instructor : ''),
    };
};

const Dashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardDataResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (!token) return;

        let mounted = true;

        const load = async (): Promise<void> => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiService.users.getDashboardData();

                if (mounted) {
                    setDashboardData(response.data);
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err?.response?.data?.message || 'Failed to load dashboard data');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [token]);

    const handleModeratorAction = async (type: string, id: string, action: string) => {
        try {
            if (type === 'enrollment') {
                if (action === 'approve') {
                    await apiService.admin.verifyEnrollment(id, 'Approved by Moderator');
                    toast.success('Enrollment approved successfully');
                } else if (action === 'reject') {
                    await apiService.admin.verifyEnrollment(id, 'Rejected by Moderator');
                    toast.info('Enrollment decision processed');
                }
            } else if (type === 'course') {
                if (action === 'approve') {
                    await apiService.admin.reviewCourse(id, 'accept', 'Approved by Moderator');
                    toast.success('Course approved');
                }
            } else if (type === 'comment') {
                toast.info('Comment moderation feature coming soon');
            }

            // Refresh dashboard data
            const response = await apiService.users.getDashboardData();
            setDashboardData(response.data);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Action failed');
        }
    };

    const role = user?.role;
    const isStudent = role === UserRole.STUDENT || role === UserRole.PREMIUM_STUDENT;
    const isInstructor = role === UserRole.INSTRUCTOR;
    const isAssistant = role === UserRole.ASSISTANT_INSTRUCTOR;
    const isModerator = role === UserRole.MODERATOR;
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

    const approvedStudentCourses = useMemo(() => {
        if (!dashboardData?.courses) return [];
        return dashboardData.courses.map((course, index) =>
            mapCourseToStudentCard(course, normalizeEnrollmentStatus(course), index)
        );
    }, [dashboardData?.courses]);

    const pendingStudentCourses = useMemo(() => {
        if (!dashboardData?.pendingCourses) return [];
        return dashboardData.pendingCourses.map((course, index) =>
            mapCourseToStudentCard(course, 'pending', index + approvedStudentCourses.length)
        );
    }, [dashboardData?.pendingCourses, approvedStudentCourses.length]);

    const studentCourseCards = useMemo(() => {
        const byId = new Map<string, StudentCourse>();
        [...approvedStudentCourses, ...pendingStudentCourses].forEach((course) => {
            if (!byId.has(course.id)) {
                byId.set(course.id, course);
            }
        });
        return Array.from(byId.values());
    }, [approvedStudentCourses, pendingStudentCourses]);

    const fetchStudentCards = useCallback(async (): Promise<StudentCourse[]> => {
        return studentCourseCards;
    }, [studentCourseCards]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="rounded-xl border border-slate-700 bg-[#112240] px-6 py-4 text-slate-200">
                    Loading dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="max-w-lg rounded-xl border border-rose-500/40 bg-rose-500/10 px-6 py-4 text-rose-100">
                    {error}
                </div>
            </div>
        );
    }

    if (role === UserRole.PREMIUM_STUDENT) {
        return (
            <PremiumStudentDashboard
                user={user}
                courses={dashboardData?.courses || []}
            />
        );
    }

    if (isStudent) {
        return (
            <StudentDashboard
                user={user}
                token={token}
                approvedCourses={approvedStudentCourses}
                pendingCourses={pendingStudentCourses}
                fetchStudentCards={fetchStudentCards}
            />
        );
    }

    if (isInstructor) {
        const instructorStats = [
            { label: 'My Courses', value: (dashboardData?.courses ?? []).length, icon: BookOpen },
            { label: 'Students', value: (dashboardData?.students ?? []).length, icon: Users },
            { label: 'Pending Requests', value: (dashboardData?.pendingQueue ?? []).length, icon: Clock3 },
        ];
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <InstructorDashboard
                    user={user}
                    courses={dashboardData?.courses ?? []}
                    pendingQueue={dashboardData?.pendingQueue ?? []}
                    stats={instructorStats}
                />
            </div>
        );
    }

    if (isAdmin) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <AdminDashboard
                    dashboardData={dashboardData}
                />
            </div>
        );
    }

    if (isModerator) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <ModeratorDashboard data={dashboardData} onAction={handleModeratorAction} />
            </div>
        );
    }

    if (isAssistant) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <AssistantDashboard data={dashboardData} />
            </div>
        );
    }

    return (
        <div className="flex h-64 items-center justify-center">
            <div className="rounded-xl border border-slate-700 bg-[#112240] px-6 py-4 text-slate-200">
                Unauthorized Role
            </div>
        </div>
    );
};

export default Dashboard;
