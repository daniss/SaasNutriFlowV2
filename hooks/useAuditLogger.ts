import auditLogger from "@/lib/audit-logger";
import { useEffect } from "react";
import { useAuth } from "./useAuthNew";

export function useAuditLogger() {
  const { user } = useAuth();

  useEffect(() => {
    // Log login when user session is established
    if (user?.email) {
      auditLogger.logLogin(user.email);
    }
  }, [user?.email]);

  const logAction = async (
    action: string,
    resource_type: string,
    resource_id?: string,
    details?: Record<string, any>
  ) => {
    return auditLogger.logAction(action, resource_type, resource_id, details);
  };

  return {
    logAction,
    // Convenience methods
    logClientCreate: auditLogger.logClientCreate.bind(auditLogger),
    logClientUpdate: auditLogger.logClientUpdate.bind(auditLogger),
    logClientDelete: auditLogger.logClientDelete.bind(auditLogger),
    logDocumentUpload: auditLogger.logDocumentUpload.bind(auditLogger),
    logDocumentDownload: auditLogger.logDocumentDownload.bind(auditLogger),
    logDocumentDelete: auditLogger.logDocumentDelete.bind(auditLogger),
    logMealPlanCreate: auditLogger.logMealPlanCreate.bind(auditLogger),
    logMealPlanUpdate: auditLogger.logMealPlanUpdate.bind(auditLogger),
    logInvoiceCreate: auditLogger.logInvoiceCreate.bind(auditLogger),
    logInvoiceExport: auditLogger.logInvoiceExport.bind(auditLogger),
    logMessageSend: auditLogger.logMessageSend.bind(auditLogger),
    logDataExport: auditLogger.logDataExport.bind(auditLogger),
  };
}

export default useAuditLogger;
