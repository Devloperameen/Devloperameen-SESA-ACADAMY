// Simplified Video Workflow Component - Easy to Use
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Upload, 
    Eye, 
    Camera, 
    CreditCard, 
    CheckCircle, 
    XCircle, 
    Search,
    Bell,
    Settings,
    User,
    Play,
    Share2
} from 'lucide-react';

interface SimpleVideo {
    id: string;
    title: string;
    instructor: string;
    status: 'pending' | 'approved' | 'rejected';
    thumbnail: string;
    duration: string;
    isLocked: boolean;
    price?: number;
}

interface SimplePayment {
    id: string;
    student: string;
    lesson: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    date: string;
}

interface SimpleScreenshot {
    id: string;
    student: string;
    lesson: string;
    image: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
}

interface MotivationVideo {
    id: string;
    title: string;
    author: string;
    description: string;
    thumbnail: string;
    youtubeId: string;
    duration: string;
    category: string;
}

const SimplifiedVideoWorkflow: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'upload' | 'review' | 'payment' | 'screenshot' | 'motivation'>('upload');
    const [videos, setVideos] = useState<SimpleVideo[]>([]);
    const [payments, setPayments] = useState<SimplePayment[]>([]);
    const [screenshots, setScreenshots] = useState<SimpleScreenshot[]>([]);
    const [motivationVideos, setMotivationVideos] = useState<MotivationVideo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data
    useEffect(() => {
        setVideos([
            {
                id: '1',
                title: 'Introduction to React',
                instructor: 'John Smith',
                status: 'pending',
                thumbnail: 'https://via.placeholder.com/300x200?text=React+Intro',
                duration: '30:00',
                isLocked: false
            },
            {
                id: '2',
                title: 'Advanced React Hooks',
                instructor: 'Sarah Johnson',
                status: 'approved',
                thumbnail: 'https://via.placeholder.com/300x200?text=Advanced+Hooks',
                duration: '45:00',
                isLocked: true,
                price: 9.99
            },
            {
                id: '3',
                title: 'React Performance',
                instructor: 'Mike Davis',
                status: 'rejected',
                thumbnail: 'https://via.placeholder.com/300x200?text=Performance',
                duration: '25:00',
                isLocked: false
            }
        ]);

        setPayments([
            {
                id: '1',
                student: 'Alice Johnson',
                lesson: 'Advanced React Hooks',
                amount: 9.99,
                status: 'pending',
                date: '2024-03-15'
            },
            {
                id: '2',
                student: 'Bob Smith',
                lesson: 'React Performance',
                amount: 14.99,
                status: 'completed',
                date: '2024-03-14'
            }
        ]);

        setScreenshots([
            {
                id: '1',
                student: 'Alice Johnson',
                lesson: 'Introduction to React',
                image: 'https://via.placeholder.com/300x200?text=Screenshot+1',
                status: 'pending',
                date: '2024-03-15'
            },
            {
                id: '2',
                student: 'Bob Smith',
                lesson: 'Advanced React Hooks',
                image: 'https://via.placeholder.com/300x200?text=Screenshot+2',
                status: 'approved',
                date: '2024-03-14'
            }
        ]);

        // Add motivation videos from YouTube links
        setMotivationVideos([
            {
                id: '1',
                title: 'The Power of Curiosity',
                author: 'Jim Rohn',
                description: 'Discover how curiosity can transform your learning journey',
                thumbnail: 'https://img.youtube.com/vi/ZXGWYe01Ya8/hqdefault.jpg',
                youtubeId: 'ZXGWYe01Ya8',
                duration: '10:23',
                category: 'Curiosity'
            },
            {
                id: '2',
                title: 'Why You Must Ask Why',
                author: 'Education First',
                description: 'Learn the importance of asking questions',
                thumbnail: 'https://img.youtube.com/vi/ks2QSk09ndE/hqdefault.jpg',
                youtubeId: 'ks2QSk09ndE',
                duration: '8:45',
                category: 'Curiosity'
            },
            {
                id: '3',
                title: 'Finding Your Purpose',
                author: 'Productivity Pro',
                description: 'A comprehensive guide to discovering your true purpose',
                thumbnail: 'https://img.youtube.com/vi/v27H868X9kY/hqdefault.jpg',
                youtubeId: 'v27H868X9kY',
                duration: '12:15',
                category: 'Success'
            },
            {
                id: '4',
                title: 'The Power of Persistence',
                author: 'Jim Rohn',
                description: 'Discover how persistence can help you achieve your goals',
                thumbnail: 'https://img.youtube.com/vi/tPnK6Ba4fS4/hqdefault.jpg',
                youtubeId: 'tPnK6Ba4fS4',
                duration: '9:30',
                category: 'Success'
            },
            {
                id: '5',
                title: 'How to Achieve Your Goals',
                author: 'SESA Academy',
                description: 'Step-by-step guide to setting and achieving your goals',
                thumbnail: 'https://img.youtube.com/vi/wnHW6o8WMas/hqdefault.jpg',
                youtubeId: 'wnHW6o8WMas',
                duration: '11:20',
                category: 'Success'
            },
            {
                id: '6',
                title: 'Success Mindset',
                author: 'Brian Tracy',
                description: 'Develop the mindset of successful people',
                thumbnail: 'https://img.youtube.com/vi/r6zFZQm0hcc/hqdefault.jpg',
                youtubeId: 'r6zFZQm0hcc',
                duration: '13:45',
                category: 'Success'
            },
            {
                id: '7',
                title: 'Why Knowledge is Power',
                author: 'Education First',
                description: 'Understanding the true meaning behind the famous quote',
                thumbnail: 'https://img.youtube.com/vi/un8K7S6RIsA/hqdefault.jpg',
                youtubeId: 'un8K7S6RIsA',
                duration: '7:30',
                category: 'Education'
            },
            {
                id: '8',
                title: 'Learning How to Learn',
                author: 'Barbara Oakley',
                description: 'Scientifically proven techniques to improve learning',
                thumbnail: 'https://img.youtube.com/vi/7nyZ_16_A72/hqdefault.jpg',
                youtubeId: '7nyZ_16_A72',
                duration: '15:20',
                category: 'Education'
            },
            {
                id: '9',
                title: 'Student Success Habits',
                author: 'SESA Insights',
                description: 'Essential habits that separate successful students',
                thumbnail: 'https://img.youtube.com/vi/W0v_7nyZ_16/hqdefault.jpg',
                youtubeId: 'W0v_7nyZ_16',
                duration: '10:15',
                category: 'Education'
            },
            {
                id: '10',
                title: 'The Secret to Discipline',
                author: 'Jocko Willink',
                description: 'Navy SEAL commander shares secrets to discipline',
                thumbnail: 'https://img.youtube.com/vi/vMv3vGfF0L8/hqdefault.jpg',
                youtubeId: 'vMv3vGfF0L8',
                duration: '14:30',
                category: 'Discipline'
            },
            {
                id: '11',
                title: 'The 5 AM Club Strategy',
                author: 'Robin Sharma',
                description: 'Transform your life by waking up early',
                thumbnail: 'https://img.youtube.com/vi/2VDSpxX88pA/hqdefault.jpg',
                youtubeId: '2VDSpxX88pA',
                duration: '12:45',
                category: 'Discipline'
            },
            {
                id: '12',
                title: 'Internal Strength',
                author: 'Work Ethic',
                description: 'Building mental and emotional strength',
                thumbnail: 'https://img.youtube.com/vi/W0v_7nyZ_16/hqdefault.jpg',
                youtubeId: 'W0v_7nyZ_16',
                duration: '9:15',
                category: 'Discipline'
            },
            {
                id: '13',
                title: 'Master Your Time',
                author: 'Work Ethic',
                description: 'Advanced time management techniques',
                thumbnail: 'https://img.youtube.com/vi/W0v_7nyZ_16/hqdefault.jpg',
                youtubeId: 'W0v_7nyZ_16',
                duration: '11:30',
                category: 'Productivity'
            },
            {
                id: '14',
                title: 'Stop Procrastinating Now',
                author: 'Productivity Pro',
                description: 'Psychological tricks to overcome procrastination',
                thumbnail: 'https://img.youtube.com/vi/v27H868X9kY/hqdefault.jpg',
                youtubeId: 'v27H868X9kY',
                duration: '8:20',
                category: 'Productivity'
            },
            {
                id: '15',
                title: 'Deep Work Principles',
                author: 'Cal Newport',
                description: 'Learn how to achieve deep focus',
                thumbnail: 'https://img.youtube.com/vi/ks2QSk09ndE/hqdefault.jpg',
                youtubeId: 'ks2QSk09ndE',
                duration: '16:45',
                category: 'Productivity'
            }
        ]);
    }, []);

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log('Uploading file:', file.name);
            // Handle file upload logic here
        }
    };

    const handleApprove = (id: string) => {
        setVideos(prev => prev.map(v => 
            v.id === id ? { ...v, status: 'approved' } : v
        ));
    };

    const handleReject = (id: string) => {
        setVideos(prev => prev.map(v => 
            v.id === id ? { ...v, status: 'rejected' } : v
        ));
    };

    const handlePaymentVerify = (id: string) => {
        setPayments(prev => prev.map(p => 
            p.id === id ? { ...p, status: 'completed' } : p
        ));
    };

    const handleScreenshotApprove = (id: string) => {
        setScreenshots(prev => prev.map(s => 
            s.id === id ? { ...s, status: 'approved' } : s
        ));
    };

    const handleScreenshotReject = (id: string) => {
        setScreenshots(prev => prev.map(s => 
            s.id === id ? { ...s, status: 'rejected' } : s
        ));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Video Workflow</h1>
                        
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                            
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <Bell className="w-5 h-5 text-gray-600" />
                            </button>
                            
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <Settings className="w-5 h-5 text-gray-600" />
                            </button>
                            
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-8">
                        {[
                            { id: 'upload', label: 'Upload', icon: Upload },
                            { id: 'review', label: 'Review', icon: Eye },
                            { id: 'payment', label: 'Payment', icon: CreditCard },
                            { id: 'screenshot', label: 'Screenshots', icon: Camera },
                            { id: 'motivation', label: 'Motivation', icon: Play }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-6"
                    >
                        {/* Upload Area */}
                        <div className="bg-white rounded-lg shadow p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Video</h2>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label htmlFor="video-upload" className="cursor-pointer">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-700 mb-2">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        MP4, MOV, AVI up to 500MB
                                    </p>
                                </label>
                            </div>
                        </div>

                        {/* Recent Uploads */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Uploads</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {videos.map((video) => (
                                    <motion.div
                                        key={video.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-32 object-cover"
                                        />
                                        
                                        <div className="p-4">
                                            <h4 className="font-semibold text-gray-900 mb-1">{video.title}</h4>
                                            <p className="text-sm text-gray-600 mb-2">{video.instructor}</p>
                                            
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                                                    {video.status}
                                                </span>
                                                <span className="text-sm text-gray-500">{video.duration}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Review Tab */}
                {activeTab === 'review' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Pending Review</h2>
                        
                        <div className="space-y-4">
                            {videos.filter(v => v.status === 'pending').map((video) => (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="border rounded-lg p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-16 h-12 rounded object-cover"
                                        />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{video.title}</h4>
                                            <p className="text-sm text-gray-600">{video.instructor}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleApprove(video.id)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(video.id)}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Payment Tab */}
                {activeTab === 'payment' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Verification</h2>
                        
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="border rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{payment.student}</h4>
                                            <p className="text-sm text-gray-600">{payment.lesson}</p>
                                            <p className="text-xs text-gray-500">{payment.date}</p>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4">
                                            <span className="font-bold text-lg">${payment.amount}</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                            
                                            {payment.status === 'pending' && (
                                                <button
                                                    onClick={() => handlePaymentVerify(payment.id)}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Verify
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Screenshot Tab */}
                {activeTab === 'screenshot' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Screenshot Review</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {screenshots.map((screenshot) => (
                                <motion.div
                                    key={screenshot.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="border rounded-lg overflow-hidden"
                                >
                                    <img
                                        src={screenshot.image}
                                        alt="Screenshot"
                                        className="w-full h-32 object-cover"
                                    />
                                    
                                    <div className="p-4">
                                        <h4 className="font-semibold text-gray-900">{screenshot.student}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{screenshot.lesson}</p>
                                        <p className="text-xs text-gray-500 mb-3">{screenshot.date}</p>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(screenshot.status)}`}>
                                                {screenshot.status}
                                            </span>
                                            
                                            {screenshot.status === 'pending' && (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleScreenshotApprove(screenshot.id)}
                                                        className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleScreenshotReject(screenshot.id)}
                                                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Motivation Videos Tab */}
                {activeTab === 'motivation' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Motivation Videos</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {motivationVideos.map((video) => (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                                >
                                    <div className="relative">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-40 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="w-12 h-12 text-white" />
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                            {video.duration}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                                        <p className="text-sm text-gray-600 mb-3">{video.author}</p>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                {video.category}
                                            </span>
                                            
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <Share2 className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SimplifiedVideoWorkflow;
