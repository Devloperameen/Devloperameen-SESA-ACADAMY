import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showError, showLoading, updateToast } from '../../utils/toast';
import apiService from '../../utils/api';
import { ArrowLeft, Youtube, BookOpen, Tag, Clock, BarChart3 } from 'lucide-react';

interface Category {
    _id: string;
    name: string;
    icon: string;
}

const CreateCourse: React.FC = () => {
    const navigate = useNavigate();
    const { } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        resourceUrl: '',
        category: '',
        level: 'beginner',
        gradeLevel: 'General',
        duration: '',
        tags: '',
        lessons: [{ title: '', videoUrl: '', order: 1 }]
    });


    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await apiService.categories.getAll();
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLessonChange = (index: number, field: 'title' | 'videoUrl', value: string) => {
        const newLessons = [...formData.lessons];
        newLessons[index][field] = value;
        setFormData({ ...formData, lessons: newLessons });
    };

    const addLesson = () => {
        setFormData({
            ...formData,
            lessons: [
                ...formData.lessons,
                { title: '', videoUrl: '', order: formData.lessons.length + 1 }
            ]
        });
    };

    const removeLesson = (index: number) => {
        const newLessons = formData.lessons.filter((_, i) => i !== index);
        // Update order
        newLessons.forEach((lesson, i) => lesson.order = i + 1);
        setFormData({ ...formData, lessons: newLessons });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.description || !formData.resourceUrl || !formData.category) {
            showError('Please fill in all required fields');
            return;
        }

        const toastId = showLoading('Creating course...');
        setLoading(true);

        try {
            const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
            
            await apiService.courses.create({
                ...formData,
                tags: tagsArray
            });

            updateToast(toastId, 'success', 'Course created successfully!');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err: any) {
            updateToast(toastId, 'error', err.response?.data?.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-dark-bg dark:text-white">Create New Course</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the details to create a new course</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                    Course Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Introduction to React"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe what students will learn..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors resize-none"
                                    required
                                />
                            </div>

                            {/* YouTube URL */}
                            <div>
                                <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                    YouTube Video URL <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="url"
                                        name="resourceUrl"
                                        value={formData.resourceUrl}
                                        onChange={handleChange}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Paste a valid YouTube video URL
                                </p>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Level, Grade, & Duration */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                        <BarChart3 className="w-4 h-4 inline mr-1" />
                                        Level
                                    </label>
                                    <select
                                        name="level"
                                        value={formData.level}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                        Grade Level
                                    </label>
                                    <select
                                        name="gradeLevel"
                                        value={formData.gradeLevel}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="General">General / Open</option>
                                        <option value="Grade 9">Grade 9</option>
                                        <option value="Grade 10">Grade 10</option>
                                        <option value="Grade 11">Grade 11</option>
                                        <option value="Grade 12">Grade 12</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Duration
                                    </label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        placeholder="e.g., 4 weeks, 20 hours"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    placeholder="react, javascript, frontend (comma separated)"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Separate tags with commas
                                </p>
                            </div>

                            {/* Structured Lessons Builder */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-bold text-dark-bg dark:text-white">
                                        <Youtube className="w-4 h-4 inline mr-1" />
                                        Structured Lessons Array <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addLesson}
                                        className="text-sm px-4 py-2 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
                                    >
                                        + Add Lesson
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.lessons.map((lesson, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg relative">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={lesson.title}
                                                    onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                                                    placeholder={`Lesson ${index + 1} Title`}
                                                    className="w-full px-4 py-2 mb-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                                    required
                                                />
                                                <input
                                                    type="url"
                                                    value={lesson.videoUrl}
                                                    onChange={(e) => handleLessonChange(index, 'videoUrl', e.target.value)}
                                                    placeholder="YouTube Video URL"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-dark-bg dark:text-white focus:outline-none focus:border-primary transition-colors"
                                                    required
                                                />
                                            </div>
                                            {formData.lessons.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLesson(index)}
                                                    className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-dark-bg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CreateCourse;
