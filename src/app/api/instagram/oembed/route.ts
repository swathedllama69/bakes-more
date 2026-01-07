import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url || !url.includes('instagram.com')) {
            return NextResponse.json({ error: 'Invalid Instagram URL' }, { status: 400 });
        }

        // Extract post ID from URL
        const postIdMatch = url.match(/\/p\/([^\/\?]+)/);
        if (!postIdMatch) {
            return NextResponse.json({ error: 'Invalid Instagram post URL format' }, { status: 400 });
        }

        const postId = postIdMatch[1];

        // Use Instagram's oEmbed endpoint - no access token needed for public posts
        const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true&maxwidth=640`;

        const response = await fetch(oembedUrl);

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                thumbnail_url: data.thumbnail_url,
                html: data.html,
                author_name: data.author_name || '',
                title: data.title || '',
                embed_url: `https://www.instagram.com/p/${postId}/embed/`,
            });
        }

        // Fallback: Return embed URL
        return NextResponse.json({
            thumbnail_url: null,
            html: null,
            author_name: '',
            title: '',
            embed_url: `https://www.instagram.com/p/${postId}/embed/`,
        });
    } catch (error: any) {
        console.error('Instagram fetch error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch Instagram post'
        }, { status: 500 });
    }
}
