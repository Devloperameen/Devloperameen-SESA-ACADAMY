import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, X, Type, Eye, MousePointer, Volume2 } from 'lucide-react';

const AccessibilityFAB: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const tools = [
        { icon: Type, label: 'Text Size', action: () => document.body.classList.toggle('text-lg') },
        { icon: Eye, label: 'Contrast', action: () => document.body.classList.toggle('high-contrast') },
        { icon: MousePointer, label: 'Cursor', action: () => document.body.classList.toggle('large-cursor') },
        { icon: Volume2, label: 'Read Aloud', action: () => alert('Screen reader simulation toggled') },
    ];

    return (
        <div className="fixed bottom-24 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="absolute bottom-16 right-0 bg-white dark:bg-dark-card p-4 rounded-2xl shadow-premium border border-gray-100 dark:border-gray-800 w-48"
                    >
                        <h3 className="text-sm font-bold mb-3 dark:text-white">Accessibility Tools</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {tools.map((tool, i) => (
                                <button
                                    key={i}
                                    onClick={tool.action}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors text-sm text-gray-600 dark:text-gray-300"
                                >
                                    <tool.icon className="w-4 h-4 text-primary" />
                                    <span>{tool.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/25 flex items-center justify-center relative z-10"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Accessibility className="w-6 h-6" />}
            </motion.button>
        </div>
    );
};

export default AccessibilityFAB;
