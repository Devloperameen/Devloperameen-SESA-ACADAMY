import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
    Award, BookOpen, CheckCircle, ChevronDown, Globe, GraduationCap, Heart, ImageIcon, Lock, MessageSquare, Monitor, Play, Quote, RefreshCcw, Rocket, Search, Shield, Sparkles, Star, Target, TrendingUp, Trophy, UserPlus, Users, Zap
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SafeImage } from '../components/ui/SafeImage';
import SectionNav from '../components/landing/SectionNav';

/* ─── helpers ─── */
const Counter: React.FC<{ end: number; suffix?: string }> = ({ end, suffix = '' }) => {
    const [c, setC] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const iv = useInView(ref, { once: true });
    useEffect(() => { if (!iv) return; let v = 0; const s = end / 100; const id = setInterval(() => { v += s; if (v >= end) { setC(end); clearInterval(id); } else setC(Math.floor(v)); }, 16); return () => clearInterval(id); }, [iv, end]);
    return <span ref={ref}>{c.toLocaleString()}{suffix}</span>;
};
const Fade: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => {
    const ref = useRef(null); const iv = useInView(ref, { once: true, margin: '-50px' });
    return <motion.section ref={ref} id={id} initial={{ opacity: 0, y: 40 }} animate={iv ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className={className}>{children}</motion.section>;
};

const QS = [
    { t: "Curiosity is the wick in the candle of learning.", a: "William Arthur Ward", e: "🕯️", c: "Curiosity" },
    { t: "Wisdom begins in wonder.", a: "Socrates", e: "🤔", c: "Curiosity" },
    { t: "Be curious, not judgmental.", a: "Walt Whitman", e: "🧐", c: "Curiosity" },
    { t: "Stay hungry for knowledge.", a: "Unknown", e: "📚", c: "Curiosity" },
    
    { t: "Success is the sum of small efforts repeated daily.", a: "Robert Collier", e: "📊", c: "Success" },
    { t: "The secret of success is constancy of purpose.", a: "Benjamin Disraeli", e: "🎯", c: "Success" },
    { t: "Success usually comes to those who are too busy to be looking for it.", a: "Henry David Thoreau", e: "🏆", c: "Success" },
    { t: "Success is earned, not given.", a: "Unknown", e: "🏆", c: "Success" },
    
    { t: "Education is the passport to the future.", a: "Malcolm X", e: "🛂", c: "Education" },
    { t: "The beautiful thing about learning is nobody can take it away from you.", a: "B.B. King", e: "📚", c: "Education" },
    { t: "Education is the movement from darkness to light.", a: "Allan Bloom", e: "🌅", c: "Education" },
    { t: "Education is the foundation of every nation.", a: "Kofi Annan", e: "🌍", c: "Education" },
    
    { t: "Self-discipline is the magic power that makes you virtually unstoppable.", a: "Dan Kennedy", e: "🧭", c: "Discipline" },
    { t: "Discipline today creates success tomorrow.", a: "Unknown", e: "🌅", c: "Discipline" },
    { t: "Be stronger than your excuses.", a: "Unknown", e: "💪", c: "Discipline" },
    { t: "Confidence comes from discipline and training.", a: "Robert Kiyosaki", e: "💪", c: "Discipline" },
    
    { t: "Small daily improvements over time lead to stunning results.", a: "Robin Sharma", e: "📈", c: "Productivity" },
    { t: "Your future is created by what you do today.", a: "Robert Kiyosaki", e: "🏗️", c: "Productivity" },
    { t: "Consistency is more important than perfection.", a: "Unknown", e: "📅", c: "Productivity" },
    { t: "Stay positive. Work hard. Make it happen.", a: "Unknown", e: "⚡", c: "Productivity" }
];

// Rotating background images for hero section
const HERO_IMAGES = [
    '/sesa-tech-brand.png',
    '/hero-students.png',
    '/gallery-hijabi-teacher.png',
    '/gallery-men-vision.png',
    '/gallery-discussion.png',
    '/gallery-prize.png',
    '/sesa-student.png',
    '/gallery-vision.png',
    '/hero-tech.png',
    '/sesa-tech-brand.png',
];

const BRAND_GLOBE = String.fromCodePoint(0x1f30d);

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [qi, setQi] = useState(0);
    const [heroIndex, setHeroIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMotivationCat, setActiveMotivationCat] = useState('Success');

    const motivationCategories = {
        Curiosity: [
            { id: 'JjvN_hYDp3g', title: 'The Power of Curiosity', author: 'Motivation Hub' },
            { id: 'g6BtbIiJ_rc', title: 'Explore & Discover', author: 'Learning Channel' },
            { id: 'V04ojClenZU', title: 'Question Everything', author: 'Curiosity Lab' },
            { id: 'ZXsQAXx_ao0', title: 'Never Stop Learning', author: 'Inspire Daily' },
            { id: 'mgmVOuLgFB0', title: 'Curiosity Drives Success', author: 'Motivation Pro' },
            { id: '26U_seo0a1g', title: 'Ask Why', author: 'Learning First' },
            { id: 'UNQhuFL6CWg', title: 'Discover Your Potential', author: 'Growth Mindset' },
            { id: 'lsSC2vx7zFQ', title: 'The Learning Journey', author: 'Education Hub' }
        ],
        Success: [
            { id: 'UAZJC-yirR0', title: 'The Power of Persistence', author: 'Motivation Madness' },
            { id: 'InjJ7WIpsZE', title: 'Success Mindset', author: 'Success Stories' },
            { id: 'r6zFZQm0hcc', title: 'Keys to Success', author: 'Motivation Hub' },
            { id: 'wnHW6o8WMas', title: 'Achieve Your Dreams', author: 'Brian Tracy' },
            { id: 'tbnzAVRZ9Xc', title: 'Never Give Up', author: 'Success Academy' },
            { id: 'IdTMDpizis8', title: 'Rise to Greatness', author: 'Inspire Nation' },
            { id: 'KxGRhd_iWuE', title: 'Champion Mindset', author: 'Winners Circle' },
            { id: 'p0p1fjLPjYQ', title: 'Unstoppable', author: 'Motivation Daily' },
            { id: 'TQMbvJNRpLE', title: 'Dream Big', author: 'Success Pro' },
            { id: 'ZiXG3tK3o7A', title: 'Victory Path', author: 'Achievement Hub' },
            { id: 'fviFNrWKzZ8', title: 'Success Formula', author: 'Goal Getters' },
            { id: 'WtfY9lJY5nA', title: 'Breakthrough', author: 'Success Masters' }
        ],
        Education: [
            { id: 'AJ1-WE1B2Ss', title: 'Why Knowledge is Power', author: 'Education First' },
            { id: 'jpLp7NdsbOI', title: 'Learning How to Learn', author: 'SESA Insights' },
            { id: 'U5lZ7j7bXJ4', title: 'Study Smart', author: 'Academic Excellence' },
            { id: '3sK3wJAxGfs', title: 'Knowledge Journey', author: 'Learning Pro' },
            { id: '5MgBikgcWnY', title: 'Education Matters', author: 'Study Hub' },
            { id: '_xkSvufmjEs', title: 'Learn & Grow', author: 'Education Plus' },
            { id: 'sm1mokevMWk', title: 'Student Success', author: 'Academic Pro' },
            { id: 'jG3E2Z9b7UQ', title: 'Power of Learning', author: 'Study Masters' }
        ],
        Discipline: [
            { id: 'kXH36VoLuZI', title: 'The Secret to Discipline', author: 'Discipline Pro' },
            { id: 'dJrzwXPY6Q8', title: 'Build Self-Control', author: 'Work Ethic' },
            { id: '7XFLTDQ4JMk', title: 'Daily Discipline', author: 'Habit Builder' },
            { id: '2OEL4P1Rz04', title: 'Master Your Habits', author: 'Discipline Hub' },
            { id: '4pLUleLdwY4', title: 'Willpower Training', author: 'Mental Strength' },
            { id: '0ZpJ9Qh9iJk', title: 'Self-Control Mastery', author: 'Discipline First' },
            { id: 'V1bFr2SWP1I', title: 'Build Strong Habits', author: 'Habit Pro' },
            { id: 'g-jwWYX7Jlo', title: 'Discipline Equals Freedom', author: 'Work Hard' }
        ],
        Productivity: [
            { id: 'Pq2uwssaFRo', title: 'Master Your Time', author: 'Productivity Hub' },
            { id: 'ZXGWYe01Ya8', title: 'Stop Procrastinating', author: 'Focus Academy' },
            { id: '2Lz0VOltZKA', title: 'Get Things Done', author: 'Efficiency Pro' },
            { id: '9vJRopau0g0', title: 'Peak Performance', author: 'Time Master' },
            { id: 'ScMzIvxBSi4', title: 'Focus & Flow', author: 'Productivity Plus' },
            { id: 'd6wRkzCW5qI', title: 'Time Management', author: 'Efficiency Hub' },
            { id: '8aShfolR6w8', title: 'Work Smart', author: 'Productivity Pro' },
            { id: 'ZiF3R9QZpXo', title: 'Maximum Output', author: 'Performance Hub' },
            { id: 'bS4Q-WWyl3Q', title: 'Efficiency Hacks', author: 'Time Pro' },
            { id: '5p7f3kY2j3k', title: 'Deep Work', author: 'Focus Masters' },
            { id: 'oHg5SJYRHA0', title: 'Productivity Secrets', author: 'Work Genius' },
            { id: '1bumPyvzCyo', title: 'Time Mastery', author: 'Efficiency First' },
            { id: 'wnh9NmU_oKc', title: 'Get More Done', author: 'Productivity King' },
            { id: 'Lp7E973zozc', title: 'Focus Power', author: 'Concentration Pro' },
            { id: 'xoVJKj8lcNQ', title: 'Work Excellence', author: 'Performance Pro' },
            { id: 'Ml6cWf9D7Fg', title: 'Ultimate Productivity', author: 'Efficiency Master' }
        ]
    };

    const [isWatching, setIsWatching] = useState(false);
    const [videoIndex, setVideoIndex] = useState(0); // Offset for 2 videos

    // Switching Logic: 10 minutes if not watching
    useEffect(() => {
        if (isWatching) return; // Wait if watching

        const interval = setInterval(() => {
            setVideoIndex((prev) => {
                const total = motivationCategories[activeMotivationCat as keyof typeof motivationCategories].length;
                return (prev + 2) % total;
            });
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [isWatching, activeMotivationCat, motivationCategories]);

    useEffect(() => {
        setVideoIndex(0);
        setIsWatching(false);
    }, [activeMotivationCat]);

    const activeQuotes = QS.filter(quote => quote.c === activeMotivationCat);
    const q = activeQuotes[qi % activeQuotes.length] || QS[0];

    const [selectedImage, setSelectedImage] = useState<{ img: string; title: string } | null>(null);
    const nq = () => { let n; do { n = Math.floor(Math.random() * QS.length); } while (n === qi); setQi(n); };
    useEffect(() => { const id = setInterval(nq, 7000); return () => clearInterval(id); }, [qi]);
    useEffect(() => {
        const rotateId = window.setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 4000);
        return () => window.clearInterval(rotateId);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/student/browse?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const techStack = [
        { n: 'React', i: '⚛️', c: 'from-cyan-400 to-blue-500', d: t('Dynamic UIs', 'ዳይናሚክ UI'), lvl: t('Beginner → Advanced', 'ጀማሪ → ከፍተኛ'), topics: ['Components', 'Hooks', 'State', 'Router'] },
        { n: 'Node.js', i: '🟢', c: 'from-green-400 to-emerald-600', d: t('Server JS', 'ሰርቨር JS'), lvl: t('Beginner → Advanced', 'ጀማሪ → ከፍተኛ'), topics: ['Express', 'APIs', 'Auth', 'Deploy'] },
        { n: 'MongoDB', i: '🍃', c: 'from-green-500 to-green-700', d: t('NoSQL DB', 'NoSQL ዳታቤዝ'), lvl: t('Beginner → Intermediate', 'ጀማሪ → መካከለኛ'), topics: ['CRUD', 'Schemas', 'Aggregation', 'Atlas'] },
        { n: 'Express', i: '🚂', c: 'from-gray-500 to-gray-700', d: t('Backend', 'ባክኤንድ'), lvl: t('Beginner → Advanced', 'ጀማሪ → ከፍተኛ'), topics: ['Routes', 'Middleware', 'REST', 'Security'] },
        { n: 'Next.js', i: '▲', c: 'from-gray-800 to-black', d: t('Full-stack', 'ፉል-ስታክ'), lvl: t('Intermediate → Advanced', 'መካከለኛ → ከፍተኛ'), topics: ['SSR', 'SSG', 'API Routes', 'Deploy'] },
        { n: 'Python', i: '🐍', c: 'from-yellow-400 to-blue-500', d: t('AI & ML', 'AI እና ML'), lvl: t('Beginner → Advanced', 'ጀማሪ → ከፍተኛ'), topics: ['Basics', 'Django', 'ML', 'Data Science'] },
        { n: 'TypeScript', i: '🔷', c: 'from-blue-500 to-blue-700', d: t('Type-safe', 'ታይፕ-ሴፍ'), lvl: t('Beginner → Intermediate', 'ጀማሪ → መካከለኛ'), topics: ['Types', 'Interfaces', 'Generics', 'Config'] },
        { n: 'Tailwind', i: '🎨', c: 'from-teal-400 to-cyan-500', d: t('Modern CSS', 'ዘመናዊ CSS'), lvl: t('Beginner → Intermediate', 'ጀማሪ → መካከለኛ'), topics: ['Utility', 'Responsive', 'Components', 'Themes'] },
    ];

    const grades = [
        { g: t('Grade 9', '9ኛ ክፍል'), s: ['Biology', 'Chemistry', 'Physics', 'Math', 'English', 'Civics'], c: 'from-blue-500 to-cyan-400', e: '📘' },
        { g: t('Grade 10', '10ኛ ክፍል'), s: ['Biology', 'Chemistry', 'Physics', 'Math', 'English', 'IT'], c: 'from-emerald-500 to-teal-400', e: '📗' },
        { g: t('Grade 11', '11ኛ ክፍል'), s: ['Biology', 'Chemistry', 'Physics', 'Math', 'English', 'Economics'], c: 'from-purple-500 to-violet-400', e: '📙' },
        { g: t('Grade 12', '12ኛ ክፍል'), s: ['Biology', 'Chemistry', 'Physics', 'Math', 'English', 'Aptitude'], c: 'from-rose-500 to-pink-400', e: '📕' },
    ];

    const demos = [
        { title: t('Biology — Part 1', 'ባዮሎጂ — ክፍል 1'), emoji: '🧬', color: 'border-emerald-500', vid: 'https://www.youtube.com/embed/QnQe0xW_JY4?autoplay=0' },
        { title: t('Physics — Part 1', 'ፊዚክስ — ክፍል 1'), emoji: '⚛️', color: 'border-blue-500', vid: 'https://www.youtube.com/embed/ZM8ECpBuQYE?autoplay=0' },
        { title: t('MERN Stack — Part 1', 'MERN ስታክ — ክፍል 1'), emoji: '🔥', color: 'border-amber-500', vid: 'https://www.youtube.com/embed/7CqJlxBYj-M?autoplay=0' },
        { title: t('Python — Part 1', 'ፓይዘን — ክፍል 1'), emoji: '🐍', color: 'border-yellow-500', vid: 'https://www.youtube.com/embed/kqtD5dpn9C8?autoplay=0' },
        { title: t('Software Eng — Part 1', 'ሶፍትዌር ኢንጅ — ክፍል 1'), emoji: '💻', color: 'border-purple-500', vid: 'https://www.youtube.com/embed/ZXGWYe01Ya8?autoplay=0' },
    ];


    return (
        <div className="overflow-hidden relative">
            <SectionNav />
            {/* Image Lightbox Modal with Smooth Animation */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 100 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.5, opacity: 0, y: 100 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-6xl w-full cursor-default"
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-14 right-0 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 rounded-full text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
                            >
                                <span>{t('Close', 'ዝጋ')}</span>
                                <span className="text-2xl leading-none">×</span>
                            </button>
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                                <SafeImage
                                    src={selectedImage.img}
                                    alt={selectedImage.title}
                                    className="w-full h-auto max-h-[85vh] object-contain bg-gradient-to-br from-slate-900 to-slate-800"
                                    fallback={
                                        <div className="w-full min-h-[300px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                                            <ImageIcon className="w-16 h-16 text-white/40" />
                                        </div>
                                    }
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="px-4 py-1.5 bg-white/90 rounded-full">
                                            <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">SESA 🌍</span>
                                        </div>
                                    </div>
                                    <h3 className="text-white text-2xl md:text-3xl font-black mb-2">{selectedImage.title}</h3>
                                </div>
                            </div>
                            <p className="text-center text-white/60 text-sm mt-4">{t('Click outside or press Close to return', 'ለመመለስ ውጭ ጠቅ ያድርጉ ወይም ዝጋን ይጫኑ')}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* ══════ HERO ══════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                {/* Rotating Background Images */}
                <AnimatePresence initial={false} mode="sync">
                    <motion.div
                        key={heroIndex}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                    >
                        <SafeImage
                            src={HERO_IMAGES[heroIndex]}
                            alt="SESA Academy"
                            className="w-full h-full object-cover brightness-95 saturate-110"
                            wrapperClassName="absolute inset-0"
                            fallback={
                                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                                    <GraduationCap className="w-24 h-24 text-white/30" />
                                </div>
                            }
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Optimized Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-blue-900/60 to-slate-900/75" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

                {/* Main Content - Centered */}
                <div className="container mx-auto px-6 py-20 relative z-20">
                    <div className="max-w-3xl mx-auto text-center">
                        {/* SESA Brand - Smaller with Globe Colors */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mb-6"
                        >
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-none">
                                <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
                                    SESA
                                </span>
                                <span className="text-4xl md:text-5xl lg:text-6xl ml-2">{BRAND_GLOBE}</span>
                            </h1>
                        </motion.div>

                        {/* Main Heading - Smaller */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                                <Sparkles className="h-3.5 w-3.5" />
                                {t('aiPowered')}
                            </span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-xl md:text-2xl lg:text-3xl font-bold text-white/95 mb-5 drop-shadow-lg"
                        >
                            {t('tagline')}
                        </motion.h2>

                        {/* Description - Smaller and More Readable */}
                        <motion.p
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="text-sm md:text-base text-white/85 font-normal mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-lg"
                        >
                            {t('heroDesc')}
                        </motion.p>

                        {/* CTA Buttons - Smaller */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-3 justify-center"
                        >
                            <Link to="/auth?role=student">
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-2xl flex items-center justify-center gap-2 text-base"
                                >
                                    <Rocket className="w-5 h-5" />
                                    {t('startLearning')}
                                </motion.button>
                            </Link>
                            <a href="#demo-videos">
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255,255,255,0.2)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-white/20 backdrop-blur-xl border-2 border-white/50 text-white font-bold rounded-xl shadow-xl flex items-center justify-center gap-2 text-base"
                                >
                                    <Play className="w-5 h-5" />
                                    {t('watchDemo')}
                                </motion.button>
                            </a>
                        </motion.div>

                        {/* Course Search Teaser */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.8 }}
                            className="mt-6"
                        >
                            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md mx-auto">
                                <div className="flex-1 flex items-center gap-2 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-2.5 focus-within:border-cyan-400/70 transition-all">
                                    <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder={t('Search courses, subjects...', 'ኮርሶችን ይፈልጉ...')}
                                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 text-sm"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-2xl text-sm transition-colors shadow-lg"
                                >
                                    {t('Search', 'ፈልግ')}
                                </motion.button>
                            </form>
                            <p className="text-white/50 text-xs mt-2">{t('Popular: React, Physics, Math, Python', 'ታዋቂ: React, Physics, Math, Python')}</p>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                >
                    <ChevronDown className="w-8 h-8 text-white/70" />
                </motion.div>
            </section>

            {/* ══════ STATS ══════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className="py-6 md:py-8 bg-white dark:bg-dark-card border-y border-gray-100 dark:border-gray-800"
            >
                <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[{ i: Users, v: 5200, s: '+', l: t('students'), c: 'text-blue-500' }, { i: BookOpen, v: 120, s: '+', l: t('courses'), c: 'text-emerald-500' }, { i: Award, v: 45, s: '+', l: t('instructors'), c: 'text-amber-500' }, { i: Star, v: 98, s: '%', l: t('satisfaction'), c: 'text-rose-500' }].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="text-center p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <s.i className={`w-7 h-7 mx-auto mb-2 ${s.c}`} />
                            <p className="text-2xl md:text-3xl font-black text-dark-bg dark:text-white"><Counter end={s.v} suffix={s.s} /></p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{s.l}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ══════ MOTIVATION & INSPIRATION ══════ */}
            <Fade id="motivation" className="scroll-mt-24 py-14 md:py-24 bg-white dark:bg-dark-card border-y border-gray-100 dark:border-gray-800 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-12">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-black text-xs uppercase tracking-widest rounded-full mb-6"
                        >
                            <Sparkles className="w-4 h-4" />
                            {t('Stay Inspired', 'ተነሳሽ ይሁኑ')}
                        </motion.div>
                        <h2 className="text-3xl md:text-5xl font-black text-dark-bg dark:text-white mb-6 leading-tight">
                            Fuel Your <span className="text-primary italic">Ambition</span> with <br className="hidden md:block" />
                            Daily Inspiration
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            Transform your mindset and achieve your academic goals with curated motivational content and powerful lessons.
                        </p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {Object.keys(motivationCategories).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveMotivationCat(cat)}
                                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                                    activeMotivationCat === cat 
                                        ? 'bg-primary text-white shadow-xl shadow-primary/25 scale-105' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6 items-start">
                        {/* Videos Column - Takes 2/3 width */}
                        <div className="lg:col-span-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeMotivationCat + videoIndex}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    className="grid sm:grid-cols-2 gap-4"
                                >
                                    {motivationCategories[activeMotivationCat as keyof typeof motivationCategories]
                                        .slice(videoIndex, videoIndex + 2)
                                        .map((vid, idx) => (
                                        <motion.div
                                            key={vid.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group relative rounded-3xl overflow-hidden shadow-premium bg-black aspect-video"
                                            onClick={() => setIsWatching(true)}
                                        >
                                            <iframe 
                                                className="w-full h-full border-none" 
                                                src={`https://www.youtube.com/embed/${vid.id}?autoplay=0&controls=1&modestbranding=1&rel=0&fs=1&cc_load_policy=0&iv_load_policy=3`} 
                                                title={vid.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                                allowFullScreen 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity p-5 flex flex-col justify-end">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-black text-sm">{vid.title}</p>
                                                        <p className="text-white/70 text-xs uppercase font-bold tracking-wider">{vid.author}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                            
                            <div className="mt-4 flex justify-between items-center text-xs font-bold text-gray-400">
                                <p>{t('Showing 2 of', 'ከቀረቡት 2ቱ')} {motivationCategories[activeMotivationCat as keyof typeof motivationCategories].length}</p>
                                <button 
                                    onClick={() => setVideoIndex((prev) => (prev + 2) % motivationCategories[activeMotivationCat as keyof typeof motivationCategories].length)}
                                    className="text-primary hover:underline flex items-center gap-1"
                                >
                                    <RefreshCcw className="w-3 h-3" /> {t('Switch Videos', 'ቪዲዮዎችን ቀይር')}
                                </button>
                            </div>
                        </div>

                        {/* Quote Column - Takes 1/3 width */}
                        <motion.div 
                            initial={{ x: -30, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="lg:col-span-1"
                        >
                            {/* Quote Card - Compact */}
                            <div className="bg-white dark:bg-dark-bg rounded-3xl p-6 shadow-premium border border-gray-100 dark:border-gray-800 relative overflow-hidden group h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="mb-4">
                                        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
                                            <Quote className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.div 
                                            key={qi} 
                                            initial={{ opacity: 0, y: 20 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, y: -20 }} 
                                            className="space-y-4 flex-1 flex flex-col"
                                        >
                                            <h3 className="text-lg md:text-xl font-black text-dark-bg dark:text-white leading-tight italic flex-1">
                                                "{q.t}"
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-xl shadow-premium flex-shrink-0">
                                                    {q.e}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-dark-bg dark:text-white text-sm">{q.a}</p>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('Daily Spark', 'ዕለታዊ ብልጭታ')}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                    
                                    <div className="mt-6 flex items-center justify-between">
                                        <button onClick={nq} className="p-3 bg-primary text-white rounded-xl shadow-xl hover:scale-110 active:scale-95 transition-all">
                                            <RefreshCcw className="w-4 h-4" />
                                        </button>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">{t('Source', 'ምንጭ')}</p>
                                            <p className="text-xs font-bold text-primary">SESA Inspiration</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* CTA Banner */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-8 p-6 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Target className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-bold text-dark-bg dark:text-white">
                                {t('Did you know? Consistent learning increases retention by 40%.', 'በቋሚነት መማር የማስታወስ ችሎታን በ40% ይጨምራል።')}
                            </p>
                        </div>
                        <Link to="/auth?role=student" className="whitespace-nowrap px-6 py-2 bg-dark-bg dark:bg-white text-white dark:text-dark-bg font-black text-xs rounded-xl hover:scale-105 transition-all">
                            Start Learning Now
                        </Link>
                    </motion.div>
                </div>
            </Fade>

            {/* ══════ WHY CHOOSE SESA ══════ */}
            <Fade id="why-sesa" className="scroll-mt-24 py-14 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0">
                    <SafeImage src="/gallery-vision.png" alt="" className="w-full h-full object-cover" wrapperClassName="absolute inset-0" fallback={<div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900" />} />
                    <div className="absolute inset-0 bg-dark-bg/90 dark:bg-dark-bg/95" />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-1.5 bg-yellow-400/20 text-yellow-400 font-bold text-sm rounded-full mb-4">⭐ {t('Why Choose SESA?', 'ለምን ሴሳ ይመረጣል?')}</span>
                        <h2 className="text-3xl md:text-4xl font-black text-white">{t('Why Students & Teachers Choose', 'ተማሪዎች እና መምህራን ለምን ይመርጣሉ')} <span className="text-primary">SESA 🌍</span></h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            { i: Zap, t: t('Exam-Focused', 'ፈተና-ተኮር'), d: t('Aligned with Ethiopian national exams for Grade 9-12', 'ከ9-12ኛ ክፍል ብሔራዊ ፈተና ጋር የተቃኘ'), c: 'text-yellow-400' },
                            { i: Globe, t: t('Bilingual', 'ሁለት ቋንቋ'), d: t('Full English & Amharic support across all content', 'ሙሉ እንግሊዝኛ እና አማርኛ ድጋፍ'), c: 'text-blue-400' },
                            { i: Monitor, t: t('Video Lessons', 'ቪዲዮ ትምህርት'), d: t('HD video tutorials by expert Ethiopian instructors', 'በባለሙያ ኢትዮጵያውያን መምህራን HD ቪዲዮ'), c: 'text-emerald-400' },
                            { i: Shield, t: t('Secure Platform', 'ደህንነቱ የተጠበቀ'), d: t('Role-based access with enterprise security', 'በሚና ላይ የተመሰረተ ደህንነት'), c: 'text-purple-400' },
                            { i: TrendingUp, t: t('Track Progress', 'ግስጋሴ ይከታተሉ'), d: t('Dashboard with analytics & performance insights', 'ትንታኔ እና የአፈፃፀም ዳሽቦርድ'), c: 'text-rose-400' },
                            { i: Target, t: t('Career Ready', 'ለሥራ ዝግጁ'), d: t('MERN, Python, Next.js — real-world tech skills', 'MERN, Python, Next.js — ተግባራዊ ክህሎቶች'), c: 'text-cyan-400' },
                        ].map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
                                <f.i className={`w-8 h-8 ${f.c} mb-3`} />
                                <h3 className="text-lg font-bold text-white mb-1">{f.t}</h3>
                                <p className="text-sm text-white/60 leading-relaxed">{f.d}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Fade>

            {/* ══════ TECH STACK — ENROLLMENT CARDS ══════ */}
            <Fade id="subjects" className="scroll-mt-28 md:scroll-mt-32 py-14 md:py-20 bg-gray-50 dark:bg-dark-bg">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-1.5 bg-cyan-500/10 text-cyan-600 font-bold text-sm rounded-full mb-4">🔥 {t('Tech Stack Courses', 'የቴክ ስታክ ኮርሶች')}</span>
                        <h2 className="text-3xl md:text-4xl font-black text-dark-bg dark:text-white">{t('Master the MERN Stack & Beyond', 'MERN ስታክ እና ከዚያ በላይ')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">{t('From beginner to advanced — each course has structured levels. Enroll and start your journey!', 'ከጀማሪ እስከ ከፍተኛ — እያንዳንዱ ኮርስ የተዋቀረ ደረጃዎች አሉት። ይመዝገቡ!')}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {techStack.map((x, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileHover={{ y: -6 }}
                                className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${x.c} flex items-center justify-center text-2xl shadow-lg mb-3 group-hover:scale-110 transition-transform`}>{x.i}</div>
                                <h3 className="text-lg font-bold text-dark-bg dark:text-white mb-1">{x.n}</h3>
                                <p className="text-xs text-gray-500 mb-1">{x.d}</p>
                                <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded-full mb-3">{x.lvl}</span>
                                <div className="space-y-1.5 mb-4">
                                    {x.topics.map((topic, j) => (
                                        <div key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{topic}
                                        </div>
                                    ))}
                                </div>
                                <Link to="/auth?role=student"><button className="w-full py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary hover:text-white transition-all">{t('Enroll', 'ይመዝገቡ')} →</button></Link>
                            </motion.div>
                        ))}
                    </div>
                    {/* MERN formula banner */}
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl p-6 text-center text-white">
                        <div className="flex items-center justify-center gap-2 flex-wrap text-lg md:text-2xl lg:text-3xl font-black mb-2">🍃 MongoDB <span className="text-white/40">+</span> 🚂 Express <span className="text-white/40">+</span> ⚛️ React <span className="text-white/40">+</span> 🟢 Node <span className="text-white/40">=</span> 🔥 MERN</div>
                        <p className="text-white/80 text-sm max-w-lg mx-auto">{t('The most powerful full-stack combo — master it at SESA Academy!', 'በጣም ኃይለኛ ፉል-ስታክ — በሴሳ ይለማመዱ!')}</p>
                        <Link to="/auth?role=student"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 px-8 py-3 bg-white text-primary font-black rounded-2xl shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"><Rocket className="w-5 h-5" /> {t('Start Full-Stack Journey', 'ፉል-ስታክ ጉዞ ይጀምሩ')}</motion.button></Link>
                    </motion.div>
                </div>
            </Fade>

            {/* ══════ GRADE 9-12 ══════ */}
            <Fade id="grades" className="scroll-mt-24 py-14 md:py-20 bg-white dark:bg-dark-card">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-1.5 bg-purple-500/10 text-purple-600 font-bold text-sm rounded-full mb-4">🎓 {t('High School Prep', 'ሁለተኛ ደረጃ ዝግጅት')}</span>
                        <h2 className="text-3xl md:text-4xl font-black text-dark-bg dark:text-white">{t('Grade 9 — 12 Courses', 'ከ9ኛ — 12ኛ ክፍል')}</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {grades.map((g, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}
                                className="bg-gray-50 dark:bg-dark-bg rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${g.c} flex items-center justify-center text-2xl shadow-lg mb-4`}>{g.e}</div>
                                <h3 className="text-lg font-bold text-dark-bg dark:text-white mb-3">{g.g}</h3>
                                <div className="space-y-1.5">{g.s.map((subj, j) => (<div key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{subj}</div>))}</div>
                                <Link to="/auth?role=student"><button className="mt-4 w-full py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary hover:text-white transition-all">{t('Enroll', 'ይመዝገቡ')} →</button></Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Fade>

            {/* ══════ DEMO VIDEOS ══════ */}
            <Fade id="demo-videos" className="scroll-mt-28 md:scroll-mt-32 py-14 md:py-20 bg-gray-50 dark:bg-dark-bg">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <span className="inline-block px-4 py-1.5 bg-rose-500/10 text-rose-500 font-bold text-sm rounded-full mb-4">🎬 {t('Free Demo Lessons', 'ነፃ ማሳያ ትምህርቶች')}</span>
                        <h2 className="text-3xl md:text-4xl font-black text-dark-bg dark:text-white">{t('Watch Part 1 Free — Register for More!', 'ክፍል 1ን ነፃ ይመልከቱ — ለተጨማሪ ይመዝገቡ!')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">{t('Get a taste of our courses. To access all parts, register and enroll!', 'የኮርሶቻችንን ጣዕም ያጣጥሙ። ሁሉንም ለማግኘት ይመዝገቡ!')}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {demos.map((d, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`bg-white dark:bg-dark-card rounded-2xl overflow-hidden border-2 ${d.color} border-opacity-30 hover:shadow-xl transition-all`}>
                                <div className="aspect-video bg-black">
                                    <iframe className="w-full h-full border-none" src={d.vid} title={d.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="text-xl">{d.emoji}</span><h4 className="font-bold text-dark-bg dark:text-white text-sm">{d.title}</h4></div>
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full">{t('FREE', 'ነፃ')}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full font-bold text-sm mb-4"><Lock className="w-4 h-4" /> {t('Part 2, 3, 4... locked. Register to unlock all!', 'ክፍል 2, 3, 4... ተቆልፏል። ሁሉንም ለመክፈት ይመዝገቡ!')}</div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link to="/auth?role=student"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-7 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-secondary transition-all flex items-center gap-2"><UserPlus className="w-5 h-5" /> {t('Register as Student', 'እንደ ተማሪ ይመዝገቡ')}</motion.button></Link>
                            <Link to="/auth?role=instructor"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-7 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"><GraduationCap className="w-5 h-5" /> {t('Join as Instructor', 'እንደ መምህር ይቀላቀሉ')}</motion.button></Link>
                        </div>
                    </div>
                </div>
            </Fade>

            {/* ══════ GALLERY ══════ */}
            <Fade id="gallery" className="scroll-mt-28 md:scroll-mt-32 py-14 md:py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg" />
                <div className="absolute inset-0 opacity-40" style={{ 
                    backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)'
                }} />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-block px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-full shadow-lg mb-4">📸 {t('Our Gallery', 'ጋለሪያችን')}</span>
                        </motion.div>
                        <h2 className="text-3xl md:text-4xl font-black text-dark-bg dark:text-white mb-3">{t('Life at SESA Academy', 'በሴሳ አካዳሚ ህይወት')}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl mx-auto">{t('🛡️ Safe Education for Safe Ethiopia and the World 🌍', '🛡️ ለደህና ኢትዮጵያና ዓለም ደህንነቱ የተጠበቀ ትምህርት 🌍')}</p>
                    </div>

                    {/* Two Column Grid - All Equal Size */}
                    <div className="grid grid-cols-2 gap-4 md:gap-5">
                        {[
                            { img: '/gallery-hijabi-teacher.png', title: t('Inclusive Teaching 🧕', 'ሁሉን አቀፍ ትምህርት 🧕'), desc: t('Empowering Diversity in Tech', 'በቴክ ውስጥ ብዝሀነትን ማበረታታት'), icon: Heart },
                            { img: '/sesa-tech-brand.png', title: t('SESA Tech Campus', 'ሴሳ ቴክ ካምፓስ'), desc: t('Modern IT Building', 'ዘመናዊ የአይቲ ህንፃ'), icon: Monitor },
                            { img: '/gallery-prize.png', title: t('Prize Ceremony 🏆', 'ሽልማት 🏆'), desc: t('Celebrating Excellence', 'ምርጥነትን ማክበር'), icon: Trophy },
                            { img: '/gallery-discussion.png', title: t('Tech Discussion 💬', 'የቴክ ውይይት 💬'), desc: t('Collaborative Learning', 'ትብብር ትምህርት'), icon: MessageSquare },
                            { img: '/hero-students.png', title: t('Digital Ethiopia 💡', 'ዲጂታል ኢትዮጵያ 💡'), desc: t('Building the Future', 'ወደፊትን መገንባት'), icon: Globe },
                            { img: '/sesa-student.png', title: t('Our Students 🎓', 'ተማሪዎቻችን 🎓'), desc: t('Future Tech Leaders', 'የወደፊት ቴክ መሪዎች'), icon: GraduationCap },
                        ].map((g, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 20 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                viewport={{ once: true }} 
                                transition={{ delay: i * 0.08 }} 
                                whileHover={{ y: -8, scale: 1.03 }}
                                onClick={() => setSelectedImage(g)}
                                className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group cursor-pointer border-2 border-gray-100 dark:border-gray-800 hover:border-primary/50"
                            >
                                <div className="relative h-56 md:h-64 overflow-hidden">
                                    <SafeImage
                                        src={g.img}
                                        alt={g.title}
                                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                                        wrapperClassName="absolute inset-0"
                                        fallback={
                                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                                <g.icon className="w-12 h-12 text-white/30" />
                                            </div>
                                        }
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                                    
                                    {/* Large SESA Branding */}
                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                        <div className="px-4 py-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">SESA</span>
                                                <span className="text-xl">{BRAND_GLOBE}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                                            <g.icon className="w-5 h-5 text-white drop-shadow-lg" />
                                        </div>
                                    </div>
                                    
                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                        <div className="p-4 bg-white/95 rounded-full shadow-2xl">
                                            <Sparkles className="w-7 h-7 text-primary" />
                                        </div>
                                    </div>
                                    
                                    {/* Bottom Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                                        <h3 className="font-black text-white text-base md:text-lg mb-1">{g.title}</h3>
                                        <p className="text-white/80 text-xs md:text-sm">{g.desc}</p>
                                        <p className="text-white/60 text-xs mt-2 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            {t('Click to view full size', 'ሙሉ መጠን ለማየት ጠቅ ያድርጉ')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Compact Mission Statement */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        whileInView={{ opacity: 1 }} 
                        viewport={{ once: true }} 
                        className="mt-6 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-[#0b1736] via-[#132a5f] to-[#16396a] p-6 text-center text-white relative overflow-hidden shadow-xl"
                    >
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        <div className="relative z-10">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Shield className="w-6 h-6 text-cyan-300" />
                                <span className="text-xl">🌍</span>
                            </div>
                            <h3 className="text-lg md:text-xl font-black mb-2">{t('Safe Education for Safe Ethiopia & the World', 'ለደህና ኢትዮጵያና ዓለም ደህንነቱ የተጠበቀ ትምህርት')}</h3>
                            <p className="text-white/80 text-xs max-w-2xl mx-auto">{t('SESA Academy is built on the foundation of inclusive, safe, and empowering education — for every student, every teacher, every dream.', 'ሴሳ አካዳሚ ለሁሉም ተማሪ፣ ለሁሉም መምህር፣ ለሁሉም ህልም — ሁሉን አቀፍ፣ ደህንነቱ የተጠበቀ ትምህርት ላይ የተመሰረተ ነው።')}</p>
                        </div>
                    </motion.div>
                </div>
            </Fade>

            {/* ══════ YOUR FUTURE STARTS HERE — SESA BRAND TECH SECTION ══════ */}
        </div>
    );
};

export default Landing;




