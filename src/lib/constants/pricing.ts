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

function roundToNearest(value: number, nearest: number) {
    return Math.round(value / nearest) * nearest;
}

export function inferOneLayerPrice(inches: number): number | null {
    const row = WHIPPED_CREAM_PRICING[inches];
    if (!row) return null;
    if (row[1]) return row[1];
    const price2 = row[2];
    if (!price2) return null;

    const inc23 = row[3] ? row[3] - row[2] : null;
    const inc34 = row[4] ? row[4] - row[3] : null;

    const increments = [inc23, inc34].filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const avgIncrement = increments.length ? increments.reduce((a, b) => a + b, 0) / increments.length : 0;

    const inferred = price2 - avgIncrement;
    if (!Number.isFinite(inferred)) return null;
    return Math.max(0, roundToNearest(inferred, 100));
}

// Get base price for a cake size and layers
export function getWhippedCreamPrice(
    inches: number,
    layers: number,
    options?: { inferMissingOneLayer?: boolean }
): number | null {
    const direct = WHIPPED_CREAM_PRICING[inches]?.[layers];
    if (direct) return direct;
    if (layers === 1 && options?.inferMissingOneLayer) {
        return inferOneLayerPrice(inches);
    }
    return null;
}

export function getAvailableSizes(): number[] {
    return Object.keys(WHIPPED_CREAM_PRICING)
        .map(Number)
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);
}

export function getLayerPricesForSize(inches: number): Array<{ layers: number; price: number | null; isInferred?: boolean }> {
    const row = WHIPPED_CREAM_PRICING[inches];
    if (!row) return [];
    return [1, 2, 3, 4].map((l) => {
        if (row[l]) return { layers: l, price: row[l] };
        if (l === 1) return { layers: 1, price: inferOneLayerPrice(inches), isInferred: true };
        return { layers: l, price: null };
    });
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
