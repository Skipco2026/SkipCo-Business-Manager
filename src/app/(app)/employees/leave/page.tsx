"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  employment_start_date: string | null;
  employment_status: string;
}

interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string | null;
}

type LeaveType =
  | "Annual"
  | "Sick"
  | "Family Responsibility"
  | "Maternity"
  | "Parental";

const LEAVE_TYPES: LeaveType[] = [
  "Annual",
  "Sick",
  "Family Responsibility",
  "Maternity",
  "Parental",
];

const STATUS_OPTIONS = [
  "Pending",
  "Approved",
  "Declined",
];

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calculateDays(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  if (end < start) {
    return 0;
  }

  const difference =
    end.getTime() - start.getTime();

  return (
    Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ) + 1
  );
}

/* =========================================================
   EMPLOYEE SERVICE PERIOD
========================================================= */

function getDaysWorked(
  startDate: string | null
) {
  if (!startDate) {
    return 0;
  }

  const start = new Date(
    `${startDate}T00:00:00`
  );

  const today = new Date();

  if (
    Number.isNaN(start.getTime()) ||
    today < start
  ) {
    return 0;
  }

  const difference =
    today.getTime() - start.getTime();

  return Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );
}

function getMonthsWorked(
  startDate: string | null
) {
  if (!startDate) {
    return 0;
  }

  const start = new Date(
    `${startDate}T00:00:00`
  );

  const today = new Date();

  if (
    Number.isNaN(start.getTime()) ||
    today < start
  ) {
    return 0;
  }

  let months =
    (today.getFullYear() -
      start.getFullYear()) *
      12 +
    (today.getMonth() -
      start.getMonth());

  if (today.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

/* =========================================================
   PROBATION
========================================================= */

function getProbationEndDate(
  startDate: string | null
) {
  if (!startDate) {
    return null;
  }

  const date = new Date(
    `${startDate}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setMonth(date.getMonth() + 3);

  return date;
}

function isWithinProbation(
  startDate: string | null
) {
  const probationEnd =
    getProbationEndDate(startDate);

  if (!probationEnd) {
    return false;
  }

  return new Date() < probationEnd;
}

/* =========================================================
   LEAVE ENTITLEMENTS
========================================================= */

function calculateAnnualEntitlement(
  employee: Employee | null
) {
  if (!employee) {
    return 0;
  }

  /*
   * Existing business rule:
   * Annual leave is accrued at 1 day
   * for every 17 days worked.
   */

  const daysWorked = getDaysWorked(
    employee.employment_start_date
  );

  if (daysWorked <= 0) {
    return 0;
  }

  return Number(
    (daysWorked / 17).toFixed(2)
  );
}

function calculateSickEntitlement(
  employee: Employee | null
) {
  if (!employee) {
    return 0;
  }

  /*
   * Existing business rule:
   * Sick leave accrues at 1 day
   * for every 26 days worked.
   */

  const daysWorked = getDaysWorked(
    employee.employment_start_date
  );

  if (daysWorked <= 0) {
    return 0;
  }

  return Number(
    (daysWorked / 26).toFixed(2)
  );
}

function getLeaveEntitlement(
  employee: Employee | null,
  leaveType: LeaveType
) {
  switch (leaveType) {
    case "Annual":
      return calculateAnnualEntitlement(
        employee
      );

    case "Sick":
      return calculateSickEntitlement(
        employee
      );

    case "Family Responsibility":
      return 3;

    case "Maternity":
      return 4;

    case "Parental":
      return 10;

    default:
      return 0;
  }
}

/* =========================================================
   STATUS
========================================================= */

function getStatusClasses(status: string) {
  switch (status) {
    case "Approved":
      return "bg-green-50 text-green-700";

    case "Declined":
      return "bg-red-50 text-red-700";

    default:
      return "bg-yellow-50 text-yellow-700";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function EmployeeLeavePage() {
  const supabase = createClient();

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [leaveRecords, setLeaveRecords] =
    useState<LeaveRecord[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [leaveType, setLeaveType] =
    useState<LeaveType>("Annual");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [status, setStatus] =
    useState("Pending");

  /* =====================================================
     LOAD EMPLOYEES
  ===================================================== */

  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoading(true);
        setError("");

        const {
          data,
          error: employeeError,
        } = await supabase
          .from("employees")
          .select(
            `
              id,
              employee_number,
              first_name,
              last_name,
              employment_start_date,
              employment_status
            `
          )
          .order("first_name", {
            ascending: true,
          });

        if (employeeError) {
          throw employeeError;
        }

        const employeeList =
          (data ?? []) as Employee[];

        setEmployees(employeeList);

        if (
          employeeList.length > 0 &&
          !selectedEmployeeId
        ) {
          setSelectedEmployeeId(
            employeeList[0].id
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load employees."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  /* =====================================================
     LOAD LEAVE RECORDS
  ===================================================== */

  useEffect(() => {
    async function loadLeaveRecords() {
      if (!selectedEmployeeId) {
        setLeaveRecords([]);
        return;
      }

      try {
        setError("");

        const {
          data,
          error: leaveError,
        } = await supabase
          .from("employee_leave")
          .select("*")
          .eq(
            "employee_id",
            selectedEmployeeId
          )
          .order("start_date", {
            ascending: false,
          });

        if (leaveError) {
          throw leaveError;
        }

        setLeaveRecords(
          (data ?? []) as LeaveRecord[]
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load leave records."
        );
      }
    }

    loadLeaveRecords();
  }, [selectedEmployeeId]);

  /* =====================================================
     SELECTED EMPLOYEE
  ===================================================== */

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          employee.id ===
          selectedEmployeeId
      ) ?? null,
    [employees, selectedEmployeeId]
  );

  /* =====================================================
     BALANCES
  ===================================================== */

  const balances = useMemo(() => {
    const approvedRecords =
      leaveRecords.filter(
        (record) =>
          record.status === "Approved"
      );

    const usedDays = (
      type: LeaveType
    ) =>
      approvedRecords
        .filter(
          (record) =>
            record.leave_type === type
        )
        .reduce(
          (total, record) =>
            total +
            Number(record.days || 0),
          0
        );

    const annualEntitlement =
      calculateAnnualEntitlement(
        selectedEmployee
      );

    const sickEntitlement =
      calculateSickEntitlement(
        selectedEmployee
      );

    const annualUsed =
      usedDays("Annual");

    const sickUsed =
      usedDays("Sick");

    const familyUsed =
      usedDays(
        "Family Responsibility"
      );

    const parentalUsed =
      usedDays("Parental");

    /*
     * Maternity is stored as leave days
     * in the database, but displayed as
     * months in the UI.
     *
     * 4 months is therefore treated as
     * 120 calendar days for the balance.
     */

    const maternityEntitlement = 120;

    const maternityUsed =
      usedDays("Maternity");

    return {
      annual: {
        entitlement: annualEntitlement,
        used: annualUsed,
        remaining: Math.max(
          0,
          annualEntitlement -
            annualUsed
        ),
      },

      sick: {
        entitlement: sickEntitlement,
        used: sickUsed,
        remaining: Math.max(
          0,
          sickEntitlement -
            sickUsed
        ),
      },

      family: {
        entitlement: 3,
        used: familyUsed,
        remaining: Math.max(
          0,
          3 - familyUsed
        ),
      },

      maternity: {
        entitlement:
          maternityEntitlement,
        used: maternityUsed,
        remaining: Math.max(
          0,
          maternityEntitlement -
            maternityUsed
        ),
      },

      parental: {
        entitlement: 10,
        used: parentalUsed,
        remaining: Math.max(
          0,
          10 - parentalUsed
        ),
      },
    };
  }, [
    leaveRecords,
    selectedEmployee,
  ]);

  /* =====================================================
     REQUESTED DAYS
  ===================================================== */

  const requestedDays = calculateDays(
    startDate,
    endDate
  );

  /* =====================================================
     CURRENT BALANCE
  ===================================================== */

  function getCurrentBalance(
    type: LeaveType
  ) {
    switch (type) {
      case "Annual":
        return balances.annual.remaining;

      case "Sick":
        return balances.sick.remaining;

      case "Family Responsibility":
        return balances.family.remaining;

      case "Maternity":
        return balances.maternity.remaining;

      case "Parental":
        return balances.parental.remaining;

      default:
        return 0;
    }
  }

  /* =====================================================
     RESET FORM
  ===================================================== */

  function resetForm() {
    setLeaveType("Annual");
    setStartDate("");
    setEndDate("");
    setReason("");
    setNotes("");
    setStatus("Pending");
  }

  /* =====================================================
     ADD LEAVE
  ===================================================== */

  async function handleAddLeave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedEmployeeId) {
      setError(
        "Please select an employee."
      );
      return;
    }

    if (!selectedEmployee) {
      setError(
        "The selected employee could not be found."
      );
      return;
    }

    if (!startDate || !endDate) {
      setError(
        "Please select both the start and end dates."
      );
      return;
    }

    if (requestedDays <= 0) {
      setError(
        "The end date must be on or after the start date."
      );
      return;
    }

    /*
     * Annual leave during the existing
     * 3-month probation rule.
     */

    if (
      leaveType === "Annual" &&
      isWithinProbation(
        selectedEmployee.employment_start_date
      )
    ) {
      setError(
        "Annual leave cannot be taken during the first 3 months of probation."
      );
      return;
    }

    /*
     * Family responsibility leave
     * requires the employee to have
     * completed at least 4 months.
     */

    if (
      leaveType ===
        "Family Responsibility" &&
      getMonthsWorked(
        selectedEmployee.employment_start_date
      ) < 4
    ) {
      setError(
        "Family responsibility leave is only available after 4 months of employment."
      );
      return;
    }

    /*
     * Maternity leave is limited to
     * 4 months / 120 calendar days.
     */

    if (
      leaveType === "Maternity" &&
      requestedDays > 120
    ) {
      setError(
        "Maternity leave cannot exceed 4 months."
      );
      return;
    }

    const currentBalance =
      getCurrentBalance(leaveType);

    /*
     * Only enforce the balance when
     * the leave is being immediately
     * approved.
     *
     * Pending requests may exceed the
     * current balance because they still
     * need to be reviewed.
     */

    if (
      status === "Approved" &&
      requestedDays > currentBalance
    ) {
      const unit =
        leaveType === "Maternity"
          ? "days"
          : "days";

      setError(
        `The employee does not have enough ${leaveType.toLowerCase()} leave remaining. Available: ${currentBalance.toFixed(
          2
        )} ${unit}.`
      );

      return;
    }

    try {
      setSaving(true);

      const { data, error: insertError } =
        await supabase
          .from("employee_leave")
          .insert({
            employee_id:
              selectedEmployeeId,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            days: requestedDays,
            reason:
              reason.trim() || null,
            status,
            notes:
              notes.trim() || null,
          })
          .select()
          .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setLeaveRecords((current) => [
          data as LeaveRecord,
          ...current,
        ]);
      }

      resetForm();
      setShowForm(false);

      setSuccess(
        "Leave record added successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to add leave."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE LEAVE
  ===================================================== */

  async function handleDeleteLeave(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this leave record?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const {
        error: deleteError,
      } = await supabase
        .from("employee_leave")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setLeaveRecords((current) =>
        current.filter(
          (record) =>
            record.id !== id
        )
      );

      setSuccess(
        "Leave record deleted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete leave."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <DashboardShell
        title="Employee Leave"
        subtitle="Manage employee leave and balances"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-charcoal-500">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Loading employees...
          </div>
        </div>
      </DashboardShell>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <DashboardShell
      title="Employee Leave"
      subtitle="Manage employee leave and balances"
    >
      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                <CalendarDays size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-charcoal-900">
                  Employee Leave
                </h1>

                <p className="text-sm text-charcoal-500">
                  Track leave balances and employee leave records.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            disabled={!selectedEmployee}
            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add Leave
          </button>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* EMPLOYEE SELECTOR */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-charcoal-700">
            Employee
          </label>

          <div className="relative max-w-xl">
            <select
              value={selectedEmployeeId}
              onChange={(event) =>
                setSelectedEmployeeId(
                  event.target.value
                )
              }
              className="w-full appearance-none rounded-lg border border-charcoal-200 bg-white px-4 py-3 pr-10 text-sm text-charcoal-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              {employees.length === 0 && (
                <option value="">
                  No employees found
                </option>
              )}

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

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400"
            />
          </div>

          {selectedEmployee && (
            <div className="mt-4 rounded-lg bg-charcoal-50 px-4 py-3 text-sm text-charcoal-600">
              <strong>
                {selectedEmployee.first_name}{" "}
                {selectedEmployee.last_name}
              </strong>

              {selectedEmployee.employment_start_date && (
                <>
                  {" "}· Started{" "}
                  {formatDate(
                    selectedEmployee.employment_start_date
                  )}
                </>
              )}

              {isWithinProbation(
                selectedEmployee.employment_start_date
              ) && (
                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                  Probation
                </span>
              )}
            </div>
          )}
        </div>

        {/* BALANCE CARDS */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <BalanceCard
            title="Annual"
            entitlement={
              balances.annual.entitlement
            }
            used={balances.annual.used}
            remaining={
              balances.annual.remaining
            }
            suffix="days"
          />

          <BalanceCard
            title="Sick"
            entitlement={
              balances.sick.entitlement
            }
            used={balances.sick.used}
            remaining={
              balances.sick.remaining
            }
            suffix="days"
          />

          <BalanceCard
            title="Family Responsibility"
            entitlement={
              balances.family.entitlement
            }
            used={balances.family.used}
            remaining={
              balances.family.remaining
            }
            suffix="days"
          />

          <BalanceCard
            title="Maternity"
            entitlement={4}
            used={
              Number(
                (
                  balances.maternity.used /
                  30
                ).toFixed(2)
              )
            }
            remaining={Number(
              (
                balances.maternity.remaining /
                30
              ).toFixed(2)
            )}
            suffix="months"
          />

          <BalanceCard
            title="Parental"
            entitlement={
              balances.parental.entitlement
            }
            used={balances.parental.used}
            remaining={
              balances.parental.remaining
            }
            suffix="days"
          />

        </div>

        {/* ADD LEAVE FORM */}

        {showForm && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">
                  Add Leave
                </h2>

                <p className="text-sm text-charcoal-500">
                  Record leave for the selected employee.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-lg p-2 text-charcoal-400 transition hover:bg-charcoal-50 hover:text-charcoal-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAddLeave}
              className="space-y-5"
            >

              <div className="grid gap-5 md:grid-cols-2">

                {/* LEAVE TYPE */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Leave Type
                  </label>

                  <select
                    value={leaveType}
                    onChange={(event) =>
                      setLeaveType(
                        event.target.value as LeaveType
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    {LEAVE_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* START */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    required
                  />
                </div>

                {/* END */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    min={
                      startDate ||
                      undefined
                    }
                    onChange={(event) =>
                      setEndDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    required
                  />
                </div>

              </div>

              {/* DAYS */}

              <div className="rounded-lg bg-cyan-50 p-4">

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-cyan-800">
                    Leave Days
                  </span>

                  <span className="text-xl font-bold text-cyan-700">
                    {requestedDays}
                  </span>
                </div>

                {selectedEmployee && (
                  <p className="mt-1 text-xs text-cyan-700">
                    Available{" "}
                    {leaveType.toLowerCase()}{" "}
                    balance:{" "}
                    {leaveType === "Annual"
                      ? balances.annual.remaining
                      : leaveType === "Sick"
                      ? balances.sick.remaining
                      : leaveType ===
                        "Family Responsibility"
                      ? balances.family.remaining
                      : leaveType ===
                        "Maternity"
                      ? (
                          balances.maternity
                            .remaining / 30
                        ).toFixed(2)
                      : balances.parental.remaining}{" "}
                    {leaveType === "Maternity"
                      ? "months"
                      : "days"}
                  </p>
                )}

              </div>

              {/* REASON */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Reason
                </label>

                <input
                  type="text"
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  placeholder="Reason for leave"
                  className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full resize-none rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-charcoal-100 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="rounded-lg border border-charcoal-200 px-5 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Save Leave
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* LEAVE HISTORY */}

        <div className="rounded-2xl border border-charcoal-100 bg-white shadow-sm">

          <div className="border-b border-charcoal-100 px-5 py-4">
            <h2 className="font-bold text-charcoal-900">
              Leave History
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Previous leave records for this employee.
            </p>
          </div>

          {leaveRecords.length === 0 ? (
            <div className="px-5 py-12 text-center">

              <CalendarDays
                size={35}
                className="mx-auto text-charcoal-300"
              />

              <p className="mt-3 font-medium text-charcoal-700">
                No leave records
              </p>

              <p className="mt-1 text-sm text-charcoal-500">
                Add a leave record to see it here.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">

                    <th className="px-5 py-3">
                      Leave Type
                    </th>

                    <th className="px-5 py-3">
                      Start
                    </th>

                    <th className="px-5 py-3">
                      End
                    </th>

                    <th className="px-5 py-3 text-center">
                      Days
                    </th>

                    <th className="px-5 py-3">
                      Reason
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {leaveRecords.map(
                    (record) => (
                      <tr
                        key={record.id}
                        className="border-b border-charcoal-100 last:border-0"
                      >

                        <td className="px-5 py-4 text-sm font-medium text-charcoal-900">
                          {record.leave_type}
                        </td>

                        <td className="px-5 py-4 text-sm text-charcoal-600">
                          {formatDate(
                            record.start_date
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-charcoal-600">
                          {formatDate(
                            record.end_date
                          )}
                        </td>

                        <td className="px-5 py-4 text-center text-sm font-semibold text-charcoal-900">
                          {Number(
                            record.days || 0
                          ).toFixed(2)}
                        </td>

                        <td className="max-w-[220px] px-5 py-4 text-sm text-charcoal-600">
                          {record.reason ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteLeave(
                                record.id
                              )
                            }
                            disabled={
                              deletingId ===
                              record.id
                            }
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            title="Delete leave"
                          >
                            {deletingId ===
                            record.id ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={17}
                              />
                            )}
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* LEAVE RULES */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

          <h2 className="font-bold text-charcoal-900">
            Leave Rules
          </h2>

          <div className="mt-4 grid gap-3 text-sm text-charcoal-600 md:grid-cols-2">

            <RuleCard
              title="Annual Leave"
              text="Leave accrues at 1 day for every 17 days worked. The current system also prevents annual leave during the first 3 months of probation."
            />

            <RuleCard
              title="Sick Leave"
              text="Leave accrues at 1 day for every 26 days worked."
            />

            <RuleCard
              title="Family Responsibility"
              text="The system provides 3 days and requires at least 4 months of employment before it can be approved."
            />

            <RuleCard
              title="Maternity Leave"
              text="The system allows up to 4 months of maternity leave."
            />

            <RuleCard
              title="Parental Leave"
              text="The system provides 10 consecutive days of parental leave."
              fullWidth
            />

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}

/* =========================================================
   BALANCE CARD
========================================================= */

interface BalanceCardProps {
  title: string;
  entitlement: number;
  used: number;
  remaining: number;
  suffix: string;
}

function BalanceCard({
  title,
  entitlement,
  used,
  remaining,
  suffix,
}: BalanceCardProps) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-4 shadow-sm">

      <p className="min-h-[40px] text-sm font-semibold text-charcoal-700">
        {title}
      </p>

      <div className="mt-3">

        <p className="text-2xl font-bold text-charcoal-900">
          {remaining.toFixed(2)}
        </p>

        <p className="text-xs text-charcoal-500">
          {suffix} remaining
        </p>

      </div>

      <div className="mt-4 space-y-1 text-xs text-charcoal-500">

        <div className="flex justify-between">
          <span>Entitlement</span>
          <span>
            {entitlement.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Used</span>
          <span>
            {used.toFixed(2)}
          </span>
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   RULE CARD
========================================================= */

interface RuleCardProps {
  title: string;
  text: string;
  fullWidth?: boolean;
}

function RuleCard({
  title,
  text,
  fullWidth = false,
}: RuleCardProps) {
  return (
    <div
      className={`rounded-lg bg-charcoal-50 p-3 ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >
      <strong className="text-charcoal-900">
        {title}
      </strong>

      <p className="mt-1">
        {text}
      </p>
    </div>
  );
}