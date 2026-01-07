// Seed script for new recipes structure: (flavor, frosting, size, cake_type) with prices as JSON
const { createClient } = require('@supabase/supabase-js');
const { CAKE_PRICELIST, LUXURY_UPCHARGE, FLAVORS, LUXURY_FLAVORS } = require('./cakePricelist');

const supabaseUrl = 'https://wivvtqskbajmvxfpoobo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdnZ0cXNrYmFqbXZ4ZnBvb2JvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU1OTQxNiwiZXhwIjoyMDgzMTM1NDE2fQ.8UJooK-z73WErwzjrrte_iDJ3-2zMbgs9kzbdJyIBbE';
const supabase = createClient(supabaseUrl, supabaseKey);

const CAKE_TYPES = ['Round', 'Square']; // Add more as needed

function getLuxuryUpcharge(size) {
    for (const rule of LUXURY_UPCHARGE) {
        if (rule.sizes.includes(size)) return rule.upcharge;
    }
    return 0;
}

async function seedCakes() {
    for (const sizeStr of Object.keys(CAKE_PRICELIST.regular)) {
        const size = Number(sizeStr);
        const layerMap = CAKE_PRICELIST.regular[sizeStr];
        for (const frosting of Object.keys(layerMap[Object.keys(layerMap)[0]])) {
            // Build prices object for all layers for this size/frosting
            let prices = {};
            for (const layerStr of Object.keys(layerMap)) {
                const price = layerMap[layerStr][frosting];
                if (price) prices[layerStr] = price;
            }
            for (const cake_type of CAKE_TYPES) {
                for (const flavor of FLAVORS) {
                    await upsertRecipe({
                        name: `${flavor} Cake ${size}\" (${frosting}, ${cake_type})`,
                        category: 'Cake',
                        size: sizeStr,
                        frosting,
                        flavor,
                        cake_type,
                        luxury: false,
                        prices,
                    });
                }
                for (const luxuryFlavor of LUXURY_FLAVORS) {
                    const upcharge = getLuxuryUpcharge(size);
                    // Add upcharge to each layer price
                    let luxuryPrices = {};
                    for (const layerStr of Object.keys(prices)) {
                        luxuryPrices[layerStr] = prices[layerStr] + upcharge;
                    }
                    await upsertRecipe({
                        name: `${luxuryFlavor} Cake ${size}\" (${frosting}, ${cake_type})`,
                        category: 'Cake',
                        size: sizeStr,
                        frosting,
                        flavor: luxuryFlavor,
                        cake_type,
                        luxury: true,
                        prices: luxuryPrices,
                    });
                }
            }
        }
    }
    // Bento cakes (whipped cream only, 1 layer)
    for (const sizeStr of Object.keys(CAKE_PRICELIST.bento)) {
        const size = Number(sizeStr);
        const price = CAKE_PRICELIST.bento[sizeStr];
        for (const cake_type of CAKE_TYPES) {
            await upsertRecipe({
                name: `Bento Cake ${size}\" (Whipped Cream, ${cake_type})`,
                category: 'Bento',
                size: sizeStr,
                frosting: 'Whipped Cream',
                flavor: 'Vanilla',
                cake_type,
                luxury: false,
                prices: { '1': price },
            });
        }
    }
}

async function upsertRecipe({ name, category, size, frosting, flavor, cake_type, luxury, prices }) {
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
        size,
        frosting,
        flavor,
        cake_type,
        luxury,
        prices,
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
