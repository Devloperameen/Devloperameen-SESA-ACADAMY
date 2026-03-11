import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    BookOpen, Plus, Trash2, Eye, RefreshCw,
    Clock, CheckCircle2, XCircle, Lock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';

type CourseStatus = 'pending' | 'approved' | 'rejected' | 'locked' | 'hidden';

interface MyCourse {
    _id: string;
    title: string;
    description: string;
    status: CourseStatus;
    isPublished: boolean;
    isHidden: boolean;
    adminComment?: string;
    price: number;
    gradeLevel?: string;
    level?: string;
    lessons?: { _id: string }[];
    createdAt: string;
}

const STATUS_CONFIG: Record<CourseStatus, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; desc: string }> = {
    pending: {
        label: 'Under Review',
        icon: <Clock className="w-4 h-4" />,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        desc: 'Your course is waiting for admin approval.'
    },
    approved: {
        label: 'Published',
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        desc: 'Your course is live and visible to students.'
    },
    rejected: {
        label: 'Rejected',
        icon: <XCircle className="w-4 h-4" />,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        desc: 'The admin has rejected this course submission.'
    },
    locked: {
        label: 'Locked by Admin',
        icon: <Lock className="w-4 h-4" />,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        desc: 'Admin has temporarily locked this course.'
    },
    hidden: {
        label: 'Hidden',
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-slate-400',
        bg: 'bg-slate-700/50',
        border: 'border-slate-600',
        desc: 'This course is currently hidden from students.'
    },
};

const MyCourses: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<MyCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/courses/my/created`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(res.data);
        } catch (err) {
            showError('Failed to load your courses');
        } finally {
            setLoading(false);
        }
    }, [token, API_URL]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleDelete = async (course: MyCourse) => {
        if (!window.confirm(`Are you sure you want to delete "${course.title}"? This cannot be undone.`)) return;
        setDeletingId(course._id);
        try {
            await axios.delete(`${API_URL}/courses/${course._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Course deleted');
            setCourses(prev => prev.filter(c => c._id !== course._id));
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to delete course');
        } finally {
            setDeletingId(null);
        }
    };

    const stats = {
        total: courses.length,
        pending: courses.filter(c => c.status === 'pending').length,
        approved: courses.filter(c => c.status === 'approved').length,
        rejected: courses.filter(c => c.status === 'rejected').length,
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 ring-1 ring-blue-500/30">
                        <BookOpen className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">My Courses</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage your submitted course materials</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/instructor/create-course')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Create New Course
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-white' },
                    { label: 'Pending Review', value: stats.pending, color: 'text-amber-400' },
                    { label: 'Published', value: stats.approved, color: 'text-emerald-400' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-rose-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 text-center">
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Course Cards */}
            {loading ? (
                <div className="text-center py-16 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                    <p>Loading your courses...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-700 rounded-2xl">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <h2 className="text-xl font-bold text-slate-300 mb-2">No courses yet</h2>
                    <p className="text-slate-500 mb-6">Create your first course to get started.</p>
                    <button
                        onClick={() => navigate('/instructor/create-course')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl font-semibold text-sm mx-auto hover:bg-cyan-500 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Course
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {courses.map((course, i) => {
                        const cfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG.pending;
                        const isDeleting = deletingId === course._id;
                        return (
                            <motion.div
                                key={course._id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-600 transition-colors group"
                            >
                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                                        {cfg.icon}
                                        {cfg.label}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {new Date(course.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Title */}
                                <div>
                                    <h3 className="font-black text-white text-lg leading-tight">{course.title}</h3>
                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                                </div>

                                {/* Meta */}
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                    <span className="bg-slate-700/50 px-2 py-0.5 rounded">{course.lessons?.length ?? 0} lessons</span>
                                    <span className="bg-slate-700/50 px-2 py-0.5 rounded">{course.level ?? 'N/A'}</span>
                                    <span className="bg-slate-700/50 px-2 py-0.5 rounded">{course.gradeLevel ?? 'General'}</span>
                                    <span className={`bg-slate-700/50 px-2 py-0.5 rounded font-medium ${course.price > 0 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                        {course.price > 0 ? `$${course.price}` : 'Free'}
                                    </span>
                                </div>

                                {/* Status Explanation */}
                                <div className={`rounded-xl p-3 text-xs ${cfg.bg} ${cfg.border} border`}>
                                    <p className={cfg.color}>{cfg.desc}</p>
                                    {course.adminComment && (
                                        <p className="text-slate-400 mt-1 italic">Admin note: "{course.adminComment}"</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <button className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold">
                                        <Eye className="w-3.5 h-3.5" />
                                        Preview
                                    </button>
                                    {['pending', 'rejected'].includes(course.status) && (
                                        <button
                                            onClick={() => handleDelete(course)}
                                            disabled={isDeleting}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
                                        >
                                            {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyCourses;
