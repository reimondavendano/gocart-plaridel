import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
    items: string[]; // List of product IDs
    isLoading: boolean;
}

const initialState: WishlistState = {
    items: [],
    isLoading: false,
};

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {
        addToWishlist: (state, action: PayloadAction<string>) => {
            if (!state.items.includes(action.payload)) {
                state.items.push(action.payload);
            }
        },
        removeFromWishlist: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((id) => id !== action.payload);
        },
        toggleWishlist: (state, action: PayloadAction<string>) => {
            if (state.items.includes(action.payload)) {
                state.items = state.items.filter((id) => id !== action.payload);
            } else {
                state.items.push(action.payload);
            }
        },
        clearWishlist: (state) => {
            state.items = [];
        },
    },
});

export const {
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
} = wishlistSlice.actions;

export const selectWishlistItems = (state: { wishlist: WishlistState }) => state.wishlist.items;
export const selectIsInWishlist = (productId: string) => (state: { wishlist: WishlistState }) =>
    state.wishlist.items.includes(productId);

export default wishlistSlice.reducer;
