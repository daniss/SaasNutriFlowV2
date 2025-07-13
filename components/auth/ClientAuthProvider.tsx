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

  const isAuthenticated = !!client;

  // Check if client is already logged in on mount
  useEffect(() => {
    checkClientSession();
  }, []);

  const checkClientSession = async () => {
    try {
      // Check if there's a valid client session
      const sessionData = localStorage.getItem("client-session");
      if (sessionData) {
        const clientData = JSON.parse(sessionData);
        setClient(clientData);
      }
    } catch (error) {
      console.error("Error checking client session:", error);
      localStorage.removeItem("client-session");
    } finally {
      setIsLoading(false);
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
        localStorage.setItem("client-session", JSON.stringify(data.client));
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
      await fetch("/api/client-auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setClient(null);
      localStorage.removeItem("client-session");
      localStorage.removeItem("client-consents-given");
    }
  };

  const value: ClientAuthContextType = {
    client,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}
