export const SIZE_MULTIPLIERS: Record<number, number> = {
    4: 0.5,
    5: 0.8,
    6: 1.0, // Base Size
    7: 1.5,
    8: 2.0,
    9: 2.5,
    10: 3.0,
    12: 4.5,
    14: 6.0
};

export const BAKERY_EMAILS = {
    ADMIN: 'aliyuiliyasu16@gmail.com', // Update this to your admin email
    SENDER: 'orders@bakesandmore.com.ng'
};

export const getPackagingSize = (cakeSize: number): number => {
    if (cakeSize <= 6) return 8;
    if (cakeSize <= 8) return 10;
    if (cakeSize <= 10) return 12;
    return 14;
};