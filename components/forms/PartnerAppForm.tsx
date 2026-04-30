"use client";

import { CheckCircle2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAccessCheckpoints } from "@/hooks/use-access-checkpoints";
import { usePartnerAppForm } from "@/hooks/use-partner-app-form";
import { partnerAppFormSchema, type PartnerAppFormValues } from "@/lib/schemas/partner-app";
import { zodFormResolver } from "@/lib/schemas/resolver";
import type { PartnerAppSummary } from "@/server/partnerApps";
import { createPartnerAppAction, updatePartnerAppAction, type PartnerAppActionState } from "@/app/(portal)/dashboard/actions";

function defaultValues(app?: PartnerAppSummary): PartnerAppFormValues {
  return {
    appId: app?.id,
    name: app?.name ?? "",
    publisherName: app?.publisherName ?? "",
    iconUrl: app?.iconUrl ?? "",
    logoUrl: app?.logoUrl ?? "",
    clientType: app?.clientType ?? "public",
    redirectUris: app?.redirectUris.join("\n") ?? "",
    allowedScopes: app?.allowedScopes.join("\n") ?? "clients:read_own\nproperties:read_own\noffline_access",
  };
}

export function PartnerAppForm({ app, mode = "create" }: { app?: PartnerAppSummary; mode?: "create" | "edit" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PartnerAppActionState>({ ok: false });
  const { initialScopes } = usePartnerAppForm(app);
  const checkpoints = useAccessCheckpoints(initialScopes);
  const form = useForm<PartnerAppFormValues>({
    resolver: zodFormResolver(partnerAppFormSchema),
    defaultValues: defaultValues(app),
  });
  const resolvedScopesValue = checkpoints.resolvedScopes.join("\n");

  useEffect(() => {
    form.setValue("allowedScopes", resolvedScopesValue, { shouldValidate: true });
  }, [form, resolvedScopesValue]);

  function submit(values: PartnerAppFormValues) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (Array.isArray(value)) {
        formData.set(key, value.join("\n"));
      } else if (value !== undefined) {
        formData.set(key, String(value));
      }
    }

    startTransition(async () => {
      const result = mode === "edit"
        ? await updatePartnerAppAction(formData)
        : await createPartnerAppAction({ ok: false }, formData);
      setState(result);
      if (result.ok && mode === "edit") {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground">{mode === "edit" ? "Application Settings" : "Application Details"}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Register redirect URIs and requested scopes before submitting for workspace authorization review.
        </p>
      </div>

      <input type="hidden" {...form.register("appId")} />
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="App name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Partner CRM" className="bg-background/50 border-border/50 focus-visible:ring-primary/50" />
        </Field>
        <Field label="Publisher" error={form.formState.errors.publisherName?.message}>
          <Input {...form.register("publisherName")} placeholder="Your company" className="bg-background/50 border-border/50 focus-visible:ring-primary/50" />
        </Field>
        <Field label="Icon URL" error={form.formState.errors.iconUrl?.message}>
          <Input {...form.register("iconUrl")} placeholder="https://..." className="bg-background/50 border-border/50 focus-visible:ring-primary/50" />
        </Field>
        <Field label="Logo URL" error={form.formState.errors.logoUrl?.message}>
          <Input {...form.register("logoUrl")} placeholder="https://..." className="bg-background/50 border-border/50 focus-visible:ring-primary/50" />
        </Field>
      </div>

      <Field label="App type" error={form.formState.errors.clientType?.message}>
        <Select {...form.register("clientType")} disabled={mode === "edit"} className="bg-background/50 border-border/50">
          <option value="public">Public PKCE app (Browser-based)</option>
          <option value="confidential">Confidential server app (Trusted servers)</option>
        </Select>
      </Field>

      <Field label="Redirect URIs (One per line)" error={form.formState.errors.redirectUris?.message as string | undefined}>
        <Textarea {...form.register("redirectUris")} placeholder="https://partner.example.com/oauth/callback" className="min-h-[100px] bg-background/50 border-border/50 focus-visible:ring-primary/50 font-mono text-sm" />
      </Field>

      <input type="hidden" {...form.register("allowedScopes")} />
      <section className="space-y-4 rounded-lg border border-border/60 bg-background/40 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Permissions and access checkpoints</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Choose the workspace permissions your app needs. Custom scopes are available for future platform capabilities.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {checkpoints.groups.map((group) => (
            <div key={group.id} className="rounded-md border border-border/60 bg-card/60 p-3">
              <div className="mb-3 flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{group.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{group.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {group.scopes.map((scope) => {
                  const checked = checkpoints.selectedScopes.includes(scope.value);
                  return (
                    <label
                      key={scope.value}
                      className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => checkpoints.toggleScope(scope.value)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>{scope.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <Field label="Advanced custom scopes" error={form.formState.errors.allowedScopes?.message as string | undefined}>
          <Textarea
            value={checkpoints.manualScopes}
            onChange={(event) => checkpoints.setManualScopes(event.target.value)}
            placeholder="custom:scope_name"
            className="min-h-[88px] bg-background/50 border-border/50 focus-visible:ring-primary/50 font-mono text-sm"
          />
        </Field>
      </section>

      {state.message ? (
        <Alert variant={state.ok ? "success" : "danger"} className="mt-6 bg-background/50 border-border/50">
          <p className="font-medium">{state.message}</p>
          {state.clientId && (
            <div className="mt-3 p-3 rounded-md bg-muted/30 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Client ID</p>
              <p className="break-all font-mono text-sm text-foreground">{state.clientId}</p>
            </div>
          )}
          {state.clientSecret && (
            <div className="mt-3 p-3 rounded-md bg-muted/30 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Client Secret</p>
              <p className="break-all font-mono text-sm text-foreground">{state.clientSecret}</p>
            </div>
          )}
        </Alert>
      ) : null}

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isPending} size="lg" className="h-11 w-full sm:w-auto min-w-[150px]">
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving..." : mode === "edit" ? "Save settings" : "Create app"}
        </Button>
      </div>
    </form>
  );
}
