// Role-based access control for sensitive administrative features
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuthNew";

export type UserRole = "dietitian" | "admin" | "superadmin";

export interface UserPermissions {
  canAccessAuditLogs: boolean;
  canAccessTesting: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canModifySettings: boolean;
}

export function useRoleBasedAccess() {
  const { user, profile } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>("dietitian");
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessAuditLogs: false,
    canAccessTesting: false,
    canManageUsers: false,
    canExportData: false,
    canModifySettings: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      determineUserRole();
    }
  }, [user, profile]);

  const determineUserRole = async () => {
    try {
      const supabase = createClient();

      // Use the database function to get user role
      const { data: roleData, error: roleError } = await supabase.rpc(
        "get_user_role",
        { user_uuid: user?.id }
      );

      let role: UserRole = "dietitian"; // Default role

      if (!roleError && roleData) {
        role = roleData as UserRole;
      } else {
        // Fallback: check if user email is in admin list (temporary solution)
        const adminEmails = [
          "admin@nutriflow.com",
          "super@nutriflow.com",
          // Add your admin email here
        ];

        if (user?.email && adminEmails.includes(user.email)) {
          role = "admin";
        }
      }

      setUserRole(role);
      setPermissions(getRolePermissions(role));
    } catch (error) {
      console.error("Error determining user role:", error);
      // Default to most restrictive permissions
      setUserRole("dietitian");
      setPermissions(getRolePermissions("dietitian"));
    } finally {
      setLoading(false);
    }
  };

  const getRolePermissions = (role: UserRole): UserPermissions => {
    switch (role) {
      case "superadmin":
        return {
          canAccessAuditLogs: true,
          canAccessTesting: true,
          canManageUsers: true,
          canExportData: true,
          canModifySettings: true,
        };
      case "admin":
        return {
          canAccessAuditLogs: true,
          canAccessTesting: true, // Admins can access testing
          canManageUsers: false, // Only superadmin can manage admin users
          canExportData: true,
          canModifySettings: false,
        };
      case "dietitian":
      default:
        return {
          canAccessAuditLogs: false,
          canAccessTesting: false,
          canManageUsers: false,
          canExportData: false, // They can export their own client data
          canModifySettings: false,
        };
    }
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission];
  };

  const requiresRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy = {
      dietitian: 1,
      admin: 2,
      superadmin: 3,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  return {
    userRole,
    permissions,
    loading,
    hasPermission,
    requiresRole,
    isAdmin: userRole === "admin" || userRole === "superadmin",
    isSuperAdmin: userRole === "superadmin",
  };
}

export default useRoleBasedAccess;
