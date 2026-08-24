"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Document,
  Image,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Printer,
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
  id_number: string | null;
  email: string | null;
  phone: string | null;
  physical_address: string | null;
  job_title: string | null;
  department: string | null;
  employment_start_date: string | null;
  pay_type: string;
  basic_salary: number;
  hourly_rate: number;
  tax_number: string | null;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  branch_code: string | null;
  account_type: string | null;
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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

function formatCurrency(
  value: number | null | undefined
) {
  return `R ${Number(value || 0).toLocaleString(
    "en-ZA",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatNumber(
  value: number | null | undefined
) {
  return Number(value || 0).toFixed(2);
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date = new Date(
    `${value.substring(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function formatLongDate(
  value: string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date = new Date(
    `${value.substring(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function formatPayPeriod(
  start: string,
  end: string
) {
  return `${formatLongDate(
    start
  )} - ${formatLongDate(end)}`;
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

  const endDate = end
    ? new Date(
        `${end.substring(0, 10)}T00:00:00`
      )
    : startDate;

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(endDate.getTime())
  ) {
    return formatPayPeriod(
      start,
      end
    );
  }

  const sameMonth =
    startDate.getFullYear() ===
      endDate.getFullYear() &&
    startDate.getMonth() ===
      endDate.getMonth();

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

function getStatusLabel(
  status: string
) {
  switch (status) {
    case "draft":
      return "Draft";

    case "calculated":
      return "Calculated";

    case "approved":
      return "Approved";

    case "finalised":
      return "Finalised";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

function getStatusClasses(
  status: string
) {
  switch (status) {
    case "finalised":
      return "bg-green-100 text-green-700";

    case "approved":
      return "bg-blue-100 text-blue-700";

    case "calculated":
      return "bg-purple-100 text-purple-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

/* =========================================================
   PDF STYLES
========================================================= */

const pdfStyles = StyleSheet.create({
  page: {
    width: "100%",
    minHeight: "100%",
    paddingTop: 30,
    paddingBottom: 42,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  logoArea: {
    width: "54%",
  },

  logo: {
    width: 170,
    height: 82,
    objectFit: "contain",
  },

  titleArea: {
    width: "42%",
    alignItems: "flex-end",
    paddingTop: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
    color: "#222222",
  },

  topMetaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  topMetaLabel: {
    width: 72,
    textAlign: "right",
    color: "#777777",
    fontSize: 7.5,
    marginRight: 8,
  },

  topMetaValue: {
    width: 115,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 7.5,
  },

  cyanLine: {
    height: 3,
    backgroundColor: "#20AEB8",
    marginBottom: 16,
  },

  companySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  companyLeft: {
    width: "54%",
  },

  companyRight: {
    width: "42%",
    alignItems: "flex-end",
  },

  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 4,
  },

  companySubtext: {
    fontSize: 7.5,
    color: "#555555",
    marginBottom: 3,
  },

  employeeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingTop: 11,
    paddingBottom: 11,
    marginBottom: 16,
  },

  employeeBox: {
    width: "48%",
  },

  sectionHeading: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#20AEB8",
    textTransform: "uppercase",
    marginBottom: 5,
  },

  employeeName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },

  employeeDetail: {
    fontSize: 7.5,
    color: "#555555",
    marginBottom: 2.5,
  },

  periodSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  periodBox: {
    width: "31%",
    padding: 8,
    backgroundColor: "#F7F9FA",
    borderWidth: 1,
    borderColor: "#E3E7EA",
    borderRadius: 4,
  },

  periodLabel: {
    fontSize: 7,
    color: "#777777",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  periodValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#222222",
  },

  table: {
    width: "100%",
    marginBottom: 14,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#20AEB8",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
  },

  headerText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "bold",
  },

  descriptionColumn: {
    width: "45%",
  },

  quantityColumn: {
    width: "17%",
    textAlign: "right",
  },

  rateColumn: {
    width: "18%",
    textAlign: "right",
  },

  amountColumn: {
    width: "20%",
    textAlign: "right",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 29,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 6,
    paddingRight: 6,
  },

  tableText: {
    fontSize: 7.5,
    color: "#333333",
  },

  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F7F9FA",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 6,
    paddingRight: 6,
  },

  totals: {
    marginLeft: "56%",
    width: "44%",
    marginBottom: 16,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
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
    fontSize: 10.5,
    fontWeight: "bold",
  },

  netValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#20AEB8",
  },

  notesBox: {
    borderWidth: 1,
    borderColor: "#D9DDE3",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },

  notesLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    color: "#777777",
    marginBottom: 4,
  },

  notesText: {
    fontSize: 7.5,
    color: "#444444",
    lineHeight: 1.3,
  },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#D9DDE3",
    paddingTop: 6,
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
    fontSize: 6.5,
    color: "#777777",
    marginBottom: 2,
  },
});

/* =========================================================
   PDF DOCUMENT
========================================================= */

function PayslipPDF({
  employee,
  payrollRun,
  payrollItem,
  payslipNumber,
}: PayslipData) {
  const totalHours =
    Number(
      payrollItem.normal_hours || 0
    ) +
    Number(
      payrollItem.overtime_hours || 0
    );

  const totalDeductions =
    Number(
      payrollItem.paye || 0
    ) +
    Number(
      payrollItem.uif_employee || 0
    ) +
    Number(
      payrollItem.other_deductions || 0
    );

  return (
    <Document
      title={`Payslip - ${employee.first_name} ${employee.last_name}`}
      author="SkipCo Business Manager"
      subject={`Payslip ${payslipNumber}`}
      creator="SkipCo Business Manager"
    >
      <Page
        size="A4"
        style={pdfStyles.page}
        wrap={false}
      >
        {/* HEADER */}

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

            <View style={pdfStyles.topMetaRow}>
              <Text
                style={
                  pdfStyles.topMetaLabel
                }
              >
                Payslip No.
              </Text>

              <Text
                style={
                  pdfStyles.topMetaValue
                }
              >
                {payslipNumber}
              </Text>
            </View>

            <View style={pdfStyles.topMetaRow}>
              <Text
                style={
                  pdfStyles.topMetaLabel
                }
              >
                Pay Period
              </Text>

              <Text
                style={
                  pdfStyles.topMetaValue
                }
              >
                {formatPayPeriod(
                  payrollRun.pay_period_start,
                  payrollRun.pay_period_end
                )}
              </Text>
            </View>

            <View style={pdfStyles.topMetaRow}>
              <Text
                style={
                  pdfStyles.topMetaLabel
                }
              >
                Status
              </Text>

              <Text
                style={
                  pdfStyles.topMetaValue
                }
              >
                {getStatusLabel(
                  payrollRun.status
                )}
              </Text>
            </View>

            <View style={pdfStyles.topMetaRow}>
              <Text
                style={
                  pdfStyles.topMetaLabel
                }
              >
                Generated
              </Text>

              <Text
                style={
                  pdfStyles.topMetaValue
                }
              >
                {formatDate(
                  payrollItem.created_at
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.cyanLine} />

        {/* COMPANY */}

        <View style={pdfStyles.companySection}>
          <View style={pdfStyles.companyLeft}>
            <Text
              style={
                pdfStyles.companyName
              }
            >
              Skip Co Solutions
            </Text>

            <Text
              style={
                pdfStyles.companySubtext
              }
            >
              DDW Consolidate (Pty) Ltd
            </Text>

            <Text
              style={
                pdfStyles.companySubtext
              }
            >
              Skip Hire & Waste Removal
            </Text>
          </View>

          <View style={pdfStyles.companyRight}>
            <Text
              style={
                pdfStyles.companySubtext
              }
            >
              Bloemfontein, South Africa
            </Text>

            <Text
              style={
                pdfStyles.companySubtext
              }
            >
              062 737 9728
            </Text>

            <Text
              style={
                pdfStyles.companySubtext
              }
            >
              ddw.trading@outlook.com
            </Text>
          </View>
        </View>

        {/* EMPLOYEE */}

        <View style={pdfStyles.employeeSection}>
          <View
            style={
              pdfStyles.employeeBox
            }
          >
            <Text
              style={
                pdfStyles.sectionHeading
              }
            >
              Employee
            </Text>

            <Text
              style={
                pdfStyles.employeeName
              }
            >
              {employee.first_name}{" "}
              {employee.last_name}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Employee No:{" "}
              {employee.employee_number}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              ID / Passport:{" "}
              {employee.id_number ||
                "-"}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Position:{" "}
              {employee.job_title ||
                "-"}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Department:{" "}
              {employee.department ||
                "-"}
            </Text>
          </View>

          <View
            style={
              pdfStyles.employeeBox
            }
          >
            <Text
              style={
                pdfStyles.sectionHeading
              }
            >
              Employment & Tax
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Start Date:{" "}
              {employee.employment_start_date
                ? formatDate(
                    employee.employment_start_date
                  )
                : "-"}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Tax Number:{" "}
              {employee.tax_number ||
                "-"}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Pay Type: Hourly
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Hourly Rate:{" "}
              {formatCurrency(
                payrollItem.hourly_rate
              )}
            </Text>
          </View>
        </View>

        {/* PERIOD SUMMARY */}

        <View
          style={
            pdfStyles.periodSection
          }
        >
          <View
            style={pdfStyles.periodBox}
          >
            <Text
              style={
                pdfStyles.periodLabel
              }
            >
              Pay Month
            </Text>

            <Text
              style={
                pdfStyles.periodValue
              }
            >
              {formatMonth(
                payrollRun.pay_period_start,
                payrollRun.pay_period_end
              )}
            </Text>
          </View>

          <View
            style={pdfStyles.periodBox}
          >
            <Text
              style={
                pdfStyles.periodLabel
              }
            >
              Total Hours
            </Text>

            <Text
              style={
                pdfStyles.periodValue
              }
            >
              {formatNumber(
                totalHours
              )}{" "}
              hrs
            </Text>
          </View>

          <View
            style={pdfStyles.periodBox}
          >
            <Text
              style={
                pdfStyles.periodLabel
              }
            >
              Overtime
            </Text>

            <Text
              style={
                pdfStyles.periodValue
              }
            >
              {formatNumber(
                payrollItem.overtime_hours
              )}{" "}
              hrs
            </Text>
          </View>
        </View>

        {/* EARNINGS TABLE */}

        <View style={pdfStyles.table}>
          <View
            style={
              pdfStyles.tableHeader
            }
          >
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
              {formatNumber(
                payrollItem.normal_hours
              )}
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
              {formatNumber(
                payrollItem.overtime_hours
              )}
            </Text>

            <Text
              style={[
                pdfStyles.tableText,
                pdfStyles.rateColumn,
              ]}
            >
              {formatCurrency(
                Number(
                  payrollItem.hourly_rate ||
                    0
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

          <View
            style={
              pdfStyles.subtotalRow
            }
          >
            <Text
              style={{
                fontSize: 8,
                fontWeight: "bold",
              }}
            >
              GROSS PAY
            </Text>

            <Text
              style={{
                fontSize: 8,
                fontWeight: "bold",
              }}
            >
              {formatCurrency(
                payrollItem.gross_pay
              )}
            </Text>
          </View>
        </View>

        {/* TOTALS */}

        <View style={pdfStyles.totals}>
          <View
            style={
              pdfStyles.totalRow
            }
          >
            <Text
              style={
                pdfStyles.totalLabel
              }
            >
              Gross Pay
            </Text>

            <Text
              style={
                pdfStyles.totalValue
              }
            >
              {formatCurrency(
                payrollItem.gross_pay
              )}
            </Text>
          </View>

          <View
            style={
              pdfStyles.totalRow
            }
          >
            <Text
              style={
                pdfStyles.totalLabel
              }
            >
              PAYE
            </Text>

            <Text
              style={
                pdfStyles.deductionValue
              }
            >
              -{" "}
              {formatCurrency(
                payrollItem.paye
              )}
            </Text>
          </View>

          <View
            style={
              pdfStyles.totalRow
            }
          >
            <Text
              style={
                pdfStyles.totalLabel
              }
            >
              UIF - Employee
            </Text>

            <Text
              style={
                pdfStyles.deductionValue
              }
            >
              -{" "}
              {formatCurrency(
                payrollItem.uif_employee
              )}
            </Text>
          </View>

          {Number(
            payrollItem.other_deductions ||
              0
          ) > 0 && (
            <View
              style={
                pdfStyles.totalRow
              }
            >
              <Text
                style={
                  pdfStyles.totalLabel
                }
              >
                Other Deductions
              </Text>

              <Text
                style={
                  pdfStyles.deductionValue
                }
              >
                -{" "}
                {formatCurrency(
                  payrollItem.other_deductions
                )}
              </Text>
            </View>
          )}

          <View
            style={pdfStyles.netRow}
          >
            <Text
              style={pdfStyles.netLabel}
            >
              NET PAY
            </Text>

            <Text
              style={pdfStyles.netValue}
            >
              {formatCurrency(
                payrollItem.net_pay
              )}
            </Text>
          </View>
        </View>

        {/* BANKING */}

        <View style={pdfStyles.employeeSection}>
          <View
            style={
              pdfStyles.employeeBox
            }
          >
            <Text
              style={
                pdfStyles.sectionHeading
              }
            >
              Payment Information
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Bank:{" "}
              {employee.bank_name ||
                "-"}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Account Holder:{" "}
              {employee.account_holder ||
                `${employee.first_name} ${employee.last_name}`}
            </Text>
          </View>

          <View
            style={
              pdfStyles.employeeBox
            }
          >
            <Text
              style={
                pdfStyles.sectionHeading
              }
            >
              Bank Account
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Account Number:{" "}
              {employee.account_number ||
                "-"}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Branch Code:{" "}
              {employee.branch_code ||
                "-"}
            </Text>

            <Text
              style={
                pdfStyles.employeeDetail
              }
            >
              Account Type:{" "}
              {employee.account_type ||
                "-"}
            </Text>
          </View>
        </View>

        {/* NOTES */}

        {payrollItem.notes && (
          <View
            style={pdfStyles.notesBox}
          >
            <Text
              style={pdfStyles.notesLabel}
            >
              Payroll Notes
            </Text>

            <Text
              style={pdfStyles.notesText}
            >
              {payrollItem.notes}
            </Text>
          </View>
        )}

        {/* FOOTER */}

        <View
          style={pdfStyles.footer}
        >
          <View
            style={pdfStyles.footerLeft}
          >
            <Text
              style={pdfStyles.footerText}
            >
              Skip Co Solutions
            </Text>

            <Text
              style={pdfStyles.footerText}
            >
              DDW Consolidate (Pty) Ltd
            </Text>

            <Text
              style={pdfStyles.footerText}
            >
              Generated by SkipCo Business Manager
            </Text>
          </View>

          <View
            style={pdfStyles.footerRight}
          >
            <Text
              style={pdfStyles.footerText}
            >
              062 737 9728
            </Text>

            <Text
              style={pdfStyles.footerText}
            >
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

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const payrollItemId =
    typeof params?.id === "string"
      ? params.id
      : "";

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
      if (!payrollItemId) {
        setError(
          "No payroll item was supplied."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        /* -----------------------------------------------
           PAYROLL ITEM
        ----------------------------------------------- */

        const {
          data: payrollItemData,
          error: payrollItemError,
        } = await supabase
          .from("payroll_items")
          .select("*")
          .eq(
            "id",
            payrollItemId
          )
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

        /* -----------------------------------------------
           PAYROLL RUN
        ----------------------------------------------- */

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

        setPayrollRun(
          payrollRunData as PayrollRun
        );

        /* -----------------------------------------------
           EMPLOYEE
        ----------------------------------------------- */

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
          "Payslip loading error:",
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
  }, [
    payrollItemId,
    supabase,
  ]);

  function printPayslip() {
    window.print();
  }

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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error ||
            "Unable to load payslip."}
        </div>
      </DashboardShell>
    );
  }

  const payslipNumber =
    `PS-${payrollItem.id
      .substring(0, 8)
      .toUpperCase()}`;

  const totalHours =
    Number(
      payrollItem.normal_hours || 0
    ) +
    Number(
      payrollItem.overtime_hours || 0
    );

  const totalDeductions =
    Number(
      payrollItem.paye || 0
    ) +
    Number(
      payrollItem.uif_employee || 0
    ) +
    Number(
      payrollItem.other_deductions ||
        0
    );

  const fileName =
    `Payslip-${employee.first_name}-${employee.last_name}-${payrollRun.pay_period_start.substring(
      0,
      7
    )}.pdf`;

  const pdfData: PayslipData = {
    employee,
    payrollRun,
    payrollItem,
    payslipNumber,
  };

  return (
    <DashboardShell
      title="Payslip"
      subtitle={`${employee.first_name} ${employee.last_name}`}
    >
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .payslip-preview {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">

        {/* ACTION BAR */}

        <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-charcoal-900">
              Payslip
            </h1>

            <p className="mt-1 text-sm text-charcoal-500">
              {employee.first_name}{" "}
              {employee.last_name}{" "}
              ·{" "}
              {formatMonth(
                payrollRun.pay_period_start,
                payrollRun.pay_period_end
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 bg-white px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <button
              type="button"
              onClick={
                printPayslip
              }
              className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
            >
              <Printer size={17} />
              Print
            </button>

            <PDFDownloadLink
              document={
                <PayslipPDF
                  {...pdfData}
                />
              }
              fileName={
                fileName
              }
            >
              {({
                loading: pdfLoading,
              }) => (
                <button
                  type="button"
                  disabled={
                    pdfLoading
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                      <Download
                        size={17}
                      />
                      Download PDF
                    </>
                  )}
                </button>
              )}
            </PDFDownloadLink>

          </div>
        </div>

        {/* PAYSLIP PREVIEW */}

        <div className="payslip-preview overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="border-b-4 border-[#20AEB8] px-7 py-7 sm:px-10">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <FileText size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900">
                      Skip Co Solutions
                    </h2>

                    <p className="mt-1 text-sm text-charcoal-500">
                      DDW Consolidate (Pty) Ltd
                    </p>

                    <p className="mt-1 text-xs text-charcoal-400">
                      Bloemfontein, South Africa
                    </p>
                  </div>

                </div>
              </div>

              <div className="sm:text-right">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20AEB8]">
                  Employee Payslip
                </p>

                <p className="mt-2 text-lg font-bold text-charcoal-900">
                  {
                    formatMonth(
                      payrollRun.pay_period_start,
                      payrollRun.pay_period_end
                    )
                  }
                </p>

                <p className="mt-1 text-xs text-charcoal-500">
                  {payslipNumber}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                    payrollRun.status
                  )}`}
                >
                  {getStatusLabel(
                    payrollRun.status
                  )}
                </span>

              </div>

            </div>

          </div>

          {/* EMPLOYEE DETAILS */}

          <div className="border-b border-charcoal-200 px-7 py-6 sm:px-10">

            <div className="grid gap-6 lg:grid-cols-2">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Employee Details
                </p>

                <h3 className="mt-2 text-lg font-bold text-charcoal-900">
                  {employee.first_name}{" "}
                  {employee.last_name}
                </h3>

                <div className="mt-3 space-y-1.5 text-sm text-charcoal-600">

                  <p>
                    <strong>
                      Employee No:
                    </strong>{" "}
                    {
                      employee.employee_number
                    }
                  </p>

                  <p>
                    <strong>
                      ID / Passport:
                    </strong>{" "}
                    {employee.id_number ||
                      "—"}
                  </p>

                  <p>
                    <strong>
                      Position:
                    </strong>{" "}
                    {employee.job_title ||
                      "—"}
                  </p>

                  <p>
                    <strong>
                      Department:
                    </strong>{" "}
                    {employee.department ||
                      "—"}
                  </p>

                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#20AEB8]">
                  Tax & Employment
                </p>

                <div className="mt-3 space-y-1.5 text-sm text-charcoal-600">

                  <p>
                    <strong>
                      Tax Number:
                    </strong>{" "}
                    {employee.tax_number ||
                      "—"}
                  </p>

                  <p>
                    <strong>
                      Start Date:
                    </strong>{" "}
                    {employee.employment_start_date
                      ? formatDate(
                          employee.employment_start_date
                        )
                      : "—"}
                  </p>

                  <p>
                    <strong>
                      Pay Type:
                    </strong>{" "}
                    Hourly
                  </p>

                  <p>
                    <strong>
                      Hourly Rate:
                    </strong>{" "}
                    {formatCurrency(
                      payrollItem.hourly_rate
                    )}
                  </p>

                </div>
              </div>

            </div>

          </div>

          {/* PAY PERIOD SUMMARY */}

          <div className="px-7 py-6 sm:px-10">

            <div className="grid gap-4 md:grid-cols-3">

              <div className="rounded-xl bg-charcoal-50 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal-500">
                  Pay Period
                </p>

                <p className="mt-2 text-sm font-bold text-charcoal-900">
                  {formatDate(
                    payrollRun.pay_period_start
                  )}{" "}
                  -{" "}
                  {formatDate(
                    payrollRun.pay_period_end
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-charcoal-50 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal-500">
                  Normal Hours
                </p>

                <p className="mt-2 text-lg font-bold text-charcoal-900">
                  {formatNumber(
                    payrollItem.normal_hours
                  )}
                  {" "}
                  hrs
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-4">
                <p className="text-xs uppercase tracking-wide text-cyan-700">
                  Overtime
                </p>

                <p className="mt-2 text-lg font-bold text-cyan-700">
                  {formatNumber(
                    payrollItem.overtime_hours
                  )}
                  {" "}
                  hrs
                </p>
              </div>

            </div>

          </div>

          {/* EARNINGS */}

          <div className="px-7 pb-6 sm:px-10">

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#20AEB8]">
              Earnings
            </p>

            <div className="overflow-hidden rounded-xl border border-charcoal-200">

              <table className="w-full">

                <thead>
                  <tr className="bg-charcoal-50 text-left text-xs font-semibold uppercase tracking-wide text-charcoal-500">

                    <th className="px-5 py-3">
                      Description
                    </th>

                    <th className="px-5 py-3 text-right">
                      Hours
                    </th>

                    <th className="px-5 py-3 text-right">
                      Rate
                    </th>

                    <th className="px-5 py-3 text-right">
                      Amount
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-charcoal-100">

                  <tr>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-charcoal-900">
                        Ordinary Hours
                      </p>

                      <p className="mt-1 text-xs text-charcoal-400">
                        Approved attendance hours
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-charcoal-700">
                      {formatNumber(
                        payrollItem.normal_hours
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-charcoal-700">
                      {formatCurrency(
                        payrollItem.hourly_rate
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-charcoal-900">
                      {formatCurrency(
                        payrollItem.normal_pay
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-charcoal-900">
                        Overtime Hours
                      </p>

                      <p className="mt-1 text-xs text-charcoal-400">
                        Paid at 1.5 × hourly rate
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-charcoal-700">
                      {formatNumber(
                        payrollItem.overtime_hours
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-charcoal-700">
                      {formatCurrency(
                        Number(
                          payrollItem.hourly_rate ||
                            0
                        ) * 1.5
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-charcoal-900">
                      {formatCurrency(
                        payrollItem.overtime_pay
                      )}
                    </td>
                  </tr>

                  <tr className="bg-charcoal-50">

                    <td
                      colSpan={3}
                      className="px-5 py-4 text-sm font-bold text-charcoal-900"
                    >
                      Gross Pay
                    </td>

                    <td className="px-5 py-4 text-right text-base font-bold text-charcoal-900">
                      {formatCurrency(
                        payrollItem.gross_pay
                      )}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* DEDUCTIONS */}

          <div className="px-7 pb-6 sm:px-10">

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#20AEB8]">
              Deductions
            </p>

            <div className="overflow-hidden rounded-xl border border-charcoal-200">

              <table className="w-full">

                <tbody className="divide-y divide-charcoal-100">

                  <tr>
                    <td className="px-5 py-4 text-sm text-charcoal-700">
                      PAYE
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-red-600">
                      -{" "}
                      {formatCurrency(
                        payrollItem.paye
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 text-sm text-charcoal-700">
                      UIF - Employee
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-red-600">
                      -{" "}
                      {formatCurrency(
                        payrollItem.uif_employee
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 text-sm text-charcoal-700">
                      Other Deductions
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-red-600">
                      -{" "}
                      {formatCurrency(
                        payrollItem.other_deductions
                      )}
                    </td>
                  </tr>

                  <tr className="bg-charcoal-50">

                    <td className="px-5 py-4 text-sm font-bold text-charcoal-900">
                      Total Deductions
                    </td>

                    <td className="px-5 py-4 text-right text-base font-bold text-red-600">
                      -{" "}
                      {formatCurrency(
                        totalDeductions
                      )}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* NET PAY */}

          <div className="px-7 pb-7 sm:px-10">

            <div className="rounded-2xl bg-charcoal-900 p-6 text-white">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    Net Pay
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    Final amount payable to employee
                  </p>

                </div>

                <p className="text-3xl font-bold text-cyan-300">
                  {formatCurrency(
                    payrollItem.net_pay
                  )}
                </p>

              </div>

            </div>

          </div>

          {/* BANKING */}

          <div className="border-t border-charcoal-200 px-7 py-6 sm:px-10">

            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#20AEB8]">
              Payment Information
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <InfoField
                label="Bank"
                value={
                  employee.bank_name ||
                  "—"
                }
              />

              <InfoField
                label="Account Holder"
                value={
                  employee.account_holder ||
                  `${employee.first_name} ${employee.last_name}`
                }
              />

              <InfoField
                label="Account Number"
                value={
                  employee.account_number ||
                  "—"
                }
              />

              <InfoField
                label="Branch Code"
                value={
                  employee.branch_code ||
                  "—"
                }
              />

            </div>

          </div>

          {/* NOTES */}

          {payrollItem.notes && (
            <div className="border-t border-charcoal-200 px-7 py-6 sm:px-10">

              <p className="text-xs font-semibold uppercase tracking-wide text-[#20AEB8]">
                Payroll Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-charcoal-600">
                {payrollItem.notes}
              </p>

            </div>
          )}

          {/* FOOTER */}

          <div className="border-t border-charcoal-200 px-7 py-5 sm:px-10">

            <div className="flex flex-col gap-2 text-xs text-charcoal-400 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="font-semibold text-charcoal-600">
                  Skip Co Solutions
                </p>

                <p className="mt-1">
                  DDW Consolidate (Pty) Ltd
                </p>
              </div>

              <div className="sm:text-right">
                <p>
                  062 737 9728
                </p>

                <p className="mt-1">
                  ddw.trading@outlook.com
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}

/* =========================================================
   INFO FIELD
========================================================= */

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-charcoal-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-charcoal-900">
        {value}
      </p>
    </div>
  );
}