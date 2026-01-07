// Whipped Cream Cake Pricing (from official price list)
export const WHIPPED_CREAM_PRICING: { [inches: number]: { [layers: number]: number } } = {
    4: {
        2: 18000,
        3: 27000,
    },
    5: {
        2: 24000,
        3: 35000,
        4: 45000,
    },
    6: {
        2: 30000,
        3: 44000,
        4: 58000,
    },
    7: {
        2: 40000,
        3: 58000,
        4: 77000,
    },
    8: {
        2: 46000,
        3: 68000,
        4: 89000,
    },
    10: {
        2: 53000,
        3: 78000,
        4: 100000,
    },
    12: {
        2: 80000,
        3: 115000,
        4: 155000,
    },
    14: {
        2: 90000,
        3: 132000,
        4: 175000,
    },
};

// Add-ons Pricing (from price list notes)
export const ADDON_PRICING = {
    CHARACTER_TOPPER: { min: 9000, max: 11000 },
    CUSTOMIZED_TOPPER: 4000,
    EDIBLE_PRINTS: { small: 2000, large: 5000 },
    FLOWERS_FRESH: 3000,
    FAUX_BALLS: { small: 3000, large: 6000 },
    RUSH_ORDER_FEE: 3000, // Orders < 48hrs notice
};

// Get base price for a cake size and layers
export function getWhippedCreamPrice(inches: number, layers: number): number | null {
    return WHIPPED_CREAM_PRICING[inches]?.[layers] || null;
}

// Get all available size/layer combinations
export function getAvailableCakes(): Array<{ inches: number; layers: number; price: number; label: string }> {
    const cakes: Array<{ inches: number; layers: number; price: number; label: string }> = [];

    Object.entries(WHIPPED_CREAM_PRICING).forEach(([inches, layerPrices]) => {
        Object.entries(layerPrices).forEach(([layers, price]) => {
            cakes.push({
                inches: Number(inches),
                layers: Number(layers),
                price,
                label: `${inches}" Cake - ${layers} Layer${Number(layers) > 1 ? 's' : ''}`,
            });
        });
    });

    return cakes.sort((a, b) => a.inches - b.inches || a.layers - b.layers);
}

// Check if 48 hour notice requirement is met
export function isRushOrder(deliveryDate: Date): boolean {
    const now = new Date();
    const hoursDiff = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 48;
}
