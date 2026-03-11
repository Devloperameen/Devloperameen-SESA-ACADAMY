import React, { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
    Activity,
    BookOpen,
    CheckCircle2,
    Flame,
    Plus,
    Search,
    Sparkles,
    Trophy,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import {
    Avatar,
    Badge,
    Button,
    Card,
    CourseCard,
    CourseCardSkeleton,
    type StudentCourse,
} from './CourseCard';

const dashboardQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const containerVariants: Variants = {
    hidden: { opacity: 1 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

interface ApiCourseResponse {
    _id: string;
    title: string;
    description?: string;
    instructor?: { name?: string } | string;
    enrollmentStatus?: 'pending' | 'approved';
    totalLessons?: number;
    completedLessons?: number;
}

export interface DashboardUser {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    streakDays: number;
    totalXp: number;
    levelLabel: string;
}

export interface ActivityFeedItem {
    id: string;
    studentName: string;
    courseTitle: string;
    minutesAgo: number;
    avatarUrl?: string;
}

export interface DashboardLayoutProps {
    token?: string | null;
    user?: DashboardUser | null;
    fetchCourses?: (token?: string) => Promise<StudentCourse[]>;
    onOpenCourse?: (course: StudentCourse) => void;
    activityFeed?: ActivityFeedItem[];
    className?: string;
}

const defaultUser: DashboardUser = {
    id: 'guest-student',
    name: 'Student Explorer',
    email: 'student@sesa.academy',
    streakDays: 12,
    totalXp: 1840,
    levelLabel: 'Level 7 Scholar',
};

const hashProgress = (seed: string, enrollmentStatus?: 'pending' | 'approved'): number => {
    const hash = seed.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    if (enrollmentStatus === 'pending') {
        return 10 + (hash % 25);
    }
    return 35 + (hash % 66);
};

const normalizeCourse = (course: ApiCourseResponse, index: number): StudentCourse => {
    const inferredProgress = hashProgress(course._id ?? `${index}`, course.enrollmentStatus);
    const progressPercent = Math.min(100, Math.max(0, Math.round(inferredProgress)));
    const totalLessons = course.totalLessons ?? 14;
    const completedLessons =
        course.completedLessons ?? Math.min(totalLessons, Math.round((progressPercent / 100) * totalLessons));

    const instructorName =
        typeof course.instructor === 'string'
            ? course.instructor
            : course.instructor?.name ?? 'SESA Mentor Team';

    const difficulty: StudentCourse['difficulty'] =
        progressPercent > 75 ? 'Advanced' : progressPercent > 45 ? 'Intermediate' : 'Beginner';

    return {
        id: course._id,
        title: course.title,
        summary: course.description ?? 'Continue your premium learning sprint with smart checkpoints.',
        instructor: instructorName,
        progressPercent,
        totalLessons,
        completedLessons,
        durationLabel: progressPercent >= 100 ? 'Completed' : `${Math.max(1, totalLessons - completedLessons)} lessons left`,
        difficulty,
        isLive: index === 0,
        lastOpenedLabel: progressPercent >= 100 ? 'Completed this week' : 'Last opened recently',
        enrollmentStatus: course.enrollmentStatus,
    };
};

const fetchStudentCourses = async (token?: string): Promise<StudentCourse[]> => {
    if (!token) {
        return [];
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await axios.get<ApiCourseResponse[]>(`${API_URL}/courses/my/enrolled`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!Array.isArray(response.data) || response.data.length === 0) {
        return [];
    }

    return response.data.map(normalizeCourse);
};

const fetchDiscoverCourses = async (token?: string): Promise<StudentCourse[]> => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await axios.get<ApiCourseResponse[]>(`${API_URL}/courses`);
    
    // Filter out courses the student is already enrolled in
    let enrolledIds: string[] = [];
    if (token) {
        const enrolledResponse = await axios.get<ApiCourseResponse[]>(`${API_URL}/courses/my/enrolled`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        enrolledIds = enrolledResponse.data.map(c => c._id);
    }

    return (response.data ?? [])
        .filter(c => !enrolledIds.includes(c._id))
        .slice(0, 4)
        .map((c, i) => normalizeCourse(c, i));
};

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandPalettePlaceholder: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="mx-auto mt-24 w-[92%] max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-[0_24px_70px_rgba(8,47,73,0.7)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3">
                            <Search className="h-4 w-4 text-cyan-300" />
                            <input
                                autoFocus
                                readOnly
                                placeholder="Search courses, lessons, quick actions..."
                                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                            />
                            <kbd className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-300">
                                ESC
                            </kbd>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            Command palette placeholder: wire keyboard actions and route shortcuts for the final sprint.
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const DashboardLayoutContent: React.FC<DashboardLayoutProps> = ({
    token,
    user,
    fetchCourses,
    onOpenCourse,
    activityFeed,
    className,
}) => {
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<StudentCourse | null>(null);
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);

    const safeUser = user ?? defaultUser;
    const liveFeed = activityFeed ?? [];

    const coursesQuery = useQuery({
        queryKey: ['student-dashboard-courses', token ?? 'guest'],
        queryFn: () => (fetchCourses ? fetchCourses(token ?? undefined) : fetchStudentCourses(token ?? undefined)),
    });

    const discoverQuery = useQuery({
        queryKey: ['student-discover-courses', token ?? 'guest'],
        queryFn: () => fetchDiscoverCourses(token ?? undefined),
    });

    const courses = coursesQuery.data ?? [];
    const discoverCourses = discoverQuery.data ?? [];

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const commandPressed = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
            if (commandPressed) {
                event.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
            if (event.key === 'Escape') {
                setCommandPaletteOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (courses.length > 0 && !selectedCourse) {
            setSelectedCourse(courses[0]);
        }
    }, [courses, selectedCourse]);

    useEffect(() => {
        if (!completionMessage) return undefined;

        const timer = window.setTimeout(() => {
            setCompletionMessage(null);
        }, 2400);

        return () => window.clearTimeout(timer);
    }, [completionMessage]);

    const completionCount = useMemo(
        () => courses.filter((course) => Math.round(course.progressPercent) >= 100).length,
        [courses]
    );


    const handleCourseOpen = (course: StudentCourse): void => {
        setSelectedCourse(course);
        onOpenCourse?.(course);
    };

    return (
        <div className={cn('text-slate-100', className)}>
            <motion.main
                className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12 lg:px-8"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <motion.section className="space-y-6 lg:col-span-8" variants={itemVariants}>
                    <Card className="p-0 overflow-hidden border-none bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-2xl relative">
                        {/* Abstract background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
                        
                        <motion.div className="p-6 sm:p-8 space-y-8 relative z-10" variants={containerVariants} initial="hidden" animate="show">
                            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white italic">
                                        Hello, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{safeUser.name.split(' ')[0]}</span>
                                    </h1>
                                    <p className="mt-2 text-slate-400 font-medium max-w-md">
                                        Your learning momentum is high! Ready to tackle today's milestones?
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Rank</p>
                                        <p className="text-sm font-bold text-white">#42nd Scholar</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
                                        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-900">
                                            <Trophy className="h-6 w-6 text-cyan-400" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* XP Stat */}
                                <div className="group relative rounded-3xl border border-white/5 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <Badge variant="default" className="bg-blue-500/10 text-blue-300 border-none">+12%</Badge>
                                        </div>
                                        <p className="text-3xl font-black text-white">{safeUser.totalXp.toLocaleString()}</p>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Total Experience</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Activity className="w-16 h-16" />
                                    </div>
                                </div>

                                {/* Streak Stat */}
                                <div className="group relative rounded-3xl border border-white/5 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
                                                <Flame className="w-5 h-5" />
                                            </div>
                                            <div className="flex -space-x-1.5">
                                                {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-[#1e293b] bg-slate-700" />)}
                                            </div>
                                        </div>
                                        <p className="text-3xl font-black text-white">{safeUser.streakDays}</p>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Active Streak</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Flame className="w-16 h-16" />
                                    </div>
                                </div>

                                {/* Completion Stat */}
                                <div className="group relative rounded-3xl border border-white/5 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-400/80 uppercase">Verified</span>
                                        </div>
                                        <p className="text-3xl font-black text-white">{completionCount}</p>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Certificates</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Trophy className="w-16 h-16" />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </Card>

                    <AnimatePresence>
                        {discoverCourses.length > 0 && (
                            <motion.section 
                                variants={itemVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-6 pt-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-500/20 p-2 rounded-xl ring-1 ring-purple-500/30">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white leading-none">Discover New</h2>
                                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Recommended for you</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => window.location.href = '/student/browse'} className="text-purple-400">
                                        Explore All
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {discoverCourses.map((course, index) => (
                                        <motion.div key={course.id} variants={itemVariants}>
                                            <CourseCard 
                                                course={course} 
                                                index={index}
                                                onOpen={(c) => window.location.href = `/student/browse?id=${c.id}`} 
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants} className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-xl ring-1 ring-blue-500/30">
                                <BookOpen className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white leading-none">Your Courses</h2>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Ongoing curriculum</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => window.location.href = '/student/browse'}>
                            Browse More
                        </Button>
                    </motion.div>

                    {coursesQuery.isPending ? (
                        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <motion.div key={`skeleton-${index}`} variants={itemVariants}>
                                    <CourseCardSkeleton />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : coursesQuery.isError ? (
                        <motion.div variants={itemVariants}>
                            <Card className="p-5">
                                <p className="text-sm text-rose-300">
                                    Could not load courses right now. Retry from your command palette or refresh.
                                </p>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" variants={containerVariants}>
                            {courses.map((course, index) => (
                                <motion.div key={course.id} variants={itemVariants}>
                                    <CourseCard
                                        course={course}
                                        index={index}
                                        onOpen={handleCourseOpen}
                                        onCompleted={(completedCourse) => {
                                            setCompletionMessage(`${completedCourse.title} completed!`);
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </motion.section>

                <motion.aside className="space-y-6 lg:col-span-4" variants={itemVariants}>
                    <Card className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">Course View</h3>
                            <Badge variant="accent">Focus Mode</Badge>
                        </div>

                        {selectedCourse ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-lg font-bold text-slate-100">{selectedCourse.title}</p>
                                    <p className="mt-1 text-sm text-slate-400">{selectedCourse.summary}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span>Completion</span>
                                        <span className="font-semibold text-cyan-300">
                                            {Math.round(selectedCourse.progressPercent)}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-slate-800/90">
                                        <motion.div
                                            className={cn(
                                                'h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500',
                                                Math.round(selectedCourse.progressPercent) >= 100 &&
                                                    'shadow-[0_0_18px_rgba(34,211,238,0.95)]'
                                            )}
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: `${Math.round(selectedCourse.progressPercent)}%`, opacity: 1 }}
                                            transition={{ duration: 0.65, ease: 'easeInOut' }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    leftIcon={<BookOpen className="h-4 w-4" />}
                                    onClick={() => handleCourseOpen(selectedCourse)}
                                >
                                    Continue Learning
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Select a course to view details.</p>
                        )}
                    </Card>

                    <Card className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">Live Activity</h3>
                            <Badge variant="success">Now</Badge>
                        </div>

                        <p className="mb-4 text-sm text-slate-400">Other students are studying right now...</p>

                        {liveFeed.length === 0 ? (
                            <p className="text-sm text-slate-400">No live activity updates yet.</p>
                        ) : (
                            <motion.ul className="space-y-3" variants={containerVariants} initial="hidden" animate="show">
                                {liveFeed.map((item) => (
                                    <motion.li
                                        key={item.id}
                                        variants={itemVariants}
                                        className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/45 p-3"
                                    >
                                        <Avatar name={item.studentName} imageUrl={item.avatarUrl} className="h-9 w-9" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-200">{item.studentName}</p>
                                            <p className="truncate text-xs text-slate-400">Studying {item.courseTitle}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-cyan-300">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                                            {item.minutesAgo}m
                                        </div>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        )}
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-2 text-cyan-300">
                            <Activity className="h-4 w-4" />
                            <p className="text-sm font-semibold">Performance Tip</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-300">
                            Use quick navigation with CMD+K to jump into lessons instantly and keep your momentum high.
                        </p>
                    </Card>
                </motion.aside>
            </motion.main>

            <CommandPalettePlaceholder isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

            <AnimatePresence>
                {completionMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Card className="flex items-center gap-3 border-emerald-400/40 bg-slate-900/95 px-4 py-3">
                            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
                                <Trophy className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-100">Course Milestone</p>
                                <p className="text-xs text-slate-300">{completionMessage}</p>
                            </div>
                            <Sparkles className="h-4 w-4 text-cyan-300" />
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
    return (
        <QueryClientProvider client={dashboardQueryClient}>
            <DashboardLayoutContent {...props} />
        </QueryClientProvider>
    );
};

export default DashboardLayout;
