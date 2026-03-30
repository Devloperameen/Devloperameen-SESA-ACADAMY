import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Eye, EyeOff, Type, Contrast } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccessibilityHelperProps {
    isOpen: boolean;
    onClose: () => void;
}

const AccessibilityHelper: React.FC<AccessibilityHelperProps> = ({ isOpen, onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const [highContrast, setHighContrast] = useState(false);
    const [screenReader, setScreenReader] = useState(false);
    const [voiceCommands, setVoiceCommands] = useState(true);
    const [transcript, setTranscript] = useState('');
    
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        // Initialize speech synthesis
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }

        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(finalTranscript);
                    processVoiceCommand(finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        // Load saved preferences
        loadAccessibilityPreferences();

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    const loadAccessibilityPreferences = () => {
        const saved = localStorage.getItem('accessibilityPreferences');
        if (saved) {
            const prefs = JSON.parse(saved);
            setFontSize(prefs.fontSize || 16);
            setHighContrast(prefs.highContrast || false);
            setScreenReader(prefs.screenReader || false);
            setVoiceCommands(prefs.voiceCommands || true);
            applyAccessibilitySettings(prefs);
        }
    };

    const saveAccessibilityPreferences = (prefs: any) => {
        localStorage.setItem('accessibilityPreferences', JSON.stringify(prefs));
        applyAccessibilitySettings(prefs);
    };

    const applyAccessibilitySettings = (prefs: any) => {
        const root = document.documentElement;
        
        // Font size
        root.style.setProperty('--base-font-size', `${prefs.fontSize}px`);
        
        // High contrast
        if (prefs.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }

        // Screen reader optimizations
        if (prefs.screenReader) {
            document.body.classList.add('screen-reader-optimized');
        } else {
            document.body.classList.remove('screen-reader-optimized');
        }
    };

    const toggleVoiceRecognition = () => {
        if (!recognitionRef.current) {
            speak('Voice recognition is not supported in this browser');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            speak('Voice recognition started. You can now use voice commands.');
        }
    };

    const speak = (text: string) => {
        if (!synthRef.current) return;

        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    const processVoiceCommand = (command: string) => {
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('navigate to') || lowerCommand.includes('go to')) {
            handleNavigationCommand(lowerCommand);
        } else if (lowerCommand.includes('read') || lowerCommand.includes('speak')) {
            handleReadCommand(lowerCommand);
        } else if (lowerCommand.includes('increase font') || lowerCommand.includes('bigger text')) {
            changeFontSize(2);
        } else if (lowerCommand.includes('decrease font') || lowerCommand.includes('smaller text')) {
            changeFontSize(-2);
        } else if (lowerCommand.includes('high contrast')) {
            toggleHighContrast();
        } else if (lowerCommand.includes('help') || lowerCommand.includes('commands')) {
            speakAvailableCommands();
        } else if (lowerCommand.includes('stop') || lowerCommand.includes('quiet')) {
            stopSpeaking();
        }
    };

    const handleNavigationCommand = (command: string) => {
        if (command.includes('dashboard')) {
            window.location.href = '/dashboard';
            speak('Navigating to dashboard');
        } else if (command.includes('courses')) {
            window.location.href = '/student/browse-courses';
            speak('Navigating to courses');
        } else if (command.includes('profile')) {
            window.location.href = '/profile';
            speak('Navigating to profile');
        } else if (command.includes('home')) {
            window.location.href = '/';
            speak('Navigating to home page');
        }
    };

    const handleReadCommand = (command: string) => {
        if (command.includes('page')) {
            readPageContent();
        } else if (command.includes('heading') || command.includes('title')) {
            readHeadings();
        } else {
            readSelectedText();
        }
    };

    const readPageContent = () => {
        const mainContent = document.querySelector('main') || document.body;
        const text = mainContent.textContent || '';
        const cleanText = text.replace(/\s+/g, ' ').trim();
        speak(cleanText.substring(0, 500) + (cleanText.length > 500 ? '... and more content' : ''));
    };

    const readHeadings = () => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingTexts = Array.from(headings).map(h => h.textContent).join('. ');
        speak(`Page headings: ${headingTexts}`);
    };

    const readSelectedText = () => {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
            speak(selection.toString());
        } else {
            speak('No text selected. Please select text to read aloud.');
        }
    };

    const changeFontSize = (delta: number) => {
        const newSize = Math.max(12, Math.min(24, fontSize + delta));
        setFontSize(newSize);
        const prefs = { fontSize: newSize, highContrast, screenReader, voiceCommands };
        saveAccessibilityPreferences(prefs);
        speak(`Font size changed to ${newSize} pixels`);
    };

    const toggleHighContrast = () => {
        const newContrast = !highContrast;
        setHighContrast(newContrast);
        const prefs = { fontSize, highContrast: newContrast, screenReader, voiceCommands };
        saveAccessibilityPreferences(prefs);
        speak(newContrast ? 'High contrast mode enabled' : 'High contrast mode disabled');
    };

    const toggleScreenReader = () => {
        const newScreenReader = !screenReader;
        setScreenReader(newScreenReader);
        const prefs = { fontSize, highContrast, screenReader: newScreenReader, voiceCommands };
        saveAccessibilityPreferences(prefs);
        speak(newScreenReader ? 'Screen reader optimizations enabled' : 'Screen reader optimizations disabled');
    };

    const speakAvailableCommands = () => {
        const commands = [
            'Navigate to dashboard, courses, profile, or home',
            'Read page, read headings, or read selected text',
            'Increase font or decrease font',
            'High contrast to toggle contrast mode',
            'Stop to stop speaking'
        ];
        speak(`Available voice commands: ${commands.join('. ')}`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Accessibility Helper
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            aria-label="Close accessibility helper"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Voice Controls */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                Voice Controls
                            </h3>
                            <div className="flex items-center space-x-4 mb-4">
                                <button
                                    onClick={toggleVoiceRecognition}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                                        isListening 
                                            ? 'bg-red-600 text-white' 
                                            : 'bg-blue-600 text-white'
                                    } hover:opacity-80`}
                                    aria-label={isListening ? 'Stop voice recognition' : 'Start voice recognition'}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    <span>{isListening ? 'Stop Listening' : 'Start Voice Commands'}</span>
                                </button>
                                
                                <button
                                    onClick={isSpeaking ? stopSpeaking : () => speak('Text to speech is working')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                                        isSpeaking 
                                            ? 'bg-red-600 text-white' 
                                            : 'bg-green-600 text-white'
                                    } hover:opacity-80`}
                                    aria-label={isSpeaking ? 'Stop speaking' : 'Test text to speech'}
                                >
                                    {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    <span>{isSpeaking ? 'Stop Speaking' : 'Test Speech'}</span>
                                </button>
                            </div>
                            
                            {transcript && (
                                <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last command:</p>
                                    <p className="text-gray-900 dark:text-white">{transcript}</p>
                                </div>
                            )}
                        </div>

                        {/* Visual Settings */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                Visual Settings
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-700 dark:text-gray-300">Font Size</label>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => changeFontSize(-2)}
                                            className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                            aria-label="Decrease font size"
                                        >
                                            A-
                                        </button>
                                        <span className="text-sm font-medium w-12 text-center">
                                            {fontSize}px
                                        </span>
                                        <button
                                            onClick={() => changeFontSize(2)}
                                            className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                            aria-label="Increase font size"
                                        >
                                            A+
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-gray-700 dark:text-gray-300">High Contrast</label>
                                    <button
                                        onClick={toggleHighContrast}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                                            highContrast 
                                                ? 'bg-yellow-600 text-white' 
                                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                        } hover:opacity-80`}
                                        aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
                                    >
                                        <Contrast className="w-4 h-4" />
                                        <span>{highContrast ? 'Enabled' : 'Disabled'}</span>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-gray-700 dark:text-gray-300">Screen Reader Mode</label>
                                    <button
                                        onClick={toggleScreenReader}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                                            screenReader 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                        } hover:opacity-80`}
                                        aria-label={`${screenReader ? 'Disable' : 'Enable'} screen reader optimizations`}
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>{screenReader ? 'Enabled' : 'Disabled'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={readPageContent}
                                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    aria-label="Read page content aloud"
                                >
                                    <Volume2 className="w-4 h-4" />
                                    <span>Read Page</span>
                                </button>
                                
                                <button
                                    onClick={readHeadings}
                                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    aria-label="Read page headings"
                                >
                                    <Type className="w-4 h-4" />
                                    <span>Read Headings</span>
                                </button>
                                
                                <button
                                    onClick={speakAvailableCommands}
                                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    aria-label="List available voice commands"
                                >
                                    <Mic className="w-4 h-4" />
                                    <span>Voice Help</span>
                                </button>
                                
                                <button
                                    onClick={() => speak('Accessibility helper is ready to assist you')}
                                    className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                    aria-label="Test accessibility features"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Test Features</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AccessibilityHelper;