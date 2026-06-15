import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "../../context/TenantContext";
import {
  createTenantInvitation,
  getTenantInvitations,
  getTenantMemberships,
  resendInvitation,
  revokeInvitation,
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] =
    useState<TenantMembership["role"]>("member");
  const [copiedInvitationId, setCopiedInvitationId] = useState<number | null>(null);

  const {
    data: memberships = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenant-memberships", tenantSlug],
    queryFn: getTenantMemberships,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["tenant-invitations", tenantSlug],
    queryFn: getTenantInvitations,
  });

  const updateMutation = useMutation({
    mutationFn: updateTenantMembership,
    onMutate: () => {
      setError("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-memberships", tenantSlug],
      });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.detail ||
        "Could not update member.";

      setError(message);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: createTenantInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-invitations", tenantSlug],
      });
      setInviteEmail("");
      setInviteRole("member");
    },
    onError: () => {
      setError("Could not create invitation.");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-invitations", tenantSlug],
      });
    },
    onError: () => {
      setError("Could not revoke invitation.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-invitations", tenantSlug],
      });
    },
    onError: () => {
      setError("Could not renew invitation.");
    },
  });

  function handleRoleChange(id: number, role: TenantMembership["role"]) {
    updateMutation.mutate({ id, role });
  }

  function handleActiveChange(id: number, is_active: boolean) {
    updateMutation.mutate({ id, is_active });
  }

  function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tenant Users</h2>
        <p className="text-muted-foreground">
          Manage users, roles and membership status for this workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />

            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as TenantMembership["role"])
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Inviting..." : "Create Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
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
                        onChange={(e) =>
                          handleRoleChange(
                            membership.id,
                            e.target.value as TenantMembership["role"]
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
                            true
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

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>

        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground">No invitations found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {invitations.map((invitation) => {
                  const inviteLink = `${window.location.origin}/accept-invitation?token=${invitation.token}`;

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{invitation.role}</TableCell>
                      <TableCell>
                        {invitation.accepted_at
                          ? "Accepted"
                          : invitation.is_expired
                            ? "Expired"
                            : invitation.is_active
                              ? "Pending"
                              : "Inactive"}
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expires_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {invitation.token}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await navigator.clipboard.writeText(inviteLink);
                              setCopiedInvitationId(invitation.id);

                              setTimeout(() => {
                                setCopiedInvitationId(null);
                              }, 2000);
                            }}
                          >
                            {copiedInvitationId === invitation.id ? "Copied!" : "Copy link"}
                          </Button>

                          {!invitation.accepted_at && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resendMutation.isPending}
                                onClick={() => resendMutation.mutate(invitation.id)}
                              >
                                Renew
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={revokeMutation.isPending}
                                onClick={() => {
                                  if (confirm(`Revoke invitation for ${invitation.email}?`)) {
                                    revokeMutation.mutate(invitation.id);
                                  }
                                }}
                              >
                                Revoke
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
