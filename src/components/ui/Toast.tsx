'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { RootState } from '@/store';
import { removeToast } from '@/store/slices/uiSlice';

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

export default function ToastContainer() {
    const dispatch = useDispatch();
    const { toasts } = useSelector((state: RootState) => state.ui);

    useEffect(() => {
        toasts.forEach((toast) => {
            const timer = setTimeout(() => {
                dispatch(removeToast(toast.id));
            }, 5000);
            return () => clearTimeout(timer);
        });
    }, [toasts, dispatch]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-3 max-w-sm">
            {toasts.map((toast) => {
                const Icon = icons[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up ${colors[toast.type]}`}
                    >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[toast.type]}`} />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold">{toast.title}</p>
                            {toast.message && (
                                <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                            )}
                        </div>
                        <button
                            onClick={() => dispatch(removeToast(toast.id))}
                            className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
