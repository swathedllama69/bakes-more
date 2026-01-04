import { supabase } from '../supabase';

export async function calculateMaterials(recipeId: string, quantity: number) {
    // 1. Get the recipe details and its ingredients
    const { data: recipeData, error } = await supabase
        .from('recipe_ingredients')
        .select(`
      quantity_required,
      ingredients (
        name,
        current_stock,
        unit,
        cost_per_purchase_unit,
        purchase_unit_quantity
      )
    `)
        .eq('recipe_id', recipeId);

    if (error) throw error;

    // 2. Perform the 'Explosion' math
    const report = recipeData.map((item: any) => {
        const totalNeeded = item.quantity_required * quantity;
        const stockShortfall = Math.max(0, totalNeeded - item.ingredients.current_stock);

        // Calculate cost per gram/ml to find restocking cost
        const costPerUnit = item.ingredients.cost_per_purchase_unit / item.ingredients.purchase_unit_quantity;
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