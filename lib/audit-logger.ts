import { supabase } from "./supabase";

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  user_email?: string;
  user_type: "dietitian" | "client" | "admin";
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at?: string;
}

export interface AuditLogFilters {
  user_id?: string;
  user_email?: string;
  user_type?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

class AuditLogService {
  private static instance: AuditLogService;
  private sessionId: string | null = null;

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  constructor() {
    // Generate a session ID for this browser session
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getClientInfo() {
    let ip_address = null;
    let user_agent = null;

    try {
      // Get client IP (in production, this would come from headers)
      if (typeof window !== "undefined") {
        user_agent = navigator.userAgent;

        // In a real application, IP would be obtained server-side
        // For now, we'll leave it null and let the server handle it
      }
    } catch (error) {
      console.warn("Could not get client info:", error);
    }

    return { ip_address, user_agent };
  }

  async logAction(
    action: string,
    resource_type: string,
    resource_id?: string,
    details?: Record<string, any>,
    user_override?: {
      id: string;
      email: string;
      type: "dietitian" | "client" | "admin";
    }
  ): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user && !user_override) {
        console.warn("No user found for audit logging");
        return null;
      }

      const currentUser = user_override || {
        id: user?.id,
        email: user?.email,
        type: "dietitian" as const, // Default type, can be overridden
      };

      const { ip_address, user_agent } = await this.getClientInfo();

      const { data, error } = await supabase.rpc("log_audit_action", {
        p_user_id: currentUser.id,
        p_user_email: currentUser.email,
        p_user_type: currentUser.type,
        p_action: action,
        p_resource_type: resource_type,
        p_resource_id: resource_id || null,
        p_details: details || null,
        p_ip_address: ip_address,
        p_user_agent: user_agent,
        p_session_id: this.sessionId,
      });

      if (error) {
        console.error("Audit logging error:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Failed to log audit action:", error);
      return null;
    }
  }

  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.user_id) {
        query = query.eq("user_id", filters.user_id);
      }
      if (filters.user_email) {
        query = query.ilike("user_email", `%${filters.user_email}%`);
      }
      if (filters.user_type) {
        query = query.eq("user_type", filters.user_type);
      }
      if (filters.action) {
        query = query.eq("action", filters.action);
      }
      if (filters.resource_type) {
        query = query.eq("resource_type", filters.resource_type);
      }
      if (filters.date_from) {
        query = query.gte("created_at", filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte("created_at", filters.date_to);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching audit logs:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }
  }

  async exportAuditLogs(filters: AuditLogFilters = {}): Promise<Blob | null> {
    try {
      const logs = await this.getAuditLogs({ ...filters, limit: 10000 }); // Get more data for export

      // Convert to CSV
      const headers = [
        "Date/Time",
        "User Email",
        "User Type",
        "Action",
        "Resource Type",
        "Resource ID",
        "Details",
        "IP Address",
        "User Agent",
        "Session ID",
      ];

      const csvContent = [
        headers.join(","),
        ...logs.map((log) =>
          [
            log.created_at ? new Date(log.created_at).toISOString() : "",
            log.user_email || "",
            log.user_type || "",
            log.action || "",
            log.resource_type || "",
            log.resource_id || "",
            log.details ? JSON.stringify(log.details).replace(/"/g, '""') : "",
            log.ip_address || "",
            log.user_agent ? log.user_agent.replace(/"/g, '""') : "",
            log.session_id || "",
          ]
            .map((field) => `"${field}"`)
            .join(",")
        ),
      ].join("\n");

      return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      return null;
    }
  }

  // Convenience methods for common actions
  async logLogin(user_email: string) {
    return this.logAction("login", "auth", undefined, { user_email });
  }

  async logLogout(user_email: string) {
    return this.logAction("logout", "auth", undefined, { user_email });
  }

  async logClientCreate(client_id: string, client_data: any) {
    return this.logAction("create", "client", client_id, {
      client_name: client_data.name,
      client_email: client_data.email,
    });
  }

  async logClientUpdate(client_id: string, changes: any) {
    return this.logAction("update", "client", client_id, { changes });
  }

  async logClientDelete(client_id: string) {
    return this.logAction("delete", "client", client_id);
  }

  async logDocumentUpload(document_id: string, document_data: any) {
    return this.logAction("create", "document", document_id, {
      filename: document_data.name,
      category: document_data.category,
      size: document_data.size,
    });
  }

  async logDocumentDownload(document_id: string, document_name: string) {
    return this.logAction("download", "document", document_id, {
      filename: document_name,
    });
  }

  async logDocumentDelete(document_id: string, document_name: string) {
    return this.logAction("delete", "document", document_id, {
      filename: document_name,
    });
  }

  async logMealPlanCreate(meal_plan_id: string, client_id: string) {
    return this.logAction("create", "meal_plan", meal_plan_id, { client_id });
  }

  async logMealPlanUpdate(
    meal_plan_id: string,
    client_id: string,
    changes: any
  ) {
    return this.logAction("update", "meal_plan", meal_plan_id, {
      client_id,
      changes,
    });
  }

  async logInvoiceCreate(
    invoice_id: string,
    client_id: string,
    amount: number
  ) {
    return this.logAction("create", "invoice", invoice_id, {
      client_id,
      amount,
    });
  }

  async logInvoiceExport(invoice_id: string, format: string) {
    return this.logAction("export", "invoice", invoice_id, { format });
  }

  async logMessageSend(
    message_id: string,
    recipient_id: string,
    conversation_id: string
  ) {
    return this.logAction("create", "message", message_id, {
      recipient_id,
      conversation_id,
    });
  }

  async logDataExport(export_type: string, filters: any) {
    return this.logAction("export", "data", undefined, {
      export_type,
      filters,
    });
  }
}

export const auditLogger = AuditLogService.getInstance();
export default auditLogger;
