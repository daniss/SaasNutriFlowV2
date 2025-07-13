"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface TwoStepAuthState {
  step: "credentials" | "verification" | "complete";
  email?: string;
  tempSession?: any;
  loading: boolean;
  error?: string;
}

export function useTwoStepAuth() {
  const [authState, setAuthState] = useState<TwoStepAuthState>({
    step: "credentials",
    loading: false,
  });

  const supabase = createClient();

  // Step 1: Validate credentials without completing login
  const validateCredentials = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // Set flag to indicate two-step auth is about to start (prevents TwoFactorProvider interference)
      // We need to set this before signInWithPassword to prevent race conditions
      const tempUserId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("nutriflow_2step_in_progress", tempUserId);

      // First, verify the credentials are correct
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        // Clear the temp flag on error
        localStorage.removeItem("nutriflow_2step_in_progress");
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: authError.message,
        }));
        return { success: false, error: authError.message };
      }

      // Update the flag with the actual user ID
      localStorage.setItem("nutriflow_2step_in_progress", authData.user.id);

      // Immediately sign out to prevent automatic login
      await supabase.auth.signOut();

      // Check if user has 2FA enabled
      const { data: security } = await supabase
        .from("user_security")
        .select("two_factor_enabled, two_factor_method")
        .eq("user_id", authData.user.id)
        .single();

      const twoFactorEnabled = security?.two_factor_enabled ?? true;

      if (twoFactorEnabled) {
        // Send 2FA code
        const response = await fetch("/api/auth/2fa/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authData.user.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to send verification code"
          );
        }

        setAuthState({
          step: "verification",
          email,
          tempSession: { email, password, userId: authData.user.id },
          loading: false,
        });

        return { success: true, requiresVerification: true };
      } else {
        // 2FA disabled, complete login immediately
        return await completeLogin(email, password);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      // Clear the in-progress flag on error
      localStorage.removeItem("nutriflow_2step_in_progress");
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Step 2: Verify 2FA code and complete login
  const verifyAndComplete = async (code: string) => {
    if (!authState.tempSession) {
      return { success: false, error: "No pending authentication" };
    }

    setAuthState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // Verify the 2FA code
      const response = await fetch("/api/auth/2fa/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          userId: authState.tempSession.userId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || "Invalid verification code",
        }));
        return {
          success: false,
          error: result.error || "Invalid verification code",
        };
      }

      // 2FA verified, now complete the actual login
      const loginResult = await completeLogin(
        authState.tempSession.email,
        authState.tempSession.password
      );

      if (loginResult.success) {
        // Clear the in-progress flag and mark session as 2FA verified and two-step auth completed
        localStorage.removeItem("nutriflow_2step_in_progress");
        localStorage.setItem(
          "nutriflow_2fa_verified",
          authState.tempSession.userId
        );
        localStorage.setItem("nutriflow_2fa_timestamp", Date.now().toString());
        localStorage.setItem(
          "nutriflow_2step_auth_completed",
          authState.tempSession.userId
        );

        console.log(
          "🎯 Setting auth state to complete - this should trigger redirect"
        );
        setAuthState({
          step: "complete",
          loading: false,
        });
      } else {
        console.error("❌ Login completion failed:", loginResult.error);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: loginResult.error,
        }));
      }

      return loginResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Complete the Supabase login
  const completeLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const resetAuth = () => {
    // Clear any in-progress flags
    localStorage.removeItem("nutriflow_2step_in_progress");
    setAuthState({
      step: "credentials",
      loading: false,
    });
  };

  const resendCode = async () => {
    if (!authState.tempSession) {
      return { success: false, error: "No pending authentication" };
    }

    try {
      const response = await fetch("/api/auth/2fa/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authState.tempSession.userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resend code");
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to resend code",
      };
    }
  };

  return {
    authState,
    validateCredentials,
    verifyAndComplete,
    resetAuth,
    resendCode,
  };
}
