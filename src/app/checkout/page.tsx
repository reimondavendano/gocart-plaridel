'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ToastContainer from '@/components/ui/Toast';
import { RootState } from '@/store';
import { selectCartItems, selectCartTotal, clearCart } from '@/store/slices/cartSlice';
import { addToast } from '@/store/slices/uiSlice';
import { supabase } from '@/lib/supabase';
import { Address } from '@/types';
import {
    MapPin, CreditCard, Truck, Shield, ChevronRight,
    Plus, Check, Tag, Crown, ArrowLeft, X, Loader2, LogIn
} from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';

export default function CheckoutPage() {
    const dispatch = useDispatch();
    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartTotal);
    const { currentUser, isAuthenticated } = useSelector((state: RootState) => state.user);
    const { discount, shipping } = useSelector((state: RootState) => state.cart);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'xendit'>('cod');
    const [couponCode, setCouponCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

    // Address modal state
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
    const [barangays, setBarangays] = useState<{ id: string; name: string }[]>([]);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        completeAddress: '',
        cityId: '',
        barangayId: '',
        isDefault: false
    });

    // Auth modal state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const isPlus = currentUser?.plan?.name === 'Growth' || currentUser?.plan?.name === 'Pro' || currentUser?.plan?.name === 'Enterprise';
    const finalShipping = isPlus ? 0 : shipping;
    const total = subtotal - discount + finalShipping;

    // Fetch addresses from Supabase
    useEffect(() => {
        async function fetchAddresses() {
            if (!currentUser) return;

            try {
                const { data, error } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', currentUser.id);

                if (error) {
                    console.error('Error fetching addresses:', error);
                    return;
                }

                if (data) {
                    const mappedAddresses: Address[] = data.map((item: any) => ({
                        id: item.id,
                        userId: item.user_id,
                        label: item.label,
                        completeAddress: item.complete_address,
                        cityId: item.city_id,
                        barangayId: item.barangay_id,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        // Legacy fields for backward compatibility
                        fullName: item.full_name,
                        phone: item.phone,
                        street: item.street,
                        city: item.city,
                        province: item.province,
                        postalCode: item.postal_code,
                        country: item.country || 'Philippines',
                        isDefault: item.is_default,
                    }));
                    setAddresses(mappedAddresses);
                    // Set default address selected
                    const defaultAddr = mappedAddresses.find(a => a.isDefault);
                    if (defaultAddr) {
                        setSelectedAddress(defaultAddr.id);
                    } else if (mappedAddresses.length > 0) {
                        setSelectedAddress(mappedAddresses[0].id);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingAddresses(false);
            }
        }

        if (currentUser) {
            fetchAddresses();
        } else {
            setIsLoadingAddresses(false);
        }
    }, [currentUser]);

    // Fetch cities
    useEffect(() => {
        async function fetchCities() {
            const { data } = await supabase
                .from('cities')
                .select('id, name')
                .eq('is_active', true)
                .order('name');
            if (data) setCities(data);
        }
        fetchCities();
    }, []);

    // Fetch barangays when city changes
    useEffect(() => {
        async function fetchBarangays() {
            if (!newAddress.cityId) {
                setBarangays([]);
                return;
            }
            const { data } = await supabase
                .from('barangays')
                .select('id, name')
                .eq('city_id', newAddress.cityId)
                .eq('is_active', true)
                .order('name');
            if (data) setBarangays(data);
        }
        fetchBarangays();
    }, [newAddress.cityId]);

    const handleSaveAddress = async () => {
        if (!currentUser || !newAddress.completeAddress.trim()) {
            dispatch(addToast({ type: 'error', title: 'Please fill in the address' }));
            return;
        }

        setIsSavingAddress(true);
        try {
            const { data, error } = await supabase
                .from('addresses')
                .insert({
                    user_id: currentUser.id,
                    label: newAddress.label,
                    complete_address: newAddress.completeAddress,
                    city_id: newAddress.cityId || null,
                    barangay_id: newAddress.barangayId || null,
                    is_default: newAddress.isDefault || addresses.length === 0
                })
                .select()
                .single();

            if (error) throw error;

            // Add to local state
            const newAddr: Address = {
                id: data.id,
                userId: data.user_id,
                label: data.label,
                completeAddress: data.complete_address,
                cityId: data.city_id,
                barangayId: data.barangay_id,
                isDefault: data.is_default
            };

            setAddresses(prev => [...prev, newAddr]);
            if (data.is_default || addresses.length === 0) {
                setSelectedAddress(data.id);
            }

            // Reset form and close modal
            setNewAddress({ label: 'Home', completeAddress: '', cityId: '', barangayId: '', isDefault: false });
            setShowAddressModal(false);
            dispatch(addToast({ type: 'success', title: 'Address added successfully!' }));
        } catch (err) {
            console.error('Error saving address:', err);
            dispatch(addToast({ type: 'error', title: 'Failed to save address' }));
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handlePlaceOrder = async () => {
        // Strict authentication check
        if (!isAuthenticated || !currentUser) {
            dispatch(addToast({ 
                type: 'error', 
                title: 'Login Required', 
                message: 'You must be logged in to place an order' 
            }));
            setIsAuthModalOpen(true);
            return;
        }

        if (!selectedAddress) {
            dispatch(addToast({ type: 'error', title: 'Please select a delivery address' }));
            return;
        }

        setIsProcessing(true);

        try {
            // Group items by store
            const itemsByStore: Record<string, typeof items> = {};
            for (const item of items) {
                const storeId = item.product.storeId;
                if (!itemsByStore[storeId]) {
                    itemsByStore[storeId] = [];
                }
                itemsByStore[storeId].push(item);
            }

            const createdOrderIds: string[] = [];

            // Create an order for each store
            for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
                const orderSubtotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const orderTotal = orderSubtotal - discount + finalShipping;

                // Create order with pending status
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        user_id: currentUser.id,
                        store_id: storeId,
                        subtotal: orderSubtotal,
                        shipping_fee: finalShipping,
                        discount: discount,
                        total: orderTotal,
                        status: 'pending',
                        payment_method: paymentMethod,
                        payment_status: 'pending',
                        shipping_address_id: selectedAddress,
                        coupon_code: couponCode || null,
                        reservation_expires_at: new Date(Date.now() + (paymentMethod === 'xendit' ? 30 : 24 * 60) * 60 * 1000).toISOString()
                    })
                    .select()
                    .single();

                if (orderError) {
                    console.error('Order insert error:', orderError);
                    throw new Error(`Failed to create order: ${orderError.message}`);
                }
                if (!order) {
                    throw new Error('Failed to create order: No data returned');
                }

                createdOrderIds.push(order.id);

                // Create order items
                const orderItems = storeItems.map(item => ({
                    order_id: order.id,
                    product_id: item.product.id,
                    product_name: item.product.name,
                    product_image: item.product.images[0] || '',
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                }));

                await supabase.from('order_items').insert(orderItems);

                // Create stock reservations
                for (const item of storeItems) {
                    await supabase.from('stock_reservations').insert({
                        order_id: order.id,
                        product_id: item.product.id,
                        quantity: item.quantity,
                        expires_at: new Date(Date.now() + (paymentMethod === 'xendit' ? 30 : 24 * 60) * 60 * 1000).toISOString(),
                        status: 'active'
                    });

                    // Update reserved stock on product
                    const { data: product } = await supabase
                        .from('products')
                        .select('reserved_stock')
                        .eq('id', item.product.id)
                        .single();

                    await supabase
                        .from('products')
                        .update({ reserved_stock: (product?.reserved_stock || 0) + item.quantity })
                        .eq('id', item.product.id);
                }

                // Log order creation
                await supabase.from('order_status_history').insert({
                    order_id: order.id,
                    old_status: null,
                    new_status: 'pending',
                    changed_by: currentUser.id,
                    changed_by_role: 'customer',
                    notes: 'Order placed by customer'
                });
            }

            dispatch(clearCart());

            // Handle Xendit Payment Redirection
            if (paymentMethod === 'xendit' && createdOrderIds.length > 0) {
                // If it's a single order, process it immediately
                if (createdOrderIds.length === 1) {
                    dispatch(addToast({ type: 'info', title: 'Processing Payment', message: 'Redirecting to payment gateway...' }));
                    try {
                        const response = await fetch('/api/xendit/create-invoice', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: createdOrderIds[0] })
                        });

                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || 'Failed to initialize payment');

                        if (data.invoiceUrl) {
                            window.location.href = data.invoiceUrl;
                            return;
                        }
                    } catch (err: any) {
                        console.error('Payment initialization failed:', err);
                        dispatch(addToast({
                            type: 'warning',
                            title: 'Payment Redirection Failed',
                            message: 'Please try paying from the Orders page.'
                        }));
                    }
                } else {
                    dispatch(addToast({
                        type: 'info',
                        title: 'Multiple Orders Created',
                        message: 'Please proceed to Orders page to pay for each order separately.'
                    }));
                }
            } else {
                dispatch(addToast({ type: 'success', title: 'Order Placed!', message: 'Your order is awaiting seller approval.' }));
            }

            // Redirect to orders page
            window.location.href = '/orders';
        } catch (error: any) {
            console.error('Order placement failed:', error);
            dispatch(addToast({
                type: 'error',
                title: 'Order Failed',
                message: error?.message || 'Something went wrong. Please try again.'
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0) {
        return (
            <>
                <Header />
                <main className="pt-24 pb-16 min-h-screen">
                    <div className="container-custom max-w-4xl text-center py-20">
                        <h1 className="text-2xl font-bold text-mocha-900 mb-4">Your cart is empty</h1>
                        <p className="text-mocha-500 mb-6">Add some products before checkout</p>
                        <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Continue Shopping
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Show login requirement if not authenticated
    if (!isAuthenticated) {
        return (
            <>
                <Header />
                <main className="pt-24 pb-16 min-h-screen bg-cloud-200">
                    <div className="container-custom max-w-2xl">
                        <div className="glass-card rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-mocha-100 flex items-center justify-center mx-auto mb-4">
                                <LogIn className="w-8 h-8 text-mocha-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-mocha-900 mb-2">Login Required</h1>
                            <p className="text-mocha-600 mb-6">
                                You need to be logged in to proceed with checkout. Please login or create an account to continue.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="btn-primary"
                                >
                                    Login / Sign Up
                                </button>
                                <Link href="/products" className="btn-accent">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
                <ToastContainer />
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="pt-24 pb-16 min-h-screen bg-cloud-200">
                <div className="container-custom">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-mocha-500 mb-8">
                        <Link href="/products" className="hover:text-mocha-700">Products</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/cart" className="hover:text-mocha-700">Cart</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-mocha-900 font-medium">Checkout</span>
                    </div>

                    <h1 className="text-3xl font-bold text-mocha-900 mb-8">Checkout</h1>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Delivery Address */}
                            <div className="glass-card rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl gradient-mocha flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-mocha-900">Delivery Address</h2>
                                        <p className="text-sm text-mocha-500">Select where to deliver your order</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {isLoadingAddresses ? (
                                        <div className="text-center py-6 text-mocha-500">Loading addresses...</div>
                                    ) : addresses.length > 0 ? (
                                        addresses.map((address) => (
                                            <label
                                                key={address.id}
                                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === address.id
                                                    ? 'border-mocha-500 bg-mocha-50'
                                                    : 'border-cloud-400 hover:border-mocha-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="address"
                                                    value={address.id}
                                                    checked={selectedAddress === address.id}
                                                    onChange={(e) => setSelectedAddress(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedAddress === address.id ? 'border-mocha-500 bg-mocha-500' : 'border-mocha-300'
                                                    }`}>
                                                    {selectedAddress === address.id && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-mocha-900">{address.label}</span>
                                                        {address.isDefault && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-mocha-200 text-mocha-700">Default</span>
                                                        )}
                                                    </div>
                                                    {address.fullName && <p className="text-mocha-700 mt-1">{address.fullName}</p>}
                                                    {address.phone && <p className="text-sm text-mocha-500">{address.phone}</p>}
                                                    <p className="text-sm text-mocha-500">
                                                        {address.completeAddress || `${address.street || ''}, ${address.city || ''}, ${address.province || ''} ${address.postalCode || ''}`}
                                                    </p>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-mocha-500">
                                            No addresses found. Please add one.
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                setIsAuthModalOpen(true);
                                                return;
                                            }
                                            setShowAddressModal(true);
                                        }}
                                        className="flex items-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-mocha-300 text-mocha-600 hover:border-mocha-400 hover:bg-mocha-50 transition-colors"
                                    >
                                        {currentUser ? (
                                            <><Plus className="w-5 h-5" /> Add New Address</>
                                        ) : (
                                            <><LogIn className="w-5 h-5" /> Login to Add Address</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="glass-card rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-dusk-500 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-mocha-900">Payment Method</h2>
                                        <p className="text-sm text-mocha-500">Choose how you want to pay</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* COD */}
                                    <label
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod'
                                            ? 'border-mocha-500 bg-mocha-50'
                                            : 'border-cloud-400 hover:border-mocha-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-mocha-500 bg-mocha-500' : 'border-mocha-300'
                                            }`}>
                                            {paymentMethod === 'cod' && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-mocha-900">Cash on Delivery</p>
                                            <p className="text-sm text-mocha-500">Pay when you receive your order</p>
                                        </div>
                                        <Truck className="w-6 h-6 text-mocha-400" />
                                    </label>

                                    {/* Xendit */}
                                    <label
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'xendit'
                                            ? 'border-mocha-500 bg-mocha-50'
                                            : 'border-cloud-400 hover:border-mocha-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="xendit"
                                            checked={paymentMethod === 'xendit'}
                                            onChange={() => setPaymentMethod('xendit')}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'xendit' ? 'border-mocha-500 bg-mocha-500' : 'border-mocha-300'
                                            }`}>
                                            {paymentMethod === 'xendit' && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-mocha-900">Online Payment (Xendit)</p>
                                            <p className="text-sm text-mocha-500">Credit Card, GCash, PayMaya, Bank Transfer</p>
                                        </div>
                                        <Shield className="w-6 h-6 text-mocha-400" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div>
                            <div className="glass-card rounded-2xl p-6 sticky top-24">
                                <h2 className="font-bold text-mocha-900 mb-6">Order Summary</h2>

                                {/* Items */}
                                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <img
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-mocha-900 truncate">{item.product.name}</p>
                                                <p className="text-sm text-mocha-500">Qty: {item.quantity}</p>
                                                <p className="text-sm font-medium text-mocha-700">₱{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Coupon */}
                                <div className="flex gap-2 mb-6">
                                    <div className="flex-1 relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Coupon code"
                                            className="input-field w-full pl-10 !py-2.5"
                                        />
                                    </div>
                                    <button className="btn-accent !py-2.5 px-4">Apply</button>
                                </div>

                                {/* Plus Badge */}
                                {isPlus && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-dusk-100 to-mocha-100 border border-dusk-200 mb-4">
                                        <Crown className="w-5 h-5 text-dusk-500" />
                                        <span className="text-sm font-medium text-dusk-700">You&apos;re enjoying Plus benefits!</span>
                                    </div>
                                )}

                                {/* Summary */}
                                <div className="space-y-3 border-t border-mocha-200 pt-4">
                                    <div className="flex justify-between text-mocha-600">
                                        <span>Subtotal</span>
                                        <span>₱{subtotal.toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-₱{discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-mocha-600">
                                        <span>Shipping</span>
                                        {isPlus ? (
                                            <span className="text-green-600">FREE</span>
                                        ) : (
                                            <span>₱{finalShipping.toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-mocha-900 pt-3 border-t border-mocha-200">
                                        <span>Total</span>
                                        <span>₱{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Place Order Button */}
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    className="w-full btn-primary mt-6 !py-4 disabled:opacity-50"
                                >
                                    {isProcessing
                                        ? 'Processing...'
                                        : (paymentMethod === 'xendit'
                                            ? `Pay now • ₱${total.toLocaleString()}`
                                            : `Place Order • ₱${total.toLocaleString()}`
                                        )
                                    }
                                </button>

                                <p className="text-xs text-center text-mocha-400 mt-4">
                                    By placing your order, you agree to our Terms of Service and Privacy Policy
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <ToastContainer />

            {/* Add Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Add New Address</h2>
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Label */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Label</label>
                                <select
                                    value={newAddress.label}
                                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                >
                                    <option value="Home">Home</option>
                                    <option value="Work">Work</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Complete Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address *</label>
                                <textarea
                                    value={newAddress.completeAddress}
                                    onChange={(e) => setNewAddress({ ...newAddress, completeAddress: e.target.value })}
                                    placeholder="House/Unit No., Street, Building, Landmark"
                                    rows={3}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500 resize-none"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
                                <select
                                    value={newAddress.cityId}
                                    onChange={(e) => setNewAddress({ ...newAddress, cityId: e.target.value, barangayId: '' })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500"
                                >
                                    <option value="">Select City</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.id}>{city.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Barangay */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                                <select
                                    value={newAddress.barangayId}
                                    onChange={(e) => setNewAddress({ ...newAddress, barangayId: e.target.value })}
                                    disabled={!newAddress.cityId}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">{newAddress.cityId ? 'Select Barangay' : 'Select a city first'}</option>
                                    {barangays.map(brgy => (
                                        <option key={brgy.id} value={brgy.id}>{brgy.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Default Address Checkbox */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newAddress.isDefault}
                                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-mocha-600 focus:ring-mocha-500"
                                />
                                <span className="text-sm text-gray-700">Set as default address</span>
                            </label>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAddress}
                                disabled={isSavingAddress || !newAddress.completeAddress.trim()}
                                className="flex-1 btn-primary !py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSavingAddress ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Address'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
}
