"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Check,
  ChevronDown,
  Clock3,
  DollarSign,
  FileText,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  employment_status: string;
  pay_type: string;
  basic_salary: number;
  hourly_rate: number;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  normal_hours: number;
  overtime_hours: number;
  status: string;
}

interface PayrollRun {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  status: string;
  total_normal_hours: number;
  total_overtime_hours: number;
  total_gross_pay: number;
  total_paye: number;
  total_uif: number;
  total_other_deductions: number;
  total_net_pay: number;
  notes: string | null;
  created_at: string;
}

interface PayrollItem {
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
}

interface PayrollItemAttendance {
  id: string;
  payroll_item_id: string;
  attendance_id: string;
  normal_hours: number;
  overtime_hours: number;
}

/* =========================================================
   CONSTANTS
========================================================= */

const OVERTIME_MULTIPLIER = 1.5;

const UIF_RATE = 0.01;
const UIF_MONTHLY_CEILING = 17712;
const UIF_MAX_EMPLOYEE = 177.12;

/*
 * SARS 2026/27 individual tax year:
 * 1 March 2026 - 28 February 2027
 */

const SARS_PRIMARY_REBATE = 17820;

/* =========================================================
   HELPERS
========================================================= */

function money(value: number) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

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

function formatDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDaysBetween(
  start: string,
  end: string
) {
  if (!start || !end) {
    return 0;
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return 0;
  }

  const difference =
    endDate.getTime() -
    startDate.getTime();

  return Math.floor(
    difference /
      (1000 * 60 * 60 * 24)
  ) + 1;
}

/* =========================================================
   SARS PAYE ESTIMATE
========================================================= */

function calculateAnnualTax(
  annualTaxableIncome: number
) {
  const income = Math.max(
    0,
    annualTaxableIncome
  );

  let tax = 0;

  if (income <= 245100) {
    tax = income * 0.18;
  } else if (income <= 383100) {
    tax =
      44118 +
      (income - 245100) * 0.26;
  } else if (income <= 530200) {
    tax =
      79998 +
      (income - 383100) * 0.31;
  } else if (income <= 695800) {
    tax =
      125599 +
      (income - 530200) * 0.36;
  } else if (income <= 887000) {
    tax =
      185215 +
      (income - 695800) * 0.39;
  } else if (income <= 1878600) {
    tax =
      259783 +
      (income - 887000) * 0.41;
  } else {
    tax =
      666339 +
      (income - 1878600) * 0.45;
  }

  return Math.max(
    0,
    tax - SARS_PRIMARY_REBATE
  );
}

/*
 * This estimates monthly PAYE by
 * annualising the current payroll
 * amount.
 *
 * It is deliberately kept separate
 * from UIF.
 */

function calculateEstimatedPAYE(
  grossPay: number
) {
  if (grossPay <= 0) {
    return 0;
  }

  const annualIncome =
    grossPay * 12;

  const annualTax =
    calculateAnnualTax(
      annualIncome
    );

  return Math.max(
    0,
    annualTax / 12
  );
}

/* =========================================================
   UIF
========================================================= */

function calculateUIF(
  grossPay: number
) {
  if (grossPay <= 0) {
    return 0;
  }

  return Math.min(
    grossPay * UIF_RATE,
    UIF_MAX_EMPLOYEE
  );
}

/* =========================================================
   PAYROLL CALCULATIONS
========================================================= */

function calculateNormalPay(
  normalHours: number,
  hourlyRate: number
) {
  return (
    normalHours *
    hourlyRate
  );
}

function calculateOvertimePay(
  overtimeHours: number,
  hourlyRate: number
) {
  return (
    overtimeHours *
    hourlyRate *
    OVERTIME_MULTIPLIER
  );
}

/* =========================================================
   STATUS COLORS
========================================================= */

function getStatusClasses(
  status: string
) {
  switch (status) {
    case "finalised":
      return "bg-green-50 text-green-700";

    case "approved":
      return "bg-blue-50 text-blue-700";

    case "calculated":
      return "bg-purple-50 text-purple-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-yellow-50 text-yellow-700";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function EmployeePayrollPage() {
  const supabase = createClient();

  /* -------------------------------------------------------
     EMPLOYEES
  ------------------------------------------------------- */

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  /* -------------------------------------------------------
     ATTENDANCE
  ------------------------------------------------------- */

  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);

  /* -------------------------------------------------------
     PAYROLL RUNS
  ------------------------------------------------------- */

  const [payrollRuns, setPayrollRuns] =
    useState<PayrollRun[]>([]);

  const [selectedRunId, setSelectedRunId] =
    useState("");

  const [payrollItems, setPayrollItems] =
    useState<PayrollItem[]>([]);

  const [payrollItemAttendance, setPayrollItemAttendance] =
    useState<PayrollItemAttendance[]>([]);

  /* -------------------------------------------------------
     PERIOD
  ------------------------------------------------------- */

  const [periodStart, setPeriodStart] =
    useState("");

  const [periodEnd, setPeriodEnd] =
    useState("");

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  const [loading, setLoading] =
    useState(true);

  const [loadingRuns, setLoadingRuns] =
    useState(false);

  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [calculating, setCalculating] =
    useState(false);

  const [approving, setApproving] =
    useState(false);

  const [finalising, setFinalising] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showCreateRun, setShowCreateRun] =
    useState(false);

  const [notes, setNotes] =
    useState("");

  /* =======================================================
     LOAD EMPLOYEES
  ======================================================= */

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
              job_title,
              department,
              employment_status,
              pay_type,
              basic_salary,
              hourly_rate
            `
          )
          .order("first_name", {
            ascending: true,
          });

        if (employeeError) {
          throw employeeError;
        }

        const list =
          (data ?? []).map(
            (employee) => ({
              ...employee,
              basic_salary:
                numberValue(
                  employee.basic_salary
                ),
              hourly_rate:
                numberValue(
                  employee.hourly_rate
                ),
            })
          ) as Employee[];

        setEmployees(list);

        const firstActive =
          list.find(
            (employee) =>
              employee.employment_status ===
              "Active"
          );

        if (firstActive) {
          setSelectedEmployeeId(
            firstActive.id
          );
        } else if (list.length > 0) {
          setSelectedEmployeeId(
            list[0].id
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

  /* =======================================================
     LOAD PAYROLL RUNS
  ======================================================= */

  async function loadPayrollRuns() {
    try {
      setLoadingRuns(true);

      const {
        data,
        error: runsError,
      } = await supabase
        .from("payroll_runs")
        .select("*")
        .order(
          "pay_period_start",
          {
            ascending: false,
          }
        );

      if (runsError) {
        throw runsError;
      }

      const runs =
        (data ?? []).map(
          (run) => ({
            ...run,
            total_normal_hours:
              numberValue(
                run.total_normal_hours
              ),
            total_overtime_hours:
              numberValue(
                run.total_overtime_hours
              ),
            total_gross_pay:
              numberValue(
                run.total_gross_pay
              ),
            total_paye:
              numberValue(
                run.total_paye
              ),
            total_uif:
              numberValue(
                run.total_uif
              ),
            total_other_deductions:
              numberValue(
                run.total_other_deductions
              ),
            total_net_pay:
              numberValue(
                run.total_net_pay
              ),
          })
        ) as PayrollRun[];

      setPayrollRuns(runs);

      if (
        selectedRunId &&
        !runs.some(
          (run) =>
            run.id === selectedRunId
        )
      ) {
        setSelectedRunId("");
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payroll runs."
      );
    } finally {
      setLoadingRuns(false);
    }
  }

  useEffect(() => {
    loadPayrollRuns();
  }, []);

  /* =======================================================
     SELECTED EMPLOYEE
  ======================================================= */

  const selectedEmployee =
    useMemo(
      () =>
        employees.find(
          (employee) =>
            employee.id ===
            selectedEmployeeId
        ) ?? null,
      [
        employees,
        selectedEmployeeId,
      ]
    );

  /* =======================================================
     SELECTED RUN
  ======================================================= */

  const selectedRun =
    useMemo(
      () =>
        payrollRuns.find(
          (run) =>
            run.id ===
            selectedRunId
        ) ?? null,
      [
        payrollRuns,
        selectedRunId,
      ]
    );

  /* =======================================================
     LOAD ATTENDANCE FOR PERIOD
  ======================================================= */

  async function loadAttendanceForPeriod(
    employeeId: string,
    start: string,
    end: string
  ) {
    if (
      !employeeId ||
      !start ||
      !end
    ) {
      setAttendance([]);
      return;
    }

    try {
      setLoadingAttendance(true);

      const {
        data,
        error: attendanceError,
      } = await supabase
        .from("attendance")
        .select(
          `
            id,
            employee_id,
            attendance_date,
            normal_hours,
            overtime_hours,
            status
          `
        )
        .eq(
          "employee_id",
          employeeId
        )
        .eq(
          "status",
          "approved"
        )
        .gte(
          "attendance_date",
          start
        )
        .lte(
          "attendance_date",
          end
        )
        .order(
          "attendance_date",
          {
            ascending: true,
          }
        );

      if (attendanceError) {
        throw attendanceError;
      }

      setAttendance(
        (data ?? []).map(
          (record) => ({
            ...record,
            normal_hours:
              numberValue(
                record.normal_hours
              ),
            overtime_hours:
              numberValue(
                record.overtime_hours
              ),
          })
        ) as AttendanceRecord[]
      );
    } catch (err) {
      console.error(err);

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
    if (
      selectedEmployeeId &&
      periodStart &&
      periodEnd
    ) {
      loadAttendanceForPeriod(
        selectedEmployeeId,
        periodStart,
        periodEnd
      );
    }
  }, [
    selectedEmployeeId,
    periodStart,
    periodEnd,
  ]);

  /* =======================================================
     LOAD PAYROLL ITEMS
  ======================================================= */

  async function loadPayrollItems(
    runId: string
  ) {
    if (!runId) {
      setPayrollItems([]);
      setPayrollItemAttendance([]);
      return;
    }

    try {
      setError("");

      const {
        data,
        error: itemError,
      } = await supabase
        .from("payroll_items")
        .select("*")
        .eq(
          "payroll_run_id",
          runId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (itemError) {
        throw itemError;
      }

      const items =
        (data ?? []).map(
          (item) => ({
            ...item,
            basic_salary:
              numberValue(
                item.basic_salary
              ),
            hourly_rate:
              numberValue(
                item.hourly_rate
              ),
            normal_hours:
              numberValue(
                item.normal_hours
              ),
            overtime_hours:
              numberValue(
                item.overtime_hours
              ),
            normal_pay:
              numberValue(
                item.normal_pay
              ),
            overtime_pay:
              numberValue(
                item.overtime_pay
              ),
            gross_pay:
              numberValue(
                item.gross_pay
              ),
            paye:
              numberValue(
                item.paye
              ),
            uif_employee:
              numberValue(
                item.uif_employee
              ),
            other_deductions:
              numberValue(
                item.other_deductions
              ),
            net_pay:
              numberValue(
                item.net_pay
              ),
          })
        ) as PayrollItem[];

      setPayrollItems(items);

      if (items.length > 0) {
        const itemIds =
          items.map(
            (item) => item.id
          );

        const {
          data: links,
          error: linksError,
        } = await supabase
          .from(
            "payroll_item_attendance"
          )
          .select("*")
          .in(
            "payroll_item_id",
            itemIds
          );

        if (linksError) {
          throw linksError;
        }

        setPayrollItemAttendance(
          (links ?? []).map(
            (link) => ({
              ...link,
              normal_hours:
                numberValue(
                  link.normal_hours
                ),
              overtime_hours:
                numberValue(
                  link.overtime_hours
                ),
            })
          ) as PayrollItemAttendance[]
        );
      } else {
        setPayrollItemAttendance([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payroll items."
      );
    }
  }

  useEffect(() => {
    if (selectedRunId) {
      loadPayrollItems(
        selectedRunId
      );
    } else {
      setPayrollItems([]);
      setPayrollItemAttendance([]);
    }
  }, [selectedRunId]);

  /* =======================================================
     ATTENDANCE TOTALS
  ======================================================= */

  const attendanceTotals =
    useMemo(() => {
      return attendance.reduce(
        (totals, record) => ({
          normal:
            totals.normal +
            numberValue(
              record.normal_hours
            ),
          overtime:
            totals.overtime +
            numberValue(
              record.overtime_hours
            ),
        }),
        {
          normal: 0,
          overtime: 0,
        }
      );
    }, [attendance]);

  /* =======================================================
     CURRENT EMPLOYEE PAYROLL PREVIEW
  ======================================================= */

  const currentPreview =
    useMemo(() => {
      const hourlyRate =
        selectedEmployee?.hourly_rate ??
        0;

      const normalHours =
        attendanceTotals.normal;

      const overtimeHours =
        attendanceTotals.overtime;

      const normalPay =
        calculateNormalPay(
          normalHours,
          hourlyRate
        );

      const overtimePay =
        calculateOvertimePay(
          overtimeHours,
          hourlyRate
        );

      const grossPay =
        normalPay +
        overtimePay;

      const paye =
        calculateEstimatedPAYE(
          grossPay
        );

      const uif =
        calculateUIF(grossPay);

      const netPay =
        Math.max(
          0,
          grossPay -
            paye -
            uif
        );

      return {
        hourlyRate,
        normalHours,
        overtimeHours,
        normalPay,
        overtimePay,
        grossPay,
        paye,
        uif,
        otherDeductions: 0,
        netPay,
      };
    }, [
      selectedEmployee,
      attendanceTotals,
    ]);

  /* =======================================================
     RUN TOTALS
  ======================================================= */

  const runTotals =
    useMemo(() => {
      return payrollItems.reduce(
        (totals, item) => ({
          normalHours:
            totals.normalHours +
            numberValue(
              item.normal_hours
            ),
          overtimeHours:
            totals.overtimeHours +
            numberValue(
              item.overtime_hours
            ),
          grossPay:
            totals.grossPay +
            numberValue(
              item.gross_pay
            ),
          paye:
            totals.paye +
            numberValue(
              item.paye
            ),
          uif:
            totals.uif +
            numberValue(
              item.uif_employee
            ),
          deductions:
            totals.deductions +
            numberValue(
              item.other_deductions
            ),
          netPay:
            totals.netPay +
            numberValue(
              item.net_pay
            ),
        }),
        {
          normalHours: 0,
          overtimeHours: 0,
          grossPay: 0,
          paye: 0,
          uif: 0,
          deductions: 0,
          netPay: 0,
        }
      );
    }, [payrollItems]);

  /* =======================================================
     CREATE PAYROLL RUN
  ======================================================= */

  async function handleCreatePayrollRun(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!periodStart || !periodEnd) {
      setError(
        "Please select both the payroll period start and end dates."
      );
      return;
    }

    if (periodEnd < periodStart) {
      setError(
        "The payroll period end date must be on or after the start date."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data,
        error: insertError,
      } = await supabase
        .from("payroll_runs")
        .insert({
          pay_period_start:
            periodStart,
          pay_period_end:
            periodEnd,
          status: "draft",
          notes:
            notes.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!data) {
        throw new Error(
          "Payroll run was not created."
        );
      }

      const newRun =
        data as PayrollRun;

      setPayrollRuns(
        (current) => [
          newRun,
          ...current,
        ]
      );

      setSelectedRunId(
        newRun.id
      );

      setShowCreateRun(false);
      setNotes("");

      setSuccess(
        "Payroll run created successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create payroll run."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CALCULATE PAYROLL
  ======================================================= */

  async function handleCalculatePayroll() {
    if (!selectedRun) {
      setError(
        "Please select a payroll run."
      );
      return;
    }

    if (
      selectedRun.status !== "draft"
    ) {
      setError(
        "Only draft payroll runs can be calculated."
      );
      return;
    }

    setError("");
    setSuccess("");

    try {
      setCalculating(true);

      /*
       * Get ALL active employees.
       */

      const activeEmployees =
        employees.filter(
          (employee) =>
            employee.employment_status ===
              "Active" &&
            employee.pay_type
              ?.toLowerCase()
              .includes("hour")
        );

      if (
        activeEmployees.length === 0
      ) {
        throw new Error(
          "No active hourly employees were found."
        );
      }

      /*
       * Load approved attendance
       * for the entire payroll period.
       */

      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from("attendance")
        .select(
          `
            id,
            employee_id,
            attendance_date,
            normal_hours,
            overtime_hours,
            status
          `
        )
        .eq(
          "status",
          "approved"
        )
        .gte(
          "attendance_date",
          selectedRun.pay_period_start
        )
        .lte(
          "attendance_date",
          selectedRun.pay_period_end
        )
        .order(
          "attendance_date",
          {
            ascending: true,
          }
        );

      if (attendanceError) {
        throw attendanceError;
      }

      const approvedAttendance =
        (attendanceData ??
          []) as AttendanceRecord[];

      /*
       * Remove any existing items
       * for this draft run first.
       */

      const {
        data: existingItems,
        error: existingItemsError,
      } = await supabase
        .from("payroll_items")
        .select("id")
        .eq(
          "payroll_run_id",
          selectedRun.id
        );

      if (existingItemsError) {
        throw existingItemsError;
      }

      if (
        existingItems &&
        existingItems.length > 0
      ) {
        const ids =
          existingItems.map(
            (item) => item.id
          );

        const {
          error: deleteLinksError,
        } = await supabase
          .from(
            "payroll_item_attendance"
          )
          .delete()
          .in(
            "payroll_item_id",
            ids
          );

        if (deleteLinksError) {
          throw deleteLinksError;
        }

        const {
          error: deleteItemsError,
        } = await supabase
          .from("payroll_items")
          .delete()
          .eq(
            "payroll_run_id",
            selectedRun.id
          );

        if (deleteItemsError) {
          throw deleteItemsError;
        }
      }

      /*
       * Build payroll items.
       */

      const createdItems: PayrollItem[] =
        [];

      for (
        const employee of activeEmployees
      ) {
        const employeeAttendance =
          approvedAttendance.filter(
            (record) =>
              record.employee_id ===
              employee.id
          );

        const normalHours =
          employeeAttendance.reduce(
            (total, record) =>
              total +
              numberValue(
                record.normal_hours
              ),
            0
          );

        const overtimeHours =
          employeeAttendance.reduce(
            (total, record) =>
              total +
              numberValue(
                record.overtime_hours
              ),
            0
          );

        const hourlyRate =
          numberValue(
            employee.hourly_rate
          );

        const normalPay =
          calculateNormalPay(
            normalHours,
            hourlyRate
          );

        const overtimePay =
          calculateOvertimePay(
            overtimeHours,
            hourlyRate
          );

        const grossPay =
          normalPay +
          overtimePay;

        const paye =
          calculateEstimatedPAYE(
            grossPay
          );

        const uif =
          calculateUIF(
            grossPay
          );

        const netPay =
          Math.max(
            0,
            grossPay -
              paye -
              uif
          );

        const {
          data: item,
          error: itemError,
        } = await supabase
          .from("payroll_items")
          .insert({
            payroll_run_id:
              selectedRun.id,
            employee_id:
              employee.id,
            pay_type:
              employee.pay_type,
            basic_salary:
              numberValue(
                employee.basic_salary
              ),
            hourly_rate:
              hourlyRate,
            normal_hours:
              normalHours,
            overtime_hours:
              overtimeHours,
            normal_pay:
              normalPay,
            overtime_pay:
              overtimePay,
            gross_pay:
              grossPay,
            paye:
              paye,
            uif_employee:
              uif,
            other_deductions:
              0,
            net_pay:
              netPay,
          })
          .select()
          .single();

        if (itemError) {
          throw itemError;
        }

        if (!item) {
          throw new Error(
            `Unable to create payroll item for ${employee.first_name} ${employee.last_name}.`
          );
        }

        const typedItem =
          item as PayrollItem;

        createdItems.push(
          typedItem
        );

        /*
         * Link every attendance
         * record to this payroll item.
         */

        if (
          employeeAttendance.length >
          0
        ) {
          const links =
            employeeAttendance.map(
              (record) => ({
                payroll_item_id:
                  typedItem.id,
                attendance_id:
                  record.id,
                normal_hours:
                  numberValue(
                    record.normal_hours
                  ),
                overtime_hours:
                  numberValue(
                    record.overtime_hours
                  ),
              })
            );

          const {
            error: linkError,
          } = await supabase
            .from(
              "payroll_item_attendance"
            )
            .insert(links);

          if (linkError) {
            throw linkError;
          }
        }
      }

      /*
       * Calculate run totals.
       */

      const totals =
        createdItems.reduce(
          (result, item) => ({
            normalHours:
              result.normalHours +
              numberValue(
                item.normal_hours
              ),
            overtimeHours:
              result.overtimeHours +
              numberValue(
                item.overtime_hours
              ),
            grossPay:
              result.grossPay +
              numberValue(
                item.gross_pay
              ),
            paye:
              result.paye +
              numberValue(
                item.paye
              ),
            uif:
              result.uif +
              numberValue(
                item.uif_employee
              ),
            deductions:
              result.deductions +
              numberValue(
                item.other_deductions
              ),
            netPay:
              result.netPay +
              numberValue(
                item.net_pay
              ),
          }),
          {
            normalHours: 0,
            overtimeHours: 0,
            grossPay: 0,
            paye: 0,
            uif: 0,
            deductions: 0,
            netPay: 0,
          }
        );

      const {
        data: updatedRun,
        error: updateRunError,
      } = await supabase
        .from("payroll_runs")
        .update({
          status: "calculated",
          total_normal_hours:
            totals.normalHours,
          total_overtime_hours:
            totals.overtimeHours,
          total_gross_pay:
            totals.grossPay,
          total_paye:
            totals.paye,
          total_uif:
            totals.uif,
          total_other_deductions:
            totals.deductions,
          total_net_pay:
            totals.netPay,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          selectedRun.id
        )
        .select()
        .single();

      if (updateRunError) {
        throw updateRunError;
      }

      setPayrollItems(
        createdItems
      );

      setPayrollItemAttendance([]);

      /*
       * Reload the links.
       */

      const itemIds =
        createdItems.map(
          (item) => item.id
        );

      if (itemIds.length > 0) {
        const {
          data: links,
        } = await supabase
          .from(
            "payroll_item_attendance"
          )
          .select("*")
          .in(
            "payroll_item_id",
            itemIds
          );

        setPayrollItemAttendance(
          (links ?? []) as PayrollItemAttendance[]
        );
      }

      if (updatedRun) {
        setPayrollRuns(
          (current) =>
            current.map(
              (run) =>
                run.id ===
                selectedRun.id
                  ? (updatedRun as PayrollRun)
                  : run
            )
        );
      }

      setSuccess(
        `Payroll calculated successfully for ${createdItems.length} hourly employee(s).`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate payroll."
      );
    } finally {
      setCalculating(false);
    }
  }

  /* =======================================================
     APPROVE PAYROLL
  ======================================================= */

  async function handleApprovePayroll() {
    if (!selectedRun) {
      return;
    }

    if (
      selectedRun.status !==
      "calculated"
    ) {
      setError(
        "Only calculated payroll can be approved."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Approve this payroll run? Once approved, the payroll calculation can no longer be recalculated from this screen."
      );

    if (!confirmed) {
      return;
    }

    try {
      setApproving(true);
      setError("");
      setSuccess("");

      const {
        data,
        error: updateError,
      } = await supabase
        .from("payroll_runs")
        .update({
          status: "approved",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          selectedRun.id
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPayrollRuns(
        (current) =>
          current.map(
            (run) =>
              run.id ===
              selectedRun.id
                ? (data as PayrollRun)
                : run
          )
      );

      setSuccess(
        "Payroll approved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve payroll."
      );
    } finally {
      setApproving(false);
    }
  }

  /* =======================================================
     FINALISE PAYROLL
  ======================================================= */

  async function handleFinalisePayroll() {
    if (!selectedRun) {
      return;
    }

    if (
      selectedRun.status !==
      "approved"
    ) {
      setError(
        "Only approved payroll can be finalised."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Finalise this payroll run? This should only be done once the payroll has been checked and is ready for payment."
      );

    if (!confirmed) {
      return;
    }

    try {
      setFinalising(true);
      setError("");
      setSuccess("");

      const {
        data,
        error: updateError,
      } = await supabase
        .from("payroll_runs")
        .update({
          status: "finalised",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          selectedRun.id
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPayrollRuns(
        (current) =>
          current.map(
            (run) =>
              run.id ===
              selectedRun.id
                ? (data as PayrollRun)
                : run
          )
      );

      setSuccess(
        "Payroll finalised successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to finalise payroll."
      );
    } finally {
      setFinalising(false);
    }
  }

  /* =======================================================
     DELETE PAYROLL RUN
  ======================================================= */

  async function handleDeletePayrollRun(
    runId: string
  ) {
    const run =
      payrollRuns.find(
        (item) =>
          item.id === runId
      );

    if (!run) {
      return;
    }

    if (
      run.status !== "draft"
    ) {
      setError(
        "Only draft payroll runs can be deleted."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this draft payroll run?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(runId);
      setError("");
      setSuccess("");

      const {
        error: deleteError,
      } = await supabase
        .from("payroll_runs")
        .delete()
        .eq(
          "id",
          runId
        );

      if (deleteError) {
        throw deleteError;
      }

      setPayrollRuns(
        (current) =>
          current.filter(
            (item) =>
              item.id !== runId
          )
      );

      if (
        selectedRunId === runId
      ) {
        setSelectedRunId("");
        setPayrollItems([]);
        setPayrollItemAttendance([]);
      }

      setSuccess(
        "Draft payroll run deleted."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete payroll run."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =======================================================
     CHANGE DEDUCTIONS
  ======================================================= */

  async function handleDeductionChange(
    item: PayrollItem,
    value: string
  ) {
    if (
      !selectedRun ||
      selectedRun.status ===
        "finalised"
    ) {
      return;
    }

    const deductions =
      Math.max(
        0,
        numberValue(value)
      );

    const netPay =
      Math.max(
        0,
        item.gross_pay -
          item.paye -
          item.uif_employee -
          deductions
      );

    try {
      const {
        data,
        error: updateError,
      } = await supabase
        .from("payroll_items")
        .update({
          other_deductions:
            deductions,
          net_pay:
            netPay,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          item.id
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPayrollItems(
        (current) =>
          current.map(
            (currentItem) =>
              currentItem.id ===
              item.id
                ? (data as PayrollItem)
                : currentItem
          )
      );

      /*
       * Update run totals.
       */

      const updatedItems =
        payrollItems.map(
          (currentItem) =>
            currentItem.id ===
            item.id
              ? (data as PayrollItem)
              : currentItem
        );

      const totalDeductions =
        updatedItems.reduce(
          (total, currentItem) =>
            total +
            numberValue(
              currentItem.other_deductions
            ),
          0
        );

      const totalNet =
        updatedItems.reduce(
          (total, currentItem) =>
            total +
            numberValue(
              currentItem.net_pay
            ),
          0
        );

      const {
        data: updatedRun,
      } = await supabase
        .from("payroll_runs")
        .update({
          total_other_deductions:
            totalDeductions,
          total_net_pay:
            totalNet,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          selectedRun.id
        )
        .select()
        .single();

      if (updatedRun) {
        setPayrollRuns(
          (current) =>
            current.map(
              (run) =>
                run.id ===
                selectedRun.id
                  ? (updatedRun as PayrollRun)
                  : run
            )
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update deduction."
      );
    }
  }

  /* =======================================================
     SELECT RUN
  ======================================================= */

  function handleSelectRun(
    runId: string
  ) {
    const run =
      payrollRuns.find(
        (item) =>
          item.id === runId
      );

    setSelectedRunId(
      runId
    );

    if (run) {
      setPeriodStart(
        run.pay_period_start
      );

      setPeriodEnd(
        run.pay_period_end
      );
    }

    setError("");
    setSuccess("");
  }

  /* =======================================================
     RESET CREATE FORM
  ======================================================= */

  function resetCreateForm() {
    setPeriodStart("");
    setPeriodEnd("");
    setNotes("");
    setShowCreateRun(false);
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DashboardShell
        title="Payroll"
        subtitle="Calculate and manage employee payroll"
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

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <DashboardShell
      title="Payroll"
      subtitle="Calculate and manage employee payroll"
    >
      <div className="space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <DollarSign size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-charcoal-900">
                Payroll
              </h1>

              <p className="text-sm text-charcoal-500">
                Calculate hourly employee wages from approved attendance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateRun(true);
              setError("");
              setSuccess("");
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <Plus size={18} />
            New Payroll Run
          </button>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0"
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
              onClick={() =>
                setSuccess("")
              }
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =================================================
            CREATE RUN
        ================================================= */}

        {showCreateRun && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">
                  New Payroll Run
                </h2>

                <p className="text-sm text-charcoal-500">
                  Create a payroll period before calculating wages.
                </p>
              </div>

              <button
                type="button"
                onClick={resetCreateForm}
                className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-50 hover:text-charcoal-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreatePayrollRun
              }
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Pay Period Start
                  </label>

                  <input
                    type="date"
                    value={periodStart}
                    onChange={(event) =>
                      setPeriodStart(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-charcoal-700">
                    Pay Period End
                  </label>

                  <input
                    type="date"
                    value={periodEnd}
                    min={
                      periodStart ||
                      undefined
                    }
                    onChange={(event) =>
                      setPeriodEnd(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    required
                  />
                </div>
              </div>

              {periodStart &&
                periodEnd && (
                  <div className="rounded-lg bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                    Period length:{" "}
                    <strong>
                      {calculateDaysBetween(
                        periodStart,
                        periodEnd
                      )}{" "}
                      days
                    </strong>
                  </div>
                )}

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
                  placeholder="Optional payroll notes..."
                  className="w-full resize-none rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-charcoal-100 pt-5">
                <button
                  type="button"
                  onClick={
                    resetCreateForm
                  }
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create Run
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================
            PAYROLL RUN SELECTOR
        ================================================= */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div className="w-full max-w-xl">
              <label className="mb-2 block text-sm font-semibold text-charcoal-700">
                Payroll Run
              </label>

              <div className="relative">
                <select
                  value={selectedRunId}
                  onChange={(event) =>
                    handleSelectRun(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-lg border border-charcoal-200 bg-white px-4 py-3 pr-10 text-sm text-charcoal-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">
                    Select a payroll run
                  </option>

                  {payrollRuns.map(
                    (run) => (
                      <option
                        key={run.id}
                        value={run.id}
                      >
                        {formatDate(
                          run.pay_period_start
                        )}{" "}
                        —{" "}
                        {formatDate(
                          run.pay_period_end
                        )}{" "}
                        ·{" "}
                        {run.status}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={
                loadPayrollRuns
              }
              disabled={
                loadingRuns
              }
              className="flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  loadingRuns
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {selectedRun && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg bg-charcoal-50 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-charcoal-500">
                  Period:
                </span>{" "}
                <strong className="text-charcoal-900">
                  {formatDate(
                    selectedRun.pay_period_start
                  )}{" "}
                  —{" "}
                  {formatDate(
                    selectedRun.pay_period_end
                  )}
                </strong>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  selectedRun.status
                )}`}
              >
                {selectedRun.status}
              </span>
            </div>
          )}
        </div>

        {/* =================================================
            ACTION BAR
        ================================================= */}

        {selectedRun && (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="font-bold text-charcoal-900">
                  Payroll Actions
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Build payroll from approved attendance records.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                {selectedRun.status ===
                  "draft" && (
                  <button
                    type="button"
                    onClick={
                      handleCalculatePayroll
                    }
                    disabled={
                      calculating
                    }
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {calculating ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator
                          size={17}
                        />
                        Calculate Payroll
                      </>
                    )}
                  </button>
                )}

                {selectedRun.status ===
                  "calculated" && (
                  <button
                    type="button"
                    onClick={
                      handleApprovePayroll
                    }
                    disabled={
                      approving
                    }
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {approving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check
                          size={17}
                        />
                        Approve Payroll
                      </>
                    )}
                  </button>
                )}

                {selectedRun.status ===
                  "approved" && (
                  <button
                    type="button"
                    onClick={
                      handleFinalisePayroll
                    }
                    disabled={
                      finalising
                    }
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {finalising ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Finalising...
                      </>
                    ) : (
                      <>
                        <Lock
                          size={17}
                        />
                        Finalise Payroll
                      </>
                    )}
                  </button>
                )}

                {selectedRun.status ===
                  "draft" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeletePayrollRun(
                        selectedRun.id
                      )
                    }
                    disabled={
                      deletingId ===
                      selectedRun.id
                    }
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId ===
                    selectedRun.id ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2
                        size={17}
                      />
                    )}
                    Delete Draft
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            EMPLOYEE PREVIEW
        ================================================= */}

        {selectedRun &&
          selectedRun.status ===
            "draft" && (
            <div className="grid gap-5 xl:grid-cols-2">

              <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-charcoal-50 p-2.5 text-charcoal-600">
                    <Users size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-charcoal-900">
                      Employee Preview
                    </h2>

                    <p className="text-sm text-charcoal-500">
                      Review approved attendance for an employee.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-charcoal-700">
                    Employee
                  </label>

                  <div className="relative">
                    <select
                      value={
                        selectedEmployeeId
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedEmployeeId(
                          event.target.value
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-charcoal-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    >
                      {employees.length ===
                        0 && (
                        <option value="">
                          No employees
                        </option>
                      )}

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

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400"
                    />
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="mt-4 rounded-lg bg-charcoal-50 p-4">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="font-semibold text-charcoal-900">
                          {
                            selectedEmployee.first_name
                          }{" "}
                          {
                            selectedEmployee.last_name
                          }
                        </p>

                        <p className="text-xs text-charcoal-500">
                          {
                            selectedEmployee.job_title ||
                            "Employee"
                          }
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-charcoal-500">
                          Hourly Rate
                        </p>

                        <p className="text-lg font-bold text-cyan-700">
                          {money(
                            selectedEmployee.hourly_rate
                          )}
                        </p>
                      </div>
                    </div>

                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <MiniStat
                    icon={
                      <Clock3
                        size={17}
                      />
                    }
                    label="Normal Hours"
                    value={`${attendanceTotals.normal.toFixed(
                      2
                    )} hrs`}
                  />

                  <MiniStat
                    icon={
                      <Clock3
                        size={17}
                      />
                    }
                    label="Overtime"
                    value={`${attendanceTotals.overtime.toFixed(
                      2
                    )} hrs`}
                  />

                </div>

                {loadingAttendance && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-charcoal-500">
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    Loading approved attendance...
                  </div>
                )}

              </div>

              <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

                <h2 className="font-bold text-charcoal-900">
                  Payroll Preview
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Based on approved attendance in the selected period.
                </p>

                <div className="mt-5 space-y-3">

                  <SummaryRow
                    label="Normal Pay"
                    value={money(
                      currentPreview.normalPay
                    )}
                  />

                  <SummaryRow
                    label={`Overtime Pay (${OVERTIME_MULTIPLIER}×)`}
                    value={money(
                      currentPreview.overtimePay
                    )}
                  />

                  <div className="border-t border-charcoal-100 pt-3">
                    <SummaryRow
                      label="Gross Pay"
                      value={money(
                        currentPreview.grossPay
                      )}
                      strong
                    />
                  </div>

                  <SummaryRow
                    label="Estimated PAYE"
                    value={money(
                      currentPreview.paye
                    )}
                  />

                  <SummaryRow
                    label="UIF"
                    value={money(
                      currentPreview.uif
                    )}
                  />

                  <div className="border-t border-charcoal-100 pt-3">
                    <SummaryRow
                      label="Estimated Net Pay"
                      value={money(
                        currentPreview.netPay
                      )}
                      strong
                    />
                  </div>

                </div>

              </div>

            </div>
          )}

        {/* =================================================
            ATTENDANCE
        ================================================= */}

        {selectedRun &&
          selectedRun.status ===
            "draft" && (
            <div className="rounded-2xl border border-charcoal-100 bg-white shadow-sm">

              <div className="border-b border-charcoal-100 px-5 py-4">

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                  <div>
                    <h2 className="font-bold text-charcoal-900">
                      Approved Attendance
                    </h2>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Only approved attendance can be included in payroll.
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                    Approved only
                  </div>

                </div>

              </div>

              {attendance.length ===
              0 ? (
                <div className="px-5 py-10 text-center">

                  <Clock3
                    size={35}
                    className="mx-auto text-charcoal-300"
                  />

                  <p className="mt-3 font-medium text-charcoal-700">
                    No approved attendance
                  </p>

                  <p className="mt-1 text-sm text-charcoal-500">
                    No approved attendance was found for the selected employee and period.
                  </p>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[650px]">

                    <thead>
                      <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">

                        <th className="px-5 py-3">
                          Date
                        </th>

                        <th className="px-5 py-3 text-right">
                          Normal
                        </th>

                        <th className="px-5 py-3 text-right">
                          Overtime
                        </th>

                        <th className="px-5 py-3 text-right">
                          Total
                        </th>

                        <th className="px-5 py-3">
                          Status
                        </th>

                      </tr>
                    </thead>

                    <tbody>
                      {attendance.map(
                        (
                          record
                        ) => (
                          <tr
                            key={
                              record.id
                            }
                            className="border-b border-charcoal-100 last:border-0"
                          >
                            <td className="px-5 py-4 text-sm font-medium text-charcoal-900">
                              {formatDate(
                                record.attendance_date
                              )}
                            </td>

                            <td className="px-5 py-4 text-right text-sm text-charcoal-600">
                              {numberValue(
                                record.normal_hours
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td className="px-5 py-4 text-right text-sm text-charcoal-600">
                              {numberValue(
                                record.overtime_hours
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td className="px-5 py-4 text-right text-sm font-semibold text-charcoal-900">
                              {(
                                numberValue(
                                  record.normal_hours
                                ) +
                                numberValue(
                                  record.overtime_hours
                                )
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                Approved
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>

                  </table>

                </div>
              )}

            </div>
          )}

        {/* =================================================
            PAYROLL ITEMS
        ================================================= */}

        {selectedRun &&
          payrollItems.length >
            0 && (
            <div className="rounded-2xl border border-charcoal-100 bg-white shadow-sm">

              <div className="border-b border-charcoal-100 px-5 py-4">

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                  <div>
                    <h2 className="font-bold text-charcoal-900">
                      Payroll Items
                    </h2>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Employee-by-employee payroll calculation.
                    </p>
                  </div>

                  <div className="text-sm text-charcoal-500">
                    {payrollItems.length} employee
                    {payrollItems.length ===
                    1
                      ? ""
                      : "s"}
                  </div>

                </div>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1500px]">

                  <thead>
                    <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">

                      <th className="px-4 py-3">
                        Employee
                      </th>

                      <th className="px-4 py-3 text-right">
                        Rate
                      </th>

                      <th className="px-4 py-3 text-right">
                        Normal Hrs
                      </th>

                      <th className="px-4 py-3 text-right">
                        OT Hrs
                      </th>

                      <th className="px-4 py-3 text-right">
                        Normal Pay
                      </th>

                      <th className="px-4 py-3 text-right">
                        OT Pay
                      </th>

                      <th className="px-4 py-3 text-right">
                        Gross
                      </th>

                      <th className="px-4 py-3 text-right">
                        PAYE
                      </th>

                      <th className="px-4 py-3 text-right">
                        UIF
                      </th>

                      <th className="px-4 py-3 text-right">
                        Other Ded.
                      </th>

                      <th className="px-4 py-3 text-right">
                        Net Pay
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {payrollItems.map(
                      (item) => {
                        const employee =
                          employees.find(
                            (
                              current
                            ) =>
                              current.id ===
                              item.employee_id
                          );

                        return (
                          <tr
                            key={
                              item.id
                            }
                            className="border-b border-charcoal-100 last:border-0"
                          >

                            <td className="px-4 py-4">
                              <div>
                                <p className="text-sm font-semibold text-charcoal-900">
                                  {
                                    employee?.first_name
                                  }{" "}
                                  {
                                    employee?.last_name
                                  }
                                </p>

                                <p className="text-xs text-charcoal-500">
                                  {
                                    employee?.employee_number
                                  }
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-charcoal-700">
                              {money(
                                item.hourly_rate
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-charcoal-700">
                              {numberValue(
                                item.normal_hours
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-charcoal-700">
                              {numberValue(
                                item.overtime_hours
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-charcoal-700">
                              {money(
                                item.normal_pay
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-charcoal-700">
                              {money(
                                item.overtime_pay
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-semibold text-charcoal-900">
                              {money(
                                item.gross_pay
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-charcoal-700">
                              {money(
                                item.paye
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-charcoal-700">
                              {money(
                                item.uif_employee
                              )}
                            </td>

                            <td className="px-4 py-4 text-right">

                              {selectedRun.status ===
                                "finalised" ? (
                                <span className="text-sm text-charcoal-700">
                                  {money(
                                    item.other_deductions
                                  )}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  defaultValue={numberValue(
                                    item.other_deductions
                                  )}
                                  onBlur={(
                                    event
                                  ) =>
                                    handleDeductionChange(
                                      item,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  className="w-28 rounded-lg border border-charcoal-200 px-2.5 py-2 text-right text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                />
                              )}

                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-green-700">
                              {money(
                                item.net_pay
                              )}
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                  <tfoot>
                    <tr className="bg-charcoal-50">

                      <td className="px-4 py-4 text-sm font-bold text-charcoal-900">
                        TOTAL
                      </td>

                      <td />

                      <td className="px-4 py-4 text-right text-sm font-bold text-charcoal-900">
                        {runTotals.normalHours.toFixed(
                          2
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-bold text-charcoal-900">
                        {runTotals.overtimeHours.toFixed(
                          2
                        )}
                      </td>

                      <td />

                      <td />

                      <td className="px-4 py-4 text-right text-sm font-bold text-charcoal-900">
                        {money(
                          runTotals.grossPay
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-bold text-charcoal-900">
                        {money(
                          runTotals.paye
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-bold text-charcoal-900">
                        {money(
                          runTotals.uif
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-bold text-charcoal-900">
                        {money(
                          runTotals.deductions
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-bold text-green-700">
                        {money(
                          runTotals.netPay
                        )}
                      </td>

                    </tr>
                  </tfoot>

                </table>

              </div>

            </div>
          )}

        {/* =================================================
            RUN SUMMARY
        ================================================= */}

        {selectedRun && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">

            <PayrollSummaryCard
              title="Normal Hours"
              value={`${runTotals.normalHours.toFixed(
                2
              )} hrs`}
              icon={
                <Clock3 size={18} />
              }
            />

            <PayrollSummaryCard
              title="Overtime"
              value={`${runTotals.overtimeHours.toFixed(
                2
              )} hrs`}
              icon={
                <Clock3 size={18} />
              }
            />

            <PayrollSummaryCard
              title="Gross Pay"
              value={money(
                runTotals.grossPay
              )}
              icon={
                <DollarSign
                  size={18}
                />
              }
            />

            <PayrollSummaryCard
              title="PAYE"
              value={money(
                runTotals.paye
              )}
              icon={
                <FileText size={18} />
              }
            />

            <PayrollSummaryCard
              title="UIF"
              value={money(
                runTotals.uif
              )}
              icon={
                <FileText size={18} />
              }
            />

            <PayrollSummaryCard
              title="Net Pay"
              value={money(
                runTotals.netPay
              )}
              icon={
                <Check size={18} />
              }
              highlight
            />

          </div>
        )}

        {/* =================================================
            PAYROLL RUN HISTORY
        ================================================= */}

        <div className="rounded-2xl border border-charcoal-100 bg-white shadow-sm">

          <div className="border-b border-charcoal-100 px-5 py-4">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-charcoal-900">
                  Payroll Run History
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Previous payroll periods and their status.
                </p>
              </div>

              <span className="text-sm text-charcoal-400">
                {payrollRuns.length} run
                {payrollRuns.length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>

          </div>

          {payrollRuns.length ===
          0 ? (
            <div className="px-5 py-12 text-center">

              <DollarSign
                size={35}
                className="mx-auto text-charcoal-300"
              />

              <p className="mt-3 font-medium text-charcoal-700">
                No payroll runs
              </p>

              <p className="mt-1 text-sm text-charcoal-500">
                Create your first payroll run above.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">

                    <th className="px-5 py-3">
                      Period
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Gross
                    </th>

                    <th className="px-5 py-3 text-right">
                      PAYE
                    </th>

                    <th className="px-5 py-3 text-right">
                      UIF
                    </th>

                    <th className="px-5 py-3 text-right">
                      Net
                    </th>

                    <th className="px-5 py-3">
                      Created
                    </th>

                    <th className="px-5 py-3 text-right">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {payrollRuns.map(
                    (run) => (
                      <tr
                        key={
                          run.id
                        }
                        className={`border-b border-charcoal-100 last:border-0 ${
                          selectedRunId ===
                          run.id
                            ? "bg-cyan-50/40"
                            : ""
                        }`}
                      >

                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              handleSelectRun(
                                run.id
                              )
                            }
                            className="text-left"
                          >
                            <p className="text-sm font-semibold text-charcoal-900 hover:text-cyan-700">
                              {formatDate(
                                run.pay_period_start
                              )}{" "}
                              —{" "}
                              {formatDate(
                                run.pay_period_end
                              )}
                            </p>
                          </button>

                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              run.status
                            )}`}
                          >
                            {
                              run.status
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-charcoal-900">
                          {money(
                            run.total_gross_pay
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-charcoal-700">
                          {money(
                            run.total_paye
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-charcoal-700">
                          {money(
                            run.total_uif
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-green-700">
                          {money(
                            run.total_net_pay
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-charcoal-500">
                          {formatDateTime(
                            run.created_at
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">

                          {run.status ===
                            "draft" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePayrollRun(
                                  run.id
                                )
                              }
                              disabled={
                                deletingId ===
                                run.id
                              }
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                              title="Delete draft payroll"
                            >
                              {deletingId ===
                              run.id ? (
                                <Loader2
                                  size={
                                    17
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={
                                    17
                                  }
                                />
                              )}
                            </button>
                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* =================================================
            PAYROLL RULES
        ================================================= */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm">

          <h2 className="font-bold text-charcoal-900">
            Payroll Calculation Rules
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">

            <RuleCard
              title="Hourly Pay"
              text="Normal pay is calculated from approved normal attendance hours multiplied by the hourly rate stored on the employee profile."
            />

            <RuleCard
              title="Overtime"
              text="Overtime is currently calculated at 1.5 times the employee's hourly rate."
            />

            <RuleCard
              title="Attendance"
              text="Only attendance records with Approved status are included when calculating payroll."
            />

            <RuleCard
              title="UIF"
              text="Employee UIF is calculated at 1% of remuneration, capped at the current maximum employee contribution of R177.12 per month."
            />

            <RuleCard
              title="PAYE"
              text="PAYE is estimated using the current 2026/27 SARS individual tax brackets and primary rebate. Review the amount before finalising payroll."
              fullWidth
            />

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function MiniStat({
  icon,
  label,
  value,
}: MiniStatProps) {
  return (
    <div className="rounded-lg border border-charcoal-100 bg-white p-3">

      <div className="flex items-center gap-2 text-charcoal-500">
        {icon}

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-bold text-charcoal-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

interface SummaryRowProps {
  label: string;
  value: string;
  strong?: boolean;
}

function SummaryRow({
  label,
  value,
  strong = false,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span
        className={
          strong
            ? "text-sm font-bold text-charcoal-900"
            : "text-sm text-charcoal-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-base font-bold text-charcoal-900"
            : "text-sm font-semibold text-charcoal-800"
        }
      >
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   PAYROLL SUMMARY CARD
========================================================= */

interface PayrollSummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function PayrollSummaryCard({
  title,
  value,
  icon,
  highlight = false,
}: PayrollSummaryCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        highlight
          ? "border-green-200 bg-green-50"
          : "border-charcoal-100 bg-white"
      }`}
    >

      <div className="flex items-center gap-2 text-charcoal-500">
        {icon}

        <span className="text-xs font-semibold">
          {title}
        </span>
      </div>

      <p
        className={`mt-3 text-lg font-bold ${
          highlight
            ? "text-green-700"
            : "text-charcoal-900"
        }`}
      >
        {value}
      </p>

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
      className={`rounded-lg bg-charcoal-50 p-4 ${
        fullWidth
          ? "md:col-span-2"
          : ""
      }`}
    >
      <strong className="text-sm text-charcoal-900">
        {title}
      </strong>

      <p className="mt-1 text-sm leading-6 text-charcoal-600">
        {text}
      </p>
    </div>
  );
}