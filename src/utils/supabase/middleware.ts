import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/forgot-password') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        request.nextUrl.pathname !== '/' // Allow landing page if it exists, or force login
    ) {
        // no user, potentially redirect to login
        // For this app, let's assume everything under (admin) requires login
        // But since the structure is flat in src/app, we need to be careful.
        // The user has (admin) group, so we can check if the path is one of the protected ones.
        // Actually, let's just protect everything except /login and public assets.

        // However, the user might have a public facing site too?
        // Looking at the file structure: src/app/page.tsx exists.
        // src/app/(admin)/... exists.
        // We should probably protect the admin routes.

        // Let's redirect to login if accessing admin routes without user
        // Admin routes seem to be: /dashboard, /orders, /customers, /Calculator, /recipes, /pantry, /reports, /settings

        const protectedPaths = ['/dashboard', '/orders', '/customers', '/Calculator', '/recipes', '/pantry', '/reports', '/settings', '/estimator'];
        const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

        if (isProtected) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
