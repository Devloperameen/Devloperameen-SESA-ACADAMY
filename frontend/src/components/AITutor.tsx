import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, BookOpen, Brain, Lightbulb, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AITutorProps {
    courseId: string;
    courseTitle: string;
    onClose: () => void;
}

const AITutor: React.FC<AITutorProps> = ({ courseId, courseTitle, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [learningStyle, setLearningStyle] = useState<'visual' | 'auditory' | 'kinesthetic' | 'reading'>('visual');
    const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        startTutorSession();
        return () => {
            if (sessionId) {
                endSession();
            }
        };
    }, []);

    const startTutorSession = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/ai-tutor/session/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    courseId,
                    learningStyle,
                    difficultyLevel
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSessionId(data.sessionId);
                setMessages([{
                    role: 'assistant',
                    content: data.welcomeMessage,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Error starting tutor session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !sessionId || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai-tutor/session/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sessionId,
                    message: inputMessage,
                    includeVisuals: learningStyle === 'visual'
                })
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateQuiz = async () => {
        if (!sessionId) return;

        try {
            setIsLoading(true);
            const response = await fetch('/api/ai-tutor/session/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sessionId,
                    questionCount: 5,
                    difficulty: difficultyLevel
                })
            });

            if (response.ok) {
                const data = await response.json();
                const quizMessage: Message = {
                    role: 'assistant',
                    content: `I've generated a quiz based on our discussion! Here are ${data.quiz.questions.length} questions to test your understanding:\n\n${data.quiz.questions.map((q: any, i: number) => `${i + 1}. ${q.question}`).join('\n\n')}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, quizMessage]);
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStudyPlan = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/ai-tutor/study-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    courseId,
                    timeAvailable: 5, // 5 hours per week
                    goals: 'Complete course and master key concepts'
                })
            });

            if (response.ok) {
                const data = await response.json();
                const planMessage: Message = {
                    role: 'assistant',
                    content: `Here's your personalized study plan for "${courseTitle}":\n\n${data.studyPlan.weeklyPlan?.map((week: any) => `Week ${week.week}: ${week.focus} (${week.hours} hours)\nGoals: ${week.goals?.join(', ')}`).join('\n\n')}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, planMessage]);
            }
        } catch (error) {
            console.error('Error getting study plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const endSession = async () => {
        if (!sessionId) return;

        try {
            const response = await fetch('/api/ai-tutor/session/end', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Session ended:', data.summary);
            }
        } catch (error) {
            console.error('Error ending session:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                AI Tutor
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {courseTitle}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ⚙️
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Learning Style
                                    </label>
                                    <select
                                        value={learningStyle}
                                        onChange={(e) => setLearningStyle(e.target.value as any)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="visual">Visual</option>
                                        <option value="auditory">Auditory</option>
                                        <option value="kinesthetic">Kinesthetic</option>
                                        <option value="reading">Reading/Writing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Difficulty Level
                                    </label>
                                    <select
                                        value={difficultyLevel}
                                        onChange={(e) => setDifficultyLevel(e.target.value as any)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                        <button
                            onClick={generateQuiz}
                            disabled={isLoading || !sessionId}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50"
                        >
                            <Brain className="w-4 h-4" />
                            <span>Generate Quiz</span>
                        </button>
                        <button
                            onClick={getStudyPlan}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800 disabled:opacity-50"
                        >
                            <Target className="w-4 h-4" />
                            <span>Study Plan</span>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <div className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    {message.role === 'user' ? (
                                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    ) : (
                                        <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    )}
                                </div>
                                <div className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs opacity-70 mt-2">
                                        {message.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-3">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about this course..."
                            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            rows={2}
                            disabled={isLoading || !sessionId}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !inputMessage.trim() || !sessionId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AITutor;