'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Tag, Plus, Edit, Trash2, Search, Package, Image as ImageIcon,
    X, Save, Loader2
} from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    image: string;
    description: string;
    product_count: number;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', icon: '', image: '', description: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                icon: category.icon,
                image: category.image,
                description: category.description
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', icon: '', image: '', description: '' });
        }
        setShowModal(true);
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const slug = formData.slug || generateSlug(formData.name);

            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({ ...formData, slug })
                    .eq('id', editingCategory.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([{ ...formData, slug, product_count: 0 }]);
                if (error) throw error;
            }

            fetchCategories();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (!error) {
                setCategories(categories.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Categories</h1>
                    <p className="text-mocha-500">Manage product categories</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mocha-600 hover:bg-mocha-700 text-white font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 shadow-sm"
                />
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="bg-white rounded-2xl border border-mocha-200 p-12 text-center">
                    <Tag className="w-12 h-12 text-mocha-400 mx-auto mb-3" />
                    <p className="font-medium text-mocha-900">No categories found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-white rounded-2xl border border-mocha-200 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="h-32 bg-mocha-100 relative">
                                {category.image ? (
                                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-10 h-10 text-mocha-300" />
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-mocha-900">{category.name}</h3>
                                        <p className="text-sm text-mocha-500">/{category.slug}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-mocha-100 text-mocha-700 text-xs font-medium">
                                        <Package className="w-3 h-3" />
                                        {category.product_count} products
                                    </span>
                                </div>
                                <p className="text-sm text-mocha-500 mt-2 line-clamp-2">{category.description || 'No description'}</p>
                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="flex-1 py-2 rounded-xl bg-mocha-100 hover:bg-mocha-200 text-mocha-700 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-mocha-100">
                            <h2 className="text-xl font-bold text-mocha-900">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-mocha-100 text-mocha-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Icon (Lucide name)</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    placeholder="e.g., Smartphone"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-mocha-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-mocha-100 hover:bg-mocha-200 text-mocha-700 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-xl bg-mocha-600 hover:bg-mocha-700 text-white font-medium flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
