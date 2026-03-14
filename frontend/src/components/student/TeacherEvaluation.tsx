import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../utils/api';

interface TeacherEvaluationProps {
    courseId: string;
    instructorId: string;
    instructorName: string;
    courseTitle: string;
    onClose: () => void;
}

const RATINGS = [
    { label: 'Strongly Disagree', value: 1, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Disagree', value: 2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Neutral', value: 3, color: 'text-slate-400', bg: 'bg-slate-400/10' },
    { label: 'Agree', value: 4, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Strongly Agree', value: 5, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const QUESTIONS = [
    { key: 'clarity', label: 'Instructor explains concepts clearly and effectively.' },
    { key: 'engagement', label: 'Instructor keeps the sessions engaging and interactive.' },
    { key: 'support', label: 'Instructor provides helpful support and feedback.' },
    { key: 'knowledge', label: 'Instructor demonstrates deep knowledge of the subject.' },
    { key: 'overall', label: 'Overall, I am satisfied with this instructor.' },
];

const TeacherEvaluation: React.FC<TeacherEvaluationProps> = ({
    courseId,
    instructorId,
    instructorName,
    courseTitle,
    onClose
}) => {
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRatingSelect = (questionKey: string, value: number) => {
        setRatings(prev => ({ ...prev, [questionKey]: value }));
    };

    const handleSubmit = async () => {
        if (Object.keys(ratings).length < QUESTIONS.length) {
            toast.warning('Please answer all evaluation questions');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiService.evaluations.submit({
                courseId,
                instructorId,
                ratings,
                feedback
            });
            toast.success('Evaluation submitted successfully!');
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit evaluation');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                
                {/* Header */}
                <div className="p-8 border-b border-slate-800 flex items-center justify-between relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">
                            <ShieldCheck className="w-3 h-3" />
                            Performance Audit
                        </div>
                        <h2 className="text-2xl font-black text-white italic">Evaluate <span className="text-blue-400">{instructorName}</span></h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 line-clamp-1">{courseTitle}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-10 custom-scrollbar">
                    {QUESTIONS.map((q, qIdx) => (
                        <div key={q.key} className="space-y-4">
                            <p className="text-slate-300 font-bold text-sm tracking-tight flex gap-3">
                                <span className="text-blue-500/50 font-black">0{qIdx + 1}</span>
                                {q.label}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {RATINGS.map((r) => {
                                    const isSelected = ratings[q.key] === r.value;
                                    return (
                                        <button
                                            key={r.value}
                                            onClick={() => handleRatingSelect(q.key, r.value)}
                                            className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                                                isSelected 
                                                ? `${r.bg} ${r.color} border-current ring-1 ring-current/50`
                                                : 'bg-slate-800/30 border-slate-700/50 text-slate-500 hover:border-slate-600'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <MessageSquare className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Additional Feedback (Optional)</p>
                        </div>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Share your experience with the instructor..."
                            className="w-full h-32 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-800 bg-slate-900/30 flex justify-end gap-4 relative z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="group relative flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Submitting...</span>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span className="text-[10px] uppercase tracking-widest">Submit Evaluation</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TeacherEvaluation;
