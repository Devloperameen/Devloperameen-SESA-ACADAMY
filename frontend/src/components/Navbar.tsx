import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Menu, X, Sun, Moon, LogOut, LogIn, Search, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';
import apiService from '../utils/api';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ courses: any[]; teachers: any[] } | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const navigate = useNavigate();

    const { user, logout, isAuthenticated } = useAuth();
    const { language, setLanguage, t } = useLanguage();

    React.useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    React.useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, []);

    // Search logic
    React.useEffect(() => {
        if (searchQuery.length < 2) {
            setSuggestions(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await apiService.search.getSuggestions(searchQuery);
                setSuggestions(response.data.suggestions);
            } catch (err) {
                console.error('Failed to fetch suggestions:', err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/student/browse?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchFocused(false);
        }
    };

    const navLinks = [
        { name: t('home'), path: '/', isHash: false },
        { name: t('motivation'), path: '/#motivation', isHash: true },
        { name: t('subjects'), path: '/#subjects', isHash: true },
        { name: t('marketplace'), path: '/marketplace', isHash: false },
        { name: t('gallery'), path: '/#gallery', isHash: true },
        { name: t('faq'), path: '/faq', isHash: false },
        { name: t('dashboard'), path: '/dashboard', isHash: false },
    ];

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string, isHash: boolean) => {
        if (isHash && window.location.pathname === '/') {
            e.preventDefault();
            const hash = path.startsWith('/#') ? path.slice(2) : path.replace('/', '');
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setIsOpen(false);
            }
        } else {
            setIsOpen(false);
        }
    };

    return (
        <nav className="bg-white dark:bg-dark-card shadow-premium sticky top-0 z-50 transition-colors duration-300">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 shrink-0">
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <GraduationCap className="text-primary w-8 h-8" />
                    </motion.div>
                    <span className="font-bold text-xl text-dark-bg dark:text-light hidden sm:block">SESA Academy</span>
                </Link>

                {/* Global Search Bar */}
                <div className="relative flex-1 max-w-md mx-4 lg:mx-8 hidden md:block">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="w-full bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 transition-all text-sm text-dark-bg dark:text-light"
                            placeholder="Search courses, teachers..."
                        />
                    </form>

                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                        {isSearchFocused && suggestions && (searchQuery.length >= 2) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[60]"
                            >
                                <div className="p-2 space-y-1">
                                    {suggestions.courses.length > 0 && (
                                        <>
                                            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Courses</div>
                                            {suggestions.courses.map((course: any) => (
                                                <Link
                                                    key={course._id}
                                                    to={`/courses/${course._id}`}
                                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                                                >
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                                                        <img src={course.thumbnailUrl || '/placeholder-course.png'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold text-dark-bg dark:text-light truncate group-hover:text-primary">{course.title}</div>
                                                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 font-bold">{course.gradeLevel || 'General'}</span>
                                                            {course.category?.name && <span>• {course.category.name}</span>}
                                                            <span>• {course.level || 'Beginner'}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </>
                                    )}

                                    {suggestions.teachers.length > 0 && (
                                        <>
                                            <div className="px-3 py-1 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Teachers</div>
                                            {suggestions.teachers.map((teacher: any) => (
                                                <Link
                                                    key={teacher._id}
                                                    to={`/teachers/${teacher._id}`}
                                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <User className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="text-sm font-semibold text-dark-bg dark:text-light truncate group-hover:text-primary">{teacher.name}</div>
                                                </Link>
                                            ))}
                                        </>
                                    )}

                                    {suggestions.courses.length === 0 && suggestions.teachers.length === 0 && (
                                        <div className="p-4 text-center text-sm text-gray-500">No results found for "{searchQuery}"</div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleSearchSubmit}
                                    className="w-full py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                                >
                                    See all results
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="hidden lg:flex items-center space-x-8">
                    {navLinks.map((link, i) => (
                        <motion.div key={link.name} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Link
                                to={link.path}
                                onClick={(e) => handleNavClick(e, link.path, link.isHash)}
                                className="font-medium text-dark-bg dark:text-dark-text hover:text-primary transition-colors relative group inline-block py-1"
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                            </Link>
                        </motion.div>
                    ))}

                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-primary text-white' : 'text-gray-500'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLanguage('am')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'am' ? 'bg-primary text-white' : 'text-gray-500'}`}
                        >
                            AM
                        </button>
                    </div>

                    <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-primary/20 text-yellow-400 ring-2 ring-primary/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 fill-current" /> : <Moon className="w-5 h-5 fill-current" />}
                    </button>

                    {isAuthenticated ? (
                        <div className="flex items-center space-x-3">
                            <NotificationBell />
                            <span className="text-sm font-medium text-dark-bg dark:text-light hidden xl:block">Hello, {user?.name}</span>
                            <button
                                onClick={logout}
                                className="btn-primary flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-all"
                            >
                                <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/auth"
                            className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-secondary transition-all shadow-md inline-flex items-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            {t('loginRegister')}
                        </Link>
                    )}
                </div>

                <div className="lg:hidden flex items-center space-x-2">
                    {isAuthenticated && <NotificationBell />}
                    <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                        {isDarkMode ? <Sun className="w-6 h-6 fill-current" /> : <Moon className="w-6 h-6 fill-current" />}
                    </button>
                    <button onClick={() => setIsOpen((prev) => !prev)}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white dark:bg-dark-card border-t border-gray-100 dark:border-gray-800 px-4 py-4"
                    >
                        <div className="flex flex-col space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={(e) => handleNavClick(e, link.path, link.isHash)}
                                    className="font-medium text-dark-bg dark:text-light hover:text-primary transition-colors py-2"
                                >
                                    {link.name}
                                </Link>
                            ))}

                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-primary text-white' : 'text-gray-500'}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLanguage('am')}
                                    className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${language === 'am' ? 'bg-primary text-white' : 'text-gray-500'}`}
                                >
                                    Amharic
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col space-y-2">
                                {isAuthenticated ? (
                                    <>
                                        <div className="text-center py-2 text-sm font-medium text-dark-bg dark:text-light">
                                            Hello, {user?.name}
                                        </div>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsOpen(false);
                                            }}
                                            className="btn-primary text-center flex items-center justify-center"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to="/auth"
                                        onClick={() => setIsOpen(false)}
                                        className="btn-primary text-center"
                                    >
                                        {t('loginRegister')}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
