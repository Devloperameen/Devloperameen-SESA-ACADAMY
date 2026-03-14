// AI-Powered Quote Generator with Advanced Features
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, Heart, Share2, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Quote {
    id: string;
    text: string;
    author: string;
    category: string;
    emoji: string;
    isFavorite?: boolean;
    generatedAt?: Date;
    tags?: string[];
}

interface AIResponse {
    quote: string;
    author: string;
    category: string;
    tags: string[];
    confidence: number;
    reasoning: string;
}

const AIQuoteGenerator: React.FC = () => {
    const { t } = useLanguage();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [favorites, setFavorites] = useState<Quote[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copied, setCopied] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const categories = [
        { value: 'motivation', label: t('Motivation', 'የምርርትርት'), color: 'from-purple-500 to-pink-500' },
        { value: 'success', label: t('Success', 'የምርርትርት'), color: 'from-green-500 to-emerald-500' },
        { value: 'education', label: t('Education', 'የምርርትርት'), color: 'from-blue-500 to-cyan-500' },
        { value: 'discipline', label: t('Discipline', 'የምርርትርት'), color: 'from-orange-500 to-red-500' },
        { value: 'productivity', label: t('Productivity', 'የምርርትርት'), color: 'from-indigo-500 to-purple-500' }
    ];

    const motivationalQuotes: Quote[] = [
        {
            id: 'curiosity-1',
            text: t("Curiosity is the wick in the candle of learning.", "ከፍተኛ የምርርትርት የምርርትርት"),
            author: "William Arthur Ward",
            category: "Curiosity",
            emoji: "🕯️",
            tags: ['curiosity', 'learning', 'growth']
        },
        {
            id: 'success-1',
            text: t("Success is the sum of small efforts repeated daily.", "የምርርትርት የምርርትርት የምርርትርት"),
            author: "Robert Collier",
            category: "Success",
            emoji: "📊",
            tags: ['success', 'consistency', 'daily']
        },
        {
            id: 'education-1',
            text: t("Education is the passport to the future.", "የምርርትርት የምርርትርት"),
            author: "Malcolm X",
            category: "Education",
            emoji: "🛂",
            tags: ['education', 'future', 'opportunity']
        },
        {
            id: 'discipline-1',
            text: t("Self-discipline is the magic power that makes you virtually unstoppable.", "የምርርትርት የምርርትርት የምርርትርት"),
            author: "Dan Kennedy",
            category: "Discipline",
            emoji: "🧭",
            tags: ['discipline', 'power', 'unstoppable']
        }
    ];

    // Load favorites from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('favoriteQuotes');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading favorites:', error);
            }
        }
    }, []);

    // Save favorites to localStorage
    const saveFavorites = useCallback((newFavorites: Quote[]) => {
        setFavorites(newFavorites);
        localStorage.setItem('favoriteQuotes', JSON.stringify(newFavorites));
    }, []);

    // Generate AI Quote (Mock Implementation)
    const generateAIQuote = useCallback(async (prompt?: string) => {
        setIsGenerating(true);
        
        try {
            // Simulate AI API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const aiResponse: AIResponse = {
                quote: prompt 
                    ? `Based on "${prompt}", remember that every expert was once a beginner. Your current challenge is building the foundation for tomorrow's expertise.`
                    : getRandomAIQuote(),
                author: getRandomAuthor(),
                category: getRandomCategory(),
                tags: getRandomTags(),
                confidence: 0.85 + Math.random() * 0.15,
                reasoning: 'Generated based on user preferences and learning patterns'
            };
            
            const newQuote: Quote = {
                id: `ai-${Date.now()}`,
                text: aiResponse.quote,
                author: aiResponse.author,
                category: aiResponse.category,
                emoji: getEmojiForCategory(aiResponse.category),
                generatedAt: new Date(),
                tags: aiResponse.tags,
                isFavorite: false
            };
            
            setQuote(newQuote);
        } catch (error) {
            console.error('Error generating AI quote:', error);
            // Fallback to random quote
            const fallbackQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            setQuote(fallbackQuote);
        } finally {
            setIsGenerating(false);
        }
    }, []);

    // Helper functions
    const getRandomAIQuote = () => {
        const templates = [
            "The journey of a thousand miles begins with a single step of learning.",
            "Excellence is not a skill, it's an attitude.",
            "Your potential expands with every new concept you master.",
            "Learning today is the investment in tomorrow's success.",
            "The expert in anything was once a beginner.",
            "Knowledge compounds like interest - the more you learn, the more you can learn."
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    };

    const getRandomAuthor = () => {
        const authors = [
            "AI Learning Assistant",
            "SESA AI Mentor",
            "Educational Intelligence",
            "Smart Learning Coach"
        ];
        return authors[Math.floor(Math.random() * authors.length)];
    };

    const getRandomCategory = () => {
        const cats = ['motivation', 'success', 'education', 'discipline', 'productivity'];
        return cats[Math.floor(Math.random() * cats.length)];
    };

    const getRandomTags = () => {
        const allTags = ['learning', 'growth', 'success', 'motivation', 'discipline', 'productivity', 'excellence', 'knowledge'];
        const numTags = 2 + Math.floor(Math.random() * 3);
        const shuffled = allTags.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numTags);
    };

    const getEmojiForCategory = (category: string) => {
        const emojiMap: { [key: string]: string } = {
            motivation: '🕯️',
            success: '📊',
            education: '🛂',
            discipline: '🧭',
            productivity: '📈'
        };
        return emojiMap[category] || '✨';
    };

    // Text-to-speech
    const speakQuote = useCallback(() => {
        if (!quote || !voiceEnabled || 'speechSynthesis' in window === false) return;
        
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(`${quote.text}. By ${quote.author}.`);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setIsSpeaking(false);
            console.error('Speech synthesis error');
        };
        
        window.speechSynthesis.speak(utterance);
    }, [quote, voiceEnabled]);

    const stopSpeaking = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // Copy to clipboard
    const copyQuote = useCallback(async () => {
        if (!quote) return;
        
        try {
            await navigator.clipboard.writeText(`"${quote.text}" - ${quote.author}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }, [quote]);

    // Toggle favorite
    const toggleFavorite = useCallback(() => {
        if (!quote) return;
        
        const newFavorites = quote.isFavorite 
            ? favorites.filter(f => f.id !== quote.id)
            : [...favorites, { ...quote, isFavorite: true }];
        
        saveFavorites(newFavorites);
        
        if (quote) {
            setQuote({ ...quote, isFavorite: !quote.isFavorite });
        }
    }, [quote, favorites, saveFavorites]);

    // Share quote
    const shareQuote = useCallback(() => {
        if (!quote) return;
        
        const text = `"${quote.text}" - ${quote.author}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }, [quote]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        {t('AI Quote Generator', 'AI የምርርትርት')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        {t('Get personalized motivational quotes powered by AI', 'AI የምርርትርት የምርርትርት')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Quote Display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
                            {/* Category Badge */}
                            {quote && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${categories.find(c => c.value === quote.category)?.color || 'from-gray-500 to-gray-600'}`}
                                >
                                    {quote.category}
                                </motion.div>
                            )}
                            
                            {/* Quote Text */}
                            <AnimatePresence mode="wait">
                                {quote && (
                                    <motion.div
                                        key={quote.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.5 }}
                                        className="mb-6"
                                    >
                                        <div className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed mb-6 relative">
                                            <div className="absolute -top-4 -left-4 text-6xl text-purple-200 dark:text-purple-800 opacity-20">
                                                "
                                            </div>
                                            {quote.text}
                                            <div className="absolute -bottom-4 -right-4 text-6xl text-purple-200 dark:text-purple-800 opacity-20 rotate-180">
                                                "
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="text-lg text-gray-600 dark:text-gray-400">—</span>
                                                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 ml-2">
                                                    {quote.author}
                                                </span>
                                            </div>
                                            
                                            {quote.generatedAt && (
                                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                                    {t('AI Generated', 'AI የምርርትርት')}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Tags */}
                                        {quote.tags && quote.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {quote.tags.map((tag, index) => (
                                                    <motion.span
                                                        key={tag}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                                                    >
                                                        #{tag}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {/* Action Buttons */}
                            {quote && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-wrap gap-3 mt-6"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleFavorite}
                                        className={`p-3 rounded-xl transition-all duration-300 ${
                                            quote.isFavorite 
                                                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800' 
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {quote.isFavorite ? <Heart className="w-5 h-5 fill-current" /> : <Heart className="w-5 h-5" />}
                                    </motion.button>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={copyQuote}
                                        className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-300 relative"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </motion.button>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={shareQuote}
                                        className="p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-300"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </motion.button>
                                    
                                    {voiceEnabled && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={isSpeaking ? stopSpeaking : speakQuote}
                                            className="p-3 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-800 transition-all duration-300"
                                        >
                                            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Controls Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Generate Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => generateAIQuote(customPrompt)}
                            disabled={isGenerating}
                            className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isGenerating ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="mr-3"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </motion.div>
                                    {t('Generating...', 'የምርርትርት...')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-3" />
                                    {t('Generate AI Quote', 'AI የምርርትርት')}
                                </>
                            )}
                        </motion.button>

                        {/* Custom Prompt Input */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('Custom Prompt (Optional)', 'የምርርትርት የምርርትርት')}
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder={t('E.g., "Give me a quote about overcoming challenges in learning"', 'ምርርት: "ከፍተኛ የምርርትርት ስምርርትርት')}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-300"
                                rows={3}
                            />
                        </div>

                        {/* Advanced Options */}
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ 
                                height: showAdvanced ? 'auto' : 0, 
                                opacity: showAdvanced ? 1 : 0 
                            }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('Voice Output', 'የምርርት የምርርት')}
                                    </span>
                                    <button
                                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            voiceEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                        >
                            {showAdvanced ? t('Hide Advanced', 'የምርርትርት ስምርርት') : t('Show Advanced', 'የምርርትርት ስምርርት')}
                        </button>
                    </motion.div>

                    {/* Favorites List */}
                    {favorites.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-3"
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                    <Heart className="w-5 h-5 mr-2 text-red-500" />
                                    {t('Favorite Quotes', 'የምርርትርት የምርርትርት')}
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {favorites.map((fav, index) => (
                                        <motion.div
                                            key={fav.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => setQuote(fav)}
                                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                "{fav.text.substring(0, 50)}..."
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {fav.author}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIQuoteGenerator;
