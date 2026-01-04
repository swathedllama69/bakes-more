
-- 4. Insert Customers
INSERT INTO customers (full_name, phone, email, address, notes)
VALUES 
('Alice Johnson', '08012345678', 'alice@example.com', '123 Main St, Lagos', 'Loves chocolate'),
('Bob Smith', '08087654321', 'bob@example.com', '456 Elm St, Abuja', 'Allergic to nuts'),
('Charlie Brown', '08011223344', 'charlie@example.com', '789 Oak St, PH', 'Regular customer');

-- 5. Insert Orders
-- Order 1: Pending
INSERT INTO orders (customer_name, customer_phone, customer_email, delivery_date, status, payment_status, total_price, total_cost, profit, source, customer_id)
VALUES 
('Alice Johnson', '08012345678', 'alice@example.com', NOW() + INTERVAL '2 days', 'Pending', 'Unpaid', 15000, 5000, 10000, 'Website', (SELECT id FROM customers WHERE email = 'alice@example.com'));

-- Order 2: Confirmed
INSERT INTO orders (customer_name, customer_phone, customer_email, delivery_date, status, payment_status, total_price, total_cost, profit, source, customer_id)
VALUES 
('Bob Smith', '08087654321', 'bob@example.com', NOW() + INTERVAL '5 days', 'Confirmed', 'Deposit', 25000, 8000, 17000, 'Instagram', (SELECT id FROM customers WHERE email = 'bob@example.com'));

-- Order 3: Processing
INSERT INTO orders (customer_name, customer_phone, customer_email, delivery_date, status, payment_status, total_price, total_cost, profit, source, customer_id)
VALUES 
('Charlie Brown', '08011223344', 'charlie@example.com', NOW() + INTERVAL '1 day', 'Processing', 'Paid', 10000, 3000, 7000, 'WhatsApp', (SELECT id FROM customers WHERE email = 'charlie@example.com'));

-- 6. Insert Order Items
-- Items for Order 1
INSERT INTO order_items (order_id, recipe_id, quantity, item_price, size_inches)
SELECT o.id, r.id, 1, 15000, 8
FROM orders o, recipes r
WHERE o.customer_email = 'alice@example.com' AND r.name = 'Rich Chocolate Cake';

-- Items for Order 2
INSERT INTO order_items (order_id, recipe_id, quantity, item_price, size_inches)
SELECT o.id, r.id, 1, 25000, 10
FROM orders o, recipes r
WHERE o.customer_email = 'bob@example.com' AND r.name = 'Red Velvet Cake';

-- Items for Order 3
INSERT INTO order_items (order_id, recipe_id, quantity, item_price, size_inches)
SELECT o.id, r.id, 2, 5000, 0
FROM orders o, recipes r
WHERE o.customer_email = 'charlie@example.com' AND r.name = 'Vanilla Cupcakes (Dozen)';
