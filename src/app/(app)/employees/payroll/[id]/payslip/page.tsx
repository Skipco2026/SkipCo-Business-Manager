"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

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
  id_number?: string | null;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  department?: string | null;
  employment_start_date?: string | null;
  hourly_rate?: number | null;
  tax_number?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
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
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
  updated_at?: string;
}

interface PayslipData {
  employee: Employee;
  payrollRun: PayrollRun;
  payrollItem: PayrollItem;
  payslipNumber: string;
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number | null | undefined) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value.substring(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPayPeriod(
  start: string,
  end: string
) {
  if (!start && !end) {
    return "";
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatMonth(
  start: string,
  end: string
) {
  if (!start) {
    return "";
  }

  const startDate = new Date(
    `${start.substring(0, 10)}T00:00:00`
  );

  if (Number.isNaN(startDate.getTime())) {
    return formatPayPeriod(start, end);
  }

  const endDate = end
    ? new Date(
        `${end.substring(0, 10)}T00:00:00`
      )
    : startDate;

  const sameMonth =
    startDate.getFullYear() ===
      endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth();

  if (sameMonth) {
    return startDate.toLocaleDateString(
      "en-ZA",
      {
        month: "long",
        year: "numeric",
      }
    );
  }

  return `${startDate.toLocaleDateString(
    "en-ZA",
    {
      month: "short",
      year: "numeric",
    }
  )} - ${endDate.toLocaleDateString(
    "en-ZA",
    {
      month: "short",
      year: "numeric",
    }
  )}`;
}

/* =========================================================
   PDF STYLES
========================================================= */

const pdfStyles = StyleSheet.create({
  page: {
    width: "100%",
    minHeight: "100%",
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 42,
    paddingRight: 42,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  logoArea: {
    width: "55%",
  },

  logo: {
    width: 175,
    height: 94,
    objectFit: "contain",
  },

  titleArea: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 8,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  infoLabel: {
    width: 75,
    textAlign: "right",
    color: "#777777",
    fontSize: 8,
    marginRight: 8,
  },

  infoValue: {
    width: 100,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 8,
  },

  cyanLine: {
    height: 3,
    backgroundColor: "#20AEB8",
    marginBottom: 18,
  },

  companySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  companyLeft: {
    width: "50%",
  },

  companyRight: {
    width: "50%",
    alignItems: "flex-end",
  },

  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 4,
  },

  smallText: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 3,
  },

  employeeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 18,
  },

  employeeBox: {
    width: "48%",
  },

  sectionHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  employeeName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },

  employeeDetail: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 3,
  },

  table: {
    width: "100%",
    marginBottom: 18,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#20AEB8",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 7,
    paddingRight: 7,
  },

  headerText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },

  descriptionColumn: {
    width: "48%",
  },

  quantityColumn: {
    width: "17%",
    textAlign: "right",
  },

  rateColumn: {
    width: "17%",
    textAlign: "right",
  },

  amountColumn: {
    width: "18%",
    textAlign: "right",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 7,
    paddingRight: 7,
  },

  tableText: {
    fontSize: 8,
    color: "#333333",
  },

  totals: {
    marginLeft: "55%",
    width: "45%",
    marginBottom: 18,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    paddingBottom: 5,
  },

  totalLabel: {
    fontSize: 8,
    color: "#555555",
  },

  totalValue: {
    fontSize: 8,
    fontWeight: "bold",
  },

  deductionValue: {
    fontSize: 8,
    color: "#C0392B",
    fontWeight: "bold",
  },

  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#999999",
    borderBottomWidth: 2,
    borderBottomColor: "#20AEB8",
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: 4,
  },

  netLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },

  netValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#20AEB8",
  },

  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 18,
  },

  summaryBox: {
    width: "32%",
  },

  summaryLabel: {
    fontSize: 7,
    color: "#777777",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderTopColor: "#D9DDE3",
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerLeft: {
    width: "60%",
  },

  footerRight: {
    width: "40%",
    alignItems: "flex-end",
  },

  footerText: {
    fontSize: 7,
    color: "#777777",
    marginBottom: 2,
  },
});

/* =========================================================
   PAYSLIP PDF
========================================================= */

function PayslipPDF({
  employee,
  payrollRun,
  payrollItem,
  payslipNumber,
}: PayslipData) {
  const totalHours =
    Number(payrollItem.normal_hours || 0) +
    Number(payrollItem.overtime_hours || 0);

  return (
    <Document>
      <Page
        size="A4"
        style={pdfStyles.page}
        wrap={false}
      >
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoArea}>
            <Image
              src="/skipco-logo.jpg"
              style={pdfStyles.logo}
            />
          </View>

          <View style={pdfStyles.titleArea}>
            <Text style={pdfStyles.title}>
              PAYSLIP
            </Text>

            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>
                Payslip No.
              </Text>

              <Text style={pdfStyles.infoValue}>
                {payslipNumber}
              </Text>
            </View>

            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>
                Pay Period
              </Text>

              <Text style={pdfStyles.infoValue}>
                {formatPayPeriod(
                  payrollRun.pay_period_start,
                  payrollRun.pay_period_end
                )}
              </Text>
            </View>

            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>
                Generated
              </Text>

              <Text style={pdfStyles.infoValue}>
                {formatDate(
                  payrollItem.created_at
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.cyanLine} />

        <View style={pdfStyles.companySection}>
          <View style={pdfStyles.companyLeft}>
            <Text style={pdfStyles.companyName}>
              Skip Co Solutions
            </Text>

            <Text style={pdfStyles.smallText}>
              Skip Hire & Waste Removal
            </Text>
          </View>

          <View style={pdfStyles.companyRight}>
            <Text style={pdfStyles.smallText}>
              Pellesier, Bloemfontein
            </Text>

            <Text style={pdfStyles.smallText}>
              062 737 9728
            </Text>

            <Text style={pdfStyles.smallText}>
              ddw.trading@outlook.com
            </Text>
          </View>
        </View>

        <View style={pdfStyles.employeeSection}>
          <View style={pdfStyles.employeeBox}>
            <Text style={pdfStyles.sectionHeading}>
              Employee
            </Text>

            <Text style={pdfStyles.employeeName}>
              {employee.first_name}{" "}
              {employee.last_name}
            </Text>

            <Text style={pdfStyles.employeeDetail}>
              Employee No:{" "}
              {employee.employee_number}
            </Text>

            {employee.job_title && (
              <Text style={pdfStyles.employeeDetail}>
                Position: {employee.job_title}
              </Text>
            )}

            {employee.department && (
              <Text style={pdfStyles.employeeDetail}>
                Department:{" "}
                {employee.department}
              </Text>
            )}
          </View>

          <View style={pdfStyles.employeeBox}>
            <Text style={pdfStyles.sectionHeading}>
              Employment Details
            </Text>

            {employee.employment_start_date && (
              <Text style={pdfStyles.employeeDetail}>
                Start Date:{" "}
                {formatDate(
                  employee.employment_start_date
                )}
              </Text>
            )}

            {employee.tax_number && (
              <Text style={pdfStyles.employeeDetail}>
                Tax Number:{" "}
                {employee.tax_number}
              </Text>
            )}

            <Text style={pdfStyles.employeeDetail}>
              Pay Type:{" "}
              {payrollItem.pay_type ||
                "Hourly"}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text
              style={[
                pdfStyles.headerText,
                pdfStyles.descriptionColumn,
              ]}
            >
              DESCRIPTION
            </Text>

            <Text
              style={[
                pdfStyles.headerText,
                pdfStyles.quantityColumn,
              ]}
            >
              HOURS
            </Text>

            <Text
              style={[
                pdfStyles.headerText,
                pdfStyles.rateColumn,
              ]}
            >
              RATE
            </Text>

            <Text
              style={[
                pdfStyles.headerText,
                pdfStyles.amountColumn,
              ]}
            >
              AMOUNT
            </Text>
          </View>

          <View style={pdfStyles.tableRow}>
            <Text
              style={[
                pdfStyles.tableText,
                pdfStyles.descriptionColumn,
              ]}
            >
              Ordinary Hours
            </Text>

            <Text
              style={[
                pdfStyles.tableText,
                pdfStyles.quantityColumn,
              ]}
            >
              {Number(
                payrollItem.normal_hours || 0
              ).toFixed(2)}
            </Text>

            <Text
              style={[
                pdfStyles.tableText,
                pdfStyles.rateColumn,
              ]}
            >
              {formatCurrency(
                payrollItem.hourly_rate
              )}
            </Text>

            <Text
              style={[
                pdfStyles.tableText,
                pdfStyles.amountColumn,
              ]}
            >
              {formatCurrency(
                payrollItem.normal_pay
              )}
            </Text>
          </View>

          {Number(
            payrollItem.overtime_hours || 0
          ) > 0 && (
            <View style={pdfStyles.tableRow}>
              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.descriptionColumn,
                ]}
              >
                Overtime Hours
              </Text>

              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.quantityColumn,
                ]}
              >
                {Number(
                  payrollItem.overtime_hours || 0
                ).toFixed(2)}
              </Text>

              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.rateColumn,
                ]}
              >
                {formatCurrency(
                  Number(
                    payrollItem.hourly_rate || 0
                  ) * 1.5
                )}
              </Text>

              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.amountColumn,
                ]}
              >
                {formatCurrency(
                  payrollItem.overtime_pay
                )}
              </Text>
            </View>
          )}
        </View>

        <View style={pdfStyles.summary}>
          <View style={pdfStyles.summaryBox}>
            <Text style={pdfStyles.summaryLabel}>
              Hours Worked
            </Text>

            <Text style={pdfStyles.summaryValue}>
              {totalHours.toFixed(2)}
            </Text>
          </View>

          <View style={pdfStyles.summaryBox}>
            <Text style={pdfStyles.summaryLabel}>
              Hourly Rate
            </Text>

            <Text style={pdfStyles.summaryValue}>
              {formatCurrency(
                payrollItem.hourly_rate
              )}
            </Text>
          </View>

          <View style={pdfStyles.summaryBox}>
            <Text style={pdfStyles.summaryLabel}>
              Payroll Status
            </Text>

            <Text style={pdfStyles.summaryValue}>
              {payrollRun.status || "Draft"}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.totals}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>
              Gross Pay
            </Text>

            <Text style={pdfStyles.totalValue}>
              {formatCurrency(
                payrollItem.gross_pay
              )}
            </Text>
          </View>

          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>
              PAYE
            </Text>

            <Text style={pdfStyles.deductionValue}>
              -{" "}
              {formatCurrency(
                payrollItem.paye
              )}
            </Text>
          </View>

          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>
              UIF
            </Text>

            <Text style={pdfStyles.deductionValue}>
              -{" "}
              {formatCurrency(
                payrollItem.uif_employee
              )}
            </Text>
          </View>

          {Number(
            payrollItem.other_deductions || 0
          ) > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>
                Other Deductions
              </Text>

              <Text
                style={pdfStyles.deductionValue}
              >
                -{" "}
                {formatCurrency(
                  payrollItem.other_deductions
                )}
              </Text>
            </View>
          )}

          <View style={pdfStyles.netRow}>
            <Text style={pdfStyles.netLabel}>
              NET PAY
            </Text>

            <Text style={pdfStyles.netValue}>
              {formatCurrency(
                payrollItem.net_pay
              )}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <View style={pdfStyles.footerLeft}>
            <Text style={pdfStyles.footerText}>
              Skip Co Solutions
            </Text>

            <Text style={pdfStyles.footerText}>
              Pellesier, Bloemfontein
            </Text>
          </View>

          <View style={pdfStyles.footerRight}>
            <Text style={pdfStyles.footerText}>
              062 737 9728
            </Text>

            <Text style={pdfStyles.footerText}>
              ddw.trading@outlook.com
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function PayslipPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const payrollId = String(
    params?.id ?? ""
  );

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [payrollRun, setPayrollRun] =
    useState<PayrollRun | null>(null);

  const [payrollItem, setPayrollItem] =
    useState<PayrollItem | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadPayslip() {
      if (!payrollId) {
        setError(
          "No payroll record was supplied."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        /* =================================================
           1. LOAD PAYROLL ITEM
           
           The [id] in the URL is now the payroll_items.id
        ================================================= */

        const {
          data: payrollItemData,
          error: payrollItemError,
        } = await supabase
          .from("payroll_items")
          .select("*")
          .eq("id", payrollId)
          .single();

        if (payrollItemError) {
          throw payrollItemError;
        }

        if (!payrollItemData) {
          throw new Error(
            "Payroll item not found."
          );
        }

        const item =
          payrollItemData as PayrollItem;

        setPayrollItem(item);

        /* =================================================
           2. LOAD PAYROLL RUN
        ================================================= */

        const {
          data: payrollRunData,
          error: payrollRunError,
        } = await supabase
          .from("payroll_runs")
          .select("*")
          .eq(
            "id",
            item.payroll_run_id
          )
          .single();

        if (payrollRunError) {
          throw payrollRunError;
        }

        if (!payrollRunData) {
          throw new Error(
            "Payroll run not found."
          );
        }

        const run =
          payrollRunData as PayrollRun;

        setPayrollRun(run);

        /* =================================================
           3. LOAD EMPLOYEE
        ================================================= */

        const {
          data: employeeData,
          error: employeeError,
        } = await supabase
          .from("employees")
          .select("*")
          .eq(
            "id",
            item.employee_id
          )
          .single();

        if (employeeError) {
          throw employeeError;
        }

        if (!employeeData) {
          throw new Error(
            "Employee record not found."
          );
        }

        setEmployee(
          employeeData as Employee
        );
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
  }, [payrollId, supabase]);

  if (loading) {
    return (
      <DashboardShell
        title="Payslip"
        subtitle="Employee payslip"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-charcoal-500">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Loading payslip...
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (
    error ||
    !employee ||
    !payrollRun ||
    !payrollItem
  ) {
    return (
      <DashboardShell
        title="Payslip"
        subtitle="Employee payslip"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ||
            "Unable to load the payslip."}
        </div>
      </DashboardShell>
    );
  }

  const payslipNumber =
    `PS-${payrollItem.id
      .substring(0, 8)
      .toUpperCase()}`;

  const payPeriodLabel = formatMonth(
    payrollRun.pay_period_start,
    payrollRun.pay_period_end
  );

  const pdfData: PayslipData = {
    employee,
    payrollRun,
    payrollItem,
    payslipNumber,
  };

  const fileName =
    `Payslip-${employee.first_name}-${employee.last_name}-${payrollRun.pay_period_start.substring(
      0,
      7
    )}.pdf`;

  const totalHours =
    Number(payrollItem.normal_hours || 0) +
    Number(payrollItem.overtime_hours || 0);

  return (
    <DashboardShell
      title="Payslip"
      subtitle={`${employee.first_name} ${employee.last_name}`}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">
            Payslip
          </h1>

          <p className="mt-1 text-sm text-charcoal-500">
            {employee.first_name}{" "}
            {employee.last_name} ·{" "}
            {payPeriodLabel}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg border border-charcoal-200 bg-white px-4 py-2.5 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <PDFDownloadLink
            document={
              <PayslipPDF {...pdfData} />
            }
            fileName={fileName}
          >
            {({ loading: pdfLoading }) => (
              <button
                type="button"
                disabled={pdfLoading}
                className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pdfLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Creating PDF...
                  </>
                ) : (
                  <>
                    <Download size={17} />
                    Download Payslip
                  </>
                )}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* =====================================================
          PAYSLIP PREVIEW
      ===================================================== */}

      <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-charcoal-100 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                Employee
              </p>

              <h2 className="mt-1 text-xl font-bold text-charcoal-900">
                {employee.first_name}{" "}
                {employee.last_name}
              </h2>

              <p className="mt-1 text-sm text-charcoal-500">
                Employee No:{" "}
                {employee.employee_number}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-charcoal-500">
                Pay Period
              </p>

              <p className="font-semibold text-charcoal-900">
                {payPeriodLabel}
              </p>

              <p className="mt-1 text-xs text-charcoal-500">
                {payslipNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-charcoal-50 p-4">
            <p className="text-xs text-charcoal-500">
              Hours Worked
            </p>

            <p className="mt-1 text-lg font-bold text-charcoal-900">
              {totalHours.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl bg-charcoal-50 p-4">
            <p className="text-xs text-charcoal-500">
              Hourly Rate
            </p>

            <p className="mt-1 text-lg font-bold text-charcoal-900">
              {formatCurrency(
                payrollItem.hourly_rate
              )}
            </p>
          </div>

          <div className="rounded-xl bg-charcoal-50 p-4">
            <p className="text-xs text-charcoal-500">
              Gross Pay
            </p>

            <p className="mt-1 text-lg font-bold text-charcoal-900">
              {formatCurrency(
                payrollItem.gross_pay
              )}
            </p>
          </div>

          <div className="rounded-xl bg-cyan-50 p-4">
            <p className="text-xs text-cyan-700">
              Net Pay
            </p>

            <p className="mt-1 text-lg font-bold text-cyan-700">
              {formatCurrency(
                payrollItem.net_pay
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-charcoal-100">
          <div className="flex items-center justify-between border-b border-charcoal-100 px-4 py-3">
            <span className="text-sm text-charcoal-600">
              Gross Pay
            </span>

            <span className="font-semibold text-charcoal-900">
              {formatCurrency(
                payrollItem.gross_pay
              )}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-charcoal-100 px-4 py-3">
            <span className="text-sm text-charcoal-600">
              PAYE
            </span>

            <span className="font-semibold text-red-600">
              -{" "}
              {formatCurrency(
                payrollItem.paye
              )}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-charcoal-100 px-4 py-3">
            <span className="text-sm text-charcoal-600">
              UIF
            </span>

            <span className="font-semibold text-red-600">
              -{" "}
              {formatCurrency(
                payrollItem.uif_employee
              )}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-charcoal-100 px-4 py-3">
            <span className="text-sm text-charcoal-600">
              Other Deductions
            </span>

            <span className="font-semibold text-red-600">
              -{" "}
              {formatCurrency(
                payrollItem.other_deductions
              )}
            </span>
          </div>

          <div className="flex items-center justify-between bg-cyan-50 px-4 py-4">
            <span className="font-bold text-charcoal-900">
              NET PAY
            </span>

            <span className="text-xl font-bold text-cyan-700">
              {formatCurrency(
                payrollItem.net_pay
              )}
            </span>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}