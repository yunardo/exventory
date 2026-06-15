import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { acceptInvitation } from "./api";
import { useTenant } from "../../context/TenantContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectTenant } = useTenant();

  const token = searchParams.get("token");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (data) => {
      selectTenant(data.tenant.slug, data.membership.role);
      setMessage(data.detail);
      navigate("/dashboard", { replace: true });
    },
    onError: (error: any) => {
      setMessage(
        error?.response?.data?.detail ||
          "Could not accept invitation."
      );
    },
  });

  function handleAccept() {
    if (!token) {
      setMessage("Invitation token is missing.");
      return;
    }

    mutation.mutate(token);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Accept this invitation to join the workspace.
          </p>

          {message && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              {message}
            </p>
          )}

          <Button
            className="w-full"
            disabled={mutation.isPending || !token}
            onClick={handleAccept}
          >
            {mutation.isPending ? "Accepting..." : "Accept Invitation"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
