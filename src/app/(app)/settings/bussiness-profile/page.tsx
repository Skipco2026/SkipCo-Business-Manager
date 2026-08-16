"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Loader2,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface BusinessProfile {
  id: string;
  legal_name: string | null;
  trading_name: string | null;
  registration_number: string | null;
  tax_number: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  alternative_phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  legal_name: "",
  trading_name: "",
  registration_number: "",
  tax_number: "",
  vat_registered: false,
  vat_number: "",
  email: "",
  phone: "",
  alternative_phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  province: "",
  postal_code: "",
  website: "",
  logo_url: "",
};

export default function BusinessProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] =
    useState<BusinessProfile | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  async function loadBusinessProfile() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("business_profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Business profile loading error:",
        error
      );

      setError(
        `Unable to load business profile: ${error.message}`
      );

      setLoading(false);
      return;
    }

    if (data) {
      const businessProfile =
        data as BusinessProfile;

      setProfile(businessProfile);

      setForm({
        legal_name:
          businessProfile.legal_name ?? "",

        trading_name:
          businessProfile.trading_name ?? "",

        registration_number:
          businessProfile.registration_number ?? "",

        tax_number:
          businessProfile.tax_number ?? "",

        vat_registered:
          businessProfile.vat_registered ?? false,

        vat_number:
          businessProfile.vat_number ?? "",

        email:
          businessProfile.email ?? "",

        phone:
          businessProfile.phone ?? "",

        alternative_phone:
          businessProfile.alternative_phone ?? "",

        address_line_1:
          businessProfile.address_line_1 ?? "",

        address_line_2:
          businessProfile.address_line_2 ?? "",

        city:
          businessProfile.city ?? "",

        province:
          businessProfile.province ?? "",

        postal_code:
          businessProfile.postal_code ?? "",

        website:
          businessProfile.website ?? "",

        logo_url:
          businessProfile.logo_url ?? "",
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

  async function saveProfile() {
    setError("");
    setSuccess("");

    if (!form.legal_name.trim()) {
      setError("Please enter the legal business name.");
      return;
    }

    if (!form.trading_name.trim()) {
      setError("Please enter the trading name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter the business email address.");
      return;
    }

    setSaving(true);

    const profileData = {
      legal_name:
        form.legal_name.trim() || null,

      trading_name:
        form.trading_name.trim() || null,

      registration_number:
        form.registration_number.trim() || null,

      tax_number:
        form.tax_number.trim() || null,

      vat_registered:
        form.vat_registered,

      vat_number:
        form.vat_registered &&
        form.vat_number.trim()
          ? form.vat_number.trim()
          : null,

      email:
        form.email.trim() || null,

      phone:
        form.phone.trim() || null,

      alternative_phone:
        form.alternative_phone.trim() || null,

      address_line_1:
        form.address_line_1.trim() || null,

      address_line_2:
        form.address_line_2.trim() || null,

      city:
        form.city.trim() || null,

      province:
        form.province.trim() || null,

      postal_code:
        form.postal_code.trim() || null,

      website:
        form.website.trim() || null,

      logo_url:
        form.logo_url.trim() || null,

      updated_at:
        new Date().toISOString(),
    };

    let result;

    if (profile?.id) {
      result = await supabase
        .from("business_profile")
        .update(profileData)
        .eq("id", profile.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("business_profile")
        .insert(profileData)
        .select()
        .single();
    }

    if (result.error) {
      console.error(
        "Business profile save error:",
        result.error
      );

      setError(
        `Unable to save business profile: ${result.error.message}`
      );

      setSaving(false);
      return;
    }

    setProfile(
      result.data as BusinessProfile
    );

    setSuccess(
      "Business profile saved successfully."
    );

    setSaving(false);

    await loadBusinessProfile();
  }

  return (
    <DashboardShell
      title="Business Profile"
      subtitle="Manage your business information and details"
    >
      <PageHeader
        title="Business Profile"
        description="Manage the business information used throughout SkipCo Business Manager."
        icon={Building2}
      />

      <div className="space-y-6">

        {/* BACK BUTTON */}

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
              Loading business profile...
            </span>
          </div>
        ) : (
          <>
            {/* BUSINESS INFORMATION */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Business Information
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  These details will be used across your
                  business documents and system.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  {/* LEGAL NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Legal Business Name *
                    </label>

                    <input
                      type="text"
                      value={form.legal_name}
                      onChange={(event) =>
                        updateField(
                          "legal_name",
                          event.target.value
                        )
                      }
                      placeholder="DDW Consolidate (Pty) Ltd"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* TRADING NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Trading Name *
                    </label>

                    <input
                      type="text"
                      value={form.trading_name}
                      onChange={(event) =>
                        updateField(
                          "trading_name",
                          event.target.value
                        )
                      }
                      placeholder="SkipCo Solutions"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* REGISTRATION */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Registration Number
                    </label>

                    <input
                      type="text"
                      value={form.registration_number}
                      onChange={(event) =>
                        updateField(
                          "registration_number",
                          event.target.value
                        )
                      }
                      placeholder="2026/XXXXXX/07"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* TAX NUMBER */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Tax Number
                    </label>

                    <input
                      type="text"
                      value={form.tax_number}
                      onChange={(event) =>
                        updateField(
                          "tax_number",
                          event.target.value
                        )
                      }
                      placeholder="SARS tax number"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* VAT */}

            <Card>
              <CardHeader>
                <CardTitle>VAT Configuration</CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure whether your business is VAT
                  registered.
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-5">

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        form.vat_registered
                      }
                      onChange={(event) =>
                        updateField(
                          "vat_registered",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Business is VAT registered
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Enable this when your business is
                        registered for VAT with SARS.
                      </p>
                    </div>

                  </label>

                  {form.vat_registered && (
                    <div className="max-w-md">
                      <label className="mb-2 block text-sm font-medium text-charcoal-700">
                        VAT Number
                      </label>

                      <input
                        type="text"
                        value={
                          form.vat_number
                        }
                        onChange={(event) =>
                          updateField(
                            "vat_number",
                            event.target.value
                          )
                        }
                        placeholder="VAT registration number"
                        className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                      />
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* CONTACT */}

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>

                <p className="text-sm text-charcoal-500">
                  Business contact details used on documents
                  and communications.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  {/* EMAIL */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Business Email *
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="info@skipco.co.za"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="051 XXX XXXX"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* ALTERNATIVE PHONE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Alternative Phone
                    </label>

                    <input
                      type="tel"
                      value={
                        form.alternative_phone
                      }
                      onChange={(event) =>
                        updateField(
                          "alternative_phone",
                          event.target.value
                        )
                      }
                      placeholder="Alternative contact number"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* WEBSITE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Website
                    </label>

                    <input
                      type="url"
                      value={form.website}
                      onChange={(event) =>
                        updateField(
                          "website",
                          event.target.value
                        )
                      }
                      placeholder="https://www.example.co.za"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* ADDRESS */}

            <Card>
              <CardHeader>
                <CardTitle>Business Address</CardTitle>

                <p className="text-sm text-charcoal-500">
                  Your registered or operating business
                  address.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  {/* ADDRESS LINE 1 */}

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Address Line 1
                    </label>

                    <input
                      type="text"
                      value={
                        form.address_line_1
                      }
                      onChange={(event) =>
                        updateField(
                          "address_line_1",
                          event.target.value
                        )
                      }
                      placeholder="Street address"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* ADDRESS LINE 2 */}

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Address Line 2
                    </label>

                    <input
                      type="text"
                      value={
                        form.address_line_2
                      }
                      onChange={(event) =>
                        updateField(
                          "address_line_2",
                          event.target.value
                        )
                      }
                      placeholder="Building, unit, complex, etc."
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* CITY */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      City
                    </label>

                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) =>
                        updateField(
                          "city",
                          event.target.value
                        )
                      }
                      placeholder="Bloemfontein"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  {/* PROVINCE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Province
                    </label>

                    <select
                      value={form.province}
                      onChange={(event) =>
                        updateField(
                          "province",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="">
                        Select province
                      </option>

                      <option value="Eastern Cape">
                        Eastern Cape
                      </option>

                      <option value="Free State">
                        Free State
                      </option>

                      <option value="Gauteng">
                        Gauteng
                      </option>

                      <option value="KwaZulu-Natal">
                        KwaZulu-Natal
                      </option>

                      <option value="Limpopo">
                        Limpopo
                      </option>

                      <option value="Mpumalanga">
                        Mpumalanga
                      </option>

                      <option value="Northern Cape">
                        Northern Cape
                      </option>

                      <option value="North West">
                        North West
                      </option>

                      <option value="Western Cape">
                        Western Cape
                      </option>
                    </select>
                  </div>

                  {/* POSTAL CODE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Postal Code
                    </label>

                    <input
                      type="text"
                      value={
                        form.postal_code
                      }
                      onChange={(event) =>
                        updateField(
                          "postal_code",
                          event.target.value
                        )
                      }
                      placeholder="9301"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* LOGO */}

            <Card>
              <CardHeader>
                <CardTitle>Business Logo</CardTitle>

                <p className="text-sm text-charcoal-500">
                  Add your logo URL for future use on
                  invoices, quotes and statements.
                </p>
              </CardHeader>

              <CardContent>
                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Logo URL
                  </label>

                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(event) =>
                      updateField(
                        "logo_url",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                  />

                  <p className="mt-2 text-xs text-charcoal-400">
                    We can add direct logo uploading through
                    Supabase Storage later.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SAVE */}

            <div className="flex justify-end border-t border-charcoal-100 pt-6">

              <button
                type="button"
                onClick={saveProfile}
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
                    Save Business Profile
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