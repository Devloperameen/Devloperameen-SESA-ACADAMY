import React, { useState, useEffect } from 'react';
import apiService from '../../utils/api';
import { toast } from 'react-toastify';
import { Folders, Plus, Trash2, Loader2, BookOpen } from 'lucide-react';

interface Category {
    _id: string;
    name: string;
    icon: string;
    description?: string;
    isActive: boolean;
}

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('BookOpen');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await apiService.categories.getAll();
            setCategories(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await apiService.categories.create({ name, description, icon });
            setCategories([...categories, res.data]);
            setName('');
            setDescription('');
            toast.success('Category created successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await apiService.categories.delete(id);
            setCategories(categories.filter(c => c._id !== id));
            toast.success('Category deleted successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex items-center gap-3">
                <Folders className="w-8 h-8 text-cyan-400" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Categories Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Category Form */}
                <div className="lg:col-span-1 border border-slate-700 bg-slate-800/50 rounded-2xl p-6 h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-white">Create New Category</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="e.g. Graphic Design"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                                placeholder="Describe this category..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Icon Name (Lucide)</label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="e.g. Paintbrush"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            Create Category
                        </button>
                    </form>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold mb-4 text-white">Active Categories</h2>
                    {categories.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border border-slate-700 border-dashed rounded-2xl">
                            No categories created yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categories.map((category) => (
                                <div key={category._id} className="flex items-start justify-between p-4 border border-slate-700 bg-slate-800/30 rounded-2xl hover:border-cyan-500/50 transition-colors group">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex flex-shrink-0 items-center justify-center text-cyan-400">
                                            <BookOpen className="w-6 h-6" /> {/* Replace dynamically if needed */}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{category.name}</h3>
                                            <p className="text-sm text-slate-400 line-clamp-2 mt-1">{category.description || 'No description provided.'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(category._id)}
                                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Categories;
