import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Brain, AlertTriangle, Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface LearningPattern {
    userId: string;
    userName: string;
    averageSessionDuration: number;
    learningVelocity: number;
    engagementScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
}

interface AdvancedAnalyticsProps {
    courseId?: string;
    userRole: string;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ courseId, userRole }) => {
    const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
    const [courseInsights, setCourseInsights] = useState<any>(null);
    const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null);
    const [predictions, setPredictions] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('patterns');

    useEffect(() => {
        fetchAnalyticsData();
        
        // Set up real-time updates
        const interval = setInterval(fetchRealtimeMetrics, 30000); // Update every 30 seconds
        
        return () => clearInterval(interval);
    }, [courseId]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            
            const [patternsRes, insightsRes, metricsRes, predictionsRes] = await Promise.all([
                fetch(`/api/advanced-analytics/learning-patterns${courseId ? `?courseId=${courseId}` : ''}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                courseId ? fetch(`/api/advanced-analytics/course-insights/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }) : Promise.resolve(null),
                fetch('/api/advanced-analytics/realtime', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch('/api/advanced-analytics/predictions?type=engagement', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            if (patternsRes.ok) {
                const patternsData = await patternsRes.json();
                setLearningPatterns(patternsData.patterns);
            }

            if (insightsRes && insightsRes.ok) {
                const insightsData = await insightsRes.json();
                setCourseInsights(insightsData);
            }

            if (metricsRes.ok) {
                const metricsData = await metricsRes.json();
                setRealtimeMetrics(metricsData.metrics);
            }

            if (predictionsRes.ok) {
                const predictionsData = await predictionsRes.json();
                setPredictions(predictionsData.predictions);
            }

        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRealtimeMetrics = async () => {
        try {
            const response = await fetch('/api/advanced-analytics/realtime', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setRealtimeMetrics(data.metrics);
            }
        } catch (error) {
            console.error('Error fetching realtime metrics:', error);
        }
    };

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Advanced Learning Analytics
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    AI-powered insights and predictive analytics for enhanced learning outcomes
                </p>
            </div>

            {/* Real-time Metrics */}
            {realtimeMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                    >
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {realtimeMetrics.activeUsers}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                    >
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Lessons</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {realtimeMetrics.completedLessons}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                    >
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quiz Attempts</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {realtimeMetrics.quizAttempts}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                    >
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Session</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {Math.round(realtimeMetrics.averageSessionTime)}m
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6">
                        {['patterns', 'insights', 'predictions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'patterns' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Learning Patterns Analysis
                            </h3>
                            
                            {/* Engagement Score Distribution */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                                    Engagement Score Distribution
                                </h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={learningPatterns.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="userName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="engagementScore" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Risk Level Distribution */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                                    Student Risk Levels
                                </h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Low Risk', value: learningPatterns.filter(p => p.riskLevel === 'low').length },
                                                { name: 'Medium Risk', value: learningPatterns.filter(p => p.riskLevel === 'medium').length },
                                                { name: 'High Risk', value: learningPatterns.filter(p => p.riskLevel === 'high').length }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {[0, 1, 2].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {activeTab === 'insights' && courseInsights && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Course Performance Insights
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                        Completion Rate
                                    </h4>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {courseInsights.insights.completionRate.toFixed(1)}%
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                        Average Score
                                    </h4>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {courseInsights.insights.averageScore.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {courseInsights.insights.dropoffPoints.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
                                    <h4 className="text-md font-medium text-red-900 dark:text-red-100 mb-2 flex items-center">
                                        <AlertTriangle className="w-5 h-5 mr-2" />
                                        Drop-off Points
                                    </h4>
                                    <ul className="list-disc list-inside text-red-800 dark:text-red-200">
                                        {courseInsights.insights.dropoffPoints.map((point: string, index: number) => (
                                            <li key={index}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'predictions' && predictions && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Predictive Analytics
                            </h3>
                            
                            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                                <h4 className="text-md font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                                    <Target className="w-5 h-5 mr-2" />
                                    Engagement Prediction
                                </h4>
                                <p className="text-blue-800 dark:text-blue-200">
                                    Trend: {predictions.trend} | Projected: {predictions.projectedEngagement}%
                                </p>
                                <div className="mt-2">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Peak engagement times: {predictions.peakTimes?.join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;