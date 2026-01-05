import { supabase } from '../supabase';

export async function calculateMaterials(recipeId: string, quantity: number) {
    // 1. Get the recipe details and its ingredients
    const { data: recipeData, error } = await supabase
        .from('recipe_ingredients')
        .select(`
      amount_grams_ml,
      ingredients (
        name,
        current_stock,
        unit,
        purchase_price,
        purchase_quantity
      )
    `)
        .eq('recipe_id', recipeId);

    if (error) throw error;

    // 2. Perform the 'Explosion' math
    const report = recipeData.map((item: any) => {
        const totalNeeded = item.amount_grams_ml * quantity;
        const stockShortfall = Math.max(0, totalNeeded - item.ingredients.current_stock);

        // Calculate cost per gram/ml to find restocking cost
        const costPerUnit = item.ingredients.purchase_price / item.ingredients.purchase_quantity;
        const restockCost = stockShortfall * costPerUnit;

        return {
            name: item.ingredients.name,
            needed: totalNeeded,
            inStock: item.ingredients.current_stock,
            shortfall: stockShortfall,
            costToRestock: restockCost,
            unit: item.ingredients.unit
        };
    });

    return report;
}