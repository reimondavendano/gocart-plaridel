'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/storage';
import { checkImageContent } from '@/lib/moderation';
import {
    ArrowLeft, Upload, X, Image as ImageIcon, DollarSign,
    Package, Tag, FileText, Sparkles, Save, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Category {
    id: string;
    slug: string;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const { currentUser } = useAppSelector((state) => state.user);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeSlug, setStoreSlug] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [comparePrice, setComparePrice] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('0');
    const [tags, setTags] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isFeatured, setIsFeatured] = useState(false);
    const [isNew, setIsNew] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, [currentUser?.id]);

    const fetchInitialData = async () => {
        try {
            // Get seller's store
            if (currentUser?.id) {
                const { data: store } = await supabase
                    .from('stores')
                    .select('id, slug')
                    .eq('seller_id', currentUser.id)
                    .single();

                if (store) {
                    setStoreId(store.id);
                    setStoreSlug(store.slug);
                }
            }

            // Fetch categories
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('id, slug, name')
                .order('name');

            if (categoriesData) {
                setCategories(categoriesData);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Store files for upload later
        const newFiles = Array.from(files);
        setImageFiles(prev => [...prev, ...newFiles]);

        // Create preview URLs
        newFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId || !storeSlug) {
            alert('Store not found. Please create a store first.');
            return;
        }

        setLoading(true);
        try {
            // Upload images first
            const uploadedUrls: string[] = [];

            if (imageFiles.length > 0) {
                // 1. Content Moderation Check
                for (const file of imageFiles) {
                    const moderationError = await checkImageContent(file);
                    if (moderationError) {
                        alert(moderationError);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Upload Images
                for (const file of imageFiles) {
                    const url = await uploadProductImage(file, storeSlug, false, category);
                    if (url) {
                        uploadedUrls.push(url);
                    }
                }
            }

            const slug = generateSlug(name) + '-' + Date.now().toString(36);
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

            const { data, error } = await supabase
                .from('products')
                .insert([{
                    store_id: storeId,
                    name,
                    slug,
                    description,
                    price: parseFloat(price),
                    compare_price: comparePrice ? parseFloat(comparePrice) : null,
                    category_id: categories.find(c => c.slug === category)?.id || null,
                    stock: parseInt(stock),
                    in_stock: parseInt(stock) > 0,
                    images: uploadedUrls.length > 0 ? uploadedUrls : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
                    tags: tagsArray,
                    is_featured: isFeatured,
                    is_new: isNew,
                    rating: 0,
                    review_count: 0
                }])
                .select()
                .single();

            if (error) throw error;

            router.push('/seller/products');
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Failed to create product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/seller/products"
                    className="p-2 rounded-xl hover:bg-mocha-100 text-mocha-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-mocha-900">Add New Product</h1>
                    <p className="text-mocha-500">Fill in the details to add a new product to your store</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-2xl border border-mocha-100 p-6">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-mocha-500" />
                        Basic Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Product Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Premium Wireless Headphones"
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your product in detail..."
                                rows={4}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 focus:outline-none focus:border-mocha-400"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-2xl border border-mocha-100 p-6">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-mocha-500" />
                        Pricing & Inventory
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Price (₱) *</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Compare Price (₱)</label>
                            <input
                                type="number"
                                value={comparePrice}
                                onChange={(e) => setComparePrice(e.target.value)}
                                placeholder="Original price (optional)"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Stock Quantity *</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white rounded-2xl border border-mocha-100 p-6">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-mocha-500" />
                        Product Images
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-mocha-100">
                                <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-mocha-300 flex flex-col items-center justify-center cursor-pointer hover:border-mocha-400 hover:bg-mocha-50 transition-colors">
                            <Upload className="w-8 h-8 text-mocha-400 mb-2" />
                            <span className="text-sm text-mocha-500">Upload Image</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Tags & Options */}
                <div className="bg-white rounded-2xl border border-mocha-100 p-6">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-mocha-500" />
                        Tags & Options
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1.5">Tags</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Enter tags separated by commas (e.g., electronics, wireless, audio)"
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 focus:outline-none focus:border-mocha-400"
                            />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="w-5 h-5 rounded border-mocha-300 text-mocha-500 focus:ring-mocha-500"
                                />
                                <span className="text-mocha-700">Mark as Featured</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isNew}
                                    onChange={(e) => setIsNew(e.target.checked)}
                                    className="w-5 h-5 rounded border-mocha-300 text-mocha-500 focus:ring-mocha-500"
                                />
                                <span className="text-mocha-700">Mark as New Arrival</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/seller/products"
                        className="px-6 py-3 rounded-xl bg-mocha-100 hover:bg-mocha-200 text-mocha-700 font-medium transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || !name || !price}
                        className="px-6 py-3 rounded-xl bg-mocha-500 hover:bg-mocha-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Create Product
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
