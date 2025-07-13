import { useAuth } from "@/hooks/useAuthNew";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  lastUsed?: string;
}

export function use2FA() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus>({
    isEnabled: false,
    hasBackupCodes: false,
  });
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      checkTwoFactorStatus();
    }
  }, [user]);

  const checkTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("user_security")
        .select("two_factor_enabled, backup_codes_count, last_2fa_used")
        .eq("user_id", user?.id)
        .single();

      if (data) {
        setStatus({
          isEnabled: data.two_factor_enabled,
          hasBackupCodes: (data.backup_codes_count || 0) > 0,
          lastUsed: data.last_2fa_used,
        });
      }
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    }
  };

  const setup2FA = async (): Promise<TwoFactorSetup | null> => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        return data.setup;
      }
      return null;
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (token: string, secret: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, secret }),
      });

      const result = await response.json();
      if (result.success) {
        await checkTwoFactorStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      if (result.success) {
        await checkTwoFactorStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async (): Promise<string[] | null> => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (result.success) {
        await checkTwoFactorStatus();
        return result.codes;
      }
      return null;
    } catch (error) {
      console.error("Error generating backup codes:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    setup2FA,
    verify2FA,
    disable2FA,
    generateBackupCodes,
    refresh: checkTwoFactorStatus,
  };
}
