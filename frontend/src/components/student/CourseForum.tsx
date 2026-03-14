import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Trash2, Pin, Lock, Flag, Reply } from 'lucide-react';
import axios from 'axios';
import { showSuccess, showError } from '../../utils/toast';

interface Post {
    _id: string;
    content: string;
    author: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

interface Thread {
    _id: string;
    title: string;
    content: string;
    author: {
        _id: string;
        name: string;
    };
    posts: Post[];
    isPinned: boolean;
    isLocked: boolean;
    createdAt: string;
}

interface CourseForumProps {
    courseId: string;
    currentUserId: string;
}

const CourseForum: React.FC<CourseForumProps> = ({ courseId, currentUserId }) => {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');

    useEffect(() => {
        fetchThreads();
    }, [courseId]);

    const fetchThreads = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/forum/course/${courseId}`);
            setThreads(res.data);
        } catch (error) {
            console.error('Failed to fetch threads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/forum/threads`, {
                title: newThreadTitle,
                content: newThreadContent,
                courseId
            });
            setThreads([res.data, ...threads]);
            setNewThreadTitle('');
            setNewThreadContent('');
            setIsCreating(false);
            showSuccess('New discussion started!');
        } catch (error) {
            showError('Failed to create thread');
        }
    };

    const handleAddPost = async (threadId: string) => {
        if (!newPostContent.trim()) return;

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/forum/threads/${threadId}/posts`, {
                content: newPostContent
            });
            
            // The backend returns the completely updated thread object
            const updatedThreads = threads.map(t => {
                if (t._id === threadId) {
                    return res.data;
                }
                return t;
            });
            setThreads(updatedThreads);
            setNewPostContent('');
            showSuccess('Reply posted!');
        } catch (error) {
            showError('Failed to post reply');
        }
    };

    const activeThread = threads.find(t => t._id === activeThreadId);

    return (
        <div className="bg-[#112240] rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col h-[700px]">
            {/* Header */}
            <div className="p-6 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <MessageSquare className="h-6 w-6 text-blue-400" />
                        Course Discussion Forum
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Share knowledge, ask questions, and help others.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-bold hover:bg-blue-600/30 transition-all"
                >
                    Start Discussion
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Threads List Sidebar */}
                <div className="w-1/3 border-r border-slate-700 bg-slate-900/20 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center animate-pulse text-slate-500">Loading threads...</div>
                    ) : threads.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm italic">No discussions yet. Be the first to start one!</div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {threads.map(thread => (
                                <button
                                    key={thread._id}
                                    onClick={() => setActiveThreadId(thread._id)}
                                    className={`w-full text-left p-4 hover:bg-white/5 transition-all relative ${activeThreadId === thread._id ? 'bg-blue-500/10 border-r-2 border-blue-500' : ''}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {thread.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                                        <h4 className="text-sm font-bold text-white truncate">{thread.title}</h4>
                                    </div>
                                    <p className="text-[10px] text-slate-400 line-clamp-1">{thread.content}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                                            <User className="h-2.5 w-2.5" /> {thread.author.name}
                                        </span>
                                        <span className="text-[9px] text-slate-500">
                                            {thread.posts.length} replies
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Thread Content Area */}
                <div className="flex-1 flex flex-col bg-slate-900/30">
                    {activeThread ? (
                        <>
                            <div className="p-6 border-b border-slate-700 bg-slate-900/40">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{activeThread.author.name}</h4>
                                            <span className="text-[10px] text-slate-500">{new Date(activeThread.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {activeThread.isLocked && <div className="p-1 px-2 rounded-md bg-rose-500/10 text-rose-400 text-[9px] font-bold border border-rose-500/20 flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> LOCKED</div>}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{activeThread.title}</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">{activeThread.content}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {activeThread.posts.map((post, i) => (
                                    <div key={post._id} className="flex gap-4 group">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-white">{post.author.name}</span>
                                                <span className="text-[9px] text-slate-500">{new Date(post.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="p-3 bg-slate-800/50 rounded-2xl rounded-tl-none border border-slate-700 text-sm text-slate-300">
                                                {post.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!activeThread.isLocked && (
                                <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                                    <div className="flex gap-3">
                                        <textarea
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="flex-1 h-12 p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white resize-none focus:border-blue-500 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={() => handleAddPost(activeThread._id)}
                                            className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
                            <MessageSquare className="h-16 w-16 text-slate-600 mb-4" />
                            <h4 className="text-lg font-medium text-white">Select a discussion to join</h4>
                            <p className="text-sm text-slate-500 max-w-xs mt-2">See what your classmates and instructors are talking about.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Thread Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#112240] w-full max-w-lg rounded-3xl border border-slate-700 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-700">
                                <h3 className="text-xl font-bold text-white">Start New Discussion</h3>
                            </div>
                            <form onSubmit={handleCreateThread} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 ml-1">Title</label>
                                    <input 
                                        value={newThreadTitle}
                                        onChange={(e) => setNewThreadTitle(e.target.value)}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-all font-medium"
                                        placeholder="Brief summary of your topic..."
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 ml-1">Context / Discussion Points</label>
                                    <textarea 
                                        value={newThreadContent}
                                        onChange={(e) => setNewThreadContent(e.target.value)}
                                        className="w-full h-40 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-all text-sm resize-none"
                                        placeholder="Explain what you want to discuss..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                                    >
                                        Post Discussion
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourseForum;
