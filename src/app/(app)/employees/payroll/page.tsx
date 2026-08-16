"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

type Employee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  pay_type: string | null;
  hourly_rate: number | null;
  basic_salary?: number | null;
};

type PayrollRunStatus =
  | "draft"
  | "processing"
  | "completed"
  | "approved"
  | "paid"
  | "cancelled";

type PayrollRun = {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  status: PayrollRunStatus;
  total_normal_hours: number;
  total_overtime_hours: number;
  total_gross_pay: number;
  total_paye: number;
  total_uif: number;
  total_other_deductions: number;
  total_net_pay: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PayrollItem = {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  pay_type: string | null;
  basic_salary: number;
  hourly_rate: number;
  normal_hours: number;
  overtime_hours: number;
  normal_pay: number;
  overtime_pay: number;
  gross_pay: number;
  paye: number;
  uif_employee: number;
  other_deductions: number;
  net_pay: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
};

type PayrollItemAttendance = {
  id: string;
  payroll_item_id: string;
  attendance_id: string;
  normal_hours: number;
  overtime_hours: number;
  created_at: string;
};

type PayrollRunResponse = {
  payrollRuns?: PayrollRun[];
  payroll_runs?: PayrollRun[];
  error?: string;
};

type PayrollItemsResponse = {
  payrollItems?: PayrollItem[];
  payroll_items?: PayrollItem[];
  error?: string;
};

const EMPTY_RUN_FORM = {
  payPeriodStart: "",
  payPeriodEnd: "",
  notes: "",
};

function getToday(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthStart(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function formatDate(value: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number | null | undefined): string {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(
  value: number | null | undefined,
  decimals = 2
): string {
  return Number(value || 0).toFixed(decimals);
}

function getEmployeeName(
  employee?: Employee
): string {
  if (!employee) {
    return "Unknown employee";
  }

  return `${employee.first_name} ${employee.last_name}`;
}

function statusBadge(
  status: PayrollRunStatus
): React.ReactNode {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          Draft
        </span>
      );

    case "processing":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          <Loader2 size={13} className="animate-spin" />
          Processing
        </span>
      );

    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <Check size={13} />
          Completed
        </span>
      );

    case "approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <Check size={13} />
          Approved
        </span>
      );

    case "paid":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          <DollarSign size={13} />
          Paid
        </span>
      );

    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <X size={13} />
          Cancelled
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {status}
        </span>
      );
  }
}

export default function PayrollPage() {
  const [payrollRuns, setPayrollRuns] = useState<
    PayrollRun[]
  >([]);

  const [payrollItems, setPayrollItems] = useState<
    PayrollItem[]
  >([]);

  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [selectedRun, setSelectedRun] =
    useState<PayrollRun | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [itemsLoading, setItemsLoading] =
    useState<boolean>(false);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  const [success, setSuccess] =
    useState<string>("");

  const [search, setSearch] =
    useState<string>("");

  const [showCreateRun, setShowCreateRun] =
    useState<boolean>(false);

  const [expandedRun, setExpandedRun] =
    useState<string | null>(null);

  const [form, setForm] = useState(
    EMPTY_RUN_FORM
  );

  async function loadEmployees(): Promise<void> {
    try {
      const response = await fetch(
        "/api/employees"
      );

      const data: {
        employees?: Employee[];
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load employees."
        );
      }

      setEmployees(data.employees ?? []);
    } catch (err) {
      console.error(
        "Load employees error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load employees."
      );
    }
  }

  async function loadPayrollRuns(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/payroll-runs"
      );

      const data: PayrollRunResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load payroll runs."
        );
      }

      const runs =
        data.payrollRuns ??
        data.payroll_runs ??
        [];

      setPayrollRuns(runs);

      if (
        selectedRun &&
        !runs.some(
          (run) =>
            run.id === selectedRun.id
        )
      ) {
        setSelectedRun(null);
      }
    } catch (err) {
      console.error(
        "Load payroll runs error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payroll runs."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPayrollItems(
    payrollRunId: string
  ): Promise<void> {
    try {
      setItemsLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set(
        "payrollRunId",
        payrollRunId
      );

      const response = await fetch(
        `/api/payroll-items?${params.toString()}`
      );

      const data: PayrollItemsResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load payroll items."
        );
      }

      setPayrollItems(
        data.payrollItems ??
          data.payroll_items ??
          []
      );
    } catch (err) {
      console.error(
        "Load payroll items error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payroll items."
      );
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
    void loadPayrollRuns();
  }, []);

  useEffect(() => {
    if (!selectedRun) {
      setPayrollItems([]);
      return;
    }

    void loadPayrollItems(
      selectedRun.id
    );
  }, [selectedRun?.id]);

  const filteredItems = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return payrollItems;
    }

    return payrollItems.filter(
      (item) => {
        const employee =
          item.employee;

        if (!employee) {
          return false;
        }

        const name =
          `${employee.first_name} ${employee.last_name}`.toLowerCase();

        const number =
          employee.employee_number.toLowerCase();

        return (
          name.includes(value) ||
          number.includes(value)
        );
      }
    );
  }, [payrollItems, search]);

  const summary = useMemo(() => {
    return payrollItems.reduce(
      (result, item) => {
        result.normalHours += Number(
          item.normal_hours || 0
        );

        result.overtimeHours += Number(
          item.overtime_hours || 0
        );

        result.grossPay += Number(
          item.gross_pay || 0
        );

        result.paye += Number(
          item.paye || 0
        );

        result.uif += Number(
          item.uif_employee || 0
        );

        result.otherDeductions += Number(
          item.other_deductions || 0
        );

        result.netPay += Number(
          item.net_pay || 0
        );

        return result;
      },
      {
        normalHours: 0,
        overtimeHours: 0,
        grossPay: 0,
        paye: 0,
        uif: 0,
        otherDeductions: 0,
        netPay: 0,
      }
    );
  }, [payrollItems]);

  function openCreateRun(): void {
    setError("");
    setSuccess("");

    setForm({
      payPeriodStart: getMonthStart(),
      payPeriodEnd: getToday(),
      notes: "",
    });

    setShowCreateRun(true);
  }

  async function createPayrollRun(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.payPeriodStart) {
        throw new Error(
          "Payroll period start date is required."
        );
      }

      if (!form.payPeriodEnd) {
        throw new Error(
          "Payroll period end date is required."
        );
      }

      if (
        form.payPeriodEnd <
        form.payPeriodStart
      ) {
        throw new Error(
          "Payroll period end date cannot be before the start date."
        );
      }

      const response = await fetch(
        "/api/payroll-runs",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            payPeriodStart:
              form.payPeriodStart,
            payPeriodEnd:
              form.payPeriodEnd,
            notes:
              form.notes.trim() || null,
          }),
        }
      );

      const data: {
        payrollRun?: PayrollRun;
        payroll_run?: PayrollRun;
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create payroll run."
        );
      }

      const createdRun =
        data.payrollRun ??
        data.payroll_run;

      setSuccess(
        "Payroll run created successfully."
      );

      setShowCreateRun(false);

      await loadPayrollRuns();

      if (createdRun) {
        setSelectedRun(createdRun);
      }
    } catch (err) {
      console.error(
        "Create payroll run error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create payroll run."
      );
    } finally {
      setSaving(false);
    }
  }

  async function calculatePayroll(
    run: PayrollRun
  ): Promise<void> {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/payroll-runs",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            payrollRunId: run.id,
            action: "calculate",
          }),
        }
      );

      const data: {
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to calculate payroll."
        );
      }

      setSuccess(
        "Payroll calculated successfully."
      );

      await loadPayrollRuns();

      await loadPayrollItems(run.id);

      setSelectedRun((current) =>
        current
          ? {
              ...current,
              status: "completed",
            }
          : current
      );
    } catch (err) {
      console.error(
        "Calculate payroll error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate payroll."
      );
    } finally {
      setSaving(false);
    }
  }

  async function approvePayroll(
    run: PayrollRun
  ): Promise<void> {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/payroll-runs",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            payrollRunId: run.id,
            action: "approve",
          }),
        }
      );

      const data: {
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to approve payroll."
        );
      }

      setSuccess(
        "Payroll run approved successfully."
      );

      await loadPayrollRuns();

      setSelectedRun((current) =>
        current
          ? {
              ...current,
              status: "approved",
            }
          : current
      );
    } catch (err) {
      console.error(
        "Approve payroll error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve payroll."
      );
    } finally {
      setSaving(false);
    }
  }

  async function refresh(): Promise<void> {
    setError("");
    setSuccess("");

    await loadPayrollRuns();

    if (selectedRun) {
      await loadPayrollItems(
        selectedRun.id
      );
    }
  }

  function toggleRun(run: PayrollRun): void {
    if (expandedRun === run.id) {
      setExpandedRun(null);
      return;
    }

    setExpandedRun(run.id);
    setSelectedRun(run);
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payroll
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Calculate employee wages, overtime,
            deductions and net pay.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateRun}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Calculator size={17} />
            New Payroll Run
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{success}</span>
        </div>
      )}

      {/* PAYROLL RULE */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Clock
            size={19}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="text-sm font-semibold text-blue-900">
              Payroll overtime rule
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              Approved attendance is used to
              calculate weekly hours. The first
              45 hours worked in the applicable
              work week are normal hours. Hours
              above 45 are overtime and are paid
              at 1.5 × the employee&apos;s hourly
              rate.
            </p>
          </div>
        </div>
      </div>

      {/* SELECTED RUN SUMMARY */}
      {selectedRun && (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  Payroll Run
                </h2>

                {statusBadge(
                  selectedRun.status
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {formatDate(
                  selectedRun.pay_period_start
                )}{" "}
                —{" "}
                {formatDate(
                  selectedRun.pay_period_end
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(selectedRun.status ===
                "draft" ||
                selectedRun.status ===
                  "processing") && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    calculatePayroll(
                      selectedRun
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Play size={17} />
                  )}

                  Calculate Payroll
                </button>
              )}

              {selectedRun.status ===
                "completed" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    approvePayroll(
                      selectedRun
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={17} />
                  )}

                  Approve Payroll
                </button>
              )}
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                  <Users size={20} />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Employees
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {payrollItems.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">
                  <Clock size={20} />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Normal Hours
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(
                      summary.normalHours
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
                  <Clock size={20} />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Overtime Hours
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(
                      summary.overtimeHours
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
                  <DollarSign size={20} />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Gross Pay
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      summary.grossPay
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
                  <Check size={20} />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Net Pay
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      summary.netPay
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PAYROLL ITEMS */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-bold text-gray-900">
                  Payroll Items
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Individual employee payroll
                  calculations for this run.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search employee..."
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Loading payroll items...
              </div>
            ) : filteredItems.length ===
              0 ? (
              <div className="p-12 text-center">
                <FileText
                  size={38}
                  className="mx-auto text-gray-300"
                />

                <h3 className="mt-4 font-semibold text-gray-900">
                  No payroll items
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Calculate this payroll run
                  after approved attendance
                  has been recorded.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3">
                        Employee
                      </th>

                      <th className="px-5 py-3">
                        Pay Type
                      </th>

                      <th className="px-5 py-3">
                        Normal Hours
                      </th>

                      <th className="px-5 py-3">
                        Overtime
                      </th>

                      <th className="px-5 py-3">
                        Normal Pay
                      </th>

                      <th className="px-5 py-3">
                        Overtime Pay
                      </th>

                      <th className="px-5 py-3">
                        Gross
                      </th>

                      <th className="px-5 py-3">
                        PAYE
                      </th>

                      <th className="px-5 py-3">
                        UIF
                      </th>

                      <th className="px-5 py-3">
                        Net Pay
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900">
                              {getEmployeeName(
                                item.employee
                              )}
                            </div>

                            <div className="text-xs text-gray-500">
                              {item.employee
                                ?.employee_number ??
                                "-"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-700">
                            {item.pay_type ??
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-gray-900">
                            {formatNumber(
                              item.normal_hours
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-medium text-orange-600">
                              {formatNumber(
                                item.overtime_hours
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-700">
                            {formatCurrency(
                              item.normal_pay
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-orange-600">
                            {formatCurrency(
                              item.overtime_pay
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              item.gross_pay
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-700">
                            {formatCurrency(
                              item.paye
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-700">
                            {formatCurrency(
                              item.uif_employee
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-green-700">
                            {formatCurrency(
                              item.net_pay
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                  <tfoot>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="px-5 py-4 text-sm font-bold text-gray-900"
                      >
                        Total
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {formatNumber(
                          summary.normalHours
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-orange-600">
                        {formatNumber(
                          summary.overtimeHours
                        )}
                      </td>

                      <td className="px-5 py-4">
                        -
                      </td>

                      <td className="px-5 py-4">
                        -
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {formatCurrency(
                          summary.grossPay
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {formatCurrency(
                          summary.paye
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {formatCurrency(
                          summary.uif
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-green-700">
                        {formatCurrency(
                          summary.netPay
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* PAYROLL RUN HISTORY */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <h2 className="font-bold text-gray-900">
            Payroll Runs
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Previous and current payroll periods.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
            <Loader2
              size={20}
              className="animate-spin"
            />

            Loading payroll...
          </div>
        ) : payrollRuns.length === 0 ? (
          <div className="p-12 text-center">
            <Calculator
              size={38}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 font-semibold text-gray-900">
              No payroll runs yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create your first payroll run to
              begin calculating employee pay.
            </p>

            <button
              type="button"
              onClick={openCreateRun}
              className="mt-5 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white"
            >
              New Payroll Run
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payrollRuns.map(
              (run) => {
                const isExpanded =
                  expandedRun ===
                  run.id;

                return (
                  <div
                    key={run.id}
                    className="bg-white"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleRun(run)
                      }
                      className="w-full px-5 py-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-gray-100 p-2.5">
                            <Calculator
                              size={19}
                              className="text-gray-600"
                            />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {formatDate(
                                  run.pay_period_start
                                )}{" "}
                                —{" "}
                                {formatDate(
                                  run.pay_period_end
                                )}
                              </p>

                              {statusBadge(
                                run.status
                              )}
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              Created{" "}
                              {formatDate(
                                run.created_at.substring(
                                  0,
                                  10
                                )
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-500">
                              Gross
                            </p>

                            <p className="font-semibold text-gray-900">
                              {formatCurrency(
                                run.total_gross_pay
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Net
                            </p>

                            <p className="font-semibold text-green-700">
                              {formatCurrency(
                                run.total_net_pay
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Overtime
                            </p>

                            <p className="font-semibold text-orange-600">
                              {formatNumber(
                                run.total_overtime_hours
                              )}{" "}
                              hrs
                            </p>
                          </div>

                          {isExpanded ? (
                            <ChevronUp
                              size={19}
                              className="text-gray-400"
                            />
                          ) : (
                            <ChevronDown
                              size={19}
                              className="text-gray-400"
                            />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs text-gray-500">
                              Normal Hours
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                              {formatNumber(
                                run.total_normal_hours
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Overtime Hours
                            </p>

                            <p className="mt-1 font-semibold text-orange-600">
                              {formatNumber(
                                run.total_overtime_hours
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              PAYE
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                              {formatCurrency(
                                run.total_paye
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              UIF
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                              {formatCurrency(
                                run.total_uif
                              )}
                            </p>
                          </div>
                        </div>

                        {run.notes && (
                          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-xs font-semibold text-gray-500">
                              Notes
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              {run.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRun(
                                run
                              );
                              setSearch(
                                ""
                              );
                              window.scrollTo(
                                {
                                  top: 0,
                                  behavior:
                                    "smooth",
                                }
                              );
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Open Payroll
                          </button>

                          {run.status ===
                            "draft" && (
                            <button
                              type="button"
                              disabled={
                                saving
                              }
                              onClick={() =>
                                calculatePayroll(
                                  run
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                              <Calculator
                                size={15}
                              />

                              Calculate
                            </button>
                          )}

                          {run.status ===
                            "completed" && (
                            <button
                              type="button"
                              disabled={
                                saving
                              }
                              onClick={() =>
                                approvePayroll(
                                  run
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              <Check
                                size={15}
                              />

                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* CREATE PAYROLL RUN MODAL */}
      {showCreateRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  New Payroll Run
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select the payroll period you
                  want to process.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateRun(
                    false
                  )
                }
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={createPayrollRun}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Pay Period Start
                </label>

                <input
                  type="date"
                  value={
                    form.payPeriodStart
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        payPeriodStart:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Pay Period End
                </label>

                <input
                  type="date"
                  value={
                    form.payPeriodEnd
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        payPeriodEnd:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  required
                />
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      How payroll works
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Payroll will use approved
                      attendance within this
                      period. Weekly hours are
                      evaluated against the
                      45-hour threshold and
                      overtime is calculated at
                      1.5 × the employee&apos;s
                      hourly rate.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Optional payroll notes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateRun(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Calculator
                      size={17}
                    />
                  )}

                  Create Payroll Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}