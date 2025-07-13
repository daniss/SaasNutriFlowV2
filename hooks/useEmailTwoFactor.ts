"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface EmailTwoFactorStatus {
  isEnabled: boolean;
  isRequired: boolean;
  method: "email" | "totp";
  loading: boolean;
}

export function useEmailTwoFactor() {
  const [status, setStatus] = useState<EmailTwoFactorStatus>({
    isEnabled: true, // Default enabled
    isRequired: true,
    method: "email",
    loading: false,
  });

  const supabase = createClient();

  const sendEmailCode = async (): Promise<{
    success: boolean;
    message?: string;
    code?: string;
  }> => {
    setStatus((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch("/api/auth/2fa/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Send empty object instead of no body
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message,
          code: data.code, // Only in development
        };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error("Error sending email code:", error);
      return { success: false, message: "Erreur lors de l'envoi du code" };
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const verifyEmailCode = async (
    code: string
  ): Promise<{ success: boolean; message?: string }> => {
    setStatus((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch("/api/auth/2fa/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error("Error verifying email code:", error);
      return { success: false, message: "Erreur lors de la vérification" };
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const checkTwoFactorStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: security } = await supabase
        .from("user_security")
        .select("two_factor_enabled, two_factor_method")
        .eq("user_id", user.id)
        .single();

      if (security) {
        setStatus((prev) => ({
          ...prev,
          isEnabled: security.two_factor_enabled,
          method: security.two_factor_method || "email",
        }));
      }
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    }
  };

  return {
    status,
    sendEmailCode,
    verifyEmailCode,
    checkTwoFactorStatus,
    loading: status.loading,
  };
}
