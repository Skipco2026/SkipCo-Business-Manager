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

const EMPTY_FORM = {
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

type JobForm = typeof EMPTY_FORM;

const INPUT_CLASS =
  "w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none transition placeholder:text-charcoal-400 focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200";

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none transition placeholder:text-charcoal-400 focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200";

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
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [form, setForm] = useState<JobForm>(EMPTY_FORM);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadPageData();
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
          .order("created_at", { ascending: false }),

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

      const loadedJobs = ((jobsResult.data ?? []) as Job[]).sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      const certificateMap: Record<string, DisposalCertificate> = {};

      /*
       * Certificates are returned newest first.
       * Only store the first certificate for each job.
       */
      for (const certificate of certificatesResult.data ?? []) {
        if (!certificateMap[certificate.job_id]) {
          certificateMap[certificate.job_id] =
            certificate as DisposalCertificate;
        }
      }

      setJobs(loadedJobs);
      setCustomers((customersResult.data ?? []) as Customer[]);
      setEmployees((employeesResult.data ?? []) as Employee[]);
      setContractors((contractorsResult.data ?? []) as Contractor[]);
      setInvoices((invoicesResult.data ?? []) as Invoice[]);
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

  function updateField(field: keyof JobForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function generateJobNumber() {
    return `JOB-${Date.now().toString().slice(-6)}`;
  }

  function openAddForm() {
    clearMessages();

    setEditingJob(null);

    setForm({
      ...EMPTY_FORM,
      job_date: new Date().toISOString().slice(0, 10),
    });

    setShowForm(true);
  }

  function openEditForm(job: Job) {
    clearMessages();

    setEditingJob(job);

    setForm({
      customer_id: job.customer_id ?? "",
      job_date: job.job_date ? job.job_date.slice(0, 10) : "",
      contractor_id: job.contractor_id ?? "",
      job_type: job.job_type ?? "",
      description: job.description ?? "",
      collection_address: job.collection_address ?? "",
      delivery_address: job.delivery_address ?? "",
      assigned_employee_id: job.assigned_employee_id ?? "",
      status:
        job.status === "In Progress"
          ? "In Progress"
          : "Pending",
      invoice_id: job.invoice_id ?? "",
      notes: job.notes ?? "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingJob(null);
    setForm(EMPTY_FORM);
  }

  async function saveJob() {
    clearMessages();

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

        setSuccess(
          `${editingJob.job_number} updated successfully.`
        );
      } else {
        const { error: insertError } = await supabase
          .from("jobs")
          .insert({
            ...jobData,
            job_number: generateJobNumber(),
            completed: false,
            completed_at: null,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }

        setSuccess("Job created successfully.");
      }

      setShowForm(false);
      setEditingJob(null);
      setForm(EMPTY_FORM);

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

    return Boolean(
      certificate &&
        certificate.client_signature &&
        certificate.facility_signature &&
        certificate.certificate_status === "Completed"
    );
  }

  function getCertificateLabel(jobId: string) {
    const certificate = getCertificate(jobId);

    if (isCertificateCompleted(jobId)) {
      return "Completed";
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

    return "Required";
  }

  function getCertificateDescription(jobId: string) {
    const certificate = getCertificate(jobId);

    if (isCertificateCompleted(jobId)) {
      return "Client & facility signed";
    }

    if (certificate?.facility_signature) {
      return "Ready for completion";
    }

    if (certificate?.client_signature) {
      return "Waiting for facility";
    }

    if (certificate) {
      return "Waiting for client";
    }

    return "Create certificate";
  }

  function openCertificate(job: Job) {
    window.location.href = `/jobs/${job.id}/certificate`;
  }

  async function deleteJob(job: Job) {
    clearMessages();

    const certificate = getCertificate(job.id);

    if (certificate) {
      setError(
        "This job has a disposal certificate and cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${job.job_number}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingJobId(job.id);

    try {
      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSuccess(
        `${job.job_number} deleted successfully.`
      );

      await loadPageData();
    } catch (err) {
      console.error("Error deleting job:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete job. Please try again."
      );
    } finally {
      setDeletingJobId(null);
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
      return "Unassigned";
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
      return "Unassigned";
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
      return "Not linked";
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
      job.completed ||
      isCertificateCompleted(job.id)
  ).length;

  const certificateRequiredJobs = jobs.filter(
    (job) =>
      !getCertificate(job.id) &&
      !job.completed
  ).length;

  const filteredJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Completed"
          ? job.completed ||
            isCertificateCompleted(job.id)
          : job.status === statusFilter);

      if (!matchesStatus) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchableText = [
        job.job_number,
        getCustomerName(job.customer_id),
        job.job_type,
        job.description,
        job.collection_address,
        job.delivery_address,
        job.status,
        getEmployeeName(job.assigned_employee_id),
        getContractorName(job.contractor_id),
        getInvoiceNumber(job.invoice_id),
        job.notes,
        job.job_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [
    jobs,
    searchTerm,
    statusFilter,
    customers,
    employees,
    contractors,
    invoices,
    certificates,
  ]);

  return (
    <DashboardShell
      title="Jobs"
      subtitle="Manage collections, deliveries and disposal certificates"
    >
      <div className="space-y-5">
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
              className="shrink-0 rounded-md p-1 hover:bg-red-100"
              aria-label="Dismiss error"
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
              className="shrink-0 rounded-md p-1 hover:bg-green-100"
              aria-label="Dismiss success"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard
            label="Total Jobs"
            value={totalJobs}
            icon={
              <BriefcaseBusiness className="h-4 w-4 text-charcoal-700" />
            }
            iconClass="bg-charcoal-100"
          />

          <SummaryCard
            label="Pending"
            value={pendingJobs}
            icon={
              <BriefcaseBusiness className="h-4 w-4 text-yellow-700" />
            }
            iconClass="bg-yellow-50"
          />

          <SummaryCard
            label="In Progress"
            value={inProgressJobs}
            icon={
              <BriefcaseBusiness className="h-4 w-4 text-blue-700" />
            }
            iconClass="bg-blue-50"
          />

          <SummaryCard
            label="Completed"
            value={completedJobs}
            icon={
              <Check className="h-4 w-4 text-green-700" />
            }
            iconClass="bg-green-50"
          />

          <SummaryCard
            label="Certificates Required"
            value={certificateRequiredJobs}
            icon={
              <FileCheck2 className="h-4 w-4 text-orange-700" />
            }
            iconClass="bg-orange-50"
          />
        </div>

        {/* SEARCH */}
        <div className="rounded-xl border border-charcoal-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search jobs, customers, job numbers, sites..."
                className="w-full rounded-lg border border-charcoal-300 bg-white py-3 pl-10 pr-10 text-sm text-charcoal-900 outline-none transition placeholder:text-charcoal-400 focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-charcoal-400 transition hover:bg-charcoal-100 hover:text-charcoal-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-charcoal-300 bg-white px-3 py-3 text-sm text-charcoal-700 outline-none focus:border-charcoal-500 focus:ring-2 focus:ring-charcoal-200 lg:w-48"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">
                In Progress
              </option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== "All") && (
            <div className="mt-3 text-xs text-charcoal-500">
              Showing {filteredJobs.length} of{" "}
              {jobs.length} jobs
            </div>
          )}
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
                disabled={saving}
                className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900 disabled:opacity-50"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <FormField label="Customer *">
                <select
                  value={form.customer_id}
                  onChange={(event) =>
                    updateField(
                      "customer_id",
                      event.target.value
                    )
                  }
                  className={INPUT_CLASS}
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
              </FormField>

              <FormField label="Job Date *">
                <input
                  type="date"
                  value={form.job_date}
                  onChange={(event) =>
                    updateField(
                      "job_date",
                      event.target.value
                    )
                  }
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField label="Job Type">
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
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value
                    )
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>
                </select>
              </FormField>

              <FormField label="Assigned Employee">
                <select
                  value={form.assigned_employee_id}
                  onChange={(event) =>
                    updateField(
                      "assigned_employee_id",
                      event.target.value
                    )
                  }
                  className={INPUT_CLASS}
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
                      {employee.last_name}
                      {employee.employee_number
                        ? ` (${employee.employee_number})`
                        : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Contractor">
                <select
                  value={form.contractor_id}
                  onChange={(event) =>
                    updateField(
                      "contractor_id",
                      event.target.value
                    )
                  }
                  className={INPUT_CLASS}
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
              </FormField>

              <FormField label="Invoice">
                <select
                  value={form.invoice_id}
                  onChange={(event) =>
                    updateField(
                      "invoice_id",
                      event.target.value
                    )
                  }
                  className={INPUT_CLASS}
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
              </FormField>

              <FormField label="Collection Address">
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
                  className={TEXTAREA_CLASS}
                />
              </FormField>

              <FormField label="Delivery / Disposal Address">
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
                  className={TEXTAREA_CLASS}
                />
              </FormField>

              <FormField
                label="Description"
                className="md:col-span-2"
              >
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
                  className={TEXTAREA_CLASS}
                />
              </FormField>

              <FormField
                label="Internal Notes"
                className="md:col-span-2"
              >
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
                  className={TEXTAREA_CLASS}
                />
              </FormField>
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

        {/* COMPACT JOB LIST */}
        <div className="overflow-hidden rounded-xl border border-charcoal-200 bg-white shadow-sm">
          <div className="border-b border-charcoal-200 px-6 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  Jobs
                </h2>

                <p className="text-sm text-charcoal-500">
                  Select a job to manage its details and certificate.
                </p>
              </div>

              {!loading && (
                <span className="text-sm text-charcoal-500">
                  {filteredJobs.length}{" "}
                  {filteredJobs.length === 1
                    ? "job"
                    : "jobs"}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={
                <BriefcaseBusiness className="h-7 w-7 text-charcoal-600" />
              }
              title="No jobs yet"
              description="Create your first job to start managing collections and disposal certificates."
              buttonLabel="Add Job"
              onClick={openAddForm}
            />
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon={
                <Search className="h-7 w-7 text-charcoal-600" />
              }
              title="No jobs found"
              description="Try changing your search or status filter."
              buttonLabel="Clear Filters"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
              }}
            />
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-charcoal-200 bg-charcoal-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Job
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Collection Site
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Job Type
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Certificate
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-charcoal-100">
                    {filteredJobs.map((job) => {
                      const certificate =
                        getCertificate(job.id);

                      const certificateCompleted =
                        isCertificateCompleted(job.id);

                      const deleting =
                        deletingJobId === job.id;

                      return (
                        <tr
                          key={job.id}
                          className="transition hover:bg-charcoal-50"
                        >
                          {/* JOB */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="font-semibold text-charcoal-900">
                              {job.job_number}
                            </div>

                            {job.completed && (
                              <div className="mt-1 text-xs font-medium text-green-700">
                                Job completed
                              </div>
                            )}
                          </td>

                          {/* CUSTOMER */}
                          <td className="px-5 py-4">
                            <div className="max-w-[190px] truncate font-medium text-charcoal-900">
                              {getCustomerName(
                                job.customer_id
                              )}
                            </div>
                          </td>

                          {/* COLLECTION SITE */}
                          <td className="px-5 py-4">
                            <div
                              className="max-w-[260px] truncate text-sm text-charcoal-700"
                              title={
                                job.collection_address ||
                                ""
                              }
                            >
                              {job.collection_address ||
                                "Not specified"}
                            </div>
                          </td>

                          {/* JOB TYPE */}
                          <td className="px-5 py-4">
                            <span className="text-sm text-charcoal-700">
                              {job.job_type || "—"}
                            </span>
                          </td>

                          {/* DATE */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="text-sm text-charcoal-700">
                              {formatDate(job.job_date)}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            <StatusBadge
                              status={job.status}
                            />
                          </td>

                          {/* CERTIFICATE */}
                          <td className="px-5 py-4">
                            <CertificateBadge
                              completed={
                                certificateCompleted
                              }
                              certificate={
                                certificate
                              }
                              label={getCertificateLabel(
                                job.id
                              )}
                            />
                          </td>

                          {/* ACTIONS */}
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openCertificate(job)
                                }
                                title={
                                  certificate
                                    ? "Open certificate"
                                    : "Create certificate"
                                }
                                className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900"
                              >
                                <FileCheck2 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(job)
                                }
                                title="Edit job"
                                className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-900"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteJob(job)
                                }
                                disabled={
                                  Boolean(certificate) ||
                                  deleting
                                }
                                title={
                                  certificate
                                    ? "Jobs with certificates cannot be deleted"
                                    : "Delete job"
                                }
                                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                {deleting ? (
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

              {/* MOBILE LIST */}
              <div className="divide-y divide-charcoal-200 md:hidden">
                {filteredJobs.map((job) => {
                  const certificate =
                    getCertificate(job.id);

                  const certificateCompleted =
                    isCertificateCompleted(job.id);

                  const deleting =
                    deletingJobId === job.id;

                  return (
                    <div
                      key={job.id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-charcoal-900">
                              {job.job_number}
                            </span>

                            <StatusBadge
                              status={job.status}
                            />
                          </div>

                          <h3 className="mt-1 truncate font-semibold text-charcoal-900">
                            {getCustomerName(
                              job.customer_id
                            )}
                          </h3>
                        </div>

                        <span className="shrink-0 text-xs text-charcoal-500">
                          {formatDate(job.job_date)}
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                          Collection Site
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm text-charcoal-700">
                          {job.collection_address ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {job.job_type && (
                          <span className="rounded-md bg-charcoal-100 px-2.5 py-1 text-xs font-medium text-charcoal-700">
                            {job.job_type}
                          </span>
                        )}

                        <CertificateBadge
                          completed={
                            certificateCompleted
                          }
                          certificate={certificate}
                          label={getCertificateLabel(
                            job.id
                          )}
                        />
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openCertificate(job)
                          }
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-3 py-2.5 text-sm font-semibold text-white"
                        >
                          <FileCheck2 className="h-4 w-4" />

                          {certificate
                            ? "Certificate"
                            : "Create Certificate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(job)
                          }
                          className="rounded-lg border border-charcoal-300 px-3 py-2.5 text-charcoal-700"
                          title="Edit job"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteJob(job)
                          }
                          disabled={
                            Boolean(certificate) ||
                            deleting
                          }
                          className="rounded-lg border border-red-200 px-3 py-2.5 text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Delete job"
                        >
                          {deleting ? (
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
    </DashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-charcoal-200 bg-white px-4 py-3 shadow-sm">
      <div className={`rounded-md p-2 ${iconClass}`}>
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-charcoal-500">
          {label}
        </p>

        <p className="text-xl font-bold text-charcoal-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-charcoal-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const className =
    status === "Pending"
      ? "bg-yellow-100 text-yellow-800"
      : status === "In Progress"
        ? "bg-blue-100 text-blue-800"
        : status === "Completed"
          ? "bg-green-100 text-green-800"
          : "bg-charcoal-100 text-charcoal-700";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

function CertificateBadge({
  completed,
  certificate,
  label,
}: {
  completed: boolean;
  certificate: DisposalCertificate | null;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
          completed
            ? "bg-green-100 text-green-800"
            : certificate
              ? "bg-yellow-100 text-yellow-800"
              : "bg-orange-100 text-orange-800"
        }`}
      >
        {completed && (
          <Check className="h-3 w-3" />
        )}

        <span>{label}</span>
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[250px] items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-charcoal-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading jobs...
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-full bg-charcoal-100 p-4">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-charcoal-900">
        {title}
      </h3>

      <p className="mt-1 max-w-md text-sm text-charcoal-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-lg border border-charcoal-300 px-4 py-2.5 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}