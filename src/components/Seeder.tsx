"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { INGREDIENTS_SEED, RECIPES_SEED, FILLINGS_SEED } from "@/lib/seed/data";
import { Database } from "lucide-react";

export default function Seeder() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const supabase = createClient();

    const seedDatabase = async () => {
        if (!confirm("This will add sample data to your database. Continue?")) return;

        setLoading(true);
        setStatus("Starting seed...");

        try {
            // 1. Seed Ingredients
            setStatus("Seeding Ingredients...");
            const ingredientMap = new Map<string, string>();

            for (const ing of INGREDIENTS_SEED) {
                // Check if exists first to avoid duplicates if unique constraint isn't perfect
                const { data: existing } = await supabase
                    .from('ingredients')
                    .select('id')
                    .eq('name', ing.name)
                    .single();

                let ingId = existing?.id;

                if (!ingId) {
                    const { data, error } = await supabase
                        .from('ingredients')
                        .insert({
                            name: ing.name,
                            category: ing.category,
                            unit: ing.unit,
                            current_stock: 0,
                            min_stock_level: 1000,
                            purchase_price: ing.purchase_price,
                            purchase_quantity: ing.purchase_quantity
                        })
                        .select()
                        .single();

                    if (error) throw new Error(`Error inserting ${ing.name}: ${error.message}`);
                    ingId = data.id;
                }

                ingredientMap.set(ing.name, ingId);
            }

            // 2. Seed Recipes
            setStatus("Seeding Recipes...");
            for (const recipe of RECIPES_SEED) {
                // Create Recipe
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .insert({
                        name: recipe.name,
                        category: recipe.category,
                        baking_duration_minutes: recipe.baking_duration_minutes,
                        yield_amount: recipe.yield_amount,
                        yield_unit: recipe.yield_unit,
                        base_size_inches: recipe.base_size_inches,
                        selling_price: recipe.selling_price,
                        instructions: recipe.instructions,
                        base_cost: 0 // Will be calculated later
                    })
                    .select()
                    .single();

                if (recipeError) {
                    console.error(`Skipping recipe ${recipe.name}: ${recipeError.message}`);
                    continue;
                }

                // Add Ingredients
                const recipeIngredients = recipe.ingredients.map(ri => {
                    const ingId = ingredientMap.get(ri.name);
                    if (!ingId) {
                        console.warn(`Ingredient ${ri.name} not found for recipe ${recipe.name}`);
                        return null;
                    }
                    return {
                        recipe_id: recipeData.id,
                        ingredient_id: ingId,
                        amount_grams_ml: ri.quantity
                    };
                }).filter(Boolean);

                if (recipeIngredients.length > 0) {
                    const { error: riError } = await supabase
                        .from('recipe_ingredients')
                        .insert(recipeIngredients);

                    if (riError) throw new Error(`Error adding ingredients to ${recipe.name}: ${riError.message}`);
                }
            }

            // 3. Seed Fillings
            setStatus("Seeding Fillings...");
            for (const filling of FILLINGS_SEED) {
                const { error } = await supabase
                    .from('fillings')
                    .insert({
                        name: filling.name,
                        price: filling.price
                    });

                if (error) console.error(`Error inserting filling ${filling.name}: ${error.message}`);
            }

            setStatus("Database seeded successfully!");
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 mt-8">
            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" /> Database Tools
            </h3>
            <p className="text-sm text-slate-500 mb-4">
                Use this to populate your database with the initial menu and recipe data.
            </p>
            <div className="flex items-center gap-4">
                <button
                    onClick={seedDatabase}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50"
                >
                    {loading ? "Seeding..." : "Seed Database"}
                </button>
                {status && <span className="text-sm font-mono text-slate-600">{status}</span>}
            </div>
        </div>
    );
}
