'use client';

import { useDispatch, useSelector } from 'react-redux';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import { RootState } from '@/store';
import { setCartOpen } from '@/store/slices/uiSlice';
import { removeFromCart, updateQuantity, selectCartTotal, selectCartItems } from '@/store/slices/cartSlice';

export default function CartDrawer() {
    const dispatch = useDispatch();
    const { cartOpen } = useSelector((state: RootState) => state.ui);
    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartTotal);
    const { discount, shipping } = useSelector((state: RootState) => state.cart);

    if (!cartOpen) return null;

    const total = subtotal - discount + shipping;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => dispatch(setCartOpen(false))}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-cloud-100 shadow-2xl z-50 flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-mocha-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-mocha flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-mocha-900">Shopping Cart</h2>
                            <p className="text-sm text-mocha-500">{items.length} items</p>
                        </div>
                    </div>
                    <button
                        onClick={() => dispatch(setCartOpen(false))}
                        className="p-2 rounded-xl hover:bg-mocha-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-mocha-600" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-24 h-24 rounded-full bg-mocha-100 flex items-center justify-center mb-4">
                                <ShoppingBag className="w-10 h-10 text-mocha-400" />
                            </div>
                            <h3 className="font-semibold text-mocha-800 mb-2">Your cart is empty</h3>
                            <p className="text-mocha-500 mb-6">Add some products to get started!</p>
                            <Link
                                href="/products"
                                onClick={() => dispatch(setCartOpen(false))}
                                className="btn-primary"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="glass-card rounded-xl p-4 flex gap-4">
                                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={item.product.images[0]}
                                        alt={item.product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-mocha-900 truncate">{item.product.name}</h4>
                                    <p className="text-sm text-mocha-500">{item.product.storeName}</p>
                                    <p className="font-bold text-mocha-700 mt-1">₱{item.price.toLocaleString()}</p>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => dispatch(updateQuantity({
                                                    productId: item.productId,
                                                    quantity: item.quantity - 1
                                                }))}
                                                disabled={item.quantity <= 1}
                                                className="w-7 h-7 rounded-lg bg-mocha-100 hover:bg-mocha-200 flex items-center justify-center disabled:opacity-50"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => dispatch(updateQuantity({
                                                    productId: item.productId,
                                                    quantity: item.quantity + 1
                                                }))}
                                                className="w-7 h-7 rounded-lg bg-mocha-100 hover:bg-mocha-200 flex items-center justify-center"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => dispatch(removeFromCart(item.productId))}
                                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-mocha-200 p-4 space-y-4">
                        {/* Coupon */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    className="input-field w-full pl-10 !py-3"
                                />
                            </div>
                            <button className="btn-accent !py-3 px-5">Apply</button>
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
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
                                <span>₱{shipping.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-mocha-900 pt-2 border-t border-mocha-200">
                                <span>Total</span>
                                <span>₱{total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <Link
                            href="/checkout"
                            onClick={() => dispatch(setCartOpen(false))}
                            className="btn-primary w-full flex items-center justify-center gap-2 !py-4"
                        >
                            Proceed to Checkout
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
