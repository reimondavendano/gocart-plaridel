# CybCart - Issues to Fix

## Date: 2026-01-28

This document outlines all the issues identified from the user's feedback and their status.

---

## Issue 1: Order Timeline Not Updating in Real-Time ✅

**Problem**: 
- Order timeline doesn't update when status changes unless the page is reloaded
- Messages are not visible until page reload
- When reloading, it briefly shows the login page before logging back in automatically

**Root Cause**:
- The order detail page (`/orders/[id]/page.tsx`) doesn't have real-time subscription for order updates
- No Supabase realtime listener for order status changes
- The authentication flow causes a brief redirect during page reload

**Solution**:
1. ✅ Added Supabase realtime subscription to listen for order status changes
2. ✅ Added subscription for order_status_history table updates
3. ✅ Automatic refetch when order or history changes

**Files Modified**:
- `src/app/orders/[id]/page.tsx` - Added real-time subscriptions

---

## Issue 2: Logo Appears Cropped ⚠️

**Problem**: 
- The logo in the header looks cropped

**Root Cause**:
- The logo is using a gradient background with just the letter "G"
- This is intentional design - not using an image file
- The design shows "GoCart" text next to the icon

**Current Implementation**:
```tsx
<div className="w-10 h-10 rounded-xl gradient-mocha flex items-center justify-center">
    <span className="text-white font-bold text-xl">G</span>
</div>
```

**Status**: This appears to be the intended design. The "G" icon with "GoCart" text is the logo.
If you want a different logo, you would need to:
1. Add a logo image file to the `public/` folder
2. Replace the gradient div with an `<img>` tag

**Files**:
- `src/components/layout/Header.tsx` (lines 180-195)

---

## Issue 3: Slow Product Loading When Adding to Cart ❌

**Problem**: 
- Adding a product to cart takes quite a while to load

**Root Cause**:
- Possible heavy operations during add to cart
- No loading state feedback
- Potential database query optimization needed

**Solution**:
1. Add loading indicators
2. Optimize cart operations
3. Implement optimistic UI updates
4. Check for unnecessary API calls

**Files to Check**:
- Cart slice in Redux
- Product detail page
- Add to cart functionality

---

## Issue 4: Static Features Section ⚠️

**Problem**: 
- Features section appears to be static/hardcoded
- Subscription plans are hardcoded in the component

**Root Cause**:
- Features and plans are defined as constants in the components
- No database-driven content management

**Solution**:
- The features are intentionally hardcoded for performance
- This is a common practice for static marketing content
- If dynamic management is needed, create an admin interface

**Status**: This is actually acceptable for most use cases. Features and plans don't change frequently.
If you need dynamic management, we can add it as a future enhancement.

**Files**:
- `src/components/home/HeroSection.tsx` - Stats are hardcoded
- `src/components/home/SubscriptionSection.tsx` - Plans are hardcoded

---

## Issue 5: Store Info Required Before Product Upload ✅ (Already Fixed)

**Status**: Already implemented in previous fixes
- Store validation is in place
- Warning banner shows when store is incomplete
- Form is disabled until store details are complete

---

## Issue 6: Guest Display in Seller Portal ✅

**Problem**: 
- In the seller portal, logged-in buyers show as "Guest" instead of their actual name
- The buyer's name should be displayed

**Root Cause**:
- The seller orders page fetches user profiles but may not be getting the correct name field
- Fallback to "Guest" when name is not found
- Not checking the users table for email as fallback

**Solution**:
1. ✅ Enhanced query to check user_profiles.name field first
2. ✅ Added fallback to users.email if name not found
3. ✅ Extract username from email if no name available
4. ✅ Only show "Guest" for actual guest orders

**Files Modified**:
- `src/app/seller/orders/page.tsx` - Improved user name fetching logic

---

## Issue 7: Checkout Without Login ✅

**Problem**: 
- Users can attempt to checkout without being logged in
- This should not be allowed - users must be logged in to place orders
- Currently shows an error instead of preventing the action

**Root Cause**:
- Checkout page allows guest users to proceed
- No authentication check before showing checkout form
- Error only appears when trying to place order

**Solution**:
1. ✅ Added authentication check at the top of checkout page
2. ✅ Show login requirement screen if not authenticated
3. ✅ Auth modal opens immediately for non-authenticated users
4. ✅ Disabled "Place Order" button with strict auth check
5. ✅ Clear message that login is required with prominent UI

**Files Modified**:
- `src/app/checkout/page.tsx` - Added authentication guards and login requirement screen

---

## Priority Order

1. **HIGH**: Issue 7 - Checkout Without Login (Security/Business Rule)
2. **HIGH**: Issue 1 - Order Timeline Real-Time Updates (User Experience)
3. **MEDIUM**: Issue 6 - Guest Display in Seller Portal (Data Accuracy)
4. **MEDIUM**: Issue 3 - Slow Product Loading (Performance)
5. **LOW**: Issue 2 - Logo Cropped (Visual)
6. **LOW**: Issue 4 - Static Features (Enhancement)

---

## Testing Checklist

### Issue 1: Real-Time Updates
- [ ] Order status changes reflect immediately without reload
- [ ] Order timeline updates in real-time
- [ ] No login redirect on page reload
- [ ] Multiple browser tabs show same updates

### Issue 2: Logo
- [ ] Logo displays correctly on all screen sizes
- [ ] Logo is not cropped
- [ ] Logo maintains aspect ratio

### Issue 3: Cart Performance
- [ ] Add to cart shows immediate feedback
- [ ] Loading indicator appears
- [ ] Cart updates quickly

### Issue 4: Features
- [ ] Features can be managed dynamically
- [ ] Admin can update features

### Issue 6: Guest Display
- [ ] Logged-in users show their actual names
- [ ] Email shows as fallback if name is missing
- [ ] "Guest" only shows for actual guest orders

### Issue 7: Checkout Authentication
- [ ] Cannot access checkout without login
- [ ] Auth modal appears when trying to checkout
- [ ] Clear message about login requirement
- [ ] Smooth redirect after login

---
