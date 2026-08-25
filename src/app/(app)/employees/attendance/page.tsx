"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Users,
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
  clock_in: string | null;
  break_start: string | null;
  break_end: string | null;
  clock_out: string | null;
  normal_hours: number | null;
  overtime_hours: number | null;
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

const ATTENDANCE_API =
  "/api/employees/attendance";

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
  if (!value) {
    return "—";
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

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

  const toMinutes = (
    value: string
  ) => {
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

function getMonthStart(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function getMonthEnd(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

function formatMonth(
  date: Date
) {
  return date.toLocaleDateString(
    "en-ZA",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function formatCalendarDate(
  date: Date
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDays(
  monthDate: Date
) {
  const start =
    getMonthStart(monthDate);

  const end =
    getMonthEnd(monthDate);

  const firstDay =
    start.getDay();

  const daysInMonth =
    end.getDate();

  const days: (
    | Date
    | null
  )[] = [];

  /*
   * Convert Sunday-first JavaScript
   * calendar into Monday-first.
   */
  const mondayOffset =
    firstDay === 0
      ? 6
      : firstDay - 1;

  for (
    let index = 0;
    index < mondayOffset;
    index++
  ) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    days.push(
      new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        day
      )
    );
  }

  while (
    days.length % 7 !==
    0
  ) {
    days.push(null);
  }

  return days;
}

function isWeekend(
  date: Date
) {
  const day =
    date.getDay();

  return (
    day === 0 ||
    day === 6
  );
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
      attendanceDate:
        getToday(),
    });

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [monthDate, setMonthDate] =
    useState(
      getMonthStart(
        new Date()
      )
    );

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState<string | null>(
      null
    );

  const [selectedDate, setSelectedDate] =
    useState<string | null>(
      null
    );

  const [reviewNotes, setReviewNotes] =
    useState("");

  const canManageAttendance =
    profile?.is_active === true &&
    [
      "owner",
      "manager",
      "admin",
    ].includes(
      String(
        profile.role
      ).toLowerCase()
    );

  useEffect(() => {
    void initialise();

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          .eq(
            "id",
            user.id
          )
          .single();

      if (
        profileError
      ) {
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
        .order(
          "first_name",
          {
            ascending: true,
          }
        );

    if (
      employeeError
    ) {
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
      (data ??
        []) as Employee[]
    );
  }

  async function loadAttendance() {
    setLoadingAttendance(true);

    try {
      const start =
        formatCalendarDate(
          getMonthStart(
            monthDate
          )
        );

      const end =
        formatCalendarDate(
          getMonthEnd(
            monthDate
          )
        );

      const params =
        new URLSearchParams();

      params.set(
        "startDate",
        start
      );

      params.set(
        "endDate",
        end
      );

      const response =
        await fetch(
          `${ATTENDANCE_API}?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

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

  useEffect(() => {
    if (!loading) {
      void loadAttendance();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate]);

  function updateField(
    field: keyof AttendanceForm,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function openAddForm(
    employeeId?: string,
    date?: string
  ) {
    setForm({
      ...EMPTY_FORM,
      employeeId:
        employeeId ??
        "",
      attendanceDate:
        date ??
        getToday(),
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

    setForm({
      ...EMPTY_FORM,
      attendanceDate:
        getToday(),
    });

    setError("");
  }

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

    if (
      calculated.total <= 0
    ) {
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

  async function reviewAttendance(
    attendanceId: string,
    action:
      | "approved"
      | "rejected"
  ) {
    if (
      !canManageAttendance
    ) {
      setError(
        "Only management can approve attendance."
      );
      return;
    }

    setError("");
    setSuccess("");
    setReviewingId(
      attendanceId
    );

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
        action ===
          "approved"
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
      setReviewingId(
        null
      );
    }
  }

  function changeMonth(
    amount: number
  ) {
    setMonthDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            amount,
          1
        )
    );
  }

  function goToCurrentMonth() {
    setMonthDate(
      getMonthStart(
        new Date()
      )
    );
  }

  const filteredEmployees =
    employees.filter(
      (employee) => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        const name =
          `${employee.first_name} ${employee.last_name}`.toLowerCase();

        return (
          name.includes(query) ||
          employee.employee_number
            .toLowerCase()
            .includes(query) ||
          (
            employee.job_title ??
            ""
          )
            .toLowerCase()
            .includes(query)
        );
      }
    );

  function employeeAttendance(
    employeeId: string
  ) {
    return attendance.filter(
      (record) =>
        record.employee_id ===
        employeeId
    );
  }

  function employeeMonthTotals(
    employeeId: string
  ) {
    const records =
      employeeAttendance(
        employeeId
      );

    const normal =
      records.reduce(
        (total, record) =>
          total +
          Number(
            record.normal_hours ||
              0
          ),
        0
      );

    const overtime =
      records.reduce(
        (total, record) =>
          total +
          Number(
            record.overtime_hours ||
              0
          ),
        0
      );

    const total =
      normal + overtime;

    const presentDays =
      records.filter(
        (record) =>
          record.status !==
          "rejected"
      ).length;

    return {
      normal,
      overtime,
      total,
      presentDays,
    };
  }

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

  const selectedEmployee =
    selectedEmployeeId
      ? employees.find(
          (employee) =>
            employee.id ===
            selectedEmployeeId
        ) ?? null
      : null;

  const selectedEmployeeRecords =
    selectedEmployeeId
      ? employeeAttendance(
          selectedEmployeeId
        )
      : [];

  const selectedRecord =
    selectedDate
      ? selectedEmployeeRecords.find(
          (record) =>
            record.attendance_date ===
            selectedDate
        ) ?? null
      : null;

  const calendarDays =
    getCalendarDays(
      monthDate
    );

  const currentCalculation =
    calculateHours(
      form.clockIn,
      form.breakStart,
      form.breakEnd,
      form.clockOut
    );

  if (loading) {
    return (
      <DashboardShell
        title="Attendance"
        subtitle="Manage employee attendance and working hours"
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
      subtitle="Manage employee attendance and working hours"
    >
      <PageHeader
        title="Attendance"
        description="Track employee working hours by month, review daily attendance and approve hours for payroll."
        icon={Clock3}
        action={{
          label: "Record Attendance",
          href: "#",
          onClick: () =>
            openAddForm(),
        }}
      />

      <div className="space-y-6">

        {/* ALERTS */}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {success}
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {error}
            </span>

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

        {/* MONTH NAVIGATION */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#20AEB8]">
                Attendance Period
              </p>

              <h2 className="mt-1 text-2xl font-bold text-charcoal-900">
                {formatMonth(
                  monthDate
                )}
              </h2>

              <p className="mt-1 text-sm text-charcoal-500">
                View employee hours and monthly attendance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  changeMonth(-1)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={
                  goToCurrentMonth
                }
                className="rounded-lg border border-[#20AEB8]/30 bg-[#20AEB8]/5 px-4 py-2.5 text-sm font-medium text-[#168892] hover:bg-[#20AEB8]/10"
              >
                Current Month
              </button>

              <button
                type="button"
                onClick={() =>
                  changeMonth(1)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  void loadAttendance()
                }
                disabled={
                  loadingAttendance
                }
                className="inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal-800 disabled:opacity-60"
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
        </div>

        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-500">
                Employees
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#20AEB8]/10">
                <Users className="h-4 w-4 text-[#20AEB8]" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-charcoal-900">
              {employees.length}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Active employees
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-500">
                Approved Hours
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-charcoal-900">
              {approvedHours.toFixed(
                2
              )}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Available for payroll
            </p>
          </div>

          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-500">
                Pending Approval
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <Clock3 className="h-4 w-4 text-amber-600" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-amber-600">
              {pendingCount}
            </p>

            <p className="mt-1 text-xs text-charcoal-500">
              Awaiting management
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
              Need correction
            </p>
          </div>

        </div>

        {/* EMPLOYEE DETAIL VIEW */}

        {selectedEmployee ? (
          <>
            <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

              <button
                type="button"
                onClick={() => {
                  setSelectedEmployeeId(
                    null
                  );
                  setSelectedDate(
                    null
                  );
                }}
                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-charcoal-600 hover:text-charcoal-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Employees
              </button>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#20AEB8]/10 text-lg font-bold text-[#168892]">
                    {selectedEmployee.first_name.charAt(
                      0
                    )}
                    {selectedEmployee.last_name.charAt(
                      0
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900">
                      {
                        selectedEmployee.first_name
                      }{" "}
                      {
                        selectedEmployee.last_name
                      }
                    </h2>

                    <p className="mt-1 text-sm text-charcoal-500">
                      {
                        selectedEmployee.employee_number
                      }
                      {" • "}
                      {
                        selectedEmployee.job_title ??
                        "Employee"
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">

                  <div className="rounded-xl bg-charcoal-50 px-4 py-3 text-center">
                    <p className="text-xs text-charcoal-500">
                      Total Hours
                    </p>

                    <p className="mt-1 text-lg font-bold text-charcoal-900">
                      {employeeMonthTotals(
                        selectedEmployee.id
                      ).total.toFixed(
                        2
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-charcoal-50 px-4 py-3 text-center">
                    <p className="text-xs text-charcoal-500">
                      Normal
                    </p>

                    <p className="mt-1 text-lg font-bold text-charcoal-900">
                      {employeeMonthTotals(
                        selectedEmployee.id
                      ).normal.toFixed(
                        2
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#20AEB8]/5 px-4 py-3 text-center">
                    <p className="text-xs text-charcoal-500">
                      Overtime
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#168892]">
                      {employeeMonthTotals(
                        selectedEmployee.id
                      ).overtime.toFixed(
                        2
                      )}
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* CALENDAR */}

            <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

              <div className="border-b border-charcoal-100 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h2 className="text-lg font-semibold text-charcoal-900">
                      {formatMonth(
                        monthDate
                      )}
                    </h2>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Click a day to view attendance details.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        changeMonth(
                          -1
                        )
                      }
                      className="rounded-lg border border-charcoal-200 p-2 hover:bg-charcoal-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeMonth(
                          1
                        )
                      }
                      className="rounded-lg border border-charcoal-200 p-2 hover:bg-charcoal-50"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>

                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-charcoal-100 bg-charcoal-50">

                {[
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                  "Sun",
                ].map(
                  (day) => (
                    <div
                      key={day}
                      className="border-r border-charcoal-100 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-charcoal-500 last:border-r-0"
                    >
                      {day}
                    </div>
                  )
                )}

              </div>

              <div className="grid grid-cols-7">

                {calendarDays.map(
                  (
                    date,
                    index
                  ) => {
                    if (!date) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="min-h-[115px] border-b border-r border-charcoal-100 bg-charcoal-50/40"
                        />
                      );
                    }

                    const dateString =
                      formatCalendarDate(
                        date
                      );

                    const record =
                      selectedEmployeeRecords.find(
                        (
                          item
                        ) =>
                          item.attendance_date ===
                          dateString
                      );

                    const weekend =
                      isWeekend(
                        date
                      );

                    return (
                      <button
                        key={
                          dateString
                        }
                        type="button"
                        onClick={() => {
                          setSelectedDate(
                            dateString
                          );
                        }}
                        className={`min-h-[115px] border-b border-r border-charcoal-100 p-3 text-left transition hover:bg-[#20AEB8]/5 ${
                          weekend
                            ? "bg-charcoal-50/40"
                            : "bg-white"
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <span
                            className={`text-sm font-semibold ${
                              dateString ===
                              getToday()
                                ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#20AEB8] text-white"
                                : "text-charcoal-700"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          {record && (
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                record.status ===
                                "approved"
                                  ? "bg-green-500"
                                  : record.status ===
                                    "submitted"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            />
                          )}

                        </div>

                        {record ? (
                          <div className="mt-4">

                            <p className="text-sm font-bold text-charcoal-900">
                              {(
                                Number(
                                  record.normal_hours ||
                                    0
                                ) +
                                Number(
                                  record.overtime_hours ||
                                    0
                                )
                              ).toFixed(
                                2
                              )}
                              h
                            </p>

                            <p className="mt-1 text-xs text-charcoal-500">
                              {
                                statusLabel(
                                  record.status
                                )
                              }
                            </p>

                            {Number(
                              record.overtime_hours ||
                                0
                            ) > 0 && (
                              <p className="mt-1 text-xs font-medium text-[#20AEB8]">
                                +
                                {Number(
                                  record.overtime_hours
                                ).toFixed(
                                  2
                                )}
                                h OT
                              </p>
                            )}

                          </div>
                        ) : (
                          <div className="mt-4">

                            {!weekend ? (
                              <>
                                <p className="text-xs text-charcoal-400">
                                  No record
                                </p>

                                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#20AEB8]">
                                  <Plus className="h-3 w-3" />
                                  Add
                                </span>
                              </>
                            ) : (
                              <p className="text-xs text-charcoal-400">
                                Weekend
                              </p>
                            )}

                          </div>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* SELECTED DAY */}

            {selectedDate && (
              <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-4 border-b border-charcoal-100 pb-5 sm:flex-row sm:items-start sm:justify-between">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#20AEB8]">
                      Daily Attendance
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-charcoal-900">
                      {formatDate(
                        selectedDate
                      )}
                    </h2>

                    <p className="mt-1 text-sm text-charcoal-500">
                      {
                        selectedEmployee.first_name
                      }{" "}
                      {
                        selectedEmployee.last_name
                      }
                    </p>
                  </div>

                  {!selectedRecord && (
                    <button
                      type="button"
                      onClick={() =>
                        openAddForm(
                          selectedEmployee.id,
                          selectedDate
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1897a0]"
                    >
                      <Plus className="h-4 w-4" />
                      Record This Day
                    </button>
                  )}

                </div>

                {selectedRecord ? (
                  <div className="mt-6">

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      <div className="rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">
                        <p className="text-xs text-charcoal-500">
                          Clock In
                        </p>

                        <p className="mt-1 text-lg font-bold text-charcoal-900">
                          {formatTime(
                            selectedRecord.clock_in
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">
                        <p className="text-xs text-charcoal-500">
                          Break
                        </p>

                        <p className="mt-1 text-lg font-bold text-charcoal-900">
                          {selectedRecord.break_start &&
                          selectedRecord.break_end
                            ? `${formatTime(
                                selectedRecord.break_start
                              )} – ${formatTime(
                                selectedRecord.break_end
                              )}`
                            : "None"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">
                        <p className="text-xs text-charcoal-500">
                          Clock Out
                        </p>

                        <p className="mt-1 text-lg font-bold text-charcoal-900">
                          {formatTime(
                            selectedRecord.clock_out
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#20AEB8]/20 bg-[#20AEB8]/5 p-4">
                        <p className="text-xs text-charcoal-500">
                          Total Hours
                        </p>

                        <p className="mt-1 text-lg font-bold text-[#168892]">
                          {(
                            Number(
                              selectedRecord.normal_hours ||
                                0
                            ) +
                            Number(
                              selectedRecord.overtime_hours ||
                                0
                            )
                          ).toFixed(
                            2
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">

                      <div className="rounded-xl bg-charcoal-50 p-4">
                        <p className="text-xs text-charcoal-500">
                          Normal Hours
                        </p>

                        <p className="mt-1 text-2xl font-bold text-charcoal-900">
                          {Number(
                            selectedRecord.normal_hours ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#20AEB8]/5 p-4">
                        <p className="text-xs text-charcoal-500">
                          Overtime
                        </p>

                        <p className="mt-1 text-2xl font-bold text-[#168892]">
                          {Number(
                            selectedRecord.overtime_hours ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">

                        <p className="text-xs text-charcoal-500">
                          Status
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${statusClass(
                            selectedRecord.status
                          )}`}
                        >
                          {statusLabel(
                            selectedRecord.status
                          )}
                        </span>

                      </div>

                    </div>

                    {selectedRecord.employee_notes && (
                      <div className="mt-5 rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                          Employee Notes
                        </p>

                        <p className="mt-2 text-sm leading-6 text-charcoal-700">
                          {
                            selectedRecord.employee_notes
                          }
                        </p>
                      </div>
                    )}

                    {selectedRecord.management_notes && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                          Management Notes
                        </p>

                        <p className="mt-2 text-sm leading-6 text-amber-800">
                          {
                            selectedRecord.management_notes
                          }
                        </p>
                      </div>
                    )}

                    {canManageAttendance &&
                      selectedRecord.status ===
                        "submitted" && (
                        <div className="mt-6 border-t border-charcoal-100 pt-6">

                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-charcoal-900">
                              Management Review
                            </h3>

                            <p className="mt-1 text-sm text-charcoal-500">
                              Approve the recorded hours for payroll or reject them for correction.
                            </p>
                          </div>

                          <input
                            value={
                              reviewNotes
                            }
                            onChange={(
                              event
                            ) =>
                              setReviewNotes(
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Optional management note..."
                            className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                          />

                          <div className="mt-4 flex flex-wrap gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                void reviewAttendance(
                                  selectedRecord.id,
                                  "approved"
                                )
                              }
                              disabled={
                                reviewingId ===
                                selectedRecord.id
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              {reviewingId ===
                              selectedRecord.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}

                              Approve Attendance
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void reviewAttendance(
                                  selectedRecord.id,
                                  "rejected"
                                )
                              }
                              disabled={
                                reviewingId ===
                                selectedRecord.id
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>

                          </div>

                        </div>
                      )}

                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-charcoal-200 bg-charcoal-50 p-8 text-center">

                    <CalendarDays className="mx-auto h-8 w-8 text-charcoal-400" />

                    <h3 className="mt-3 text-sm font-semibold text-charcoal-900">
                      No attendance recorded
                    </h3>

                    <p className="mt-1 text-sm text-charcoal-500">
                      There is no attendance record for this employee on this date.
                    </p>

                  </div>
                )}

              </div>
            )}

          </>
        ) : (
          <>
            {/* EMPLOYEE LIST */}

            <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

                <div className="flex-1">

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                    Search Employees
                  </label>

                  <div className="relative">

                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                    <input
                      value={search}
                      onChange={(
                        event
                      ) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search by name, employee number or position..."
                      className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear
                </button>

              </div>

            </div>

            <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm">

              <div className="border-b border-charcoal-100 p-6">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h2 className="text-lg font-semibold text-charcoal-900">
                      Employee Attendance
                    </h2>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Select an employee to view their {formatMonth(
                        monthDate
                      )} attendance calendar.
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#20AEB8]/5 px-3 py-2 text-sm font-medium text-[#168892]">
                    {filteredEmployees.length}{" "}
                    employee
                    {filteredEmployees.length ===
                    1
                      ? ""
                      : "s"}
                  </div>

                </div>

              </div>

              {loadingAttendance ? (
                <div className="flex items-center justify-center px-6 py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#20AEB8]" />

                  <span className="ml-3 text-sm text-charcoal-500">
                    Loading attendance...
                  </span>
                </div>
              ) : filteredEmployees.length ===
                0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                  <Users className="h-8 w-8 text-charcoal-300" />

                  <h3 className="mt-3 text-base font-semibold text-charcoal-900">
                    No employees found
                  </h3>

                  <p className="mt-1 text-sm text-charcoal-500">
                    Try changing your search.
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-charcoal-100">

                  {filteredEmployees.map(
                    (employee) => {
                      const totals =
                        employeeMonthTotals(
                          employee.id
                        );

                      return (
                        <button
                          key={
                            employee.id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedEmployeeId(
                              employee.id
                            )
                          }
                          className="w-full px-6 py-5 text-left transition hover:bg-charcoal-50"
                        >

                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

                            <div className="flex min-w-0 flex-1 items-center gap-4">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#20AEB8]/10 text-sm font-bold text-[#168892]">
                                {employee.first_name.charAt(
                                  0
                                )}
                                {employee.last_name.charAt(
                                  0
                                )}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-charcoal-900">
                                  {
                                    employee.first_name
                                  }{" "}
                                  {
                                    employee.last_name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-charcoal-500">
                                  {
                                    employee.employee_number
                                  }
                                  {" • "}
                                  {
                                    employee.job_title ??
                                    "Employee"
                                  }
                                </p>

                              </div>

                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:w-[420px]">

                              <div className="rounded-xl bg-charcoal-50 px-4 py-3">
                                <p className="text-xs text-charcoal-500">
                                  Hours Worked
                                </p>

                                <p className="mt-1 text-base font-bold text-charcoal-900">
                                  {totals.total.toFixed(
                                    2
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl bg-charcoal-50 px-4 py-3">
                                <p className="text-xs text-charcoal-500">
                                  Days Present
                                </p>

                                <p className="mt-1 text-base font-bold text-charcoal-900">
                                  {
                                    totals.presentDays
                                  }
                                </p>
                              </div>

                              <div className="rounded-xl bg-[#20AEB8]/5 px-4 py-3">
                                <p className="text-xs text-charcoal-500">
                                  Overtime
                                </p>

                                <p className="mt-1 text-base font-bold text-[#168892]">
                                  {totals.overtime.toFixed(
                                    2
                                  )}
                                </p>
                              </div>

                            </div>

                            <ArrowRight className="hidden h-5 w-5 shrink-0 text-charcoal-400 lg:block" />

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>
              )}

            </div>
          </>
        )}

        {/* ADD ATTENDANCE FORM */}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 p-4">

            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-charcoal-100 bg-white p-6">

                <div>
                  <h2 className="text-lg font-semibold text-charcoal-900">
                    Record Employee Attendance
                  </h2>

                  <p className="mt-1 text-sm text-charcoal-500">
                    Record the employee&apos;s actual working times.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-50 hover:text-charcoal-900"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

              <div className="p-6">

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
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "employeeId",
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="">
                        Select employee
                      </option>

                      {employees.map(
                        (
                          employee
                        ) => (
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
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "attendanceDate",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "clockIn",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "clockOut",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "breakStart",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "breakEnd",
                          event.target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "employeeNotes",
                          event.target
                            .value
                        )
                      }
                      placeholder="Optional notes about today's attendance..."
                      className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />

                  </div>

                </div>

                {/* CALCULATED HOURS */}

                <div className="mt-6 rounded-xl border border-[#20AEB8]/20 bg-[#20AEB8]/5 p-5">

                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#20AEB8]" />

                    <h3 className="text-sm font-semibold text-charcoal-900">
                      Calculated Working Hours
                    </h3>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">

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
                        Overtime
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#20AEB8]">
                        {currentCalculation.overtime.toFixed(
                          2
                        )}
                      </p>
                    </div>

                  </div>

                </div>

                {/* BUTTONS */}

                <div className="mt-6 flex justify-end gap-3 border-t border-charcoal-100 pt-6">

                  <button
                    type="button"
                    onClick={
                      closeForm
                    }
                    disabled={
                      saving
                    }
                    className="rounded-lg border border-charcoal-200 px-5 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void submitAttendance()
                    }
                    disabled={
                      saving
                    }
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

            </div>

          </div>
        )}

      </div>
    </DashboardShell>
  );
}