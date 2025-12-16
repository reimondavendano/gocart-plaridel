-- Function to complete an order and process stock deduction
CREATE OR REPLACE FUNCTION complete_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    r_item RECORD;
BEGIN
    -- 1. Update Order Status to completed and Payment to paid
    UPDATE orders 
    SET 
        status = 'completed',
        payment_status = 'paid',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 2. Log Status Change
    INSERT INTO order_status_history (order_id, new_status, changed_by_role, notes)
    VALUES (p_order_id, 'completed', 'system', 'Order completed and stock deducted');

    -- 3. Process Stock Deduction for each item
    FOR r_item IN 
        SELECT product_id, quantity 
        FROM order_items 
        WHERE order_id = p_order_id
    LOOP
        -- Call existing helper to update product counts
        PERFORM confirm_stock_reservation(r_item.product_id, r_item.quantity);
        
        -- Update reservation status
        UPDATE stock_reservations
        SET status = 'confirmed'
        WHERE order_id = p_order_id AND product_id = r_item.product_id;
    END LOOP;

END;
$$ LANGUAGE plpgsql;
