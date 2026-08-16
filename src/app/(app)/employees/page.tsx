"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  physical_address: string | null;
  job_title: string | null;
  department: string | null;
  employment_start_date: string | null;
  employment_status: string;
  pay_type: string;
  hourly_rate: number | null;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  branch_code: string | null;
  account_type: string | null;
  tax_number: string | null;
  notes: string | null;
}

interface EmployeeForm {
  first_name: string;
  last_name: string;
  id_number: string;
  phone: string;
  email: string;
  physical_address: string;
  job_title: string;
  department: string;
  employment_start_date: string;
  employment_status: string;
  pay_type: string;
  hourly_rate: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code: string;
  account_type: string;
  tax_number: string;
  notes: string;
}

const EMPTY_FORM: EmployeeForm = {
  first_name: "",
  last_name: "",
  id_number: "",
  phone: "",
  email: "",
  physical_address: "",
  job_title: "",
  department: "",
  employment_start_date: "",
  employment_status: "Active",
  pay_type: "Hourly",
  hourly_rate: "",
  bank_name: "",
  account_holder: "",
  account_number: "",
  branch_code: "",
  account_type: "",
  tax_number: "",
  notes: "",
};

export default function EmployeesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [form, setForm] = useState<EmployeeForm>({
    ...EMPTY_FORM,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("employees")
      .select("*")
      .order("first_name", { ascending: true });

    if (loadError) {
      console.error("Employee loading error:", loadError);

      setError(`Unable to load employees: ${loadError.message}`);
      setEmployees([]);
    } else {
      setEmployees((data ?? []) as Employee[]);
    }

    setLoading(false);
  }

  function updateField(
    field: keyof EmployeeForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddForm() {
    setEditingEmployee(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(employee: Employee) {
    setEditingEmployee(employee);

    setForm({
      first_name: employee.first_name ?? "",
      last_name: employee.last_name ?? "",
      id_number: employee.id_number ?? "",
      phone: employee.phone ?? "",
      email: employee.email ?? "",
      physical_address: employee.physical_address ?? "",
      job_title: employee.job_title ?? "",
      department: employee.department ?? "",
      employment_start_date:
        employee.employment_start_date ?? "",
      employment_status:
        employee.employment_status ?? "Active",
      pay_type: "Hourly",
      hourly_rate:
        employee.hourly_rate != null
          ? String(employee.hourly_rate)
          : "",
      bank_name: employee.bank_name ?? "",
      account_holder: employee.account_holder ?? "",
      account_number: employee.account_number ?? "",
      branch_code: employee.branch_code ?? "",
      account_type: employee.account_type ?? "",
      tax_number: employee.tax_number ?? "",
      notes: employee.notes ?? "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingEmployee(null);
    setForm({ ...EMPTY_FORM });
    setError("");
  }

  function generateEmployeeNumber() {
    const timestamp = Date.now().toString().slice(-8);

    return `EMP-${timestamp}`;
  }

  async function saveEmployee() {
    setError("");
    setSuccess("");

    if (!form.first_name.trim()) {
      setError("Please enter the employee's first name.");
      return;
    }

    if (!form.last_name.trim()) {
      setError("Please enter the employee's last name.");
      return;
    }

    if (!form.hourly_rate.trim()) {
      setError("Please enter the employee's hourly rate.");
      return;
    }

    const hourlyRate = Number(form.hourly_rate);

    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      setError("Please enter a valid hourly rate.");
      return;
    }

    setSaving(true);

    const employeeData = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),

      id_number: form.id_number.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      physical_address:
        form.physical_address.trim() || null,

      job_title: form.job_title.trim() || null,
      department: form.department.trim() || null,

      employment_start_date:
        form.employment_start_date || null,

      employment_status: form.employment_status,

      pay_type: "Hourly",

      hourly_rate: hourlyRate,

      bank_name: form.bank_name.trim() || null,
      account_holder:
        form.account_holder.trim() || null,
      account_number:
        form.account_number.trim() || null,
      branch_code:
        form.branch_code.trim() || null,
      account_type:
        form.account_type.trim() || null,

      tax_number:
        form.tax_number.trim() || null,

      notes: form.notes.trim() || null,
    };

    if (editingEmployee) {
      const { error: updateError } = await supabase
        .from("employees")
        .update(employeeData)
        .eq("id", editingEmployee.id);

      if (updateError) {
        console.error(
          "Employee update error:",
          updateError
        );

        setError(
          `Unable to update employee: ${updateError.message}`
        );

        setSaving(false);
        return;
      }

      setSuccess("Employee updated successfully.");
    } else {
      const employeeNumber = generateEmployeeNumber();

      const { error: insertError } = await supabase
        .from("employees")
        .insert({
          employee_number: employeeNumber,
          ...employeeData,
        });

      if (insertError) {
        console.error(
          "Employee save error:",
          insertError
        );

        setError(
          `Unable to save employee: ${insertError.message}`
        );

        setSaving(false);
        return;
      }

      setSuccess(
        `Employee ${employeeNumber} added successfully.`
      );
    }

    setSaving(false);
    setShowForm(false);
    setEditingEmployee(null);
    setForm({ ...EMPTY_FORM });

    await loadEmployees();
  }

  async function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("employees")
      .delete()
      .eq("id", employee.id);

    if (deleteError) {
      console.error(
        "Employee delete error:",
        deleteError
      );

      setError(
        `Unable to delete employee: ${deleteError.message}`
      );

      return;
    }

    setSuccess(
      `${employee.first_name} ${employee.last_name} was deleted.`
    );

    await loadEmployees();
  }

  function formatCurrency(value: number | null) {
    return `R ${Number(value || 0).toLocaleString(
      "en-ZA",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    const parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    const [year, month, day] = parts;

    return `${day}/${month}/${year}`;
  }

  const activeEmployees = employees.filter(
    (employee) =>
      employee.employment_status === "Active"
  ).length;

  const hourlyEmployees = employees.filter(
    (employee) =>
      employee.employment_status === "Active" &&
      employee.pay_type === "Hourly"
  ).length;

  const totalHourlyRates = employees
    .filter(
      (employee) =>
        employee.employment_status === "Active" &&
        employee.pay_type === "Hourly"
    )
    .reduce(
      (total, employee) =>
        total + Number(employee.hourly_rate || 0),
      0
    );

  return (
    <DashboardShell
      title="Employees"
      subtitle="Manage employees, attendance, leave and payroll"
    >
      <PageHeader
        title="Employees"
        description="Manage employee information, employment details and hourly payroll information."
        icon={BriefcaseBusiness}
        action={{
          label: "Add Employee",
          href: "#",
          onClick: openAddForm,
        }}
      />

      <div className="space-y-6">

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Total Employees
            </p>

            <p className="mt-2 text-2xl font-bold text-charcoal-900">
              {employees.length}
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Active Employees
            </p>

            <p className="mt-2 text-2xl font-bold text-[#20AEB8]">
              {activeEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-charcoal-500">
              Active Hourly Employees
            </p>

            <p className="mt-2 text-2xl font-bold text-charcoal-900">
              {hourlyEmployees}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Combined hourly rates:{" "}
              {formatCurrency(totalHourlyRates)}
            </p>
          </div>

        </div>

        {!showForm && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal-800"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  {editingEmployee
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Enter the employee&apos;s information below.
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

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Personal Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      First Name *
                    </label>

                    <input
                      value={form.first_name}
                      onChange={(event) =>
                        updateField(
                          "first_name",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Last Name *
                    </label>

                    <input
                      value={form.last_name}
                      onChange={(event) =>
                        updateField(
                          "last_name",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      ID / Passport Number
                    </label>

                    <input
                      value={form.id_number}
                      onChange={(event) =>
                        updateField(
                          "id_number",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Phone
                    </label>

                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value
                        )
                      }
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
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Physical Address
                    </label>

                    <input
                      value={form.physical_address}
                      onChange={(event) =>
                        updateField(
                          "physical_address",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>

              </section>

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Employment Details
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Job Title
                    </label>

                    <input
                      value={form.job_title}
                      onChange={(event) =>
                        updateField(
                          "job_title",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Driver"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Department
                    </label>

                    <input
                      value={form.department}
                      onChange={(event) =>
                        updateField(
                          "department",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Operations"
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={form.employment_start_date}
                      onChange={(event) =>
                        updateField(
                          "employment_start_date",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Employment Status
                    </label>

                    <select
                      value={form.employment_status}
                      onChange={(event) =>
                        updateField(
                          "employment_status",
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

                      <option value="Terminated">
                        Terminated
                      </option>

                      <option value="On Leave">
                        On Leave
                      </option>
                    </select>
                  </div>

                </div>

              </section>

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Payroll Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Pay Type
                    </label>

                    <input
                      value="Hourly"
                      disabled
                      className="w-full rounded-lg border border-charcoal-200 bg-charcoal-50 px-3 py-2.5 text-sm text-charcoal-600"
                    />

                    <p className="mt-1 text-xs text-charcoal-500">
                      All employees are paid according to hours worked.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Hourly Rate *
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-charcoal-500">
                        R
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.hourly_rate}
                        onChange={(event) =>
                          updateField(
                            "hourly_rate",
                            event.target.value
                          )
                        }
                        placeholder="e.g. 45.00"
                        className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                      />
                    </div>

                    <p className="mt-1 text-xs text-charcoal-500">
                      This is the employee&apos;s normal hourly rate.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Tax Number
                    </label>

                    <input
                      value={form.tax_number}
                      onChange={(event) =>
                        updateField(
                          "tax_number",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>

              </section>

              <section>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Banking Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Bank Name
                    </label>

                    <input
                      value={form.bank_name}
                      onChange={(event) =>
                        updateField(
                          "bank_name",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Account Holder
                    </label>

                    <input
                      value={form.account_holder}
                      onChange={(event) =>
                        updateField(
                          "account_holder",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Account Number
                    </label>

                    <input
                      value={form.account_number}
                      onChange={(event) =>
                        updateField(
                          "account_number",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Branch Code
                    </label>

                    <input
                      value={form.branch_code}
                      onChange={(event) =>
                        updateField(
                          "branch_code",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Account Type
                    </label>

                    <select
                      value={form.account_type}
                      onChange={(event) =>
                        updateField(
                          "account_type",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="">
                        Select account type
                      </option>

                      <option value="Cheque">
                        Cheque
                      </option>

                      <option value="Savings">
                        Savings
                      </option>

                      <option value="Current">
                        Current
                      </option>
                    </select>
                  </div>

                </div>

              </section>

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
                  placeholder="Additional employee notes..."
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />

              </section>

            </div>

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
                onClick={() => void saveEmployee()}
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

                    {editingEmployee
                      ? "Update Employee"
                      : "Save Employee"}
                  </>
                )}
              </button>

            </div>

          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

          <div className="border-b border-charcoal-100 p-6">

            <h2 className="text-lg font-semibold text-charcoal-900">
              Employee List
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Employees registered in Skip Co Business Manager.
            </p>

          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">

              <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

              <span className="ml-3 text-sm text-charcoal-500">
                Loading employees...
              </span>

            </div>
          ) : employees.length === 0 ? (

            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal-50">
                <BriefcaseBusiness className="h-6 w-6 text-charcoal-400" />
              </div>

              <h3 className="text-base font-semibold text-charcoal-900">
                No employees yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500">
                Add your first employee to start managing your staff, attendance, leave and payroll.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-800"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left">

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Employee
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Position
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Start Date
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Hourly Rate
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

                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-charcoal-50/50"
                    >

                      <td className="px-6 py-4">

                        <div className="text-sm font-semibold text-charcoal-900">
                          {employee.first_name}{" "}
                          {employee.last_name}
                        </div>

                        <div className="mt-1 text-xs text-charcoal-500">
                          {employee.employee_number}
                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <div className="text-sm text-charcoal-700">
                          {employee.job_title || "—"}
                        </div>

                        {employee.department && (
                          <div className="mt-1 text-xs text-charcoal-500">
                            {employee.department}
                          </div>
                        )}

                      </td>

                      <td className="px-6 py-4 text-sm text-charcoal-600">
                        {formatDate(
                          employee.employment_start_date
                        )}
                      </td>

                      <td className="px-6 py-4">

                        <div className="text-sm font-semibold text-charcoal-900">
                          {formatCurrency(
                            employee.hourly_rate
                          )}
                        </div>

                        <div className="mt-1 text-xs text-charcoal-500">
                          per hour
                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            employee.employment_status ===
                            "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-charcoal-100 text-charcoal-600"
                          }`}
                        >
                          {employee.employment_status}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(employee)
                            }
                            className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-900"
                            title="Edit employee"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void deleteEmployee(employee)
                            }
                            className="rounded-lg p-2 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    </DashboardShell>
  );
}