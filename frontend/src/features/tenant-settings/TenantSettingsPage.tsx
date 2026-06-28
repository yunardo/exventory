import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import {
  getTenantSettings,
  updateTenantSettings,
  type UpdateTenantSettingsPayload,
} from "./api";
import { useTenant } from "../../context/TenantContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TenantSettingsPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<UpdateTenantSettingsPayload>({
    defaultValues: {
      name: "",
      company_name: "",
      tax_id: "",
      phone: "",
      address: "",
      currency_code: "BOB",
      timezone: "America/La_Paz",
    },
  });

  const documentNumberFormat = watch("document_number_format");

  const documentNumberPreview = (documentNumberFormat || "{code}-{year}-{number}")
    .replace("{code}", "FAC")
    .replace("{year}", "2026")
    .replace("{number}", "000001");

  const {
    data: settings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenant-settings", tenantSlug],
    queryFn: getTenantSettings,
  });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        company_name: settings.company_name,
        tax_id: settings.tax_id,
        phone: settings.phone,
        address: settings.address,
        currency_code: settings.currency_code,
        timezone: settings.timezone,
        document_number_format: settings.document_number_format,
      });
    }
  }, [settings, reset]);

  const updateMutation = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-settings", tenantSlug],
      });

      reset({
        name: data.name,
        company_name: data.company_name,
        tax_id: data.tax_id,
        phone: data.phone,
        address: data.address,
        currency_code: data.currency_code,
        timezone: data.timezone,
        document_number_format: data.document_number_format,
      });

      setLogoFile(null);
    },
  });

  function onSubmit(values: UpdateTenantSettingsPayload) {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (logoFile) {
      formData.append("company_logo", logoFile);
    }

    updateMutation.mutate(formData);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Company Settings
        </h2>
        <p className="text-muted-foreground">
          Manage company information for this workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load company settings.
            </p>
          )}

          {!isLoading && !isError && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {settings?.company_logo && (
                <div className="mb-4">
                  <label className="text-sm font-medium">Current Logo</label>
                  <img
                    src={settings.company_logo}
                    alt="Company logo"
                    className="mt-2 h-24 rounded-xl border bg-white object-contain p-2"
                  />
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Workspace Name</label>
                  <Input {...register("name")} />
                </div>

                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input {...register("company_name")} />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Company Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setLogoFile(event.target.files?.[0] ?? null);
                    }}
                    className="mt-2 block w-full text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">NIT / Tax ID</label>
                  <Input {...register("tax_id")} />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input {...register("phone")} />
                </div>

                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <Input {...register("currency_code")} />
                </div>

                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <Input {...register("timezone")} />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input {...register("address")} />
                </div>

                <div>
                  <label className="text-sm font-medium">Document Number Format</label>
                  <Input
                    placeholder="{code}-{year}-{number}"
                    {...register("document_number_format")}
                  />
                  
                  <p className="mt-1 text-xs text-muted-foreground">
                    Available tokens: {"{code}"}, {"{year}"}, {"{number}"}. Example: FAC-2026-000001
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Available tokens: {"{code}"}, {"{year}"}, {"{number}"}.
                  </p>

                  <p className="mt-1 text-xs font-medium">
                    Preview: {documentNumberPreview}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>

              {updateMutation.isError && (
                <p className="text-sm text-red-600">
                  Could not save company settings.
                </p>
              )}

              {updateMutation.isSuccess && (
                <p className="text-sm text-emerald-600">
                  Company settings saved.
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
