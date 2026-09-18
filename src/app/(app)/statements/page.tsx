"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";

import {
  Document,
  Image,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";

interface Customer {
  id: string;
  customer_number: string;
  company_name: string;
  trading_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  physical_address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  total: number;
  status: string;
  notes?: string | null;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getDefaultStartDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 12);
  return date.toISOString().split("T")[0];
}

function formatCurrency(value: number) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

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

/* =========================================================
   STATEMENT PDF STYLES
   MATCHES InvoicePDF.tsx
========================================================= */

const pdfStyles = StyleSheet.create({
  page: {
    width: "100%",
    height: "100%",
    paddingTop: 34,
    paddingBottom: 42,
    paddingLeft: 38,
    paddingRight: 38,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  logoArea: {
    width: "55%",
  },

  registeredName: {
    fontSize: 6.5,
    color: "#666666",
    marginBottom: 5,
  },

  logo: {
    width: 175,
    height: 94,
    objectFit: "contain",
  },

  invoiceHeading: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 10,
  },

  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#222222",
    marginBottom: 10,
  },

  invoiceInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  invoiceInfoLabel: {
    width: 65,
    textAlign: "right",
    color: "#777777",
    fontSize: 8,
    marginRight: 7,
  },

  invoiceInfoValue: {
    width: 75,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 8,
  },

  cyanLine: {
    height: 3,
    backgroundColor: "#20AEB8",
    marginBottom: 18,
  },

  /* =====================================================
     COMPANY DETAILS
  ===================================================== */

  companyDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  companyDetailsLeft: {
    width: "48%",
  },

  companyDetailsRight: {
    width: "48%",
    alignItems: "flex-end",
  },

  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#20AEB8",
  },

  smallText: {
    fontSize: 7.5,
    color: "#555555",
    marginBottom: 2.5,
  },

  /* =====================================================
     PARTIES
  ===================================================== */

  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 18,
  },

  partyBox: {
    width: "48%",
  },

  partyHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  partyName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },

  /* =====================================================
     TABLE
  ===================================================== */

  table: {
    width: "100%",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#20AEB8",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 5,
    paddingRight: 5,
  },

  tableHeaderText: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 5,
    paddingRight: 5,
  },

  invoiceNumberColumn: {
    width: "30%",
  },

  invoiceDateColumn: {
    width: "23%",
  },

  dueDateColumn: {
    width: "23%",
  },

  amountColumn: {
    width: "24%",
    textAlign: "right",
  },

  tableText: {
    fontSize: 7.5,
  },

  /* =====================================================
     TOTALS
  ===================================================== */

  totals: {
    marginTop: 14,
    marginLeft: "58%",
    width: "42%",
  },

  totalTopLine: {
    borderTopWidth: 1,
    borderTopColor: "#999999",
    marginTop: 4,
  },

  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 7,
    paddingBottom: 7,
    borderBottomWidth: 2,
    borderBottomColor: "#20AEB8",
  },

  grandTotalLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },

  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#20AEB8",
  },

  /* =====================================================
     FOOTER
  ===================================================== */

  footer: {
    position: "absolute",
    bottom: 20,
    left: 38,
    right: 38,
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
    fontSize: 6.5,
    color: "#777777",
    marginBottom: 1.5,
  },
});

/* =========================================================
   STATEMENT PDF
   SAME VISUAL TEMPLATE AS InvoicePDF.tsx
========================================================= */

function StatementPDF({
  customer,
  invoices,
  totalInvoices,
  statementDate,
  startDate,
  endDate,
  fromInvoice,
  toInvoice,
}: {
  customer: Customer;
  invoices: Invoice[];
  totalInvoices: number;
  statementDate: string;
  startDate: string;
  endDate: string;
  fromInvoice: Invoice | null;
  toInvoice: Invoice | null;
}) {
  return (
    <Document
      title="Customer Statement"
      author="SkipCo Solutions"
      subject={`Customer Statement - ${customer.company_name}`}
    >
      <Page
        size="A4"
        orientation="portrait"
        style={pdfStyles.page}
        wrap
      >
        {/* HEADER */}

        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoArea}>
            <Text style={pdfStyles.registeredName}>
              DDW Consolidate t/a SkipCo Solutions
            </Text>

            <Image
              src="/skipco-logo.jpg"
              style={pdfStyles.logo}
            />
          </View>

          <View style={pdfStyles.invoiceHeading}>
            <Text style={pdfStyles.invoiceTitle}>
              CUSTOMER STATEMENT
            </Text>

            <View style={pdfStyles.invoiceInfoRow}>
              <Text style={pdfStyles.invoiceInfoLabel}>
                Statement Date
              </Text>

              <Text style={pdfStyles.invoiceInfoValue}>
                {formatDate(statementDate)}
              </Text>
            </View>

            <View style={pdfStyles.invoiceInfoRow}>
              <Text style={pdfStyles.invoiceInfoLabel}>
                From Date
              </Text>

              <Text style={pdfStyles.invoiceInfoValue}>
                {formatDate(startDate)}
              </Text>
            </View>

            <View style={pdfStyles.invoiceInfoRow}>
              <Text style={pdfStyles.invoiceInfoLabel}>
                To Date
              </Text>

              <Text style={pdfStyles.invoiceInfoValue}>
                {formatDate(endDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.cyanLine} />

        {/* COMPANY DETAILS */}

        <View style={pdfStyles.companyDetails}>
          <View style={pdfStyles.companyDetailsLeft}>
            <Text style={pdfStyles.companyName}>
              Skip Co Solutions
            </Text>

            <Text style={pdfStyles.smallText}>
              Skip Hire & Waste Removal
            </Text>
          </View>

          <View style={pdfStyles.companyDetailsRight}>
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

        {/* INVOICE FROM / INVOICE TO */}

        <View style={pdfStyles.parties}>
          <View style={pdfStyles.partyBox}>
            <Text style={pdfStyles.partyHeading}>
              Invoice From
            </Text>

            <Text style={pdfStyles.partyName}>
              Skip Co Solutions
            </Text>

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

          <View style={pdfStyles.partyBox}>
            <Text style={pdfStyles.partyHeading}>
              Invoice To
            </Text>

            <Text style={pdfStyles.partyName}>
              {customer.company_name}
            </Text>

            {customer.contact_person && (
              <Text style={pdfStyles.smallText}>
                {customer.contact_person}
              </Text>
            )}

            {customer.phone && (
              <Text style={pdfStyles.smallText}>
                {customer.phone}
              </Text>
            )}

            {customer.email && (
              <Text style={pdfStyles.smallText}>
                {customer.email}
              </Text>
            )}

            {customer.physical_address && (
              <Text style={pdfStyles.smallText}>
                {customer.physical_address}
              </Text>
            )}
          </View>
        </View>

        {/* INVOICE TABLE */}

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text
              style={[
                pdfStyles.tableHeaderText,
                pdfStyles.invoiceNumberColumn,
              ]}
            >
              INVOICE NO.
            </Text>

            <Text
              style={[
                pdfStyles.tableHeaderText,
                pdfStyles.invoiceDateColumn,
              ]}
            >
              INVOICE DATE
            </Text>

            <Text
              style={[
                pdfStyles.tableHeaderText,
                pdfStyles.dueDateColumn,
              ]}
            >
              DUE DATE
            </Text>

            <Text
              style={[
                pdfStyles.tableHeaderText,
                pdfStyles.amountColumn,
              ]}
            >
              AMOUNT
            </Text>
          </View>

          {invoices.map((invoice) => (
            <View
              key={invoice.id}
              style={pdfStyles.tableRow}
              wrap={false}
            >
              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.invoiceNumberColumn,
                ]}
              >
                {invoice.invoice_number}
              </Text>

              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.invoiceDateColumn,
                ]}
              >
                {formatDate(invoice.invoice_date)}
              </Text>

              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.dueDateColumn,
                ]}
              >
                {formatDate(invoice.due_date)}
              </Text>

              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.amountColumn,
                ]}
              >
                {formatCurrency(
                  Number(invoice.total || 0)
                )}
              </Text>
            </View>
          ))}

          {invoices.length === 0 && (
            <View style={pdfStyles.tableRow}>
              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.invoiceNumberColumn,
                ]}
              >
                No invoices found.
              </Text>
            </View>
          )}
        </View>

        {/* TOTAL */}

        <View style={pdfStyles.totals} wrap={false}>
          <View style={pdfStyles.totalTopLine} />

          <View style={pdfStyles.grandTotalRow}>
            <Text style={pdfStyles.grandTotalLabel}>
              TOTAL INVOICES
            </Text>

            <Text style={pdfStyles.grandTotalValue}>
              {formatCurrency(totalInvoices)}
            </Text>
          </View>
        </View>

        {/* FOOTER */}

        <View style={pdfStyles.footer} fixed>
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

export default function StatementsPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statementDate, setStatementDate] = useState("");

  const [search, setSearch] = useState("");

  const [fromInvoice, setFromInvoice] = useState("");
  const [toInvoice, setToInvoice] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingStatement, setLoadingStatement] =
    useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

  useEffect(() => {
    setStartDate(getDefaultStartDate());
    setEndDate(getTodayString());
    setStatementDate(getTodayString());

    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("customers")
      .select(
        `
        id,
        customer_number,
        company_name,
        trading_name,
        contact_person,
        email,
        phone,
        physical_address,
        city,
        province,
        postal_code
        `
      )
      .order("company_name", {
        ascending: true,
      });

    if (error) {
      console.error("Customer loading error:", error);

      setError(
        `Unable to load customers: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setCustomers(data ?? []);
    setLoading(false);
  }

  /* =========================================================
     LOAD INVOICES
  ========================================================= */

  async function loadStatementData(
    customerId: string
  ) {
    if (!customerId) {
      setInvoices([]);
      return;
    }

    setLoadingStatement(true);
    setError("");

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", customerId)
      .order("invoice_date", {
        ascending: true,
      });

    if (error) {
      console.error("Invoice loading error:", error);

      setError(
        `Unable to load invoices: ${error.message}`
      );

      setLoadingStatement(false);
      return;
    }

    setInvoices((data ?? []) as Invoice[]);
    setLoadingStatement(false);
  }

  useEffect(() => {
    if (selectedCustomerId) {
      loadStatementData(selectedCustomerId);
    } else {
      setInvoices([]);
      setFromInvoice("");
      setToInvoice("");
    }
  }, [selectedCustomerId]);

  /* =========================================================
     CUSTOMER SEARCH
  ========================================================= */

  const filteredCustomers = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.company_name
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.trading_name
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.customer_number
          ?.toLowerCase()
          .includes(searchValue)
    );
  }, [customers, search]);

  /* =========================================================
     SELECTED CUSTOMER
  ========================================================= */

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.id === selectedCustomerId
    ) ?? null;

  /* =========================================================
     SORT INVOICES
  ========================================================= */

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      if (a.invoice_date === b.invoice_date) {
        return a.invoice_number.localeCompare(
          b.invoice_number,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }

      return a.invoice_date.localeCompare(
        b.invoice_date
      );
    });
  }, [invoices]);

  /* =========================================================
     INVOICE RANGE
  ========================================================= */

  const invoiceRangeSet = useMemo(() => {
    if (!fromInvoice && !toInvoice) {
      return null;
    }

    const fromIndex = fromInvoice
      ? sortedInvoices.findIndex(
          (invoice) =>
            invoice.id === fromInvoice
        )
      : 0;

    const toIndex = toInvoice
      ? sortedInvoices.findIndex(
          (invoice) =>
            invoice.id === toInvoice
        )
      : sortedInvoices.length - 1;

    if (
      fromIndex === -1 ||
      toIndex === -1
    ) {
      return new Set<string>();
    }

    const startIndex = Math.min(
      fromIndex,
      toIndex
    );

    const endIndex = Math.max(
      fromIndex,
      toIndex
    );

    return new Set(
      sortedInvoices
        .slice(
          startIndex,
          endIndex + 1
        )
        .map((invoice) => invoice.id)
    );
  }, [
    fromInvoice,
    toInvoice,
    sortedInvoices,
  ]);

  function invoiceIsInSelectedRange(
    invoiceId: string
  ) {
    if (!invoiceRangeSet) {
      return true;
    }

    return invoiceRangeSet.has(invoiceId);
  }

  /* =========================================================
     DISPLAYED INVOICES
  ========================================================= */

  const displayedInvoices = useMemo(() => {
    return sortedInvoices.filter(
      (invoice) => {
        const withinDateRange =
          (!startDate ||
            invoice.invoice_date >=
              startDate) &&
          (!endDate ||
            invoice.invoice_date <=
              endDate);

        return (
          withinDateRange &&
          invoiceIsInSelectedRange(
            invoice.id
          )
        );
      }
    );
  }, [
    sortedInvoices,
    startDate,
    endDate,
    invoiceRangeSet,
  ]);

  /* =========================================================
     TOTAL
  ========================================================= */

  const totalInvoices = useMemo(() => {
    return displayedInvoices.reduce(
      (total, invoice) =>
        total +
        Number(invoice.total || 0),
      0
    );
  }, [displayedInvoices]);

  /* =========================================================
     CLEAR
  ========================================================= */

  function clearStatement() {
    setSelectedCustomerId("");
    setSearch("");
    setInvoices([]);
    setFromInvoice("");
    setToInvoice("");
    setError("");
  }

  const selectedFromInvoice =
    fromInvoice
      ? sortedInvoices.find(
          (invoice) =>
            invoice.id === fromInvoice
        ) ?? null
      : null;

  const selectedToInvoice =
    toInvoice
      ? sortedInvoices.find(
          (invoice) =>
            invoice.id === toInvoice
        ) ?? null
      : null;

  const pdfReady =
    !!selectedCustomer &&
    !loadingStatement &&
    displayedInvoices.length > 0;

  const pdfFileName = selectedCustomer
    ? `Statement-${selectedCustomer.company_name
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}.pdf`
    : "Customer-Statement.pdf";

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <DashboardShell
      title="Statements"
      subtitle="Customer statements and invoice summaries"
    >
      <PageHeader
        title="Customer Statements"
        description="Create an invoice-style statement containing selected customer invoices."
        icon={FileText}
      />

      <div className="space-y-6">

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CUSTOMER SELECTION */}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-charcoal-900">
              Select Customer
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Choose a customer and select the invoices to include in the statement.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {/* SEARCH */}

            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Search Customer
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
                  placeholder="Search by name or number..."
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>
            </div>

            {/* CUSTOMER */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Customer
              </label>

              <select
                value={selectedCustomerId}
                onChange={(event) =>
                  setSelectedCustomerId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
              >
                <option value="">
                  Select a customer
                </option>

                {filteredCustomers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.company_name} —{" "}
                      {
                        customer.customer_number
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* FROM DATE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Statement From
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>
            </div>

            {/* TO DATE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Statement To
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>
            </div>

            {/* FROM INVOICE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                From Invoice
              </label>

              <select
                value={fromInvoice}
                onChange={(event) =>
                  setFromInvoice(
                    event.target.value
                  )
                }
                disabled={
                  !selectedCustomerId ||
                  invoices.length === 0
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10 disabled:cursor-not-allowed disabled:bg-charcoal-50 disabled:text-charcoal-400"
              >
                <option value="">
                  All invoices
                </option>

                {sortedInvoices.map(
                  (invoice) => (
                    <option
                      key={invoice.id}
                      value={invoice.id}
                    >
                      {invoice.invoice_number}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TO INVOICE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                To Invoice
              </label>

              <select
                value={toInvoice}
                onChange={(event) =>
                  setToInvoice(
                    event.target.value
                  )
                }
                disabled={
                  !selectedCustomerId ||
                  invoices.length === 0
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10 disabled:cursor-not-allowed disabled:bg-charcoal-50 disabled:text-charcoal-400"
              >
                <option value="">
                  All invoices
                </option>

                {sortedInvoices.map(
                  (invoice) => (
                    <option
                      key={invoice.id}
                      value={invoice.id}
                    >
                      {invoice.invoice_number}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BUTTONS */}

            <div className="flex items-end gap-2">

              <button
                type="button"
                onClick={clearStatement}
                className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>

              {pdfReady ? (
                <PDFDownloadLink
                  document={
                    <StatementPDF
                      customer={selectedCustomer}
                      invoices={displayedInvoices}
                      totalInvoices={totalInvoices}
                      statementDate={statementDate}
                      startDate={startDate}
                      endDate={endDate}
                      fromInvoice={
                        selectedFromInvoice
                      }
                      toInvoice={
                        selectedToInvoice
                      }
                    />
                  }
                  fileName={pdfFileName}
                >
                  {({ loading: pdfLoading }) => (
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white ${
                        pdfLoading
                          ? "cursor-wait opacity-60"
                          : "hover:bg-charcoal-800"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      {pdfLoading
                        ? "Preparing PDF..."
                        : "Download PDF"}
                    </span>
                  )}
                </PDFDownloadLink>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Download PDF
                </button>
              )}

            </div>
          </div>

          {(fromInvoice || toInvoice) && (
            <div className="mt-5 rounded-xl border border-[#20AEB8]/20 bg-[#20AEB8]/5 px-4 py-3 text-sm text-charcoal-600">
              Invoice range:{" "}
              <span className="font-semibold text-charcoal-900">
                {fromInvoice
                  ? selectedFromInvoice
                      ?.invoice_number ?? "Start"
                  : "Start"}{" "}
                →{" "}
                {toInvoice
                  ? selectedToInvoice
                      ?.invoice_number ?? "End"
                  : "Latest"}
              </span>
            </div>
          )}
        </div>

        {/* LOADING */}

        {loadingStatement && (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-16 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-[#20AEB8]" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading customer invoices...
            </span>
          </div>
        )}

        {/* STATEMENT PREVIEW */}

        {!loadingStatement &&
          selectedCustomer && (
            <div className="rounded-2xl border border-charcoal-100 bg-charcoal-50 p-4 shadow-sm md:p-8">
              <div className="mx-auto w-full max-w-[794px] bg-white p-[38px] shadow-sm">

                {/* HEADER */}

                <div className="flex items-start justify-between gap-8 pb-4">

                  <div className="w-[55%]">
                    <div className="mb-1 text-[9px] text-gray-500">
                      DDW Consolidate t/a SkipCo Solutions
                    </div>

                    <img
                      src="/skipco-logo.jpg"
                      alt="SkipCo Solutions"
                      className="h-[94px] w-[175px] object-contain"
                    />
                  </div>

                  <div className="w-[40%] pt-2 text-right">

                    <div className="mb-2.5 text-[22px] font-bold tracking-wide text-gray-900">
                      CUSTOMER STATEMENT
                    </div>

                    <div className="space-y-1 text-[10px]">

                      <div className="flex justify-end">
                        <span className="mr-2 w-[65px] text-right text-gray-500">
                          Statement Date
                        </span>

                        <span className="w-[75px] text-right font-bold">
                          {formatDate(statementDate)}
                        </span>
                      </div>

                      <div className="flex justify-end">
                        <span className="mr-2 w-[65px] text-right text-gray-500">
                          From Date
                        </span>

                        <span className="w-[75px] text-right font-bold">
                          {formatDate(startDate)}
                        </span>
                      </div>

                      <div className="flex justify-end">
                        <span className="mr-2 w-[65px] text-right text-gray-500">
                          To Date
                        </span>

                        <span className="w-[75px] text-right font-bold">
                          {formatDate(endDate)}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="mb-[18px] h-[3px] bg-[#20AEB8]" />

                {/* COMPANY DETAILS */}

                <div className="mb-[18px] flex justify-between">

                  <div className="w-[48%]">
                    <div className="mb-1 text-[11px] font-bold text-[#20AEB8]">
                      Skip Co Solutions
                    </div>

                    <div className="space-y-[2px] text-[7.5px] text-gray-600">
                      <div>
                        Skip Hire &amp; Waste Removal
                      </div>
                    </div>
                  </div>

                  <div className="w-[48%] text-right">
                    <div className="space-y-[2px] text-[7.5px] text-gray-600">
                      <div>
                        Pellesier, Bloemfontein
                      </div>

                      <div>
                        062 737 9728
                      </div>

                      <div>
                        ddw.trading@outlook.com
                      </div>
                    </div>
                  </div>

                </div>

                {/* INVOICE FROM / INVOICE TO */}

                <div className="mb-[18px] flex justify-between border-y border-[#D9DDE3] py-3">

                  <div className="w-[48%]">

                    <div className="mb-1.5 text-[8px] font-bold uppercase text-[#20AEB8]">
                      Invoice From
                    </div>

                    <div className="mb-1 text-[10px] font-bold">
                      Skip Co Solutions
                    </div>

                    <div className="space-y-[2px] text-[7.5px] text-gray-600">
                      <div>
                        Pellesier, Bloemfontein
                      </div>

                      <div>
                        062 737 9728
                      </div>

                      <div>
                        ddw.trading@outlook.com
                      </div>
                    </div>

                  </div>

                  <div className="w-[48%]">

                    <div className="mb-1.5 text-[8px] font-bold uppercase text-[#20AEB8]">
                      Invoice To
                    </div>

                    <div className="mb-1 text-[10px] font-bold">
                      {selectedCustomer.company_name}
                    </div>

                    <div className="space-y-[2px] text-[7.5px] text-gray-600">
                      {selectedCustomer.contact_person && (
                        <div>
                          {selectedCustomer.contact_person}
                        </div>
                      )}

                      {selectedCustomer.phone && (
                        <div>
                          {selectedCustomer.phone}
                        </div>
                      )}

                      {selectedCustomer.email && (
                        <div>
                          {selectedCustomer.email}
                        </div>
                      )}

                      {selectedCustomer.physical_address && (
                        <div>
                          {selectedCustomer.physical_address}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

                {/* INVOICE TABLE */}

                <div className="w-full overflow-hidden">

                  <table className="w-full border-collapse">

                    <thead>
                      <tr className="bg-[#20AEB8]">

                        <th className="w-[30%] px-[5px] py-[7px] text-left text-[7.5px] font-bold text-white">
                          INVOICE NO.
                        </th>

                        <th className="w-[23%] px-[5px] py-[7px] text-left text-[7.5px] font-bold text-white">
                          INVOICE DATE
                        </th>

                        <th className="w-[23%] px-[5px] py-[7px] text-left text-[7.5px] font-bold text-white">
                          DUE DATE
                        </th>

                        <th className="w-[24%] px-[5px] py-[7px] text-right text-[7.5px] font-bold text-white">
                          AMOUNT
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {displayedInvoices.map(
                        (invoice) => (
                          <tr
                            key={invoice.id}
                            className="border-b border-[#E6E6E6]"
                          >

                            <td className="w-[30%] px-[5px] py-[7px] text-[7.5px]">
                              {invoice.invoice_number}
                            </td>

                            <td className="w-[23%] px-[5px] py-[7px] text-[7.5px]">
                              {formatDate(
                                invoice.invoice_date
                              )}
                            </td>

                            <td className="w-[23%] px-[5px] py-[7px] text-[7.5px]">
                              {formatDate(
                                invoice.due_date
                              )}
                            </td>

                            <td className="w-[24%] px-[5px] py-[7px] text-right text-[7.5px]">
                              {formatCurrency(
                                Number(
                                  invoice.total || 0
                                )
                              )}
                            </td>

                          </tr>
                        )
                      )}

                      {displayedInvoices.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-2 py-7 text-center text-[7.5px] text-gray-500"
                          >
                            No invoices found for the selected period or invoice range.
                          </td>
                        </tr>
                      )}

                    </tbody>
                  </table>
                </div>

                {/* TOTAL */}

                <div className="ml-[58%] mt-[14px] w-[42%]">

                  <div className="border-t border-gray-400" />

                  <div className="flex justify-between border-b-2 border-[#20AEB8] py-[7px]">

                    <span className="text-[10px] font-bold">
                      TOTAL INVOICES
                    </span>

                    <span className="text-[11px] font-bold text-[#20AEB8]">
                      {formatCurrency(
                        totalInvoices
                      )}
                    </span>

                  </div>

                </div>

                {/* FOOTER */}

                <div className="mt-8 flex justify-between border-t border-[#D9DDE3] pt-2 text-[6.5px] text-gray-500">

                  <div className="w-[60%]">
                    <div className="mb-[1.5px]">
                      Skip Co Solutions
                    </div>

                    <div>
                      Pellesier, Bloemfontein
                    </div>
                  </div>

                  <div className="w-[40%] text-right">
                    <div className="mb-[1.5px]">
                      062 737 9728
                    </div>

                    <div>
                      ddw.trading@outlook.com
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        {/* NO CUSTOMER */}

        {!loading &&
          !loadingStatement &&
          !selectedCustomer && (
            <div className="rounded-2xl border border-charcoal-100 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-charcoal-50">
                <FileText className="h-7 w-7 text-charcoal-400" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-charcoal-900">
                Select a customer
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-charcoal-500">
                Choose a customer above to create a statement containing their invoices.
              </p>

            </div>
          )}

      </div>
    </DashboardShell>
  );
}