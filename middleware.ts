import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Handle Cloudflare cookie issues in development
  if (process.env.NODE_ENV === "development") {
    const response = NextResponse.next();

    // Remove problematic Cloudflare cookies in development
    response.cookies.delete("__cf_bm");
    response.cookies.delete("cf_clearance");

    // Set SameSite and Secure attributes for development
    response.headers.set(
      "Set-Cookie",
      response.headers.get("Set-Cookie")?.replace(/; Secure/g, "") || ""
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // SECURITY: Check email confirmation status for all dashboard routes
  if (user && isProtectedRoute) {
    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/check-email";
      url.searchParams.set('email', user.email || '');
      url.searchParams.set('message', 'email_confirmation_required');
      return NextResponse.redirect(url);
    }
  }

  // List of dashboard routes that are accessible even without active subscription
  const alwaysAccessibleRoutes = [
    '/dashboard/upgrade',
    '/dashboard/settings',
    '/dashboard/help'
  ];
  
  const isAlwaysAccessible = alwaysAccessibleRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Check subscription status for protected dashboard routes
  if (user && isProtectedRoute && !isAlwaysAccessible) {
    try {
      // Get dietitian subscription status
      const { data: dietitian } = await supabase
        .from('dietitians')
        .select('subscription_status, subscription_plan, trial_ends_at')
        .eq('auth_user_id', user.id)
        .single();

      if (dietitian) {
        const { subscription_status, subscription_plan, trial_ends_at } = dietitian;
        const now = new Date();
        const trialEnd = trial_ends_at ? new Date(trial_ends_at) : null;
        
        // Check if user has valid subscription or active trial
        const hasValidAccess = 
          subscription_status === 'active' ||
          (subscription_status === 'trialing' && trialEnd && trialEnd > now);

        // Redirect to upgrade page if no valid access
        if (!hasValidAccess) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard/upgrade";
          
          // Add context based on subscription status
          if (subscription_status === 'trialing' && trialEnd && trialEnd <= now) {
            url.searchParams.set('reason', 'trial_expired');
          } else if (subscription_status === 'canceled' || subscription_status === 'past_due') {
            url.searchParams.set('reason', 'subscription_required');
          } else {
            url.searchParams.set('reason', 'access_required');
          }
          
          return NextResponse.redirect(url);
        }
      } else {
        // No dietitian record found, redirect to upgrade
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/upgrade";
        url.searchParams.set('reason', 'profile_incomplete');
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // TODO: Add proper error logging to monitoring service
      // On error, redirect to upgrade page to be safe
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/upgrade";
      url.searchParams.set('reason', 'verification_error');
      return NextResponse.redirect(url);
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
