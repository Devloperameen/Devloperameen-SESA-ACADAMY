// Enhanced Motivation Videos Component with YouTube Integration
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, 
    Pause, 
    Volume2, 
    VolumeX, 
    Maximize2, 
    SkipBack, 
    SkipForward, 
    Heart, 
    Share2, 
    Download,
    Clock,
    User,
    Calendar,
    TrendingUp,
    Star,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Bookmark,
    ExternalLink,
    RefreshCw,
    Filter
} from 'lucide-react';

interface MotivationVideo {
    id: string;
    title: string;
    author: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    youtubeId: string;
    duration: string;
    views: number;
    likes: number;
    category: string;
    tags: string[];
    publishedAt: string;
    isFavorite: boolean;
    isWatched: boolean;
}

const MotivationVideos: React.FC = () => {
    const [videos, setVideos] = useState<MotivationVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<MotivationVideo | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showFilter, setShowFilter] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const motivationVideos: MotivationVideo[] = [
        {
            id: '1',
            title: 'The Power of Curiosity',
            author: 'Jim Rohn',
            description: 'Discover how curiosity can transform your learning journey and unlock your true potential.',
            thumbnailUrl: 'https://img.youtube.com/vi/ZXGWYe01Ya8/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/ZXGWYe01Ya8',
            youtubeId: 'ZXGWYe01Ya8',
            duration: '10:23',
            views: 1250000,
            likes: 45000,
            category: 'Curiosity',
            tags: ['curiosity', 'learning', 'growth', 'education'],
            publishedAt: '2024-03-01',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '2',
            title: 'Why You Must Ask Why',
            author: 'Education First',
            description: 'Learn the importance of asking questions and how it leads to deeper understanding.',
            thumbnailUrl: 'https://img.youtube.com/vi/ks2QSk09ndE/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/ks2QSk09ndE',
            youtubeId: 'ks2QSk09ndE',
            duration: '8:45',
            views: 890000,
            likes: 32000,
            category: 'Curiosity',
            tags: ['questions', 'learning', 'understanding', 'education'],
            publishedAt: '2024-02-28',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '3',
            title: 'Finding Your Purpose',
            author: 'Productivity Pro',
            description: 'A comprehensive guide to discovering your true purpose and living a meaningful life.',
            thumbnailUrl: 'https://img.youtube.com/vi/v27H868X9kY/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/v27H868X9kY',
            youtubeId: 'v27H868X9kY',
            duration: '12:15',
            views: 2100000,
            likes: 89000,
            category: 'Success',
            tags: ['purpose', 'meaning', 'life', 'success'],
            publishedAt: '2024-03-05',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '4',
            title: 'The Power of Persistence',
            author: 'Jim Rohn',
            description: 'Discover how persistence can help you overcome any obstacle and achieve your goals.',
            thumbnailUrl: 'https://img.youtube.com/vi/tPnK6Ba4fS4/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/tPnK6Ba4fS4',
            youtubeId: 'tPnK6Ba4fS4',
            duration: '9:30',
            views: 3400000,
            likes: 156000,
            category: 'Success',
            tags: ['persistence', 'goals', 'achievement', 'motivation'],
            publishedAt: '2024-02-25',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '5',
            title: 'How to Achieve Your Goals',
            author: 'SESA Academy',
            description: 'Step-by-step guide to setting and achieving your personal and professional goals.',
            thumbnailUrl: 'https://img.youtube.com/vi/wnHW6o8WMas/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/wnHW6o8WMas',
            youtubeId: 'wnHW6o8WMas',
            duration: '11:20',
            views: 567000,
            likes: 23000,
            category: 'Success',
            tags: ['goals', 'achievement', 'planning', 'success'],
            publishedAt: '2024-03-08',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '6',
            title: 'Success Mindset',
            author: 'Brian Tracy',
            description: 'Develop the mindset of successful people and transform your life.',
            thumbnailUrl: 'https://img.youtube.com/vi/r6zFZQm0hcc/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/r6zFZQm0hcc',
            youtubeId: 'r6zFZQm0hcc',
            duration: '13:45',
            views: 1890000,
            likes: 78000,
            category: 'Success',
            tags: ['mindset', 'success', 'personal development', 'achievement'],
            publishedAt: '2024-02-20',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '7',
            title: 'Why Knowledge is Power',
            author: 'Education First',
            description: 'Understanding the true meaning behind the famous quote and its relevance today.',
            thumbnailUrl: 'https://img.youtube.com/vi/un8K7S6RIsA/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/un8K7S6RIsA',
            youtubeId: 'un8K7S6RIsA',
            duration: '7:30',
            views: 1230000,
            likes: 45000,
            category: 'Education',
            tags: ['knowledge', 'education', 'learning', 'power'],
            publishedAt: '2024-03-10',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '8',
            title: 'Learning How to Learn',
            author: 'Barbara Oakley',
            description: 'Scientifically proven techniques to improve your learning efficiency.',
            thumbnailUrl: 'https://img.youtube.com/vi/7nyZ_16_A72/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/7nyZ_16_A72',
            youtubeId: '7nyZ_16_A72',
            duration: '15:20',
            views: 8900000,
            likes: 234000,
            category: 'Education',
            tags: ['learning', 'study techniques', 'brain science', 'education'],
            publishedAt: '2024-02-15',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '9',
            title: 'Student Success Habits',
            author: 'SESA Insights',
            description: 'Essential habits that separate successful students from the rest.',
            thumbnailUrl: 'https://img.youtube.com/vi/W0v_7nyZ_16/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/W0v_7nyZ_16',
            youtubeId: 'W0v_7nyZ_16',
            duration: '10:15',
            views: 456000,
            likes: 18000,
            category: 'Education',
            tags: ['habits', 'students', 'success', 'learning'],
            publishedAt: '2024-03-12',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '10',
            title: 'The Secret to Discipline',
            author: 'Jocko Willink',
            description: 'Navy SEAL commander shares his secrets to developing unbreakable discipline.',
            thumbnailUrl: 'https://img.youtube.com/vi/vMv3vGfF0L8/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/vMv3vGfF0L8',
            youtubeId: 'vMv3vGfF0L8',
            duration: '14:30',
            views: 2670000,
            likes: 123000,
            category: 'Discipline',
            tags: ['discipline', 'self-control', 'military', 'leadership'],
            publishedAt: '2024-02-18',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '11',
            title: 'The 5 AM Club Strategy',
            author: 'Robin Sharma',
            description: 'Transform your life by waking up early and following this powerful routine.',
            thumbnailUrl: 'https://img.youtube.com/vi/2VDSpxX88pA/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/2VDSpxX88pA',
            youtubeId: '2VDSpxX88pA',
            duration: '12:45',
            views: 3450000,
            likes: 167000,
            category: 'Discipline',
            tags: ['morning routine', 'productivity', 'success', 'discipline'],
            publishedAt: '2024-02-22',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '12',
            title: 'Internal Strength',
            author: 'Work Ethic',
            description: 'Building mental and emotional strength to overcome life\'s challenges.',
            thumbnailUrl: 'https://img.youtube.com/vi/W0v_7nyZ_16/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/W0v_7nyZ_16',
            youtubeId: 'W0v_7nyZ_16',
            duration: '9:15',
            views: 789000,
            likes: 34000,
            category: 'Discipline',
            tags: ['strength', 'resilience', 'mental health', 'discipline'],
            publishedAt: '2024-03-06',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '13',
            title: 'Master Your Time',
            author: 'Work Ethic',
            description: 'Advanced time management techniques for maximum productivity.',
            thumbnailUrl: 'https://img.youtube.com/vi/W0v_7nyZ_16/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/W0v_7nyZ_16',
            youtubeId: 'W0v_7nyZ_16',
            duration: '11:30',
            views: 1230000,
            likes: 56000,
            category: 'Productivity',
            tags: ['time management', 'productivity', 'efficiency', 'focus'],
            publishedAt: '2024-02-28',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '14',
            title: 'Stop Procrastinating Now',
            author: 'Productivity Pro',
            description: 'Psychological tricks and practical strategies to overcome procrastination.',
            thumbnailUrl: 'https://img.youtube.com/vi/v27H868X9kY/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/v27H868X9kY',
            youtubeId: 'v27H868X9kY',
            duration: '8:20',
            views: 2340000,
            likes: 89000,
            category: 'Productivity',
            tags: ['procrastination', 'productivity', 'focus', 'motivation'],
            publishedAt: '2024-03-03',
            isFavorite: false,
            isWatched: false
        },
        {
            id: '15',
            title: 'Deep Work Principles',
            author: 'Cal Newport',
            description: 'Learn how to achieve deep focus and produce your best work.',
            thumbnailUrl: 'https://img.youtube.com/vi/ks2QSk09ndE/hqdefault.jpg',
            videoUrl: 'https://www.youtube.com/embed/ks2QSk09ndE',
            youtubeId: 'ks2QSk09ndE',
            duration: '16:45',
            views: 1560000,
            likes: 67000,
            category: 'Productivity',
            tags: ['deep work', 'focus', 'productivity', 'concentration'],
            publishedAt: '2024-02-25',
            isFavorite: false,
            isWatched: false
        }
    ];

    useEffect(() => {
        setTimeout(() => {
            setVideos(motivationVideos);
            setLoading(false);
        }, 1000);
    }, []);

    const handleVideoSelect = (video: MotivationVideo) => {
        setSelectedVideo(video);
        setIsPlaying(false);
        setCurrentTime(0);
        
        // Mark as watched
        setVideos(prev => prev.map(v => 
            v.id === video.id ? { ...v, isWatched: true } : v
        ));
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

    const toggleFavorite = (videoId: string) => {
        setVideos(prev => prev.map(v => 
            v.id === videoId ? { ...v, isFavorite: !v.isFavorite } : v
        ));
    };

    const shareVideo = (video: MotivationVideo) => {
        if (navigator.share) {
            navigator.share({
                title: video.title,
                text: video.description,
                url: `https://www.youtube.com/watch?v=${video.youtubeId}`
            });
        } else {
            window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        }
        return views.toString();
    };

    const categories = ['all', 'Curiosity', 'Success', 'Education', 'Discipline', 'Productivity'];
    
    const filteredVideos = selectedCategory === 'all' 
        ? videos 
        : videos.filter(v => v.category === selectedCategory);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Loading motivation videos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        Motivation Videos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Get inspired with our curated collection of motivational content
                    </p>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-center space-x-4">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        >
                            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        
                        <AnimatePresence>
                            {showFilter && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-wrap gap-2"
                                >
                                    {categories.map((category) => (
                                        <motion.button
                                            key={category}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                                                selectedCategory === category
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {category === 'all' ? 'All Videos' : category}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredVideos.map((video, index) => (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => handleVideoSelect(video)}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                >
                                    <div className="relative">
                                        <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <Play className="w-12 h-12 text-white" />
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                            {video.duration}
                                        </div>
                                        {video.isWatched && (
                                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                                ✓ Watched
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                            {video.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                            {video.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500">
                                                <span className="flex items-center">
                                                    <User className="w-3 h-3 mr-1" />
                                                    {video.author}
                                                </span>
                                                <span className="flex items-center">
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                    {formatViews(video.views)}
                                                </span>
                                                <span className="flex items-center">
                                                    <ThumbsUp className="w-3 h-3 mr-1" />
                                                    {formatViews(video.likes)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(video.id);
                                                }}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Heart className={`w-4 h-4 ${video.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                                                    {video.category}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                                    {video.publishedAt}
                                                </span>
                                            </div>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    shareVideo(video);
                                                }}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Share2 className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Video Player */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        {selectedVideo ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden sticky top-4">
                                {/* YouTube Embed */}
                                <div className="relative aspect-video bg-black">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0&modestbranding=1`}
                                        title={selectedVideo.title}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                
                                {/* Video Info */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                        {selectedVideo.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {selectedVideo.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-500">
                                            <span className="flex items-center">
                                                <User className="w-4 h-4 mr-1" />
                                                {selectedVideo.author}
                                            </span>
                                            <span className="flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-1" />
                                                {formatViews(selectedVideo.views)} views
                                            </span>
                                            <span className="flex items-center">
                                                <ThumbsUp className="w-4 h-4 mr-1" />
                                                {formatViews(selectedVideo.likes)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => toggleFavorite(selectedVideo.id)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    selectedVideo.isFavorite
                                                        ? 'bg-red-100 text-red-500'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                <Heart className={`w-5 h-5 ${selectedVideo.isFavorite ? 'fill-current' : ''}`} />
                                            </button>
                                            
                                            <button
                                                onClick={() => shareVideo(selectedVideo)}
                                                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                            >
                                                <Share2 className="w-5 h-5" />
                                            </button>
                                            
                                            <a
                                                href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                    
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {selectedVideo.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                                {formatViews(selectedVideo.views)}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Views
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                                {formatViews(selectedVideo.likes)}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Likes
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                    Select a Video
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Choose a motivation video from the list to start watching
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default MotivationVideos;
