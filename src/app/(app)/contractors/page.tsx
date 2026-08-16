"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";

interface Contractor {
  id: string;
  contractor_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contractor_type: string | null;
  registration_number: string | null;
  payment_terms: string | null;
  status: "Active" | "Inactive";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  contractor_name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  contractor_type: "",
  registration_number: "",
  payment_terms: "",
  status: "Active" as "Active" | "Inactive",
  notes: "",
};

export default function ContractorsPage() {
  const supabase = createClient();

  const [contractors, setContractors] = useState<
    Contractor[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingContractor, setEditingContractor] =
    useState<Contractor | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | "Active" | "Inactive">("All");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadContractors();
  }, []);

  async function loadContractors() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .order("contractor_name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setContractors(
        (data ?? []) as Contractor[]
      );
    } catch (err) {
      console.error(
        "Contractors loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load contractors."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddForm() {
    setEditingContractor(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    contractor: Contractor
  ) {
    setEditingContractor(contractor);

    setForm({
      contractor_name:
        contractor.contractor_name ?? "",
      contact_person:
        contractor.contact_person ?? "",
      phone: contractor.phone ?? "",
      email: contractor.email ?? "",
      address: contractor.address ?? "",
      contractor_type:
        contractor.contractor_type ?? "",
      registration_number:
        contractor.registration_number ?? "",
      payment_terms:
        contractor.payment_terms ?? "",
      status:
        contractor.status ?? "Active",
      notes: contractor.notes ?? "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingContractor(null);
    setForm(emptyForm);
  }

  async function saveContractor() {
    setError("");
    setSuccess("");

    if (!form.contractor_name.trim()) {
      setError(
        "Please enter the contractor name."
      );
      return;
    }

    setSaving(true);

    const contractorData = {
      contractor_name:
        form.contractor_name.trim(),

      contact_person:
        form.contact_person.trim() || null,

      phone:
        form.phone.trim() || null,

      email:
        form.email.trim() || null,

      address:
        form.address.trim() || null,

      contractor_type:
        form.contractor_type.trim() || null,

      registration_number:
        form.registration_number.trim() ||
        null,

      payment_terms:
        form.payment_terms.trim() || null,

      status: form.status,

      notes:
        form.notes.trim() || null,
    };

    try {
      if (editingContractor) {
        const { error } = await supabase
          .from("contractors")
          .update(contractorData)
          .eq("id", editingContractor.id);

        if (error) {
          throw error;
        }

        setSuccess(
          "Contractor updated successfully."
        );
      } else {
        const { error } = await supabase
          .from("contractors")
          .insert(contractorData);

        if (error) {
          throw error;
        }

        setSuccess(
          "Contractor added successfully."
        );
      }

      setShowForm(false);
      setEditingContractor(null);
      setForm(emptyForm);

      await loadContractors();
    } catch (err) {
      console.error(
        "Contractor save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save contractor."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteContractor(
    contractor: Contractor
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${contractor.contractor_name}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("contractors")
      .delete()
      .eq("id", contractor.id);

    if (error) {
      console.error(
        "Contractor delete error:",
        error
      );

      setError(
        `Unable to delete contractor: ${error.message}`
      );

      return;
    }

    setSuccess(
      `${contractor.contractor_name} deleted successfully.`
    );

    await loadContractors();
  }

  const filteredContractors = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return contractors.filter(
      (contractor) => {
        const matchesSearch =
          !search ||
          contractor.contractor_name
            .toLowerCase()
            .includes(search) ||
          contractor.contact_person
            ?.toLowerCase()
            .includes(search) ||
          contractor.phone
            ?.toLowerCase()
            .includes(search) ||
          contractor.email
            ?.toLowerCase()
            .includes(search) ||
          contractor.contractor_type
            ?.toLowerCase()
            .includes(search) ||
          contractor.registration_number
            ?.toLowerCase()
            .includes(search);

        const matchesStatus =
          statusFilter === "All" ||
          contractor.status === statusFilter;

        return (
          matchesSearch && matchesStatus
        );
      }
    );
  }, [
    contractors,
    searchTerm,
    statusFilter,
  ]);

  const totalContractors =
    contractors.length;

  const activeContractors =
    contractors.filter(
      (contractor) =>
        contractor.status === "Active"
    ).length;

  const inactiveContractors =
    contractors.filter(
      (contractor) =>
        contractor.status === "Inactive"
    ).length;

  return (
    <DashboardShell
      title="Contractors"
      subtitle="Manage contractors and external service providers"
    >
      <PageHeader
        title="Contractors"
        description="Manage contractors that can be assigned to jobs."
        icon={BriefcaseBusiness}
        action={{
          label: "Add Contractor",
          href: "#",
        }}
      />

      <div className="space-y-6">

        {/* ALERTS */}

        {success && (
          <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Total Contractors
            </p>

            <p className="mt-2 text-2xl font-bold text-charcoal-900">
              {totalContractors}
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Active
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {activeContractors}
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Inactive
            </p>

            <p className="mt-2 text-2xl font-bold text-charcoal-500">
              {inactiveContractors}
            </p>
          </div>

        </div>

        {/* CONTROLS */}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="relative w-full md:max-w-md">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search contractors..."
              className="w-full rounded-lg border border-charcoal-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
            />

          </div>

          <div className="flex gap-2">

            {(
              [
                "All",
                "Active",
                "Inactive",
              ] as const
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(status)
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-[#20AEB8] text-white"
                    : "border border-charcoal-200 bg-white text-charcoal-600 hover:bg-charcoal-50"
                }`}
              >
                {status}
              </button>
            ))}

          </div>

        </div>

        {/* ADD BUTTON */}

        {!showForm && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal-800"
            >
              <Plus className="h-4 w-4" />
              Add Contractor
            </button>
          </div>
        )}

        {/* FORM */}

        {showForm && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  {editingContractor
                    ? "Edit Contractor"
                    : "Add Contractor"}
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Enter the contractor information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-50 hover:text-charcoal-900"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-8">

              {/* BUSINESS DETAILS */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Contractor Details
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Contractor / Company Name *
                    </label>

                    <input
                      value={
                        form.contractor_name
                      }
                      onChange={(event) =>
                        updateField(
                          "contractor_name",
                          event.target.value
                        )
                      }
                      placeholder="Company or contractor name"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Contractor Type
                    </label>

                    <input
                      value={
                        form.contractor_type
                      }
                      onChange={(event) =>
                        updateField(
                          "contractor_type",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Transport, Waste Removal"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Registration / Reference Number
                    </label>

                    <input
                      value={
                        form.registration_number
                      }
                      onChange={(event) =>
                        updateField(
                          "registration_number",
                          event.target.value
                        )
                      }
                      placeholder="Registration or reference number"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Status
                    </label>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>

                </div>

              </section>

              {/* CONTACT */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Contact Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Contact Person
                    </label>

                    <input
                      value={
                        form.contact_person
                      }
                      onChange={(event) =>
                        updateField(
                          "contact_person",
                          event.target.value
                        )
                      }
                      placeholder="Contact person"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Phone
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
                      placeholder="e.g. 082 123 4567"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Email
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
                      placeholder="contractor@example.com"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Address
                    </label>

                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(event) =>
                        updateField(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="Contractor address"
                      className="w-full resize-none rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>

              </section>

              {/* PAYMENT */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Payment Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Payment Terms
                    </label>

                    <input
                      value={
                        form.payment_terms
                      }
                      onChange={(event) =>
                        updateField(
                          "payment_terms",
                          event.target.value
                        )
                      }
                      placeholder="e.g. 30 days"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>

              </section>

              {/* NOTES */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Notes
                </h3>

                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value
                    )
                  }
                  placeholder="Additional contractor notes..."
                  className="w-full resize-none rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />

              </section>

            </div>

            {/* ACTIONS */}

            <div className="mt-8 flex justify-end gap-3 border-t border-charcoal-100 pt-6">

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-charcoal-200 px-5 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveContractor}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {editingContractor
                      ? "Update Contractor"
                      : "Save Contractor"}
                  </>
                )}
              </button>

            </div>

          </div>
        )}

        {/* CONTRACTOR LIST */}

        <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

          <div className="border-b border-charcoal-100 p-6">

            <h2 className="text-lg font-semibold text-charcoal-900">
              Contractor List
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Contractors registered in SkipCo Business Manager.
            </p>

          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

              <span className="ml-3 text-sm text-charcoal-500">
                Loading contractors...
              </span>
            </div>
          ) : filteredContractors.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal-50">
                <BriefcaseBusiness className="h-6 w-6 text-charcoal-400" />
              </div>

              <h3 className="text-base font-semibold text-charcoal-900">
                {contractors.length === 0
                  ? "No contractors yet"
                  : "No matching contractors"}
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500">
                {contractors.length === 0
                  ? "Add your first contractor to start managing external service providers."
                  : "Try changing your search or status filter."}
              </p>

              {contractors.length === 0 && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Contractor
                </button>
              )}

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left">

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Contractor
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Contact
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Type
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Phone
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100">

                  {filteredContractors.map(
                    (contractor) => (
                      <tr
                        key={contractor.id}
                        className="transition hover:bg-charcoal-50/50"
                      >

                        <td className="px-6 py-4">

                          <div className="text-sm font-semibold text-charcoal-900">
                            {contractor.contractor_name}
                          </div>

                          {contractor.registration_number && (
                            <div className="mt-1 text-xs text-charcoal-500">
                              Ref:{" "}
                              {
                                contractor.registration_number
                              }
                            </div>
                          )}

                        </td>

                        <td className="px-6 py-4 text-sm text-charcoal-700">
                          {contractor.contact_person ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-charcoal-600">
                          {contractor.contractor_type ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-charcoal-600">
                          {contractor.phone ||
                            "—"}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                              contractor.status ===
                              "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-charcoal-100 text-charcoal-600"
                            }`}
                          >
                            {contractor.status ===
                              "Active" && (
                              <Check className="h-3.5 w-3.5" />
                            )}

                            {contractor.status}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-1">

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  contractor
                                )
                              }
                              className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-900"
                              title="Edit contractor"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteContractor(
                                  contractor
                                )
                              }
                              className="rounded-lg p-2 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete contractor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </DashboardShell>
  );
}