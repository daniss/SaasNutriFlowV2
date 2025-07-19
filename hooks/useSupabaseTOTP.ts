"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export interface TOTPEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export interface TOTPFactor {
  id: string;
  friendly_name?: string;
  factor_type: "totp";
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
}

export interface TOTPStatus {
  isEnabled: boolean;
  factors: TOTPFactor[];
  currentLevel: "aal1" | "aal2";
  nextLevel: "aal1" | "aal2";
  loading: boolean;
}

export function useSupabaseTOTP() {
  const [status, setStatus] = useState<TOTPStatus>({
    isEnabled: false,
    factors: [],
    currentLevel: "aal1",
    nextLevel: "aal1",
    loading: false,
  });

  const supabase = createClient();

  useEffect(() => {
    checkTOTPStatus();
  }, []);

  const checkTOTPStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      // Check current authentication assurance level
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) {
        console.error("Error getting AAL:", aalError);
        return;
      }

      // List current TOTP factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error("Error listing factors:", factorsError);
        return;
      }

      const totpFactors = (factorsData.totp || []).map(factor => ({
        id: factor.id,
        friendly_name: factor.friendly_name,
        factor_type: "totp" as const,
        status: factor.status as "verified" | "unverified",
        created_at: factor.created_at,
        updated_at: factor.updated_at,
      }));
      const verifiedFactors = totpFactors.filter(factor => factor.status === "verified");

      setStatus(prev => ({
        ...prev,
        isEnabled: verifiedFactors.length > 0,
        factors: totpFactors,
        currentLevel: aalData.currentLevel as "aal1" | "aal2",
        nextLevel: aalData.nextLevel as "aal1" | "aal2",
      }));

    } catch (error) {
      console.error("Error checking TOTP status:", error);
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const enrollTOTP = async (friendlyName: string = "Authenticator App"): Promise<TOTPEnrollment | null> => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });

      if (error) {
        console.error("Error enrolling TOTP:", error);
        return null;
      }

      return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      };

    } catch (error) {
      console.error("Error in TOTP enrollment:", error);
      return null;
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyTOTPEnrollment = async (factorId: string, code: string): Promise<boolean> => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        console.error("Error creating challenge:", challengeError);
        return false;
      }

      // Verify code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        console.error("Error verifying TOTP:", verifyError);
        return false;
      }

      // Refresh status after successful verification
      await checkTOTPStatus();
      return true;

    } catch (error) {
      console.error("Error in TOTP verification:", error);
      return false;
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const challengeTOTP = async (): Promise<{ challengeId: string; factorId: string } | null> => {
    try {
      // Get the first verified TOTP factor
      const verifiedFactor = status.factors.find(f => f.status === "verified");
      if (!verifiedFactor) {
        console.error("No verified TOTP factor found");
        return null;
      }

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });

      if (error) {
        console.error("Error creating TOTP challenge:", error);
        return null;
      }

      return {
        challengeId: data.id,
        factorId: verifiedFactor.id,
      };

    } catch (error) {
      console.error("Error in TOTP challenge:", error);
      return null;
    }
  };

  const verifyTOTPChallenge = async (challengeId: string, factorId: string, code: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        console.error("Error verifying TOTP challenge:", error);
        return false;
      }

      // Refresh status after successful verification
      await checkTOTPStatus();
      return true;

    } catch (error) {
      console.error("Error in TOTP challenge verification:", error);
      return false;
    }
  };

  const unenrollTOTP = async (factorId: string): Promise<boolean> => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        console.error("Error unenrolling TOTP:", error);
        return false;
      }

      // Refresh status after unenrollment
      await checkTOTPStatus();
      return true;

    } catch (error) {
      console.error("Error in TOTP unenrollment:", error);
      return false;
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const requiresMFA = (): boolean => {
    return status.nextLevel === "aal2" && status.currentLevel !== status.nextLevel;
  };

  return {
    status,
    enrollTOTP,
    verifyTOTPEnrollment,
    challengeTOTP,
    verifyTOTPChallenge,
    unenrollTOTP,
    requiresMFA,
    refresh: checkTOTPStatus,
    loading: status.loading,
  };
}