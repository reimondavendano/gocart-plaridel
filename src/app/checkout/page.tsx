'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ToastContainer from '@/components/ui/Toast';
import { RootState } from '@/store';
import { selectCartItems, selectCartTotal, clearCart } from '@/store/slices/cartSlice';
import { addToast } from '@/store/slices/uiSlice';
import { mockAddresses } from '@/data/mockup';
import {
    MapPin, CreditCard, Truck, Shield, ChevronRight,
    Plus, Check, Tag, Crown, ArrowLeft
} from 'lucide-react';

export default function CheckoutPage() {
    const dispatch = useDispatch();
    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartTotal);
    const { currentUser } = useSelector((state: RootState) => state.user);
    const { discount, shipping } = useSelector((state: RootState) => state.cart);

    const [selectedAddress, setSelectedAddress] = useState(mockAddresses[0]?.id || '');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'xendit'>('cod');
    const [couponCode, setCouponCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const isPlus = currentUser?.subscription === 'plus';
    const finalShipping = isPlus ? 0 : shipping;
    const total = subtotal - discount + finalShipping;

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            dispatch(addToast({ type: 'error', title: 'Please select a delivery address' }));
            return;
        }

        setIsProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        dispatch(clearCart());
        dispatch(addToast({ type: 'success', title: 'Order Placed!', message: 'Thank you for your purchase.' }));
        setIsProcessing(false);

        // In real app, would redirect to order confirmation
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
                                    {mockAddresses.map((address) => (
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
                                                <p className="text-mocha-700 mt-1">{address.fullName}</p>
                                                <p className="text-sm text-mocha-500">{address.phone}</p>
                                                <p className="text-sm text-mocha-500">{address.street}, {address.city}, {address.province} {address.postalCode}</p>
                                            </div>
                                        </label>
                                    ))}

                                    <button className="flex items-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-mocha-300 text-mocha-600 hover:border-mocha-400 hover:bg-mocha-50 transition-colors">
                                        <Plus className="w-5 h-5" />
                                        Add New Address
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
                                    {isProcessing ? 'Processing...' : `Place Order • ₱${total.toLocaleString()}`}
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
        </>
    );
}
