// Enhanced Payment Verification Component with Preview
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Lock, 
    Unlock, 
    Eye, 
    Download,
    Clock,
    User,
    Calendar,
    DollarSign,
    Shield,
    Smartphone,
    Monitor,
    Globe,
    RefreshCw,
    FileText,
    Zap
} from 'lucide-react';

interface PaymentTransaction {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentAvatar?: string;
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    amount: number;
    currency: string;
    method: 'stripe' | 'paypal' | 'manual';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paymentIntentId?: string;
    createdAt: Date;
    completedAt?: Date;
    metadata: {
        ipAddress: string;
        userAgent: string;
        device: string;
        browser: string;
        location?: string;
    };
    lessonPreview?: {
        videoUrl: string;
        thumbnailUrl: string;
        duration: number;
        description: string;
    };
}

const PaymentVerification: React.FC = () => {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [verificationAction, setVerificationAction] = useState<'verify' | 'reject' | null>(null);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Mock data - in production, fetch from API
    useEffect(() => {
        const mockTransactions: PaymentTransaction[] = [
            {
                id: '1',
                studentId: 'student1',
                studentName: 'Alice Johnson',
                studentEmail: 'alice.j@example.com',
                studentAvatar: 'https://via.placeholder.com/50?text=AJ',
                courseId: 'course1',
                courseTitle: 'Advanced React Development',
                lessonId: 'lesson2',
                lessonTitle: 'Advanced State Management',
                amount: 9.99,
                currency: 'USD',
                method: 'stripe',
                status: 'pending',
                transactionId: 'txn_123456789',
                paymentIntentId: 'pi_123456789',
                createdAt: new Date('2024-03-15T14:30:00'),
                metadata: {
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    device: 'Windows',
                    browser: 'Chrome',
                    location: 'New York, US'
                },
                lessonPreview: {
                    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Advanced+State',
                    duration: 2400,
                    description: 'Deep dive into Redux, Context API, and advanced state patterns'
                }
            },
            {
                id: '2',
                studentId: 'student2',
                studentName: 'Bob Smith',
                studentEmail: 'bob.smith@example.com',
                studentAvatar: 'https://via.placeholder.com/50?text=BS',
                courseId: 'course1',
                courseTitle: 'Advanced React Development',
                lessonId: 'lesson3',
                lessonTitle: 'Performance Optimization',
                amount: 9.99,
                currency: 'USD',
                method: 'paypal',
                status: 'pending',
                transactionId: 'txn_987654321',
                createdAt: new Date('2024-03-15T15:45:00'),
                metadata: {
                    ipAddress: '192.168.1.101',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    device: 'Mac',
                    browser: 'Safari',
                    location: 'Los Angeles, US'
                },
                lessonPreview: {
                    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Performance+Opt',
                    duration: 1800,
                    description: 'Learn React performance optimization techniques'
                }
            },
            {
                id: '3',
                studentId: 'student3',
                studentName: 'Carol White',
                studentEmail: 'carol.w@example.com',
                studentAvatar: 'https://via.placeholder.com/50?text=CW',
                courseId: 'course2',
                courseTitle: 'Node.js Masterclass',
                lessonId: 'lesson1',
                lessonTitle: 'Node.js Fundamentals',
                amount: 14.99,
                currency: 'USD',
                method: 'manual',
                status: 'completed',
                transactionId: 'manual_456789',
                createdAt: new Date('2024-03-14T10:15:00'),
                completedAt: new Date('2024-03-14T10:20:00'),
                metadata: {
                    ipAddress: '192.168.1.102',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
                    device: 'iPhone',
                    browser: 'Safari',
                    location: 'Chicago, US'
                }
            }
        ];

        setTimeout(() => {
            setTransactions(mockTransactions);
            setLoading(false);
        }, 1000);
    }, []);

    const handleTransactionSelect = (transaction: PaymentTransaction) => {
        setSelectedTransaction(transaction);
        setVerificationAction(null);
        setVerificationNotes('');
        setShowPreview(false);
    };

    const handleVerification = async () => {
        if (!selectedTransaction || !verificationAction) return;

        setIsProcessing(true);

        // Simulate API call
        setTimeout(() => {
            setTransactions(prev => prev.map(t => 
                t.id === selectedTransaction.id 
                    ? {
                        ...t,
                        status: verificationAction === 'verify' ? 'completed' : 'failed',
                        completedAt: verificationAction === 'verify' ? new Date() : undefined
                    }
                    : t
            ));

            setSelectedTransaction(prev => prev ? {
                ...prev,
                status: verificationAction === 'verify' ? 'completed' : 'failed',
                completedAt: verificationAction === 'verify' ? new Date() : undefined
            } : null);

            setVerificationAction(null);
            setVerificationNotes('');
            setIsProcessing(false);
        }, 2000);
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'from-yellow-400 to-orange-500',
            completed: 'from-green-400 to-emerald-500',
            failed: 'from-red-400 to-rose-500',
            refunded: 'from-gray-400 to-gray-500'
        };
        return colors[status as keyof typeof colors] || 'from-gray-400 to-gray-500';
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            pending: <Clock className="w-5 h-5" />,
            completed: <CheckCircle className="w-5 h-5" />,
            failed: <XCircle className="w-5 h-5" />,
            refunded: <RefreshCw className="w-5 h-5" />
        };
        return icons[status as keyof typeof icons] || <AlertCircle className="w-5 h-5" />;
    };

    const getMethodIcon = (method: string) => {
        const icons = {
            stripe: <CreditCard className="w-4 h-4" />,
            paypal: <DollarSign className="w-4 h-4" />,
            manual: <FileText className="w-4 h-4" />
        };
        return icons[method as keyof typeof icons] || <CreditCard className="w-4 h-4" />;
    };

    const getDeviceIcon = (device: string) => {
        const icons = {
            'Windows': <Monitor className="w-4 h-4" />,
            'Mac': <Monitor className="w-4 h-4" />,
            'iPhone': <Smartphone className="w-4 h-4" />,
            'iPad': <Tablet className="w-4 h-4" />,
            'Android': <Smartphone className="w-4 h-4" />
        };
        return icons[device as keyof typeof icons] || <Globe className="w-4 h-4" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Loading payment transactions...</p>
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
                        Payment Verification Center
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Review and verify student lesson payment transactions
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transaction List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                                Pending Transactions ({transactions.filter(t => t.status === 'pending').length})
                            </h2>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {transactions.map((transaction) => (
                                    <motion.div
                                        key={transaction.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleTransactionSelect(transaction)}
                                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                                            selectedTransaction?.id === transaction.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <img
                                                src={transaction.studentAvatar || 'https://via.placeholder.com/50?text=User'}
                                                alt={transaction.studentName}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                                    {transaction.studentName}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    {transaction.lessonTitle}
                                                </p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                                                    <span>${transaction.amount}</span>
                                                    <span>•</span>
                                                    <span>{transaction.method}</span>
                                                    <span>•</span>
                                                    <span>{transaction.createdAt.toLocaleDateString()}</span>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getStatusColor(transaction.status)}`}>
                                                        {getStatusIcon(transaction.status)}
                                                        <span className="ml-1">{transaction.status.toUpperCase()}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Transaction Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        {selectedTransaction ? (
                            <div className="space-y-6">
                                {/* Payment Details */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                        Payment Details
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-4">
                                                <img
                                                    src={selectedTransaction.studentAvatar || 'https://via.placeholder.com/50?text=User'}
                                                    alt={selectedTransaction.studentName}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                                                        {selectedTransaction.studentName}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {selectedTransaction.studentEmail}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                                                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                                                        ${selectedTransaction.amount} {selectedTransaction.currency}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Method</span>
                                                    <div className="flex items-center">
                                                        {getMethodIcon(selectedTransaction.method)}
                                                        <span className="ml-2 capitalize text-gray-800 dark:text-gray-100">
                                                            {selectedTransaction.method}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                                                    <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getStatusColor(selectedTransaction.status)}`}>
                                                        {getStatusIcon(selectedTransaction.status)}
                                                        <span className="ml-1">{selectedTransaction.status.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Transaction Info</h5>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</span>
                                                    <span className="font-mono text-sm text-gray-800 dark:text-gray-100">
                                                        {selectedTransaction.transactionId || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                                                    <span className="text-sm text-gray-800 dark:text-gray-100">
                                                        {selectedTransaction.createdAt.toLocaleString()}
                                                    </span>
                                                </div>
                                                {selectedTransaction.completedAt && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                                                        <span className="text-sm text-gray-800 dark:text-gray-100">
                                                            {selectedTransaction.completedAt.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Lesson Preview */}
                                {selectedTransaction.lessonPreview && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                                                Lesson Preview
                                            </h3>
                                            <button
                                                onClick={() => setShowPreview(!showPreview)}
                                                className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                                            >
                                                {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                                    {selectedTransaction.lessonTitle}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    {selectedTransaction.lessonPreview.description}
                                                </p>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                                                    <span>Duration: {Math.floor(selectedTransaction.lessonPreview.duration / 60)}m</span>
                                                    <span>Course: {selectedTransaction.courseTitle}</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <img
                                                    src={selectedTransaction.lessonPreview.thumbnailUrl}
                                                    alt={selectedTransaction.lessonTitle}
                                                    className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setShowPreview(!showPreview)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <AnimatePresence>
                                            {showPreview && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-4"
                                                >
                                                    <video
                                                        src={selectedTransaction.lessonPreview.videoUrl}
                                                        controls
                                                        className="w-full rounded-lg"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                        <Shield className="w-5 h-5 mr-2 text-purple-600" />
                                        Security Metadata
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">IP Address</span>
                                                <span className="font-mono text-sm text-gray-800 dark:text-gray-100">
                                                    {selectedTransaction.metadata.ipAddress}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Device</span>
                                                <div className="flex items-center">
                                                    {getDeviceIcon(selectedTransaction.metadata.device)}
                                                    <span className="ml-2 text-sm text-gray-800 dark:text-gray-100">
                                                        {selectedTransaction.metadata.device}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Browser</span>
                                                <span className="text-sm text-gray-800 dark:text-gray-100">
                                                    {selectedTransaction.metadata.browser}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                                                <span className="text-sm text-gray-800 dark:text-gray-100">
                                                    {selectedTransaction.metadata.location || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Risk Level</span>
                                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium">
                                                    LOW
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Actions */}
                                {selectedTransaction.status === 'pending' && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                            Verification Actions
                                        </h3>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setVerificationAction('verify')}
                                                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    verificationAction === 'verify'
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                                                }`}
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Verify Payment
                                            </motion.button>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setVerificationAction('reject')}
                                                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    verificationAction === 'reject'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                                }`}
                                            >
                                                <XCircle className="w-5 h-5 mr-2" />
                                                Reject Payment
                                            </motion.button>
                                        </div>
                                        
                                        {verificationAction && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mb-4"
                                            >
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Verification Notes {verificationAction === 'reject' ? '(Required)' : '(Optional)'}
                                                </label>
                                                <textarea
                                                    value={verificationNotes}
                                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                                    placeholder={verificationAction === 'reject' 
                                                        ? 'Please provide reason for rejection...' 
                                                        : 'Add any verification notes...'}
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-300"
                                                    rows={4}
                                                />
                                            </motion.div>
                                        )}
                                        
                                        {verificationAction && (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleVerification}
                                                disabled={isProcessing || (verificationAction === 'reject' && !verificationNotes.trim())}
                                                className={`w-full p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    verificationAction === 'verify'
                                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                                                } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        {verificationAction === 'verify' ? (
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                        )}
                                                        {verificationAction === 'verify' ? 'Verify Payment' : 'Reject Payment'}
                                                    </>
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                    No Transaction Selected
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Select a transaction from the list to review
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default PaymentVerification;
