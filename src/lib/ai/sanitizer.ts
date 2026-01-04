import { ProductionItem } from "@/lib/calculations/production";

export interface SanitizedOrder {
    id: string; // Keep ID for reference, but maybe hash it if strict privacy needed. For now, ID is okay.
    created_at: string;
    delivery_date: string;
    total_price: number;
    items: {
        name: string;
        quantity: number;
        size?: number;
        layers?: number;
    }[];
    status: string;
}

export const sanitizeOrderData = (order: any): SanitizedOrder => {
    return {
        id: order.id,
        created_at: order.created_at,
        delivery_date: order.delivery_date,
        total_price: order.total_price,
        status: order.status,
        items: order.order_items?.map((item: any) => ({
            name: item.recipes?.name || item.fillings?.name || 'Custom Item',
            quantity: item.quantity,
            size: item.size_inches,
            layers: item.layers
        })) || []
    };
};

export const sanitizeCustomerData = (customer: any) => {
    // We generally shouldn't send customer data to AI at all unless it's aggregate stats
    return {
        id: customer.id,
        total_orders: customer.orders?.length || 0,
        total_spend: customer.orders?.reduce((sum: number, o: any) => sum + o.total_price, 0) || 0
    };
};

export const prepareDailyBriefingData = (orders: any[], inventory: any[]) => {
    // Filter for today's relevant data
    const today = new Date();
    const dueToday = orders.filter(o => {
        const d = new Date(o.delivery_date);
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    }).map(sanitizeOrderData);

    const lowStock = inventory.filter(i => i.current_stock < i.min_stock_level).map(i => ({
        name: i.name,
        current: i.current_stock,
        min: i.min_stock_level,
        unit: i.unit
    }));

    return {
        date: today.toISOString(),
        orders_due: dueToday,
        low_stock_alerts: lowStock
    };
};
