import React from 'react';
import { motion } from 'framer-motion';
import { 
    BookOpen, 
    Clock3, 
    Plus, 
    TrendingUp, 
    Layout, 
    BarChart3,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InstructorDashboardProps {
    user: any;
    courses: any[];
    pendingQueue: any[];
    stats: any[];
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
    user,
    courses,
    pendingQueue,
    stats
}) => {
    return (
        <div className="space-y-8 pb-12">
            {/* Header Hero */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 md:p-12 border border-slate-700/50 shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
                            <Layout className="w-3.5 h-3.5" />
                            Instructor Workspace
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tight mb-2 text-white">
                            Welcome back, <span className="text-cyan-400">{user.name.split(' ')[0]}</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-lg">
                            Manage your curriculum, track student progress, and monitor your course performance.
                        </p>
                    </div>
                    
                    <Link
                        to="/instructor/create-course"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-cyan-900/40 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <Plus className="h-5 w-5" />
                        <span>Create New Course</span>
                    </Link>
                </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <motion.div 
                        key={s.label} 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ delay: i * 0.1 }}
                        className="group relative rounded-[2rem] border border-slate-700/50 bg-[#112240]/40 backdrop-blur-xl p-6 hover:border-cyan-500/30 transition-all shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-4 rounded-2xl bg-slate-800/80 group-hover:bg-cyan-500/10 transition-colors`}>
                                <s.icon className={`w-6 h-6 text-cyan-400`} />
                            </div>
                            <div className="p-1.5 bg-slate-900/50 rounded-lg">
                                <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                        <p className="text-3xl font-black text-white italic">{s.value}</p>
                    </motion.div>
                ))}
                
                {/* Visual Accent Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ delay: 0.4 }}
                    className="rounded-[2rem] bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 p-6 flex flex-col justify-between"
                >
                    <BarChart3 className="w-8 h-8 text-cyan-400 opacity-50" />
                    <div>
                        <p className="text-xs font-black text-cyan-200/60 uppercase tracking-widest mb-1">Growth</p>
                        <p className="text-sm font-bold text-white">Performance metrics are looking consistent this week.</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Active Courses List */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2.5rem] border border-slate-700/50 bg-[#112240]/40 backdrop-blur-xl p-8 lg:col-span-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white italic">Active <span className="text-cyan-400">Courses</span></h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Live Portfolio</p>
                        </div>
                        <Link to="/instructor/courses" className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-[0.2em] flex items-center gap-2 group">
                            Manage All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {courses.length === 0 ? (
                        <div className="py-12 text-center bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-700/50">
                            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No courses launched yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {courses.slice(0, 5).map((course) => (
                                <div
                                    key={course._id}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[1.5rem] border border-slate-700/30 bg-slate-900/40 p-5 hover:border-cyan-500/20 transition-all hover:bg-slate-900/60"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 font-black">
                                            {course.title.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-white group-hover:text-cyan-400 transition-colors italic">{course.title}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5 line-clamp-1 max-w-[300px]">{course.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            {course.category?.name || 'General'}
                                        </div>
                                        <button className="p-2.5 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-400 hover:text-white transition-all">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Enrollment Pipeline */}
                <motion.aside
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 lg:col-span-4"
                >
                    <div className="rounded-[2.5rem] border border-slate-700/50 bg-[#112240]/40 backdrop-blur-xl p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                                Student Notifications
                            </h3>
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        </div>

                        {pendingQueue.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <Clock3 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-[10px] font-black text-slate-500 uppercase">Queue Clear</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingQueue.slice(0, 4).map((entry) => (
                                    <div
                                        key={`${entry.courseId}:${entry.student?._id || 'unknown'}`}
                                        className="rounded-2xl border border-slate-700/30 bg-slate-900/60 p-4 hover:border-cyan-500/20 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-black text-white italic">{entry.student?.name || 'New Student'}</p>
                                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter bg-cyan-500/10 px-2 py-0.5 rounded-md">Requested</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-tighter">{entry.courseTitle}</p>
                                    </div>
                                ))}
                                <button className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] border border-slate-700/50 rounded-2xl hover:bg-slate-800/50 transition-all mt-4">
                                    View Full Pipeline
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Tips */}
                    <div className="rounded-[2.5rem] bg-gradient-to-br from-[#1e293b] to-slate-900 border border-slate-700/50 p-6">
                        <BarChart3 className="w-6 h-6 text-cyan-500 mb-4" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Did you know?</h4>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
                            Courses with downloadable resources have 40% higher completion rates. Consider adding PDFs to your lessons.
                        </p>
                    </div>
                </motion.aside>
            </div>
        </div>
    );
};

export default InstructorDashboard;
