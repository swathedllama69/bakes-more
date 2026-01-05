export const BAKING_KNOWLEDGE = [
    {
        keywords: ["substitute", "replace", "alternative"],
        responses: [
            { match: "egg", text: "For 1 egg, you can substitute 1/4 cup of applesauce, 1/4 cup of yogurt, or 1/2 mashed banana." },
            { match: "butter", text: "You can substitute butter with oil (1:1 ratio), applesauce (for moisture), or greek yogurt." },
            { match: "sugar", text: "Honey or maple syrup can replace sugar (use 3/4 cup for every cup of sugar and reduce liquid)." },
            { match: "milk", text: "Almond milk, soy milk, or oat milk are great 1:1 substitutes. For buttermilk, add 1 tbsp lemon juice to 1 cup milk." },
            { match: "flour", text: "For gluten-free, use a 1:1 GF blend. For cake flour, remove 2 tbsp AP flour per cup and add 2 tbsp cornstarch." }
        ],
        default: "I can help with substitutions for eggs, butter, sugar, milk, and flour. What do you need to replace?"
    },
    {
        keywords: ["convert", "conversion", "measure", "grams", "cups"],
        responses: [
            { match: "flour", text: "1 cup of All-Purpose Flour is approximately 120g." },
            { match: "sugar", text: "1 cup of Granulated Sugar is approx 200g. 1 cup of Brown Sugar is approx 220g (packed)." },
            { match: "butter", text: "1 stick of butter = 1/2 cup = 113g = 4 oz." },
            { match: "liquid", text: "1 cup = 240ml. 1 tbsp = 15ml. 1 tsp = 5ml." }
        ],
        default: "I can convert common ingredients like flour, sugar, and butter from cups to grams."
    },
    {
        keywords: ["temp", "temperature", "heat", "oven"],
        responses: [
            { match: "cake", text: "Most cakes bake well at 350°F (175°C)." },
            { match: "cookie", text: "Cookies usually bake at 350°F (175°C) or 375°F (190°C) for crispier edges." },
            { match: "bread", text: "Lean breads often need higher heat, around 400°F-425°F (200°C-220°C)." },
            { match: "pastry", text: "Puff pastry needs high heat (400°F/200°C) to rise properly." }
        ],
        default: "Standard baking temp is 350°F (175°C). Breads and pastries often need higher heat (400°F+)."
    },
    {
        keywords: ["troubleshoot", "wrong", "fail", "help", "flat", "dry"],
        responses: [
            { match: "flat", text: "If your cake/cookies are flat, your leavening (baking soda/powder) might be expired, or the butter was too warm." },
            { match: "dry", text: "Dry cakes often mean too much flour (did you scoop the cup?) or overbaking." },
            { match: "sink", text: "Cakes sinking in the middle usually means underbaking or opening the oven door too early." }
        ],
        default: "I can help troubleshoot! Tell me if your bake is flat, dry, or sinking."
    }
];

export function getKnowledgeResponse(input: string): string | null {
    const lowerInput = input.toLowerCase();

    for (const category of BAKING_KNOWLEDGE) {
        if (category.keywords.some(k => lowerInput.includes(k))) {
            const specific = category.responses.find(r => lowerInput.includes(r.match));
            return specific ? specific.text : category.default;
        }
    }

    return null;
}
