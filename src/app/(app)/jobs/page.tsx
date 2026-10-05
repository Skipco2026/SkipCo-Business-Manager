"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  FileCheck2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import MasterOptionTable from "@/components/disposal/MasterOptionTable";
import { createClient } from "@/lib/supabase/client";

interface Customer {
  id: string;
  company_name: string | null;
  trading_name: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface Contractor {
  id: string;
  contractor_name: string;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  total: number;
}

interface Job {
  id: string;
  job_number: string;
  customer_id: string | null;
  contractor_id: string | null;
  job_date: string | null;
  job_type: string | null;
  description: string | null;
  collection_address: string | null;
  delivery_address: string | null;
  assigned_employee_id: string | null;
  status: string;
  completed: boolean;
  completed_at: string | null;
  invoice_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DisposalCertificate {
  id: string;
  job_id: string;
  reference_number: string;
  order_number: string | null;
  collection_status: string | null;
  collected_by: string | null;
  collection_date: string | null;
  collection_location: string | null;
  collection_sites: Array<{ value: string }> | null;
  waste_types: Array<{ value: string }> | null;
  packagings: Array<{ value: string }> | null;
  client_name: string | null;
  client_signature: string | null;
  client_signed_at: string | null;
  waste_type: string | null;
  quantity_volume: string | null;
  packaging: string | null;
  condition_at_receipt: string | null;
  disposal_method: string | null;
  disposal_facility_name: string | null;
  disposal_facility_address: string | null;
  disposal_date: string | null;
  disposal_facilities: Array<{ name: string; address: string }> | null;
  disposal_methods: Array<{ value: string }> | null;
  facility_representative: string | null;
  facility_signature: string | null;
  facility_signed_at: string | null;
  certificate_status: string | null;
}

interface JobForm {
  customer_id: string;
  job_date: string;
  order_number: string;
  contractor_id: string;
  job_type: string;
  description: string;
  collection_address: string;
  delivery_address: string;
  assigned_employee_id: string;
  status: string;
  invoice_id: string;
  notes: string;
  quantity_volume: string;
  disposal_date: string;
}

const EMPTY_FORM: JobForm = {
  customer_id: "",
  job_date: new Date().toISOString().slice(0, 10),
  order_number: "",
  contractor_id: "",
  job_type: "",
  description: "",
  collection_address: "",
  delivery_address: "",
  assigned_employee_id: "",
  status: "Pending",
  invoice_id: "",
  notes: "",
  quantity_volume: "",
  disposal_date: new Date().toISOString().slice(0, 10),
};

function getCustomerName(customer?: Customer) {
  if (!customer) return "Unknown client";
  return customer.trading_name || customer.company_name || "Unnamed client";
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClasses(status: string) {
  const value = status.toLowerCase();

  if (
    value.includes("complete") ||
    value.includes("signed") ||
    value === "completed"
  ) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }

  if (
    value.includes("progress") ||
    value.includes("collect") ||
    value.includes("pending")
  ) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }

  if (value.includes("cancel")) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default function JobsPage() {
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [certificates, setCertificates] = useState<DisposalCertificate[]>([]);

  const [collectionSites, setCollectionSites] = useState<string[]>([]);
  const [wasteTypes, setWasteTypes] = useState<string[]>([]);
  const [packagings, setPackagings] = useState<string[]>([]);
  const [facilityNames, setFacilityNames] = useState<string[]>([]);
  const [disposalMethods, setDisposalMethods] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const [form, setForm] = useState<JobForm>(EMPTY_FORM);

  const certificateMap = useMemo(() => {
    const map = new Map<string, DisposalCertificate>();

    for (const certificate of certificates) {
      map.set(certificate.job_id, certificate);
    }

    return map;
  }, [certificates]);

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();

    for (const customer of customers) {
      map.set(customer.id, customer);
    }

    return map;
  }, [customers]);

  async function loadPageData() {
    setLoading(true);
    setError("");

    const [
      jobsResult,
      customersResult,
      employeesResult,
      contractorsResult,
      invoicesResult,
      certificatesResult,
    ] = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("customers")
        .select("id, company_name, trading_name")
        .order("company_name"),

      supabase
        .from("employees")
        .select("id, first_name, last_name, employee_number")
        .order("first_name"),

      supabase
        .from("contractors")
        .select("id, contractor_name, status")
        .eq("status", "Active")
        .order("contractor_name"),

      supabase
        .from("invoices")
        .select("id, invoice_number, customer_id, total")
        .order("created_at", { ascending: false }),

      supabase
        .from("disposal_certificates")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (jobsResult.error) {
      setError(`Unable to load jobs: ${jobsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (customersResult.error) {
      setError(`Unable to load customers: ${customersResult.error.message}`);
      setLoading(false);
      return;
    }

    if (employeesResult.error) {
      setError(`Unable to load employees: ${employeesResult.error.message}`);
      setLoading(false);
      return;
    }

    if (contractorsResult.error) {
      setError(`Unable to load contractors: ${contractorsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (invoicesResult.error) {
      setError(`Unable to load invoices: ${invoicesResult.error.message}`);
      setLoading(false);
      return;
    }

    if (certificatesResult.error) {
      setError(
        `Unable to load disposal certificates: ${certificatesResult.error.message}`,
      );
      setLoading(false);
      return;
    }

    setJobs((jobsResult.data ?? []) as Job[]);
    setCustomers((customersResult.data ?? []) as Customer[]);
    setEmployees((employeesResult.data ?? []) as Employee[]);
    setContractors((contractorsResult.data ?? []) as Contractor[]);
    setInvoices((invoicesResult.data ?? []) as Invoice[]);
    setCertificates((certificatesResult.data ?? []) as DisposalCertificate[]);

    setLoading(false);
  }

  useEffect(() => {
    void loadPageData();
  }, []);

  async function generateUniqueJobNumber() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const number = Math.floor(100000 + Math.random() * 900000);
      const candidate = `JOB-${number}`;

      const { data, error: checkError } = await supabase
        .from("jobs")
        .select("id")
        .eq("job_number", candidate)
        .limit(1);

      if (checkError) {
        throw new Error(
          `Unable to check job number: ${checkError.message}`,
        );
      }

      if (!data || data.length === 0) {
        return candidate;
      }
    }

    throw new Error(
      "Unable to generate a unique job number. Please try again.",
    );
  }

  async function generateUniqueCertificateNumber(jobNumber: string) {
    const digits = jobNumber
      .replace(/^JOB-/i, "")
      .replace(/\D/g, "");

    const base = digits ? `DC-JOB${digits}` : "DC-JOB";

    for (let suffix = 1; suffix <= 100; suffix++) {
      const candidate =
        suffix === 1 ? base : `${base}-${suffix}`;

      const { data, error: checkError } = await supabase
        .from("disposal_certificates")
        .select("id")
        .eq("reference_number", candidate)
        .limit(1);

      if (checkError) {
        throw new Error(
          `Unable to check certificate reference: ${checkError.message}`,
        );
      }

      if (!data || data.length === 0) {
        return candidate;
      }
    }

    throw new Error(
      "Unable to generate a unique Certificate of Disposal reference.",
    );
  }

  function resetForm() {
    setForm({
      ...EMPTY_FORM,
      job_date: new Date().toISOString().slice(0, 10),
      disposal_date: new Date().toISOString().slice(0, 10),
    });

    setCollectionSites([]);
    setWasteTypes([]);
    setPackagings([]);
    setFacilityNames([]);
    setDisposalMethods([]);
  }

  function openNewJob() {
    setError("");
    setSuccess("");
    setEditingJobId(null);
    resetForm();
    setShowForm(true);
  }

  function openEditForm(job: Job) {
    setError("");
    setSuccess("");
    setEditingJobId(job.id);

    const certificate = certificateMap.get(job.id);

    setForm({
      customer_id: job.customer_id ?? "",
      job_date: job.job_date ?? "",
      order_number: certificate?.order_number ?? "",
      contractor_id: job.contractor_id ?? "",
      job_type: job.job_type ?? "",
      description: job.description ?? "",
      collection_address: job.collection_address ?? "",
      delivery_address: job.delivery_address ?? "",
      assigned_employee_id: job.assigned_employee_id ?? "",
      status: job.status ?? "Pending",
      invoice_id: job.invoice_id ?? "",
      notes: job.notes ?? "",
      quantity_volume: certificate?.quantity_volume ?? "",
      disposal_date:
        certificate?.disposal_date ??
        job.job_date ??
        new Date().toISOString().slice(0, 10),
    });

    setCollectionSites(
      certificate?.collection_sites?.map((item) => item.value) ?? [],
    );

    setWasteTypes(
      certificate?.waste_types?.map((item) => item.value) ?? [],
    );

    setPackagings(
      certificate?.packagings?.map((item) => item.value) ?? [],
    );

    setFacilityNames(
      certificate?.disposal_facilities?.map((item) => item.name) ??
        (certificate?.disposal_facility_name
          ? [certificate.disposal_facility_name]
          : []),
    );

    setDisposalMethods(
      certificate?.disposal_methods?.map((item) => item.value) ??
        (certificate?.disposal_method
          ? [certificate.disposal_method]
          : []),
    );

    setShowForm(true);
  }

  function validateForm() {
    if (!form.customer_id) {
      return "Please select a client.";
    }

    if (!form.job_date) {
      return "Please select a job date.";
    }

    if (!form.order_number.trim()) {
      return "Please enter the client's Order No.";
    }

    if (collectionSites.length === 0) {
      return "Please select at least one Site.";
    }

    if (wasteTypes.length === 0) {
      return "Please select at least one Waste Type.";
    }

    if (packagings.length === 0) {
      return "Please select at least one Packaging type.";
    }

    if (!form.quantity_volume.trim()) {
      return "Please enter the Quantity / Volume.";
    }

    if (facilityNames.length === 0) {
      return "Please select at least one Disposal Facility.";
    }

    if (disposalMethods.length === 0) {
      return "Please select at least one Disposal Method.";
    }

    if (!form.disposal_date) {
      return "Please select the Disposal Date.";
    }

    if (
      form.assigned_employee_id &&
      form.contractor_id
    ) {
      return "Please select either an employee or a contractor, not both.";
    }

    return "";
  }

  async function saveJob() {
    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      if (!editingJobId) {
        const jobNumber = await generateUniqueJobNumber();
        const certificateReference =
          await generateUniqueCertificateNumber(jobNumber);

        const { data: newJob, error: jobError } = await supabase
          .from("jobs")
          .insert({
            job_number: jobNumber,
            customer_id: form.customer_id || null,
            contractor_id: form.contractor_id || null,
            job_date: form.job_date || null,

            // These are intentionally left empty because
            // Job Type, Collection Address and Description
            // are no longer requested when creating a job.
            job_type: null,
            description: null,
            collection_address: null,

            delivery_address:
              form.delivery_address || null,
            assigned_employee_id:
              form.assigned_employee_id || null,
            status: form.status || "Pending",
            completed: false,
            completed_at: null,

            // Invoice is no longer requested when creating a job.
            invoice_id: null,

            notes: form.notes || null,
          })
          .select("*")
          .single();

        if (jobError || !newJob) {
          throw new Error(
            jobError?.message || "Unable to create job.",
          );
        }

        const disposalFacilities = facilityNames.map((name) => ({
          name,
          address: form.delivery_address || "",
        }));

        const disposalMethodsPayload = disposalMethods.map(
          (value) => ({
            value,
          }),
        );

        const { error: certificateError } = await supabase
          .from("disposal_certificates")
          .insert({
            job_id: newJob.id,
            reference_number: certificateReference,
            order_number: form.order_number.trim(),
            collection_status: "Pending",
            collected_by: null,
            collection_date: form.job_date || null,
            collection_location: null,

            collection_sites: collectionSites.map((value) => ({
              value,
            })),

            waste_types: wasteTypes.map((value) => ({
              value,
            })),

            packagings: packagings.map((value) => ({
              value,
            })),

            client_name: null,
            client_signature: null,
            client_signed_at: null,

            waste_type: wasteTypes[0] ?? null,
            quantity_volume:
              form.quantity_volume.trim() || null,
            packaging: packagings[0] ?? null,
            condition_at_receipt: null,

            disposal_method: disposalMethods[0] ?? null,
            disposal_facility_name:
              facilityNames[0] ?? null,
            disposal_facility_address:
              form.delivery_address || null,
            disposal_date:
              form.disposal_date || null,

            disposal_facilities: disposalFacilities,
            disposal_methods: disposalMethodsPayload,

            facility_representative: null,
            facility_signature: null,
            facility_signed_at: null,

            certificate_status: "Pending",

            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (certificateError) {
          await supabase
            .from("jobs")
            .delete()
            .eq("id", newJob.id);

          throw new Error(
            `Job created but disposal certificate could not be created: ${certificateError.message}`,
          );
        }

        setSuccess(
          `Job ${jobNumber} created successfully.`,
        );
      } else {
        const existingCertificate =
          certificateMap.get(editingJobId);

        const { error: jobError } = await supabase
          .from("jobs")
          .update({
            customer_id: form.customer_id || null,
            contractor_id: form.contractor_id || null,
            job_date: form.job_date || null,

            // These fields are no longer edited from this form.
            // Existing database values are preserved.
            delivery_address:
              form.delivery_address || null,
            assigned_employee_id:
              form.assigned_employee_id || null,
            status: form.status || "Pending",
            notes: form.notes || null,

            updated_at: new Date().toISOString(),
          })
          .eq("id", editingJobId);

        if (jobError) {
          throw new Error(
            `Unable to update job: ${jobError.message}`,
          );
        }

        if (
          existingCertificate &&
          !existingCertificate.client_signed_at
        ) {
          const disposalFacilities = facilityNames.map(
            (name) => ({
              name,
              address: form.delivery_address || "",
            }),
          );

          const disposalMethodsPayload =
            disposalMethods.map((value) => ({
              value,
            }));

          const { error: certificateError } =
            await supabase
              .from("disposal_certificates")
              .update({
                order_number:
                  form.order_number.trim(),

                collection_date:
                  form.job_date || null,

                collection_location:
                  existingCertificate.collection_location || null,

                collection_sites:
                  collectionSites.map((value) => ({
                    value,
                  })),

                waste_types:
                  wasteTypes.map((value) => ({
                    value,
                  })),

                packagings:
                  packagings.map((value) => ({
                    value,
                  })),

                waste_type:
                  wasteTypes[0] ?? null,

                quantity_volume:
                  form.quantity_volume.trim() || null,

                packaging:
                  packagings[0] ?? null,

                disposal_method:
                  disposalMethods[0] ?? null,

                disposal_facility_name:
                  facilityNames[0] ?? null,

                disposal_facility_address:
                  form.delivery_address || null,

                disposal_date:
                  form.disposal_date || null,

                disposal_facilities:
                  disposalFacilities,

                disposal_methods:
                  disposalMethodsPayload,

                updated_at:
                  new Date().toISOString(),
              })
              .eq("id", existingCertificate.id);

          if (certificateError) {
            throw new Error(
              `Job was updated but the disposal certificate could not be updated: ${certificateError.message}`,
            );
          }
        }

        setSuccess("Job updated successfully.");
      }

      setShowForm(false);
      setEditingJobId(null);
      resetForm();

      await loadPageData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Something went wrong while saving the job.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteJob(job: Job) {
    const certificate = certificateMap.get(job.id);

    const customerName = getCustomerName(
      customerMap.get(job.customer_id ?? ""),
    );

    const confirmed = window.confirm(
      certificate
        ? `Delete job ${job.job_number} for ${customerName}?\n\nThis will also delete its linked disposal certificate.\n\nThis action cannot be undone.`
        : `Delete job ${job.job_number} for ${customerName}?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(job.id);
    setError("");
    setSuccess("");

    try {
      if (certificate) {
        const { error: certificateError } =
          await supabase
            .from("disposal_certificates")
            .delete()
            .eq("id", certificate.id);

        if (certificateError) {
          throw new Error(
            `Unable to delete the disposal certificate: ${certificateError.message}`,
          );
        }
      }

      const { error: jobError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id);

      if (jobError) {
        throw new Error(
          `Unable to delete job: ${jobError.message}`,
        );
      }

      setSuccess(
        `Job ${job.job_number} was deleted successfully.`,
      );

      await loadPageData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the job.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return jobs;

    return jobs.filter((job) => {
      const customer = customerMap.get(job.customer_id ?? "");
      const certificate = certificateMap.get(job.id);

      const customerName = getCustomerName(customer);

      const site =
        certificate?.collection_sites
          ?.map((item) => item.value)
          .join(" ") ?? "";

      const orderNumber =
        certificate?.order_number ?? "";

      return [
        job.job_number,
        customerName,
        orderNumber,
        site,
        job.job_type ?? "",
        job.description ?? "",
        job.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [
    jobs,
    customers,
    customerMap,
    certificateMap,
    search,
  ]);

  function getSiteForJob(jobId: string) {
    const certificate = certificateMap.get(jobId);

    if (!certificate) return "—";

    const sites =
      certificate.collection_sites
        ?.map((item) => item.value)
        .filter(Boolean) ?? [];

    if (sites.length > 0) {
      return sites.join(", ");
    }

    return certificate.collection_location || "—";
  }

  function getOrderNumberForJob(jobId: string) {
    return certificateMap.get(jobId)?.order_number || "—";
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Jobs"
          description="Manage jobs, collections and disposal certificates."
          icon={BriefcaseBusiness}
          action={{
            label: "Add Job",
            onClick: openNewJob,
          }}
        />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="rounded-2xl border border-charcoal-200 bg-white shadow-sm dark:border-charcoal-800 dark:bg-charcoal-950">
          <div className="flex flex-col gap-3 border-b border-charcoal-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-charcoal-800">
            <div>
              <h2 className="text-base font-semibold text-charcoal-900 dark:text-white">
                Job Register
              </h2>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1 ? "job" : "jobs"}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search jobs..."
                className="w-full rounded-xl border border-charcoal-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white dark:focus:border-charcoal-500 dark:focus:ring-charcoal-800"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-charcoal-500" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-charcoal-300 dark:text-charcoal-700" />

              <h3 className="mt-4 text-base font-semibold text-charcoal-900 dark:text-white">
                No jobs found
              </h3>

              <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
                {search
                  ? "Try a different search."
                  : "Create your first job to get started."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[13%]" />
                    <col className="w-[14%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[11%]" />
                  </colgroup>

                  <thead>
                    <tr className="border-b border-charcoal-200 bg-charcoal-50 text-left dark:border-charcoal-800 dark:bg-charcoal-900/60">
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400">
                        Job No.
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400">
                        Order No.
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400">
                        Client
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400">
                        Site
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400">
                        Date
                      </th>

                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400">
                        Status
                      </th>

                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
                    {filteredJobs.map((job) => {
                      const customer = customerMap.get(
                        job.customer_id ?? "",
                      );

                      const certificate =
                        certificateMap.get(job.id);

                      const site = getSiteForJob(job.id);

                      const orderNumber =
                        getOrderNumberForJob(job.id);

                      return (
                        <tr
                          key={job.id}
                          className="transition hover:bg-charcoal-50/70 dark:hover:bg-charcoal-900/40"
                        >
                          <td className="px-3 py-3">
                            <div
                              className="truncate text-sm font-semibold text-charcoal-900 dark:text-white"
                              title={job.job_number}
                            >
                              {job.job_number}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div
                              className="truncate text-sm font-medium text-charcoal-800 dark:text-charcoal-200"
                              title={orderNumber}
                            >
                              {orderNumber}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div
                              className="truncate text-sm font-medium text-charcoal-900 dark:text-white"
                              title={getCustomerName(customer)}
                            >
                              {getCustomerName(customer)}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div
                              className="truncate text-sm text-charcoal-700 dark:text-charcoal-300"
                              title={site}
                            >
                              {site}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span className="whitespace-nowrap text-sm text-charcoal-600 dark:text-charcoal-400">
                              {formatDate(job.job_date)}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                                job.status || "Pending",
                              )}`}
                            >
                              {job.status || "Pending"}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`/jobs/${job.id}/certificate`}
                                title={
                                  certificate
                                    ? `Open ${certificate.reference_number}`
                                    : "Open certificate"
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                              >
                                <FileCheck2 className="h-4 w-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(job)
                                }
                                title="Edit job"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteJob(job)
                                }
                                disabled={
                                  deletingId === job.id
                                }
                                title="Delete job"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30"
                              >
                                {deletingId === job.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="divide-y divide-charcoal-100 md:hidden dark:divide-charcoal-800">
                {filteredJobs.map((job) => {
                  const customer = customerMap.get(
                    job.customer_id ?? "",
                  );

                  const certificate =
                    certificateMap.get(job.id);

                  const site = getSiteForJob(job.id);

                  const orderNumber =
                    getOrderNumberForJob(job.id);

                  return (
                    <div
                      key={job.id}
                      className="space-y-4 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-charcoal-900 dark:text-white">
                            {job.job_number}
                          </p>

                          <p className="mt-1 truncate text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                            {getCustomerName(customer)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                            job.status || "Pending",
                          )}`}
                        >
                          {job.status || "Pending"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-charcoal-400">
                            Order No.
                          </p>

                          <p className="mt-1 font-medium text-charcoal-800 dark:text-charcoal-200">
                            {orderNumber}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-charcoal-400">
                            Date
                          </p>

                          <p className="mt-1 font-medium text-charcoal-800 dark:text-charcoal-200">
                            {formatDate(job.job_date)}
                          </p>
                        </div>

                        <div className="col-span-2">
                          <p className="text-xs text-charcoal-400">
                            Site
                          </p>

                          <p className="mt-1 text-sm font-medium text-charcoal-800 dark:text-charcoal-200">
                            {site}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t border-charcoal-100 pt-3 dark:border-charcoal-800">
                        <a
                          href={`/jobs/${job.id}/certificate`}
                          title={
                            certificate
                              ? `Open ${certificate.reference_number}`
                              : "Open certificate"
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                        >
                          <FileCheck2 className="h-4 w-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(job)
                          }
                          title="Edit job"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteJob(job)}
                          disabled={
                            deletingId === job.id
                          }
                          title="Delete job"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30"
                        >
                          {deletingId === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ADD / EDIT JOB MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-charcoal-950">
            <div className="flex items-center justify-between border-b border-charcoal-200 px-5 py-4 dark:border-charcoal-800">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-white">
                  {editingJobId
                    ? "Edit Job"
                    : "Add New Job"}
                </h2>

                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  {editingJobId
                    ? "Update the job and disposal information."
                    : "Create a job and its disposal certificate."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setShowForm(false);
                    setEditingJobId(null);
                    resetForm();
                  }
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900 dark:hover:bg-charcoal-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="space-y-7">
                {/* BASIC JOB INFORMATION */}
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-charcoal-900 dark:text-white">
                      Job Information
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* CLIENT */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        Client *
                      </label>

                      <select
                        value={form.customer_id}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            customer_id:
                              event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                      >
                        <option value="">
                          Select client
                        </option>

                        {customers.map((customer) => (
                          <option
                            key={customer.id}
                            value={customer.id}
                          >
                            {getCustomerName(customer)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ORDER NUMBER */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        Order No. *
                      </label>

                      <input
                        value={form.order_number}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            order_number:
                              event.target.value,
                          }))
                        }
                        placeholder="Client order number"
                        className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                      />
                    </div>

                    {/* JOB DATE */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        Job Date *
                      </label>

                      <input
                        type="date"
                        value={form.job_date}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            job_date:
                              event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                      />
                    </div>

                    {/* STATUS */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        Status
                      </label>

                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            status:
                              event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                      >
                        <option value="Pending">
                          Pending
                        </option>

                        <option value="In Progress">
                          In Progress
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* SITE / COLLECTION */}
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-charcoal-900 dark:text-white">
                      Collection Details
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <MasterOptionTable
                      title="Site"
                      category="site"
                      selected={collectionSites}
                      onChange={setCollectionSites}
                    />
                  </div>
                </section>

                {/* WASTE DETAILS */}
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-charcoal-900 dark:text-white">
                      Waste Details
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <MasterOptionTable
                      title="Waste Type"
                      category="waste_type"
                      selected={wasteTypes}
                      onChange={setWasteTypes}
                    />

                    <MasterOptionTable
                      title="Packaging"
                      category="packaging"
                      selected={packagings}
                      onChange={setPackagings}
                    />

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        Quantity / Volume *
                      </label>

                      <input
                        value={form.quantity_volume}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            quantity_volume:
                              event.target.value,
                          }))
                        }
                        placeholder="e.g. 2 tons / 5 bags / 10 m³"
                        className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                      />
                    </div>
                  </div>
                </section>

                {/* DISPOSAL */}
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-charcoal-900 dark:text-white">
                      Disposal Details
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <MasterOptionTable
                      title="Disposal Facility"
                      category="disposal_facility"
                      selected={facilityNames}
                      onChange={setFacilityNames}
                    />

                    <MasterOptionTable
                      title="Disposal Method"
                      category="disposal_method"
                      selected={disposalMethods}
                      onChange={setDisposalMethods}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* DISPOSAL DATE */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                          Disposal Date *
                        </label>

                        <input
                          type="date"
                          value={form.disposal_date}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              disposal_date:
                                event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                        />
                      </div>

                      {/* DELIVERY / DISPOSAL ADDRESS */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                          Delivery / Disposal Address
                        </label>

                        <textarea
                          value={form.delivery_address}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              delivery_address:
                                event.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Facility address"
                          className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* ASSIGNMENT */}
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-charcoal-900 dark:text-white">
                      Assignment
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* EMPLOYEE */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        Employee
                      </label>

                      <select
                        value={form.assigned_employee_id}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            assigned_employee_id:
                              event.target.value,
                            contractor_id:
                              event.target.value
                                ? ""
                                : current.contractor_id,
                          }))
                        }
                        className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                      >
                        <option value="">
                          No employee assigned
                        </option>

                        {employees.map((employee) => (
                          <option
                            key={employee.id}
                            value={employee.id}
                          >
                            {employee.first_name}{" "}
                            {employee.last_name} —{" "}
                            {employee.employee_number}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CONTRACTOR */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        Contractor
                      </label>

                      <select
                        value={form.contractor_id}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contractor_id:
                              event.target.value,
                            assigned_employee_id:
                              event.target.value
                                ? ""
                                : current.assigned_employee_id,
                          }))
                        }
                        className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                      >
                        <option value="">
                          No contractor assigned
                        </option>

                        {contractors.map(
                          (contractor) => (
                            <option
                              key={contractor.id}
                              value={contractor.id}
                            >
                              {contractor.contractor_name}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                </section>

                {/* NOTES ONLY */}
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-charcoal-900 dark:text-white">
                      Additional Information
                    </h3>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                      Notes
                    </label>

                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Internal notes"
                      className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-200 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                    />
                  </div>
                </section>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-charcoal-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-end dark:border-charcoal-800">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowForm(false);
                  setEditingJobId(null);
                  resetForm();
                }}
                className="rounded-xl border border-charcoal-200 px-4 py-2.5 text-sm font-semibold text-charcoal-700 transition hover:bg-charcoal-50 disabled:opacity-50 dark:border-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-900"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveJob()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-charcoal-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-charcoal-900 dark:hover:bg-charcoal-100"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? "Saving..."
                  : editingJobId
                    ? "Save Changes"
                    : "Create Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}