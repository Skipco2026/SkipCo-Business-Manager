"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Save,
  Wallet,
  FileText,
  Receipt,
  Percent,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface FinancialSettings {
  id: string;
  currency: string | null;
  currency_symbol: string | null;
  invoice_prefix: string | null;
  invoice_start_number: number | null;
  quote_prefix: string | null;
  quote_start_number: number | null;
  payment_terms_days: number | null;
  default_invoice_notes: string | null;
  default_quote_notes: string | null;
  tax_enabled: boolean;
  tax_rate: number | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  currency: "ZAR",
  currency_symbol: "R",
  invoice_prefix: "INV-",
  invoice_start_number: "1001",
  quote_prefix: "QUO-",
  quote_start_number: "1001",
  payment_terms_days: "30",
  default_invoice_notes: "",
  default_quote_notes: "",
  tax_enabled: false,
  tax_rate: "15",
};

export default function FinancialSettingsPage() {
  const supabase = createClient();

  const [settings, setSettings] =
    useState<FinancialSettings | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadFinancialSettings();
  }, []);

  async function loadFinancialSettings() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("financial_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Financial settings loading error:",
        error
      );

      setError(
        `Unable to load financial settings: ${error.message}`
      );

      setLoading(false);
      return;
    }

    if (data) {
      const financialSettings =
        data as FinancialSettings;

      setSettings(financialSettings);

      setForm({
        currency:
          financialSettings.currency ?? "ZAR",

        currency_symbol:
          financialSettings.currency_symbol ?? "R",

        invoice_prefix:
          financialSettings.invoice_prefix ?? "INV-",

        invoice_start_number:
          String(
            financialSettings.invoice_start_number ?? 1001
          ),

        quote_prefix:
          financialSettings.quote_prefix ?? "QUO-",

        quote_start_number:
          String(
            financialSettings.quote_start_number ?? 1001
          ),

        payment_terms_days:
          String(
            financialSettings.payment_terms_days ?? 30
          ),

        default_invoice_notes:
          financialSettings.default_invoice_notes ?? "",

        default_quote_notes:
          financialSettings.default_quote_notes ?? "",

        tax_enabled:
          financialSettings.tax_enabled ?? false,

        tax_rate:
          String(
            financialSettings.tax_rate ?? 15
          ),
      });
    }

    setLoading(false);
  }

  function updateField(
    field: keyof typeof emptyForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveSettings() {
    setError("");
    setSuccess("");

    setSaving(true);

    const invoiceStartNumber =
      Number(form.invoice_start_number);

    const quoteStartNumber =
      Number(form.quote_start_number);

    const paymentTermsDays =
      Number(form.payment_terms_days);

    const taxRate =
      Number(form.tax_rate);

    if (
      !Number.isFinite(invoiceStartNumber) ||
      invoiceStartNumber < 1
    ) {
      setError(
        "Please enter a valid invoice starting number."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(quoteStartNumber) ||
      quoteStartNumber < 1
    ) {
      setError(
        "Please enter a valid quote starting number."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(paymentTermsDays) ||
      paymentTermsDays < 0
    ) {
      setError(
        "Please enter valid payment terms."
      );
      setSaving(false);
      return;
    }

    if (
      form.tax_enabled &&
      (!Number.isFinite(taxRate) ||
        taxRate < 0 ||
        taxRate > 100)
    ) {
      setError(
        "Please enter a valid tax rate between 0 and 100."
      );
      setSaving(false);
      return;
    }

    const settingsData = {
      currency:
        form.currency.trim() || "ZAR",

      currency_symbol:
        form.currency_symbol.trim() || "R",

      invoice_prefix:
        form.invoice_prefix.trim() || "INV-",

      invoice_start_number:
        invoiceStartNumber,

      quote_prefix:
        form.quote_prefix.trim() || "QUO-",

      quote_start_number:
        quoteStartNumber,

      payment_terms_days:
        paymentTermsDays,

      default_invoice_notes:
        form.default_invoice_notes.trim() || null,

      default_quote_notes:
        form.default_quote_notes.trim() || null,

      tax_enabled:
        form.tax_enabled,

      tax_rate:
        form.tax_enabled ? taxRate : null,

      updated_at:
        new Date().toISOString(),
    };

    let result;

    if (settings?.id) {
      result = await supabase
        .from("financial_settings")
        .update(settingsData)
        .eq("id", settings.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("financial_settings")
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error(
        "Financial settings save error:",
        result.error
      );

      setError(
        `Unable to save financial settings: ${result.error.message}`
      );

      setSaving(false);
      return;
    }

    setSettings(
      result.data as FinancialSettings
    );

    setSuccess(
      "Financial settings saved successfully."
    );

    setSaving(false);

    await loadFinancialSettings();
  }

  return (
    <DashboardShell
      title="Financial Settings"
      subtitle="Configure your financial and document preferences"
    >
      <PageHeader
        title="Financial Settings"
        description="Manage currency, numbering, payment terms and tax settings used throughout SkipCo Business Manager."
        icon={Wallet}
      />

      <div className="space-y-6">

        {/* BACK */}

        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-500 transition hover:text-charcoal-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </div>

        {/* SUCCESS */}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-20 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading financial settings...
            </span>
          </div>
        ) : (
          <>
            {/* CURRENCY */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Currency
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Select the currency used throughout your
                  business documents.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Currency
                    </label>

                    <select
                      value={form.currency}
                      onChange={(event) =>
                        updateField(
                          "currency",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="ZAR">
                        South African Rand (ZAR)
                      </option>

                      <option value="USD">
                        US Dollar (USD)
                      </option>

                      <option value="EUR">
                        Euro (EUR)
                      </option>

                      <option value="GBP">
                        British Pound (GBP)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Currency Symbol
                    </label>

                    <input
                      type="text"
                      value={form.currency_symbol}
                      onChange={(event) =>
                        updateField(
                          "currency_symbol",
                          event.target.value
                        )
                      }
                      placeholder="R"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* INVOICE NUMBERING */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Invoice Numbering
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure how new invoices are numbered.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Invoice Prefix
                    </label>

                    <input
                      type="text"
                      value={form.invoice_prefix}
                      onChange={(event) =>
                        updateField(
                          "invoice_prefix",
                          event.target.value
                        )
                      }
                      placeholder="INV-"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />

                    <p className="mt-2 text-xs text-charcoal-400">
                      Example: INV-1001
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Starting Number
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={form.invoice_start_number}
                      onChange={(event) =>
                        updateField(
                          "invoice_start_number",
                          event.target.value
                        )
                      }
                      placeholder="1001"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* QUOTE NUMBERING */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Quote Numbering
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure how new quotes are numbered.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Quote Prefix
                    </label>

                    <input
                      type="text"
                      value={form.quote_prefix}
                      onChange={(event) =>
                        updateField(
                          "quote_prefix",
                          event.target.value
                        )
                      }
                      placeholder="QUO-"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />

                    <p className="mt-2 text-xs text-charcoal-400">
                      Example: QUO-1001
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Starting Number
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={form.quote_start_number}
                      onChange={(event) =>
                        updateField(
                          "quote_start_number",
                          event.target.value
                        )
                      }
                      placeholder="1001"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* PAYMENT TERMS */}

            <Card>
              <CardHeader>
                <CardTitle>Payment Terms</CardTitle>

                <p className="text-sm text-charcoal-500">
                  Set the default payment period for invoices.
                </p>
              </CardHeader>

              <CardContent>
                <div className="max-w-md">
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Payment Terms
                  </label>

                  <select
                    value={form.payment_terms_days}
                    onChange={(event) =>
                      updateField(
                        "payment_terms_days",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                  >
                    <option value="0">
                      Due immediately
                    </option>

                    <option value="7">
                      7 days
                    </option>

                    <option value="14">
                      14 days
                    </option>

                    <option value="30">
                      30 days
                    </option>

                    <option value="60">
                      60 days
                    </option>

                    <option value="90">
                      90 days
                    </option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* DEFAULT NOTES */}

            <Card>
              <CardHeader>
                <CardTitle>Default Document Notes</CardTitle>

                <p className="text-sm text-charcoal-500">
                  These notes can automatically appear on new
                  invoices and quotes.
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Default Invoice Notes
                    </label>

                    <textarea
                      rows={4}
                      value={
                        form.default_invoice_notes
                      }
                      onChange={(event) =>
                        updateField(
                          "default_invoice_notes",
                          event.target.value
                        )
                      }
                      placeholder="Thank you for your business."
                      className="w-full resize-y rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Default Quote Notes
                    </label>

                    <textarea
                      rows={4}
                      value={
                        form.default_quote_notes
                      }
                      onChange={(event) =>
                        updateField(
                          "default_quote_notes",
                          event.target.value
                        )
                      }
                      placeholder="Please note that this quotation is valid for 30 days."
                      className="w-full resize-y rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* TAX */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  Tax Settings
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure whether tax is applied to your
                  documents.
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-5">

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={form.tax_enabled}
                      onChange={(event) =>
                        updateField(
                          "tax_enabled",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Enable tax
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Enable this when tax should be calculated
                        on invoices and quotes.
                      </p>
                    </div>

                  </label>

                  {form.tax_enabled && (
                    <div className="max-w-md">
                      <label className="mb-2 block text-sm font-medium text-charcoal-700">
                        Tax Rate (%)
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.tax_rate}
                        onChange={(event) =>
                          updateField(
                            "tax_rate",
                            event.target.value
                          )
                        }
                        placeholder="15"
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                      />

                      <p className="mt-2 text-xs text-charcoal-400">
                        South African VAT is currently 15%.
                      </p>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* SAVE */}

            <div className="flex justify-end border-t border-charcoal-100 pt-6">

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Financial Settings
                  </>
                )}
              </button>

            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}