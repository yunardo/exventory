import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "../../context/TenantContext";
import {
  getTenantMemberships,
  updateTenantMembership,
  type TenantMembership,
} from "./api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roles: TenantMembership["role"][] = [
  "owner",
  "admin",
  "member",
  "viewer",
];

export function TenantMembershipsPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const {
    data: memberships = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenant-memberships", tenantSlug],
    queryFn: getTenantMemberships,
  });

  const updateMutation = useMutation({
    mutationFn: updateTenantMembership,
    onMutate: () => setError(""),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-memberships", tenantSlug],
      });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Could not update member.");
    },
  });

  function handleRoleChange(id: number, role: TenantMembership["role"]) {
    updateMutation.mutate({ id, role });
  }

  function handleActiveChange(id: number, is_active: boolean) {
    updateMutation.mutate({ id, is_active });
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tenant Users</h2>
        <p className="text-muted-foreground">
          Manage users, roles and membership status for this workspace.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load tenant members.
            </p>
          )}

          {!isLoading && !isError && memberships.length === 0 && (
            <p className="text-muted-foreground">No members found.</p>
          )}

          {!isLoading && !isError && memberships.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>{membership.username}</TableCell>
                    <TableCell>{membership.email}</TableCell>

                    <TableCell>
                      <select
                        value={membership.role}
                        disabled={updateMutation.isPending}
                        onChange={(event) =>
                          handleRoleChange(
                            membership.id,
                            event.target.value as TenantMembership["role"]
                          )
                        }
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    <TableCell>
                      <Button
                        variant={membership.is_active ? "outline" : "destructive"}
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          handleActiveChange(
                            membership.id,
                            !membership.is_active
                          )
                        }
                      >
                        {membership.is_active ? "Active" : "Inactive"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}