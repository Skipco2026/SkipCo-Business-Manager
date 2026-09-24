"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  Trash2,
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

interface Kickback {
  id: string;
  transaction_date: string;
  reference: string | null;
  description: string | null;
  amount: number;
  customer_id: string;
  job_id: string | null;
  notes: string | null;
  created_at: string;
}

interface SavedStatement {
  id: string;
  customer_id: string;
  statement_date: string;
  start_date: string;
  end_date: string;
  total_invoices: number;
  total_kickbacks: number;
  balance_due: number;
  created_at: string;
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
   PDF STYLES
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

  creditRow: {
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

  creditText: {
    fontSize: 7.5,
    color: "#16858C",
  },

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

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    paddingBottom: 5,
  },

  totalLabel: {
    fontSize: 8,
    fontWeight: "bold",
  },

  totalValue: {
    fontSize: 8,
    fontWeight: "bold",
  },

  creditTotalValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#16858C",
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
========================================================= */

function StatementPDF({
  customer,
  invoices,
  kickbacks,
  totalInvoices,
  totalKickbacks,
  balanceDue,
  statementDate,
  startDate,
  endDate,
}: {
  customer: Customer;
  invoices: Invoice[];
  kickbacks: Kickback[];
  totalInvoices: number;
  totalKickbacks: number;
  balanceDue: number;
  statementDate: string;
  startDate: string;
  endDate: string;
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

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text
              style={[
                pdfStyles.tableHeaderText,
                pdfStyles.invoiceNumberColumn,
              ]}
            >
              TRANSACTION
            </Text>

            <Text
              style={[
                pdfStyles.tableHeaderText,
                pdfStyles.invoiceDateColumn,
              ]}
            >
              DATE
            </Text>

            <Text
              style={[
                pdfStyles.tableHeaderText,
                pdfStyles.dueDateColumn,
              ]}
            >
              TYPE
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
              key={`invoice-${invoice.id}`}
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
                INVOICE
              </Text>

              <Text
                style={[
                  pdfStyles.tableText,
                  pdfStyles.amountColumn,
                ]}
              >
                {formatCurrency(Number(invoice.total || 0))}
              </Text>
            </View>
          ))}

          {kickbacks.map((kickback) => (
            <View
              key={`kickback-${kickback.id}`}
              style={pdfStyles.creditRow}
              wrap={false}
            >
              <Text
                style={[
                  pdfStyles.creditText,
                  pdfStyles.invoiceNumberColumn,
                ]}
              >
                {kickback.reference ||
                  `Kickback ${kickback.id.slice(0, 8)}`}
              </Text>

              <Text
                style={[
                  pdfStyles.creditText,
                  pdfStyles.invoiceDateColumn,
                ]}
              >
                {formatDate(kickback.transaction_date)}
              </Text>

              <Text
                style={[
                  pdfStyles.creditText,
                  pdfStyles.dueDateColumn,
                ]}
              >
                CREDIT
              </Text>

              <Text
                style={[
                  pdfStyles.creditText,
                  pdfStyles.amountColumn,
                ]}
              >
                -{formatCurrency(Number(kickback.amount || 0))}
              </Text>
            </View>
          ))}

          {invoices.length === 0 &&
            kickbacks.length === 0 && (
              <View style={pdfStyles.tableRow}>
                <Text
                  style={[
                    pdfStyles.tableText,
                    pdfStyles.invoiceNumberColumn,
                  ]}
                >
                  No transactions found.
                </Text>
              </View>
            )}
        </View>

        <View style={pdfStyles.totals} wrap={false}>
          <View style={pdfStyles.totalTopLine} />

          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>
              TOTAL INVOICES
            </Text>

            <Text style={pdfStyles.totalValue}>
              {formatCurrency(totalInvoices)}
            </Text>
          </View>

          {totalKickbacks > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>
                KICKBACK CREDITS
              </Text>

              <Text style={pdfStyles.creditTotalValue}>
                -{formatCurrency(totalKickbacks)}
              </Text>
            </View>
          )}

          <View style={pdfStyles.grandTotalRow}>
            <Text style={pdfStyles.grandTotalLabel}>
              BALANCE DUE
            </Text>

            <Text style={pdfStyles.grandTotalValue}>
              {formatCurrency(balanceDue)}
            </Text>
          </View>
        </View>

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

/* =========================================================
   PAGE
========================================================= */

export default function StatementsPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [kickbacks, setKickbacks] = useState<Kickback[]>([]);
  const [savedStatements, setSavedStatements] = useState<
    SavedStatement[]
  >([]);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statementDate, setStatementDate] = useState("");

  const [search, setSearch] = useState("");

  const [fromInvoice, setFromInvoice] = useState("");
  const [toInvoice, setToInvoice] = useState("");

  const [addKickbacks, setAddKickbacks] = useState(false);
  const [selectedKickbackIds, setSelectedKickbackIds] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingStatement, setLoadingStatement] =
    useState(false);
  const [loadingKickbacks, setLoadingKickbacks] =
    useState(false);
  const [savingStatement, setSavingStatement] =
    useState(false);
  const [deletingStatementId, setDeletingStatementId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const today = getTodayString();

    setStartDate(getDefaultStartDate());
    setEndDate(today);
    setStatementDate(today);

    loadCustomers();
    loadSavedStatements();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const { data, error: customerError } = await supabase
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

    if (customerError) {
      console.error(
        "Customer loading error:",
        customerError
      );

      setError(
        `Unable to load customers: ${customerError.message}`
      );

      setLoading(false);
      return;
    }

    setCustomers(data ?? []);
    setLoading(false);
  }

  async function loadSavedStatements() {
    const { data, error: statementError } = await supabase
      .from("customer_statements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (statementError) {
      console.error(
        "Saved statements loading error:",
        statementError
      );

      return;
    }

    setSavedStatements(
      (data ?? []) as SavedStatement[]
    );
  }

  async function loadStatementData(customerId: string) {
    if (!customerId) {
      setInvoices([]);
      setKickbacks([]);
      setSelectedKickbackIds([]);
      return;
    }

    setLoadingStatement(true);
    setLoadingKickbacks(true);
    setError("");

    const [
      invoiceResult,
      kickbackResult,
    ] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customerId)
        .order("invoice_date", {
          ascending: true,
        }),

      supabase
        .from("financial_transactions")
        .select(
          `
          id,
          transaction_date,
          reference,
          description,
          amount,
          customer_id,
          job_id,
          notes,
          created_at
          `
        )
        .eq("customer_id", customerId)
        .eq("type", "kickback")
        .eq("applied_to_statement", false)
        .order("transaction_date", {
          ascending: true,
        }),
    ]);

    if (invoiceResult.error) {
      console.error(
        "Invoice loading error:",
        invoiceResult.error
      );

      setError(
        `Unable to load invoices: ${invoiceResult.error.message}`
      );
    } else {
      setInvoices(
        (invoiceResult.data ?? []) as Invoice[]
      );
    }

    if (kickbackResult.error) {
      console.error(
        "Kickback loading error:",
        kickbackResult.error
      );

      setError(
        `Unable to load kickbacks: ${kickbackResult.error.message}`
      );

      setKickbacks([]);
    } else {
      setKickbacks(
        (kickbackResult.data ?? []) as Kickback[]
      );
    }

    setSelectedKickbackIds([]);
    setLoadingStatement(false);
    setLoadingKickbacks(false);
  }

  useEffect(() => {
    if (selectedCustomerId) {
      loadStatementData(selectedCustomerId);
    } else {
      setInvoices([]);
      setKickbacks([]);
      setFromInvoice("");
      setToInvoice("");
      setSelectedKickbackIds([]);
      setAddKickbacks(false);
    }
  }, [selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

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

  const selectedCustomer =
    customers.find(
      (customer) => customer.id === selectedCustomerId
    ) ?? null;

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

      return a.invoice_date.localeCompare(b.invoice_date);
    });
  }, [invoices]);

  const invoiceRangeSet = useMemo(() => {
    if (!fromInvoice && !toInvoice) {
      return null;
    }

    const fromIndex = fromInvoice
      ? sortedInvoices.findIndex(
          (invoice) => invoice.id === fromInvoice
        )
      : 0;

    const toIndex = toInvoice
      ? sortedInvoices.findIndex(
          (invoice) => invoice.id === toInvoice
        )
      : sortedInvoices.length - 1;

    if (fromIndex === -1 || toIndex === -1) {
      return new Set<string>();
    }

    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);

    return new Set(
      sortedInvoices
        .slice(startIndex, endIndex + 1)
        .map((invoice) => invoice.id)
    );
  }, [fromInvoice, toInvoice, sortedInvoices]);

  function invoiceIsInSelectedRange(invoiceId: string) {
    if (!invoiceRangeSet) {
      return true;
    }

    return invoiceRangeSet.has(invoiceId);
  }

  const displayedInvoices = useMemo(() => {
    return sortedInvoices.filter((invoice) => {
      const withinDateRange =
        (!startDate ||
          invoice.invoice_date >= startDate) &&
        (!endDate ||
          invoice.invoice_date <= endDate);

      return (
        withinDateRange &&
        invoiceIsInSelectedRange(invoice.id)
      );
    });
  }, [
    sortedInvoices,
    startDate,
    endDate,
    invoiceRangeSet,
  ]);

  const selectedKickbacks = useMemo(() => {
    if (!addKickbacks) {
      return [];
    }

    return kickbacks.filter((kickback) =>
      selectedKickbackIds.includes(kickback.id)
    );
  }, [
    addKickbacks,
    kickbacks,
    selectedKickbackIds,
  ]);

  const totalInvoices = useMemo(() => {
    return displayedInvoices.reduce(
      (total, invoice) =>
        total + Number(invoice.total || 0),
      0
    );
  }, [displayedInvoices]);

  const totalKickbacks = useMemo(() => {
    return selectedKickbacks.reduce(
      (total, kickback) =>
        total + Number(kickback.amount || 0),
      0
    );
  }, [selectedKickbacks]);

  const balanceDue = useMemo(() => {
    return totalInvoices - totalKickbacks;
  }, [totalInvoices, totalKickbacks]);

  function toggleKickback(kickbackId: string) {
    setSelectedKickbackIds((current) => {
      if (current.includes(kickbackId)) {
        return current.filter(
          (id) => id !== kickbackId
        );
      }

      return [...current, kickbackId];
    });
  }

  function selectAllKickbacks() {
    setSelectedKickbackIds(
      kickbacks.map((kickback) => kickback.id)
    );
  }

  function clearKickbacks() {
    setSelectedKickbackIds([]);
  }

  function clearStatement() {
    setSelectedCustomerId("");
    setSearch("");
    setInvoices([]);
    setKickbacks([]);
    setFromInvoice("");
    setToInvoice("");
    setAddKickbacks(false);
    setSelectedKickbackIds([]);
    setError("");
    setSuccess("");
  }

  async function finalizeStatement() {
    if (!selectedCustomer) {
      setError("Please select a customer first.");
      return;
    }

    if (displayedInvoices.length === 0) {
      setError(
        "Please select at least one invoice for the statement."
      );
      return;
    }

    if (
      addKickbacks &&
      selectedKickbackIds.length > 0 &&
      selectedKickbacks.length !==
        selectedKickbackIds.length
    ) {
      setError(
        "One or more selected kickbacks are no longer available. Please reload the customer statement."
      );
      return;
    }

    setSavingStatement(true);
    setError("");
    setSuccess("");

    let statementId: string | null = null;
    const appliedKickbackIds: string[] = [];

    try {
      /*
       * Create the statement first.
       */
      const { data: statement, error: createError } =
        await supabase
          .from("customer_statements")
          .insert({
            customer_id: selectedCustomer.id,
            statement_date: statementDate,
            start_date: startDate,
            end_date: endDate,
            total_invoices: totalInvoices,
            total_kickbacks: totalKickbacks,
            balance_due: balanceDue,
          })
          .select()
          .single();

      if (createError || !statement) {
        throw new Error(
          createError?.message ||
            "Unable to create the statement."
        );
      }

      statementId = statement.id;

      /*
       * Apply each selected kickback.
       *
       * We only update records that are still marked
       * as unused. This prevents an already-used kickback
       * from being applied again.
       */
      for (const kickbackId of selectedKickbackIds) {
        const { data: updatedKickback, error: updateError } =
          await supabase
            .from("financial_transactions")
            .update({
              applied_to_statement: true,
              applied_at: new Date().toISOString(),
              statement_id: statementId,
            })
            .eq("id", kickbackId)
            .eq("customer_id", selectedCustomer.id)
            .eq("type", "kickback")
            .eq("applied_to_statement", false)
            .select("id")
            .maybeSingle();

        if (updateError) {
          throw new Error(
            `Unable to apply kickback: ${updateError.message}`
          );
        }

        if (!updatedKickback) {
          throw new Error(
            "One of the selected kickbacks was already applied. The statement was not finalized."
          );
        }

        appliedKickbackIds.push(kickbackId);
      }

      /*
       * Reload everything after successful finalization.
       */
      await loadSavedStatements();

      await loadStatementData(
        selectedCustomer.id
      );

      setSuccess(
        `Statement saved successfully${
          selectedKickbackIds.length > 0
            ? ` with ${selectedKickbackIds.length} kickback credit${
                selectedKickbackIds.length === 1
                  ? ""
                  : "s"
              }.`
            : "."
        }`
      );

      setSelectedKickbackIds([]);
      setAddKickbacks(false);
    } catch (finalizeError) {
      console.error(
        "Statement finalization error:",
        finalizeError
      );

      /*
       * If something failed after some kickbacks were
       * already applied, release them again.
       */
      if (
        appliedKickbackIds.length > 0 &&
        statementId
      ) {
        await supabase
          .from("financial_transactions")
          .update({
            applied_to_statement: false,
            applied_at: null,
            statement_id: null,
          })
          .in("id", appliedKickbackIds)
          .eq(
            "statement_id",
            statementId
          );
      }

      /*
       * Remove the incomplete statement.
       */
      if (statementId) {
        await supabase
          .from("customer_statements")
          .delete()
          .eq("id", statementId);
      }

      setError(
        finalizeError instanceof Error
          ? finalizeError.message
          : "Unable to finalize statement."
      );
    } finally {
      setSavingStatement(false);
    }
  }

  async function deleteStatement(
    statement: SavedStatement
  ) {
    const customer = customers.find(
      (item) =>
        item.id === statement.customer_id
    );

    const customerName =
      customer?.company_name || "this customer";

    const confirmed = window.confirm(
      `Delete the statement for ${customerName} dated ${formatDate(
        statement.statement_date
      )}?\n\nAny kickbacks applied to this statement will be returned to Available Kickbacks so you can redo the statement.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingStatementId(statement.id);
    setError("");
    setSuccess("");

    try {
      /*
       * First release all kickbacks belonging to the
       * statement.
       */
      const { error: releaseError } =
        await supabase
          .from("financial_transactions")
          .update({
            applied_to_statement: false,
            applied_at: null,
            statement_id: null,
          })
          .eq("statement_id", statement.id);

      if (releaseError) {
        throw new Error(
          `Unable to release kickback credits: ${releaseError.message}`
        );
      }

      /*
       * Now delete the statement itself.
       */
      const { error: deleteError } =
        await supabase
          .from("customer_statements")
          .delete()
          .eq("id", statement.id);

      if (deleteError) {
        throw new Error(
          `Unable to delete statement: ${deleteError.message}`
        );
      }

      await loadSavedStatements();

      if (selectedCustomerId) {
        await loadStatementData(
          selectedCustomerId
        );
      }

      setSuccess(
        "Statement deleted successfully. Any kickback credits used on it are available again."
      );
    } catch (deleteError) {
      console.error(
        "Statement deletion error:",
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete statement."
      );
    } finally {
      setDeletingStatementId(null);
    }
  }

  const selectedFromInvoice = fromInvoice
    ? sortedInvoices.find(
        (invoice) => invoice.id === fromInvoice
      ) ?? null
    : null;

  const selectedToInvoice = toInvoice
    ? sortedInvoices.find(
        (invoice) => invoice.id === toInvoice
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

  return (
    <DashboardShell
      title="Statements"
      subtitle="Customer statements and invoice summaries"
    >
      <PageHeader
        title="Customer Statements"
        description="Create an invoice-style statement containing selected customer invoices and recycling kickback credits."
        icon={FileText}
      />

      <div className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{success}</span>
          </div>
        )}

        <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-charcoal-900">
              Create Statement
            </h2>

            <p className="mt-1 text-sm text-charcoal-500">
              Choose a customer, select the invoices to include,
              and optionally apply recycling kickback credits.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Search Customer
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by name or number..."
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>
            </div>

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
                      {customer.customer_number}
                    </option>
                  )
                )}
              </select>
            </div>

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

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Statement Date
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                <input
                  type="date"
                  value={statementDate}
                  onChange={(event) =>
                    setStatementDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>
            </div>

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
                      kickbacks={selectedKickbacks}
                      totalInvoices={totalInvoices}
                      totalKickbacks={totalKickbacks}
                      balanceDue={balanceDue}
                      statementDate={statementDate}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  }
                  fileName={pdfFileName}
                >
                  {({
                    loading: pdfLoading,
                  }) => (
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white ${
                        pdfLoading
                          ? "cursor-wait opacity-60"
                          : "hover:bg-charcoal-800"
                      }`}
                    >
                      <FileText className="h-4 w-4" />

                      {pdfLoading
                        ? "Preparing..."
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
                  ? selectedFromInvoice?.invoice_number ??
                    "Start"
                  : "Start"}{" "}
                →{" "}
                {toInvoice
                  ? selectedToInvoice?.invoice_number ??
                    "End"
                  : "Latest"}
              </span>
            </div>
          )}

          <div className="mt-6 border-t border-charcoal-100 pt-6">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={addKickbacks}
                onChange={(event) => {
                  setAddKickbacks(
                    event.target.checked
                  );

                  if (!event.target.checked) {
                    setSelectedKickbackIds([]);
                  }
                }}
                disabled={!selectedCustomerId}
                className="h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
              />

              <div>
                <div className="text-sm font-semibold text-charcoal-900">
                  Add Credit (Kickback)
                </div>

                <div className="text-xs text-charcoal-500">
                  Select recycling kickbacks to deduct
                  from what the customer owes.
                </div>
              </div>
            </label>
          </div>

          {addKickbacks && selectedCustomer && (
            <div className="mt-5 rounded-xl border border-[#20AEB8]/20 bg-[#20AEB8]/5 p-4">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-charcoal-900">
                    Available Kickbacks
                  </h3>

                  <p className="mt-1 text-xs text-charcoal-500">
                    Select the recycling credits you
                    want to apply to this statement.
                  </p>
                </div>

                {kickbacks.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllKickbacks}
                      className="rounded-lg border border-charcoal-200 bg-white px-3 py-2 text-xs font-medium text-charcoal-700 hover:bg-charcoal-50"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={clearKickbacks}
                      className="rounded-lg border border-charcoal-200 bg-white px-3 py-2 text-xs font-medium text-charcoal-700 hover:bg-charcoal-50"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {loadingKickbacks ? (
                <div className="flex items-center justify-center rounded-lg border border-charcoal-100 bg-white px-4 py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-[#20AEB8]" />

                  <span className="ml-3 text-sm text-charcoal-500">
                    Loading available kickbacks...
                  </span>
                </div>
              ) : kickbacks.length === 0 ? (
                <div className="rounded-lg border border-charcoal-100 bg-white px-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto h-7 w-7 text-charcoal-300" />

                  <p className="mt-3 text-sm font-medium text-charcoal-700">
                    No available kickbacks
                  </p>

                  <p className="mt-1 text-xs text-charcoal-500">
                    This customer currently has no unused
                    kickback credits.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-charcoal-200 bg-white">
                  <div className="hidden grid-cols-[40px_1fr_120px_140px] gap-3 border-b border-charcoal-100 bg-charcoal-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-500 sm:grid">
                    <div />
                    <div>Kickback</div>
                    <div>Date</div>
                    <div className="text-right">
                      Credit
                    </div>
                  </div>

                  <div className="divide-y divide-charcoal-100">
                    {kickbacks.map(
                      (kickback) => {
                        const selected =
                          selectedKickbackIds.includes(
                            kickback.id
                          );

                        return (
                          <button
                            type="button"
                            key={kickback.id}
                            onClick={() =>
                              toggleKickback(
                                kickback.id
                              )
                            }
                            className={`grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 px-4 py-3 text-left transition sm:grid-cols-[40px_1fr_120px_140px] ${
                              selected
                                ? "bg-[#20AEB8]/10"
                                : "hover:bg-charcoal-50"
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border ${
                                selected
                                  ? "border-[#20AEB8] bg-[#20AEB8] text-white"
                                  : "border-charcoal-300 bg-white"
                              }`}
                            >
                              {selected && (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-charcoal-900">
                                {kickback.reference ||
                                  `Kickback ${kickback.id.slice(
                                    0,
                                    8
                                  )}`}
                              </div>

                              <div className="mt-0.5 truncate text-xs text-charcoal-500">
                                {kickback.description ||
                                  "Recycling kickback"}
                              </div>

                              <div className="mt-1 text-xs text-charcoal-400 sm:hidden">
                                {formatDate(
                                  kickback.transaction_date
                                )}
                              </div>
                            </div>

                            <div className="hidden text-sm text-charcoal-600 sm:block">
                              {formatDate(
                                kickback.transaction_date
                              )}
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-bold text-[#16858C]">
                                {formatCurrency(
                                  Number(
                                    kickback.amount ||
                                      0
                                  )
                                )}
                              </div>

                              <div className="text-[10px] uppercase tracking-wide text-[#16858C]">
                                Credit
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {selectedKickbacks.length > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#20AEB8]/20 bg-white px-4 py-3">
                  <div className="text-sm text-charcoal-600">
                    <span className="font-semibold text-charcoal-900">
                      {selectedKickbacks.length}
                    </span>{" "}
                    kickback
                    {selectedKickbacks.length === 1
                      ? ""
                      : "s"}{" "}
                    selected
                  </div>

                  <div className="font-bold text-[#16858C]">
                    -{formatCurrency(
                      totalKickbacks
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedCustomer &&
            !loadingStatement &&
            displayedInvoices.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-charcoal-200 bg-charcoal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-charcoal-900">
                    Statement Summary
                  </div>

                  <div className="mt-1 text-xs text-charcoal-500">
                    {displayedInvoices.length} invoice
                    {displayedInvoices.length === 1
                      ? ""
                      : "s"}{" "}
                    included
                    {selectedKickbacks.length > 0
                      ? ` • ${selectedKickbacks.length} kickback credit${
                          selectedKickbacks.length ===
                          1
                            ? ""
                            : "s"
                        }`
                      : ""}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-charcoal-500">
                      Invoices
                    </div>

                    <div className="text-sm font-semibold text-charcoal-900">
                      {formatCurrency(
                        totalInvoices
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-charcoal-500">
                      Credits
                    </div>

                    <div className="text-sm font-semibold text-[#16858C]">
                      -{formatCurrency(
                        totalKickbacks
                      )}
                    </div>
                  </div>

                  <div className="border-l border-charcoal-200 pl-5">
                    <div className="text-[10px] uppercase tracking-wide text-charcoal-500">
                      Balance Due
                    </div>

                    <div className="text-lg font-bold text-charcoal-900">
                      {formatCurrency(
                        balanceDue
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={finalizeStatement}
                    disabled={
                      savingStatement ||
                      displayedInvoices.length ===
                        0
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1998A1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingStatement ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Finalize & Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
        </div>

        {loadingStatement && (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-16 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-[#20AEB8]" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading customer statement data...
            </span>
          </div>
        )}

        {!loadingStatement && selectedCustomer && (
          <div className="rounded-2xl border border-charcoal-100 bg-charcoal-50 p-4 shadow-sm md:p-8">
            <div className="mx-auto w-full max-w-[794px] bg-white p-[38px] shadow-sm">
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
                        {formatDate(
                          statementDate
                        )}
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

                    <div>062 737 9728</div>

                    <div>
                      ddw.trading@outlook.com
                    </div>
                  </div>
                </div>
              </div>

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

                    <div>062 737 9728</div>

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
                        {
                          selectedCustomer.contact_person
                        }
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
                        {
                          selectedCustomer.physical_address
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#20AEB8]">
                      <th className="w-[30%] px-[5px] py-[7px] text-left text-[7.5px] font-bold text-white">
                        TRANSACTION
                      </th>

                      <th className="w-[23%] px-[5px] py-[7px] text-left text-[7.5px] font-bold text-white">
                        DATE
                      </th>

                      <th className="w-[23%] px-[5px] py-[7px] text-left text-[7.5px] font-bold text-white">
                        TYPE
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
                          key={`preview-invoice-${invoice.id}`}
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
                            INVOICE
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

                    {selectedKickbacks.map(
                      (kickback) => (
                        <tr
                          key={`preview-kickback-${kickback.id}`}
                          className="border-b border-[#E6E6E6] bg-[#20AEB8]/5"
                        >
                          <td className="w-[30%] px-[5px] py-[7px] text-[7.5px] font-medium text-[#16858C]">
                            {kickback.reference ||
                              `Kickback ${kickback.id.slice(
                                0,
                                8
                              )}`}
                          </td>

                          <td className="w-[23%] px-[5px] py-[7px] text-[7.5px] text-[#16858C]">
                            {formatDate(
                              kickback.transaction_date
                            )}
                          </td>

                          <td className="w-[23%] px-[5px] py-[7px] text-[7.5px] font-bold text-[#16858C]">
                            CREDIT
                          </td>

                          <td className="w-[24%] px-[5px] py-[7px] text-right text-[7.5px] font-bold text-[#16858C]">
                            -{formatCurrency(
                              Number(
                                kickback.amount ||
                                  0
                              )
                            )}
                          </td>
                        </tr>
                      )
                    )}

                    {displayedInvoices.length ===
                      0 &&
                      selectedKickbacks.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-2 py-7 text-center text-[7.5px] text-gray-500"
                          >
                            No invoices found for
                            the selected period or
                            invoice range.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              <div className="ml-[58%] mt-[14px] w-[42%]">
                <div className="border-t border-gray-400" />

                <div className="flex justify-between py-[5px]">
                  <span className="text-[8px] font-bold">
                    TOTAL INVOICES
                  </span>

                  <span className="text-[8px] font-bold">
                    {formatCurrency(
                      totalInvoices
                    )}
                  </span>
                </div>

                {totalKickbacks > 0 && (
                  <div className="flex justify-between py-[5px]">
                    <span className="text-[8px] font-bold text-[#16858C]">
                      KICKBACK CREDITS
                    </span>

                    <span className="text-[8px] font-bold text-[#16858C]">
                      -{formatCurrency(
                        totalKickbacks
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b-2 border-[#20AEB8] py-[7px]">
                  <span className="text-[10px] font-bold">
                    BALANCE DUE
                  </span>

                  <span className="text-[11px] font-bold text-[#20AEB8]">
                    {formatCurrency(
                      balanceDue
                    )}
                  </span>
                </div>
              </div>

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

        {!loading &&
          savedStatements.length > 0 && (
            <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-charcoal-900">
                  Saved Statements
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Finalized statements are stored here. If you
                  make a mistake, delete the statement and its
                  kickback credits will become available again.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-500">
                      <th className="px-4 py-3">
                        Statement Date
                      </th>

                      <th className="px-4 py-3">
                        Customer
                      </th>

                      <th className="px-4 py-3 text-right">
                        Invoices
                      </th>

                      <th className="px-4 py-3 text-right">
                        Kickbacks
                      </th>

                      <th className="px-4 py-3 text-right">
                        Balance Due
                      </th>

                      <th className="px-4 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-charcoal-100">
                    {savedStatements.map(
                      (statement) => {
                        const customer =
                          customers.find(
                            (item) =>
                              item.id ===
                              statement.customer_id
                          );

                        return (
                          <tr
                            key={statement.id}
                            className="hover:bg-charcoal-50"
                          >
                            <td className="px-4 py-4 text-sm text-charcoal-700">
                              {formatDate(
                                statement.statement_date
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-charcoal-900">
                                {customer?.company_name ||
                                  "Customer"}
                              </div>

                              <div className="mt-0.5 text-xs text-charcoal-500">
                                {formatDate(
                                  statement.start_date
                                )}{" "}
                                →{" "}
                                {formatDate(
                                  statement.end_date
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-medium text-charcoal-900">
                              {formatCurrency(
                                Number(
                                  statement.total_invoices ||
                                    0
                                )
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-medium text-[#16858C]">
                              {Number(
                                statement.total_kickbacks ||
                                  0
                              ) > 0
                                ? `-${formatCurrency(
                                    Number(
                                      statement.total_kickbacks ||
                                        0
                                    )
                                  )}`
                                : formatCurrency(0)}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-charcoal-900">
                              {formatCurrency(
                                Number(
                                  statement.balance_due ||
                                    0
                                )
                              )}
                            </td>

                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  deleteStatement(
                                    statement
                                  )
                                }
                                disabled={
                                  deletingStatementId ===
                                  statement.id
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingStatementId ===
                                statement.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}

                                {deletingStatementId ===
                                statement.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                Choose a customer above to create a statement
                containing their invoices and optional recycling
                kickback credits.
              </p>
            </div>
          )}
      </div>
    </DashboardShell>
  );
}