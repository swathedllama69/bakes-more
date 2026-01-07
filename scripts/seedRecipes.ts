import { createClient } from '@supabase/supabase-js';

// Load from environment or hardcode for local dev
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '<YOUR_SUPABASE_URL>';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '<YOUR_SUPABASE_SERVICE_ROLE_KEY>';
const supabase = createClient(supabaseUrl, supabaseKey);

// Example seed data
const recipes = [
  {
    name: 'Classic Vanilla Cake',
    category: 'Cake',
    baking_duration_minutes: 45,
    instructions: '1. Preheat oven to 180°C. 2. Mix dry and wet ingredients. 3. Bake for 45 mins.',
    yield_amount: 1,
    yield_unit: 'Unit',
    base_size_inches: 8,
    base_cost: 0,
    selling_price: 8000,
    layer_prices: { 1: 8000, 2: 15000, 3: 22000, 4: 28000 },
    ingredients: [
      { name: 'Flour', amount: 300 },
      { name: 'Sugar', amount: 200 },
      { name: 'Eggs', amount: 3 },
      { name: 'Butter', amount: 100 },
      { name: 'Vanilla', amount: 5 },
    ],
  },
  {
    name: 'Chocolate Fudge Cake',
    category: 'Cake',
    baking_duration_minutes: 50,
    instructions: '1. Preheat oven. 2. Mix cocoa with flour. 3. Bake for 50 mins.',
    yield_amount: 1,
    yield_unit: 'Unit',
    base_size_inches: 8,
    base_cost: 0,
    selling_price: 9000,
    layer_prices: { 1: 9000, 2: 17000, 3: 25000, 4: 32000 },
    ingredients: [
      { name: 'Flour', amount: 300 },
      { name: 'Sugar', amount: 200 },
      { name: 'Eggs', amount: 3 },
      { name: 'Butter', amount: 120 },
      { name: 'Cocoa Powder', amount: 40 },
    ],
  },
  {
    name: 'Red Velvet Cupcakes',
    category: 'Cupcake',
    baking_duration_minutes: 30,
    instructions: '1. Preheat oven. 2. Mix all ingredients. 3. Bake for 30 mins.',
    yield_amount: 12,
    yield_unit: 'Cupcakes',
    base_size_inches: null,
    base_cost: 0,
    selling_price: 6000,
    layer_prices: { 1: 6000 },
    ingredients: [
      { name: 'Flour', amount: 200 },
      { name: 'Sugar', amount: 150 },
      { name: 'Eggs', amount: 2 },
      { name: 'Butter', amount: 80 },
      { name: 'Red Food Color', amount: 3 },
    ],
  },
  {
    name: 'Banana Bread',
    category: 'Loaf',
    baking_duration_minutes: 55,
    instructions: '1. Preheat oven. 2. Mash bananas. 3. Mix and bake for 55 mins.',
    yield_amount: 1,
    yield_unit: 'Loaf',
    base_size_inches: null,
    base_cost: 0,
    selling_price: 7000,
    layer_prices: { 1: 7000 },
    ingredients: [
      { name: 'Flour', amount: 250 },
      { name: 'Sugar', amount: 120 },
      { name: 'Eggs', amount: 2 },
      { name: 'Butter', amount: 90 },
      { name: 'Banana', amount: 150 },
    ],
  },
];

async function seed() {
  for (const recipe of recipes) {
    // Check if recipe exists
    const { data: existing, error: findErr } = await supabase
      .from('recipes')
      .select('id')
      .eq('name', recipe.name)
      .single();
    if (existing) {
      console.log(`Recipe '${recipe.name}' already exists, skipping.`);
      continue;
    }
    // Insert recipe
    const { data: inserted, error } = await supabase
      .from('recipes')
      .insert({
        name: recipe.name,
        category: recipe.category,
        baking_duration_minutes: recipe.baking_duration_minutes,
        instructions: recipe.instructions,
        yield_amount: recipe.yield_amount,
        yield_unit: recipe.yield_unit,
        base_size_inches: recipe.base_size_inches,
        base_cost: recipe.base_cost,
        selling_price: recipe.selling_price,
        layer_prices: recipe.layer_prices,
      })
      .select()
      .single();
    if (error) {
      console.error('Error inserting recipe', recipe.name, error.message);
      continue;
    }
    // Insert ingredients (must match by name)
    for (const ing of recipe.ingredients) {
      const { data: ingredient, error: ingErr } = await supabase
        .from('ingredients')
        .select('id')
        .eq('name', ing.name)
        .single();
      if (!ingredient) {
        console.warn(`Ingredient '${ing.name}' not found for recipe '${recipe.name}', skipping.`);
        continue;
      }
      await supabase.from('recipe_ingredients').insert({
        recipe_id: inserted.id,
        ingredient_id: ingredient.id,
        amount_grams_ml: ing.amount,
      });
    }
    console.log(`Seeded recipe: ${recipe.name}`);
  }
}

seed().then(() => {
  console.log('Seeding complete.');
  process.exit(0);
});
