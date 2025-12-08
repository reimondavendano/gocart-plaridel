import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
}

interface UIState {
    sidebarOpen: boolean;
    cartOpen: boolean;
    searchOpen: boolean;
    mobileMenuOpen: boolean;
    modalOpen: string | null;
    toasts: Toast[];
    isPageLoading: boolean;
}

const initialState: UIState = {
    sidebarOpen: true,
    cartOpen: false,
    searchOpen: false,
    mobileMenuOpen: false,
    modalOpen: null,
    toasts: [],
    isPageLoading: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },
        toggleCart: (state) => {
            state.cartOpen = !state.cartOpen;
        },
        setCartOpen: (state, action: PayloadAction<boolean>) => {
            state.cartOpen = action.payload;
        },
        toggleSearch: (state) => {
            state.searchOpen = !state.searchOpen;
        },
        setSearchOpen: (state, action: PayloadAction<boolean>) => {
            state.searchOpen = action.payload;
        },
        toggleMobileMenu: (state) => {
            state.mobileMenuOpen = !state.mobileMenuOpen;
        },
        setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
            state.mobileMenuOpen = action.payload;
        },
        openModal: (state, action: PayloadAction<string>) => {
            state.modalOpen = action.payload;
        },
        closeModal: (state) => {
            state.modalOpen = null;
        },
        addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
            state.toasts.push({
                ...action.payload,
                id: `toast_${Date.now()}`,
            });
        },
        removeToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter((t) => t.id !== action.payload);
        },
        clearToasts: (state) => {
            state.toasts = [];
        },
        setPageLoading: (state, action: PayloadAction<boolean>) => {
            state.isPageLoading = action.payload;
        },
    },
});

export const {
    toggleSidebar,
    setSidebarOpen,
    toggleCart,
    setCartOpen,
    toggleSearch,
    setSearchOpen,
    toggleMobileMenu,
    setMobileMenuOpen,
    openModal,
    closeModal,
    addToast,
    removeToast,
    clearToasts,
    setPageLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
