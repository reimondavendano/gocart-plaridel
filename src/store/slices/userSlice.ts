import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Plan } from '@/types';

interface UserState {
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    sessions: User[];
}

const initialState: UserState = {
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
    sessions: [],
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.currentUser = action.payload;
            state.isAuthenticated = !!action.payload;
            if (action.payload && !state.sessions.find((s) => s.id === action.payload?.id)) {
                state.sessions.push(action.payload);
            }
        },
        logout: (state) => {
            state.currentUser = null;
            state.isAuthenticated = false;
        },
        updatePlan: (state, action: PayloadAction<Plan>) => {
            if (state.currentUser) {
                state.currentUser.plan = action.payload;
                state.currentUser.planId = action.payload.id;
            }
        },
        updateProfile: (state, action: PayloadAction<Partial<User>>) => {
            if (state.currentUser) {
                state.currentUser = { ...state.currentUser, ...action.payload };
            }
        },
        switchSession: (state, action: PayloadAction<string>) => {
            const user = state.sessions.find((s) => s.id === action.payload);
            if (user) {
                state.currentUser = user;
                state.isAuthenticated = true;
            }
        },
        removeSession: (state, action: PayloadAction<string>) => {
            state.sessions = state.sessions.filter((s) => s.id !== action.payload);
            if (state.currentUser?.id === action.payload) {
                state.currentUser = state.sessions[0] || null;
                state.isAuthenticated = !!state.currentUser;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const {
    setUser,
    logout,
    updatePlan,
    updateProfile,
    switchSession,
    removeSession,
    setLoading,
} = userSlice.actions;

export const selectIsPlus = (state: { user: UserState }) => {
    const planName = state.user.currentUser?.plan?.name;
    // Assuming 'Starter' is the basic plan, anything else is "Plus" equivalent for UI badges?
    // User interface has logic for this? 
    // The previous code was subscription === 'plus'. 
    // Now we have Starter, Growth, Pro, Enterprise.
    // Let's assume Growth, Pro, Enterprise are "Plus".
    return planName === 'Growth' || planName === 'Pro' || planName === 'Enterprise';
};

export const selectIsAdmin = (state: { user: UserState }) =>
    state.user.currentUser?.role === 'admin';
export const selectIsSeller = (state: { user: UserState }) =>
    state.user.currentUser?.role === 'seller';

export default userSlice.reducer;
