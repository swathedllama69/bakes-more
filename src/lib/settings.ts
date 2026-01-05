import { supabase } from "@/lib/supabase";
import { BAKERY_EMAILS } from "@/lib/constants/bakery";

export async function getAdminEmail() {
    try {
        // Try to fetch from a 'app_settings' table to avoid conflicts
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'admin_email')
            .single();

        if (data && data.value) {
            return data.value;
        }
    } catch (e) {
        console.warn("Could not fetch admin email from settings, falling back to constant.");
    }

    // Fallback to the constant if table doesn't exist or key is missing
    return BAKERY_EMAILS.ADMIN;
}
