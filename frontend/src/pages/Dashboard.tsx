import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import apiService from '../utils/api';
import { Link } from 'react-router-dom';
import {
    AlertCircle,
    BookOpen,
    Clock3,
    DollarSign,
    Flame,
    Plus,
    Shield,
    Star,
    TrendingUp,
    Users,
    Zap,
    CheckCircle,
    Settings,
    UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import type { StudentCourse } from '../components/dashboard/CourseCard';
import type { Course } from '../types';
import { UserRole } from '../types';

const COLORS = ['#00C49F', '#FFBB28', '#FF8042'];

/* ── Mini animated circular progress ring ── */
const ProgressRing: React.FC<{ percent: number; size?: number; stroke?: number; color?: string }> = ({
    percent, size = 52, stroke = 5, color = '#06b6d4',
}) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />
        </svg>
    );
};

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

    const role = user?.role;
    const isStudent = role === UserRole.STUDENT || role === UserRole.PREMIUM_STUDENT;
    const isInstructor = role === UserRole.INSTRUCTOR || role === UserRole.ASSISTANT_INSTRUCTOR;
    const isAdminLike = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MODERATOR;

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

    if (isStudent) {
        const xp = approvedStudentCourses.length * 250 + pendingStudentCourses.length * 60;
        const level = Math.max(1, Math.ceil(xp / 500));
        const streakDays = Math.max(1, approvedStudentCourses.length);

        return (
            <>
                {/* Student XP / Streak hero strip */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 md:mx-8 mt-6 rounded-2xl bg-gradient-to-r from-[#0d2247] via-[#112f5a] to-[#0d2247] border border-slate-700 p-5 flex flex-wrap gap-5 items-center"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Level</p>
                            <p className="text-xl font-black text-white">Level {level} Learner</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg">
                            <Flame className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Study Streak</p>
                            <p className="text-xl font-black text-white">{streakDays} Day{streakDays !== 1 ? 's' : ''} 🔥</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Total XP</p>
                            <p className="text-xl font-black text-white">{xp.toLocaleString()} XP</p>
                        </div>
                    </div>
                    <div className="ml-auto">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                            <TrendingUp className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-semibold text-cyan-300">{approvedStudentCourses.length} Active Course{approvedStudentCourses.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Course progress rings */}
                {approvedStudentCourses.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mx-4 md:mx-8 mt-5 rounded-2xl border border-slate-700 bg-[#112240] p-5"
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Course Progress</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {approvedStudentCourses.slice(0, 10).map((c, i) => {
                                const ringColor = i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#a855f7' : '#10b981';
                                return (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                                    >
                                        <div className="relative">
                                            <ProgressRing percent={c.progressPercent} color={ringColor} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-black text-white">{c.progressPercent}%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-center font-semibold text-slate-300 leading-tight line-clamp-2">{c.title}</p>
                                        <span className="text-[10px] text-slate-500">{c.completedLessons}/{c.totalLessons} lessons</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                <DashboardLayout
                    token={token}
                    fetchCourses={fetchStudentCards}
                    user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        streakDays,
                        totalXp: xp,
                        levelLabel: `Level ${level} Learner`,
                    }}
                />
            </>
        );
    }

    const courses = dashboardData?.courses ?? [];
    const students = dashboardData?.students ?? [];
    const users = dashboardData?.users ?? [];
    const pendingQueue = dashboardData?.pendingQueue ?? [];
    const revenue = dashboardData?.revenueStats;

    const stats = isInstructor
        ? [
            { label: 'My Courses', value: courses.length, icon: BookOpen },
            { label: 'Students', value: students.length, icon: Users },
            { label: 'Pending Requests', value: pendingQueue.length, icon: Clock3 },
        ]
        : [
            { label: 'Total Users', value: users.length, icon: Users },
            { label: 'Total Courses', value: courses.length, icon: BookOpen },
            { label: 'Pending Approvals', value: pendingQueue.length, icon: AlertCircle },
            { label: 'Revenue', value: `$${(revenue?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign },
        ];

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rounded-2xl border border-slate-700 bg-[#112240] p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    {isAdminLike ? 'Admin Control Center' : 'Instructor Workspace'}
                                </h1>
                                <p className="text-sm text-slate-300">
                                    Real-time dashboard data from MongoDB with role-based access.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {isAdminLike && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-100">
                                        <Shield className="h-3.5 w-3.5" />
                                        {role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Admin'}
                                    </span>
                                )}
                                {(isInstructor || isAdminLike) && (
                                    <Link
                                        to="/instructor/create-course"
                                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/40"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create Course
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions for Admin */}
                {isAdminLike && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Approve Courses', icon: CheckCircle, to: '/admin/approvals', color: 'from-emerald-600 to-teal-600', badge: pendingQueue.length },
                                { label: 'Manage Users', icon: UserCheck, to: '/admin/users', color: 'from-blue-600 to-cyan-600', badge: null },
                                { label: 'View Revenue', icon: DollarSign, to: '/dashboard', color: 'from-amber-500 to-orange-500', badge: null },
                                { label: 'Settings', icon: Settings, to: '/admin/settings', color: 'from-purple-600 to-violet-600', badge: null },
                            ].map((action) => (
                                <Link key={action.label} to={action.to}>
                                    <motion.div
                                        whileHover={{ y: -3, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative rounded-2xl bg-gradient-to-br ${action.color} p-4 flex flex-col items-start gap-2 shadow-lg cursor-pointer`}
                                    >
                                        {action.badge !== null && action.badge > 0 && (
                                            <span className="absolute top-2 right-2 bg-white text-slate-800 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">{action.badge}</span>
                                        )}
                                        <action.icon className="w-6 h-6 text-white/90" />
                                        <span className="text-sm font-bold text-white">{action.label}</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Quick Stats for Instructor */}
                {isInstructor && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'My Courses', value: courses.length, icon: BookOpen, color: 'text-cyan-400' },
                                { label: 'Enrolled Students', value: students.length, icon: Users, color: 'text-emerald-400' },
                                { label: 'Pending Requests', value: pendingQueue.length, icon: Clock3, color: 'text-amber-400' },
                            ].map((s, i) => (
                                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                                    className="rounded-2xl border border-slate-700 bg-[#112240] p-5 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center`}>
                                        <s.icon className={`w-6 h-6 ${s.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">{s.label}</p>
                                        <p className="text-2xl font-black text-white">{s.value}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-2xl border border-slate-700 bg-[#112240] p-5"
                        >
                            <item.icon className="mb-3 h-5 w-5 text-cyan-300" />
                            <p className="text-sm text-slate-300">{item.label}</p>
                            <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-700 bg-[#112240] p-5 lg:col-span-8"
                    >
                        <h2 className="mb-4 text-lg font-semibold text-white">
                            {isInstructor ? 'My Courses' : 'Platform Courses'}
                        </h2>
                        {courses.length === 0 ? (
                            <p className="text-sm text-slate-300">No course records found.</p>
                        ) : (
                            <div className="space-y-3">
                                {courses.slice(0, 10).map((course) => (
                                    <div
                                        key={course._id}
                                        className="rounded-xl border border-slate-700 bg-slate-900/45 p-4"
                                    >
                                        <p className="font-semibold text-white">{course.title}</p>
                                        <p className="mt-1 text-xs text-slate-300">{course.description}</p>
                                        <p className="mt-2 text-xs text-cyan-200">
                                            Instructor: {course.instructor?.name || 'Unknown'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.section>

                    <motion.aside
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 lg:col-span-4"
                    >
                        <div className="rounded-2xl border border-slate-700 bg-[#112240] p-5">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
                                Enrollment Queue
                            </h3>
                            {pendingQueue.length === 0 ? (
                                <p className="text-sm text-slate-300">No pending approvals right now.</p>
                            ) : (
                                <div className="space-y-2">
                                    {pendingQueue.slice(0, 6).map((entry) => (
                                        <div
                                            key={`${entry.courseId}:${entry.student._id}`}
                                            className="rounded-xl border border-slate-700 bg-slate-900/45 p-3"
                                        >
                                            <p className="text-sm font-medium text-white">{entry.student.name}</p>
                                            <p className="text-xs text-slate-300">{entry.courseTitle}</p>
                                        </div>
                                    ))}
                                    {isAdminLike && (
                                        <Link
                                            to="/admin/users"
                                            className="mt-2 inline-flex text-xs font-semibold text-blue-200 hover:text-blue-100"
                                        >
                                            Open full queue
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>


                        {(isAdminLike || isInstructor) && dashboardData?.enrollmentStats ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-2xl border border-slate-700 bg-gradient-to-b from-[#112240] to-slate-900/60 p-5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="20"/>
                                    </svg>
                                </div>
                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300 relative z-10">
                                    Activity & Enrollments
                                </h3>
                                <div className="h-64 w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Approved', value: dashboardData.enrollmentStats.approved || 1 },
                                                    { name: 'Pending', value: dashboardData.enrollmentStats.pending },
                                                    { name: 'Rejected', value: dashboardData.enrollmentStats.rejected }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={90}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                                animationBegin={200}
                                                animationDuration={1500}
                                            >
                                                <Cell fill={COLORS[0]} className="drop-shadow-[0_0_8px_rgba(0,196,159,0.5)]" />
                                                <Cell fill={COLORS[1]} className="drop-shadow-[0_0_8px_rgba(255,187,40,0.5)]" />
                                                <Cell fill={COLORS[2]} className="drop-shadow-[0_0_8px_rgba(255,128,66,0.5)]" />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                                itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-extrabold text-white">
                                                {dashboardData.enrollmentStats.approved + dashboardData.enrollmentStats.pending + dashboardData.enrollmentStats.rejected}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs relative z-10">
                                    <div className="bg-slate-800/50 p-2 rounded-lg border border-[#00C49F]/20">
                                        <p className="font-bold text-[#00C49F] text-lg">{dashboardData.enrollmentStats.approved}</p>
                                        <p className="text-slate-400 font-medium tracking-wide">Approved</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-2 rounded-lg border border-[#FFBB28]/20">
                                        <p className="font-bold text-[#FFBB28] text-lg">{dashboardData.enrollmentStats.pending}</p>
                                        <p className="text-slate-400 font-medium tracking-wide">Pending</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-2 rounded-lg border border-[#FF8042]/20">
                                        <p className="font-bold text-[#FF8042] text-lg">{dashboardData.enrollmentStats.rejected}</p>
                                        <p className="text-slate-400 font-medium tracking-wide">Rejected</p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}

                        {isAdminLike && (
                            <div className="rounded-2xl border border-slate-700 bg-[#112240] p-5">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
                                    Revenue Snapshot
                                </h3>
                                <p className="text-sm text-slate-200">
                                    Total: <span className="font-semibold">${(revenue?.totalRevenue ?? 0).toFixed(2)}</span>
                                </p>
                                <p className="text-sm text-slate-200">
                                    Last 30 days: <span className="font-semibold">${(revenue?.monthlyRevenue ?? 0).toFixed(2)}</span>
                                </p>
                                <p className="text-sm text-slate-200">
                                    Paid enrollments: <span className="font-semibold">{revenue?.totalApprovedEnrollments ?? 0}</span>
                                </p>
                            </div>
                        )}
                    </motion.aside>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
