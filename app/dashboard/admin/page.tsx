"use client";

import { AdminManagement } from "@/components/admin/AdminManagement";

export default function AdminManagementPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestion des administrateurs</h1>
        <p className="text-gray-600 mt-2">
          Gérez les accès administrateurs et les permissions système.
        </p>
      </div>
      <AdminManagement />
    </div>
  );
}
