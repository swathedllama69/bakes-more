import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { BAKERY_EMAILS } from '@/lib/constants/bakery';

export async function POST(request: Request) {
    try {
        const { to, subject, html } = await request.json();

        const user = process.env.GMAIL_USER;
        const pass = process.env.GMAIL_APP_PASSWORD;

        if (!user || !pass) {
            console.log("Mock Email Sent (Missing Gmail Credentials):", { to, subject });
            return NextResponse.json({ success: true, message: "Mock email logged (no credentials)" });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass,
            },
        });

        const mailOptions = {
            from: `Bakes & More <${user}>`, // Gmail always overwrites this with the authenticated user
            to: to,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
}
