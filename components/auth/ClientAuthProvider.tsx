"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ClientData {
  id: string;
  name: string;
  email: string;
  account_id: string;
}

interface ClientAuthContextType {
  client: ClientData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCheckedSession: boolean;
  getAuthToken: () => string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(
  undefined
);

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
}

export function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const isAuthenticated = !!client && hasCheckedSession;

  // Check if client is already logged in on mount
  useEffect(() => {
    checkClientSession();
  }, []);

  const clearClientSession = () => {
    setClient(null);
    setHasCheckedSession(true);
    localStorage.removeItem("client-session");
    localStorage.removeItem("client-token");
    localStorage.removeItem("client-consents-given");
  };

  const checkClientSession = async () => {
    // Prevent concurrent session validation calls
    if (isValidating) return;
    setIsValidating(true);
    try {
      // Check if there's a valid client token
      const clientToken = localStorage.getItem("client-token");

      if (clientToken) {
        // SECURITY FIX: Always verify with server BEFORE setting client state
        // Never trust localStorage data for authentication
        const response = await fetch("/api/client-auth/validate-session", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clientToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.client) {
            // Only set client data from verified server response
            setClient(result.client);
            // Update localStorage with fresh server data
            localStorage.setItem("client-session", JSON.stringify(result.client));
            setHasCheckedSession(true);
          } else {
            // Session invalid, clear stored data
            clearClientSession();
          }
        } else {
          // Token is invalid, clear stored data
          clearClientSession();
        }
      } else {
        // No token available
        clearClientSession();
      }
    } catch (error) {
      console.error("Error checking client session:", error);
      clearClientSession();
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/client-auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setClient(data.client);
        setHasCheckedSession(true);
        // SECURITY FIX: Store both client data and secure token
        localStorage.setItem("client-session", JSON.stringify(data.client));
        localStorage.setItem("client-token", data.token); // Store the secure token
        return { success: true };
      } else {
        return { success: false, error: data.error || "Erreur de connexion" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Erreur de connexion" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Use the stored token for authenticated logout
      const clientToken = localStorage.getItem("client-token");
      if (clientToken) {
        await fetch("/api/client-auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setClient(null);
      setHasCheckedSession(true);
      localStorage.removeItem("client-session");
      localStorage.removeItem("client-token"); // Clear the secure token
      localStorage.removeItem("client-consents-given");
    }
  };

  const getAuthToken = (): string | null => {
    return localStorage.getItem("client-token");
  };

  const value: ClientAuthContextType = {
    client,
    isLoading,
    isAuthenticated,
    hasCheckedSession,
    getAuthToken,
    login,
    logout,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}
