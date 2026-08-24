import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  basic_salary: number | null;
  hourly_rate: number | null;
};

type AttendanceRecord = {
  id: string;
  employee_id: string;
  attendance_date: string;
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

/**
 * Basic UIF calculation.
 *
 * Employee UIF contribution is 1% of remuneration,
 * subject to the applicable UIF contribution ceiling.
 *
 * We use R17,712 as the monthly UIF remuneration
 * ceiling, resulting in a maximum employee contribution
 * of R177.12 per month.
 *
 * For hourly employees, the calculation is based on
 * the actual gross remuneration for the payroll run.
 */
function calculateUIF(grossPay: number): number {
  if (grossPay <= 0) {
    return 0;
  }

  const uifCeiling = 17712;
  const maximumContribution = 177.12;

  const contribution =
    Math.min(grossPay, uifCeiling) * 0.01;

  return Math.min(
    contribution,
    maximumContribution
  );
}

/**
 * PAYE placeholder.
 *
 * PAYE should ultimately be calculated using the
 * employee's tax profile and the applicable SARS
 * tax-year rules.
 *
 * For now we safely return zero rather than applying
 * an incorrect tax calculation.
 *
 * This keeps payroll calculations accurate for gross,
 * UIF and net pay until the PAYE module is connected
 * to the proper tax calculation rules.
 */
function calculatePAYE(
  grossPay: number,
  _employee: Employee
): number {
  if (grossPay <= 0) {
    return 0;
  }

  return 0;
}

function calculateEmployeePayroll(
  attendance: AttendanceRecord[]
) {
  const grouped = new Map<
    string,
    {
      employee: Employee;
      normalHours: number;
      overtimeHours: number;
      normalPay: number;
      overtimePay: number;
      grossPay: number;
    }
  >();

  for (const record of attendance) {
    const employee = getEmployee(record.employee);

    if (!employee) {
      continue;
    }

    const hourlyRate =
      Number(employee.hourly_rate) || 0;

    const normalHours =
      Number(record.normal_hours) || 0;

    const overtimeHours =
      Number(record.overtime_hours) || 0;

    const dayOfWeek = getDayOfWeek(
      record.attendance_date
    );

    const isSunday = dayOfWeek === 0;

    let normalPay = 0;
    let overtimePay = 0;

    if (isSunday) {
      /*
       * Sunday work is paid at double time.
       *
       * We apply double time to both normal and
       * overtime attendance recorded on Sunday.
       */
      normalPay =
        normalHours *
        hourlyRate *
        2;

      overtimePay =
        overtimeHours *
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

    const existing =
      grouped.get(employee.id);

    if (existing) {
      existing.normalHours += normalHours;
      existing.overtimeHours += overtimeHours;
      existing.normalPay += normalPay;
      existing.overtimePay += overtimePay;
      existing.grossPay +=
        normalPay + overtimePay;
    } else {
      grouped.set(employee.id, {
        employee,
        normalHours,
        overtimeHours,
        normalPay,
        overtimePay,
        grossPay:
          normalPay + overtimePay,
      });
    }
  }

  return Array.from(grouped.values());
}

/* =========================================================
   GET
   Load payroll runs
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const payrollRunId =
      searchParams.get("payrollRunId");

    if (payrollRunId) {
      const { data, error } =
        await supabase
          .from("payroll_runs")
          .select("*")
          .eq("id", payrollRunId)
          .single();

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to load payroll run.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        payrollRun: data,
      });
    }

    const { data, error } =
      await supabase
        .from("payroll_runs")
        .select("*")
        .order(
          "pay_period_end",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "Payroll runs GET error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to load payroll runs.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payrollRuns: data ?? [],
    });
  } catch (error) {
    console.error(
      "Payroll runs GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payroll runs.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   Create payroll run
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const payPeriodStart =
      body.payPeriodStart;

    const payPeriodEnd =
      body.payPeriodEnd;

    const notes =
      body.notes ?? null;

    if (!payPeriodStart) {
      return NextResponse.json(
        {
          error:
            "Payroll period start date is required.",
        },
        { status: 400 }
      );
    }

    if (!payPeriodEnd) {
      return NextResponse.json(
        {
          error:
            "Payroll period end date is required.",
        },
        { status: 400 }
      );
    }

    if (
      payPeriodEnd <
      payPeriodStart
    ) {
      return NextResponse.json(
        {
          error:
            "Payroll period end date cannot be before the start date.",
        },
        { status: 400 }
      );
    }

    /*
     * Prevent accidental duplicate payroll runs
     * for exactly the same period.
     */
    const { data: existingRun } =
      await supabase
        .from("payroll_runs")
        .select("id")
        .eq(
          "pay_period_start",
          payPeriodStart
        )
        .eq(
          "pay_period_end",
          payPeriodEnd
        )
        .maybeSingle();

    if (existingRun) {
      return NextResponse.json(
        {
          error:
            "A payroll run already exists for this period.",
        },
        { status: 409 }
      );
    }

    const { data, error } =
      await supabase
        .from("payroll_runs")
        .insert({
          pay_period_start:
            payPeriodStart,
          pay_period_end:
            payPeriodEnd,
          status: "draft",
          total_normal_hours: 0,
          total_overtime_hours: 0,
          total_gross_pay: 0,
          total_paye: 0,
          total_uif: 0,
          total_other_deductions: 0,
          total_net_pay: 0,
          notes,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "Create payroll run error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to create payroll run.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        payrollRun: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Payroll run POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payroll run.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   Calculate / approve payroll
========================================================= */

export async function PUT(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const payrollRunId =
      body.payrollRunId;

    const action =
      body.action;

    if (!payrollRunId) {
      return NextResponse.json(
        {
          error:
            "Payroll run ID is required.",
        },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        {
          error:
            "Payroll action is required.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       APPROVE
    ===================================================== */

    if (action === "approve") {
      const { data: run, error: runError } =
        await supabase
          .from("payroll_runs")
          .select("*")
          .eq("id", payrollRunId)
          .single();

      if (runError || !run) {
        return NextResponse.json(
          {
            error:
              runError?.message ||
              "Payroll run not found.",
          },
          { status: 404 }
        );
      }

      if (run.status !== "completed") {
        return NextResponse.json(
          {
            error:
              "Only completed payroll runs can be approved.",
          },
          { status: 400 }
        );
      }

      const { data: updatedRun, error } =
        await supabase
          .from("payroll_runs")
          .update({
            status: "approved",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            payrollRunId
          )
          .select("*")
          .single();

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to approve payroll.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        payrollRun: updatedRun,
      });
    }

    /* =====================================================
       CALCULATE
    ===================================================== */

    if (action === "calculate") {
      const {
        data: payrollRun,
        error: payrollRunError,
      } = await supabase
        .from("payroll_runs")
        .select("*")
        .eq("id", payrollRunId)
        .single();

      if (
        payrollRunError ||
        !payrollRun
      ) {
        return NextResponse.json(
          {
            error:
              payrollRunError?.message ||
              "Payroll run not found.",
          },
          { status: 404 }
        );
      }

      if (
        payrollRun.status ===
          "approved" ||
        payrollRun.status === "paid"
      ) {
        return NextResponse.json(
          {
            error:
              "Approved or paid payroll cannot be recalculated.",
          },
          { status: 400 }
        );
      }

      /*
       * Mark the run as processing.
       */
      await supabase
        .from("payroll_runs")
        .update({
          status: "processing",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          payrollRunId
        );

      /*
       * Get approved attendance
       * for this payroll period.
       */
      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from("attendance")
        .select(`
          id,
          employee_id,
          attendance_date,
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
            basic_salary,
            hourly_rate
          )
        `)
        .eq(
          "status",
          "approved"
        )
        .gte(
          "attendance_date",
          payrollRun.pay_period_start
        )
        .lte(
          "attendance_date",
          payrollRun.pay_period_end
        )
        .order(
          "attendance_date",
          {
            ascending: true,
          }
        );

      if (attendanceError) {
        await supabase
          .from("payroll_runs")
          .update({
            status: "draft",
          })
          .eq(
            "id",
            payrollRunId
          );

        return NextResponse.json(
          {
            error:
              attendanceError.message ||
              "Unable to load approved attendance.",
          },
          { status: 500 }
        );
      }

      const attendance =
        (attendanceData ??
          []) as unknown as AttendanceRecord[];

      if (attendance.length === 0) {
        await supabase
          .from("payroll_runs")
          .update({
            status: "draft",
          })
          .eq(
            "id",
            payrollRunId
          );

        return NextResponse.json(
          {
            error:
              "No approved attendance was found for this payroll period.",
          },
          { status: 400 }
        );
      }

      /*
       * Calculate payroll per employee.
       */
      const calculated =
        calculateEmployeePayroll(
          attendance
        );

      if (calculated.length === 0) {
        await supabase
          .from("payroll_runs")
          .update({
            status: "draft",
          })
          .eq(
            "id",
            payrollRunId
          );

        return NextResponse.json(
          {
            error:
              "No employees could be calculated from the approved attendance.",
          },
          { status: 400 }
        );
      }

      /*
       * Delete old payroll items before rebuilding
       * the payroll calculation.
       */
      const {
        data: oldItems,
        error: oldItemsError,
      } = await supabase
        .from("payroll_items")
        .select("id")
        .eq(
          "payroll_run_id",
          payrollRunId
        );

      if (oldItemsError) {
        throw new Error(
          oldItemsError.message
        );
      }

      if (
        oldItems &&
        oldItems.length > 0
      ) {
        const oldItemIds =
          oldItems.map(
            (item) => item.id
          );

        const {
          error:
            deleteAttendanceLinksError,
        } = await supabase
          .from(
            "payroll_item_attendance"
          )
          .delete()
          .in(
            "payroll_item_id",
            oldItemIds
          );

        if (
          deleteAttendanceLinksError
        ) {
          throw new Error(
            deleteAttendanceLinksError.message
          );
        }

        const {
          error:
            deleteItemsError,
        } = await supabase
          .from("payroll_items")
          .delete()
          .eq(
            "payroll_run_id",
            payrollRunId
          );

        if (deleteItemsError) {
          throw new Error(
            deleteItemsError.message
          );
        }
      }

      let totalNormalHours = 0;
      let totalOvertimeHours = 0;
      let totalGrossPay = 0;
      let totalPAYE = 0;
      let totalUIF = 0;
      let totalOtherDeductions = 0;
      let totalNetPay = 0;

      /*
       * Insert payroll item for each employee.
       */
      for (const employeePayroll of calculated) {
        const employee =
          employeePayroll.employee;

        const grossPay =
          Number(
            employeePayroll.grossPay
          ) || 0;

        const paye =
          calculatePAYE(
            grossPay,
            employee
          );

        const uif =
          calculateUIF(grossPay);

        const otherDeductions = 0;

        const netPay =
          Math.max(
            0,
            grossPay -
              paye -
              uif -
              otherDeductions
          );

        const {
          data: payrollItem,
          error: payrollItemError,
        } = await supabase
          .from("payroll_items")
          .insert({
            payroll_run_id:
              payrollRunId,
            employee_id:
              employee.id,
            pay_type:
              employee.pay_type ??
              null,
            basic_salary:
              Number(
                employee.basic_salary
              ) || 0,
            hourly_rate:
              Number(
                employee.hourly_rate
              ) || 0,
            normal_hours:
              employeePayroll.normalHours,
            overtime_hours:
              employeePayroll.overtimeHours,
            normal_pay:
              employeePayroll.normalPay,
            overtime_pay:
              employeePayroll.overtimePay,
            gross_pay:
              grossPay,
            paye,
            uif_employee:
              uif,
            other_deductions:
              otherDeductions,
            net_pay:
              netPay,
            notes: null,
          })
          .select("id")
          .single();

        if (
          payrollItemError ||
          !payrollItem
        ) {
          throw new Error(
            payrollItemError?.message ||
              `Unable to create payroll item for ${employee.first_name} ${employee.last_name}.`
          );
        }

        /*
         * Link the employee's attendance records
         * to their payroll item.
         */
        const employeeAttendance =
          attendance.filter(
            (record) =>
              record.employee_id ===
              employee.id
          );

        if (
          employeeAttendance.length >
          0
        ) {
          const attendanceLinks =
            employeeAttendance.map(
              (record) => ({
                payroll_item_id:
                  payrollItem.id,
                attendance_id:
                  record.id,
                normal_hours:
                  Number(
                    record.normal_hours
                  ) || 0,
                overtime_hours:
                  Number(
                    record.overtime_hours
                  ) || 0,
              })
            );

          const {
            error:
              attendanceLinkError,
          } = await supabase
            .from(
              "payroll_item_attendance"
            )
            .insert(
              attendanceLinks
            );

          if (
            attendanceLinkError
          ) {
            throw new Error(
              attendanceLinkError.message
            );
          }
        }

        totalNormalHours +=
          employeePayroll.normalHours;

        totalOvertimeHours +=
          employeePayroll.overtimeHours;

        totalGrossPay +=
          grossPay;

        totalPAYE += paye;

        totalUIF += uif;

        totalOtherDeductions +=
          otherDeductions;

        totalNetPay +=
          netPay;
      }

      /*
       * Update payroll run totals.
       */
      const {
        data: updatedRun,
        error: updateRunError,
      } = await supabase
        .from("payroll_runs")
        .update({
          status: "completed",
          total_normal_hours:
            totalNormalHours,
          total_overtime_hours:
            totalOvertimeHours,
          total_gross_pay:
            totalGrossPay,
          total_paye:
            totalPAYE,
          total_uif:
            totalUIF,
          total_other_deductions:
            totalOtherDeductions,
          total_net_pay:
            totalNetPay,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          payrollRunId
        )
        .select("*")
        .single();

      if (updateRunError) {
        throw new Error(
          updateRunError.message
        );
      }

      return NextResponse.json({
        payrollRun: updatedRun,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid payroll action. Supported actions are calculate and approve.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "Payroll PUT error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process payroll.",
      },
      { status: 500 }
    );
  }
}