import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, CheckCircle, XCircle, Lock, Eye, EyeOff,
    Unlock, Trash2, Filter, RefreshCw, AlertTriangle,
    Search, ChevronDown, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/toast';

type CourseStatus = 'pending' | 'approved' | 'rejected' | 'locked' | 'hidden';

interface AdminCourse {
    _id: string;
    title: string;
    description: string;
    status: CourseStatus;
    isPublished: boolean;
    isHidden: boolean;
    price: number;
    gradeLevel?: string;
    level?: string;
    lockedAt?: string;
    adminComment?: string;
    createdAt: string;
    instructor?: { _id: string; name: string; email: string };
    category?: { name: string };
}

interface ConfirmModal {
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'success';
    onConfirm: () => void;
    withComment?: boolean;
    commentPlaceholder?: string;
}

const STATUS_META: Record<CourseStatus | string, { label: string; color: string; bg: string; border: string }> = {
    pending:  { label: 'Pending Review', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    approved: { label: 'Approved',       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    rejected: { label: 'Rejected',       color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
    locked:   { label: 'Locked',         color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
    hidden:   { label: 'Hidden',         color: 'text-slate-400',   bg: 'bg-slate-700/50',   border: 'border-slate-600' },
};

const AdminCourses: React.FC = () => {
    const { token } = useAuth();
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [modal, setModal] = useState<ConfirmModal>({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });
    const [modalComment, setModalComment] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/admin/courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(res.data);
        } catch (err) {
            showError('Failed to load courses');
        } finally {
            setLoading(false);
        }
    }, [token, API_URL]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const runAction = async (courseId: string, fn: () => Promise<void>) => {
        setActionLoading(courseId);
        try {
            await fn();
            await fetchCourses();
        } finally {
            setActionLoading(null);
        }
    };

    const openConfirm = (config: Omit<ConfirmModal, 'open'>) => {
        setModalComment('');
        setModal({ ...config, open: true });
    };

    const closeModal = () => setModal(m => ({ ...m, open: false }));

    const handleApprove = (course: AdminCourse) => {
        openConfirm({
            title: 'Approve Course',
            message: `Approve "${course.title}"? It will become visible to students.`,
            variant: 'success',
            onConfirm: () => runAction(course._id, async () => {
                await axios.patch(`${API_URL}/courses/${course._id}/status`, { status: 'approved' }, { headers: { Authorization: `Bearer ${token}` } });
                showSuccess('Course approved and published!');
                closeModal();
            })
        });
    };

    const handleReject = (course: AdminCourse) => {
        openConfirm({
            title: 'Reject Course',
            message: `Reject "${course.title}"? The instructor will not be able to publish it.`,
            variant: 'danger',
            withComment: true,
            commentPlaceholder: 'Reason for rejection (required)',
            onConfirm: () => {
                if (!modalComment.trim()) { showError('Please provide a rejection reason'); return; }
                runAction(course._id, async () => {
                    await axios.patch(`${API_URL}/courses/${course._id}/status`, { status: 'rejected', adminComment: modalComment }, { headers: { Authorization: `Bearer ${token}` } });
                    showSuccess('Course rejected');
                    closeModal();
                });
            }
        });
    };

    const handleLock = (course: AdminCourse) => {
        openConfirm({
            title: 'Lock Course',
            message: `Lock "${course.title}"? Enrolled students will lose access until unlocked.`,
            variant: 'warning',
            withComment: true,
            commentPlaceholder: 'Reason for locking (optional)',
            onConfirm: () => runAction(course._id, async () => {
                await axios.patch(`${API_URL}/admin/courses/${course._id}/lock`, {}, { headers: { Authorization: `Bearer ${token}` } });
                if (modalComment.trim()) {
                    await axios.patch(`${API_URL}/courses/${course._id}/status`, { status: 'locked', adminComment: modalComment }, { headers: { Authorization: `Bearer ${token}` } });
                }
                showSuccess('Course locked');
                closeModal();
            })
        });
    };

    const handleUnlock = (course: AdminCourse) => {
        openConfirm({
            title: 'Unlock Course',
            message: `Unlock "${course.title}"? Access will be restored to enrolled students.`,
            variant: 'success',
            onConfirm: () => runAction(course._id, async () => {
                await axios.patch(`${API_URL}/admin/courses/${course._id}/unlock`, {}, { headers: { Authorization: `Bearer ${token}` } });
                showSuccess('Course unlocked');
                closeModal();
            })
        });
    };

    const handleHide = (course: AdminCourse) => {
        openConfirm({
            title: course.isHidden ? 'Show Course' : 'Hide Course',
            message: course.isHidden
                ? `Make "${course.title}" visible to students in the browse catalog.`
                : `Hide "${course.title}" from the student browse catalog.`,
            variant: 'warning',
            onConfirm: () => runAction(course._id, async () => {
                const endpoint = course.isHidden ? 'show' : 'hide';
                await axios.patch(`${API_URL}/admin/courses/${course._id}/${endpoint}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                showSuccess(course.isHidden ? 'Course is now visible' : 'Course hidden from students');
                closeModal();
            })
        });
    };

    const handleDelete = (course: AdminCourse) => {
        openConfirm({
            title: 'Delete Course Permanently',
            message: `This will permanently delete "${course.title}" and all its data. This cannot be undone.`,
            variant: 'danger',
            withComment: true,
            commentPlaceholder: 'Type DELETE to confirm',
            onConfirm: () => {
                if (modalComment.trim().toUpperCase() !== 'DELETE') { showError('Please type DELETE to confirm'); return; }
                runAction(course._id, async () => {
                    await axios.delete(`${API_URL}/admin/courses/${course._id}`, { headers: { Authorization: `Bearer ${token}` } });
                    showSuccess('Course permanently deleted');
                    closeModal();
                });
            }
        });
    };

    const filtered = courses.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor?.name.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: courses.length,
        pending: courses.filter(c => c.status === 'pending').length,
        approved: courses.filter(c => c.status === 'approved').length,
        rejected: courses.filter(c => c.status === 'rejected').length,
        locked: courses.filter(c => c.status === 'locked').length,
        hidden: courses.filter(c => c.isHidden).length,
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20 ring-1 ring-cyan-500/30">
                        <Shield className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Course Management</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Admin control for all platform courses</p>
                    </div>
                </div>
                <button onClick={fetchCourses} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-sm font-medium">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-white' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
                    { label: 'Approved', value: stats.approved, color: 'text-emerald-400' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-rose-400' },
                    { label: 'Locked', value: stats.locked, color: 'text-orange-400' },
                    { label: 'Hidden', value: stats.hidden, color: 'text-slate-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4 text-center">
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search courses or instructors..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                </div>
                <div className="relative flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 w-fit">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-transparent text-slate-300 text-sm font-medium pr-6 focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value="all" className="bg-slate-800">All Statuses</option>
                        <option value="pending" className="bg-slate-800">Pending</option>
                        <option value="approved" className="bg-slate-800">Approved</option>
                        <option value="rejected" className="bg-slate-800">Rejected</option>
                        <option value="locked" className="bg-slate-800">Locked</option>
                        <option value="hidden" className="bg-slate-800">Hidden</option>
                    </select>
                    <ChevronDown className="absolute right-3 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="text-center py-16 text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                        <p>Loading courses...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No courses found</p>
                        <p className="text-sm mt-1 text-slate-600">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-slate-900/60 border-b border-slate-700">
                                <tr>
                                    {['Course', 'Instructor', 'Status', 'Visibility', 'Price', 'Created', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filtered.map((course) => {
                                    const meta = STATUS_META[course.status] ?? STATUS_META.pending;
                                    const isLoading = actionLoading === course._id;
                                    return (
                                        <motion.tr
                                            key={course._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-slate-800/60 transition-colors group"
                                        >
                                            <td className="px-5 py-4 min-w-[220px]">
                                                <p className="font-semibold text-slate-200 truncate max-w-[180px]">{course.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{course.category?.name ?? 'Uncategorized'} • {course.level ?? 'N/A'}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-300 text-sm">
                                                {course.instructor?.name ?? 'Unknown'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${meta.color} ${meta.bg} ${meta.border}`}>
                                                    {meta.label}
                                                </span>
                                                {course.adminComment && (
                                                    <p className="text-xs text-slate-500 mt-1 max-w-[140px] truncate italic">"{course.adminComment}"</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${course.isHidden ? 'text-slate-500 bg-slate-700/50' : 'text-emerald-400 bg-emerald-500/10'}`}>
                                                    {course.isHidden ? 'Hidden' : 'Visible'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-300 text-sm font-mono">
                                                {course.price > 0 ? `$${course.price}` : <span className="text-emerald-400">Free</span>}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                                                {new Date(course.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                {isLoading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                                                ) : (
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Approve */}
                                                        {course.status === 'pending' && (
                                                            <ActionBtn icon={<CheckCircle className="w-4 h-4" />} label="Approve" color="emerald" onClick={() => handleApprove(course)} />
                                                        )}
                                                        {/* Reject */}
                                                        {['pending', 'approved', 'locked'].includes(course.status) && (
                                                            <ActionBtn icon={<XCircle className="w-4 h-4" />} label="Reject" color="rose" onClick={() => handleReject(course)} />
                                                        )}
                                                        {/* Lock / Unlock */}
                                                        {course.status === 'approved' && (
                                                            <ActionBtn icon={<Lock className="w-4 h-4" />} label="Lock" color="orange" onClick={() => handleLock(course)} />
                                                        )}
                                                        {course.status === 'locked' && (
                                                            <ActionBtn icon={<Unlock className="w-4 h-4" />} label="Unlock" color="cyan" onClick={() => handleUnlock(course)} />
                                                        )}
                                                        {/* Hide / Show */}
                                                        <ActionBtn
                                                            icon={course.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                            label={course.isHidden ? 'Show' : 'Hide'}
                                                            color={course.isHidden ? 'emerald' : 'slate'}
                                                            onClick={() => handleHide(course)}
                                                        />
                                                        {/* Delete */}
                                                        <ActionBtn icon={<Trash2 className="w-4 h-4" />} label="Delete" color="rose" onClick={() => handleDelete(course)} />
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <AnimatePresence>
                {modal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className={`flex items-center gap-3 mb-4 ${modal.variant === 'danger' ? 'text-rose-400' : modal.variant === 'warning' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                <AlertTriangle className="w-6 h-6 shrink-0" />
                                <h2 className="text-xl font-black text-white">{modal.title}</h2>
                            </div>
                            <p className="text-slate-300 text-sm mb-5">{modal.message}</p>

                            {modal.withComment && (
                                <textarea
                                    value={modalComment}
                                    onChange={e => setModalComment(e.target.value)}
                                    placeholder={modal.commentPlaceholder}
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 resize-none mb-4"
                                />
                            )}

                            <div className="flex gap-3 justify-end">
                                <button onClick={closeModal} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white text-sm font-medium">
                                    Cancel
                                </button>
                                <button
                                    onClick={modal.onConfirm}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold text-white ${modal.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : modal.variant === 'warning' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ActionBtn: React.FC<{
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
}> = ({ icon, label, color, onClick }) => {
    const colorClasses: Record<string, string> = {
        emerald: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20',
        rose: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20',
        orange: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/20',
        slate: 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border-slate-600',
    };
    return (
        <button
            onClick={onClick}
            title={label}
            className={`p-1.5 rounded-lg border transition-colors ${colorClasses[color] ?? colorClasses.slate}`}
        >
            {icon}
        </button>
    );
};

export default AdminCourses;
