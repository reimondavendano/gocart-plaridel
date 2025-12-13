'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function EditProductPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { currentUser } = useAppSelector((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
    const [isFeatured, setIsFeatured] = useState(false);
    const [isNew, setIsNew] = useState(false);

    // Image handling
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (currentUser?.id && id) {
            fetchInitialData();
            fetchProduct();
        }
    }, [currentUser?.id, id]);

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

    const fetchProduct = async () => {
        try {
            // Remove join to avoid relationship errors
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (product) {
                setName(product.name);
                setDescription(product.description || '');
                setPrice(product.price.toString());
                setComparePrice(product.compare_price?.toString() || '');
                setStock(product.stock.toString());
                setTags(product.tags?.join(', ') || '');
                setIsFeatured(product.is_featured);
                setIsNew(product.is_new);
                setExistingImages(product.images || []);

                // Fetch category slug separately
                if (product.category_id) {
                    const { data: cat } = await supabase
                        .from('categories')
                        .select('slug')
                        .eq('id', product.category_id)
                        .single();

                    if (cat) {
                        setCategory(cat.slug);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Product not found or access denied');
            router.push('/seller/products');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files);
        setNewImageFiles(prev => [...prev, ...newFiles]);

        newFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId || !storeSlug) {
            alert('Store not found.');
            return;
        }

        setSaving(true);
        try {
            // 1. Content Moderation on New Files
            for (const file of newImageFiles) {
                const moderationError = await checkImageContent(file);
                if (moderationError) {
                    alert(moderationError);
                    setSaving(false);
                    return;
                }
            }

            // 2. Upload New Images
            const uploadedUrls: string[] = [];
            for (const file of newImageFiles) {
                const url = await uploadProductImage(file, storeSlug, false, category);
                if (url) {
                    uploadedUrls.push(url);
                }
            }

            // 3. Combine Images
            const finalImages = [...existingImages, ...uploadedUrls];

            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

            const { error } = await supabase
                .from('products')
                .update({
                    name,
                    description,
                    price: parseFloat(price),
                    compare_price: comparePrice ? parseFloat(comparePrice) : null,
                    category_id: categories.find(c => c.slug === category)?.id || null,
                    stock: parseInt(stock),
                    in_stock: parseInt(stock) > 0,
                    images: finalImages,
                    tags: tagsArray,
                    is_featured: isFeatured,
                    is_new: isNew,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            router.push('/seller/products');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Failed to update product. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold text-mocha-900">Edit Product</h1>
                    <p className="text-mocha-500">Update product details and inventory</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4">Product Images</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden group bg-mocha-50 border border-mocha-100">
                                <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeExistingImage(index)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">Existing</span>
                            </div>
                        ))}
                        {newImagePreviews.map((url, index) => (
                            <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden group bg-mocha-50 border border-mocha-100">
                                <img src={url} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeNewImage(index)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <span className="absolute bottom-2 left-2 px-2 py-1 bg-green-500/80 text-white text-xs rounded">New</span>
                            </div>
                        ))}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-mocha-200 hover:border-mocha-400 hover:bg-mocha-50 transition-all cursor-pointer flex flex-col items-center justify-center text-mocha-400 hover:text-mocha-600">
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">Add Images</span>
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

                {/* Details */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4">Product Details</h2>

                    <div>
                        <label className="block text-sm font-medium text-mocha-700 mb-1">Product Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-mocha-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 h-32 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Category</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400 appearance-none"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.slug}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Tags (comma separated)</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="e.g. fashion, summer, new"
                                    className="w-full pl-10 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="bg-white border border-mocha-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-mocha-900 mb-4">Pricing & Inventory</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Price</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Compare Price (Optional)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={comparePrice}
                                    onChange={(e) => setComparePrice(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-mocha-700 mb-1">Stock Quantity</label>
                            <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="w-full px-4 py-3 bg-mocha-50 border border-mocha-200 rounded-xl focus:outline-none focus:border-mocha-400"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-6 mt-4">
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

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
