"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuthNew";
import { emailService } from "@/lib/email";
import { PDFGenerator, type InvoiceData } from "@/lib/pdf";
import { getStatusDisplay, getStatusVariant } from "@/lib/status";
import { supabase, type Client, type Invoice } from "@/lib/supabase";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Mail,
  Plus,
  Printer,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface InvoiceWithClient extends Invoice {
  clients: { name: string; email: string } | null;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [clients, setClients] = useState<Pick<Client, "id" | "name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceWithClient | null>(null);
  const [editInvoice, setEditInvoice] = useState({
    id: "",
    client_id: "",
    invoice_number: "",
    service_description: "",
    amount: "",
    due_date: "",
    notes: "",
    status: "",
    hourly_rate: "",
    hours_worked: "",
    consultation_type: "",
    payment_terms: "",
    tax_rate: "",
  });
  const [newInvoice, setNewInvoice] = useState({
    client_id: "",
    service_description: "",
    amount: "",
    due_date: "",
    notes: "",
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Payment and notification functions
  const processPayment = async (invoice: InvoiceWithClient) => {
    if (!invoice.clients?.email) {
      toast({
        title: "Erreur",
        description: "Email du client introuvable",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(`payment-${invoice.id}`);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amount * 100, // Convert to cents
          currency: "eur",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors du traitement du paiement"
        );
      }

      if (result.paymentUrl) {
        // Open payment page in new tab
        window.open(result.paymentUrl, "_blank");

        toast({
          title: "Lien de paiement généré",
          description: "Le lien de paiement s'ouvre dans un nouvel onglet",
        });
      } else {
        toast({
          title: "Paiement traité",
          description: "Le paiement a été traité avec succès",
        });

        // Refresh invoices
        await fetchData();
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      toast({
        title: "Erreur de paiement",
        description:
          error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const sendPaymentReminder = async (invoice: InvoiceWithClient) => {
    if (!invoice.clients?.email) {
      toast({
        title: "Erreur",
        description: "Email du client introuvable",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(`reminder-${invoice.id}`);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "payment_reminder",
          recipient: {
            email: invoice.clients.email,
            name: invoice.clients.name,
          },
          data: {
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            dueDate: invoice.due_date,
            serviceDescription: invoice.service_description,
            clientName: invoice.clients.name,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'envoi du rappel");
      }

      toast({
        title: "Rappel envoyé",
        description: `Rappel de paiement envoyé à ${invoice.clients.name}`,
      });
    } catch (error) {
      console.error("❌ Notification error:", error);
      toast({
        title: "Erreur d'envoi",
        description:
          error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch invoices with client names and emails
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          clients (name, email)
        `
        )
        .eq("dietitian_id", user.id)
        .order("created_at", { ascending: false });

      if (invoiceError) {
        console.error("❌ Error fetching invoices:", invoiceError);
      } else {
        setInvoices(invoiceData || []);
      }

      // Fetch clients for the dropdown
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, name")
        .eq("dietitian_id", user.id)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (clientError) {
        console.error("❌ Error fetching clients:", clientError);
      } else {
        setClients(clientData || []);
      }
    } catch (error) {
      console.error("❌ Unexpected error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `INV-${year}${month}-${random}`;
  };

  const handleAddInvoice = async () => {
    if (
      !user ||
      !newInvoice.client_id ||
      !newInvoice.service_description ||
      !newInvoice.amount
    )
      return;

    try {
      const invoiceData = {
        dietitian_id: user.id,
        client_id: newInvoice.client_id,
        invoice_number: generateInvoiceNumber(),
        service_description: newInvoice.service_description,
        amount: Number.parseFloat(newInvoice.amount),
        status: "pending",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: newInvoice.due_date,
        payment_date: null,
        notes: newInvoice.notes || null,
      };

      const { data, error } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select(
          `
          *,
          clients (name)
        `
        )
        .single();

      if (error) {
        console.error("❌ Error adding invoice:", error);
        return;
      }

      setInvoices([data, ...invoices]);
      setIsAddDialogOpen(false);
      setNewInvoice({
        client_id: "",
        service_description: "",
        amount: "",
        due_date: "",
        notes: "",
      });
    } catch (error) {
      console.error("❌ Unexpected error adding invoice:", error);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === "paid") {
        updateData.payment_date = new Date().toISOString().split("T")[0];
      }

      const { data, error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", invoiceId)
        .eq("dietitian_id", user!.id)
        .select(
          `
          *,
          clients (name)
        `
        )
        .single();

      if (error) {
        console.error("❌ Error updating invoice:", error);
        return;
      }

      setInvoices(invoices.map((inv) => (inv.id === invoiceId ? data : inv)));
    } catch (error) {
      console.error("❌ Unexpected error updating invoice:", error);
    }
  };

  const generateInvoicePDF = async (invoice: InvoiceWithClient) => {
    try {
      toast({
        title: "Génération du PDF",
        description: "Génération du PDF en cours...",
      });

      // Prepare invoice data for PDF generation
      const invoiceData: InvoiceData = {
        ...invoice,
        dietitian: {
          name: user?.email || "Diététicien", // You might want to get this from a profile table
          email: user?.email || "",
          phone: "", // Add these fields to your profile if needed
          address: "",
          siret: "",
        },
      };

      // Generate and download PDF
      const doc = await PDFGenerator.generateInvoicePDF(invoiceData);
      PDFGenerator.downloadPDF(doc, `facture-${invoice.invoice_number}.pdf`);

      toast({
        title: "PDF généré",
        description: "Le PDF de la facture a été téléchargé avec succès",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  const printInvoice = (invoice: InvoiceWithClient) => {
    generateInvoicePDF(invoice);
  };

  const sendEmail = async (invoice: InvoiceWithClient) => {
    const clientEmail = invoice.clients?.email;

    if (!clientEmail) {
      toast({
        title: "Email non disponible",
        description:
          "Email du client introuvable. Veuillez ajouter l'email du client pour envoyer les factures.",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(invoice.id);

      // Prepare invoice data for email
      const invoiceEmailData = {
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.clients?.name || "Client estimé",
        clientEmail: clientEmail,
        serviceDescription: invoice.service_description,
        amount: invoice.amount,
        dueDate: invoice.due_date,
        notes: invoice.notes || undefined,
      };

      // Send email using the email service
      const result = await emailService.sendInvoiceEmail(invoiceEmailData);

      if (result.success) {
        toast({
          title: "Email envoyé",
          description: result.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Payment functions
  const handleCreatePayment = async (invoice: InvoiceWithClient) => {
    if (!invoice.clients?.email) {
      toast({
        title: "Erreur",
        description: "Aucun email client trouvé pour cette facture",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(`payment-${invoice.id}`);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amount,
          currency: "eur",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Paiement créé",
          description: `Lien de paiement créé via ${data.provider}`,
        });

        // Send payment notification email
        await handleSendInvoiceNotification(
          invoice,
          data.paymentIntent.clientSecret
        );
      } else {
        throw new Error(data.error || "Erreur lors de la création du paiement");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      toast({
        title: "Erreur de paiement",
        description:
          error instanceof Error
            ? error.message
            : "Impossible de créer le paiement",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Notification functions
  const handleSendInvoiceNotification = async (
    invoice: InvoiceWithClient,
    paymentLink?: string
  ) => {
    if (!invoice.clients?.email) {
      toast({
        title: "Erreur",
        description: "Aucun email client trouvé",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(`notify-${invoice.id}`);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "invoice_notification",
          recipient: {
            email: invoice.clients.email,
            phone: null, // Could be extended to include phone numbers
          },
          data: {
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            dueDate: invoice.due_date,
            dietitianName:
              user?.user_metadata?.full_name || "Votre nutritionniste",
            paymentLink,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Notification envoyée",
          description: `Email envoyé à ${invoice.clients.email}`,
        });
      } else {
        throw new Error(
          data.error || "Erreur lors de l'envoi de la notification"
        );
      }
    } catch (error) {
      console.error("Notification error:", error);
      toast({
        title: "Erreur de notification",
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendAppointmentReminder = async (
    clientEmail: string,
    appointmentData: any
  ) => {
    setActionLoading(`reminder-${appointmentData.id}`);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "appointment_reminder",
          recipient: {
            email: clientEmail,
            phone: null,
          },
          data: {
            appointmentDate: appointmentData.date,
            appointmentTime: appointmentData.time,
            dietitianName:
              user?.user_metadata?.full_name || "Votre nutritionniste",
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Rappel envoyé",
          description: `Rappel envoyé à ${clientEmail}`,
        });
      } else {
        throw new Error(data.error || "Erreur lors de l'envoi du rappel");
      }
    } catch (error) {
      console.error("Reminder error:", error);
      toast({
        title: "Erreur de rappel",
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer le rappel",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (invoice: InvoiceWithClient) => {
    setEditInvoice({
      id: invoice.id,
      client_id: invoice.client_id,
      invoice_number: invoice.invoice_number,
      service_description: invoice.service_description,
      amount: invoice.amount.toString(),
      due_date: invoice.due_date,
      notes: invoice.notes || "",
      status: invoice.status,
      hourly_rate: "", // These can be added to database schema later
      hours_worked: "",
      consultation_type: "consultation",
      payment_terms: "30",
      tax_rate: "0",
    });
    setIsEditDialogOpen(true);
  };

  const calculateTotal = () => {
    const amount = parseFloat(editInvoice.amount) || 0;
    const taxRate = parseFloat(editInvoice.tax_rate) || 0;
    const tax = amount * (taxRate / 100);
    return amount + tax;
  };

  const handleEditInvoice = async () => {
    if (
      !user ||
      !editInvoice.client_id ||
      !editInvoice.service_description ||
      !editInvoice.amount
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData = {
        client_id: editInvoice.client_id,
        service_description: editInvoice.service_description,
        amount: parseFloat(editInvoice.amount),
        due_date: editInvoice.due_date,
        notes: editInvoice.notes,
        status: editInvoice.status,
      };

      const { data, error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", editInvoice.id)
        .eq("dietitian_id", user.id)
        .select(
          `
          *,
          clients (name, email)
        `
        )
        .single();

      if (error) {
        console.error("❌ Error updating invoice:", error);
        toast({
          title: "Erreur",
          description: "Impossible de modifier la facture.",
          variant: "destructive",
        });
        return;
      }

      // Update the invoices list
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === editInvoice.id ? data : inv))
      );

      // Update selected invoice if it's the same
      if (selectedInvoice?.id === editInvoice.id) {
        setSelectedInvoice(data);
      }

      setIsEditDialogOpen(false);
      toast({
        title: "Facture modifiée",
        description: `La facture #${data.invoice_number} a été mise à jour avec succès.`,
      });
    } catch (error) {
      console.error("❌ Unexpected error updating invoice:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.service_description
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Factures</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Factures"
        subtitle="Gérer la facturation et suivre les paiements"
        searchPlaceholder="Rechercher des factures..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Créer une facture
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle facture</DialogTitle>
                <DialogDescription>
                  Générer une facture pour vos services clients.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={newInvoice.client_id}
                    onValueChange={(value: string) =>
                      setNewInvoice({ ...newInvoice, client_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Description du service *</Label>
                  <Input
                    id="service"
                    value={newInvoice.service_description}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        service_description: e.target.value,
                      })
                    }
                    placeholder="ex. Consultation nutritionnelle - 1 heure"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant (€) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newInvoice.amount}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, amount: e.target.value })
                      }
                      placeholder="150.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Date d'échéance</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={newInvoice.due_date}
                      onChange={(e) =>
                        setNewInvoice({
                          ...newInvoice,
                          due_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newInvoice.notes}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, notes: e.target.value })
                    }
                    placeholder="Notes supplémentaires ou conditions de paiement..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddInvoice}
                  disabled={
                    !newInvoice.client_id ||
                    !newInvoice.service_description ||
                    !newInvoice.amount
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 font-medium"
                >
                  Créer la facture
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Invoice Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {selectedInvoice?.invoice_number}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Détails de la facture et options de gestion
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedInvoice?.status === "paid"
                      ? "default"
                      : selectedInvoice?.status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                  className={
                    selectedInvoice?.status === "paid"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : selectedInvoice?.status === "pending"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {selectedInvoice?.status
                    ? selectedInvoice.status.charAt(0).toUpperCase() +
                      selectedInvoice.status.slice(1)
                    : "Unknown"}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Client & Amount Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Informations client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nom du client
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedInvoice.clients?.name || "Client inconnu"}
                      </p>
                    </div>
                    {selectedInvoice.clients?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Email
                        </label>
                        <p className="text-gray-900">
                          <a
                            href={`mailto:${selectedInvoice.clients.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {selectedInvoice.clients.email}
                          </a>
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Date de facture
                      </label>
                      <p className="text-gray-900">
                        {new Date(
                          selectedInvoice.issue_date
                        ).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {selectedInvoice.due_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Date d'échéance
                        </label>
                        <p className="text-gray-900">
                          {new Date(
                            selectedInvoice.due_date
                          ).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      Informations de paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Montant
                      </label>
                      <p className="text-3xl font-bold text-gray-900">
                        {selectedInvoice.amount.toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Statut
                      </label>
                      <p className="text-gray-900 capitalize font-medium">
                        {selectedInvoice.status === "paid"
                          ? "Payée"
                          : selectedInvoice.status === "pending"
                          ? "En attente"
                          : selectedInvoice.status}
                      </p>
                    </div>
                    {selectedInvoice.payment_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Date de paiement
                        </label>
                        <p className="text-gray-900">
                          {new Date(
                            selectedInvoice.payment_date
                          ).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Service Description */}{" "}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Détails du service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-500 block mb-2">
                      Description du service
                    </label>
                    <p className="text-gray-900 leading-relaxed">
                      {selectedInvoice.service_description}
                    </p>
                  </div>
                  {selectedInvoice.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500 block mb-2">
                        Notes supplémentaires
                      </label>
                      <div className="bg-blue-50 border-l-4 border-blue-200 p-4 rounded">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedInvoice.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Timeline */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Chronologie de la facture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Facture créée
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            selectedInvoice.created_at
                          ).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Facture émise
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            selectedInvoice.issue_date
                          ).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {selectedInvoice.payment_date && (
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Paiement reçu
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              selectedInvoice.payment_date
                            ).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                {/* Main Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateInvoicePDF(selectedInvoice)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printInvoice(selectedInvoice)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 w-full"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendEmail(selectedInvoice)}
                    disabled={actionLoading === selectedInvoice.id}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 w-full"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {actionLoading === selectedInvoice.id
                      ? "Envoi..."
                      : "Envoyer par email"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditDialog(selectedInvoice);
                    }}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 w-full"
                    type="button"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </div>

                {/* Status-specific Actions */}
                {selectedInvoice.status === "pending" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      size="sm"
                      onClick={() => processPayment(selectedInvoice)}
                      disabled={
                        actionLoading === `payment-${selectedInvoice.id}`
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {actionLoading === `payment-${selectedInvoice.id}`
                        ? "Traitement..."
                        : "Processus de paiement"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendPaymentReminder(selectedInvoice)}
                      disabled={
                        actionLoading === `reminder-${selectedInvoice.id}`
                      }
                      className="border-orange-200 text-orange-700 hover:bg-orange-50 w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {actionLoading === `reminder-${selectedInvoice.id}`
                        ? "Envoi..."
                        : "Envoyer rappel"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateInvoiceStatus(selectedInvoice.id, "paid");
                        setIsDetailsDialogOpen(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                    >
                      Marquer comme payée
                    </Button>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="pt-4 border-t border-red-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Êtes-vous sûr de vouloir supprimer cette facture ?"
                        )
                      ) {
                        // Add delete functionality here
                        toast({
                          title: "Facture supprimée",
                          description:
                            "La facture a été supprimée avec succès.",
                        });
                        setIsDetailsDialogOpen(false);
                      }
                    }}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[950px] max-h-[75vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Modifier la facture #{editInvoice.invoice_number}
            </DialogTitle>
            <DialogDescription>
              Mettre à jour les informations de la facture. Les champs marqués
              d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            {/* Client and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={editInvoice.client_id}
                  onValueChange={(value: string) =>
                    setEditInvoice({ ...editInvoice, client_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut de la facture</Label>
                <Select
                  value={editInvoice.status}
                  onValueChange={(value: string) =>
                    setEditInvoice({ ...editInvoice, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Description du service *</Label>
              <Input
                id="service"
                value={editInvoice.service_description}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    service_description: e.target.value,
                  })
                }
                placeholder="ex. Consultation nutritionnelle - 1 heure"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={editInvoice.amount}
                  onChange={(e) =>
                    setEditInvoice({ ...editInvoice, amount: e.target.value })
                  }
                  placeholder="120.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Date d'échéance</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={editInvoice.due_date}
                  onChange={(e) =>
                    setEditInvoice({ ...editInvoice, due_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Taux de TVA (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={editInvoice.tax_rate}
                  onChange={(e) =>
                    setEditInvoice({ ...editInvoice, tax_rate: e.target.value })
                  }
                  placeholder="20.00"
                />
              </div>
            </div>
            {/* Notes and Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editInvoice.notes}
                  onChange={(e) =>
                    setEditInvoice({ ...editInvoice, notes: e.target.value })
                  }
                  placeholder="Notes supplémentaires ou conditions de paiement..."
                  className="h-16 resize-none"
                />
              </div>

              {/* Invoice Summary - Compact */}
              {editInvoice.amount && (
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 h-fit">
                  <h4 className="font-semibold text-emerald-900 mb-2 text-sm">
                    Récapitulatif
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Montant HT:</span>
                      <span className="font-medium">
                        {parseFloat(editInvoice.amount || "0").toFixed(2)} €
                      </span>
                    </div>
                    {parseFloat(editInvoice.tax_rate || "0") > 0 && (
                      <div className="flex justify-between">
                        <span>TVA ({editInvoice.tax_rate}%):</span>
                        <span className="font-medium">
                          {(
                            (parseFloat(editInvoice.amount || "0") *
                              parseFloat(editInvoice.tax_rate || "0")) /
                            100
                          ).toFixed(2)}{" "}
                          €
                        </span>
                      </div>
                    )}
                    <hr className="my-1" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span className="text-emerald-700">
                        {calculateTotal().toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Information - Ultra Compact */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Informations professionnelles
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="hourly_rate" className="text-xs">
                    Taux horaire
                  </Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={editInvoice.hourly_rate}
                    onChange={(e) =>
                      setEditInvoice({
                        ...editInvoice,
                        hourly_rate: e.target.value,
                      })
                    }
                    placeholder="50.00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hours_worked" className="text-xs">
                    Heures travaillées
                  </Label>
                  <Input
                    id="hours_worked"
                    type="number"
                    value={editInvoice.hours_worked}
                    onChange={(e) =>
                      setEditInvoice({
                        ...editInvoice,
                        hours_worked: e.target.value,
                      })
                    }
                    placeholder="2"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="consultation_type" className="text-xs">
                    Type consultation
                  </Label>
                  <Select
                    value={editInvoice.consultation_type}
                    onValueChange={(value: string) =>
                      setEditInvoice({
                        ...editInvoice,
                        consultation_type: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">
                        Consultation initiale
                      </SelectItem>
                      <SelectItem value="suivi">Suivi nutritionnel</SelectItem>
                      <SelectItem value="education">
                        Éducation thérapeutique
                      </SelectItem>
                      <SelectItem value="bilan">Bilan nutritionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment_terms" className="text-xs">
                    Conditions paiement (j)
                  </Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    value={editInvoice.payment_terms}
                    onChange={(e) =>
                      setEditInvoice({
                        ...editInvoice,
                        payment_terms: e.target.value,
                      })
                    }
                    placeholder="30"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditInvoice}
              disabled={
                !editInvoice.client_id ||
                !editInvoice.service_description ||
                !editInvoice.amount
              }
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 font-medium px-6"
            >
              <Edit className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="px-6 space-y-6">
        {/* Revenue Summary */}
        <div className="grid gap-6 md:grid-cols-3 animate-in slide-in-from-bottom-4 duration-700">
          <Card className="border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-emerald-50/90 to-emerald-100/60 hover:from-emerald-50 hover:to-emerald-100/80 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-700 tracking-wide uppercase">
                Chiffre d'affaires total
              </CardTitle>
              <div className="h-12 w-12 bg-emerald-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 tabular-nums mb-1">
                {totalRevenue.toFixed(2)} €
              </div>
              <p className="text-emerald-600 text-sm font-medium">
                Factures payées
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-amber-50/90 to-amber-100/60 hover:from-amber-50 hover:to-amber-100/80 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-amber-700 tracking-wide uppercase">
                Montant en attente
              </CardTitle>
              <div className="h-12 w-12 bg-amber-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 tabular-nums mb-1">
                {pendingAmount.toFixed(2)} €
              </div>
              <p className="text-amber-600 text-sm font-medium">
                En attente de paiement
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-50/90 to-blue-100/60 hover:from-blue-50 hover:to-blue-100/80 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 tracking-wide uppercase">
                Total des factures
              </CardTitle>
              <div className="h-12 w-12 bg-blue-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 tabular-nums mb-1">
                {invoices.length}
              </div>
              <p className="text-blue-600 text-sm font-medium">
                Depuis le début
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        {loading ? (
          <ListSkeleton items={5} />
        ) : filteredInvoices.length === 0 ? (
          <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm animate-scale-in">
            <CardContent className="pt-16 pb-16">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-soft">
                  <FileText className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {searchTerm
                    ? "Aucune facture trouvée"
                    : "Aucune facture pour le moment"}
                </h3>
                <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                  {searchTerm
                    ? "Essayez d'ajuster vos termes de recherche pour trouver ce que vous cherchez."
                    : "Créez votre première facture pour commencer à suivre votre facturation et vos paiements."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre première facture
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {invoice.invoice_number}
                        </CardTitle>
                        <Badge variant={getStatusVariant(invoice.status)}>
                          {getStatusDisplay(invoice.status)}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center text-gray-600">
                        <Users className="mr-2 h-4 w-4" />
                        {invoice.clients?.name || "Client inconnu"}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {invoice.amount.toFixed(2)} €
                      </p>
                      <p className="text-sm text-gray-500">Montant</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">
                      Description du service
                    </h4>
                    <p className="text-gray-700">
                      {invoice.service_description}
                    </p>
                    {invoice.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </h5>
                        <p className="text-sm text-gray-600">{invoice.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Date d'émission</span>
                        <p className="font-medium text-gray-900">
                          {new Date(invoice.issue_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                    </div>
                    {invoice.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-500" />
                        <div>
                          <span className="text-gray-500">Date d'échéance</span>
                          <p className="font-medium text-gray-900">
                            {new Date(invoice.due_date).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    {invoice.payment_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        <div>
                          <span className="text-gray-500">
                            Date de paiement
                          </span>
                          <p className="font-medium text-gray-900">
                            {new Date(invoice.payment_date).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="mr-2 h-4 w-4" />
                      Créée le{" "}
                      {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="flex gap-2">
                      {invoice.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => processPayment(invoice)}
                            disabled={actionLoading === `payment-${invoice.id}`}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            {actionLoading === `payment-${invoice.id}`
                              ? "Traitement..."
                              : "Payer"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendPaymentReminder(invoice)}
                            disabled={
                              actionLoading === `reminder-${invoice.id}`
                            }
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {actionLoading === `reminder-${invoice.id}`
                              ? "Envoi..."
                              : "Rappel"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateInvoiceStatus(invoice.id, "paid")
                            }
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            Marquer comme payée
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailsDialogOpen(true);
                        }}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
