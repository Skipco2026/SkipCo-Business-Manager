"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  FileCheck2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
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
  status: "Active" | "Inactive";
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
  customer_id: string;
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
  collection_status: string | null;
  client_name: string | null;
  client_signature: string | null;
  client_signed_at: string | null;
  facility_representative: string | null;
  facility_signature: string | null;
  facility_signed_at: string | null;
  certificate_status: string | null;
}

const emptyForm = {
  customer_id: "",
  job_date: "",
  contractor_id: "",
  job_type: "",
  description: "",
  collection_address: "",
  delivery_address: "",
  assigned_employee_id: "",
  status: "Pending",
  invoice_id: "",
  notes: "",
};

export default function JobsPage() {
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [certificates, setCertificates] = useState<
    Record<string, DisposalCertificate>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setLoading(true);
    setError("");

    try {
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
          .order("job_date", { ascending: false }),

        supabase
          .from("customers")
          .select("id, company_name, trading_name")
          .order("company_name", { ascending: true }),

        supabase
          .from("employees")
          .select("id, first_name, last_name, employee_number")
          .order("first_name", { ascending: true }),

        supabase
          .from("contractors")
          .select("id, contractor_name, status")
          .eq("status", "Active")
          .order("contractor_name", { ascending: true }),

        supabase
          .from("invoices")
          .select("id, invoice_number, customer_id, total")
          .order("invoice_number", { ascending: false }),

        supabase
          .from("disposal_certificates")
          .select(
            "id, job_id, reference_number, collection_status, client_name, client_signature, client_signed_at, facility_representative, facility_signature, facility_signed_at, certificate_status"
          )
          .order("created_at", { ascending: false }),
      ]);

      if (jobsResult.error) {
        throw new Error(jobsResult.error.message);
      }

      if (customersResult.error) {
        throw new Error(customersResult.error.message);
      }

      if (employeesResult.error) {
        throw new Error(employeesResult.error.message);
      }

      if (contractorsResult.error) {
        throw new Error(contractorsResult.error.message);
      }

      if (invoicesResult.error) {
        throw new Error(invoicesResult.error.message);
      }

      if (certificatesResult.error) {
        throw new Error(certificatesResult.error.message);
      }

      setJobs((jobsResult.data ?? []) as Job[]);
      setCustomers((customersResult.data ?? []) as Customer[]);
      setEmployees((employeesResult.data ?? []) as Employee[]);
      setContractors((contractorsResult.data ?? []) as Contractor[]);
      setInvoices((invoicesResult.data ?? []) as Invoice[]);

      const certificateMap: Record<string, DisposalCertificate> = {};

      for (const certificate of certificatesResult.data ?? []) {
        certificateMap[certificate.job_id] =
          certificate as DisposalCertificate;
      }

      setCertificates(certificateMap);
    } catch (err) {
      console.error("Error loading jobs:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load jobs. Please try again."
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

  function generateJobNumber() {
    return `JOB-${Date.now().toString().slice(-6)}`;
  }

  function openAddForm() {
    setEditingJob(null);

    setForm({
      ...emptyForm,
      job_date: new Date().toISOString().slice(0, 10),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(job: Job) {
    setEditingJob(job);

    setForm({
      customer_id: job.customer_id ?? "",
      job_date: job.job_date
        ? job.job_date.slice(0, 10)
        : "",
      contractor_id: job.contractor_id ?? "",
      job_type: job.job_type ?? "",
      description: job.description ?? "",
      collection_address: job.collection_address ?? "",
      delivery_address: job.delivery_address ?? "",
      assigned_employee_id: job.assigned_employee_id ?? "",
      status: job.status === "In Progress" ? "In Progress" : "Pending",
      invoice_id: job.invoice_id ?? "",
      notes: job.notes ?? "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingJob(null);
    setForm(emptyForm);
  }

  async function saveJob() {
    setError("");
    setSuccess("");

    if (!form.customer_id) {
      setError("Please select a customer.");
      return;
    }

    if (!form.job_date) {
      setError("Please select a job date.");
      return;
    }

    if (
      form.assigned_employee_id &&
      form.contractor_id
    ) {
      setError(
        "Please assign either an employee or a contractor, not both."
      );
      return;
    }

    setSaving(true);

    try {
      const jobData = {
        customer_id: form.customer_id,
        job_date: form.job_date || null,
        contractor_id: form.contractor_id || null,
        job_type: form.job_type.trim() || null,
        description: form.description.trim() || null,
        collection_address:
          form.collection_address.trim() || null,
        delivery_address:
          form.delivery_address.trim() || null,
        assigned_employee_id:
          form.assigned_employee_id || null,
        status:
          form.status === "In Progress"
            ? "In Progress"
            : "Pending",
        completed: false,
        completed_at: null,
        invoice_id: form.invoice_id || null,
        notes: form.notes.trim() || null,
      };

      if (editingJob) {
        const { error: updateError } = await supabase
          .from("jobs")
          .update({
            ...jobData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingJob.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setSuccess("Job updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("jobs")
          .insert({
            ...jobData,
            job_number: generateJobNumber(),
          });

        if (insertError) {
          throw new Error(insertError.message);
        }

        setSuccess("Job created successfully.");
      }

      setShowForm(false);
      setEditingJob(null);
      setForm(emptyForm);

      await loadPageData();
    } catch (err) {
      console.error("Error saving job:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save job. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function getCertificate(jobId: string) {
    return certificates[jobId] ?? null;
  }

  function isCertificateCompleted(jobId: string) {
    const certificate = getCertificate(jobId);

    if (!certificate) {
      return false;
    }

    return (
      Boolean(certificate.client_signature) &&
      Boolean(certificate.facility_signature) &&
      certificate.certificate_status === "Completed"
    );
  }

  function getCertificateLabel(jobId: string) {
    const certificate = getCertificate(jobId);

    if (isCertificateCompleted(jobId)) {
      return "Certificate Completed";
    }

    if (certificate?.facility_signature) {
      return "Facility Signed";
    }

    if (certificate?.client_signature) {
      return "Awaiting Facility";
    }

    if (certificate) {
      return "Awaiting Client";
    }

    return "Certificate Required";
  }

  function getCertificateDescription(jobId: string) {
    const certificate = getCertificate(jobId);

    if (isCertificateCompleted(jobId)) {
      return "Client and facility signed";
    }

    if (certificate?.facility_signature) {
      return "Ready for completion";
    }

    if (certificate?.client_signature) {
      return "Waiting for disposal facility";
    }

    if (certificate) {
      return "Waiting for client collection signature";
    }

    return "Create certificate";
  }

  function openCertificate(job: Job) {
    window.location.href = `/jobs/${job.id}/certificate`;
  }

  async function deleteJob(job: Job) {
    setError("");
    setSuccess("");

    const certificate = getCertificate(job.id);

    if (certificate) {
      setError(
        "This job has a disposal certificate and cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${job.job_number}? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSuccess(`${job.job_number} deleted successfully.`);

      await loadPageData();
    } catch (err) {
      console.error("Error deleting job:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete job. Please try again."
      );
    }
  }

  function getCustomerName(customerId: string) {
    const customer = customers.find(
      (item) => item.id === customerId
    );

    if (!customer) {
      return "Unknown customer";
    }

    return (
      customer.trading_name ||
      customer.company_name ||
      "Unnamed customer"
    );
  }

  function getEmployeeName(employeeId: string | null) {
    if (!employeeId) {
      return "—";
    }

    const employee = employees.find(
      (item) => item.id === employeeId
    );

    if (!employee) {
      return "Unknown employee";
    }

    return `${employee.first_name} ${employee.last_name}`;
  }

  function getContractorName(contractorId: string | null) {
    if (!contractorId) {
      return "—";
    }

    const contractor = contractors.find(
      (item) => item.id === contractorId
    );

    if (!contractor) {
      return "Unknown contractor";
    }

    return contractor.contractor_name;
  }

  function getInvoiceNumber(invoiceId: string | null) {
    if (!invoiceId) {
      return "—";
    }

    const invoice = invoices.find(
      (item) => item.id === invoiceId
    );

    return invoice?.invoice_number ?? "Unknown invoice";
  }

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const totalJobs = jobs.length;

  const pendingJobs = jobs.filter(
    (job) => job.status === "Pending"
  ).length;

  const inProgressJobs = jobs.filter(
    (job) => job.status === "In Progress"
  ).length;

  const completedJobs = jobs.filter(
    (job) =>
      job.completed &&
      isCertificateCompleted(job.id)
  ).length;

  return (
    <DashboardShell
      title="Jobs"
      subtitle="Manage collections, deliveries and disposal certificates"
    >
      <div className="space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Jobs"
            description="Manage your waste collection and disposal jobs."
          />

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-charcoal-800"
          >
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-charcoal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500">
                  Total Jobs
                </p>

                <p className="mt-2 text-3xl font-bold text-charcoal-900">
                  {totalJobs}
                </p>
              </div>

              <div className="rounded-lg bg-charcoal-100 p-3">
                <BriefcaseBusiness className="h-5 w-5 text-charcoal-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-charcoal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-charcoal-900">
                  {pendingJobs}
                </p>
              </div>

              <div className="rounded-lg bg-yellow-50 p-3">
                <BriefcaseBusiness className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-charcoal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500">
                  In Progress
                </p>

                <p className="mt-2 text-3xl font-bold text-charcoal-900">
                  {inProgressJobs}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <BriefcaseBusiness className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-charcoal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-500">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-bold text-charcoal-900">
                  {completedJobs}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3">
                <Check className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </div>
        </div>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div className="rounded-xl border border-charcoal-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-charcoal-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  {editingJob ? "Edit Job" : "Add Job"}
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  {editingJob
                    ? `Update ${editingJob.job_number}`
                    : "Create a new collection and disposal job."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              {/* CUSTOMER */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Customer *
                </label>

                <select
                  value={form.customer_id}
                  onChange={(event) =>
                    updateField(
                      "customer_id",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.trading_name ||
                        customer.company_name ||
                        "Unnamed customer"}
                    </option>
                  ))}
                </select>
              </div>

              {/* JOB DATE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Job Date *
                </label>

                <input
                  type="date"
                  value={form.job_date}
                  onChange={(event) =>
                    updateField(
                      "job_date",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                />
              </div>

              {/* JOB TYPE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Job Type
                </label>

                <input
                  type="text"
                  value={form.job_type}
                  onChange={(event) =>
                    updateField(
                      "job_type",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Skip Collection"
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                />
              </div>

              {/* STATUS */}
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
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>
                </select>
              </div>

              {/* EMPLOYEE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Assigned Employee
                </label>

                <select
                  value={form.assigned_employee_id}
                  onChange={(event) =>
                    updateField(
                      "assigned_employee_id",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
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
                      {employee.last_name}{" "}
                      {employee.employee_number
                        ? `(${employee.employee_number})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* CONTRACTOR */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Contractor
                </label>

                <select
                  value={form.contractor_id}
                  onChange={(event) =>
                    updateField(
                      "contractor_id",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                >
                  <option value="">
                    No contractor assigned
                  </option>

                  {contractors.map((contractor) => (
                    <option
                      key={contractor.id}
                      value={contractor.id}
                    >
                      {contractor.contractor_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* INVOICE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Invoice
                </label>

                <select
                  value={form.invoice_id}
                  onChange={(event) =>
                    updateField(
                      "invoice_id",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                >
                  <option value="">
                    No invoice linked
                  </option>

                  {invoices
                    .filter(
                      (invoice) =>
                        !form.customer_id ||
                        invoice.customer_id ===
                          form.customer_id
                    )
                    .map((invoice) => (
                      <option
                        key={invoice.id}
                        value={invoice.id}
                      >
                        {invoice.invoice_number}
                      </option>
                    ))}
                </select>
              </div>

              {/* COLLECTION ADDRESS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Collection Address
                </label>

                <textarea
                  value={form.collection_address}
                  onChange={(event) =>
                    updateField(
                      "collection_address",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Where the waste will be collected"
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                />
              </div>

              {/* DELIVERY ADDRESS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Delivery / Disposal Address
                </label>

                <textarea
                  value={form.delivery_address}
                  onChange={(event) =>
                    updateField(
                      "delivery_address",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Where the waste will be delivered"
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Describe the job"
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                />
              </div>

              {/* NOTES */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Internal notes"
                  className="w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-charcoal-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-charcoal-300 px-4 py-2.5 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveJob}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? "Saving..."
                  : editingJob
                    ? "Update Job"
                    : "Create Job"}
              </button>
            </div>
          </div>
        )}

        {/* JOBS LIST */}
        <div className="rounded-xl border border-charcoal-200 bg-white shadow-sm">
          <div className="border-b border-charcoal-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-charcoal-900">
              Jobs
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Collections, deliveries and disposal certificates.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-charcoal-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading jobs...
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-charcoal-100 p-4">
                <BriefcaseBusiness className="h-7 w-7 text-charcoal-600" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-charcoal-900">
                No jobs yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500">
                Create your first job to start managing
                collections and disposal certificates.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-800"
              >
                <Plus className="h-4 w-4" />
                Add Job
              </button>
            </div>
          ) : (
            <div className="divide-y divide-charcoal-200">
              {jobs.map((job) => {
                const certificate =
                  getCertificate(job.id);

                const certificateCompleted =
                  isCertificateCompleted(job.id);

                return (
                  <div
                    key={job.id}
                    className="p-6 transition hover:bg-charcoal-50"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      {/* JOB INFORMATION */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-charcoal-900">
                            {job.job_number}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              job.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {job.status}
                          </span>

                          {job.completed && (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                              Completed
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 text-lg font-semibold text-charcoal-900">
                          {getCustomerName(
                            job.customer_id
                          )}
                        </h3>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
                              Job Date
                            </p>

                            <p className="mt-1 text-sm text-charcoal-700">
                              {formatDate(job.job_date)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
                              Job Type
                            </p>

                            <p className="mt-1 text-sm text-charcoal-700">
                              {job.job_type || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
                              Employee
                            </p>

                            <p className="mt-1 text-sm text-charcoal-700">
                              {getEmployeeName(
                                job.assigned_employee_id
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
                              Contractor
                            </p>

                            <p className="mt-1 text-sm text-charcoal-700">
                              {getContractorName(
                                job.contractor_id
                              )}
                            </p>
                          </div>
                        </div>

                        {(job.collection_address ||
                          job.delivery_address) && (
                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {job.collection_address && (
                              <div className="rounded-lg bg-charcoal-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                                  Collection Address
                                </p>

                                <p className="mt-1 whitespace-pre-line text-sm text-charcoal-700">
                                  {job.collection_address}
                                </p>
                              </div>
                            )}

                            {job.delivery_address && (
                              <div className="rounded-lg bg-charcoal-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                                  Delivery / Disposal
                                </p>

                                <p className="mt-1 whitespace-pre-line text-sm text-charcoal-700">
                                  {job.delivery_address}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {job.description && (
                          <div className="mt-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
                              Description
                            </p>

                            <p className="mt-1 whitespace-pre-line text-sm text-charcoal-700">
                              {job.description}
                            </p>
                          </div>
                        )}

                        {job.invoice_id && (
                          <div className="mt-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
                              Invoice
                            </p>

                            <p className="mt-1 text-sm text-charcoal-700">
                              {getInvoiceNumber(
                                job.invoice_id
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="w-full xl:w-80">
                        <div
                          className={`rounded-xl border p-4 ${
                            certificateCompleted
                              ? "border-green-200 bg-green-50"
                              : certificate
                                ? "border-yellow-200 bg-yellow-50"
                                : "border-charcoal-200 bg-charcoal-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`rounded-lg p-2 ${
                                certificateCompleted
                                  ? "bg-green-100"
                                  : certificate
                                    ? "bg-yellow-100"
                                    : "bg-white"
                              }`}
                            >
                              <FileCheck2
                                className={`h-5 w-5 ${
                                  certificateCompleted
                                    ? "text-green-700"
                                    : certificate
                                      ? "text-yellow-700"
                                      : "text-charcoal-600"
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-charcoal-900">
                                {getCertificateLabel(
                                  job.id
                                )}
                              </p>

                              <p className="mt-1 text-xs text-charcoal-600">
                                {getCertificateDescription(
                                  job.id
                                )}
                              </p>

                              {certificate?.reference_number && (
                                <p className="mt-2 text-xs font-medium text-charcoal-500">
                                  Ref:{" "}
                                  {
                                    certificate.reference_number
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openCertificate(job)
                            }
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-800"
                          >
                            <FileCheck2 className="h-4 w-4" />

                            {certificate
                              ? "Open Certificate"
                              : "Create Certificate"}
                          </button>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(job)
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteJob(job)
                            }
                            disabled={Boolean(certificate)}
                            title={
                              certificate
                                ? "Jobs with certificates cannot be deleted"
                                : "Delete job"
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}