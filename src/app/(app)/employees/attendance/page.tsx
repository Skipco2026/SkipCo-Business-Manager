"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";

type AttendanceStatus =
  | "submitted"
  | "approved"
  | "rejected";

type Employee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  employment_status: string;
  pay_type: string;
  hourly_rate: number | null;
};

type AttendanceRecord = {
  id: string;
  employee_id: string;
  attendance_date: string;
  clock_in: string;
  break_start: string | null;
  break_end: string | null;
  clock_out: string;
  normal_hours: number;
  overtime_hours: number;
  employee_notes: string | null;
  status: AttendanceStatus;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  management_notes: string | null;

  employee:
    | Employee
    | Employee[]
    | null;
};

type Profile = {
  id: string;
  role: string;
  is_active: boolean;
};

type AttendanceForm = {
  employeeId: string;
  attendanceDate: string;
  clockIn: string;
  breakStart: string;
  breakEnd: string;
  clockOut: string;
  employeeNotes: string;
};

const EMPTY_FORM: AttendanceForm = {
  employeeId: "",
  attendanceDate: "",
  clockIn: "",
  breakStart: "",
  breakEnd: "",
  clockOut: "",
  employeeNotes: "",
};

/*
 * IMPORTANT:
 *
 * Your route.ts is located inside:
 *
 * app/(app)/employees/Attendance/route.ts
 *
 * Therefore the API endpoint used below is:
 *
 * /api/employees/Attendance
 *
 * If your actual API folder is lowercase "attendance",
 * change this constant to:
 *
 * /api/employees/attendance
 */
const ATTENDANCE_API =
  "/api/employees/Attendance";

function getEmployee(
  record: AttendanceRecord
): Employee | null {
  if (!record.employee) {
    return null;
  }

  if (Array.isArray(record.employee)) {
    return record.employee[0] ?? null;
  }

  return record.employee;
}

function getToday(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) return "—";

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(
  value: string | null | undefined
): string {
  if (!value) return "—";

  return value.slice(0, 5);
}

function calculateHours(
  clockIn: string,
  breakStart: string,
  breakEnd: string,
  clockOut: string
) {
  if (!clockIn || !clockOut) {
    return {
      total: 0,
      normal: 0,
      overtime: 0,
    };
  }

  const toMinutes = (value: string) => {
    const [hours, minutes] =
      value.split(":").map(Number);

    return hours * 60 + minutes;
  };

  let minutes =
    toMinutes(clockOut) -
    toMinutes(clockIn);

  if (minutes < 0) {
    minutes += 24 * 60;
  }

  if (breakStart && breakEnd) {
    let breakMinutes =
      toMinutes(breakEnd) -
      toMinutes(breakStart);

    if (breakMinutes < 0) {
      breakMinutes += 24 * 60;
    }

    minutes -= breakMinutes;
  }

  if (minutes < 0) {
    minutes = 0;
  }

  const total = minutes / 60;

  const normal = Math.min(total, 8);

  const overtime = Math.max(
    total - 8,
    0
  );

  return {
    total: Number(total.toFixed(2)),
    normal: Number(normal.toFixed(2)),
    overtime: Number(
      overtime.toFixed(2)
    ),
  };
}

function statusLabel(
  status: AttendanceStatus
) {
  switch (status) {
    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "submitted":
      return "Pending Approval";

    default:
      return status;
  }
}

function statusClass(
  status: AttendanceStatus
) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";

    case "rejected":
      return "bg-red-100 text-red-700";

    case "submitted":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-charcoal-100 text-charcoal-600";
  }
}

export default function AttendancePage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [reviewingId, setReviewingId] =
    useState<string | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState<AttendanceForm>({
      ...EMPTY_FORM,
      attendanceDate: getToday(),
    });

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | AttendanceStatus>(
      "all"
    );

  const [dateFilter, setDateFilter] =
    useState("");

  const [reviewNotes, setReviewNotes] =
    useState("");

  const canManageAttendance =
    profile?.is_active === true &&
    ["owner", "manager", "admin"].includes(
      String(profile.role).toLowerCase()
    );

  /*
   * -------------------------------------------------------
   * INITIAL LOAD
   * -------------------------------------------------------
   */

  useEffect(() => {
    void initialise();
  }, []);

  async function initialise() {
    setLoading(true);
    setError("");

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setError(
          "You must be logged in to use attendance."
        );

        setLoading(false);
        return;
      }

      const {
        data: profileData,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, role, is_active"
          )
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error(
          "Profile loading error:",
          profileError
        );
      } else {
        setProfile(
          profileData as Profile
        );
      }

      await loadEmployees();
      await loadAttendance();

    } catch (err) {
      console.error(
        "Attendance initialisation error:",
        err
      );

      setError(
        "Unable to initialise attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * -------------------------------------------------------
   * LOAD EMPLOYEES
   * -------------------------------------------------------
   */

  async function loadEmployees() {
    const {
      data,
      error: employeeError,
    } =
      await supabase
        .from("employees")
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          job_title,
          department,
          employment_status,
          pay_type,
          hourly_rate
        `)
        .eq(
          "employment_status",
          "Active"
        )
        .order("first_name", {
          ascending: true,
        });

    if (employeeError) {
      console.error(
        "Employee loading error:",
        employeeError
      );

      setError(
        `Unable to load employees: ${employeeError.message}`
      );

      return;
    }

    setEmployees(
      (data ?? []) as Employee[]
    );
  }

  /*
   * -------------------------------------------------------
   * LOAD ATTENDANCE
   * -------------------------------------------------------
   */

  async function loadAttendance() {
    setLoadingAttendance(true);

    try {
      const params =
        new URLSearchParams();

      if (dateFilter) {
        params.set(
          "startDate",
          dateFilter
        );

        params.set(
          "endDate",
          dateFilter
        );
      }

      const url =
        params.toString()
          ? `${ATTENDANCE_API}?${params.toString()}`
          : ATTENDANCE_API;

      const response =
        await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load attendance."
        );
      }

      setAttendance(
        (result.attendance ??
          []) as AttendanceRecord[]
      );
    } catch (err) {
      console.error(
        "Attendance loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance."
      );
    } finally {
      setLoadingAttendance(false);
    }
  }

  /*
   * -------------------------------------------------------
   * FORM
   * -------------------------------------------------------
   */

  function updateField(
    field: keyof AttendanceForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddForm() {
    setForm({
      ...EMPTY_FORM,
      attendanceDate: getToday(),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);

    setForm({
      ...EMPTY_FORM,
      attendanceDate: getToday(),
    });

    setError("");
  }

  /*
   * -------------------------------------------------------
   * SAVE ATTENDANCE
   * -------------------------------------------------------
   */

  async function submitAttendance() {
    setError("");
    setSuccess("");

    if (!form.employeeId) {
      setError(
        "Please select an employee."
      );
      return;
    }

    if (!form.attendanceDate) {
      setError(
        "Please select the attendance date."
      );
      return;
    }

    if (!form.clockIn) {
      setError(
        "Please enter the clock-in time."
      );
      return;
    }

    if (!form.clockOut) {
      setError(
        "Please enter the clock-out time."
      );
      return;
    }

    if (
      (form.breakStart &&
        !form.breakEnd) ||
      (!form.breakStart &&
        form.breakEnd)
    ) {
      setError(
        "Please enter both break start and break end."
      );
      return;
    }

    const calculated =
      calculateHours(
        form.clockIn,
        form.breakStart,
        form.breakEnd,
        form.clockOut
      );

    if (calculated.total <= 0) {
      setError(
        "The calculated working hours must be greater than zero."
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          ATTENDANCE_API,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              employeeId:
                form.employeeId,

              attendanceDate:
                form.attendanceDate,

              clockIn:
                form.clockIn,

              breakStart:
                form.breakStart,

              breakEnd:
                form.breakEnd,

              clockOut:
                form.clockOut,

              employeeNotes:
                form.employeeNotes,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to submit attendance."
        );
      }

      setSuccess(
        "Attendance submitted successfully and is now waiting for management approval."
      );

      setShowForm(false);

      setForm({
        ...EMPTY_FORM,
        attendanceDate:
          getToday(),
      });

      await loadAttendance();

    } catch (err) {
      console.error(
        "Attendance submission error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * -------------------------------------------------------
   * MANAGEMENT REVIEW
   * -------------------------------------------------------
   */

  async function reviewAttendance(
    attendanceId: string,
    action:
      | "approved"
      | "rejected"
  ) {
    if (!canManageAttendance) {
      setError(
        "Only management can approve attendance."
      );
      return;
    }

    setError("");
    setSuccess("");
    setReviewingId(attendanceId);

    try {
      const response =
        await fetch(
          ATTENDANCE_API,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              attendanceId,
              action,
              managementNotes:
                reviewNotes.trim() ||
                undefined,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to review attendance."
        );
      }

      setSuccess(
        action === "approved"
          ? "Attendance approved successfully. The approved hours can now be used by payroll."
          : "Attendance rejected and returned for correction."
      );

      setReviewNotes("");

      await loadAttendance();

    } catch (err) {
      console.error(
        "Attendance review error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to review attendance."
      );
    } finally {
      setReviewingId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * FILTERING
   * -------------------------------------------------------
   */

  const filteredAttendance =
    attendance.filter((record) => {
      const employee =
        getEmployee(record);

      const employeeName =
        employee
          ? `${employee.first_name} ${employee.last_name}`
          : "";

      const employeeNumber =
        employee?.employee_number ?? "";

      const searchMatches =
        !search.trim() ||
        employeeName
          .toLowerCase()
          .includes(
            search
              .trim()
              .toLowerCase()
          ) ||
        employeeNumber
          .toLowerCase()
          .includes(
            search
              .trim()
              .toLowerCase()
          );

      const statusMatches =
        statusFilter === "all" ||
        record.status ===
          statusFilter;

      return (
        searchMatches &&
        statusMatches
      );
    });

  /*
   * -------------------------------------------------------
   * STATISTICS
   * -------------------------------------------------------
   */

  const pendingCount =
    attendance.filter(
      (record) =>
        record.status ===
        "submitted"
    ).length;

  const approvedCount =
    attendance.filter(
      (record) =>
        record.status ===
        "approved"
    ).length;

  const rejectedCount =
    attendance.filter(
      (record) =>
        record.status ===
        "rejected"
    ).length;

  const approvedHours =
    attendance
      .filter(
        (record) =>
          record.status ===
          "approved"
      )
      .reduce(
        (total, record) =>
          total +
          Number(
            record.normal_hours ||
              0
          ) +
          Number(
            record.overtime_hours ||
              0
          ),
        0
      );

  const currentCalculation =
    calculateHours(
      form.clockIn,
      form.breakStart,
      form.breakEnd,
      form.clockOut
    );

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <DashboardShell
        title="Attendance"
        subtitle="Manage employee attendance and approved working hours"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#20AEB8]" />

          <span className="ml-3 text-sm text-charcoal-500">
            Loading attendance...
          </span>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Attendance"
      subtitle="Manage employee attendance and approved working hours"
    >
      <PageHeader
        title="Attendance"
        description="Employees record their working hours here. Management reviews and approves each day's attendance before it becomes available to payroll."
        icon={Clock3}
        action={{
          label: "Record Attendance",
          href: "#",
          onClick: openAddForm,
        }}
      />

      <div className="space-y-6">

        {/* ALERTS */}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-500">
                Pending Approval
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <Clock3 className="h-4 w-4 text-amber-600" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-charcoal-900">
              {pendingCount}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Waiting for management
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-500">
                Approved
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-green-600">
              {approvedCount}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Ready for payroll
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-500">
                Rejected
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-red-600">
              {rejectedCount}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Requires correction
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-500">
                Approved Hours
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#20AEB8]/10">
                <Clock3 className="h-4 w-4 text-[#20AEB8]" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-charcoal-900">
              {approvedHours.toFixed(2)}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Available to payroll
            </p>
          </div>

        </div>

        {/* IMPORTANT WORKFLOW NOTICE */}

        <div className="rounded-2xl border border-[#20AEB8]/20 bg-[#20AEB8]/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#20AEB8]/10">
              <UserCheck className="h-5 w-5 text-[#20AEB8]" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">
                Attendance Approval Workflow
              </h3>

              <p className="mt-1 text-sm leading-6 text-charcoal-600">
                Employees enter their clock-in,
                break and clock-out times and
                submit them for review. Management
                must approve the attendance before
                the hours are considered approved
                payroll hours.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-full bg-white px-3 py-1 text-charcoal-600">
                  1. Employee records hours
                </span>

                <span className="text-charcoal-400">
                  →
                </span>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  2. Pending approval
                </span>

                <span className="text-charcoal-400">
                  →
                </span>

                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                  3. Manager approves
                </span>

                <span className="text-charcoal-400">
                  →
                </span>

                <span className="rounded-full bg-[#20AEB8]/10 px-3 py-1 text-[#168892]">
                  4. Payroll uses hours
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ADD FORM */}

        {showForm && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-start justify-between border-b border-charcoal-100 pb-5">
              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  Record Employee Attendance
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Enter the employee's actual
                  working times. The record will
                  remain pending until management
                  approves it.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-50 hover:text-charcoal-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* EMPLOYEE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Employee *
                </label>

                <select
                  value={
                    form.employeeId
                  }
                  onChange={(event) =>
                    updateField(
                      "employeeId",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                >
                  <option value="">
                    Select employee
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
                        {
                          employee.first_name
                        }{" "}
                        {
                          employee.last_name
                        }{" "}
                        —{" "}
                        {
                          employee.employee_number
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Attendance Date *
                </label>

                <input
                  type="date"
                  value={
                    form.attendanceDate
                  }
                  onChange={(event) =>
                    updateField(
                      "attendanceDate",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

              {/* CLOCK IN */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Clock In *
                </label>

                <input
                  type="time"
                  value={
                    form.clockIn
                  }
                  onChange={(event) =>
                    updateField(
                      "clockIn",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

              {/* CLOCK OUT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Clock Out *
                </label>

                <input
                  type="time"
                  value={
                    form.clockOut
                  }
                  onChange={(event) =>
                    updateField(
                      "clockOut",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

              {/* BREAK START */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Break Start
                </label>

                <input
                  type="time"
                  value={
                    form.breakStart
                  }
                  onChange={(event) =>
                    updateField(
                      "breakStart",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

              {/* BREAK END */}

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Break End
                </label>

                <input
                  type="time"
                  value={
                    form.breakEnd
                  }
                  onChange={(event) =>
                    updateField(
                      "breakEnd",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

              {/* NOTES */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Employee Notes
                </label>

                <textarea
                  rows={3}
                  value={
                    form.employeeNotes
                  }
                  onChange={(event) =>
                    updateField(
                      "employeeNotes",
                      event.target.value
                    )
                  }
                  placeholder="Optional notes about today's attendance..."
                  className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

            </div>

            {/* CALCULATION */}

            <div className="mt-6 rounded-xl border border-charcoal-100 bg-charcoal-50 p-5">

              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#20AEB8]" />

                <h3 className="text-sm font-semibold text-charcoal-900">
                  Calculated Working Hours
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-lg bg-white p-4">
                  <p className="text-xs text-charcoal-500">
                    Total Hours
                  </p>

                  <p className="mt-1 text-xl font-bold text-charcoal-900">
                    {currentCalculation.total.toFixed(
                      2
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4">
                  <p className="text-xs text-charcoal-500">
                    Normal Hours
                  </p>

                  <p className="mt-1 text-xl font-bold text-charcoal-900">
                    {currentCalculation.normal.toFixed(
                      2
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4">
                  <p className="text-xs text-charcoal-500">
                    Overtime Hours
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#20AEB8]">
                    {currentCalculation.overtime.toFixed(
                      2
                    )}
                  </p>
                </div>

              </div>

              <p className="mt-4 text-xs text-charcoal-500">
                Hours are calculated automatically.
                Management will review the recorded
                times before approving the attendance.
              </p>
            </div>

            {/* BUTTONS */}

            <div className="mt-6 flex justify-end gap-3 border-t border-charcoal-100 pt-6">

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
                onClick={() =>
                  void submitAttendance()
                }
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Submit for Approval
                  </>
                )}
              </button>

            </div>

          </div>
        )}

        {/* FILTERS */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-charcoal-500">
                Search Employee
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search by employee name or number..."
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-charcoal-500">
                Status
              </label>

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | "all"
                      | AttendanceStatus
                  )
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8]"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="submitted">
                  Pending Approval
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>
            </div>

            <div className="w-full lg:w-48">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-charcoal-500">
                Date
              </label>

              <input
                type="date"
                value={
                  dateFilter
                }
                onChange={(event) =>
                  setDateFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setDateFilter("");
                setSearch("");
                setStatusFilter(
                  "all"
                );
                void loadAttendance();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={() =>
                void loadAttendance()
              }
              disabled={
                loadingAttendance
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal-800 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingAttendance
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

          </div>

        </div>

        {/* MANAGEMENT REVIEW PANEL */}

        {canManageAttendance &&
          pendingCount > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <UserCheck className="h-5 w-5 text-amber-700" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-charcoal-900">
                    Management Review Required
                  </h3>

                  <p className="mt-1 text-sm text-charcoal-600">
                    There{" "}
                    {pendingCount === 1
                      ? "is"
                      : "are"}{" "}
                    {pendingCount} attendance{" "}
                    {pendingCount === 1
                      ? "record"
                      : "records"}{" "}
                    waiting for approval.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-charcoal-500">
                  Management Note
                </label>

                <input
                  value={
                    reviewNotes
                  }
                  onChange={(event) =>
                    setReviewNotes(
                      event.target.value
                    )
                  }
                  placeholder="Optional note when approving or rejecting..."
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8]"
                />
              </div>

            </div>
          )}

        {/* ATTENDANCE TABLE */}

        <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

          <div className="border-b border-charcoal-100 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  Attendance Records
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Review daily employee hours and
                  management approvals.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal-800"
              >
                <Plus className="h-4 w-4" />
                Record Attendance
              </button>

            </div>
          </div>

          {loadingAttendance ? (
            <div className="flex items-center justify-center px-6 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#20AEB8]" />

              <span className="ml-3 text-sm text-charcoal-500">
                Loading attendance...
              </span>
            </div>
          ) : filteredAttendance.length ===
            0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal-50">
                <CalendarDays className="h-6 w-6 text-charcoal-400" />
              </div>

              <h3 className="text-base font-semibold text-charcoal-900">
                No attendance records found
              </h3>

              <p className="mt-1 max-w-md text-sm text-charcoal-500">
                Record employee attendance to
                start building your approved
                payroll hours.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1897a0]"
              >
                <Plus className="h-4 w-4" />
                Record Attendance
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left">

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Employee
                    </th>

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Date
                    </th>

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Clock In
                    </th>

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Break
                    </th>

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Clock Out
                    </th>

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Normal
                    </th>

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Overtime
                    </th>

                    <th className="whitespace-nowrap px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                      Status
                    </th>

                    {canManageAttendance && (
                      <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        Management
                      </th>
                    )}

                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100">

                  {filteredAttendance.map(
                    (record) => {
                      const employee =
                        getEmployee(
                          record
                        );

                      const isReviewing =
                        reviewingId ===
                        record.id;

                      return (
                        <tr
                          key={
                            record.id
                          }
                          className="transition hover:bg-charcoal-50/50"
                        >

                          {/* EMPLOYEE */}

                          <td className="px-6 py-4">

                            <div className="text-sm font-semibold text-charcoal-900">
                              {employee
                                ? `${employee.first_name} ${employee.last_name}`
                                : "Unknown Employee"}
                            </div>

                            <div className="mt-1 text-xs text-charcoal-500">
                              {employee?.employee_number ??
                                "—"}
                            </div>

                            {employee?.job_title && (
                              <div className="mt-1 text-xs text-charcoal-400">
                                {
                                  employee.job_title
                                }
                              </div>
                            )}

                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-charcoal-600">
                            {formatDate(
                              record.attendance_date
                            )}
                          </td>

                          {/* CLOCK IN */}

                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-charcoal-800">
                            {formatTime(
                              record.clock_in
                            )}
                          </td>

                          {/* BREAK */}

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-charcoal-600">

                            {record.break_start &&
                            record.break_end ? (
                              <>
                                {
                                  formatTime(
                                    record.break_start
                                  )
                                }{" "}
                                –
                                {" "}
                                {
                                  formatTime(
                                    record.break_end
                                  )
                                }
                              </>
                            ) : (
                              "—"
                            )}

                          </td>

                          {/* CLOCK OUT */}

                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-charcoal-800">
                            {formatTime(
                              record.clock_out
                            )}
                          </td>

                          {/* NORMAL */}

                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-charcoal-900">
                            {Number(
                              record.normal_hours ||
                                0
                            ).toFixed(
                              2
                            )}{" "}
                            hrs
                          </td>

                          {/* OVERTIME */}

                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#20AEB8]">
                            {Number(
                              record.overtime_hours ||
                                0
                            ).toFixed(
                              2
                            )}{" "}
                            hrs
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                                record.status
                              )}`}
                            >
                              {statusLabel(
                                record.status
                              )}
                            </span>

                            {record.status ===
                              "approved" &&
                              record.approved_at && (
                                <div className="mt-1 text-xs text-charcoal-400">
                                  Approved{" "}
                                  {formatDate(
                                    record.approved_at.slice(
                                      0,
                                      10
                                    )
                                  )}
                                </div>
                              )}

                            {record.status ===
                              "rejected" &&
                              record.management_notes && (
                                <div className="mt-1 max-w-[180px] text-xs text-red-500">
                                  {
                                    record.management_notes
                                  }
                                </div>
                              )}

                          </td>

                          {/* MANAGEMENT */}

                          {canManageAttendance && (
                            <td className="px-6 py-4">

                              {record.status ===
                              "submitted" ? (
                                <div className="flex justify-end gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void reviewAttendance(
                                        record.id,
                                        "approved"
                                      )
                                    }
                                    disabled={
                                      isReviewing
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isReviewing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}

                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void reviewAttendance(
                                        record.id,
                                        "rejected"
                                      )
                                    }
                                    disabled={
                                      isReviewing
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <X className="h-3.5 w-3.5" />

                                    Reject
                                  </button>

                                </div>
                              ) : record.status ===
                                "approved" ? (
                                <div className="flex justify-end">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                                    <Check className="h-3.5 w-3.5" />
                                    Locked
                                  </span>
                                </div>
                              ) : (
                                <div className="flex justify-end">
                                  <span className="text-xs text-charcoal-400">
                                    Awaiting resubmission
                                  </span>
                                </div>
                              )}

                            </td>
                          )}

                        </tr>
                      );
                    }
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