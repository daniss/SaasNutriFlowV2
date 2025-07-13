"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  user_id: string;
  role: "admin" | "superadmin";
  granted_at: string;
  is_active: boolean;
  user_email?: string;
  user_name?: string;
}

export function AdminManagement() {
  const { isSuperAdmin, loading: roleLoading } = useRoleBasedAccess();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "superadmin">(
    "admin"
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roleLoading && isSuperAdmin) {
      fetchAdminUsers();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [roleLoading, isSuperAdmin]);

  const fetchAdminUsers = async () => {
    try {
      const supabase = createClient();

      // Get admin users first
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("is_active", true)
        .order("granted_at", { ascending: false });

      if (adminError) {
        console.error("Error fetching admin users:", adminError);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des administrateurs.",
          variant: "destructive",
        });
        return;
      }

      // For now, just use the user_id as identifier
      // In a real implementation, you'd want to create an API route to get user emails
      const adminUsersWithDetails = (adminData || []).map((admin) => ({
        ...admin,
        user_email: `user-${admin.user_id.slice(0, 8)}...`,
        user_name: `Utilisateur ${admin.user_id.slice(0, 8)}`,
      }));

      setAdminUsers(adminUsersWithDetails);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du chargement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // For now, we'll create a placeholder admin entry
      // In a real implementation, you'd want to create an API route to look up users
      toast({
        title: "Fonction non implémentée",
        description:
          "L'ajout d'administrateurs nécessite une API backend pour rechercher les utilisateurs par email.",
        variant: "destructive",
      });
      return;

      // This would be the implementation with a proper backend API:
      /*
      const { data: userData, error: userError } = await fetch('/api/admin/find-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail.trim() })
      }).then(res => res.json())

      if (userError || !userData) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec cette adresse email.",
          variant: "destructive",
        })
        return
      }

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: userData.id,
          role: newAdminRole,
          is_active: true
        })

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: "Utilisateur déjà administrateur",
            description: "Cet utilisateur est déjà administrateur.",
            variant: "destructive",
          })
        } else {
          throw insertError
        }
        return
      }

      toast({
        title: "Administrateur ajouté",
        description: `${newAdminEmail} a été ajouté comme ${newAdminRole}.`,
      })

      setNewAdminEmail('')
      setNewAdminRole('admin')
      fetchAdminUsers()
      */
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'administrateur.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeAdmin = async (adminId: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("admin_users")
        .update({ is_active: false })
        .eq("id", adminId);

      if (error) throw error;

      toast({
        title: "Administrateur supprimé",
        description: "L'accès administrateur a été révoqué.",
      });

      fetchAdminUsers();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'administrateur.",
        variant: "destructive",
      });
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Accès restreint</h3>
              <p className="text-sm text-gray-600 mt-1">
                Seuls les super-administrateurs peuvent gérer les utilisateurs
                administrateurs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ajouter un administrateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Email de l'utilisateur"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <Select
              value={newAdminRole}
              onValueChange={(value: "admin" | "superadmin") =>
                setNewAdminRole(value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={addAdmin}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administrateurs actuels</CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucun administrateur configuré
            </p>
          ) : (
            <div className="space-y-3">
              {adminUsers.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {admin.user_name || admin.user_email}
                      </p>
                      {admin.user_name && (
                        <p className="text-sm text-gray-500">
                          {admin.user_email}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        admin.role === "superadmin" ? "default" : "secondary"
                      }
                    >
                      {admin.role === "superadmin" ? "Super Admin" : "Admin"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAdmin(admin.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
