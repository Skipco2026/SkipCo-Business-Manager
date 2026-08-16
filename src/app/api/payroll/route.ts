import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

type Employee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  pay_type: string | null;
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
  status: string;
  employee: Employee | Employee[] | null;
};

function getEmployee(
  employee: AttendanceRecord["employee"]
): Employee | null {
  if (!employee) {
    return null;
  }

  if (Array.isArray(employee)) {
    return employee[0] ?? null;
  }

  return employee;
}

function getDayOfWeek(dateString: string): number {
  const date = new Date(`${dateString}T00:00:00`);
  return date.getDay();
}

function calculatePayroll(
  attendance: AttendanceRecord[]
) {
  const grouped = new Map<
    string,
    {
      employee: Employee;
      normalHours: number;
      overtimeHours: number;
      sundayHours: number;
      publicHolidayHours: number;
      normalPay: number;
      overtimePay: number;
      sundayPay: number;
      publicHolidayPay: number;
      grossPay: number;
    }
  >();

  /*
   * PAY RULES
   *
   * Normal hours:
   * hourly rate x normal hours
   *
   * Overtime:
   * 1.5 x hourly rate
   *
   * Sunday:
   * 2 x hourly rate
   *
   * Public holiday:
   * 2 x hourly rate
   *
   * IMPORTANT:
   * The attendance table already supplies
   * normal_hours and overtime_hours.
   *
   * Sunday and public-holiday treatment is
   * determined here from the attendance date.
   */

  for (const record of attendance) {
    const employee = getEmployee(record.employee);

    if (!employee) {
      continue;
    }

    const hourlyRate = Number(employee.hourly_rate) || 0;

    const normalHours =
      Number(record.normal_hours) || 0;

    const overtimeHours =
      Number(record.overtime_hours) || 0;

    const dayOfWeek = getDayOfWeek(
      record.attendance_date
    );

    const isSunday = dayOfWeek === 0;

    /*
     * Sunday hours are paid at double time.
     *
     * If attendance has overtime_hours on a Sunday,
     * those hours are treated as Sunday hours because
     * the Sunday rate takes precedence.
     */
    let sundayHours = 0;
    let normalPay = 0;
    let overtimePay = 0;
    let sundayPay = 0;

    if (isSunday) {
      sundayHours =
        normalHours + overtimeHours;

      sundayPay =
        sundayHours *
        hourlyRate *
        2;
    } else {
      normalPay =
        normalHours *
        hourlyRate;

      overtimePay =
        overtimeHours *
        hourlyRate *
        1.5;
    }

    const existing = grouped.get(employee.id);

    if (existing) {
      existing.normalHours += normalHours;
      existing.overtimeHours += overtimeHours;
      existing.sundayHours += sundayHours;

      existing.normalPay += normalPay;
      existing.overtimePay += overtimePay;
      existing.sundayPay += sundayPay;

      existing.grossPay +=
        normalPay +
        overtimePay +
        sundayPay;
    } else {
      grouped.set(employee.id, {
        employee,
        normalHours,
        overtimeHours,
        sundayHours,
        publicHolidayHours: 0,
        normalPay,
        overtimePay,
        sundayPay,
        publicHolidayPay: 0,
        grossPay:
          normalPay +
          overtimePay +
          sundayPay,
      });
    }
  }

  return Array.from(grouped.values());
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const startDate =
      searchParams.get("startDate");

    const endDate =
      searchParams.get("endDate");

    const employeeId =
      searchParams.get("employeeId");

    let query = supabase
      .from("attendance")
      .select(`
        id,
        employee_id,
        attendance_date,
        clock_in,
        break_start,
        break_end,
        clock_out,
        normal_hours,
        overtime_hours,
        status,
        employee:employees (
          id,
          employee_number,
          first_name,
          last_name,
          job_title,
          department,
          pay_type,
          hourly_rate
        )
      `)
      .eq("status", "approved")
      .order("attendance_date", {
        ascending: true,
      });

    if (startDate) {
      query = query.gte(
        "attendance_date",
        startDate
      );
    }

    if (endDate) {
      query = query.lte(
        "attendance_date",
        endDate
      );
    }

    if (employeeId) {
      query = query.eq(
        "employee_id",
        employeeId
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Payroll attendance error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to load payroll attendance.",
        },
        {
          status: 500,
        }
      );
    }

    const attendance =
      (data ?? []) as unknown as AttendanceRecord[];

    const payroll =
      calculatePayroll(attendance);

    return NextResponse.json({
      attendance,
      payroll,
    });
  } catch (error) {
    console.error(
      "Payroll GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payroll data.",
      },
      {
        status: 500,
      }
    );
  }
}