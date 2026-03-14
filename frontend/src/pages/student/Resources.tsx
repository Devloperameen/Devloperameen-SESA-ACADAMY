import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, 
    BookOpen, 
    Download, 
    FileText, 
    Search, 
    ExternalLink, 
    Filter,
    Shield,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showError } from '../../utils/toast';

interface Resource {
    title: string;
    url: string;
    type: string;
    courseId: string;
    courseTitle: string;
}

const Resources: React.FC = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseFilter, setSelectedCourseFilter] = useState('All Courses');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchEnrolledResources = async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/courses/my/enrolled?approved=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data || []);
        } catch (err) {
            console.error(err);
            showError('Failed to load resources');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrolledResources();
    }, [token]);

    const allResources = useMemo(() => {
        const resources: Resource[] = [];
        courses.forEach(course => {
            // Main course resource
            if (course.resourceUrl) {
                resources.push({
                    title: 'Course Main Content',
                    url: course.resourceUrl,
                    type: 'link',
                    courseId: course._id,
                    courseTitle: course.title
                });
            }
            // Lesson resources
            course.lessons?.forEach((lesson: any) => {
                lesson.resources?.forEach((res: any) => {
                    resources.push({
                        ...res,
                        courseId: course._id,
                        courseTitle: course.title
                    });
                });
            });
        });
        return resources;
    }, [courses]);

    const filteredResources = useMemo(() => {
        return allResources.filter(res => {
            const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                res.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCourse = selectedCourseFilter === 'All Courses' || res.courseTitle === selectedCourseFilter;
            return matchesSearch && matchesCourse;
        });
    }, [allResources, searchQuery, selectedCourseFilter]);

    const courseNames = useMemo(() => {
        const names = new Set(courses.map(c => c.title));
        return ['All Courses', ...Array.from(names)];
    }, [courses]);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <Shield className="w-16 h-16 text-slate-700 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Access Denied</h2>
                    <p className="text-slate-400">Please login to view your resources.</p>
                    <button onClick={() => navigate('/login')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Navigation & Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all font-medium py-2"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>

                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 md:p-12 border border-slate-700/50 shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Knowledge Vault
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black italic tracking-tight mb-2">Study <span className="text-blue-400">Resources</span></h1>
                                <p className="text-slate-400 text-lg font-medium max-w-lg">
                                    All your primary materials, PDFs, and links from enrolled courses in one place.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                                        <CheckCircle2 className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black">{allResources.length}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Total Items</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search by resource name or course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-[#112240] border border-slate-700/50 rounded-2xl focus:border-blue-500/50 outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                        <Filter className="w-5 h-5 text-slate-500 shrink-0" />
                        {courseNames.map(name => (
                            <button
                                key={name}
                                onClick={() => setSelectedCourseFilter(name)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 border ${
                                    selectedCourseFilter === name 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="h-48 bg-[#112240] rounded-3xl animate-pulse border border-slate-700/30" />
                        ))}
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="bg-[#112240] rounded-[2.5rem] border border-slate-700/50 p-16 text-center">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-12 h-12 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 italic">Nothing Found</h3>
                        <p className="text-slate-400 max-w-md mx-auto mb-8 font-medium">
                            Enroll in more courses or try adjusting your search filters to find what you're looking for.
                        </p>
                        <button 
                            onClick={() => navigate('/student/browse')}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                        >
                            Explore Courses
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filteredResources.map((res, i) => (
                                <motion.div
                                    key={`${res.courseId}-${i}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    className="group bg-[#112240] p-6 rounded-[2rem] border border-slate-700/50 hover:border-blue-500/30 transition-all shadow-xl"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-4 bg-slate-800/50 rounded-2xl text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                                            {res.type === 'pdf' ? <FileText className="w-6 h-6" /> : <ExternalLink className="w-6 h-6" />}
                                        </div>
                                        <div className="text-[10px] items-center gap-1.5 px-2.5 py-1 bg-slate-900/50 rounded-lg text-slate-500 font-black uppercase tracking-tighter flex">
                                            <Clock className="w-3 h-3" />
                                            Enrolled
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-blue-400 transition-colors">{res.title}</h3>
                                    <p className="text-xs text-slate-500 font-bold mb-6 flex items-center gap-2">
                                        <BookOpen className="w-3 h-3" />
                                        {res.courseTitle}
                                    </p>
                                    <a 
                                        href={res.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-slate-800/80 hover:bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all group-hover:shadow-lg shadow-blue-500/10"
                                    >
                                        <Download className="w-4 h-4" />
                                        Access Resource
                                    </a>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Info Footer */}
                <div className="bg-gradient-to-r from-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[2rem] border border-blue-500/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Secure Access</p>
                            <p className="text-xs text-slate-400">All materials are exclusively available to verified students.</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/student/browse')} className="text-blue-400 font-black text-xs hover:underline uppercase tracking-widest">
                        Enroll in more courses
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Resources;
