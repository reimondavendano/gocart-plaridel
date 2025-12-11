import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, CartItem } from '@/types';

interface CartState {
    items: CartItem[];
    isLoading: boolean;
    couponCode: string | null;
    discount: number;
    shipping: number;
}

const initialState: CartState = {
    items: [],
    isLoading: false,
    couponCode: null,
    discount: 0,
    shipping: 150,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<{ product: Product; quantity: number }>) => {
            const { product, quantity } = action.payload;
            const existingItem = state.items.find((item) => item.productId === product.id);

            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.total = existingItem.price * existingItem.quantity;
            } else {
                state.items.push({
                    id: `cart_${Date.now()}`,
                    productId: product.id,
                    product,
                    quantity,
                    price: product.price,
                    total: product.price * quantity,
                });
            }
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((item) => item.productId !== action.payload);
        },
        updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
            const item = state.items.find((i) => i.productId === action.payload.productId);
            if (item) {
                item.quantity = Math.max(1, action.payload.quantity);
                item.total = item.price * item.quantity;
            }
        },
        clearCart: (state) => {
            state.items = [];
            state.couponCode = null;
            state.discount = 0;
        },
        applyCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
            state.couponCode = action.payload.code;
            state.discount = action.payload.discount;
        },
        removeCoupon: (state) => {
            state.couponCode = null;
            state.discount = 0;
        },
        setShipping: (state, action: PayloadAction<number>) => {
            state.shipping = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    setShipping,
    setLoading,
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
// Using stored total or computing it. Computing is safer if price changes, but here we use item.price
export const selectCartTotal = (state: { cart: CartState }) =>
    state.cart.items.reduce((total, item) => total + item.total, 0);
export const selectCartCount = (state: { cart: CartState }) =>
    state.cart.items.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer;
