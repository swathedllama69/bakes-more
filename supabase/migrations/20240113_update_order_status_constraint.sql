-- Update the check constraint for order status to include new statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Baking', 'Ready', 'Delivered', 'Cancelled'));
