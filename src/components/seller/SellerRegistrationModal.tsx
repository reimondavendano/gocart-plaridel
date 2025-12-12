'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    X, Store, MapPin, CheckCircle, ChevronRight, ChevronLeft,
    Upload, Camera, FileText, Loader2, MapPinned, User, Phone,
    Mail, AlertCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import { supabase } from '@/lib/supabase';
import { uploadLogo, uploadVerificationDoc } from '@/lib/storage';
import { getCityCoordinates, CITY_COORDINATES, isWithinAllowedArea, getNearestCityCenter } from '@/components/maps/DraggableMap';

// Dynamic import for map to avoid SSR issues
const DraggableMap = dynamic(() => import('@/components/maps/DraggableMap'), {
    ssr: false,
    loading: () => (
        <div className="h-48 rounded-xl bg-mocha-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-mocha-400" />
        </div>
    )
});

interface SellerRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: string | null;
}

export default function SellerRegistrationModal({ isOpen, onClose, initialPlan }: SellerRegistrationModalProps) {
    const dispatch = useAppDispatch();
    const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Out of bounds modal
    const [showOutOfBoundsModal, setShowOutOfBoundsModal] = useState(false);

    // Success modal after submission
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Existing store check
    const [existingStore, setExistingStore] = useState<{ status: string; name: string } | null>(null);
    const [checkingExistingStore, setCheckingExistingStore] = useState(true);

    // Selfie camera state
    const [showSelfieCamera, setShowSelfieCamera] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Face detection state - MUST be before any conditional returns
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceError, setFaceError] = useState<string | null>(null);
    const [showFaceErrorModal, setShowFaceErrorModal] = useState(false);
    const faceDetectorRef = useRef<any>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [formData, setFormData] = useState({
        // Store Info
        storeName: '',
        description: '',
        inquiryLink: '',
        logo: '' as string,
        // Address
        completeAddress: '',
        cityId: '',
        barangayId: '',
        latitude: null as number | null,
        longitude: null as number | null,
        // Verification
        validIdFront: '' as string,
        validIdBack: '' as string,
        businessPermit: '' as string,
        selfieImage: '' as string,
        // Plan
        selectedPlan: initialPlan || 'Starter',
    });

    const [files, setFiles] = useState<{
        logo: File | null;
        validIdFront: File | null;
        validIdBack: File | null;
        businessPermit: File | null;
    }>({
        logo: null,
        validIdFront: null,
        validIdBack: null,
        businessPermit: null
    });

    const [cities, setCities] = useState<{ id: string, name: string }[]>([]);
    const [barangays, setBarangays] = useState<{ id: string, name: string }[]>([]);


    // Check for existing stores when modal opens
    useEffect(() => {
        async function checkExistingStore() {
            if (!currentUser?.id || !isOpen) {
                setCheckingExistingStore(false);
                return;
            }

            setCheckingExistingStore(true);

            // Check if user has any non-approved stores
            const { data: stores } = await supabase
                .from('stores')
                .select('id, name, status')
                .eq('seller_id', currentUser.id)
                .in('status', ['pending', 'rejected'])
                .limit(1);

            if (stores && stores.length > 0) {
                setExistingStore({ status: stores[0].status, name: stores[0].name });
            } else {
                setExistingStore(null);
            }

            setCheckingExistingStore(false);
        }

        checkExistingStore();
    }, [currentUser?.id, isOpen]);

    // Fetch cities on mount
    useEffect(() => {
        async function fetchCities() {
            const { data } = await supabase.from('cities').select('id, name').order('name');
            if (data) setCities(data);
        }
        fetchCities();
    }, []);

    // Fetch barangays when city changes
    useEffect(() => {
        async function fetchBarangays() {
            if (!formData.cityId) {
                setBarangays([]);
                return;
            }
            const { data } = await supabase
                .from('barangays')
                .select('id, name')
                .eq('city_id', formData.cityId)
                .order('name');
            if (data) setBarangays(data);
        }
        fetchBarangays();

        // Set default coordinates based on selected city
        if (formData.cityId && cities.length > 0) {
            const coords = getCityCoordinates(formData.cityId, cities);
            if (coords) {
                setFormData(prev => ({
                    ...prev,
                    latitude: coords.lat,
                    longitude: coords.lng
                }));
            }
        }
    }, [formData.cityId, cities]);

    useEffect(() => {
        if (initialPlan) {
            setFormData(prev => ({ ...prev, selectedPlan: initialPlan }));
        }
    }, [initialPlan]);

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    if (!isOpen) return null;

    // Check if user is logged in
    if (!isAuthenticated || !currentUser) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-mocha-900 mb-2">Login Required</h2>
                    <p className="text-mocha-600 mb-6">
                        You need to be logged in to create a store. Please login or create an account first.
                    </p>
                    <button
                        onClick={onClose}
                        className="btn-primary w-full"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // Show loading while checking for existing stores
    if (checkingExistingStore) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-mocha-600 mx-auto mb-4" />
                    <p className="text-mocha-600">Checking store eligibility...</p>
                </div>
            </div>
        );
    }

    // Show existing store modal if user has pending/rejected store
    if (existingStore) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-mocha-900 mb-2">
                        {existingStore.status === 'pending' ? 'Store Pending Approval' : 'Previous Application Rejected'}
                    </h2>
                    <p className="text-mocha-600 mb-4">
                        {existingStore.status === 'pending' ? (
                            <>
                                Your store <strong>"{existingStore.name}"</strong> is currently being reviewed by our team.
                                You cannot create another store until your pending application is approved.
                            </>
                        ) : (
                            <>
                                Your previous store application <strong>"{existingStore.name}"</strong> was rejected.
                                Please contact our support team to understand why and how to proceed.
                            </>
                        )}
                    </p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${existingStore.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${existingStore.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                        {existingStore.status === 'pending' ? 'Awaiting Admin Review' : 'Application Rejected'}
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-primary w-full"
                    >
                        Understood
                    </button>
                </div>
            </div>
        );
    }


    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleImageUpload = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Keep file for upload
            if (field === 'logo' || field === 'validIdFront' || field === 'validIdBack' || field === 'businessPermit') {
                setFiles(prev => ({ ...prev, [field]: file }));
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const getCurrentLocation = () => {
        setGettingLocation(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    // Check if within allowed area
                    const withinArea = isWithinAllowedArea(lat, lng);

                    if (withinArea) {
                        setFormData(prev => ({
                            ...prev,
                            latitude: lat,
                            longitude: lng
                        }));
                    } else {
                        // Location is outside allowed area
                        setShowOutOfBoundsModal(true);
                    }
                    setGettingLocation(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    alert('Could not get your location. Please enable location services.');
                    setGettingLocation(false);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
            setGettingLocation(false);
        }
    };

    // Handle out of bounds - reset to selected city center
    const handleOutOfBoundsOk = () => {
        // Get the selected city name
        const selectedCity = cities.find(c => c.id === formData.cityId);
        if (selectedCity) {
            const coords = getCityCoordinates(formData.cityId, cities);
            if (coords) {
                setFormData(prev => ({
                    ...prev,
                    latitude: coords.lat,
                    longitude: coords.lng
                }));
            }
        }
        setShowOutOfBoundsModal(false);
    };

    // Handle map out of bounds callback
    const handleMapOutOfBounds = (_lat: number, _lng: number) => {
        setShowOutOfBoundsModal(true);
    };

    // Initialize face detector
    const initFaceDetector = async () => {
        // Check if FaceDetector API is supported (Chrome)
        if ('FaceDetector' in window) {
            try {
                faceDetectorRef.current = new (window as any).FaceDetector({
                    fastMode: true,
                    maxDetectedFaces: 1
                });
                return true;
            } catch (e) {
                console.log('FaceDetector not available:', e);
            }
        }
        return false;
    };

    // Check if face is in the center circle area
    const isFaceInCircle = (face: any, videoWidth: number, videoHeight: number): boolean => {
        const circleCenterX = videoWidth / 2;
        const circleCenterY = videoHeight / 2;
        const circleRadius = Math.min(videoWidth, videoHeight) * 0.35;

        const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
        const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2;

        const distance = Math.sqrt(
            Math.pow(faceCenterX - circleCenterX, 2) +
            Math.pow(faceCenterY - circleCenterY, 2)
        );

        // Face center should be within 60% of circle radius
        return distance < circleRadius * 0.6;
    };

    // Detect face in video
    const detectFace = async () => {
        if (!videoRef.current || !faceDetectorRef.current) return;

        try {
            const faces = await faceDetectorRef.current.detect(videoRef.current);

            if (faces.length > 0) {
                const face = faces[0];
                const inCircle = isFaceInCircle(
                    face,
                    videoRef.current.videoWidth,
                    videoRef.current.videoHeight
                );

                if (inCircle) {
                    setFaceDetected(true);
                    setFaceError(null);
                } else {
                    setFaceDetected(false);
                    setFaceError('Position your face inside the circle');
                }
            } else {
                setFaceDetected(false);
                setFaceError('No face detected');
            }
        } catch (error) {
            console.error('Face detection error:', error);
        }
    };

    // Start selfie camera with countdown
    const startSelfieCapture = async () => {
        setShowSelfieCamera(true);
        setCountdown(5);
        setCameraReady(false);
        setIsCapturing(false);
        setFaceDetected(false);
        setFaceError(null);

        try {
            // Initialize face detector
            await initFaceDetector();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setCameraReady(true);

                    // Start face detection loop
                    if (faceDetectorRef.current) {
                        detectionIntervalRef.current = setInterval(detectFace, 300);
                    }

                    startCountdown();
                };
            }
        } catch (error) {
            console.error('Camera error:', error);
            alert('Could not access camera. Please allow camera permissions.');
            setShowSelfieCamera(false);
        }
    };

    const startCountdown = () => {
        let count = 5;
        const interval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
                clearInterval(interval);
                setIsCapturing(true);
                // Wait 2 seconds then capture
                setTimeout(() => {
                    capturePhoto();
                }, 2000);
            }
        }, 1000);
    };

    const capturePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (ctx) {
                // Flip horizontally for mirror effect
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Final face check before saving
                let hasFaceInPhoto = false;

                if (faceDetectorRef.current) {
                    try {
                        const faces = await faceDetectorRef.current.detect(canvas);
                        if (faces.length > 0 && isFaceInCircle(faces[0], canvas.width, canvas.height)) {
                            hasFaceInPhoto = true;
                        }
                    } catch (e) {
                        // If face detection fails, skip check
                        hasFaceInPhoto = true;
                    }
                } else {
                    // No face detector, assume valid
                    hasFaceInPhoto = true;
                }

                if (hasFaceInPhoto) {
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);
                    setFormData(prev => ({ ...prev, selfieImage: imageData }));

                    // Stop detection interval
                    if (detectionIntervalRef.current) {
                        clearInterval(detectionIntervalRef.current);
                    }

                    // Stop camera
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                    }
                    setShowSelfieCamera(false);
                } else {
                    // Face not detected properly
                    setIsCapturing(false);
                    setShowFaceErrorModal(true);
                }
            }
        }
    };

    const cancelSelfie = () => {
        // Stop detection interval
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setShowSelfieCamera(false);
    };

    const handleFaceErrorRetry = () => {
        setShowFaceErrorModal(false);
        setCountdown(5);
        setFaceDetected(false);
        setFaceError(null);
        startCountdown();
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    };

    const initialFormData = {
        storeName: '',
        description: '',
        inquiryLink: '',
        logo: '' as string,
        completeAddress: '',
        cityId: '',
        barangayId: '',
        latitude: null as number | null,
        longitude: null as number | null,
        validIdFront: '' as string,
        validIdBack: '' as string,
        businessPermit: '' as string,
        selfieImage: '' as string,
        selectedPlan: initialPlan || 'Starter',
    };

    const handleSubmit = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            const storeSlug = generateSlug(formData.storeName);

            // Upload Logo
            let logoUrl = '';
            if (files.logo) {
                const url = await uploadLogo(files.logo, storeSlug);
                if (url) logoUrl = url;
            } else if (formData.logo && !formData.logo.startsWith('data:')) {
                logoUrl = formData.logo;
            } else {
                logoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${formData.storeName}`;
            }

            // Upload Verification Documents
            let validIdFrontUrl = null;
            if (files.validIdFront) {
                validIdFrontUrl = await uploadVerificationDoc(files.validIdFront, storeSlug, 'id_front');
            }

            let validIdBackUrl = null;
            if (files.validIdBack) {
                validIdBackUrl = await uploadVerificationDoc(files.validIdBack, storeSlug, 'id_back');
            }

            let businessPermitUrl = null;
            if (files.businessPermit) {
                businessPermitUrl = await uploadVerificationDoc(files.businessPermit, storeSlug, 'business_permit');
            }

            let selfieUrl = null;
            if (formData.selfieImage && formData.selfieImage.startsWith('data:')) {
                selfieUrl = await uploadVerificationDoc(formData.selfieImage, storeSlug, 'selfie');
            }

            // 1. Create address
            const { data: addressData, error: addressError } = await supabase
                .from('addresses')
                .insert([{
                    user_id: currentUser.id,
                    label: 'Store',
                    complete_address: formData.completeAddress,
                    city_id: formData.cityId || null,
                    barangay_id: formData.barangayId || null,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    is_default: false
                }])
                .select()
                .single();

            if (addressError) throw addressError;

            // 2. Get plan ID
            const { data: planData } = await supabase
                .from('plans')
                .select('id')
                .eq('name', formData.selectedPlan)
                .single();

            const planId = planData?.id || '11111111-1111-1111-1111-111111111111';

            // 3. Create store with pending status
            const { error: storeError } = await supabase
                .from('stores')
                .insert([{
                    seller_id: currentUser.id,
                    address_id: addressData.id,
                    name: formData.storeName,
                    slug: storeSlug,
                    description: formData.description,
                    logo: logoUrl,
                    inquiry_link: formData.inquiryLink || null,
                    status: 'pending', // Always pending until admin approves
                    valid_id_front: validIdFrontUrl,
                    valid_id_back: validIdBackUrl,
                    business_permit: businessPermitUrl,
                    selfie_image: selfieUrl,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }]);

            if (storeError) throw storeError;

            // 4. Update plan in user_profiles (role stays customer until admin approves)
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({
                    plan_id: planId,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', currentUser.id);

            if (profileError) throw profileError;

            // 5. Notify Admin via Email (Web3Forms)
            try {
                const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

                if (ACCESS_KEY) {
                    const message = `
                        New Seller Request
                        
                        Store Name: ${formData.storeName}
                        Applicant Email: ${currentUser.email}
                        Selected Plan: ${formData.selectedPlan}
                        Status: Pending Review
                        
                        Please review their application and verification documents in the admin portal.
                        
                        Visit: https://gocart-plaridel.vercel.app/
                    `;

                    await fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            access_key: ACCESS_KEY,
                            email: currentUser.email || 'noreply@gocart.ph',
                            subject: `New Seller Request: ${formData.storeName}`,
                            from_name: "GoCart Plaridel System",
                            message: message,
                        })
                    });
                }
            } catch (emailError) {
                console.error("Failed to send admin notification:", emailError);
            }

            // Note: DO NOT update role to 'seller' here - admin must approve first
            // The role update will happen when admin changes store status to 'approved'

            // Reset form to initial state
            setFormData(initialFormData);
            setFiles({
                logo: null,
                validIdFront: null,
                validIdBack: null,
                businessPermit: null
            });
            setStep(1);

            // Show success modal instead of alert
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error creating store:', error);
            alert('Failed to create store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        { name: 'Starter', price: 0 },
        { name: 'Growth', price: 199 },
        { name: 'Pro', price: 499 },
        { name: 'Enterprise', price: 999 },
    ];

    // Step 1: Store Information
    const renderStep1 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Store Information</h3>

            {/* User Info Display */}
            <div className="bg-mocha-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-mocha-500 mb-2">Creating store as:</p>
                <div className="flex items-center gap-3">
                    <img
                        src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={currentUser?.name}
                        className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                        <p className="font-medium text-mocha-900">{currentUser?.name}</p>
                        <p className="text-sm text-mocha-500">{currentUser?.email}</p>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Store Name *</label>
                <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    placeholder="e.g. My Awesome Shop"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Store Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50 resize-none"
                    rows={3}
                    placeholder="Tell us about what you sell..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Inquiry Link (Messenger/Viber/etc.)</label>
                <input
                    type="text"
                    value={formData.inquiryLink}
                    onChange={(e) => setFormData({ ...formData, inquiryLink: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    placeholder="https://m.me/yourpage"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Store Logo</label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex flex-col items-center justify-center text-mocha-500 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-sm">Click to upload logo</span>
                        </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload('logo')} className="hidden" />
                </label>
            </div>
        </div>
    );

    // Step 2: Location
    const renderStep2 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Store Location</h3>

            {/* Complete Address */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Complete Address *</label>
                <input
                    type="text"
                    value={formData.completeAddress}
                    onChange={(e) => setFormData({ ...formData, completeAddress: e.target.value })}
                    className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    placeholder="e.g. 123 Main St., Near Church"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-mocha-700 mb-1">City/Municipality *</label>
                    <select
                        value={formData.cityId}
                        onChange={(e) => setFormData({ ...formData, cityId: e.target.value, barangayId: '' })}
                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                    >
                        <option value="">Select City</option>
                        {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-mocha-700 mb-1">Barangay *</label>
                    <select
                        value={formData.barangayId}
                        onChange={(e) => setFormData({ ...formData, barangayId: e.target.value })}
                        className="w-full px-4 py-3 border border-mocha-200 rounded-xl focus:ring-2 focus:ring-mocha-500 focus:outline-none bg-mocha-50"
                        disabled={!formData.cityId}
                    >
                        <option value="">Select Barangay</option>
                        {barangays.map(brgy => (
                            <option key={brgy.id} value={brgy.id}>{brgy.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Geolocation with Draggable Map */}
            <div className="border-t border-mocha-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-mocha-700">Store Location (GPS)</label>
                    {formData.latitude && formData.longitude && (
                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={gettingLocation}
                            className="text-xs text-mocha-500 hover:text-mocha-700 flex items-center gap-1"
                        >
                            {gettingLocation ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <MapPin className="w-3 h-3" />
                            )}
                            Use my location
                        </button>
                    )}
                </div>

                {formData.cityId ? (
                    <div className="space-y-3">
                        {/* Coordinates Display */}
                        {formData.latitude && formData.longitude && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                                <MapPinned className="w-5 h-5 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-800">Drag marker to adjust location</p>
                                    <p className="text-xs text-green-600">
                                        {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                    </p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                        )}

                        {/* Interactive Draggable Map */}
                        {formData.latitude && formData.longitude && (
                            <DraggableMap
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onPositionChange={(lat, lng) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        latitude: lat,
                                        longitude: lng
                                    }));
                                }}
                                onOutOfBounds={handleMapOutOfBounds}
                                height="200px"
                                zoom={15}
                            />
                        )}

                        <p className="text-xs text-mocha-400 text-center">
                            Click on the map or drag the marker to set your exact store location
                        </p>
                    </div>
                ) : (
                    <div className="p-4 bg-mocha-50 rounded-xl text-center">
                        <MapPin className="w-8 h-8 text-mocha-300 mx-auto mb-2" />
                        <p className="text-sm text-mocha-500">Select a city to view the map</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Step 3: Verification Documents
    const renderStep3 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Verification Documents</h3>
            <p className="text-sm text-mocha-500">Upload your ID and take a selfie for account verification.</p>

            {/* Valid ID Front - Required */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">
                    Valid ID (Front) <span className="text-red-500">*</span>
                </label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex items-center gap-4 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.validIdFront ? (
                        <img src={formData.validIdFront} alt="ID Front" className="w-20 h-14 rounded-lg object-cover" />
                    ) : (
                        <div className="w-20 h-14 rounded-lg bg-mocha-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-mocha-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-mocha-700">{formData.validIdFront ? 'Change ID Front' : 'Upload ID Front'}</p>
                        <p className="text-xs text-mocha-400">Government ID, Driver's License, etc.</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload('validIdFront')} className="hidden" />
                </label>
            </div>

            {/* Valid ID Back - Required */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">
                    Valid ID (Back) <span className="text-red-500">*</span>
                </label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex items-center gap-4 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.validIdBack ? (
                        <img src={formData.validIdBack} alt="ID Back" className="w-20 h-14 rounded-lg object-cover" />
                    ) : (
                        <div className="w-20 h-14 rounded-lg bg-mocha-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-mocha-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-mocha-700">{formData.validIdBack ? 'Change ID Back' : 'Upload ID Back'}</p>
                        <p className="text-xs text-mocha-400">Back side of your ID</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload('validIdBack')} className="hidden" />
                </label>
            </div>

            {/* Business Permit - Optional */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">Business Permit (Optional)</label>
                <label className="border-2 border-dashed border-mocha-300 rounded-xl p-4 flex items-center gap-4 hover:bg-mocha-50 transition-colors cursor-pointer">
                    {formData.businessPermit ? (
                        <img src={formData.businessPermit} alt="Permit" className="w-20 h-14 rounded-lg object-cover" />
                    ) : (
                        <div className="w-20 h-14 rounded-lg bg-mocha-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-mocha-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-mocha-700">{formData.businessPermit ? 'Change Permit' : 'Upload Permit'}</p>
                        <p className="text-xs text-mocha-400">DTI/SEC registration (if available)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload('businessPermit')} className="hidden" />
                </label>
            </div>

            {/* Selfie - Required with Auto Capture */}
            <div>
                <label className="block text-sm font-medium text-mocha-700 mb-1">
                    Selfie Photo <span className="text-red-500">*</span>
                </label>
                {formData.selfieImage ? (
                    <div className="border-2 border-green-300 bg-green-50 rounded-xl p-4 flex items-center gap-4">
                        <img src={formData.selfieImage} alt="Selfie" className="w-16 h-16 rounded-full object-cover" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-700">Selfie captured!</p>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, selfieImage: '' }))}
                                className="text-xs text-mocha-500 hover:text-mocha-700"
                            >
                                Retake photo
                            </button>
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={startSelfieCapture}
                        className="w-full border-2 border-dashed border-mocha-300 rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-mocha-50 transition-colors"
                    >
                        <div className="w-16 h-16 rounded-full bg-mocha-100 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-mocha-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-mocha-700">Take Selfie Photo</p>
                            <p className="text-xs text-mocha-400">Auto-capture after 5 second countdown</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );

    // Step 4: Plan Selection & Summary
    const renderStep4 = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-mocha-900 mb-2">Select Your Plan</h3>

            {initialPlan ? (
                <div className="bg-mocha-50 border border-mocha-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-mocha-500">Selected Plan</p>
                        <p className="text-xl font-bold text-mocha-900">{initialPlan}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-mocha-600" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {plans.map((p) => (
                        <div
                            key={p.name}
                            onClick={() => setFormData({ ...formData, selectedPlan: p.name })}
                            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${formData.selectedPlan === p.name
                                ? 'border-mocha-600 bg-mocha-50'
                                : 'border-mocha-200 hover:border-mocha-300'
                                }`}
                        >
                            <p className="font-bold text-mocha-900">{p.name}</p>
                            <p className="text-sm text-mocha-500">₱{p.price}/mo</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="bg-mocha-50 rounded-xl p-4 space-y-2 mt-4">
                <h4 className="text-sm font-medium text-mocha-900 mb-3">Application Summary</h4>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Store Name</span>
                    <span className="font-medium text-mocha-900">{formData.storeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Location</span>
                    <span className="font-medium text-mocha-900">
                        {cities.find(c => c.id === formData.cityId)?.name || 'Not set'}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Documents</span>
                    <span className="font-medium text-mocha-900">
                        {[formData.validIdFront, formData.validIdBack, formData.selfieImage, formData.businessPermit].filter(Boolean).length} uploaded
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-mocha-500">Plan</span>
                    <span className="font-medium text-mocha-900">{formData.selectedPlan}</span>
                </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-amber-800">Pending Verification</p>
                    <p className="text-xs text-amber-600">
                        Your store will be reviewed by our team. Once approved, you'll be able to start selling.
                    </p>
                </div>
            </div>
        </div>
    );

    const totalSteps = 4;
    const canProceed = () => {
        switch (step) {
            case 1: return !!formData.storeName;
            case 2: return !!formData.completeAddress && !!formData.cityId && !!formData.barangayId;
            case 3: return !!formData.validIdFront && !!formData.validIdBack && !!formData.selfieImage;
            case 4: return !!formData.selectedPlan;
            default: return true;
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

                <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-mocha-100 flex items-center justify-between bg-mocha-50">
                        <div>
                            <h2 className="text-xl font-bold text-mocha-900">Create a Store</h2>
                            <p className="text-xs text-mocha-500">Step {step} of {totalSteps}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-mocha-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-mocha-500" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-mocha-200 h-1">
                        <div
                            className="bg-mocha-600 h-1 transition-all duration-300"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-mocha-100 bg-mocha-50 flex items-center justify-between">
                        <button
                            onClick={step === 1 ? onClose : handleBack}
                            className="px-4 py-2 text-mocha-600 font-medium hover:text-mocha-900 transition-colors"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>

                        <button
                            onClick={step === totalSteps ? handleSubmit : handleNext}
                            disabled={!canProceed() || loading}
                            className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                            ) : step === totalSteps ? (
                                'Submit Application'
                            ) : (
                                <>Next <ChevronRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Selfie Camera Modal */}
            {showSelfieCamera && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black">
                    <div className="relative w-full max-w-md">
                        {/* Header with instructions */}
                        <div className="text-center mb-4">
                            <h3 className="text-white font-semibold text-lg">Take a Selfie</h3>
                            <p className="text-white/70 text-sm">Position your face inside the circle</p>
                        </div>

                        {/* Video Feed */}
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />

                            {/* Face Guide Circle - changes color based on detection */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div
                                    className={`absolute inset-8 border-4 rounded-full transition-colors duration-300 ${faceDetected
                                        ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]'
                                        : 'border-white/50'
                                        }`}
                                />

                                {/* Face detection status indicator */}
                                {cameraReady && !isCapturing && countdown > 0 && (
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${faceDetected
                                            ? 'bg-green-500/80 text-white'
                                            : 'bg-red-500/80 text-white'
                                            }`}>
                                            {faceDetected
                                                ? '✓ Face detected'
                                                : faceError || 'Position your face in the circle'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Countdown */}
                            {cameraReady && countdown > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-32 h-32 rounded-full bg-black/50 flex flex-col items-center justify-center">
                                        <Clock className="w-8 h-8 text-white mb-2" />
                                        <span className="text-5xl font-bold text-white">{countdown}</span>
                                    </div>
                                </div>
                            )}

                            {/* Capturing indicator */}
                            {isCapturing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                                    <div className="text-center">
                                        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse mx-auto mb-2" />
                                        <p className="text-white font-medium">Hold still...</p>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            {!cameraReady && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Cancel Button */}
                        <button
                            onClick={cancelSelfie}
                            className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                        >
                            Cancel
                        </button>

                        {/* Hidden canvas for capture */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>
            )}

            {/* Out of Bounds Modal */}
            {showOutOfBoundsModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-mocha-900 mb-2">Location Outside Service Area</h3>
                        <p className="text-mocha-600 mb-4">
                            The selected location is outside our service area. We currently only support stores in <strong>Plaridel</strong>, <strong>Bustos</strong>, and <strong>Pulilan</strong>, Bulacan.
                        </p>
                        <p className="text-sm text-mocha-500 mb-6">
                            Please select a location within these municipalities to register your store.
                        </p>
                        <button
                            onClick={handleOutOfBoundsOk}
                            className="w-full py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors"
                        >
                            OK, Move Pin to City Center
                        </button>
                    </div>
                </div>
            )}

            {/* Face Not Detected Modal */}
            {showFaceErrorModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Camera className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-mocha-900 mb-2">Face Not Detected</h3>
                        <p className="text-mocha-600 mb-4">
                            We couldn't detect your face in the photo. To ensure the security of your store registration, we need a clear selfie for verification.
                        </p>
                        <ul className="text-sm text-mocha-500 text-left mb-6 space-y-2">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Position your face inside the circle guide</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Make sure you're in a well-lit area</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Look directly at the camera</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Hold still during the capture</span>
                            </li>
                        </ul>
                        <button
                            onClick={handleFaceErrorRetry}
                            className="w-full py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Camera className="w-5 h-5" />
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-mocha-900 mb-2">Application Submitted!</h3>
                        <p className="text-mocha-600 mb-4">
                            Your store application has been successfully submitted and is now pending review by our admin team.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-amber-800">What happens next?</p>
                                    <ul className="text-xs text-amber-700 mt-1 space-y-1">
                                        <li>• Admin will review your documents</li>
                                        <li>• You'll be notified once approved</li>
                                        <li>• Approval usually takes 1-2 business days</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onClose();
                            }}
                            className="w-full py-3 bg-mocha-600 hover:bg-mocha-700 text-white font-medium rounded-xl transition-colors"
                        >
                            Got it, Thanks!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
