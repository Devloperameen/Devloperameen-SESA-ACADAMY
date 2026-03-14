import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/toast';
import axios from 'axios';
import { CheckCircle, XCircle, Filter, BookOpen, Users, Eye, ImageIcon, ExternalLink, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

interface CourseApproval {
    _id: string;
    title: string;
    instructor: {
        _id: string;
        name: string;
    };
    category?: {
        name: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

type TabType = 'enrollments' | 'courses';

const Approvals: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('enrollments');
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [courses, setCourses] = useState<CourseApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'courses') {
                const res = await axios.get(`${API_URL}/course-management/admin/courses/pending-review`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(res.data);
            } else {
                const res = await axios.get(`${API_URL}/course-management/admin/enrollments/verification`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEnrollments(res.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            showError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEnrollment = async (enrollmentId: string) => {
        try {
            await axios.put(
                `${API_URL}/course-management/admin/enrollments/${enrollmentId}/verify`,
                { status: 'approved' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess('Enrollment verified and access granted');
            fetchData();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to verify enrollment');
        }
    };

    const handleRejectEnrollment = async (enrollmentId: string) => {
        const comment = window.prompt("Enter a reason for rejection (optional):");
        if (comment === null) return;

        try {
            await axios.put(
                `${API_URL}/course-management/admin/enrollments/${enrollmentId}/reject`,
                { adminComment: comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess('Enrollment rejected');
            fetchData();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to reject enrollment');
        }
    };

    const handleCourseStatusUpdate = async (courseId: string, decision: 'accept' | 'reject') => {
        let comment = undefined;
        if (decision === 'reject') {
            const promptComment = window.prompt("Enter a reason for course rejection (optional):");
            if (promptComment === null) return;
            comment = promptComment;
        }

        try {
            await axios.put(
                `${API_URL}/course-management/admin/courses/${courseId}/review`,
                { decision, adminComment: comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess(`Course ${decision === 'accept' ? 'approved' : 'rejected'} successfully`);
            fetchData();
        } catch (err: any) {
            showError(err.response?.data?.message || `Failed to update course status`);
        }
    };

    const filteredItems = activeTab === 'enrollments' 
        ? enrollments.filter(item => statusFilter === 'all' || item.enrollment.status === statusFilter)
        : courses.filter(c => statusFilter === 'all' || c.status === statusFilter);

    const stats = {
        total: activeTab === 'enrollments' ? enrollments.length : courses.length,
        pending: (activeTab === 'enrollments' ? enrollments : courses).filter((i: any) => (activeTab === 'enrollments' ? i.enrollment.status : i.status) === 'pending').length,
        approved: (activeTab === 'enrollments' ? enrollments : courses).filter((i: any) => (activeTab === 'enrollments' ? i.enrollment.status : i.status) === 'approved').length,
        rejected: (activeTab === 'enrollments' ? enrollments : courses).filter((i: any) => (activeTab === 'enrollments' ? i.enrollment.status : i.status) === 'rejected').length
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-cyan-400" />
                    <h1 className="text-3xl font-bold tracking-tight text-white">Approvals</h1>
                </div>

                <div className="flex p-1 bg-slate-800/50 border border-slate-700 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('enrollments')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'enrollments' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Student Enrollments
                    </button>
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'courses' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Course Submissions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requests', value: stats.total, color: 'text-white' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
                    { label: 'Approved', value: stats.approved, color: 'text-emerald-400' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-rose-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700 rounded-xl p-4 w-fit">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-slate-300 text-sm font-medium focus:outline-none focus:ring-0 cursor-pointer"
                >
                    <option value="pending" className="bg-slate-800">Pending Only</option>
                    <option value="all" className="bg-slate-800">All Status</option>
                    <option value="approved" className="bg-slate-800">Approved</option>
                    <option value="rejected" className="bg-slate-800">Rejected</option>
                </select>
            </div>

            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="text-center py-12 text-slate-400 animate-pulse">Scanning records...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 border border-slate-700 border-dashed m-4 rounded-xl">
                        {statusFilter === 'pending' ? 'No pending requests currently.' : 'No records found.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {activeTab === 'enrollments' ? 'Student' : 'Course Details'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {activeTab === 'enrollments' ? 'Target Course' : 'Instructor'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status & Verification</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredItems.map((item: any, index: number) => {
                                    const isEnrollment = activeTab === 'enrollments';
                                    const data = isEnrollment ? item.enrollment : item;
                                    const paymentMeta = isEnrollment ? item.paymentMetadata : null;
                                    
                                    const title1 = isEnrollment ? data.user?.name : data.title;
                                    const subtitle1 = isEnrollment ? data.user?.email : (data.category?.name || 'Uncategorized');
                                    const title2 = isEnrollment ? data.course?.title : data.instructor?.name;
                                    const dateField = isEnrollment ? data.requestedAt : data.createdAt;

                                    return (
                                        <tr key={index} className="hover:bg-slate-800/60 transition-colors group">
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <p className="font-semibold text-slate-200">{title1}</p>
                                                <p className="text-sm text-slate-400 mt-0.5">{subtitle1}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                <div className="font-medium">{title2}</div>
                                                {isEnrollment && data.course?.price && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded-full">ETB {data.course.price}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {data.status === 'approved' && (
                                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded-full">Approved</span>
                                                        )}
                                                        {data.status === 'pending' && (
                                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium rounded-full">Pending</span>
                                                        )}
                                                        {data.status === 'rejected' && (
                                                            <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium rounded-full">Rejected</span>
                                                        )}
                                                    </div>
                                                    
                                                    {isEnrollment && paymentMeta && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                <CreditCard className="w-3 h-3" />
                                                                <span className="uppercase font-bold tracking-wider">{paymentMeta.method}</span>
                                                            </div>
                                                            {paymentMeta.transactionId && (
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                                                                    ID: {paymentMeta.transactionId}
                                                                </div>
                                                            )}
                                                            {paymentMeta.proofUrl && (
                                                                <button 
                                                                    onClick={() => setSelectedProof(paymentMeta.proofUrl)}
                                                                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors w-fit pt-1 font-bold"
                                                                >
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                    View Proof
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                                                {new Date(dateField).toLocaleDateString()}
                                                <p className="text-[10px] opacity-50">{new Date(dateField).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {data.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!isEnrollment && (
                                                            <Link
                                                                to={`/admin/courses/${data._id}/preview`}
                                                                className="p-2 bg-slate-700/50 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors border border-slate-600"
                                                                title="Preview Course"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </Link>
                                                        )}
                                                        <button
                                                            onClick={() => 
                                                                isEnrollment 
                                                                ? handleApproveEnrollment(data._id)
                                                                : handleCourseStatusUpdate(data._id, 'accept')
                                                            }
                                                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => 
                                                                isEnrollment 
                                                                ? handleRejectEnrollment(data._id)
                                                                : handleCourseStatusUpdate(data._id, 'reject')
                                                            }
                                                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Proof Modal */}
            {selectedProof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-slate-900 border-2 border-slate-700 rounded-[2.5rem] overflow-hidden max-w-4xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Payment Verification</h3>
                                <p className="text-slate-400 text-sm font-medium">Please cross-reference the transaction ID with your bank statement.</p>
                            </div>
                            <button onClick={() => setSelectedProof(null)} className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all">
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-950 flex justify-center max-h-[60vh] overflow-auto">
                            <img src={selectedProof} alt="Payment Proof" className="max-w-full rounded-2xl shadow-2xl" />
                        </div>
                        <div className="p-8 bg-slate-900 border-t border-slate-800 flex justify-end gap-4 shadow-inner">
                            <a 
                                href={selectedProof} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all text-sm font-black uppercase tracking-wider"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Full Size
                            </a>
                            <button 
                                onClick={() => setSelectedProof(null)}
                                className="px-10 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-xl shadow-primary/20"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Approvals;
