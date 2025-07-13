"use client";

import { createClient } from "@/lib/supabase/client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { EmailTwoFactorVerification } from "./EmailTwoFactorVerification";

interface TwoFactorContextType {
  isRequired: boolean;
  isVerified: boolean;
  userEmail?: string;
  completeTwoFactor: () => void;
}

const TwoFactorContext = createContext<TwoFactorContextType | undefined>(
  undefined
);

export function useTwoFactor() {
  const context = useContext(TwoFactorContext);
  if (context === undefined) {
    throw new Error("useTwoFactor must be used within a TwoFactorProvider");
  }
  return context;
}

export function TwoFactorProvider({ children }: { children: React.ReactNode }) {
  const [isRequired, setIsRequired] = useState(false);
  const [isVerified, setIsVerified] = useState(true); // Default to true to avoid blocking
  const [userEmail, setUserEmail] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkTwoFactorRequirement();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Only require 2FA on fresh login, not on session refresh
        if (event === "SIGNED_IN") {
          await handleNewLogin(session.user);
        }
      } else if (event === "SIGNED_OUT") {
        setIsRequired(false);
        setIsVerified(true);
        setUserEmail(undefined);
        setPendingVerification(false);
        // Clear session verification flag
        localStorage.removeItem("nutriflow_2fa_verified");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNewLogin = async (user: any) => {
    console.log(
      "🔐 TwoFactorProvider handleNewLogin called for user:",
      user.id
    );

    // Check if this session is already 2FA verified (new two-step auth flow)
    const sessionVerified = localStorage.getItem("nutriflow_2fa_verified");
    const twoStepAuthCompleted = localStorage.getItem(
      "nutriflow_2step_auth_completed"
    );
    const twoStepInProgress = localStorage.getItem(
      "nutriflow_2step_in_progress"
    );

    console.log("🔐 Session verification status:", {
      sessionVerified,
      twoStepAuthCompleted,
      twoStepInProgress,
      userId: user.id,
    });

    // If two-step auth is in progress (any value), don't interfere
    if (twoStepInProgress) {
      console.log(
        "🔐 Two-step auth in progress, skipping TwoFactorProvider intervention"
      );
      setIsVerified(true);
      setIsRequired(false);
      setPendingVerification(false);
      return;
    }

    if (sessionVerified === user.id || twoStepAuthCompleted === user.id) {
      console.log("🔐 User already verified, skipping post-login 2FA");
      setIsVerified(true);
      setIsRequired(false);
      setPendingVerification(false);
      // Clear the two-step auth flag as it's now converted to session verification
      if (twoStepAuthCompleted) {
        localStorage.removeItem("nutriflow_2step_auth_completed");
        localStorage.setItem("nutriflow_2fa_verified", user.id);
      }
      return;
    }

    console.log("🔐 User not verified, checking 2FA requirements");
    setUserEmail(user.email);

    // Check if 2FA is enabled for the user
    const { data: security, error } = await supabase
      .from("user_security")
      .select("two_factor_enabled, two_factor_method")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking 2FA status:", error);
      // If error, don't block the user
      setIsRequired(false);
      setIsVerified(true);
      return;
    }

    const twoFactorEnabled = security?.two_factor_enabled ?? true;

    if (twoFactorEnabled) {
      setIsRequired(true);
      setIsVerified(false);
      setPendingVerification(true);
    } else {
      setIsRequired(false);
      setIsVerified(true);
      setPendingVerification(false);
    }
  };

  const checkTwoFactorRequirement = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setIsRequired(false);
        setIsVerified(true);
        setLoading(false);
        return;
      }

      // Check if this session is already 2FA verified
      const sessionVerified = localStorage.getItem("nutriflow_2fa_verified");
      if (sessionVerified === user.id) {
        setIsVerified(true);
        setIsRequired(false);
        setPendingVerification(false);
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      // Only require 2FA verification if not already verified in this session
      const { data: security, error } = await supabase
        .from("user_security")
        .select("two_factor_enabled, two_factor_method")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking 2FA status:", error);
        // If error, don't block the user
        setIsRequired(false);
        setIsVerified(true);
      } else {
        const twoFactorEnabled = security?.two_factor_enabled ?? true;

        if (twoFactorEnabled) {
          // Check if this is a fresh login or page refresh
          // If it's a page refresh and user was already verified, don't ask again
          const lastVerification = localStorage.getItem(
            "nutriflow_2fa_timestamp"
          );
          const now = Date.now();
          const verificationAge = lastVerification
            ? now - parseInt(lastVerification)
            : Infinity;

          // 2FA verification valid for 8 hours (session timeout)
          const VERIFICATION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

          if (verificationAge < VERIFICATION_DURATION) {
            setIsRequired(false);
            setIsVerified(true);
            setPendingVerification(false);
          } else {
            setIsRequired(true);
            setIsVerified(false);
            setPendingVerification(true);
          }
        } else {
          setIsRequired(false);
          setIsVerified(true);
          setPendingVerification(false);
        }
      }
    } catch (error) {
      console.error("Error in 2FA check:", error);
      setIsRequired(false);
      setIsVerified(true);
      setPendingVerification(false);
    } finally {
      setLoading(false);
    }
  };

  const completeTwoFactor = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Mark this session as 2FA verified
        localStorage.setItem("nutriflow_2fa_verified", user.id);
        localStorage.setItem("nutriflow_2fa_timestamp", Date.now().toString());
      }
    } catch (error) {
      console.error("Error getting user for 2FA completion:", error);
    }

    setIsVerified(true);
    setIsRequired(false);
    setPendingVerification(false);
  };

  // Show 2FA verification screen only if specifically pending verification
  if (pendingVerification && !loading) {
    console.log(
      "🔐 TwoFactorProvider rendering EmailTwoFactorVerification component"
    );
    return (
      <EmailTwoFactorVerification
        onVerificationSuccess={completeTwoFactor}
        userEmail={userEmail}
      />
    );
  }

  return (
    <TwoFactorContext.Provider
      value={{
        isRequired,
        isVerified,
        userEmail,
        completeTwoFactor,
      }}
    >
      {children}
    </TwoFactorContext.Provider>
  );
}
