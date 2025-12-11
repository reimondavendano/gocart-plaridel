import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';

interface ProductState {
    products: Product[];
    featuredProducts: Product[];
    searchResults: Product[];
    selectedProduct: Product | null;
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
    filters: {
        category: string;
        minPrice: number;
        maxPrice: number;
        rating: number;
        inStock: boolean;
    };
    sortBy: 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popular';
}

const initialState: ProductState = {
    products: [],
    featuredProducts: [],
    searchResults: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
    searchQuery: '',
    filters: {
        category: '',
        minPrice: 0,
        maxPrice: 100000,
        rating: 0,
        inStock: false,
    },
    sortBy: 'newest',
};

// Async Thunk to fetch products
export const fetchProducts = createAsyncThunk('product/fetchProducts', async () => {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            stores (
                name
            )
        `);

    if (error) {
        throw new Error(error.message);
    }

    // Map snake_case to camelCase
    return (data || []).map((item: any) => ({
        id: item.id,
        storeId: item.store_id,
        storeName: item.stores?.name || 'Unknown Store',
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        comparePrice: item.compare_price,
        images: item.images || [],
        category: item.category_slug, // Mapping category_slug to category
        stock: item.stock,
        inStock: item.in_stock,
        rating: item.rating,
        reviewCount: item.review_count,
        tags: item.tags || [],
        isFeatured: item.is_featured,
        isNew: item.is_new,
        aiGenerated: item.ai_generated,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    })) as Product[];
});

const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {
        setProducts: (state, action: PayloadAction<Product[]>) => {
            state.products = action.payload;
            state.featuredProducts = action.payload.filter((p) => p.isFeatured);
        },
        setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
            state.selectedProduct = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
            if (action.payload) {
                const query = action.payload.toLowerCase();
                state.searchResults = state.products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(query) ||
                        p.description.toLowerCase().includes(query) ||
                        p.tags.some((t) => t.toLowerCase().includes(query))
                );
            } else {
                state.searchResults = [];
            }
        },
        setFilters: (state, action: PayloadAction<Partial<ProductState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        setSortBy: (state, action: PayloadAction<ProductState['sortBy']>) => {
            state.sortBy = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.products = action.payload;
                state.featuredProducts = action.payload.filter((p) => p.isFeatured);
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch products';
            });
    },
});

export const {
    setProducts,
    setSelectedProduct,
    setSearchQuery,
    setFilters,
    clearFilters,
    setSortBy,
    setLoading,
} = productSlice.actions;

export default productSlice.reducer;
