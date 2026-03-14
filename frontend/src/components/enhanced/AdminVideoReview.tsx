// Enhanced Admin Video Review Component with Full Preview
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, 
    Pause, 
    CheckCircle, 
    XCircle, 
    Eye, 
    Download,
    Clock,
    Video,
    User,
    Calendar,
    FileText,
    AlertCircle,
    Loader,
    Volume2,
    VolumeX,
    Maximize2,
    SkipBack,
    SkipForward,
    RotateCcw
} from 'lucide-react';

interface VideoReview {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    instructorName: string;
    instructorEmail: string;
    instructorAvatar?: string;
    duration: number;
    fileSize: number;
    format: string;
    resolution: string;
    status: 'pending_review' | 'approved' | 'rejected';
    adminReview?: {
        decision: 'approved' | 'rejected';
        feedback?: string;
        reviewedAt: Date;
        reviewedBy: string;
    };
    createdAt: Date;
    metadata: {
        uploadDate: Date;
        processingTime?: number;
        quality: 'low' | 'medium' | 'high' | 'ultra';
        hasSubtitles: boolean;
        language: string;
    };
}

const AdminVideoReview: React.FC = () => {
    const [videos, setVideos] = useState<VideoReview[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<VideoReview | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Mock data - in production, fetch from API
    useEffect(() => {
        const mockVideos: VideoReview[] = [
            {
                id: '1',
                title: 'Introduction to React Hooks',
                description: 'Complete guide to React Hooks including useState, useEffect, and custom hooks',
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Sample video
                thumbnailUrl: 'https://via.placeholder.com/640x360?text=React+Hooks+Intro',
                instructorName: 'John Smith',
                instructorEmail: 'john.smith@example.com',
                instructorAvatar: 'https://via.placeholder.com/50?text=JS',
                duration: 1800, // 30 minutes
                fileSize: 250000000, // 250MB
                format: 'mp4',
                resolution: '1080p',
                status: 'pending_review',
                createdAt: new Date('2024-03-15T10:30:00'),
                metadata: {
                    uploadDate: new Date('2024-03-15T10:30:00'),
                    processingTime: 45,
                    quality: 'high',
                    hasSubtitles: false,
                    language: 'en'
                }
            },
            {
                id: '2',
                title: 'Advanced State Management',
                description: 'Deep dive into Redux, Context API, and advanced state patterns',
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Sample video
                thumbnailUrl: 'https://via.placeholder.com/640x360?text=Advanced+State',
                instructorName: 'Sarah Johnson',
                instructorEmail: 'sarah.j@example.com',
                instructorAvatar: 'https://via.placeholder.com/50?text=SJ',
                duration: 2400, // 40 minutes
                fileSize: 320000000, // 320MB
                format: 'mp4',
                resolution: '1080p',
                status: 'pending_review',
                createdAt: new Date('2024-03-15T09:15:00'),
                metadata: {
                    uploadDate: new Date('2024-03-15T09:15:00'),
                    processingTime: 60,
                    quality: 'high',
                    hasSubtitles: true,
                    language: 'en'
                }
            }
        ];

        setTimeout(() => {
            setVideos(mockVideos);
            setLoading(false);
        }, 1000);
    }, []);

    const handleVideoSelect = (video: VideoReview) => {
        setSelectedVideo(video);
        setIsPlaying(false);
        setCurrentTime(0);
        setReviewAction(null);
        setFeedback('');
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
    };

    const handleMuteToggle = () => {
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    const handleFullscreen = () => {
        if (!isFullscreen && videoRef.current) {
            videoRef.current.requestFullscreen();
        }
        setIsFullscreen(!isFullscreen);
    };

    const handleReviewSubmit = async () => {
        if (!selectedVideo || !reviewAction) return;

        setIsProcessing(true);

        // Simulate API call
        setTimeout(() => {
            setVideos(prev => prev.map(v => 
                v.id === selectedVideo.id 
                    ? {
                        ...v,
                        status: reviewAction === 'approve' ? 'approved' : 'rejected',
                        adminReview: {
                            decision: reviewAction,
                            feedback,
                            reviewedAt: new Date(),
                            reviewedBy: 'Admin User'
                        }
                    }
                    : v
            ));

            setSelectedVideo(prev => prev ? {
                ...prev,
                status: reviewAction === 'approve' ? 'approved' : 'rejected',
                adminReview: {
                    decision: reviewAction,
                    feedback,
                    reviewedAt: new Date(),
                    reviewedBy: 'Admin User'
                }
            } : null);

            setReviewAction(null);
            setFeedback('');
            setIsProcessing(false);
        }, 2000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Loading video reviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Video Review Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Review and approve instructor video submissions
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                <Video className="w-5 h-5 mr-2 text-blue-600" />
                                Pending Reviews ({videos.filter(v => v.status === 'pending_review').length})
                            </h2>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {videos.map((video) => (
                                    <motion.div
                                        key={video.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleVideoSelect(video)}
                                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                                            selectedVideo?.id === video.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <img
                                                src={video.thumbnailUrl || 'https://via.placeholder.com/80x60?text=Video'}
                                                alt={video.title}
                                                className="w-20 h-15 rounded-lg object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                                    {video.title}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    {video.instructorName}
                                                </p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                                                    <span>{formatTime(video.duration)}</span>
                                                    <span>•</span>
                                                    <span>{formatFileSize(video.fileSize)}</span>
                                                    <span>•</span>
                                                    <span>{video.resolution}</span>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        video.status === 'pending_review' 
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                            : video.status === 'approved'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}>
                                                        {video.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Video Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        {selectedVideo ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                                {/* Video Player */}
                                <div className="relative bg-black">
                                    <video
                                        ref={videoRef}
                                        src={selectedVideo.videoUrl}
                                        className="w-full aspect-video"
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                    />
                                    
                                    {/* Video Controls Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={handlePlayPause}
                                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                            >
                                                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                                            </button>
                                            
                                            <span className="text-white text-sm">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                            
                                            <div className="flex-1">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={duration}
                                                    value={currentTime}
                                                    onChange={(e) => handleSeek(Number(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                            
                                            <button
                                                onClick={handleMuteToggle}
                                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                            >
                                                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                                            </button>
                                            
                                            <button
                                                onClick={handleFullscreen}
                                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                            >
                                                <Maximize2 className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Video Info */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                                {selectedVideo.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                                {selectedVideo.description}
                                            </p>
                                            
                                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-1" />
                                                    {selectedVideo.instructorName}
                                                </div>
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {selectedVideo.createdAt.toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {formatTime(selectedVideo.duration)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                {selectedVideo.format} • {selectedVideo.resolution}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatFileSize(selectedVideo.fileSize)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Actions */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                            Review Actions
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setReviewAction('approve')}
                                                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    reviewAction === 'approve'
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                                                }`}
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Approve
                                            </motion.button>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setReviewAction('reject')}
                                                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    reviewAction === 'reject'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                                }`}
                                            >
                                                <XCircle className="w-5 h-5 mr-2" />
                                                Reject
                                            </motion.button>
                                        </div>
                                        
                                        {reviewAction && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mb-4"
                                            >
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Feedback {reviewAction === 'reject' ? '(Required)' : '(Optional)'}
                                                </label>
                                                <textarea
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    placeholder={reviewAction === 'reject' 
                                                        ? 'Please provide reason for rejection...' 
                                                        : 'Add any comments or suggestions...'}
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-300"
                                                    rows={4}
                                                />
                                            </motion.div>
                                        )}
                                        
                                        {reviewAction && (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleReviewSubmit}
                                                disabled={isProcessing || (reviewAction === 'reject' && !feedback.trim())}
                                                className={`w-full p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    reviewAction === 'approve'
                                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                                                } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        {reviewAction === 'approve' ? (
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                        )}
                                                        {reviewAction === 'approve' ? 'Approve Video' : 'Reject Video'}
                                                    </>
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                    No Video Selected
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Select a video from the list to review
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminVideoReview;
