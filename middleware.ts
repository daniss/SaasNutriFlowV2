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

  // Pro routes that require active subscription
  const proRoutes = [
    "/dashboard/meal-plans/generate", // AI meal plan generation
    "/dashboard/analytics", // Advanced analytics
    "/dashboard/api", // API access
    "/dashboard/branding" // Custom branding
  ];
  
  const isProRoute = proRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Check subscription status for Pro routes
  if (user && isProRoute) {
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
        
        // Check if user has access to Pro features
        const hasProAccess = 
          subscription_status === 'active' ||
          (subscription_status === 'trialing' && trialEnd && trialEnd > now) ||
          subscription_plan !== 'free';

        // Redirect to upgrade page if no Pro access
        if (!hasProAccess) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard/upgrade";
          url.searchParams.set('feature', request.nextUrl.pathname.split('/').pop() || 'pro');
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // On error, allow access but log the issue
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
