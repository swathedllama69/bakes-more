import { createClient } from '@supabase/supabase-js';
import { CAKE_PRICELIST, LUXURY_UPCHARGE, FLAVORS, LUXURY_FLAVORS } from './cakePricelist';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '<YOUR_SUPABASE_URL>';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '<YOUR_SUPABASE_SERVICE_ROLE_KEY>';
const supabase = createClient(supabaseUrl, supabaseKey);

function getLuxuryUpcharge(size: number) {
  for (const rule of LUXURY_UPCHARGE) {
    if (rule.sizes.includes(size)) return rule.upcharge;
  }
  return 0;
}

async function seedCakes() {
  // Regular cakes
  for (const sizeStr of Object.keys(CAKE_PRICELIST.regular)) {
    const size = Number(sizeStr);
    const layerMap = (CAKE_PRICELIST.regular as any)[sizeStr];
    for (const layerStr of Object.keys(layerMap)) {
      const layer = Number(layerStr);
      const frostings = layerMap[layerStr];
      for (const frosting of Object.keys(frostings)) {
        const basePrice = frostings[frosting];
        // Regular flavors
        for (const flavor of FLAVORS) {
          const name = `${flavor} Cake ${size}\" ${layer}L (${frosting})`;
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
          const name = `${luxuryFlavor} Cake ${size}\" ${layer}L (${frosting})`;
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
    const price = (CAKE_PRICELIST.bento as any)[sizeStr];
    const name = `Bento Cake ${size}\" (Whipped Cream)`;
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

async function upsertRecipe({ name, category, base_size_inches, layers, frosting, flavor, luxury, price }: any) {
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
