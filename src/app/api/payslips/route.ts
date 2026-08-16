import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

type PayrollRun = {
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
};

type Employee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  pay_type: string | null;
  hourly_rate: number | null;
  basic_salary: number | null;
};

function number(value: unknown): number {
  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const payrollRunId =
      searchParams.get("payrollRunId");

    const payrollItemId =
      searchParams.get("payrollItemId");

    if (!payrollRunId && !payrollItemId) {
      return NextResponse.json(
        {
          error:
            "A payrollRunId or payrollItemId is required.",
        },
        { status: 400 }
      );
    }

    let payrollItem: PayrollItem | null = null;

    if (payrollItemId) {
      const { data, error } = await supabase
        .from("payroll_items")
        .select("*")
        .eq("id", payrollItemId)
        .maybeSingle();

      if (error) {
        console.error(
          "Payroll item lookup error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to load the payroll item.",
          },
          { status: 500 }
        );
      }

      payrollItem = data as PayrollItem | null;
    } else {
      return NextResponse.json(
        {
          error:
            "A payrollItemId is required to generate an individual payslip.",
        },
        { status: 400 }
      );
    }

    if (!payrollItem) {
      return NextResponse.json(
        {
          error: "Payroll item not found.",
        },
        { status: 404 }
      );
    }

    const runId =
      payrollItem.payroll_run_id || payrollRunId;

    if (!runId) {
      return NextResponse.json(
        {
          error:
            "The payroll item is not linked to a payroll run.",
        },
        { status: 400 }
      );
    }

    const { data: payrollRunData, error: payrollRunError } =
      await supabase
        .from("payroll_runs")
        .select("*")
        .eq("id", runId)
        .maybeSingle();

    if (payrollRunError) {
      console.error(
        "Payroll run lookup error:",
        payrollRunError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the payroll run.",
        },
        { status: 500 }
      );
    }

    if (!payrollRunData) {
      return NextResponse.json(
        {
          error: "Payroll run not found.",
        },
        { status: 404 }
      );
    }

    const payrollRun =
      payrollRunData as PayrollRun;

    const { data: employeeData, error: employeeError } =
      await supabase
        .from("employees")
        .select(
          `
            id,
            employee_number,
            first_name,
            last_name,
            job_title,
            department,
            pay_type,
            hourly_rate,
            basic_salary
          `
        )
        .eq("id", payrollItem.employee_id)
        .maybeSingle();

    if (employeeError) {
      console.error(
        "Employee lookup error:",
        employeeError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the employee.",
        },
        { status: 500 }
      );
    }

    if (!employeeData) {
      return NextResponse.json(
        {
          error:
            "Employee linked to this payroll item was not found.",
        },
        { status: 404 }
      );
    }

    const employee =
      employeeData as Employee;

    const normalHours =
      number(payrollItem.normal_hours);

    const overtimeHours =
      number(payrollItem.overtime_hours);

    const hourlyRate =
      number(payrollItem.hourly_rate) ||
      number(employee.hourly_rate);

    const basicSalary =
      number(payrollItem.basic_salary) ||
      number(employee.basic_salary);

    const normalPay =
      number(payrollItem.normal_pay);

    const overtimePay =
      number(payrollItem.overtime_pay);

    const grossPay =
      number(payrollItem.gross_pay);

    const paye =
      number(payrollItem.paye);

    const uifEmployee =
      number(payrollItem.uif_employee);

    const otherDeductions =
      number(payrollItem.other_deductions);

    const totalDeductions =
      paye +
      uifEmployee +
      otherDeductions;

    const netPay =
      number(payrollItem.net_pay);

    const overtimeRate =
      hourlyRate * 1.5;

    return NextResponse.json({
      payslip: {
        id: payrollItem.id,

        employer: {
          legalName:
            "DDW Consolidate (Pty) Ltd",
          tradingName:
            "SkipCo Solutions",
          location:
            "Bloemfontein, South Africa",
        },

        employee: {
          id: employee.id,
          employeeNumber:
            employee.employee_number,
          firstName:
            employee.first_name,
          lastName:
            employee.last_name,
          fullName:
            `${employee.first_name} ${employee.last_name}`,
          jobTitle:
            employee.job_title,
          department:
            employee.department,
          payType:
            payrollItem.pay_type ||
            employee.pay_type,
        },

        payroll: {
          runId: payrollRun.id,
          itemId: payrollItem.id,
          status: payrollRun.status,
          periodStart:
            payrollRun.pay_period_start,
          periodEnd:
            payrollRun.pay_period_end,
          createdAt:
            payrollItem.created_at,
        },

        earnings: {
          basicSalary,
          hourlyRate,
          overtimeRate,
          normalHours,
          overtimeHours,
          normalPay,
          overtimePay,
          grossPay,
        },

        deductions: {
          paye,
          uifEmployee,
          otherDeductions,
          totalDeductions,
        },

        netPay,

        notes:
          payrollItem.notes ||
          payrollRun.notes ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "Payslip API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate payslip.",
      },
      { status: 500 }
    );
  }
}