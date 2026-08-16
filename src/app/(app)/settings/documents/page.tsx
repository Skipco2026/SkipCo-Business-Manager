"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Save,
  Eye,
  LayoutTemplate,
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

interface DocumentSettings {
  id: string;
  default_terms: string | null;
  invoice_footer: string | null;
  quote_footer: string | null;
  statement_footer: string | null;
  document_layout: string;
  show_logo: boolean;
  show_business_details: boolean;
  show_document_number: boolean;
  show_dates: boolean;
  show_tax_information: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  default_terms: "",
  invoice_footer: "",
  quote_footer: "",
  statement_footer: "",
  document_layout: "standard",
  show_logo: true,
  show_business_details: true,
  show_document_number: true,
  show_dates: true,
  show_tax_information: true,
};

export default function DocumentsSettingsPage() {
  const supabase = createClient();

  const [settings, setSettings] =
    useState<DocumentSettings | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadDocumentSettings();
  }, []);

  async function loadDocumentSettings() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("document_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Document settings loading error:",
        error
      );

      setError(
        `Unable to load document settings: ${error.message}`
      );

      setLoading(false);
      return;
    }

    if (data) {
      const documentSettings =
        data as DocumentSettings;

      setSettings(documentSettings);

      setForm({
        default_terms:
          documentSettings.default_terms ?? "",

        invoice_footer:
          documentSettings.invoice_footer ?? "",

        quote_footer:
          documentSettings.quote_footer ?? "",

        statement_footer:
          documentSettings.statement_footer ?? "",

        document_layout:
          documentSettings.document_layout ??
          "standard",

        show_logo:
          documentSettings.show_logo ?? true,

        show_business_details:
          documentSettings.show_business_details ??
          true,

        show_document_number:
          documentSettings.show_document_number ??
          true,

        show_dates:
          documentSettings.show_dates ?? true,

        show_tax_information:
          documentSettings.show_tax_information ??
          true,
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

    const settingsData = {
      default_terms:
        form.default_terms.trim() || null,

      invoice_footer:
        form.invoice_footer.trim() || null,

      quote_footer:
        form.quote_footer.trim() || null,

      statement_footer:
        form.statement_footer.trim() || null,

      document_layout:
        form.document_layout,

      show_logo:
        form.show_logo,

      show_business_details:
        form.show_business_details,

      show_document_number:
        form.show_document_number,

      show_dates:
        form.show_dates,

      show_tax_information:
        form.show_tax_information,

      updated_at:
        new Date().toISOString(),
    };

    let result;

    if (settings?.id) {
      result = await supabase
        .from("document_settings")
        .update(settingsData)
        .eq("id", settings.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("document_settings")
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error(
        "Document settings save error:",
        result.error
      );

      setError(
        `Unable to save document settings: ${result.error.message}`
      );

      setSaving(false);
      return;
    }

    setSettings(
      result.data as DocumentSettings
    );

    setSuccess(
      "Document settings saved successfully."
    );

    setSaving(false);

    await loadDocumentSettings();
  }

  return (
    <DashboardShell
      title="Document Settings"
      subtitle="Configure how your business documents appear"
    >
      <PageHeader
        title="Document Settings"
        description="Manage document terms, footers, appearance and information displayed on invoices, quotes and statements."
        icon={FileText}
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
              Loading document settings...
            </span>
          </div>
        ) : (
          <>
            {/* DEFAULT TERMS */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Default Terms & Conditions
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  These terms can automatically appear on
                  your business documents.
                </p>
              </CardHeader>

              <CardContent>
                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Terms & Conditions
                  </label>

                  <textarea
                    rows={8}
                    value={form.default_terms}
                    onChange={(event) =>
                      updateField(
                        "default_terms",
                        event.target.value
                      )
                    }
                    placeholder="Enter your standard terms and conditions..."
                    className="w-full resize-y rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                  />

                  <p className="mt-2 text-xs text-charcoal-400">
                    These terms can be used across invoices,
                    quotes and statements.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* DOCUMENT FOOTERS */}

            <Card>
              <CardHeader>
                <CardTitle>
                  Document Footers
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure the information displayed at the
                  bottom of each document.
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-5">

                  {/* INVOICE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Invoice Footer
                    </label>

                    <textarea
                      rows={3}
                      value={form.invoice_footer}
                      onChange={(event) =>
                        updateField(
                          "invoice_footer",
                          event.target.value
                        )
                      }
                      placeholder="Thank you for your business."
                      className="w-full resize-y rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* QUOTE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Quote Footer
                    </label>

                    <textarea
                      rows={3}
                      value={form.quote_footer}
                      onChange={(event) =>
                        updateField(
                          "quote_footer",
                          event.target.value
                        )
                      }
                      placeholder="Thank you for considering our quotation."
                      className="w-full resize-y rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* STATEMENT */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Statement Footer
                    </label>

                    <textarea
                      rows={3}
                      value={form.statement_footer}
                      onChange={(event) =>
                        updateField(
                          "statement_footer",
                          event.target.value
                        )
                      }
                      placeholder="Please contact us if you have any questions regarding your statement."
                      className="w-full resize-y rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* DOCUMENT APPEARANCE */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                  Document Appearance
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Choose the default layout used for business
                  documents.
                </p>
              </CardHeader>

              <CardContent>
                <div className="max-w-md">

                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Document Layout
                  </label>

                  <select
                    value={form.document_layout}
                    onChange={(event) =>
                      updateField(
                        "document_layout",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                  >
                    <option value="standard">
                      Standard
                    </option>

                    <option value="compact">
                      Compact
                    </option>

                    <option value="modern">
                      Modern
                    </option>
                  </select>

                  <p className="mt-2 text-xs text-charcoal-400">
                    This setting controls the default document
                    layout. We can expand the available
                    templates later.
                  </p>

                </div>
              </CardContent>
            </Card>

            {/* DISPLAY OPTIONS */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Document Display Options
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Choose which information should appear on
                  your documents.
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-5">

                  {/* LOGO */}

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={form.show_logo}
                      onChange={(event) =>
                        updateField(
                          "show_logo",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Show business logo
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Display your business logo on documents.
                      </p>
                    </div>

                  </label>

                  {/* BUSINESS DETAILS */}

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        form.show_business_details
                      }
                      onChange={(event) =>
                        updateField(
                          "show_business_details",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Show business details
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Display your business name, address and
                        contact information.
                      </p>
                    </div>

                  </label>

                  {/* DOCUMENT NUMBER */}

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        form.show_document_number
                      }
                      onChange={(event) =>
                        updateField(
                          "show_document_number",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Show document number
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Display the invoice, quote or statement
                        number.
                      </p>
                    </div>

                  </label>

                  {/* DATES */}

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={form.show_dates}
                      onChange={(event) =>
                        updateField(
                          "show_dates",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Show document dates
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Display issue dates and other relevant
                        document dates.
                      </p>
                    </div>

                  </label>

                  {/* TAX */}

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        form.show_tax_information
                      }
                      onChange={(event) =>
                        updateField(
                          "show_tax_information",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Show tax information
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Display VAT or tax information when
                        applicable.
                      </p>
                    </div>

                  </label>

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
                    Save Document Settings
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