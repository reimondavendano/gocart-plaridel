import { supabase } from './supabase';

export type NotificationType =
    | 'order_placed'
    | 'order_shipped'
    | 'order_delivered'
    | 'order_cancelled'
    | 'product_disabled'
    | 'store_approved'
    | 'store_rejected'
    | 'new_message'
    | 'payment_received';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                link: params.link,
                is_read: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error creating notification:', error);
        return null;
    }
}

/**
 * Create notifications for multiple users  
 */
export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
    try {
        const notificationData = notifications.map(n => ({
            user_id: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            is_read: false,
            created_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('notifications')
            .insert(notificationData)
            .select();

        if (error) {
            console.error('Error creating bulk notifications:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error creating bulk notifications:', error);
        return null;
    }
}

/**
 * Notify all users about a system-wide announcement
 */
export async function notifyAllUsers(title: string, message: string, type: NotificationType = 'new_message', link?: string) {
    try {
        // Get all users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id');

        if (usersError || !users) {
            console.error('Error fetching users:', usersError);
            return null;
        }

        // Create notifications for all users
        const notifications = users.map(user => ({
            userId: user.id,
            type,
            title,
            message,
            link
        }));

        return await createBulkNotifications(notifications);
    } catch (error) {
        console.error('Unexpected error notifying all users:', error);
        return null;
    }
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error('Unexpected error getting unread count:', error);
        return 0;
    }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(userId: string, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error getting notifications:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error getting notifications:', error);
        return [];
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error marking notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error marking all notifications as read:', error);
        return false;
    }
}
