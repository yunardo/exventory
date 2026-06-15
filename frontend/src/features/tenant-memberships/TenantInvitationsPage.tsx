import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "../../context/TenantContext";
import {
  createTenantInvitation,
  getTenantInvitations,
  resendInvitation,
  revokeInvitation,
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

export function TenantInvitationsPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();

  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] =
    useState<TenantMembership["role"]>("member");
  const [copiedInvitationId, setCopiedInvitationId] =
    useState<number | null>(null);

  const { data: invitations = [], isLoading, isError } = useQuery({
    queryKey: ["tenant-invitations", tenantSlug],
    queryFn: getTenantInvitations,
  });

  const inviteMutation = useMutation({
    mutationFn: createTenantInvitation,
    onMutate: () => setError(""),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-invitations", tenantSlug],
      });
      setInviteEmail("");
      setInviteRole("member");
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.email?.[0] ||
          "Could not create invitation."
      );
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeInvitation,
    onMutate: () => setError(""),
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
    onMutate: () => setError(""),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-invitations", tenantSlug],
      });
    },
    onError: () => {
      setError("Could not renew invitation.");
    },
  });

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
        <h2 className="text-2xl font-bold tracking-tight">Invitations</h2>
        <p className="text-muted-foreground">
          Invite users to join this workspace.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="user@example.com"
              required
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />

            <select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as TenantMembership["role"])
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
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load invitations.
            </p>
          )}

          {!isLoading && !isError && invitations.length === 0 && (
            <p className="text-muted-foreground">No invitations found.</p>
          )}

          {!isLoading && !isError && invitations.length > 0 && (
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
                  const status = invitation.accepted_at
                    ? "Accepted"
                    : invitation.is_expired
                      ? "Expired"
                      : invitation.is_active
                        ? "Pending"
                        : "Inactive";

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{invitation.role}</TableCell>
                      <TableCell>{status}</TableCell>
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
                            {copiedInvitationId === invitation.id
                              ? "Copied!"
                              : "Copy link"}
                          </Button>

                          {!invitation.accepted_at && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resendMutation.isPending}
                                onClick={() =>
                                  resendMutation.mutate(invitation.id)
                                }
                              >
                                Renew
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={revokeMutation.isPending}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Revoke invitation for ${invitation.email}?`
                                    )
                                  ) {
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