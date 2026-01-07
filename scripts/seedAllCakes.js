"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { createClient } = require('@supabase/supabase-js');
const { CAKE_PRICELIST, LUXURY_UPCHARGE, FLAVORS, LUXURY_FLAVORS } = require('./cakePricelist');

const supabaseUrl = 'https://wivvtqskbajmvxfpoobo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdnZ0cXNrYmFqbXZ4ZnBvb2JvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU1OTQxNiwiZXhwIjoyMDgzMTM1NDE2fQ.8UJooK-z73WErwzjrrte_iDJ3-2zMbgs9kzbdJyIBbE';
const supabase = createClient(supabaseUrl, supabaseKey);

function getLuxuryUpcharge(size) {
    for (const rule of LUXURY_UPCHARGE) {
        if (rule.sizes.includes(size)) return rule.upcharge;
    }
    return 0;
}

async function seedCakes() {
    // Regular cakes
    for (const sizeStr of Object.keys(CAKE_PRICELIST.regular)) {
        const size = Number(sizeStr);
        const layerMap = CAKE_PRICELIST.regular[sizeStr];
        for (const layerStr of Object.keys(layerMap)) {
            const layer = Number(layerStr);
            const frostings = layerMap[layerStr];
            for (const frosting of Object.keys(frostings)) {
                const basePrice = frostings[frosting];
                // Regular flavors
                for (const flavor of FLAVORS) {
                    const name = `${flavor} Cake ${size}" ${layer}L (${frosting})`;
                    await upsertRecipe({
                        name,
                        category: 'Cake',
                        base_size_inches: size,
                        layers: layer,
                        frosting,
                        flavor,
                        luxury: false,
                        price: basePrice,
                    });
                }
                // Luxury flavors
                for (const luxuryFlavor of LUXURY_FLAVORS) {
                    const upcharge = getLuxuryUpcharge(size);
                    const name = `${luxuryFlavor} Cake ${size}" ${layer}L (${frosting})`;
                    await upsertRecipe({
                        name,
                        category: 'Cake',
                        base_size_inches: size,
                        layers: layer,
                        frosting,
                        flavor: luxuryFlavor,
                        luxury: true,
                        price: basePrice + upcharge,
                    });
                }
            }
        }
    }
    // Bento cakes (whipped cream only)
    for (const sizeStr of Object.keys(CAKE_PRICELIST.bento)) {
        const size = Number(sizeStr);
        const price = CAKE_PRICELIST.bento[sizeStr];
        const name = `Bento Cake ${size}" (Whipped Cream)`;
        await upsertRecipe({
            name,
            category: 'Bento',
            base_size_inches: size,
            layers: 1,
            frosting: 'Whipped Cream',
            flavor: 'Vanilla',
            luxury: false,
            price,
        });
    }
}

async function upsertRecipe({ name, category, base_size_inches, layers, frosting, flavor, luxury, price }) {
    // Check if recipe exists
    const { data: existing } = await supabase
        .from('recipes')
        .select('id')
        .eq('name', name)
        .single();
    if (existing) {
        console.log(`Recipe '${name}' already exists, skipping.`);
        return;
    }
    // Insert recipe
    const { error } = await supabase.from('recipes').insert({
        name,
        category,
        base_size_inches,
        layers,
        frosting,
        flavor,
        luxury,
        selling_price: price,
        // Add more fields as needed
    });
    if (error) {
        console.error('Error inserting', name, error.message);
    } else {
        console.log('Seeded', name);
    }
}

seedCakes().then(() => {
    console.log('Seeding complete.');
    process.exit(0);
});
