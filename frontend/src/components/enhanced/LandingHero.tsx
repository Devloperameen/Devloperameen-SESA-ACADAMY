// Enhanced Landing Hero Component with Modern Design
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Play, 
    ArrowRight, 
    Star, 
    Users, 
    Award, 
    Sparkles,
    BookOpen,
    ChevronDown,
    Zap,
    Target,
    Globe
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface HeroStatsProps {
    end: number;
    suffix?: string;
    label: string;
    description: string;
}

const HeroStats: React.FC<HeroStatsProps> = ({ end, suffix, label, description }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = end / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        
        return () => clearInterval(timer);
    }, [end]);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
        >
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium mt-1">
                {label}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
            </div>
        </motion.div>
    );
};

const EnhancedLandingHero: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const features = [
        {
            icon: <BookOpen className="w-6 h-6" />,
            title: t('Expert-Led Courses', 'የምር ትርርትርት'),
            description: t('Learn from industry professionals', 'ከፍተኛ ከምርርትርትርት የምርርትርትርት')
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: t('Collaborative Learning', 'የምርርትርት ትርርትርት'),
            description: t('Connect with learners worldwide', 'ከፍተኛ ከምርርትርትርት የምርርትርትርት')
        },
        {
            icon: <Award className="w-6 h-6" />,
            title: t('Certifications', 'የምርርትርትርት'),
            description: t('Earn recognized certificates', 'የምርርትርትርት የምርርትርትርት')
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: t('AI-Powered Learning', 'AI የምርርትርት'),
            description: t('Personalized learning paths', 'የምርርትርት የምርርትርትርት')
        }
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-black opacity-50"></div>
                
                {/* Floating orbs */}
                <motion.div
                    className="absolute w-96 h-96 rounded-full bg-purple-500 opacity-20 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -100, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        left: '10%',
                        top: '20%',
                    }}
                />
                
                <motion.div
                    className="absolute w-64 h-64 rounded-full bg-blue-500 opacity-20 blur-2xl"
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        right: '15%',
                        bottom: '20%',
                    }}
                />
                
                {/* Mouse follower */}
                <motion.div
                    className="absolute w-8 h-8 rounded-full bg-white opacity-10 blur-md"
                    animate={{
                        x: mousePosition.x - 16,
                        y: mousePosition.y - 16,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 28
                    }}
                />
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-center max-w-6xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold mb-6"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('AI-Powered Educational Platform', 'AI የምርርትርት')}
                    </motion.div>
                    
                    {/* Main Title */}
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                    >
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {t('SESA', 'ሴሴ')}
                        </span>
                        <br />
                        <span className="text-3xl md:text-4xl text-gray-300">
                            {t('Safe Educational & Skill Academy', 'የምርርትርት የምርርትርት')}
                        </span>
                    </motion.h1>
                    
                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
                    >
                        {t('Transform your learning experience with AI-powered courses, expert instructors, and personalized skill development', 'ከፍተኛ የምርርትርትርት የምርርትርትርት')}
                    </motion.p>
                    
                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/student/browse')}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            {t('Browse Courses', 'የምርርትርት')}
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/auth/login')}
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center"
                        >
                            <Target className="w-5 h-5 mr-2" />
                            {t('Start Learning', 'የምርርትርት')}
                        </motion.button>
                    </motion.div>
                    
                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 0.8 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
                    >
                        <HeroStats
                            end={10000}
                            suffix="+"
                            label={t('Active Learners', 'የምርርትርት')}
                            description={t('From around the world', 'ከፍተኛ ከምርርትርት')}
                        />
                        <HeroStats
                            end={500}
                            suffix="+"
                            label={t('Expert Instructors', 'የምርርትርት')}
                            description={t('Industry professionals', 'ከምርርትርትርት')}
                        />
                        <HeroStats
                            end={95}
                            suffix="%"
                            label={t('Success Rate', 'የምርርትርት')}
                            description={t('Career advancement', 'የምርርትርትርት')}
                        />
                        <HeroStats
                            end={24}
                            suffix="/7"
                            label={t('Support Available', 'የምርርትርት')}
                            description={t('Always here to help', 'ሁልኛ የምርርትርት')}
                        />
                    </motion.div>
                    
                    {/* Features Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2, duration: 0.8 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.5 + index * 0.1, duration: 0.6 }}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <div className="flex items-center mb-4">
                                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 className="text-white font-semibold mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-300 text-sm">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                    
                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3.5, duration: 0.8 }}
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-white/50"
                        >
                            <ChevronDown className="w-6 h-6" />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default EnhancedLandingHero;
