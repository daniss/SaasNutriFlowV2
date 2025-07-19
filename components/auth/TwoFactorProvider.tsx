"use client";

import { createClient } from "@/lib/supabase/client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { TOTPVerificationDialog } from "./TOTPVerificationDialog";

interface TwoFactorContextType {
  isRequired: boolean;
  isVerified: boolean;
  currentLevel: "aal1" | "aal2";
  nextLevel: "aal1" | "aal2";
  completeTwoFactor: () => void;
  refresh: () => void;
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
  const [isVerified, setIsVerified] = useState(true);
  const [currentLevel, setCurrentLevel] = useState<"aal1" | "aal2">("aal1");
  const [nextLevel, setNextLevel] = useState<"aal1" | "aal2">("aal1");
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkAuthenticatorAssuranceLevel();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        console.log("🔐 User signed in, waiting before checking MFA requirements to avoid race conditions");
        // Small delay to let Supabase fully process the authentication state
        setTimeout(async () => {
          await checkAuthenticatorAssuranceLevel();
        }, 500); // Give Supabase time to settle
      } else if (event === "SIGNED_OUT") {
        resetState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetState = () => {
    setIsRequired(false);
    setIsVerified(true);
    setCurrentLevel("aal1");
    setNextLevel("aal1");
    setShowVerification(false);
  };

  const checkAuthenticatorAssuranceLevel = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        resetState();
        setLoading(false);
        return;
      }

      // Check the current authenticator assurance level
      const { data: aalData, error: aalError } = 
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        console.error("Error getting AAL:", aalError);
        // Default to allowing access if there's an error
        resetState();
        setLoading(false);
        return;
      }

      // Check if there are verified TOTP factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error("Error listing factors:", factorsError);
        resetState();
        setLoading(false);
        return;
      }

      const totpFactors = factorsData.totp || [];
      const verifiedFactors = totpFactors.filter(factor => factor.status === "verified");
      const hasVerifiedTOTP = verifiedFactors.length > 0;

      const currentAAL = aalData.currentLevel as "aal1" | "aal2";
      const nextAAL = aalData.nextLevel as "aal1" | "aal2";

      setCurrentLevel(currentAAL);
      setNextLevel(nextAAL);

      // STRICT LOGIC: Only require MFA verification if:
      // 1. NextLevel is aal2 (Supabase thinks MFA should be required)
      // 2. CurrentLevel is not aal2 (not verified in this session)  
      // 3. There are actually verified TOTP factors configured (CRITICAL CHECK)
      // 4. More than 0 verified factors exist (DOUBLE CHECK)
      const supabaseExpectsMFA = nextAAL === "aal2";
      const sessionNotVerified = currentAAL !== nextAAL;
      const hasActualVerifiedFactors = hasVerifiedTOTP && verifiedFactors.length > 0;
      const needsMFAVerification = supabaseExpectsMFA && sessionNotVerified && hasActualVerifiedFactors;

      console.log("🔐 DETAILED AAL CHECK:", {
        currentLevel: currentAAL,
        nextLevel: nextAAL,
        supabaseExpectsMFA,
        sessionNotVerified,
        hasVerifiedTOTP,
        verifiedFactorsCount: verifiedFactors.length,
        hasActualVerifiedFactors,
        needsMFAVerification,
        totalFactors: totpFactors.length,
        userId: user.id,
        factorDetails: totpFactors.map(f => ({ id: f.id, status: f.status, name: f.friendly_name })),
      });

      if (needsMFAVerification) {
        console.log("🔐 SHOWING TOTP DIALOG - All conditions met for MFA verification");
        setIsRequired(true);
        setIsVerified(false);
        setShowVerification(true);
      } else {
        // Handle different scenarios with specific logging
        if (supabaseExpectsMFA && !hasActualVerifiedFactors) {
          console.warn("🔐 BYPASSING MFA: Supabase expects MFA but no verified factors exist");
          console.warn("🔐 This suggests AAL state inconsistency - allowing access");
        } else if (!supabaseExpectsMFA) {
          console.log("🔐 NO MFA REQUIRED: Supabase AAL doesn't expect MFA");
        } else if (!sessionNotVerified) {
          console.log("🔐 ALREADY VERIFIED: Session already has aal2 level");
        }
        
        setIsRequired(false);
        setIsVerified(true);
        setShowVerification(false);
      }

    } catch (error) {
      console.error("Error in AAL check:", error);
      // Default to allowing access if there's an error
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const completeTwoFactor = async () => {
    console.log("🔐 Two-factor authentication completed");
    setIsVerified(true);
    setIsRequired(false);
    setShowVerification(false);
    setCurrentLevel("aal2");
    
    // Refresh the AAL status to ensure we have the latest state
    await checkAuthenticatorAssuranceLevel();
  };

  // Show TOTP verification dialog if required
  if (showVerification && !loading) {
    console.log("🔐 TwoFactorProvider showing TOTP verification dialog");
    return (
      <TOTPVerificationDialog
        onVerificationSuccess={completeTwoFactor}
        onCancel={() => {
          // Allow access if TOTP dialog called onCancel - this means no verified factors exist
          console.log("🔐 TOTP verification cancelled - allowing access without MFA");
          setShowVerification(false);
          setIsRequired(false);
          setIsVerified(true);
        }}
        bypassFactorCheck={true}
      />
    );
  }

  return (
    <TwoFactorContext.Provider
      value={{
        isRequired,
        isVerified,
        currentLevel,
        nextLevel,
        completeTwoFactor,
        refresh: checkAuthenticatorAssuranceLevel,
      }}
    >
      {children}
    </TwoFactorContext.Provider>
  );
}