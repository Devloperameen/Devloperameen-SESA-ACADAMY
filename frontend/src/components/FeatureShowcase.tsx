import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bot, Users, BarChart3, Accessibility, Mic, Eye, 
    Brain, MessageCircle, PenTool, TrendingUp, Target, 
    Lightbulb, Zap, Shield, Globe, Smartphone 
} from 'lucide-react';

const FeatureShowcase: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            id: 'ai-tutor',
            title: 'AI-Powered Personal Tutor',
            description: 'Get personalized learning assistance with our advanced AI tutor that adapts to your learning style and pace.',
            icon: Bot,
            color: 'blue',
            highlights: [
                'Personalized learning paths',
                'Real-time question answering',
                'Adaptive difficulty adjustment',
                'Study plan generation',
                'Progress tracking & insights'
            ],
            demo: 'Interactive AI conversations that understand context and provide detailed explanations'
        },
        {
            id: 'collaboration',
            title: 'Real-Time Study Rooms',
            description: 'Collaborate with peers in virtual study rooms with whiteboard, voice chat, and screen sharing.',
            icon: Users,
            color: 'green',
            highlights: [
                'Virtual whiteboards',
                'Voice & video chat',
                'Screen sharing',
                'Group activities',
                'Real-time collaboration'
            ],
            demo: 'Live collaborative learning sessions with integrated communication tools'
        },
        {
            id: 'analytics',
            title: 'Advanced Learning Analytics',
            description: 'ML-powered insights that predict learning outcomes and identify areas for improvement.',
            icon: BarChart3,
            color: 'purple',
            highlights: [
                'Predictive analytics',
                'Learning pattern analysis',
                'Performance forecasting',
                'Risk identification',
                'Personalized recommendations'
            ],
            demo: 'Comprehensive dashboards with actionable insights for students and instructors'
        },
        {
            id: 'accessibility',
            title: 'Universal Accessibility',
            description: 'Voice navigation, screen reader support, and adaptive interfaces for inclusive learning.',
            icon: Accessibility,
            color: 'orange',
            highlights: [
                'Voice commands & navigation',
                'Screen reader optimization',
                'High contrast modes',
                'Adjustable font sizes',
                'Keyboard navigation'
            ],
            demo: 'Fully accessible platform that works with assistive technologies'
        },
        {
            id: 'mobile',
            title: 'Mobile-First Design',
            description: 'Seamless learning experience across all devices with offline capabilities.',
            icon: Smartphone,
            color: 'indigo',
            highlights: [
                'Responsive design',
                'Offline learning',
                'Touch-optimized interface',
                'Progressive Web App',
                'Cross-platform sync'
            ],
            demo: 'Native mobile experience with full feature parity'
        },
        {
            id: 'security',
            title: 'Enterprise Security',
            description: 'Bank-level security with encryption, compliance, and privacy protection.',
            icon: Shield,
            color: 'red',
            highlights: [
                'End-to-end encryption',
                'GDPR compliance',
                'Multi-factor authentication',
                'Regular security audits',
                'Data privacy controls'
            ],
            demo: 'Secure learning environment with comprehensive privacy protection'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors = {
            blue: 'bg-blue-500 text-white border-blue-500',
            green: 'bg-green-500 text-white border-green-500',
            purple: 'bg-purple-500 text-white border-purple-500',
            orange: 'bg-orange-500 text-white border-orange-500',
            indigo: 'bg-indigo-500 text-white border-indigo-500',
            red: 'bg-red-500 text-white border-red-500'
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    const getGradientClasses = (color: string) => {
        const gradients = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
            indigo: 'from-indigo-500 to-indigo-600',
            red: 'from-red-500 to-red-600'
        };
        return gradients[color as keyof typeof gradients] || gradients.blue;
    };

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                    >
                        Revolutionary Learning Features
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                    >
                        Experience the future of education with AI-powered learning, real-time collaboration, 
                        and advanced analytics that adapt to every learner's needs.
                    </motion.p>
                </div>

                {/* Feature Navigation */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.button
                                key={feature.id}
                                onClick={() => setActiveFeature(index)}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-full border-2 transition-all duration-300 ${
                                    activeFeature === index
                                        ? getColorClasses(feature.color)
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{feature.title}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Feature Display */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeFeature}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Feature Info */}
                            <div className="p-8 lg:p-12">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${getGradientClasses(features[activeFeature].color)} mb-6`}>
                                    {React.createElement(features[activeFeature].icon, { 
                                        className: "w-8 h-8 text-white" 
                                    })}
                                </div>
                                
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                    {features[activeFeature].title}
                                </h3>
                                
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                                    {features[activeFeature].description}
                                </p>

                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Key Features:
                                    </h4>
                                    <ul className="space-y-3">
                                        {features[activeFeature].highlights.map((highlight, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center space-x-3"
                                            >
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getGradientClasses(features[activeFeature].color)}`} />
                                                <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                <motion.button
                                    className={`mt-8 px-8 py-3 rounded-lg bg-gradient-to-r ${getGradientClasses(features[activeFeature].color)} text-white font-semibold hover:shadow-lg transition-all duration-300`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Try This Feature
                                </motion.button>
                            </div>

                            {/* Feature Demo/Visual */}
                            <div className={`bg-gradient-to-br ${getGradientClasses(features[activeFeature].color)} p-8 lg:p-12 flex items-center justify-center`}>
                                <div className="text-center text-white">
                                    <div className="w-32 h-32 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                        {React.createElement(features[activeFeature].icon, { 
                                            className: "w-16 h-16 text-white" 
                                        })}
                                    </div>
                                    <h4 className="text-xl font-semibold mb-4">Live Demo</h4>
                                    <p className="text-white text-opacity-90">
                                        {features[activeFeature].demo}
                                    </p>
                                    
                                    {/* Interactive Demo Elements */}
                                    <div className="mt-8 space-y-4">
                                        {activeFeature === 0 && (
                                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Bot className="w-5 h-5" />
                                                    <span className="font-medium">AI Tutor</span>
                                                </div>
                                                <p className="text-sm text-white text-opacity-80">
                                                    "I can help you understand complex concepts with personalized explanations..."
                                                </p>
                                            </div>
                                        )}
                                        
                                        {activeFeature === 1 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white bg-opacity-20 rounded p-2 text-xs">
                                                    <MessageCircle className="w-4 h-4 mb-1" />
                                                    Live Chat
                                                </div>
                                                <div className="bg-white bg-opacity-20 rounded p-2 text-xs">
                                                    <PenTool className="w-4 h-4 mb-1" />
                                                    Whiteboard
                                                </div>
                                            </div>
                                        )}
                                        
                                        {activeFeature === 2 && (
                                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                                                <div className="text-2xl font-bold">87%</div>
                                                <div className="text-sm">Predicted Success Rate</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8"
                >
                    {[
                        { icon: Brain, label: 'AI Interactions', value: '10M+', color: 'blue' },
                        { icon: Users, label: 'Active Learners', value: '50K+', color: 'green' },
                        { icon: Target, label: 'Success Rate', value: '94%', color: 'purple' },
                        { icon: Globe, label: 'Countries', value: '120+', color: 'orange' }
                    ].map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={index} className="text-center">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getGradientClasses(stat.color)} mb-4`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                    {stat.label}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureShowcase;