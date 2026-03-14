// Enhanced Video Workflow Component with Production-Ready UI
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, 
    Play, 
    Lock, 
    Unlock, 
    CreditCard, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Eye, 
    EyeOff, 
    Camera, 
    Download,
    AlertCircle,
    TrendingUp,
    Users,
    Video,
    Star,
    MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Lesson {
    id: string;
    title: string;
    order: number;
    videoUrl?: string;
    accessType: 'free' | 'paid' | 'granted';
    isAccessible: boolean;
    paymentStatus?: string;
    progress: {
        watchedDuration: number;
        totalDuration: number;
        percentage: number;
        completed: boolean;
        completedAt?: Date;
        lastAccessedAt: Date;
    };
    requiresPayment: boolean;
}

interface VideoUpload {
    id: string;
    title: string;
    description: string;
    status: 'uploading' | 'processing' | 'pending_review' | 'approved' | 'rejected' | 'published';
    adminReview?: {
        decision: 'approved' | 'rejected';
        feedback?: string;
        reviewedAt: Date;
    };
    createdAt: Date;
}

interface Screenshot {
    id: string;
    imageUrl: string;
    thumbnailUrl?: string;
    uploadContext: {
        timestamp: number;
        deviceInfo: string;
        browser: string;
    };
    adminReview?: {
        approved: boolean;
        feedback?: string;
        flagged: boolean;
        reviewedAt: Date;
    };
    status: 'uploaded' | 'reviewed' | 'approved' | 'flagged' | 'deleted';
    createdAt: Date;
}

const VideoWorkflow: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'teacher' | 'student' | 'admin'>('teacher');
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [pendingVideos, setPendingVideos] = useState<VideoUpload[]>([]);
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<VideoUpload | null>(null);
    const [paymentModal, setPaymentModal] = useState<{ lesson: Lesson; visible: boolean }>({ lesson: null as any, visible: false });
    const [screenshotModal, setScreenshotModal] = useState<{ url: string; visible: boolean }>({ url: '', visible: false });

    // Mock data - in production, fetch from API
    useEffect(() => {
        // Mock lessons data
        setLessons([
            {
                id: '1',
                title: 'Introduction to React',
                order: 1,
                videoUrl: '/uploads/videos/intro-react.mp4',
                accessType: 'free',
                isAccessible: true,
                progress: {
                    watchedDuration: 300,
                    totalDuration: 600,
                    percentage: 50,
                    completed: false,
                    lastAccessedAt: new Date()
                },
                requiresPayment: false
            },
            {
                id: '2',
                title: 'Advanced React Hooks',
                order: 2,
                accessType: 'paid',
                isAccessible: false,
                paymentStatus: 'pending',
                progress: {
                    watchedDuration: 0,
                    totalDuration: 900,
                    percentage: 0,
                    completed: false,
                    lastAccessedAt: new Date()
                },
                requiresPayment: true
            },
            {
                id: '3',
                title: 'React Performance Optimization',
                order: 3,
                accessType: 'paid',
                isAccessible: true,
                paymentStatus: 'completed',
                progress: {
                    watchedDuration: 0,
                    totalDuration: 1200,
                    percentage: 0,
                    completed: false,
                    lastAccessedAt: new Date()
                },
                requiresPayment: false
            }
        ]);

        // Mock pending videos
        setPendingVideos([
            {
                id: '1',
                title: 'React Fundamentals',
                description: 'Complete guide to React basics',
                status: 'pending_review',
                adminReview: {
                    decision: 'approved',
                    feedback: 'Great content, well-structured',
                    reviewedAt: new Date()
                },
                createdAt: new Date()
            },
            {
                id: '2',
                title: 'Advanced State Management',
                description: 'Deep dive into Redux and Context API',
                status: 'rejected',
                adminReview: {
                    decision: 'rejected',
                    feedback: 'Content needs more examples and better audio quality',
                    reviewedAt: new Date()
                },
                createdAt: new Date()
            }
        ]);

        // Mock screenshots
        setScreenshots([
            {
                id: '1',
                imageUrl: '/uploads/screenshots/screenshot-1.jpg',
                thumbnailUrl: '/uploads/screenshots/thumb-1.jpg',
                uploadContext: {
                    timestamp: 300,
                    deviceInfo: 'Windows',
                    browser: 'Chrome'
                },
                adminReview: {
                    approved: true,
                    feedback: 'Good screenshot showing progress',
                    flagged: false,
                    reviewedAt: new Date()
                },
                status: 'approved',
                createdAt: new Date()
            },
            {
                id: '2',
                imageUrl: '/uploads/screenshots/screenshot-2.jpg',
                thumbnailUrl: '/uploads/screenshots/thumb-2.jpg',
                uploadContext: {
                    timestamp: 600,
                    deviceInfo: 'Mac',
                    browser: 'Safari'
                },
                adminReview: {
                    approved: false,
                    feedback: 'Screenshot is too blurry',
                    flagged: false,
                    reviewedAt: new Date()
                },
                status: 'reviewed',
                createdAt: new Date()
            }
        ]);
    }, []);

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    const handlePayment = (lesson: Lesson) => {
        setPaymentModal({ lesson, visible: true });
    };

    const processPayment = () => {
        // Simulate payment processing
        setTimeout(() => {
            setPaymentModal({ lesson: null as any, visible: false });
            // Update lesson status
            setLessons(prev => prev.map(l => 
                l.id === paymentModal.lesson.id 
                    ? { ...l, isAccessible: true, requiresPayment: false, paymentStatus: 'completed' }
                    : l
            ));
        }, 2000);
    };

    const handleScreenshotUpload = (lessonId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                // Simulate screenshot upload
                const newScreenshot: Screenshot = {
                    id: Date.now().toString(),
                    imageUrl: URL.createObjectURL(file),
                    uploadContext: {
                        timestamp: Math.floor(Math.random() * 1000),
                        deviceInfo: 'Web',
                        browser: 'Chrome'
                    },
                    status: 'uploaded',
                    createdAt: new Date()
                };
                setScreenshots(prev => [newScreenshot, ...prev]);
            }
        };
        input.click();
    };

    const getStatusColor = (status: string) => {
        const colors = {
            uploading: 'from-yellow-400 to-orange-500',
            processing: 'from-blue-400 to-indigo-500',
            pending_review: 'from-purple-400 to-pink-500',
            approved: 'from-green-400 to-emerald-500',
            rejected: 'from-red-400 to-rose-500',
            published: 'from-teal-400 to-cyan-500'
        };
        return colors[status as keyof typeof colors] || 'from-gray-400 to-gray-500';
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            uploading: <Clock className="w-5 h-5" />,
            processing: <Video className="w-5 h-5" />,
            pending_review: <Eye className="w-5 h-5" />,
            approved: <CheckCircle className="w-5 h-5" />,
            rejected: <XCircle className="w-5 h-5" />,
            published: <Star className="w-5 h-5" />
        };
        return icons[status as keyof typeof icons] || <AlertCircle className="w-5 h-5" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Video Workflow Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Upload, review, and manage educational content with secure payment access
                    </p>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-8"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1 inline-flex">
                        {(['teacher', 'student', 'admin'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                                    activeTab === tab
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {tab === 'teacher' && <Upload className="w-4 h-4 mr-2" />}
                                {tab === 'student' && <Users className="w-4 h-4 mr-2" />}
                                {tab === 'admin' && <Eye className="w-4 h-4 mr-2" />}
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'teacher' && (
                        <motion.div
                            key="teacher"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            {/* Upload Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                                    <Upload className="w-6 h-6 mr-3 text-blue-600" />
                                    Upload Video Content
                                </h2>
                                
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors duration-300">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                        id="video-upload"
                                        disabled={isUploading}
                                    />
                                    <label htmlFor="video-upload" className="cursor-pointer">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            <Upload className="w-5 h-5 mr-2" />
                                            {isUploading ? `Uploading... ${uploadProgress}%` : 'Choose Video File'}
                                        </motion.div>
                                    </label>
                                    
                                    {isUploading && (
                                        <div className="mt-4">
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                    transition={{ duration: 0.5 }}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pending Videos */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                    Your Video Uploads
                                </h3>
                                <div className="space-y-4">
                                    {pendingVideos.map((video) => (
                                        <motion.div
                                            key={video.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow duration-300"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                                        {video.title}
                                                    </h4>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                                        {video.description}
                                                    </p>
                                                    <div className="flex items-center mt-2">
                                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusColor(video.status)}`}>
                                                            {getStatusIcon(video.status)}
                                                            <span className="ml-2">{video.status.replace('_', ' ').toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedVideo(video)}
                                                    className="ml-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300"
                                                >
                                                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                                </button>
                                            </div>
                                            
                                            {video.adminReview && (
                                                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="flex items-center mb-2">
                                                        {video.adminReview.decision === 'approved' ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-500 mr-2" />
                                                        )}
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {video.adminReview.decision === 'approved' ? 'Approved' : 'Rejected'}
                                                        </span>
                                                    </div>
                                                    {video.adminReview.feedback && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {video.adminReview.feedback}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'student' && (
                        <motion.div
                            key="student"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            {/* Lessons Grid */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                                    <Play className="w-6 h-6 mr-3 text-blue-600" />
                                    Course Lessons
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {lessons.map((lesson) => (
                                        <motion.div
                                            key={lesson.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: parseInt(lesson.id) * 0.1 }}
                                            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                                    {lesson.title}
                                                </h3>
                                                {lesson.isAccessible ? (
                                                    <Unlock className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <Lock className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    <span>Progress</span>
                                                    <span>{lesson.progress.percentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${lesson.progress.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {lesson.progress.completed ? 'Completed' : `${Math.floor(lesson.progress.watchedDuration / 60)}m ${lesson.progress.watchedDuration % 60}s`}
                                                </div>
                                                
                                                {lesson.requiresPayment ? (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handlePayment(lesson)}
                                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                                                    >
                                                        <CreditCard className="w-4 h-4 mr-2" />
                                                        Unlock
                                                    </motion.button>
                                                ) : lesson.isAccessible ? (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => console.log('Play video:', lesson.id)}
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                                                    >
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Watch
                                                    </motion.button>
                                                ) : (
                                                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 font-semibold rounded-lg flex items-center">
                                                        <Lock className="w-4 h-4 mr-2" />
                                                        Locked
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {lesson.progress.completed && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleScreenshotUpload(lesson.id)}
                                                    className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                                                >
                                                    <Camera className="w-4 h-4 mr-2" />
                                                    Upload Screenshot
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'admin' && (
                        <motion.div
                            key="admin"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            {/* Screenshots Review */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                                    <Camera className="w-6 h-6 mr-3 text-blue-600" />
                                    Screenshot Review Queue
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {screenshots.map((screenshot) => (
                                        <motion.div
                                            key={screenshot.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={screenshot.thumbnailUrl || screenshot.imageUrl}
                                                    alt="Screenshot"
                                                    className="w-full h-48 object-cover cursor-pointer"
                                                    onClick={() => setScreenshotModal({ url: screenshot.imageUrl, visible: true })}
                                                />
                                                
                                                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold text-white ${
                                                    screenshot.status === 'approved' ? 'bg-green-500' :
                                                    screenshot.status === 'flagged' ? 'bg-red-500' :
                                                    screenshot.status === 'reviewed' ? 'bg-yellow-500' :
                                                    'bg-gray-500'
                                                }`}>
                                                    {screenshot.status.toUpperCase()}
                                                </div>
                                            </div>
                                            
                                            <div className="p-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    Uploaded: {screenshot.createdAt.toLocaleDateString()}
                                                </div>
                                                
                                                {screenshot.adminReview && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center">
                                                            {screenshot.adminReview.approved ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                                                            )}
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {screenshot.adminReview.approved ? 'Approved' : 'Needs Review'}
                                                            </span>
                                                        </div>
                                                        {screenshot.adminReview.feedback && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {screenshot.adminReview.feedback}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Payment Modal */}
                <AnimatePresence>
                    {paymentModal.visible && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setPaymentModal({ lesson: null as any, visible: false })}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                    Unlock Lesson
                                </h3>
                                
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        {paymentModal.lesson.title}
                                    </h4>
                                    <div className="text-3xl font-bold text-blue-600">
                                        $9.99
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <button
                                        onClick={processPayment}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                                    >
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Process Payment
                                    </button>
                                    
                                    <button
                                        onClick={() => setPaymentModal({ lesson: null as any, visible: false })}
                                        className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Screenshot Modal */}
                <AnimatePresence>
                    {screenshotModal.visible && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setScreenshotModal({ url: '', visible: false })}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-4 max-w-4xl w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                        Screenshot Preview
                                    </h3>
                                    <button
                                        onClick={() => setScreenshotModal({ url: '', visible: false })}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                <img
                                    src={screenshotModal.url}
                                    alt="Screenshot Preview"
                                    className="w-full h-auto rounded-lg"
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VideoWorkflow;
