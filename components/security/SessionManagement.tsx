"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  AlertTriangle,
  Clock,
  LogOut,
  MapPin,
  Monitor,
  Shield,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useEffect, useState } from "react";

interface UserSession {
  id: string;
  device_info: {
    type: string;
    name: string;
    os?: string;
    browser?: string;
  };
  location?: {
    country?: string;
    city?: string;
    ip?: string;
  };
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

interface SessionSettings {
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_2fa_for_sensitive_actions: boolean;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadSessions();
    loadSettings();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/security/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/security/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<SessionSettings>) => {
    try {
      const response = await fetch("/api/security/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings({ ...settings!, ...newSettings });
        toast({
          title: "Paramètres mis à jour",
          description: "Les paramètres de sécurité ont été sauvegardés.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/security/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        setRevokeDialogOpen(false);
        setSessionToRevoke(null);
        toast({
          title: "Session révoquée",
          description: "La session a été fermée avec succès.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de révoquer la session.",
        variant: "destructive",
      });
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      const response = await fetch("/api/security/sessions/revoke-all", {
        method: "POST",
      });

      if (response.ok) {
        setSessions(sessions.filter((s) => s.is_current));
        toast({
          title: "Sessions révoquées",
          description: "Toutes les autres sessions ont été fermées.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de révoquer les sessions.",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7)
      return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paramètres de session
          </CardTitle>
          <CardDescription>
            Configurez les paramètres de sécurité des sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Délai d'expiration (minutes)
                  </label>
                  <select
                    value={settings.session_timeout_minutes}
                    onChange={(e) =>
                      updateSettings({
                        session_timeout_minutes: parseInt(e.target.value),
                      })
                    }
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 heure</option>
                    <option value={120}>2 heures</option>
                    <option value={240}>4 heures</option>
                    <option value={480}>8 heures</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Sessions simultanées max
                  </label>
                  <select
                    value={settings.max_concurrent_sessions}
                    onChange={(e) =>
                      updateSettings({
                        max_concurrent_sessions: parseInt(e.target.value),
                      })
                    }
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value={1}>1 session</option>
                    <option value={3}>3 sessions</option>
                    <option value={5}>5 sessions</option>
                    <option value={10}>10 sessions</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">2FA pour actions sensibles</p>
                  <p className="text-sm text-gray-500">
                    Demander 2FA pour les changements de sécurité
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateSettings({
                      require_2fa_for_sensitive_actions:
                        !settings.require_2fa_for_sensitive_actions,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.require_2fa_for_sensitive_actions
                      ? "bg-emerald-600"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.require_2fa_for_sensitive_actions
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Gérez vos sessions et appareils connectés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {sessions.length} session{sessions.length > 1 ? "s" : ""} active
              {sessions.length > 1 ? "s" : ""}
            </p>
            {sessions.filter((s) => !s.is_current).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={revokeAllOtherSessions}
              >
                Fermer les autres sessions
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border rounded-lg ${
                  session.is_current
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getDeviceIcon(session.device_info.type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {session.device_info.name}
                        </p>
                        {session.is_current && (
                          <Badge variant="default" className="text-xs">
                            Session actuelle
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {session.device_info.os &&
                          session.device_info.browser && (
                            <p>
                              {session.device_info.os} •{" "}
                              {session.device_info.browser}
                            </p>
                          )}

                        {session.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {session.location.city},{" "}
                              {session.location.country}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Dernière activité :{" "}
                            {formatLastActivity(session.last_activity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSessionToRevoke(session.id);
                        setRevokeDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune session active trouvée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Session Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fermer la session</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir fermer cette session ? L'utilisateur sera
              déconnecté.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action ne peut pas être annulée. La session sera
              immédiatement fermée.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => sessionToRevoke && revokeSession(sessionToRevoke)}
            >
              Fermer la session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
