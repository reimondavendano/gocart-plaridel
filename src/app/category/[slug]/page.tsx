'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Filter, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import ProductCard from '@/components/product/ProductCard';
import { Category, Product } from '@/types';

export default function CategoryPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch Category
                const { data: categoryData, error: categoryError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (categoryError || !categoryData) {
                    console.error('Error fetching category:', categoryError);
                    setLoading(false);
                    return;
                }

                setCategory({
                    id: categoryData.id,
                    name: categoryData.name,
                    slug: categoryData.slug,
                    description: categoryData.description || '',
                    image: categoryData.image || '/placeholder-category.jpg',
                    icon: categoryData.icon || 'Package',
                    productCount: 0 // Will update if needed
                });

                // Fetch Products for this Category (exact match or related? Assuming category column in products matches slug or id)
                // Actually products usually have category_id or category slug. Schema assumed category_id.
                // But let's check if we can query by category slug if products table has it, or join.
                // For simplicity, assuming products table has 'category' column storing slug, or we need to query by ID.
                // Let's assume 'category_id' is used.

                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('category_id', categoryData.id); // Assuming category_id matches category.id

                if (productsError) {
                    console.error('Error fetching products:', productsError);
                }

                if (productsData) {
                    const mappedProducts: Product[] = productsData.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        description: item.description,
                        price: item.price,
                        comparePrice: item.compare_price,
                        images: item.images || [],
                        category: item.category_id, // keeping it loose for now
                        storeId: item.store_id,
                        rating: item.rating || 0,
                        reviewCount: item.review_count || 0,
                        stock: item.stock || 0,
                        isNew: item.is_new || false,
                        aiGenerated: item.ai_generated || false,
                        tags: item.tags || []
                    }));
                    setProducts(mappedProducts);
                }

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            fetchData();
        }
    }, [slug]);

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-24 pb-16 flex justify-center items-center">
                    <p className="text-mocha-500">Loading category...</p>
                </div>
                <Footer />
            </>
        )
    }

    if (!category) {
        notFound();
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                {/* Hero / Header */}
                <div className="bg-white border-b border-gray-200 mb-8">
                    <div className="container-custom py-8 md:py-12">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-sm text-mocha-500">
                                    <Link href="/" className="hover:text-mocha-800">Home</Link>
                                    <span>/</span>
                                    <Link href="/categories" className="hover:text-mocha-800">Categories</Link>
                                    <span>/</span>
                                    <span className="text-mocha-800 font-medium">{category.name}</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                    {category.name}
                                </h1>
                                <p className="text-gray-500 max-w-2xl">
                                    {category.description}
                                </p>
                            </div>

                            {/* Optional: Add category image as a banner background or side image */}
                        </div>
                    </div>
                </div>

                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters (Placeholder for now) */}
                        <aside className="w-full lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-28">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900">Filters</h3>
                                    <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                                </div>

                                {/* Price Range Mockup */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                                    <div className="flex items-center gap-2">
                                        <input type="number" placeholder="Min" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                        <span>-</span>
                                        <input type="number" placeholder="Max" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                    </div>
                                </div>

                                {/* Rating Mockup */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Rating</h4>
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((rating) => (
                                            <label key={rating} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="rounded border-gray-300" />
                                                <span className="text-sm text-gray-600">{rating} Stars & Up</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-gray-600">
                                    Showing <span className="font-bold text-gray-900">{products.length}</span> results
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Sort by:</span>
                                    <select className="text-sm border-none bg-transparent font-medium text-gray-900 focus:ring-0 cursor-pointer">
                                        <option>Popularity</option>
                                        <option>Newest</option>
                                        <option>Price: Low to High</option>
                                        <option>Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            {products.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                    <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                                    <p className="text-gray-500 mb-6">
                                        We couldn&apos;t find any products in this category right now.
                                    </p>
                                    <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                        View All Products
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <SearchModal />
            <ToastContainer />
        </>
    );
}
