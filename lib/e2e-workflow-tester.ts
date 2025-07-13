import auditLogger from "@/lib/audit-logger";
import { supabase } from "@/lib/supabase";

// End-to-End Workflow Testing Suite
// This tests the complete user journeys to ensure everything works together

export interface WorkflowTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

export class E2EWorkflowTester {
  private results: WorkflowTestResult[] = [];

  async runAllTests(): Promise<WorkflowTestResult[]> {
    console.log("🚀 Starting End-to-End Workflow Testing...");

    this.results = [];

    // Test all critical workflows
    await this.testClientOnboardingWorkflow();
    await this.testMealPlanCreationWorkflow();
    await this.testDocumentManagementWorkflow();
    await this.testAppointmentSchedulingWorkflow();
    await this.testProgressTrackingWorkflow();
    await this.testInvoiceGenerationWorkflow();
    await this.testMessagingWorkflow();
    await this.testAnalyticsWorkflow();

    // Generate summary
    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;

    console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log("🎉 All end-to-end workflows passed!");
    } else {
      console.log("❌ Some workflows failed. Check the results for details.");
    }

    return this.results;
  }

  private async runTest(
    testName: string,
    testFn: () => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();
    try {
      console.log(`\n🧪 Testing: ${testName}`);
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ testName, passed: true, duration });
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.results.push({
        testName,
        passed: false,
        error: errorMessage,
        duration,
      });
      console.log(`❌ ${testName} - FAILED: ${errorMessage} (${duration}ms)`);
    }
  }

  // Test 1: Complete Client Onboarding Process
  async testClientOnboardingWorkflow(): Promise<void> {
    await this.runTest("Client Onboarding Workflow", async () => {
      const testClientData = {
        name: "E2E Test Client",
        email: `test-client-${Date.now()}@example.com`,
        phone: "+33123456789",
        age: 30,
        height: "170",
        current_weight: 70,
        goal_weight: 65,
        goal: "weight_loss",
        plan_type: "standard",
        status: "active",
      };

      // Step 1: Create client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert(testClientData)
        .select()
        .single();

      if (clientError || !client) {
        throw new Error("Failed to create client: " + clientError?.message);
      }

      // Step 2: Verify client can be retrieved
      const { data: retrievedClient, error: retrieveError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", client.id)
        .single();

      if (retrieveError || !retrievedClient) {
        throw new Error("Failed to retrieve client: " + retrieveError?.message);
      }

      // Step 3: Create initial weight measurement
      const { error: weightError } = await supabase
        .from("weight_history")
        .insert({
          client_id: client.id,
          weight: testClientData.current_weight,
          recorded_date: new Date().toISOString(),
        });

      if (weightError) {
        throw new Error(
          "Failed to create initial weight measurement: " + weightError.message
        );
      }

      // Step 4: Log the client creation
      await auditLogger.logClientCreate(client.id, testClientData);

      // Cleanup
      await supabase.from("weight_history").delete().eq("client_id", client.id);
      await supabase.from("clients").delete().eq("id", client.id);
    });
  }

  // Test 2: Meal Plan Creation to Client Delivery
  async testMealPlanCreationWorkflow(): Promise<void> {
    await this.runTest("Meal Plan Creation Workflow", async () => {
      // Create a test client first
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: "Test Client for Meal Plan",
          email: `meal-test-${Date.now()}@example.com`,
          goal: "weight_loss",
          plan_type: "standard",
          status: "active",
        })
        .select()
        .single();

      if (clientError || !client) {
        throw new Error(
          "Failed to create test client: " + clientError?.message
        );
      }

      try {
        // Step 1: Create meal plan
        const mealPlanData = {
          client_id: client.id,
          name: "Test E2E Meal Plan",
          description: "Automated test meal plan",
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          status: "active",
          meals: [
            {
              name: "Petit-déjeuner",
              time: "08:00",
              foods: [
                { name: "Flocons d'avoine", quantity: "50g", calories: 190 },
              ],
            },
          ],
        };

        const { data: mealPlan, error: mealPlanError } = await supabase
          .from("meal_plans")
          .insert(mealPlanData)
          .select()
          .single();

        if (mealPlanError || !mealPlan) {
          throw new Error(
            "Failed to create meal plan: " + mealPlanError?.message
          );
        }

        // Step 2: Verify meal plan can be retrieved
        const { data: retrievedPlan, error: retrieveError } = await supabase
          .from("meal_plans")
          .select("*")
          .eq("id", mealPlan.id)
          .single();

        if (retrieveError || !retrievedPlan) {
          throw new Error(
            "Failed to retrieve meal plan: " + retrieveError?.message
          );
        }

        // Step 3: Log the meal plan creation
        await auditLogger.logMealPlanCreate(mealPlan.id, client.id);

        // Cleanup
        await supabase.from("meal_plans").delete().eq("id", mealPlan.id);
      } finally {
        await supabase.from("clients").delete().eq("id", client.id);
      }
    });
  }

  // Test 3: Document Management Workflow
  async testDocumentManagementWorkflow(): Promise<void> {
    await this.runTest("Document Management Workflow", async () => {
      // Create test client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: "Test Client for Documents",
          email: `doc-test-${Date.now()}@example.com`,
          goal: "weight_loss",
          plan_type: "standard",
          status: "active",
        })
        .select()
        .single();

      if (clientError || !client) {
        throw new Error(
          "Failed to create test client: " + clientError?.message
        );
      }

      try {
        // Step 1: Test document metadata creation
        const documentData = {
          client_id: client.id,
          name: "test-document.pdf",
          file_path: "test/path/test-document.pdf",
          file_size: 1024,
          mime_type: "application/pdf",
          category: "medical",
          description: "Test document for E2E testing",
          is_visible_to_client: true,
        };

        const { data: document, error: docError } = await supabase
          .from("documents")
          .insert(documentData)
          .select()
          .single();

        if (docError || !document) {
          throw new Error(
            "Failed to create document metadata: " + docError?.message
          );
        }

        // Step 2: Test document retrieval
        const { data: documents, error: retrieveError } = await supabase
          .from("documents")
          .select("*")
          .eq("client_id", client.id);

        if (retrieveError || !documents || documents.length === 0) {
          throw new Error(
            "Failed to retrieve documents: " + retrieveError?.message
          );
        }

        // Step 3: Test document filtering by category
        const { data: medicalDocs, error: filterError } = await supabase
          .from("documents")
          .select("*")
          .eq("client_id", client.id)
          .eq("category", "medical");

        if (filterError || !medicalDocs || medicalDocs.length === 0) {
          throw new Error(
            "Failed to filter documents by category: " + filterError?.message
          );
        }

        // Step 4: Log document operations
        await auditLogger.logDocumentUpload(document.id, documentData);

        // Cleanup
        await supabase.from("documents").delete().eq("id", document.id);
      } finally {
        await supabase.from("clients").delete().eq("id", client.id);
      }
    });
  }

  // Test 4: Appointment Scheduling Workflow
  async testAppointmentSchedulingWorkflow(): Promise<void> {
    await this.runTest("Appointment Scheduling Workflow", async () => {
      // Create test client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: "Test Client for Appointments",
          email: `appt-test-${Date.now()}@example.com`,
          goal: "weight_loss",
          plan_type: "standard",
          status: "active",
        })
        .select()
        .single();

      if (clientError || !client) {
        throw new Error(
          "Failed to create test client: " + clientError?.message
        );
      }

      try {
        // Step 1: Create appointment
        const appointmentData = {
          client_id: client.id,
          title: "E2E Test Consultation",
          description: "Automated test appointment",
          scheduled_at: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          duration: 60,
          status: "scheduled",
          type: "consultation",
        };

        const { data: appointment, error: apptError } = await supabase
          .from("appointments")
          .insert(appointmentData)
          .select()
          .single();

        if (apptError || !appointment) {
          throw new Error(
            "Failed to create appointment: " + apptError?.message
          );
        }

        // Step 2: Verify appointment retrieval
        const { data: appointments, error: retrieveError } = await supabase
          .from("appointments")
          .select("*, clients(name, email)")
          .eq("id", appointment.id);

        if (retrieveError || !appointments || appointments.length === 0) {
          throw new Error(
            "Failed to retrieve appointment with client data: " +
              retrieveError?.message
          );
        }

        // Step 3: Test appointment status update
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ status: "completed" })
          .eq("id", appointment.id);

        if (updateError) {
          throw new Error(
            "Failed to update appointment status: " + updateError.message
          );
        }

        // Cleanup
        await supabase.from("appointments").delete().eq("id", appointment.id);
      } finally {
        await supabase.from("clients").delete().eq("id", client.id);
      }
    });
  }

  // Test 5: Progress Tracking Workflow
  async testProgressTrackingWorkflow(): Promise<void> {
    await this.runTest("Progress Tracking Workflow", async () => {
      // Create test client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: "Test Client for Progress",
          email: `progress-test-${Date.now()}@example.com`,
          current_weight: 80,
          goal_weight: 75,
          goal: "weight_loss",
          plan_type: "standard",
          status: "active",
        })
        .select()
        .single();

      if (clientError || !client) {
        throw new Error(
          "Failed to create test client: " + clientError?.message
        );
      }

      try {
        // Step 1: Add multiple weight measurements
        const weightMeasurements = [
          {
            client_id: client.id,
            weight: 80,
            recorded_date: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            client_id: client.id,
            weight: 78.5,
            recorded_date: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            client_id: client.id,
            weight: 77,
            recorded_date: new Date().toISOString(),
          },
        ];

        for (const measurement of weightMeasurements) {
          const { error: weightError } = await supabase
            .from("weight_history")
            .insert(measurement);

          if (weightError) {
            throw new Error(
              "Failed to add weight measurement: " + weightError.message
            );
          }
        }

        // Step 2: Verify weight history retrieval
        const { data: weightHistory, error: historyError } = await supabase
          .from("weight_history")
          .select("*")
          .eq("client_id", client.id)
          .order("recorded_date", { ascending: true });

        if (historyError || !weightHistory || weightHistory.length !== 3) {
          throw new Error(
            "Failed to retrieve complete weight history: " +
              historyError?.message
          );
        }

        // Step 3: Verify progress calculation
        const startWeight = weightHistory[0].weight;
        const currentWeight = weightHistory[weightHistory.length - 1].weight;
        const weightLoss = startWeight - currentWeight;

        if (weightLoss !== 3) {
          throw new Error(`Expected 3kg weight loss, got ${weightLoss}kg`);
        }

        // Step 4: Test progress photo metadata
        const photoData = {
          client_id: client.id,
          name: "progress-photo-test.jpg",
          file_path: "test/progress/photo.jpg",
          file_size: 2048,
          mime_type: "image/jpeg",
          category: "photo",
          description: "Test progress photo",
          is_visible_to_client: true,
          metadata: { type: "progress_photo", angle: "front" },
        };

        const { data: photo, error: photoError } = await supabase
          .from("documents")
          .insert(photoData)
          .select()
          .single();

        if (photoError || !photo) {
          throw new Error(
            "Failed to create progress photo metadata: " + photoError?.message
          );
        }

        // Cleanup
        await supabase.from("documents").delete().eq("id", photo.id);
        await supabase
          .from("weight_history")
          .delete()
          .eq("client_id", client.id);
      } finally {
        await supabase.from("clients").delete().eq("id", client.id);
      }
    });
  }

  // Test 6: Invoice Generation Workflow
  async testInvoiceGenerationWorkflow(): Promise<void> {
    await this.runTest("Invoice Generation Workflow", async () => {
      // Create test client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: "Test Client for Invoice",
          email: `invoice-test-${Date.now()}@example.com`,
          goal: "weight_loss",
          plan_type: "standard",
          status: "active",
        })
        .select()
        .single();

      if (clientError || !client) {
        throw new Error(
          "Failed to create test client: " + clientError?.message
        );
      }

      try {
        // Step 1: Create invoice
        const invoiceData = {
          client_id: client.id,
          invoice_number: `INV-E2E-${Date.now()}`,
          amount: 150.0,
          tax_amount: 30.0,
          total_amount: 180.0,
          due_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "draft",
          items: [
            {
              description: "Consultation nutritionnelle",
              quantity: 1,
              unit_price: 150.0,
              total: 150.0,
            },
          ],
        };

        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert(invoiceData)
          .select()
          .single();

        if (invoiceError || !invoice) {
          throw new Error("Failed to create invoice: " + invoiceError?.message);
        }

        // Step 2: Test invoice status transitions
        const statuses = ["sent", "paid"];
        for (const status of statuses) {
          const { error: updateError } = await supabase
            .from("invoices")
            .update({ status })
            .eq("id", invoice.id);

          if (updateError) {
            throw new Error(
              `Failed to update invoice to ${status}: ` + updateError.message
            );
          }
        }

        // Step 3: Verify invoice retrieval with client data
        const { data: invoiceWithClient, error: retrieveError } = await supabase
          .from("invoices")
          .select("*, clients(name, email)")
          .eq("id", invoice.id)
          .single();

        if (retrieveError || !invoiceWithClient) {
          throw new Error(
            "Failed to retrieve invoice with client data: " +
              retrieveError?.message
          );
        }

        // Step 4: Log invoice creation
        await auditLogger.logInvoiceCreate(
          invoice.id,
          client.id,
          invoiceData.total_amount
        );

        // Cleanup
        await supabase.from("invoices").delete().eq("id", invoice.id);
      } finally {
        await supabase.from("clients").delete().eq("id", client.id);
      }
    });
  }

  // Test 7: Messaging Workflow
  async testMessagingWorkflow(): Promise<void> {
    await this.runTest("Messaging Workflow", async () => {
      // Create test client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: "Test Client for Messaging",
          email: `message-test-${Date.now()}@example.com`,
          goal: "weight_loss",
          plan_type: "standard",
          status: "active",
        })
        .select()
        .single();

      if (clientError || !client) {
        throw new Error(
          "Failed to create test client: " + clientError?.message
        );
      }

      try {
        // Step 1: Create conversation
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .insert({
            client_id: client.id,
            subject: "E2E Test Conversation",
            status: "active",
          })
          .select()
          .single();

        if (convError || !conversation) {
          throw new Error(
            "Failed to create conversation: " + convError?.message
          );
        }

        // Step 2: Send message in conversation
        const messageData = {
          client_id: client.id,
          conversation_id: conversation.id,
          sender_type: "dietitian",
          content: "Test message for E2E workflow",
          message_type: "text",
        };

        const { data: message, error: msgError } = await supabase
          .from("messages")
          .insert(messageData)
          .select()
          .single();

        if (msgError || !message) {
          throw new Error("Failed to send message: " + msgError?.message);
        }

        // Step 3: Retrieve conversation with messages
        const { data: conversationWithMessages, error: retrieveError } =
          await supabase
            .from("conversations")
            .select(
              `
            *,
            messages(*),
            clients(name, email)
          `
            )
            .eq("id", conversation.id)
            .single();

        if (retrieveError || !conversationWithMessages) {
          throw new Error(
            "Failed to retrieve conversation with messages: " +
              retrieveError?.message
          );
        }

        // Step 4: Log message sending
        await auditLogger.logMessageSend(
          message.id,
          client.id,
          conversation.id
        );

        // Cleanup
        await supabase
          .from("messages")
          .delete()
          .eq("conversation_id", conversation.id);
        await supabase.from("conversations").delete().eq("id", conversation.id);
      } finally {
        await supabase.from("clients").delete().eq("id", client.id);
      }
    });
  }

  // Test 8: Analytics Workflow
  async testAnalyticsWorkflow(): Promise<void> {
    await this.runTest("Analytics Workflow", async () => {
      // This test verifies that analytics queries work correctly

      // Step 1: Test client count analytics
      const { data: clientCount, error: clientCountError } = await supabase
        .from("clients")
        .select("id", { count: "exact" });

      if (clientCountError) {
        throw new Error(
          "Failed to get client count: " + clientCountError.message
        );
      }

      // Step 2: Test appointment analytics
      const { data: appointmentCount, error: apptCountError } = await supabase
        .from("appointments")
        .select("id", { count: "exact" });

      if (apptCountError) {
        throw new Error(
          "Failed to get appointment count: " + apptCountError.message
        );
      }

      // Step 3: Test revenue analytics
      const { data: revenueData, error: revenueError } = await supabase
        .from("invoices")
        .select("total_amount, status")
        .eq("status", "paid");

      if (revenueError) {
        throw new Error("Failed to get revenue data: " + revenueError.message);
      }

      // Step 4: Test date-range analytics
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { data: recentClients, error: recentError } = await supabase
        .from("clients")
        .select("*")
        .gte("created_at", thirtyDaysAgo);

      if (recentError) {
        throw new Error("Failed to get recent clients: " + recentError.message);
      }

      console.log(`Analytics test results:
        - Total clients: ${clientCount?.length || 0}
        - Total appointments: ${appointmentCount?.length || 0}
        - Revenue records: ${revenueData?.length || 0}
        - Recent clients: ${recentClients?.length || 0}`);
    });
  }

  getResults(): WorkflowTestResult[] {
    return this.results;
  }

  getSuccessRate(): number {
    if (this.results.length === 0) return 0;
    const passed = this.results.filter((r) => r.passed).length;
    return (passed / this.results.length) * 100;
  }

  getFailedTests(): WorkflowTestResult[] {
    return this.results.filter((r) => !r.passed);
  }
}

// Convenience function to run all tests
export async function runE2EWorkflowTests(): Promise<WorkflowTestResult[]> {
  const tester = new E2EWorkflowTester();
  return await tester.runAllTests();
}

export default E2EWorkflowTester;
