import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Address } from '@/types';

interface AddressState {
    addresses: Address[];
    selectedAddress: Address | null;
    isLoading: boolean;
}

const initialState: AddressState = {
    addresses: [],
    selectedAddress: null,
    isLoading: false,
};

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddresses: (state, action: PayloadAction<Address[]>) => {
            state.addresses = action.payload;
            state.selectedAddress = action.payload.find((a) => a.isDefault) || action.payload[0] || null;
        },
        addAddress: (state, action: PayloadAction<Address>) => {
            if (action.payload.isDefault) {
                state.addresses = state.addresses.map((a) => ({ ...a, isDefault: false }));
            }
            state.addresses.push(action.payload);
            if (action.payload.isDefault || state.addresses.length === 1) {
                state.selectedAddress = action.payload;
            }
        },
        updateAddress: (state, action: PayloadAction<Address>) => {
            const index = state.addresses.findIndex((a) => a.id === action.payload.id);
            if (index !== -1) {
                if (action.payload.isDefault) {
                    state.addresses = state.addresses.map((a) => ({ ...a, isDefault: false }));
                }
                state.addresses[index] = action.payload;
                if (state.selectedAddress?.id === action.payload.id) {
                    state.selectedAddress = action.payload;
                }
            }
        },
        deleteAddress: (state, action: PayloadAction<string>) => {
            state.addresses = state.addresses.filter((a) => a.id !== action.payload);
            if (state.selectedAddress?.id === action.payload) {
                state.selectedAddress = state.addresses.find((a) => a.isDefault) || state.addresses[0] || null;
            }
        },
        selectAddress: (state, action: PayloadAction<string>) => {
            state.selectedAddress = state.addresses.find((a) => a.id === action.payload) || null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const {
    setAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
    setLoading,
} = addressSlice.actions;

export default addressSlice.reducer;
