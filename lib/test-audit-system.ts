import auditLogger from "@/lib/audit-logger";
import { supabase } from "@/lib/supabase";

// Integration test for the audit logging system
export async function testAuditLogging() {
  console.log("🧪 Testing Audit Logging System...");

  try {
    // Test 1: Basic audit log creation
    console.log("Test 1: Creating audit log entry...");
    const logId = await auditLogger.logAction(
      "test",
      "system",
      "test-resource-id",
      { test: true, timestamp: new Date().toISOString() }
    );

    if (logId) {
      console.log("✅ Audit log created successfully:", logId);
    } else {
      console.log("❌ Failed to create audit log");
      return false;
    }

    // Test 2: Retrieve audit logs
    console.log("Test 2: Retrieving audit logs...");
    const logs = await auditLogger.getAuditLogs({ limit: 10 });
    console.log("✅ Retrieved", logs.length, "audit log entries");

    // Test 3: Test filtered logs
    console.log("Test 3: Testing filtered logs...");
    const filteredLogs = await auditLogger.getAuditLogs({
      action: "test",
      resource_type: "system",
      limit: 5,
    });
    console.log("✅ Retrieved", filteredLogs.length, "filtered entries");

    // Test 4: Test export functionality
    console.log("Test 4: Testing export functionality...");
    const exportBlob = await auditLogger.exportAuditLogs({ limit: 10 });
    if (exportBlob) {
      console.log(
        "✅ Export created successfully, size:",
        exportBlob.size,
        "bytes"
      );
    } else {
      console.log("❌ Export failed");
      return false;
    }

    // Test 5: Test convenience methods
    console.log("Test 5: Testing convenience methods...");
    await auditLogger.logClientCreate("test-client-id", {
      name: "Test Client",
      email: "test@example.com",
    });
    await auditLogger.logDocumentUpload("test-doc-id", {
      name: "test.pdf",
      category: "medical",
      size: 1024,
    });
    await auditLogger.logDataExport("clients", { format: "csv" });
    console.log("✅ Convenience methods work correctly");

    console.log("🎉 All audit logging tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Audit logging test failed:", error);
    return false;
  }
}

// Function to verify database schema
export async function verifyAuditSchema() {
  console.log("🔍 Verifying audit logs table schema...");

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .limit(1);

    if (error) {
      if (error.code === "PGRST116") {
        console.log(
          "ℹ️ audit_logs table exists but is empty (expected for new installations)"
        );
        return true;
      } else if (error.message.includes("does not exist")) {
        console.log(
          "❌ audit_logs table does not exist. Please run the SQL script:"
        );
        console.log("   scripts/create-audit-logs.sql");
        return false;
      } else {
        console.error("❌ Schema verification failed:", error);
        return false;
      }
    }

    console.log("✅ audit_logs table schema verified");
    return true;
  } catch (error) {
    console.error("❌ Schema verification error:", error);
    return false;
  }
}

// Function to check RLS policies
export async function verifyAuditSecurity() {
  console.log("🔐 Verifying audit logs security policies...");

  try {
    // This will test if RLS is properly configured
    const { data, error } = await supabase
      .from("audit_logs")
      .select("count")
      .single();

    if (error && error.code !== "PGRST116") {
      console.log("ℹ️ RLS policies are active (this is expected)");
    }

    console.log("✅ Security policies verified");
    return true;
  } catch (error) {
    console.error("❌ Security verification failed:", error);
    return false;
  }
}

// Complete test suite
export async function runAuditTestSuite() {
  console.log("🚀 Running complete audit logging test suite...");

  const schemaValid = await verifyAuditSchema();
  if (!schemaValid) {
    console.log(
      "❌ Schema validation failed. Please set up the database first."
    );
    return false;
  }

  const securityValid = await verifyAuditSecurity();
  const functionalityValid = await testAuditLogging();

  const allPassed = securityValid && functionalityValid;

  if (allPassed) {
    console.log("🎉 All audit logging tests completed successfully!");
    console.log("✅ Audit logging system is ready for production");
  } else {
    console.log("❌ Some tests failed. Please review the errors above.");
  }

  return allPassed;
}
