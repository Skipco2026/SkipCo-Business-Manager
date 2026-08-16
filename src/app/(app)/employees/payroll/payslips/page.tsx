"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Printer,
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
  employee?: Employee;
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

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value.substring(0, 10)}T00:00:00`);

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(
  value: number | null | undefined
): string {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(
  value: number | null | undefined
): string {
  return Number(value || 0).toFixed(2);
}

function getEmployeeName(
  employee?: Employee
): string {
  if (!employee) {
    return "Employee";
  }

  return `${employee.first_name} ${employee.last_name}`;
}

export default function PayslipPage() {
  const [payrollRun, setPayrollRun] =
    useState<PayrollRun | null>(null);

  const [payrollItem, setPayrollItem] =
    useState<PayrollItem | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");

  useEffect(() => {
    async function loadPayslip(): Promise<void> {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams(
          window.location.search
        );

        const runId = params.get("runId");
        const itemId = params.get("itemId");

        if (!runId) {
          throw new Error(
            "No payroll run was specified."
          );
        }

        if (!itemId) {
          throw new Error(
            "No payroll item was specified."
          );
        }

        /*
         * Load the payroll run.
         */
        const runsResponse = await fetch(
          "/api/payroll-runs"
        );

        const runsData: PayrollRunResponse =
          await runsResponse.json();

        if (!runsResponse.ok) {
          throw new Error(
            runsData.error ||
              "Unable to load payroll run."
          );
        }

        const runs =
          runsData.payrollRuns ??
          runsData.payroll_runs ??
          [];

        const run = runs.find(
          (currentRun) =>
            currentRun.id === runId
        );

        if (!run) {
          throw new Error(
            "The selected payroll run could not be found."
          );
        }

        setPayrollRun(run);

        /*
         * Load the payroll items belonging
         * to this payroll run.
         */
        const itemsParams =
          new URLSearchParams();

        itemsParams.set(
          "payrollRunId",
          runId
        );

        const itemsResponse = await fetch(
          `/api/payroll-items?${itemsParams.toString()}`
        );

        const itemsData: PayrollItemsResponse =
          await itemsResponse.json();

        if (!itemsResponse.ok) {
          throw new Error(
            itemsData.error ||
              "Unable to load payroll item."
          );
        }

        const items =
          itemsData.payrollItems ??
          itemsData.payroll_items ??
          [];

        const item = items.find(
          (currentItem) =>
            currentItem.id === itemId
        );

        if (!item) {
          throw new Error(
            "The selected employee payroll item could not be found."
          );
        }

        setPayrollItem(item);
      } catch (err) {
        console.error(
          "Load payslip error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payslip."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPayslip();
  }, []);

  function handlePrint(): void {
    window.print();
  }

  function goBack(): void {
    window.history.back();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Loading payslip...
        </div>
      </div>
    );
  }

  if (error || !payrollRun || !payrollItem) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h1 className="font-semibold text-red-900">
                Unable to load payslip
              </h1>

              <p className="mt-1 text-sm text-red-700">
                {error ||
                  "The payslip could not be loaded."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={goBack}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Payroll
          </button>
        </div>
      </div>
    );
  }

  const employee = payrollItem.employee;

  const totalDeductions =
    Number(payrollItem.paye || 0) +
    Number(payrollItem.uif_employee || 0) +
    Number(
      payrollItem.other_deductions || 0
    );

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .payslip-page {
            padding: 0 !important;
            margin: 0 !important;
          }

          .payslip-document {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>

      <div className="payslip-page min-h-screen bg-gray-100 p-6">
        {/* ACTION BAR */}
        <div className="no-print mx-auto mb-6 flex max-w-4xl items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            Back to Payroll
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Printer size={17} />
            Print / Save PDF
          </button>
        </div>

        {/* PAYSLIP */}
        <div className="payslip-document mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* HEADER */}
          <div className="border-b border-gray-200 p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  DDW Consolidate (Pty) Ltd
                </h1>

                <p className="mt-1 text-sm font-medium text-gray-500">
                  t/a SkipCo Solutions
                </p>

                <p className="mt-3 text-sm text-gray-500">
                  Employee Payslip
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Payslip
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    payrollRun.pay_period_start
                  )}{" "}
                  —{" "}
                  {formatDate(
                    payrollRun.pay_period_end
                  )}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Payroll Status:{" "}
                  <span className="font-semibold uppercase">
                    {payrollRun.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* EMPLOYEE INFORMATION */}
          <div className="grid grid-cols-1 gap-6 border-b border-gray-200 p-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Employee
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {getEmployeeName(employee)}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Employee No:{" "}
                {employee?.employee_number || "-"}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Employment Details
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {employee?.job_title || "-"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Department:{" "}
                {employee?.department || "-"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Pay Type:{" "}
                {payrollItem.pay_type ||
                  employee?.pay_type ||
                  "-"}
              </p>
            </div>
          </div>

          {/* PAY SUMMARY */}
          <div className="p-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Earnings
            </h2>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">
                      Description
                    </th>

                    <th className="px-4 py-3 text-right">
                      Hours
                    </th>

                    <th className="px-4 py-3 text-right">
                      Rate
                    </th>

                    <th className="px-4 py-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      Basic / Normal Pay
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-700">
                      {formatNumber(
                        payrollItem.normal_hours
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-700">
                      {formatCurrency(
                        payrollItem.hourly_rate
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        payrollItem.normal_pay
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      Overtime Pay
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-700">
                      {formatNumber(
                        payrollItem.overtime_hours
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-700">
                      {formatCurrency(
                        Number(
                          payrollItem.hourly_rate || 0
                        ) * 1.5
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        payrollItem.overtime_pay
                      )}
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-right text-sm font-bold text-gray-900"
                    >
                      Gross Pay
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(
                        payrollItem.gross_pay
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* DEDUCTIONS */}
            <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-gray-900">
              Deductions
            </h2>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4 text-sm text-gray-700">
                      PAYE
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(
                        payrollItem.paye
                      )}
                    </td>
                  </tr>

                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4 text-sm text-gray-700">
                      UIF
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(
                        payrollItem.uif_employee
                      )}
                    </td>
                  </tr>

                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4 text-sm text-gray-700">
                      Other Deductions
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(
                        payrollItem.other_deductions
                      )}
                    </td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="px-4 py-4 text-sm font-bold text-gray-900">
                      Total Deductions
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-red-600">
                      {formatCurrency(
                        totalDeductions
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* NET PAY */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Net Pay
                  </p>

                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {formatCurrency(
                      payrollItem.net_pay
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Gross Pay
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      payrollItem.gross_pay
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* HOURS SUMMARY */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">
                  Normal Hours
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatNumber(
                    payrollItem.normal_hours
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">
                  Overtime Hours
                </p>

                <p className="mt-1 text-lg font-bold text-orange-600">
                  {formatNumber(
                    payrollItem.overtime_hours
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">
                  Hourly Rate
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatCurrency(
                    payrollItem.hourly_rate
                  )}
                </p>
              </div>
            </div>

            {/* NOTES */}
            {payrollItem.notes && (
              <div className="mt-8 rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Payroll Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {payrollItem.notes}
                </p>
              </div>
            )}

            {/* FOOTER */}
            <div className="mt-12 border-t border-gray-200 pt-6">
              <div className="flex flex-col gap-4 text-xs text-gray-500 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-700">
                    DDW Consolidate (Pty) Ltd
                  </p>

                  <p>
                    t/a SkipCo Solutions
                  </p>

                  <p className="mt-1">
                    Bloemfontein, South Africa
                  </p>
                </div>

                <div className="sm:text-right">
                  <p>
                    This payslip was generated from
                    the company payroll system.
                  </p>

                  <p className="mt-1">
                    Payroll period:{" "}
                    {formatDate(
                      payrollRun.pay_period_start
                    )}{" "}
                    —{" "}
                    {formatDate(
                      payrollRun.pay_period_end
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}