-- 0. Ensure Schema Exists (Columns & Constraints)
DO $$
DECLARE
    r RECORD;
    winner_id UUID;
BEGIN
    -- A. Ensure Recipes Table Columns Exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'selling_price') THEN
        ALTER TABLE recipes ADD COLUMN selling_price numeric DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'base_cost') THEN
        ALTER TABLE recipes ADD COLUMN base_cost numeric DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'yield_amount') THEN
        ALTER TABLE recipes ADD COLUMN yield_amount numeric DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'yield_unit') THEN
        ALTER TABLE recipes ADD COLUMN yield_unit text DEFAULT 'Unit';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'base_size_inches') THEN
        ALTER TABLE recipes ADD COLUMN base_size_inches numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'instructions') THEN
        ALTER TABLE recipes ADD COLUMN instructions text DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'category') THEN
        ALTER TABLE recipes ADD COLUMN category text DEFAULT 'Cake';
    END IF;

    -- B. Handle Duplicate Ingredients
    FOR r IN 
        SELECT name 
        FROM ingredients 
        GROUP BY name 
        HAVING COUNT(*) > 1
    LOOP
        -- Pick the winner (e.g., the one with the most stock, or just the first one)
        SELECT id INTO winner_id FROM ingredients WHERE name = r.name ORDER BY current_stock DESC LIMIT 1;
        
        -- Re-link recipe_ingredients to the winner
        UPDATE recipe_ingredients 
        SET ingredient_id = winner_id 
        WHERE ingredient_id IN (SELECT id FROM ingredients WHERE name = r.name AND id != winner_id);

        -- Re-link filling_ingredients to the winner
        UPDATE filling_ingredients 
        SET ingredient_id = winner_id 
        WHERE ingredient_id IN (SELECT id FROM ingredients WHERE name = r.name AND id != winner_id);

        -- Delete the losers
        DELETE FROM ingredients 
        WHERE name = r.name AND id != winner_id;
    END LOOP;

    -- C. Add Unique Constraint to Ingredients
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_name_key') THEN
        ALTER TABLE ingredients ADD CONSTRAINT ingredients_name_key UNIQUE (name);
    END IF;
END $$;

-- 1. Ensure Ingredients Exist (Upsert based on name)
INSERT INTO ingredients (name, category, unit, current_stock, min_stock_level, purchase_price, purchase_quantity)
VALUES 
('All-Purpose Flour', 'Flour/Dry', 'g', 5000, 1000, 2500, 1000),
('Cake Flour', 'Flour/Dry', 'g', 5000, 1000, 3000, 1000),
('Sugar', 'Sugar/Sweetener', 'g', 10000, 2000, 2000, 1000),
('Brown Sugar', 'Sugar/Sweetener', 'g', 5000, 1000, 2500, 1000),
('Icing Sugar', 'Sugar/Sweetener', 'g', 5000, 1000, 3500, 1000),
('Butter (Unsalted)', 'Dairy', 'g', 2000, 500, 4500, 250),
('Margarine', 'Dairy', 'g', 5000, 1000, 1500, 250),
('Eggs', 'Dairy', 'pcs', 100, 30, 3500, 30),
('Milk', 'Dairy', 'ml', 5000, 1000, 1800, 1000),
('Buttermilk', 'Dairy', 'ml', 2000, 500, 2500, 1000),
('Heavy Cream', 'Dairy', 'ml', 2000, 500, 4000, 1000),
('Cocoa Powder', 'Flavoring', 'g', 2000, 500, 3000, 500),
('Dark Chocolate', 'Flavoring', 'g', 2000, 500, 5000, 1000),
('Vanilla Extract', 'Flavoring', 'ml', 500, 100, 4000, 100),
('Baking Powder', 'Leavening', 'g', 1000, 200, 1500, 100),
('Baking Soda', 'Leavening', 'g', 1000, 200, 1000, 100),
('Salt', 'Spice', 'g', 1000, 200, 500, 500),
('Vegetable Oil', 'Oil', 'ml', 5000, 1000, 3000, 1000),
('Red Food Coloring', 'Coloring', 'ml', 200, 50, 2000, 50),
('Carrots', 'Produce', 'g', 2000, 500, 500, 1000),
('Lemon Zest', 'Produce', 'g', 200, 50, 1000, 100),
('Lemon Juice', 'Produce', 'ml', 500, 100, 1000, 500),
('Cream Cheese', 'Dairy', 'g', 2000, 500, 4000, 250),
('Dried Fruits (Mixed)', 'Produce', 'g', 2000, 500, 3500, 1000),
('Desiccated Coconut', 'Flour/Dry', 'g', 1000, 200, 2000, 500),
('Strawberry Puree', 'Produce', 'g', 1000, 200, 3000, 500)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Recipes
-- Note: Prices are estimates. Adjust 'selling_price' as needed.

-- Vanilla Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Classic Vanilla Cake', 'Cake', 45, '1. Cream butter and sugar.\n2. Add eggs one by one.\n3. Mix dry ingredients.\n4. Alternate dry and wet ingredients.\n5. Bake at 180C.', 1, 'Cake', 8, 3500, 8000);

-- Chocolate Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Rich Chocolate Cake', 'Cake', 50, '1. Mix dry ingredients including cocoa.\n2. Add wet ingredients.\n3. Mix until smooth.\n4. Bake at 175C.', 1, 'Cake', 8, 4200, 9500);

-- Red Velvet Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Red Velvet Cake', 'Cake', 45, '1. Cream butter and sugar.\n2. Add eggs and vanilla.\n3. Mix cocoa and coloring.\n4. Add flour and buttermilk alternately.\n5. Bake at 175C.', 1, 'Cake', 8, 4500, 10000);

-- Carrot Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Moist Carrot Cake', 'Cake', 55, '1. Mix oil and sugar.\n2. Add eggs.\n3. Fold in dry ingredients.\n4. Fold in grated carrots.\n5. Bake at 170C.', 1, 'Cake', 8, 3800, 9000);

-- Lemon Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Zesty Lemon Cake', 'Cake', 45, '1. Cream butter and sugar with zest.\n2. Add eggs.\n3. Add flour and milk/juice.\n4. Bake at 180C.', 1, 'Cake', 8, 3600, 8500);

-- Sponge Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Victoria Sponge', 'Cake', 40, '1. Whisk eggs and sugar until fluffy.\n2. Fold in flour gently.\n3. Add melted butter.\n4. Bake at 180C.', 1, 'Cake', 8, 3000, 7500);

-- Fruit Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Traditional Fruit Cake', 'Cake', 120, '1. Soak fruits overnight.\n2. Cream butter and sugar.\n3. Add eggs and treacle.\n4. Fold in flour and spices.\n5. Add fruits.\n6. Bake slow at 150C.', 1, 'Cake', 8, 6000, 15000);

-- Coconut Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Coconut Cake', 'Cake', 45, '1. Cream butter and sugar.\n2. Add eggs and coconut extract.\n3. Fold in flour and desiccated coconut.\n4. Add coconut milk.\n5. Bake at 175C.', 1, 'Cake', 8, 3900, 9000);

-- Strawberry Cake (8 inch)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Fresh Strawberry Cake', 'Cake', 45, '1. Puree strawberries.\n2. Cream butter and sugar.\n3. Add eggs.\n4. Mix in puree and flour.\n5. Bake at 175C.', 1, 'Cake', 8, 4100, 9500);

-- Vanilla Cupcakes (12 count)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Vanilla Cupcakes (Dozen)', 'Cupcake', 20, '1. Cream butter and sugar.\n2. Add eggs.\n3. Add flour and milk.\n4. Fill liners.\n5. Bake at 180C.', 12, 'Cupcake', NULL, 1500, 4000);

-- Chocolate Cupcakes (12 count)
INSERT INTO recipes (name, category, baking_duration_minutes, instructions, yield_amount, yield_unit, base_size_inches, base_cost, selling_price)
VALUES ('Chocolate Cupcakes (Dozen)', 'Cupcake', 20, '1. Mix dry ingredients.\n2. Add wet ingredients.\n3. Fill liners.\n4. Bake at 175C.', 12, 'Cupcake', NULL, 1800, 4500);


-- 3. Link Ingredients to Recipes (Recipe Ingredients)

-- Helper function to insert recipe ingredient
-- (Since we can't use functions easily in a simple script without creating them, we use subqueries)

-- Vanilla Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Classic Vanilla Cake' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Classic Vanilla Cake' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Classic Vanilla Cake' AND i.name = 'Butter (Unsalted)';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 4 FROM recipes r, ingredients i WHERE r.name = 'Classic Vanilla Cake' AND i.name = 'Eggs'; -- 4 eggs approx 200g, but using unit logic in app might differ. Assuming app handles unit conversion or we store raw amount. If app expects grams for everything, 4 eggs ~ 200g.
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 10 FROM recipes r, ingredients i WHERE r.name = 'Classic Vanilla Cake' AND i.name = 'Baking Powder';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 5 FROM recipes r, ingredients i WHERE r.name = 'Classic Vanilla Cake' AND i.name = 'Vanilla Extract';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 120 FROM recipes r, ingredients i WHERE r.name = 'Classic Vanilla Cake' AND i.name = 'Milk';

-- Chocolate Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Rich Chocolate Cake' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 300 FROM recipes r, ingredients i WHERE r.name = 'Rich Chocolate Cake' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 75 FROM recipes r, ingredients i WHERE r.name = 'Rich Chocolate Cake' AND i.name = 'Cocoa Powder';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 2 FROM recipes r, ingredients i WHERE r.name = 'Rich Chocolate Cake' AND i.name = 'Eggs';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 240 FROM recipes r, ingredients i WHERE r.name = 'Rich Chocolate Cake' AND i.name = 'Milk';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 120 FROM recipes r, ingredients i WHERE r.name = 'Rich Chocolate Cake' AND i.name = 'Vegetable Oil';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 10 FROM recipes r, ingredients i WHERE r.name = 'Rich Chocolate Cake' AND i.name = 'Baking Powder';

-- Red Velvet Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 300 FROM recipes r, ingredients i WHERE r.name = 'Red Velvet Cake' AND i.name = 'Cake Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 300 FROM recipes r, ingredients i WHERE r.name = 'Red Velvet Cake' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 115 FROM recipes r, ingredients i WHERE r.name = 'Red Velvet Cake' AND i.name = 'Butter (Unsalted)';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 2 FROM recipes r, ingredients i WHERE r.name = 'Red Velvet Cake' AND i.name = 'Eggs';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 20 FROM recipes r, ingredients i WHERE r.name = 'Red Velvet Cake' AND i.name = 'Cocoa Powder';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 240 FROM recipes r, ingredients i WHERE r.name = 'Red Velvet Cake' AND i.name = 'Buttermilk';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 10 FROM recipes r, ingredients i WHERE r.name = 'Red Velvet Cake' AND i.name = 'Red Food Coloring';

-- Carrot Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Moist Carrot Cake' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Moist Carrot Cake' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 100 FROM recipes r, ingredients i WHERE r.name = 'Moist Carrot Cake' AND i.name = 'Brown Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 240 FROM recipes r, ingredients i WHERE r.name = 'Moist Carrot Cake' AND i.name = 'Vegetable Oil';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 3 FROM recipes r, ingredients i WHERE r.name = 'Moist Carrot Cake' AND i.name = 'Eggs';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 300 FROM recipes r, ingredients i WHERE r.name = 'Moist Carrot Cake' AND i.name = 'Carrots';

-- Lemon Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Zesty Lemon Cake' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Zesty Lemon Cake' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Zesty Lemon Cake' AND i.name = 'Butter (Unsalted)';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 3 FROM recipes r, ingredients i WHERE r.name = 'Zesty Lemon Cake' AND i.name = 'Eggs';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 15 FROM recipes r, ingredients i WHERE r.name = 'Zesty Lemon Cake' AND i.name = 'Lemon Zest';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 60 FROM recipes r, ingredients i WHERE r.name = 'Zesty Lemon Cake' AND i.name = 'Lemon Juice';

-- Fruit Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Traditional Fruit Cake' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Traditional Fruit Cake' AND i.name = 'Brown Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Traditional Fruit Cake' AND i.name = 'Butter (Unsalted)';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 4 FROM recipes r, ingredients i WHERE r.name = 'Traditional Fruit Cake' AND i.name = 'Eggs';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 500 FROM recipes r, ingredients i WHERE r.name = 'Traditional Fruit Cake' AND i.name = 'Dried Fruits (Mixed)';

-- Coconut Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Coconut Cake' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Coconut Cake' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 150 FROM recipes r, ingredients i WHERE r.name = 'Coconut Cake' AND i.name = 'Butter (Unsalted)';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 100 FROM recipes r, ingredients i WHERE r.name = 'Coconut Cake' AND i.name = 'Desiccated Coconut';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Coconut Cake' AND i.name = 'Milk'; -- Using milk as coconut milk substitute for simplicity or add coconut milk to ingredients

-- Strawberry Cake Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 250 FROM recipes r, ingredients i WHERE r.name = 'Fresh Strawberry Cake' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 200 FROM recipes r, ingredients i WHERE r.name = 'Fresh Strawberry Cake' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 150 FROM recipes r, ingredients i WHERE r.name = 'Fresh Strawberry Cake' AND i.name = 'Butter (Unsalted)';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 100 FROM recipes r, ingredients i WHERE r.name = 'Fresh Strawberry Cake' AND i.name = 'Strawberry Puree';

-- Vanilla Cupcakes Ingredients (Scaled down/different ratio)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 150 FROM recipes r, ingredients i WHERE r.name = 'Vanilla Cupcakes (Dozen)' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 150 FROM recipes r, ingredients i WHERE r.name = 'Vanilla Cupcakes (Dozen)' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 150 FROM recipes r, ingredients i WHERE r.name = 'Vanilla Cupcakes (Dozen)' AND i.name = 'Butter (Unsalted)';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 3 FROM recipes r, ingredients i WHERE r.name = 'Vanilla Cupcakes (Dozen)' AND i.name = 'Eggs';

-- Chocolate Cupcakes Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 120 FROM recipes r, ingredients i WHERE r.name = 'Chocolate Cupcakes (Dozen)' AND i.name = 'All-Purpose Flour';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 150 FROM recipes r, ingredients i WHERE r.name = 'Chocolate Cupcakes (Dozen)' AND i.name = 'Sugar';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 40 FROM recipes r, ingredients i WHERE r.name = 'Chocolate Cupcakes (Dozen)' AND i.name = 'Cocoa Powder';
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_grams_ml)
SELECT r.id, i.id, 100 FROM recipes r, ingredients i WHERE r.name = 'Chocolate Cupcakes (Dozen)' AND i.name = 'Vegetable Oil';
