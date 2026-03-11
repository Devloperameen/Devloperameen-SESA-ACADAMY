import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Lock,
    MessageSquare,
    PlayCircle,
    Send,
    ShieldCheck,
    Trash2,
    Unlock,
    Video,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CourseReviews from './CourseReviews';
import { UserRole } from '../../types';
import { showError, showSuccess } from '../../utils/toast';
import { cn } from '../../utils/cn';

interface Lesson {
    title: string;
    videoUrl: string;
    order: number;
    _id: string;
}

interface CoursePreview {
    _id: string;
    title: string;
    description: string;
    youtubeVideoId?: string;
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    resourceUrl?: string;
    lessons?: Lesson[];
    gradeLevel?: string;
    instructor?: {
        _id: string;
        name: string;
    };
}

interface MyEnrollmentCourse {
    _id: string;
    enrollmentStatus: 'pending' | 'approved' | 'rejected' | 'unknown';
    previewVideoUrl?: string;
    resourceUrl?: string;
    lessons?: Lesson[];
    youtubeVideoId?: string;
}

interface LibraryCourse extends CoursePreview {
    hasFullAccess: boolean;
    enrollmentStatus: 'pending' | 'approved' | 'rejected' | 'unknown';
    freeVideosLimit: number;
}

interface CourseComment {
    _id: string;
    userId: string;
    userName: string;
    userRole: 'student' | 'instructor' | 'admin';
    text: string;
    createdAt: string;
}

const extractVideoId = (url?: string): string | null => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match?.[1] ?? null;
};

const toEmbedUrl = (
    course: Pick<LibraryCourse, 'youtubeVideoId' | 'resourceUrl' | 'previewVideoUrl' | 'lessons' | 'hasFullAccess'>,
    lessonIndex: number = 0
): string | null => {
    // Determine the source URL based on access and availability
    // If not full access, fallback to preview/resource.
    // If full access, default to the specified lesson index if it exists, otherwise preview.
    const lessonUrl = course.lessons?.[lessonIndex]?.videoUrl;
    const previewUrl = course.previewVideoUrl || course.resourceUrl;
    
    // Always prioritize the specific lesson if they have access
    const sourceUrl = course.hasFullAccess && lessonUrl ? lessonUrl : (lessonUrl || previewUrl);

    if (!sourceUrl && course.youtubeVideoId) {
        return `https://www.youtube.com/embed/${course.youtubeVideoId}`;
    }

    const parsed = extractVideoId(sourceUrl);
    if (parsed) {
        return `https://www.youtube.com/embed/${parsed}`;
    }

    return null;
};

const BrowseCourses: React.FC = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const [courses, setCourses] = useState<LibraryCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [watchedPartOne, setWatchedPartOne] = useState<Record<string, boolean>>({});

    const [comments, setComments] = useState<CourseComment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    const selectedCourse = useMemo(
        () => courses.find((course) => course._id === selectedCourseId) ?? null,
        [courses, selectedCourseId]
    );

    const isModerator =
        user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.INSTRUCTOR;
    const canViewDiscussion = Boolean(user && (isModerator || selectedCourse?.hasFullAccess));

    const [selectedGrade, setSelectedGrade] = useState<string>('All Grades');

    useEffect(() => {
        if (user && !isModerator && user.role !== UserRole.PREMIUM_STUDENT) {
            setSelectedGrade('Grade 9');
        } else {
            setSelectedGrade('All Grades');
        }
    }, [user, isModerator]);

    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            if (selectedGrade === 'All Grades') return true;
            return c.gradeLevel === selectedGrade;
        });
    }, [courses, selectedGrade]);

    const fetchLibrary = async (): Promise<void> => {
        try {
            setIsLoading(true);

            const previewResponse = await axios.get<CoursePreview[]>(`${API_URL}/courses`);
            const previewCourses = previewResponse.data ?? [];

            const enrollmentMap = new Map<string, MyEnrollmentCourse>();
            if (token) {
                const mineResponse = await axios.get<MyEnrollmentCourse[]>(`${API_URL}/courses/my/enrolled`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                (mineResponse.data ?? []).forEach((entry) => {
                    enrollmentMap.set(entry._id, entry);
                });
            }

            const normalized = previewCourses.map((course) => {
                const mine = enrollmentMap.get(course._id);
                const enrollmentStatus = mine?.enrollmentStatus ?? 'unknown';

                // Determine free video limit: Standardized to 1 (Part 1 is always free)
                const freeVideosLimit = 1;

                return {
                    ...course,
                    previewVideoUrl: mine?.previewVideoUrl ?? course.previewVideoUrl ?? course.resourceUrl,
                    resourceUrl: mine?.resourceUrl ?? course.resourceUrl,
                    youtubeVideoId: mine?.youtubeVideoId ?? course.youtubeVideoId,
                    lessons: mine?.lessons ?? course.lessons ?? [],
                    gradeLevel: course.gradeLevel || 'General',
                    hasFullAccess: enrollmentStatus === 'approved',
                    enrollmentStatus,
                    freeVideosLimit
                } as LibraryCourse;
            });

            setCourses(normalized);
            if (!selectedCourseId && normalized.length > 0) {
                setSelectedCourseId(normalized[0]._id);
            }
        } catch (error) {
            console.error(error);
            showError('Failed to load course library');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchComments = async (courseId: string): Promise<void> => {
        if (!token || !canViewDiscussion) {
            setComments([]);
            return;
        }

        try {
            setIsCommentsLoading(true);
            const response = await axios.get<CourseComment[]>(`${API_URL}/courses/${courseId}/comments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setComments(response.data ?? []);
        } catch (error: any) {
            if (error?.response?.status !== 403) {
                showError('Failed to load discussion');
            }
            setComments([]);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const fetchCourseDetail = async (courseId: string): Promise<void> => {
        if (!token) return;

        try {
            const response = await axios.get<Partial<CoursePreview>>(`${API_URL}/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const detail = response.data;
            setCourses((prev) =>
                prev.map((course) => {
                    if (course._id !== courseId) return course;

                    return {
                        ...course,
                        resourceUrl: detail.resourceUrl ?? course.resourceUrl,
                        previewVideoUrl: detail.previewVideoUrl ?? course.previewVideoUrl ?? detail.resourceUrl ?? course.resourceUrl,
                        youtubeVideoId: detail.youtubeVideoId ?? course.youtubeVideoId,
                        lessons: Array.isArray(detail.lessons)
                            ? detail.lessons
                            : course.lessons ?? [],
                    };
                })
            );
        } catch (_error) {
            // Keep existing preview data if detail fetch fails.
        }
    };

    useEffect(() => {
        fetchLibrary();
    }, [token]);

    useEffect(() => {
        if (selectedCourse?._id) {
            fetchComments(selectedCourse._id);
        }
    }, [selectedCourse?._id, token, canViewDiscussion]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchCourseDetail(selectedCourseId);
        }
    }, [selectedCourseId, token]);

    // Track total watch time
    useEffect(() => {
        if (!selectedCourseId || !token || !selectedCourse?.hasFullAccess) return;

        const interval = setInterval(async () => {
            try {
                await axios.post(
                    `${API_URL}/progress/update`,
                    { courseId: selectedCourseId, minutesWatched: 1 },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                console.error('Failed to update watch progress', err);
            }
        }, 60000); // Every 1 minute

        return () => clearInterval(interval);
    }, [selectedCourseId, token, selectedCourse?.hasFullAccess]);

    const markPartOneWatched = (courseId: string): void => {
        setWatchedPartOne((prev) => ({ ...prev, [courseId]: true }));
        setSelectedCourseId(courseId);
        showSuccess('Great! Parts 1 & 2 are now unlocked for free preview.');
    };

    const requestEnrollment = async (course: LibraryCourse): Promise<void> => {
        if (!token) {
            showError('Please login to enroll in this course');
            navigate('/login');
            return;
        }

        // Navigate to payment page directly
        navigate(`/payment?courseId=${course._id}`);
    };

    const submitComment = async (): Promise<void> => {
        if (!token || !selectedCourse) {
            showError('Please login first');
            return;
        }

        const text = commentText.trim();
        if (!text) {
            showError('Comment cannot be empty');
            return;
        }

        try {
            setIsPostingComment(true);
            await axios.post(
                `${API_URL}/courses/${selectedCourse._id}/comments`,
                { text },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCommentText('');
            await fetchComments(selectedCourse._id);
            showSuccess('Comment posted');
        } catch (error: any) {
            showError(error?.response?.data?.message || 'Failed to post comment');
        } finally {
            setIsPostingComment(false);
        }
    };

    const deleteComment = async (commentId: string): Promise<void> => {
        if (!token || !selectedCourse) return;

        try {
            await axios.delete(`${API_URL}/courses/${selectedCourse._id}/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setComments((prev) => prev.filter((comment) => comment._id !== commentId));
            showSuccess('Comment removed');
        } catch (error: any) {
            showError(error?.response?.data?.message || 'Failed to delete comment');
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#112240] px-3 py-2 text-sm text-slate-200 hover:border-blue-400/50 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>

                    <div className="rounded-2xl border border-slate-700 bg-[#112240] p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Student Course Library</h1>
                                <p className="text-sm text-slate-300">
                                    Full access unlocks after approval. Start with Parts 1 & 2 free preview and request enrollment.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-slate-300">Grade Level:</label>
                                <select
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
                                >
                                    {(isModerator || user?.role === UserRole.PREMIUM_STUDENT || user?.role === UserRole.ADMIN) && (
                                        <option value="All Grades">All Grades</option>
                                    )}
                                    <option value="General">General / Open</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                    <option value="Grade 12">Grade 12</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 lg:col-span-7"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            {isLoading ? (
                                <p className="md:col-span-2 rounded-xl border border-slate-700 bg-[#112240] px-4 py-8 text-center text-slate-300">
                                    Loading courses...
                                </p>
                            ) : filteredCourses.length === 0 ? (
                                <p className="md:col-span-2 rounded-xl border border-slate-700 bg-[#112240] px-4 py-8 text-center text-slate-300">
                                    No courses found for the selected grade.
                                </p>
                            ) : (
                                filteredCourses.map((course, index) => {
                                    const isSelected = selectedCourseId === course._id;
                                    const isLocked = !course.hasFullAccess;

                                    return (
                                        <motion.article
                                            key={course._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className={`relative overflow-hidden rounded-2xl border p-4 ${isSelected
                                                    ? 'border-blue-400/60 bg-[#112240]'
                                                    : 'border-slate-700 bg-[#112240]/85 hover:border-slate-500'
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedCourseId(course._id);
                                                    setSelectedLessonIndex(0);
                                                }}
                                                className="w-full text-left"
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="font-semibold text-white">{course.title}</h3>
                                                        <p className="mt-1 line-clamp-2 text-xs text-slate-300">{course.description}</p>
                                                    </div>
                                                    {course.hasFullAccess ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-200">
                                                            <Unlock className="h-3.5 w-3.5" />
                                                            Full Access
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[11px] text-amber-200">
                                                            <Lock className="h-3.5 w-3.5" />
                                                            Locked
                                                        </span>
                                                    )}
                                                </div>
                                            </button>

                                            {course.enrollmentStatus === 'pending' && (
                                                <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-500/15 px-2 py-1 text-[11px] text-blue-100">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    Awaiting Approval
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => {
                                                        markPartOneWatched(course._id);
                                                        setSelectedLessonIndex(0);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-100 hover:border-blue-400/50"
                                                >
                                                    <PlayCircle className="h-3.5 w-3.5" />
                                                    Watch First {course.freeVideosLimit} Part(s)
                                                </button>

                                                {isLocked && (
                                                    <button
                                                        onClick={() => requestEnrollment(course)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/20 px-2.5 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-500/30 disabled:opacity-60"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Pay & Enroll
                                                    </button>
                                                )}
                                            </div>
                                        </motion.article>
                                    );
                                })
                            )}
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 lg:col-span-5"
                    >
                        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#112240]">
                            <div className="border-b border-slate-700 px-4 py-3">
                                <h2 className="inline-flex items-center gap-2 font-semibold text-white">
                                    <Video className="h-4 w-4 text-blue-300" />
                                    Course View
                                </h2>
                            </div>

                            <div className="p-4">
                                {!selectedCourse ? (
                                    <p className="text-sm text-slate-300">Select a course to start learning.</p>
                                ) : (
                                    <>
                                        <h3 className="mb-2 font-semibold text-white">{selectedCourse.title}</h3>
                                        <p className="mb-3 text-xs text-slate-300">{selectedCourse.description}</p>

                                        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
                                            {toEmbedUrl(selectedCourse, selectedLessonIndex) ? (
                                                <iframe
                                                    className="h-56 w-full"
                                                    src={toEmbedUrl(selectedCourse, selectedLessonIndex)!}
                                                    title={selectedCourse.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div className="flex h-56 items-center justify-center text-sm text-slate-300">
                                                    Video preview unavailable
                                                </div>
                                            )}

                                            {!selectedCourse.hasFullAccess && !watchedPartOne[selectedCourse._id] && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-md"
                                                >
                                                    <Lock className="h-10 w-10 text-cyan-400 mb-2" />
                                                    <p className="text-xl font-bold text-white tracking-wide">Course Locked</p>
                                                    <p className="px-6 text-center text-sm text-slate-300 max-w-md mt-1">
                                                        Click below to instantly unlock and watch the first {selectedCourse.freeVideosLimit} lesson(s) for free, then enroll to proceed with the rest of the course!
                                                    </p>
                                                    <button 
                                                        onClick={() => markPartOneWatched(selectedCourse._id)}
                                                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all"
                                                    >
                                                        <PlayCircle className="h-5 w-5" />
                                                        Watch First {selectedCourse.freeVideosLimit} Part(s) for Free
                                                    </button>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
                                                Curriculum
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                {(!selectedCourse.lessons || selectedCourse.lessons.length === 0) ? (
                                                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/25 px-4 py-8 text-center text-slate-400">
                                                        <Clock3 className="mx-auto h-8 w-8 mb-3 opacity-20" />
                                                        No lessons available for this course yet.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {selectedCourse.lessons.map((lesson, index) => {
                                                            const isFreePreview = index < selectedCourse.freeVideosLimit;
                                                            const isUnlocked = selectedCourse.hasFullAccess || isFreePreview;
                                                            const isSelected = selectedLessonIndex === index;

                                                            return (
                                                                <button
                                                                    key={lesson._id || `lesson-${index}`}
                                                                    onClick={() => {
                                                                        if (isUnlocked) {
                                                                            setSelectedLessonIndex(index);
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        'group w-full flex items-center justify-between text-left rounded-2xl border px-4 py-4 transition-all duration-300',
                                                                        isSelected 
                                                                            ? 'border-blue-400/50 bg-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-400/20' 
                                                                            : isUnlocked
                                                                                ? 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-500'
                                                                                : 'border-slate-800/50 bg-slate-900/40 opacity-60 cursor-not-allowed'
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={cn(
                                                                            'flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black transition-all duration-300',
                                                                            isSelected 
                                                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                                                                : isUnlocked 
                                                                                    ? 'bg-slate-700 text-slate-300 group-hover:bg-slate-600 group-hover:text-white' 
                                                                                    : 'bg-slate-800 text-slate-600'
                                                                        )}>
                                                                            {String(index + 1).padStart(2, '0')}
                                                                        </div>
                                                                        <div>
                                                                            <span className={cn(
                                                                                'font-bold block transition-colors',
                                                                                isSelected ? 'text-white' : isUnlocked ? 'text-slate-200' : 'text-slate-500'
                                                                            )}>{lesson.title}</span>
                                                                            {isFreePreview && !selectedCourse.hasFullAccess && (
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">🎁 Free Part</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="shrink-0 flex items-center gap-3">
                                                                        {isUnlocked ? (
                                                                            <PlayCircle className={cn(
                                                                                'w-5 h-5 transition-transform duration-300 group-hover:scale-110',
                                                                                isSelected ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-300'
                                                                            )} />
                                                                        ) : (
                                                                            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                                                                                <Lock className="w-3.5 h-3.5 text-slate-600" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {!selectedCourse.hasFullAccess && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        className="mt-6 p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm"
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                                                <Lock className="w-5 h-5 text-amber-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-amber-200 mb-1">
                                                                    {selectedCourse.enrollmentStatus === 'pending'
                                                                        ? 'Approval Pending'
                                                                        : 'Unlock All Lessons'}
                                                                </p>
                                                                <p className="text-xs text-amber-100/70 leading-relaxed">
                                                                    {selectedCourse.enrollmentStatus === 'pending'
                                                                        ? 'Your payment record is being verified. You will get full access soon!'
                                                                        : `Enjoy Part 1 for free! Enroll now to unlock ${selectedCourse.lessons?.length ? selectedCourse.lessons.length - 1 : 'the remaining'} expert-led sessions.`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-700 bg-[#112240] p-4">
                            <h2 className="mb-3 inline-flex items-center gap-2 font-semibold text-white">
                                <MessageSquare className="h-4 w-4 text-blue-300" />
                                Student-Teacher Discussion
                            </h2>

                            {!selectedCourse ? (
                                <p className="text-sm text-slate-300">Select a course to open discussion.</p>
                            ) : !canViewDiscussion ? (
                                <p className="text-sm text-slate-300">
                                    Discussion unlocks after enrollment approval.
                                </p>
                            ) : (
                                <>
                                    <div className="mb-3 flex gap-2">
                                        <input
                                            value={commentText}
                                            onChange={(event) => setCommentText(event.target.value)}
                                            placeholder="Ask a question or share your idea..."
                                            className="flex-1 rounded-xl border border-slate-600 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                                        />
                                        <button
                                            onClick={submitComment}
                                            disabled={isPostingComment}
                                            className="inline-flex items-center gap-1 rounded-xl border border-blue-500/40 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-500/30 disabled:opacity-60"
                                        >
                                            <Send className="h-4 w-4" />
                                            Send
                                        </button>
                                    </div>

                                    <div className="max-h-64 space-y-2 overflow-y-auto">
                                        {isCommentsLoading ? (
                                            <p className="text-sm text-slate-300">Loading discussion...</p>
                                        ) : comments.length === 0 ? (
                                            <p className="text-sm text-slate-300">No comments yet.</p>
                                        ) : (
                                            comments.map((comment) => {
                                                const isTeacherReply = comment.userRole === 'instructor';
                                                return (
                                                    <motion.div
                                                        key={comment._id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="rounded-xl border border-slate-700 bg-slate-900/40 p-3"
                                                    >
                                                        <div className="mb-1 flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-white">{comment.userName}</span>
                                                                {isTeacherReply && (
                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-100">
                                                                        <ShieldCheck className="h-3 w-3" />
                                                                        Verified Teacher
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] text-slate-400">
                                                                {new Date(comment.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm text-slate-200">{comment.text}</p>

                                                        {isModerator && (
                                                            <div className="mt-2 text-right">
                                                                <button
                                                                    onClick={() => deleteComment(comment._id)}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-xs text-rose-100 hover:bg-rose-500/25"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        {selectedCourse && (
                            <CourseReviews
                                courseId={selectedCourse._id}
                                hasFullAccess={selectedCourse.hasFullAccess}
                                isInstructorOrAdmin={isModerator}
                                apiUrl={API_URL}
                            />
                        )}
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default BrowseCourses;
