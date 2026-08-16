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

/* =========================================================
   TYPES
========================================================= */

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
  company_name: string | null;
  trading_name: string | null;
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

/* =========================================================
   FORM
========================================================= */

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

/* =========================================================
   PAGE
========================================================= */

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

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    void loadPageData();
  }, []);

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
        .order("job_date", {
          ascending: false,
        }),

      supabase
        .from("customers")
        .select("id, company_name, trading_name")
        .order("company_name", {
          ascending: true,
        }),

      supabase
        .from("employees")
        .select(
          "id, first_name, last_name, employee_number"
        )
        .eq("employment_status", "Active")
        .order("first_name", {
          ascending: true,
        }),

      supabase
        .from("contractors")
        .select("id, company_name, trading_name")
        .order("company_name", {
          ascending: true,
        }),

      supabase
        .from("invoices")
        .select(
          "id, invoice_number, customer_id, total"
        )
        .order("invoice_date", {
          ascending: false,
        }),

      supabase
        .from("disposal_certificates")
        .select(
          `
            id,
            job_id,
            reference_number,
            collection_status,
            client_name,
            client_signature,
            client_signed_at,
            facility_representative,
            facility_signature,
            facility_signed_at,
            certificate_status
          `
        ),
    ]);

    if (jobsResult.error) {
      console.error(
        "Jobs loading error:",
        jobsResult.error
      );

      setError(
        `Unable to load jobs: ${jobsResult.error.message}`
      );
    }

    if (customersResult.error) {
      console.error(
        "Customers loading error:",
        customersResult.error
      );
    }

    if (employeesResult.error) {
      console.error(
        "Employees loading error:",
        employeesResult.error
      );
    }

    if (contractorsResult.error) {
      console.error(
        "Contractors loading error:",
        contractorsResult.error
      );
    }

    if (invoicesResult.error) {
      console.error(
        "Invoices loading error:",
        invoicesResult.error
      );
    }

    if (certificatesResult.error) {
      console.error(
        "Disposal certificates loading error:",
        certificatesResult.error
      );

      setError(
        `Unable to load disposal certificates: ${certificatesResult.error.message}`
      );
    }

    const loadedJobs =
      (jobsResult.data ?? []) as Job[];

    const loadedCertificates =
      (certificatesResult.data ??
        []) as DisposalCertificate[];

    const certificateMap: Record<
      string,
      DisposalCertificate
    > = {};

    loadedCertificates.forEach(
      (certificate) => {
        certificateMap[
          certificate.job_id
        ] = certificate;
      }
    );

    setJobs(loadedJobs);
    setCertificates(certificateMap);

    setCustomers(
      (customersResult.data ??
        []) as Customer[]
    );

    setEmployees(
      (employeesResult.data ??
        []) as Employee[]
    );

    setContractors(
      (contractorsResult.data ??
        []) as Contractor[]
    );

    setInvoices(
      (invoicesResult.data ??
        []) as Invoice[]
    );

    setLoading(false);
  }

  /* =======================================================
     FORM HELPERS
  ======================================================= */

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
    return `JOB-${Date.now()
      .toString()
      .slice(-6)}`;
  }

  function openAddForm() {
    setEditingJob(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(job: Job) {
    setEditingJob(job);

    setForm({
      customer_id: job.customer_id ?? "",
      job_date: job.job_date ?? "",
      contractor_id: job.contractor_id ?? "",
      job_type: job.job_type ?? "",
      description: job.description ?? "",
      collection_address:
        job.collection_address ?? "",
      delivery_address:
        job.delivery_address ?? "",
      assigned_employee_id:
        job.assigned_employee_id ?? "",
      status: job.status ?? "Pending",
      invoice_id: job.invoice_id ?? "",
      notes: job.notes ?? "",
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
    setEditingJob(null);
    setForm(emptyForm);
    setError("");
  }

  /* =======================================================
     SAVE JOB
  ======================================================= */

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
      !form.assigned_employee_id &&
      !form.contractor_id
    ) {
      setError(
        "Please assign either an employee/driver or a contractor."
      );
      return;
    }

    if (
      form.assigned_employee_id &&
      form.contractor_id
    ) {
      setError(
        "Please assign either an employee/driver OR a contractor, not both."
      );
      return;
    }

    /*
     * IMPORTANT:
     *
     * A job can no longer be created or edited
     * directly into Completed status.
     *
     * Completion must happen through the
     * disposal certificate workflow.
     */

    if (form.status === "Completed") {
      setError(
        "Jobs cannot be manually set to Completed. The disposal certificate must be signed by both the client and disposal facility."
      );
      return;
    }

    setSaving(true);

    const jobData = {
      customer_id: form.customer_id,

      job_date:
        form.job_date || null,

      contractor_id:
        form.contractor_id || null,

      job_type:
        form.job_type.trim() || null,

      description:
        form.description.trim() || null,

      collection_address:
        form.collection_address.trim() ||
        null,

      delivery_address:
        form.delivery_address.trim() ||
        null,

      assigned_employee_id:
        form.assigned_employee_id ||
        null,

      status:
        form.status === "Pending"
          ? "Pending"
          : "In Progress",

      /*
       * A new/edit job is never completed
       * from this form.
       */
      completed: false,
      completed_at: null,

      invoice_id:
        form.invoice_id || null,

      notes:
        form.notes.trim() || null,
    };

    if (editingJob) {
      const { error } =
        await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", editingJob.id);

      if (error) {
        console.error(
          "Job update error:",
          error
        );

        setError(
          `Unable to update job: ${error.message}`
        );

        setSaving(false);
        return;
      }

      setSuccess(
        "Job updated successfully."
      );
    } else {
      const jobNumber =
        generateJobNumber();

      const { error } =
        await supabase
          .from("jobs")
          .insert({
            job_number: jobNumber,
            ...jobData,
          });

      if (error) {
        console.error(
          "Job save error:",
          error
        );

        setError(
          `Unable to save job: ${error.message}`
        );

        setSaving(false);
        return;
      }

      setSuccess(
        `Job ${jobNumber} created successfully.`
      );
    }

    setSaving(false);
    setShowForm(false);
    setEditingJob(null);
    setForm(emptyForm);

    await loadPageData();
  }

  /* =======================================================
     CERTIFICATE STATUS
  ======================================================= */

  function getCertificate(
    jobId: string
  ) {
    return certificates[jobId] ?? null;
  }

  function isCertificateCompleted(
    jobId: string
  ) {
    const certificate =
      getCertificate(jobId);

    if (!certificate) {
      return false;
    }

    return (
      Boolean(
        certificate.client_signature
      ) &&
      Boolean(
        certificate.facility_signature
      ) &&
      certificate.certificate_status ===
        "Completed"
    );
  }

  function getCertificateLabel(
    job: Job
  ) {
    const certificate =
      getCertificate(job.id);

    /*
     * A completed job should have a completed
     * certificate.
     */
    if (
      job.completed &&
      isCertificateCompleted(job.id)
    ) {
      return "Certificate Completed";
    }

    if (
      certificate?.facility_signature
    ) {
      return "Facility Signed";
    }

    if (
      certificate?.client_signature
    ) {
      return "Awaiting Facility";
    }

    if (certificate) {
      return "Awaiting Client";
    }

    return "Certificate Required";
  }

  function getCertificateDescription(
    job: Job
  ) {
    const certificate =
      getCertificate(job.id);

    if (
      job.completed &&
      isCertificateCompleted(job.id)
    ) {
      return "Client and facility signed";
    }

    if (
      certificate?.facility_signature
    ) {
      return "Ready for completion";
    }

    if (
      certificate?.client_signature
    ) {
      return "Waiting for disposal facility";
    }

    if (certificate) {
      return "Waiting for client collection signature";
    }

    return "Create certificate";
  }

  /* =======================================================
     OPEN CERTIFICATE
  ======================================================= */

  function openCertificate(
    job: Job
  ) {
    window.location.href =
      `/dashboard/jobs/${job.id}/disposal-certificate`;
  }

  /* =======================================================
     MANUAL COMPLETION REMOVED
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * We intentionally do NOT have a toggleCompleted()
   * function anymore.
   *
   * Jobs are completed ONLY by the certificate
   * workflow.
   */

  /* =======================================================
     DELETE JOB
  ======================================================= */

  async function deleteJob(
    job: Job
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${job.job_number}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const certificate =
      getCertificate(job.id);

    /*
     * Prevent deleting a job that already has
     * a disposal certificate.
     *
     * This protects the audit trail.
     */
    if (certificate) {
      setError(
        "This job has a disposal certificate and cannot be deleted."
      );

      return;
    }

    const { error } =
      await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id);

    if (error) {
      console.error(
        "Job delete error:",
        error
      );

      setError(
        `Unable to delete job: ${error.message}`
      );

      return;
    }

    setSuccess(
      `${job.job_number} deleted successfully.`
    );

    await loadPageData();
  }

  /* =======================================================
     DISPLAY HELPERS
  ======================================================= */

  function getCustomerName(
    customerId: string
  ) {
    const customer =
      customers.find(
        (item) =>
          item.id === customerId
      );

    if (!customer) {
      return "Unknown customer";
    }

    return (
      customer.company_name ||
      customer.trading_name ||
      "Unnamed customer"
    );
  }

  function getEmployeeName(
    employeeId: string | null
  ) {
    if (!employeeId) {
      return "Unassigned";
    }

    const employee =
      employees.find(
        (item) =>
          item.id === employeeId
      );

    if (!employee) {
      return "Unassigned";
    }

    return `${employee.first_name} ${employee.last_name}`;
  }

  function getContractorName(
    contractorId: string | null
  ) {
    if (!contractorId) {
      return "None";
    }

    const contractor =
      contractors.find(
        (item) =>
          item.id === contractorId
      );

    if (!contractor) {
      return "None";
    }

    return (
      contractor.company_name ||
      contractor.trading_name ||
      "Unnamed contractor"
    );
  }

  function getInvoiceNumber(
    invoiceId: string | null
  ) {
    if (!invoiceId) {
      return "Not linked";
    }

    const invoice =
      invoices.find(
        (item) =>
          item.id === invoiceId
      );

    return (
      invoice?.invoice_number ??
      "Not linked"
    );
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /* =======================================================
     SUMMARY
  ======================================================= */

  const totalJobs =
    jobs.length;

  const completedJobs =
    jobs.filter(
      (job) =>
        job.completed &&
        isCertificateCompleted(job.id)
    ).length;

  const pendingJobs =
    jobs.filter(
      (job) =>
        !job.completed
    ).length;

  const awaitingFacility =
    jobs.filter(
      (job) => {
        const certificate =
          getCertificate(job.id);

        return (
          !job.completed &&
          Boolean(
            certificate?.client_signature
          ) &&
          !certificate?.facility_signature
        );
      }
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardShell
      title="Jobs"
      subtitle="Manage jobs, assignments and completion status"
    >
      <PageHeader
        title="Jobs"
        description="Create, assign and track jobs through collection, disposal and final certificate completion."
        icon={BriefcaseBusiness}
        action={{
          label: "Add Job",
          href: "#",
        }}
      />

      <div className="space-y-6">

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Total Jobs
            </p>

            <p className="mt-2 text-2xl font-bold text-charcoal-900">
              {totalJobs}
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Completed
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {completedJobs}
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              In Progress
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-500">
              {pendingJobs}
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Awaiting Facility
            </p>

            <p className="mt-2 text-2xl font-bold text-[#20AEB8]">
              {awaitingFacility}
            </p>
          </div>

        </div>

        {/* =================================================
            ADD BUTTON
        ================================================= */}

        {!showForm && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal-800"
            >
              <Plus className="h-4 w-4" />
              Add Job
            </button>
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        {showForm && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  {editingJob
                    ? "Edit Job"
                    : "Add Job"}
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Enter the job information below.
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

              {/* JOB DETAILS */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Job Details
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Customer *
                    </label>

                    <select
                      value={
                        form.customer_id
                      }
                      onChange={(event) =>
                        updateField(
                          "customer_id",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="">
                        Select customer
                      </option>

                      {customers.map(
                        (customer) => (
                          <option
                            key={
                              customer.id
                            }
                            value={
                              customer.id
                            }
                          >
                            {customer.company_name ||
                              customer.trading_name ||
                              "Unnamed customer"}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Job Date *
                    </label>

                    <input
                      type="date"
                      value={
                        form.job_date
                      }
                      onChange={(event) =>
                        updateField(
                          "job_date",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Job Type
                    </label>

                    <input
                      value={
                        form.job_type
                      }
                      onChange={(event) =>
                        updateField(
                          "job_type",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Skip Collection"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Starting Status
                    </label>

                    <select
                      value={
                        form.status ===
                        "In Progress"
                          ? "In Progress"
                          : "Pending"
                      }
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="In Progress">
                        In Progress
                      </option>
                    </select>

                    <p className="mt-2 text-xs text-charcoal-400">
                      A job cannot be manually set to Completed.
                    </p>
                  </div>

                </div>

              </section>

              {/* ADDRESSES */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Addresses
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Collection Address
                    </label>

                    <textarea
                      rows={3}
                      value={
                        form.collection_address
                      }
                      onChange={(event) =>
                        updateField(
                          "collection_address",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Delivery / Disposal Address
                    </label>

                    <textarea
                      rows={3}
                      value={
                        form.delivery_address
                      }
                      onChange={(event) =>
                        updateField(
                          "delivery_address",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>

              </section>

              {/* ASSIGNMENT */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Assignment
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Employee / Driver
                    </label>

                    <select
                      value={
                        form.assigned_employee_id
                      }
                      onChange={(event) =>
                        updateField(
                          "assigned_employee_id",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="">
                        No employee assigned
                      </option>

                      {employees.map(
                        (employee) => (
                          <option
                            key={
                              employee.id
                            }
                            value={
                              employee.id
                            }
                          >
                            {employee.first_name}{" "}
                            {employee.last_name}{" "}
                            (
                            {
                              employee.employee_number
                            }
                            )
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Contractor
                    </label>

                    <select
                      value={
                        form.contractor_id
                      }
                      onChange={(event) =>
                        updateField(
                          "contractor_id",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="">
                        No contractor assigned
                      </option>

                      {contractors.map(
                        (contractor) => (
                          <option
                            key={
                              contractor.id
                            }
                            value={
                              contractor.id
                            }
                          >
                            {contractor.company_name ||
                              contractor.trading_name ||
                              "Unnamed contractor"}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Link Invoice
                    </label>

                    <select
                      value={
                        form.invoice_id
                      }
                      onChange={(event) =>
                        updateField(
                          "invoice_id",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
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
                        .map(
                          (invoice) => (
                            <option
                              key={
                                invoice.id
                              }
                              value={
                                invoice.id
                              }
                            >
                              {
                                invoice.invoice_number
                              }{" "}
                              — R{" "}
                              {Number(
                                invoice.total ||
                                  0
                              ).toLocaleString(
                                "en-ZA",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                            </option>
                          )
                        )}
                    </select>
                  </div>

                </div>

                <p className="mt-3 text-xs text-charcoal-500">
                  Assign either an employee/driver or a contractor to the job.
                </p>

              </section>

              {/* DESCRIPTION */}

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Description & Notes
                </h3>

                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Description
                    </label>

                    <textarea
                      rows={3}
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        updateField(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Describe the job..."
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Notes
                    </label>

                    <textarea
                      rows={3}
                      value={
                        form.notes
                      }
                      onChange={(event) =>
                        updateField(
                          "notes",
                          event.target.value
                        )
                      }
                      placeholder="Additional job notes..."
                      className="w-full resize-none rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>

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
                onClick={saveJob}
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
                    <BriefcaseBusiness className="h-4 w-4" />
                    {editingJob
                      ? "Update Job"
                      : "Save Job"}
                  </>
                )}
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            JOB LIST
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

          <div className="border-b border-charcoal-100 p-6">

            <h2 className="text-lg font-semibold text-charcoal-900">
              Job List
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Jobs registered in Skip Co Business Manager.
            </p>

          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

              <span className="ml-3 text-sm text-charcoal-500">
                Loading jobs...
              </span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal-50">
                <BriefcaseBusiness className="h-6 w-6 text-charcoal-400" />
              </div>

              <h3 className="text-base font-semibold text-charcoal-900">
                No jobs yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500">
                Add your first job to start managing your operations.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-800"
              >
                <Plus className="h-4 w-4" />
                Add Job
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left">

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Job
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Date
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Assigned To
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Contractor
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Invoice
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Certificate
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Job Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100">

                  {jobs.map((job) => {
                    const certificate =
                      getCertificate(job.id);

                    const certificateComplete =
                      isCertificateCompleted(
                        job.id
                      );

                    const certificateLabel =
                      getCertificateLabel(
                        job
                      );

                    const certificateDescription =
                      getCertificateDescription(
                        job
                      );

                    return (
                      <tr
                        key={job.id}
                        className="transition hover:bg-charcoal-50/50"
                      >

                        {/* JOB */}

                        <td className="px-6 py-4">

                          <div className="text-sm font-semibold text-charcoal-900">
                            {job.job_number}
                          </div>

                          {job.job_type && (
                            <div className="mt-1 text-xs text-charcoal-500">
                              {job.job_type}
                            </div>
                          )}

                        </td>

                        {/* CUSTOMER */}

                        <td className="px-6 py-4 text-sm text-charcoal-700">
                          {getCustomerName(
                            job.customer_id
                          )}
                        </td>

                        {/* DATE */}

                        <td className="px-6 py-4 text-sm text-charcoal-600">
                          {formatDate(
                            job.job_date
                          )}
                        </td>

                        {/* EMPLOYEE */}

                        <td className="px-6 py-4 text-sm text-charcoal-700">
                          {getEmployeeName(
                            job.assigned_employee_id
                          )}
                        </td>

                        {/* CONTRACTOR */}

                        <td className="px-6 py-4 text-sm text-charcoal-700">
                          {getContractorName(
                            job.contractor_id
                          )}
                        </td>

                        {/* INVOICE */}

                        <td className="px-6 py-4 text-sm text-charcoal-700">
                          {getInvoiceNumber(
                            job.invoice_id
                          )}
                        </td>

                        {/* CERTIFICATE */}

                        <td className="px-6 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              openCertificate(
                                job
                              )
                            }
                            className={`group flex min-w-[190px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                              certificateComplete
                                ? "border-green-200 bg-green-50 hover:bg-green-100"
                                : certificate?.client_signature
                                  ? "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                                  : "border-charcoal-200 bg-white hover:border-[#20AEB8] hover:bg-cyan-50"
                            }`}
                          >

                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                certificateComplete
                                  ? "bg-green-100 text-green-600"
                                  : certificate?.client_signature
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-charcoal-100 text-charcoal-500 group-hover:bg-cyan-100 group-hover:text-[#20AEB8]"
                              }`}
                            >
                              {certificateComplete ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <FileCheck2 className="h-4 w-4" />
                              )}
                            </div>

                            <div className="min-w-0">

                              <p
                                className={`truncate text-xs font-semibold ${
                                  certificateComplete
                                    ? "text-green-700"
                                    : certificate?.client_signature
                                      ? "text-yellow-700"
                                      : "text-charcoal-700"
                                }`}
                              >
                                {
                                  certificateLabel
                                }
                              </p>

                              <p className="mt-0.5 truncate text-[11px] text-charcoal-400">
                                {
                                  certificateDescription
                                }
                              </p>

                            </div>

                          </button>

                        </td>

                        {/* JOB STATUS */}

                        <td className="px-6 py-4">

                          {job.completed &&
                          certificateComplete ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                              <Check className="h-3.5 w-3.5" />
                              Completed
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                certificate?.client_signature
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              <span className="h-3.5 w-3.5 rounded-full border border-current" />

                              {certificate?.client_signature
                                ? "In Progress"
                                : job.status ===
                                    "Pending"
                                  ? "Pending"
                                  : "In Progress"}
                            </span>
                          )}

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-1">

                            <button
                              type="button"
                              onClick={() =>
                                openCertificate(
                                  job
                                )
                              }
                              className="rounded-lg p-2 text-charcoal-400 hover:bg-cyan-50 hover:text-[#20AEB8]"
                              title="Open disposal certificate"
                            >
                              <FileCheck2 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  job
                                )
                              }
                              className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-900"
                              title="Edit job"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteJob(
                                  job
                                )
                              }
                              disabled={
                                Boolean(
                                  certificate
                                )
                              }
                              className="rounded-lg p-2 text-charcoal-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                              title={
                                certificate
                                  ? "Jobs with certificates cannot be deleted"
                                  : "Delete job"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </DashboardShell>
  );
}