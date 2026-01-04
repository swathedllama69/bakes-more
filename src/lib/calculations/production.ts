import { SIZE_MULTIPLIERS } from '../constants/bakery';

export interface ProductionItem {
    id?: string; // Added ID for stock deduction
    name: string;
    type: 'Ingredient' | 'Packaging' | 'Overhead' | 'Custom' | 'Adjustment';
    requiredAmount: number;
    unit: string;
    stock: number;
    shortfall: number;
    costToBake: number; // Value of ingredients actually used
    costToRestock: number; // Cash needed to buy missing items
}

export interface ProductionSummary {
    items: ProductionItem[];
    totalCostToBake: number;
    totalRestockCost: number;
    totalProfit: number;
}

export const calculateJobCost = (
    cakeRecipe: any,
    fillingRecipe: any, // New: Filling Data
    packaging: any[],
    customItems: any[], // New: Manual Extras
    details: { size: number; layers: number; qty: number; salePrice: number },
    overheadRates: { gas: number; electricity: number } = { gas: 50, electricity: 30 }
): ProductionSummary => {
    const { size, layers, qty, salePrice } = details;
    const scale = (SIZE_MULTIPLIERS[size] || 1);

    let items: ProductionItem[] = [];

    // --- 1. CAKE LAYERS CALCULATION ---
    // Formula: Base Recipe * Scale * Layers * Quantity
    if (cakeRecipe) {
        cakeRecipe.ingredients.forEach((link: any) => {
            const needed = link.amount_grams_ml * scale * layers * qty;
            const stock = link.ingredients.current_stock;
            const pricePerUnit = link.ingredients.purchase_price / link.ingredients.purchase_quantity;

            items.push({
                id: link.ingredients.id,
                name: link.ingredients.name,
                type: 'Ingredient',
                requiredAmount: needed,
                unit: link.ingredients.unit,
                stock: stock,
                shortfall: Math.max(0, needed - stock),
                costToBake: needed * pricePerUnit,
                costToRestock: Math.max(0, needed - stock) * pricePerUnit
            });
        });
    }

    // --- 2. FILLING CALCULATION ---
    // Formula: Base Filling * Scale * (Layers - 1) * Quantity
    // (Assuming filling goes between layers. 3 layers = 2 filling layers)
    if (fillingRecipe && layers > 1) {
        const fillingLayers = layers - 1;
        fillingRecipe.ingredients.forEach((link: any) => {
            const needed = link.amount_grams_ml * scale * fillingLayers * qty;
            const stock = link.ingredients.current_stock;
            const pricePerUnit = link.ingredients.purchase_price / link.ingredients.purchase_quantity;

            // Check if ingredient already exists from cake (e.g., Butter used in both)
            const existing = items.find(i => i.name === link.ingredients.name);

            if (existing) {
                existing.requiredAmount += needed;
                existing.shortfall = Math.max(0, existing.requiredAmount - stock);
                existing.costToBake += needed * pricePerUnit;
                existing.costToRestock = existing.shortfall * pricePerUnit;
            } else {
                items.push({
                    id: link.ingredients.id,
                    name: link.ingredients.name,
                    type: 'Ingredient',
                    requiredAmount: needed,
                    unit: link.ingredients.unit,
                    stock: stock,
                    shortfall: Math.max(0, needed - stock),
                    costToBake: needed * pricePerUnit,
                    costToRestock: Math.max(0, needed - stock) * pricePerUnit
                });
            }
        });
    }

    // --- 3. PACKAGING (1 Box/Board per Cake) ---
    packaging.forEach(pkg => {
        const needed = qty;
        const pricePerUnit = pkg.purchase_price / pkg.purchase_quantity;

        items.push({
            id: pkg.id,
            name: pkg.name,
            type: 'Packaging',
            requiredAmount: needed,
            unit: 'pcs',
            stock: pkg.current_stock,
            shortfall: Math.max(0, needed - pkg.current_stock),
            costToBake: needed * pricePerUnit,
            costToRestock: Math.max(0, needed - pkg.current_stock) * pricePerUnit
        });
    });

    // --- 4. OVERHEADS (Energy) ---
    // Formula: Duration * CostPerMin * Batches (Simplified: 1 batch per 200 units for now, or per cake? Let's assume linear for simplicity or per baking session)
    const duration = cakeRecipe?.baking_duration_minutes || 45;
    const overheadCost = (duration * (overheadRates.gas + overheadRates.electricity));

    items.push({
        name: `Energy (Gas/Light - ${duration} mins)`,
        type: 'Overhead',
        requiredAmount: duration,
        unit: 'mins',
        stock: 0, // Infinite stock
        shortfall: 0,
        costToBake: overheadCost,
        costToRestock: 0 // You pay bills monthly, not per cake
    });

    // --- 5. CUSTOM EXTRAS ---
    customItems.forEach(extra => {
        items.push({
            name: extra.name,
            type: 'Custom',
            requiredAmount: extra.qty,
            unit: 'pcs',
            stock: 0,
            shortfall: 0,
            costToBake: extra.cost,
            costToRestock: extra.cost // Assumed immediate purchase
        });
    });

    // --- TOTALS ---
    const totalCostToBake = items.reduce((acc, i) => acc + i.costToBake, 0);
    const totalRestockCost = items.reduce((acc, i) => acc + i.costToRestock, 0);

    return {
        items,
        totalCostToBake,
        totalRestockCost,
        totalProfit: salePrice - totalCostToBake
    };
};