import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { BAKERY_EMAILS } from '@/lib/constants/bakery';

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

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error });
    }
}
