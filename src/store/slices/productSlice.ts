import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/data/mockup';

interface ProductState {
    products: Product[];
    featuredProducts: Product[];
    searchResults: Product[];
    selectedProduct: Product | null;
    isLoading: boolean;
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
