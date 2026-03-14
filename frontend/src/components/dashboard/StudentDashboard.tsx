import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame, Zap, TrendingUp, MessageSquare, ClipboardCheck, Award } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import TeacherEvaluation from '../student/TeacherEvaluation';
import apiService from '../../utils/api';

interface StudentDashboardProps {
    user: any;
    token: string | null;
    approvedCourses: any[];
    pendingCourses: any[];
    fetchStudentCards: () => Promise<any[]>;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
    user,
    token,
    approvedCourses,
    pendingCourses,
    fetchStudentCards
}) => {
    const [selectedCourseForEval, setSelectedCourseForEval] = useState<any>(null);
    const [gradebookData, setGradebookData] = useState<Record<string, any[]>>({});

    useEffect(() => {
        const fetchAllMarks = async () => {
            const data: Record<string, any[]> = {};
            for (const course of approvedCourses) {
                try {
                    const res = await apiService.assessments.getStudentGradebook(course.id);
                    data[course.id] = res.data;
                } catch (err) {
                    console.error(`Failed to fetch marks for ${course.id}`, err);
                }
            }
            setGradebookData(data);
        };
        if (approvedCourses.length > 0) fetchAllMarks();
    }, [approvedCourses]);

    const xp = approvedCourses.length * 250 + pendingCourses.length * 60;
    const level = Math.max(1, Math.ceil(xp / 500));
    const streakDays = Math.max(1, approvedCourses.length);

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

    return (
        <div className="pb-12">
            {/* Student XP / Streak hero strip */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 md:mx-8 mt-6 rounded-[2rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-slate-700/50 p-6 flex flex-wrap gap-6 items-center shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/20">
                        <Star className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Learner Level</p>
                        <p className="text-2xl font-black text-white italic">Level {level}</p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
                        <Flame className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Study Streak</p>
                        <p className="text-2xl font-black text-white italic">{streakDays} Days 🔥</p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Total XP</p>
                        <p className="text-2xl font-black text-white italic">{xp.toLocaleString()} XP</p>
                    </div>
                </div>

                <div className="ml-auto relative z-10">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-black text-blue-100 uppercase tracking-tighter">
                            {approvedCourses.length} Active Courses
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Course progress rings */}
            {approvedCourses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mx-4 md:mx-8 mt-6 rounded-[2.5rem] border border-slate-700/50 bg-[#112240]/40 backdrop-blur-xl p-8"
                >
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 bg-slate-800/50 w-fit px-4 py-1.5 rounded-full">Course Momentum</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {approvedCourses.slice(0, 10).map((c, i) => {
                            const ringColor = i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#a855f7' : '#10b981';
                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-slate-900/60 border border-slate-700/50 hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="relative">
                                        <ProgressRing percent={c.progressPercent} color={ringColor} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-black text-white">{c.progressPercent}%</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-slate-200 leading-tight line-clamp-1 mb-1 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{c.title}</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-[10px] font-black text-slate-500">{c.completedLessons}/{c.totalLessons}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Lessons</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-2">
                                        <button 
                                            onClick={() => setSelectedCourseForEval(c)}
                                            className="p-2 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-500 hover:text-white transition-all shadow-lg"
                                            title="Evaluate Inspector"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="px-3 py-1.5 bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Momentum: {Math.max(10, c.progressPercent)}%
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Assessment Marks & Performance Table */}
            {approvedCourses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mx-4 md:mx-8 mt-6 rounded-[2.5rem] border border-slate-700/50 bg-[#112240]/40 backdrop-blur-xl p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 bg-slate-800/50 w-fit px-4 py-1.5 rounded-full">Gradebook Archive</h2>
                            <h3 className="text-2xl font-black text-white italic">Assessment <span className="text-blue-400">Deep Dive</span></h3>
                        </div>
                        <div className="p-3 bg-slate-800/80 rounded-2xl">
                            <ClipboardCheck className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-700/30 bg-slate-900/60 shadow-inner">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">Subject / Course</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">Quiz (Avg)</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">Assignment</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">Mid Term</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">Final Exam</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">Standings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-6 border-b border-slate-700/20">
                                            <p className="font-black text-slate-200 uppercase tracking-tight group-hover:text-blue-400 transition-colors truncate max-w-[200px]">{course.title}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1 italic">{course.instructor}</p>
                                        </td>
                                        <td className="px-6 py-6 border-b border-slate-700/20">
                                            <span className="text-sm font-black text-white">
                                                {gradebookData[course.id]?.find(m => m.assessmentType === 'quiz')?.score ?? '—'}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 border-b border-slate-700/20">
                                            <span className="text-sm font-black text-slate-400 italic">
                                                {gradebookData[course.id]?.find(m => m.assessmentType === 'assignment')?.score ?? 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 border-b border-slate-700/20">
                                            {gradebookData[course.id]?.find(m => m.assessmentType === 'midterm') ? (
                                                <span className="text-sm font-black text-white">{gradebookData[course.id].find(m => m.assessmentType === 'midterm').score}%</span>
                                            ) : (
                                                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-black text-amber-500 uppercase w-fit">
                                                    Locked
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 border-b border-slate-700/20">
                                            {gradebookData[course.id]?.find(m => m.assessmentType === 'final') ? (
                                                <span className="text-sm font-black text-white">{gradebookData[course.id].find(m => m.assessmentType === 'final').score}%</span>
                                            ) : (
                                                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="w-1/3 h-full bg-slate-700" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 border-b border-slate-700/20">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <Award className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <span className="text-xs font-black text-emerald-500 italic uppercase">Distinction</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-8 flex items-center gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-[2rem]">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Performance Trend</p>
                            <p className="text-xs text-slate-500 font-medium">Your overall engagement is in the top 15% of the platform. Maintain consistency to unlock the SESA Certification early.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <DashboardLayout
                token={token}
                fetchCourses={fetchStudentCards}
                user={{
                    id: user.id || user._id,
                    name: user.name,
                    email: user.email,
                    streakDays,
                    totalXp: xp,
                    levelLabel: `Level ${level} Learner`,
                }}
            />

            <AnimatePresence>
                {selectedCourseForEval && (
                    <TeacherEvaluation
                        courseId={selectedCourseForEval.id}
                        instructorId={selectedCourseForEval.instructorId || ''}
                        instructorName={selectedCourseForEval.instructor || 'Unknown Instructor'}
                        courseTitle={selectedCourseForEval.title}
                        onClose={() => setSelectedCourseForEval(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentDashboard;
