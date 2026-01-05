
export const INGREDIENTS_SEED = [
    // Dry Goods
    { name: 'All Purpose Flour', category: 'Flour/Dry', unit: 'g', purchase_price: 1000, purchase_quantity: 1000 },
    { name: 'Sugar', category: 'Flour/Dry', unit: 'g', purchase_price: 1500, purchase_quantity: 1000 },
    { name: 'Cocoa Powder', category: 'Flour/Dry', unit: 'g', purchase_price: 4000, purchase_quantity: 1000 },
    { name: 'Baking Soda', category: 'Flour/Dry', unit: 'g', purchase_price: 500, purchase_quantity: 100 },
    { name: 'Baking Powder', category: 'Flour/Dry', unit: 'g', purchase_price: 500, purchase_quantity: 100 },
    { name: 'Salt', category: 'Flour/Dry', unit: 'g', purchase_price: 200, purchase_quantity: 1000 },
    { name: 'Icing Sugar', category: 'Flour/Dry', unit: 'g', purchase_price: 2000, purchase_quantity: 1000 },
    { name: 'CMC', category: 'Flour/Dry', unit: 'g', purchase_price: 1000, purchase_quantity: 100 },
    { name: 'Gelatin', category: 'Flour/Dry', unit: 'g', purchase_price: 1000, purchase_quantity: 100 },

    // Wet Goods / Dairy
    { name: 'Egg', category: 'Dairy/Eggs', unit: 'pcs', purchase_price: 100, purchase_quantity: 1 },
    { name: 'Milk', category: 'Dairy/Eggs', unit: 'ml', purchase_price: 1200, purchase_quantity: 1000 },
    { name: 'Buttermilk', category: 'Dairy/Eggs', unit: 'ml', purchase_price: 1500, purchase_quantity: 1000 },
    { name: 'Whipping Cream', category: 'Dairy/Eggs', unit: 'ml', purchase_price: 4000, purchase_quantity: 1000 },
    { name: 'Butter', category: 'Dairy/Eggs', unit: 'g', purchase_price: 3000, purchase_quantity: 250 },
    { name: 'Vegetable Oil', category: 'Liquids', unit: 'ml', purchase_price: 2000, purchase_quantity: 1000 },
    { name: 'Vinegar', category: 'Liquids', unit: 'ml', purchase_price: 500, purchase_quantity: 500 },
    { name: 'Water', category: 'Liquids', unit: 'ml', purchase_price: 0, purchase_quantity: 1000 },
    { name: 'Glucose', category: 'Liquids', unit: 'g', purchase_price: 1000, purchase_quantity: 500 },

    // Flavorings & Extras
    { name: 'Vanilla Flavor', category: 'Flavoring', unit: 'ml', purchase_price: 2000, purchase_quantity: 100 },
    { name: 'Chocolate Flavor', category: 'Flavoring', unit: 'ml', purchase_price: 2000, purchase_quantity: 100 },
    { name: 'Red Food Colour', category: 'Flavoring', unit: 'ml', purchase_price: 1500, purchase_quantity: 100 },
    { name: 'Shortening', category: 'Fats', unit: 'g', purchase_price: 1500, purchase_quantity: 500 },
    { name: 'Bananas', category: 'Produce', unit: 'pcs', purchase_price: 200, purchase_quantity: 1 },
];

export const RECIPES_SEED = [
    // --- Chocolate Cake ---
    {
        name: 'Chocolate Cake (5-6 inch)',
        category: 'Cake',
        baking_duration_minutes: 45,
        yield_amount: 1,
        yield_unit: 'Cake',
        base_size_inches: 6,
        selling_price: 30000, // Based on 6" 2 layer price
        instructions: 'Mix dry ingredients. Add wet ingredients. Bake.',
        ingredients: [
            { name: 'All Purpose Flour', quantity: 188 }, // 1.5 cups * 125g
            { name: 'Sugar', quantity: 200 }, // 1 cup
            { name: 'Cocoa Powder', quantity: 21 }, // 1/4 cup * 85g
            { name: 'Baking Soda', quantity: 5 }, // 1 tsp
            { name: 'Salt', quantity: 2.5 }, // 1/2 tsp
            { name: 'Egg', quantity: 1 },
            { name: 'Water', quantity: 240 }, // 1 cup
            { name: 'Vegetable Oil', quantity: 80 }, // 1/3 cup * 240ml
            { name: 'Vanilla Flavor', quantity: 15 }, // 1 tbsp (assuming 'Flavour' is vanilla)
            { name: 'Vinegar', quantity: 15 }, // 1 tbsp
            { name: 'Chocolate Flavor', quantity: 5 }, // 1 tsp
        ]
    },
    {
        name: 'Chocolate Cake (8 inch)',
        category: 'Cake',
        baking_duration_minutes: 50,
        yield_amount: 1,
        yield_unit: 'Cake',
        base_size_inches: 8,
        selling_price: 46000,
        instructions: 'Mix dry ingredients. Add wet ingredients. Bake.',
        ingredients: [
            { name: 'All Purpose Flour', quantity: 375 }, // 3 cups
            { name: 'Sugar', quantity: 400 }, // 2 cups
            { name: 'Baking Soda', quantity: 30 }, // 2 tbsp
            { name: 'Egg', quantity: 2 },
            { name: 'Milk', quantity: 480 }, // 2 cups
            { name: 'Vinegar', quantity: 30 }, // 2 tbsp
            { name: 'Vegetable Oil', quantity: 160 }, // 2/3 cup
            { name: 'Cocoa Powder', quantity: 42 }, // 1/2 cup
            { name: 'Salt', quantity: 5 }, // 1 tsp
            { name: 'Chocolate Flavor', quantity: 10 }, // 2 tsp
        ]
    },

    // --- Red Velvet ---
    {
        name: 'Red Velvet (8 inch)',
        category: 'Cake',
        baking_duration_minutes: 50,
        yield_amount: 1,
        yield_unit: 'Cake',
        base_size_inches: 8,
        selling_price: 46000,
        instructions: 'Mix dry. Mix wet with color. Combine.',
        ingredients: [
            { name: 'Sugar', quantity: 266 }, // 1 1/3 cups
            { name: 'Egg', quantity: 2 },
            { name: 'Vegetable Oil', quantity: 180 }, // 3/4 cup
            { name: 'Red Food Colour', quantity: 4 }, // 3/4 tsp
            { name: 'Baking Soda', quantity: 5 }, // 1 tsp
            { name: 'Baking Powder', quantity: 5 }, // 1 tsp
            { name: 'Buttermilk', quantity: 240 }, // 1 cup
            { name: 'All Purpose Flour', quantity: 250 }, // 2 cups
            { name: 'Salt', quantity: 2.5 }, // 1/2 tsp
            { name: 'Vanilla Flavor', quantity: 2.5 }, // 1/2 tsp
            { name: 'Vinegar', quantity: 5 }, // 1 tsp
        ]
    },
    {
        name: 'Red Velvet (5-6 inch)',
        category: 'Cake',
        baking_duration_minutes: 40,
        yield_amount: 1,
        yield_unit: 'Cake',
        base_size_inches: 6,
        selling_price: 30000,
        instructions: 'Mix dry. Mix wet with color. Combine.',
        ingredients: [
            { name: 'All Purpose Flour', quantity: 125 }, // 1 cup
            { name: 'Sugar', quantity: 140 }, // 1/2 cup + 2tbsp + 2tsp approx
            { name: 'Vegetable Oil', quantity: 180 }, // 3/4 cup
            { name: 'Cocoa Powder', quantity: 5 }, // 1 tsp
            { name: 'Baking Powder', quantity: 2.5 }, // 1/2 tsp
            { name: 'Baking Soda', quantity: 2.5 }, // 1/2 tsp
            { name: 'Vanilla Flavor', quantity: 1.25 }, // 1/4 tsp
            { name: 'Salt', quantity: 1.25 }, // 1/4 tsp
            { name: 'Egg', quantity: 1 },
            { name: 'Buttermilk', quantity: 120 }, // 1/2 cup
            { name: 'Vinegar', quantity: 2.5 }, // 1/2 tsp
        ]
    },

    // --- Vanilla ---
    {
        name: 'Vanilla Cake (8 inch)',
        category: 'Cake',
        baking_duration_minutes: 50,
        yield_amount: 1,
        yield_unit: 'Cake',
        base_size_inches: 8,
        selling_price: 46000,
        instructions: 'Cream butter and sugar. Add eggs. Add dry and wet alternately.',
        ingredients: [
            { name: 'Butter', quantity: 100 },
            { name: 'Sugar', quantity: 300 }, // 1.5 cups
            { name: 'Vegetable Oil', quantity: 120 }, // 1/2 cup
            { name: 'Milk', quantity: 240 }, // 1 cup
            { name: 'Baking Powder', quantity: 15 }, // 1 tbsp
            { name: 'Salt', quantity: 2.5 }, // 1/2 tsp
            { name: 'Egg', quantity: 5 },
            { name: 'All Purpose Flour', quantity: 345 }, // 2 3/4 cups
            { name: 'Vanilla Flavor', quantity: 5 }, // 1 tsp
        ]
    },
    {
        name: 'Vanilla Cake (6 inch)',
        category: 'Cake',
        baking_duration_minutes: 40,
        yield_amount: 1,
        yield_unit: 'Cake',
        base_size_inches: 6,
        selling_price: 30000,
        instructions: 'Cream butter and sugar. Add eggs. Add dry and wet alternately.',
        ingredients: [
            { name: 'All Purpose Flour', quantity: 180 }, // 1 cup + 6 tbsp
            { name: 'Vegetable Oil', quantity: 120 }, // 1/2 cup
            { name: 'Butter', quantity: 50 },
            { name: 'Milk', quantity: 120 }, // 1/2 cup
            { name: 'Sugar', quantity: 150 }, // 3/4 cup
            { name: 'Baking Powder', quantity: 7.5 }, // 1/2 tbsp
            { name: 'Vanilla Flavor', quantity: 2.5 }, // 1/2 tsp
            { name: 'Salt', quantity: 1.25 }, // 1/4 tsp
            { name: 'Egg', quantity: 3 },
        ]
    },

    // --- Banana Bread ---
    {
        name: 'Banana Bread',
        category: 'Bread',
        baking_duration_minutes: 60,
        yield_amount: 1,
        yield_unit: 'Loaf',
        base_size_inches: 0,
        selling_price: 5000, // Estimated
        instructions: 'Mash bananas. Mix wet. Mix dry. Combine.',
        ingredients: [
            { name: 'Bananas', quantity: 3 }, // Approx 1.5 cups mashed
            { name: 'Butter', quantity: 75 }, // 1/3 cup melted
            { name: 'Baking Soda', quantity: 5 }, // 1 tsp
            { name: 'Salt', quantity: 2.5 }, // 1/2 tsp
            { name: 'Egg', quantity: 1 },
            { name: 'Vanilla Flavor', quantity: 5 }, // 1 tsp
            { name: 'All Purpose Flour', quantity: 188 }, // 1.5 cups
            { name: 'Sugar', quantity: 150 }, // 3/4 cup
        ]
    },

    // --- Frostings ---
    {
        name: 'American Buttercream (6 inch)',
        category: 'Frosting',
        baking_duration_minutes: 10,
        yield_amount: 1,
        yield_unit: 'Batch',
        base_size_inches: 6,
        selling_price: 0, // Component
        instructions: 'Beat butter. Add sugar and milk.',
        ingredients: [
            { name: 'Butter', quantity: 250 },
            { name: 'Icing Sugar', quantity: 500 },
            { name: 'Milk', quantity: 30 }, // Few tbsp
        ]
    },
    {
        name: 'Swiss Meringue Buttercream (6 inch)',
        category: 'Frosting',
        baking_duration_minutes: 20,
        yield_amount: 1,
        yield_unit: 'Batch',
        base_size_inches: 6,
        selling_price: 0,
        instructions: 'Heat egg whites and sugar. Whip. Add butter.',
        ingredients: [
            { name: 'Butter', quantity: 400 },
            { name: 'Egg', quantity: 4 }, // Egg whites
            { name: 'Sugar', quantity: 200 }, // 1 cup
            { name: 'Shortening', quantity: 50 },
        ]
    },
    {
        name: 'Whipped Cream (6 inch)',
        category: 'Frosting',
        baking_duration_minutes: 10,
        yield_amount: 1,
        yield_unit: 'Batch',
        base_size_inches: 6,
        selling_price: 0,
        instructions: 'Whip cream with cold water/milk.',
        ingredients: [
            { name: 'Whipping Cream', quantity: 300 }, // For 6" 2 layers
            { name: 'Water', quantity: 180 }, // 1.5 cups approx (ratio 100g : 1/2 cup)
        ]
    },
    {
        name: 'Fondant (6 inch)',
        category: 'Frosting',
        baking_duration_minutes: 0,
        yield_amount: 1,
        yield_unit: 'Batch',
        base_size_inches: 6,
        selling_price: 0,
        instructions: 'Mix ingredients.',
        ingredients: [
            { name: 'Icing Sugar', quantity: 500 },
            { name: 'CMC', quantity: 5 }, // 1 tsp
            { name: 'Glucose', quantity: 80 }, // 1/4 cup approx
            { name: 'Water', quantity: 60 }, // 1/4 cup
            { name: 'Gelatin', quantity: 15 }, // 1 tbsp
        ]
    }
];

export const FILLINGS_SEED = [
    { name: 'Chocolate Fudge Sauce', price: 2000 },
    { name: 'Dulce De Leche', price: 3000 },
    { name: 'Salted Caramel', price: 2500 },
    { name: 'Strawberry Sauce', price: 2000 },
    { name: 'Pastry Cream', price: 2000 },
    { name: 'Lotus Cream/Spread/Crumbs', price: 4000 },
    { name: 'Oreo Cream/Chunks', price: 3000 },
    { name: 'Chocolate Chunks', price: 2500 },
    { name: 'Chocolate Mousse', price: 3500 },
    { name: 'Orange Curd', price: 3000 },
    { name: 'Mango Mousse/Curd', price: 3000 },
    { name: 'Lemon Curd', price: 3000 },
    { name: 'Nutella/Nutella Cream', price: 4000 },
    { name: 'Cream Cheese', price: 3500 },
];
