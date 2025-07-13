"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useClientAuth } from "./ClientAuthProvider";

export function ClientAuthRouter() {
  const { isAuthenticated, isLoading, hasCheckedSession } = useClientAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    // Clear any pending redirects
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current);
    }

    // Only proceed if session check is complete and we haven't redirected yet
    if (!hasCheckedSession || isLoading) {
      return;
    }

    // Prevent redundant redirects if auth state hasn't changed
    if (lastAuthState.current === isAuthenticated) {
      return;
    }
    lastAuthState.current = isAuthenticated;

    // Single redirect decision point
    const currentPath = window.location.pathname;

    if (isAuthenticated && currentPath === "/client-login") {
      // User is authenticated but on login page - redirect to portal
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        redirectTimeout.current = setTimeout(() => {
          router.replace("/client-portal"); // Use replace instead of push
          setTimeout(() => {
            hasRedirected.current = false;
          }, 500);
        }, 300);
      }
    } else if (!isAuthenticated && currentPath === "/client-portal") {
      // User is not authenticated but on portal - redirect to login
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        redirectTimeout.current = setTimeout(() => {
          router.replace("/client-login"); // Use replace instead of push
          setTimeout(() => {
            hasRedirected.current = false;
          }, 500);
        }, 300);
      }
    }

    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [isAuthenticated, isLoading, hasCheckedSession, router]);

  return null; // This component only handles routing logic
}
