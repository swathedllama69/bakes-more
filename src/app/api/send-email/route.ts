import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { BAKERY_EMAILS } from '@/lib/constants/bakery';
import { supabase } from '@/lib/supabase'; // Ensure this client is available on server side

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { to, subject, html } = await request.json();

        if (!process.env.RESEND_API_KEY) {
            console.log("Mock Email Sent:", { to, subject });
            return NextResponse.json({ success: true, message: "Mock email logged (no API key)" });
        }

        const data = await resend.emails.send({
            from: `Bakes & More <${BAKERY_EMAILS.SENDER}>`,
            to: [to],
            subject: subject,
            html: html,
        });

        // Log to Supabase
        const { error: logError } = await supabase
            .from('email_logs')
            .insert({
                recipient: to,
                subject: subject,
                html: html,
                status: 'sent'
            });

        if (logError) console.error("Error logging email:", logError);

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error });
    }
}
