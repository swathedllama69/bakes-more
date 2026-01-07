"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LUXURY_FLAVORS = exports.FLAVORS = exports.LUXURY_UPCHARGE = exports.CAKE_PRICELIST = void 0;
// Structured pricelist for cakes and Bento cakes
exports.CAKE_PRICELIST = {
    regular: {
        4: {
            2: { 'Whipped Cream': 18000, 'Buttercream': 27000 },
            3: { 'Whipped Cream': 27000, 'Buttercream': 40000 },
            // No 4 layers, no fondant
        },
        5: {
            2: { 'Whipped Cream': 24000, 'Buttercream': 35000, 'Fondant': 30000 },
            3: { 'Whipped Cream': 35000, 'Buttercream': 44000, 'Fondant': 38000 },
            4: { 'Whipped Cream': 45000, 'Buttercream': 57000 }, // no fondant
        },
        6: {
            2: { 'Whipped Cream': 30000, 'Buttercream': 39000, 'Fondant': 35000 },
            3: { 'Whipped Cream': 44000, 'Buttercream': 56000, 'Fondant': 51000 },
            4: { 'Whipped Cream': 58000, 'Buttercream': 75000, 'Fondant': 70000 },
        },
        7: {
            2: { 'Whipped Cream': 40000, 'Buttercream': 53000, 'Fondant': 48000 },
            3: { 'Whipped Cream': 58000, 'Buttercream': 75000, 'Fondant': 69000 },
            4: { 'Whipped Cream': 77000, 'Buttercream': 99000, 'Fondant': 94000 },
        },
        8: {
            2: { 'Whipped Cream': 46000, 'Buttercream': 56000, 'Fondant': 51000 },
            3: { 'Whipped Cream': 68000, 'Buttercream': 82000, 'Fondant': 74000 },
            4: { 'Whipped Cream': 89000, 'Buttercream': 109000, 'Fondant': 100000 },
        },
        9: {
            2: { 'Whipped Cream': 53000, 'Buttercream': 68000, 'Fondant': 63000 },
            3: { 'Whipped Cream': 78000, 'Buttercream': 99000, 'Fondant': 93000 },
            4: { 'Whipped Cream': 100000, 'Buttercream': 130000, 'Fondant': 124000 },
        },
        10: {
            2: { 'Whipped Cream': 53000, 'Buttercream': 68000, 'Fondant': 63000 },
            3: { 'Whipped Cream': 78000, 'Buttercream': 99000, 'Fondant': 93000 },
            4: { 'Whipped Cream': 100000, 'Buttercream': 130000, 'Fondant': 124000 },
        },
        12: {
            2: { 'Whipped Cream': 80000, 'Buttercream': 97000, 'Fondant': 90000 },
            3: { 'Whipped Cream': 115000, 'Buttercream': 142000, 'Fondant': 131000 },
            4: { 'Whipped Cream': 155000, 'Buttercream': 190000, 'Fondant': 174000 },
        },
        14: {
            2: { 'Whipped Cream': 90000, 'Buttercream': 120000, 'Fondant': 108000 },
            3: { 'Whipped Cream': 132000, 'Buttercream': 170000, 'Fondant': 160000 },
            4: { 'Whipped Cream': 175000, 'Buttercream': 225000, 'Fondant': 214000 },
        },
    },
    bento: {
        4: 10000,
        5: 13000,
        6: 16000,
        7: 22000,
        8: 25000,
        9: 28000,
        10: 28000,
        12: 35000,
        14: 42000,
    },
};
exports.LUXURY_UPCHARGE = [
    { sizes: [4, 5], upcharge: 1000 },
    { sizes: [6, 7], upcharge: 2000 },
    { sizes: [8, 9, 10], upcharge: 3000 },
    { sizes: [12], upcharge: 5000 },
    { sizes: [14], upcharge: 7000 }, // can be up to 10000 for some flavors
];
exports.FLAVORS = [
    'Vanilla', 'Chocolate', 'Red Velvet', 'Strawberry', 'Lemon', 'Carrot', 'Banana', 'Coconut', 'Blueberry', 'Plain'
];
exports.LUXURY_FLAVORS = [
    'Oreo', 'Lotus', 'Coconut', 'Lemon', 'Banana', 'Carrot', 'Strawberry', 'Marble', 'Chocolate Oreo', 'Red Velvet Oreo', 'Fruit Cake (Non-Alcoholic)'
];
