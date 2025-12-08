import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Coupon } from '@/data/mockup';

interface CouponState {
    coupons: Coupon[];
    appliedCoupon: Coupon | null;
    isVerifying: boolean;
    verificationError: string | null;
}

const initialState: CouponState = {
    coupons: [],
    appliedCoupon: null,
    isVerifying: false,
    verificationError: null,
};

const couponSlice = createSlice({
    name: 'coupon',
    initialState,
    reducers: {
        setCoupons: (state, action: PayloadAction<Coupon[]>) => {
            state.coupons = action.payload;
        },
        setAppliedCoupon: (state, action: PayloadAction<Coupon | null>) => {
            state.appliedCoupon = action.payload;
            state.verificationError = null;
        },
        setVerifying: (state, action: PayloadAction<boolean>) => {
            state.isVerifying = action.payload;
        },
        setVerificationError: (state, action: PayloadAction<string | null>) => {
            state.verificationError = action.payload;
            state.appliedCoupon = null;
        },
        clearCoupon: (state) => {
            state.appliedCoupon = null;
            state.verificationError = null;
        },
        addCoupon: (state, action: PayloadAction<Coupon>) => {
            state.coupons.push(action.payload);
        },
        deleteCoupon: (state, action: PayloadAction<string>) => {
            state.coupons = state.coupons.filter((c) => c.id !== action.payload);
        },
    },
});

export const {
    setCoupons,
    setAppliedCoupon,
    setVerifying,
    setVerificationError,
    clearCoupon,
    addCoupon,
    deleteCoupon,
} = couponSlice.actions;

export default couponSlice.reducer;
