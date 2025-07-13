"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import auditLogger, {
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/lib/audit-logger";
import { formatDate } from "@/lib/formatters";
import { Download, Eye, Filter, RefreshCw, Search, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export function AuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const auditLogs = await auditLogger.getAuditLogs(filters);
      setLogs(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les journaux d'audit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      offset: 0, // Reset pagination when filter changes
    }));
  };

  const handleSearch = () => {
    if (searchTerm) {
      setFilters((prev) => ({
        ...prev,
        user_email: searchTerm,
        offset: 0,
      }));
    } else {
      setFilters((prev) => {
        const { user_email, ...rest } = prev;
        return { ...rest, offset: 0 };
      });
    }
  };

  const exportAuditLogs = async () => {
    setExporting(true);
    try {
      const blob = await auditLogger.exportAuditLogs(filters);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Log the export action
        await auditLogger.logDataExport("audit_logs", filters);

        toast({
          title: "Export réussi",
          description: "Les journaux d'audit ont été exportés avec succès",
        });
      } else {
        throw new Error("Failed to generate export file");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les journaux d'audit",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "login":
      case "logout":
        return "outline";
      case "export":
      case "download":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      !searchTerm ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-600" />
            Journaux d'audit
          </h2>
          <p className="text-slate-600">
            Suivi complet des activités système pour la sécurité et la
            conformité
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            onClick={exportAuditLogs}
            variant="outline"
            size="sm"
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Export..." : "Exporter"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Email, action, ressource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange("action", value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="create">Création</SelectItem>
                  <SelectItem value="update">Modification</SelectItem>
                  <SelectItem value="delete">Suppression</SelectItem>
                  <SelectItem value="login">Connexion</SelectItem>
                  <SelectItem value="logout">Déconnexion</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="download">Téléchargement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource_type">Type de ressource</Label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange(
                    "resource_type",
                    value === "all" ? "" : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les ressources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les ressources</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="meal_plan">Plan alimentaire</SelectItem>
                  <SelectItem value="invoice">Facture</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="auth">Authentification</SelectItem>
                  <SelectItem value="data">Données</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type">Type d'utilisateur</Label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange("user_type", value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="dietitian">Diététicien</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Entrées d'audit ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Journal détaillé de toutes les activités système
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Aucune entrée d'audit trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Heure</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Ressource</TableHead>
                    <TableHead>ID Ressource</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Session</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.created_at ? formatDate(log.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {log.user_email || "Inconnu"}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {log.user_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.resource_type}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.resource_id
                          ? log.resource_id.substring(0, 8) + "..."
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.details ? (
                          <div className="text-xs bg-slate-50 p-2 rounded overflow-hidden">
                            <pre className="whitespace-pre-wrap text-xs">
                              {JSON.stringify(log.details, null, 1)}
                            </pre>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.session_id
                          ? log.session_id.substring(0, 12) + "..."
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
