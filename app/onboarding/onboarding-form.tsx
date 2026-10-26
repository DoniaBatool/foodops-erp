"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormError } from "@/components/app/form-error";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { applyFieldErrors } from "@/lib/apply-field-errors";
import { COUNTRIES, createOrganisationSchema, type CreateOrganisationInput } from "@/lib/validation/organisation";
import { createOrganisation } from "@/server/actions/organisation";

export function OnboardingForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CreateOrganisationInput>({
    resolver: zodResolver(createOrganisationSchema),
    defaultValues: { name: "", country: "GB", defaultVatRate: "0" },
  });
  const country = useWatch({ control: form.control, name: "country" });

  function onSubmit(values: CreateOrganisationInput) {
    setError(null);
    startTransition(async () => {
      const result = await createOrganisation(values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form.setError, result.fieldErrors);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormError message={error} />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Hillside Bakehouse Ltd" autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <NativeSelect className="w-full" {...field}>
                  {Object.entries(COUNTRIES).map(([code, c]) => (
                    <NativeSelectOption key={code} value={code}>
                      {c.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormControl>
              <FormDescription>
                Currency {COUNTRIES[country].currency}, time zone {COUNTRIES[country].timezone}.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultVatRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default VAT rate (%)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" className="tnum w-32" {...field} />
              </FormControl>
              <FormDescription>Used for new items. Each item can have its own rate; confirm with your accountant.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>
    </Form>
  );
}
