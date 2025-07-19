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
  const [verifiedFactorsData, setVerifiedFactorsData] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    checkAuthenticatorAssuranceLevel();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
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
      
      // Store verified factors for use in TOTP dialog
      setVerifiedFactorsData(verifiedFactors);

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

      if (needsMFAVerification) {
        setIsRequired(true);
        setIsVerified(false);
        setShowVerification(true);
      } else {
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
    setIsVerified(true);
    setIsRequired(false);
    setShowVerification(false);
    setCurrentLevel("aal2");
    
    // Refresh the AAL status to ensure we have the latest state
    await checkAuthenticatorAssuranceLevel();
  };

  // Show TOTP verification dialog if required
  if (showVerification && !loading) {
    return (
      <TOTPVerificationDialog
        onVerificationSuccess={completeTwoFactor}
        onCancel={() => {
          // Allow access if TOTP dialog called onCancel - this means no verified factors exist
          setShowVerification(false);
          setIsRequired(false);
          setIsVerified(true);
        }}
        bypassFactorCheck={true}
        verifiedFactors={verifiedFactorsData}
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
      {/* Only render children if MFA is not required OR if it's verified */}
      {(!isRequired || isVerified) ? children : null}
    </TwoFactorContext.Provider>
  );
}