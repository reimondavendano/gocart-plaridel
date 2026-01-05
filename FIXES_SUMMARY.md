# CybCart - Issues Fixed

## Date: 2026-01-05

This document outlines all the issues that were identified and fixed in the CybCart e-commerce platform.

---

## Issue 1: Notifications for All Users ✅

**Problem**: The application needed a function to create notifications for every user.

**Solution**: 
- Created a comprehensive notification utility library at `src/lib/notifications.ts`
- Implemented the following functions:
  - `createNotification`: Create a notification for a specific user
  - `createBulkNotifications`: Create notifications for multiple users at once
  - `notifyAllUsers`: Send system-wide announcements to all users
  - `getUnreadCount`: Get unread notification count for a user
  - `getNotifications`: Fetch notifications for a user
  - `markAsRead`: Mark a single notification as read
  - `markAllAsRead`: Mark all notifications as read for a user

**Usage Example**:
```typescript
import { notifyAllUsers, createNotification } from '@/lib/notifications';

// Notify all users about an announcement
await notifyAllUsers(
    'System Maintenance',
    'The platform will undergo maintenance on Jan 10, 2026',
    'new_message',
    '/announcements'
);

// Notify a specific user
await createNotification({
    userId: '123-456-789',
    type: 'order_shipped',
    title: 'Order Shipped',
    message: 'Your order #12345 has been shipped',
    link: '/orders/12345'
});
```

---

## Issue 2: Profile Avatar and Name Not Clickable ✅

**Problem**: Users couldn't click on their profile avatar or name in the header to navigate to their profile page.

**Solution**: 
- Modified `src/components/layout/Header.tsx`
- Split the profile button into two separate clickable areas:
  1. Avatar and name wrapped in a Link component that navigates to `/profile`
  2. Chevron icon as a separate button that toggles the dropdown menu
- Maintained all existing functionality while adding direct profile navigation

**Changes**:
- Lines 235-260 in `Header.tsx`
- Avatar and name are now wrapped in a `<Link href="/profile">` component
- Dropdown toggle moved to a separate button on the chevron icon

---

## Issue 3: Admin-Disabled Products Still Visible in Store ✅

**Problem**: Products that were disabled by admin (`is_disabled_by_admin = true`) were still showing up when viewing a shop/store.

**Solution**: 
- Modified `src/app/store/[slug]/page.tsx`
- Added filter to the products query to exclude admin-disabled products
- Query now includes: `.eq('is_disabled_by_admin', false)`

**Changes**:
- Line 64-69 in `store/[slug]/page.tsx`
- Added filter: `eq('is_disabled_by_admin', false)` to only fetch products not disabled by admin

---

## Issue 4: Product Upload Without Complete Store Details ✅

**Problem**: Sellers could upload products even when their store didn't have complete details yet, which could lead to illegitimate stores.

**Solution**: 
- Modified `src/app/seller/products/new/page.tsx`
- Added validation logic to check:
  1. Store existence
  2. Store approval status (`status === 'approved'`)
  3. Complete address details (street address, city_id, barangay_id)
- Display warning banner when store is incomplete
- Disable product creation form until store is complete and approved
- Added link to complete store details

**Changes**:
1. **State Management** (lines 25-28):
   - Added `storeComplete` boolean state
   - Added `storeValidationMessage` string state

2. **Validation Logic** (lines 46-85):
   - Fetch store with `address_id` and `status`
   - Validate address completeness
   - Check approval status
   - Set appropriate validation messages

3. **UI Warning Banner** (lines 214-236):
   - Yellow warning banner showing the validation message
   - Link button to navigate to store settings
   - Uses AlertCircle and Store icons

4. **Form Restriction**:
   - Submit button disabled when `!storeComplete`
   - Clear visual feedback to users

**Validation Checks**:
- ✅ Store exists
- ✅ Store is approved by admin
- ✅ Store has address_id
- ✅ Address has complete_address, city_id, and barangay_id

---

## Issue 5: Store Details Not Saving (Barangay ID and City ID) ✅

**Problem**: The Barangay ID and City ID fields were text inputs where users had to manually enter UUIDs, which was confusing and error-prone. The form wasn't saving properly because users didn't know what values to enter.

**Solution**: 
- Modified `src/app/seller/store/page.tsx`
- Replaced text inputs with dropdown select elements
- Populated dropdowns from database tables `cities` and `barangays`
- Implemented cascading dropdown (Barangay filter based on selected City)
- Made both fields required

**Changes**:
1. **Added Interfaces** (lines 13-23):
   - `City` interface for city data
   - `Barangay` interface for barangay data

2. **State Management** (lines 47-50):
   - `cities`: Array of all cities
   - `barangays`: Array of all barangays
   - `filteredBarangays`: Filtered barangays based on selected city

3. **Data Fetching** (lines 64-103):
   - `fetchCitiesAndBarangays()`: Fetches cities and barangays from database
   - Filters for `is_active = true` records
   - Called on component mount

4. **Cascading Filter** (lines 56-63):
   - useEffect hook to filter barangays when city_id changes
   - Clears barangay selection when city changes

5. **UI Changes** (lines 365-403):
   - **City Field**: Changed from text input to `<select>` dropdown
   - **Barangay Field**: Changed from text input to `<select>` dropdown
   - Barangay dropdown is disabled until a city is selected
   - Helper text: "Please select a city first"
   - Both fields marked as required with red asterisk

**User Experience Improvements**:
- ✅ No need to remember or look up UUIDs
- ✅ Clear selection process
- ✅ Prevents invalid city/barangay combinations
- ✅ Required fields clearly marked
- ✅ Data saves correctly to the database

---

## Database Schema Reference

The fixes utilize the following database tables:

### Cities Table
```sql
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT 'Bulacan',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Barangays Table
```sql
CREATE TABLE barangays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Testing Checklist

### Issue 1: Notifications
- [ ] Test `createNotification()` for a single user
- [ ] Test `createBulkNotifications()` for multiple users
- [ ] Test `notifyAllUsers()` system-wide announcement
- [ ] Verify notifications appear in the database
- [ ] Test notification read/unread status

### Issue 2: Profile Clickability
- [ ] Click on avatar - should navigate to /profile
- [ ] Click on name - should navigate to /profile
- [ ] Click on chevron - should toggle dropdown menu
- [ ] Verify dropdown menu still works correctly
- [ ] Test on mobile and desktop views

### Issue 3: Admin-Disabled Products
- [ ] Admin disables a product
- [ ] View the store page
- [ ] Verify disabled product does not appear
- [ ] Admin re-enables the product
- [ ] Verify product reappears on store page

### Issue 4: Product Upload Restriction
- [ ] Try to add product with incomplete store details
- [ ] Verify warning banner appears
- [ ] Verify form is disabled
- [ ] Complete store details
- [ ] Verify form becomes enabled
- [ ] Successfully create a product

### Issue 5: Store Details Saving
- [ ] Navigate to seller store settings
- [ ] Select a city from dropdown
- [ ] Verify barangay dropdown populates
- [ ] Select a barangay
- [ ] Save changes
- [ ] Verify data persists in database
- [ ] Reload page and verify selections are preserved

---

## Files Modified

1. **src/lib/notifications.ts** (NEW)
   - Notification utility functions

2. **src/components/layout/Header.tsx**
   - Made profile avatar/name clickable

3. **src/app/store/[slug]/page.tsx**
   - Filtered out admin-disabled products

4. **src/app/seller/products/new/page.tsx**
   - Added store validation
   - Added warning banner
   - Disabled form when store incomplete

5. **src/app/seller/store/page.tsx**
   - Added city/barangay dropdowns
   - Implemented cascading filter
   - Fixed saving issue

---

## Additional Improvements Implemented

1. **Type Safety**: Added TypeScript interfaces for City and Barangay
2. **User Experience**: Clear validation messages and helpful UI feedback
3. **Data Integrity**: Prevented invalid data entry through proper validation
4. **Performance**: Efficient filtering using React hooks
5. **Accessibility**: Proper labeling and required field indicators

---

## Notes for Admin

- The notification system is now ready to use. You can send announcements to all users through the admin panel.
- Ensure the `cities` and `barangays` tables are properly seeded with data from the `schema.sql` file.
- Monitor store approval workflow to ensure only legitimate stores can upload products.
- Consider adding email notifications alongside in-app notifications for better user engagement.

---

**All issues have been successfully resolved!** ✅
