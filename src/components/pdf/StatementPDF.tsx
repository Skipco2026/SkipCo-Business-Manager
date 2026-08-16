import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface StatementCustomer {
  company_name: string;
  trading_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  physical_address?: string | null;
}

export interface StatementInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total: number;
  status: string;
}

export interface StatementData {
  customer: StatementCustomer;
  invoices: StatementInvoice[];
  fromDate: string;
  toDate: string;
}

interface StatementPDFProps {
  statement: StatementData;
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  page: {
    width: "100%",
    height: "100%",
    paddingTop: 28,
    paddingBottom: 24,
    paddingLeft: 34,
    paddingRight: 34,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  logoArea: {
    width: "55%",
  },

  logo: {
    width: 175,
    height: 94,
    objectFit: "contain",
  },

  statementHeading: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 8,
  },

  statementTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#222222",
    marginBottom: 8,
  },

  statementInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },

  statementInfoLabel: {
    width: 70,
    textAlign: "right",
    color: "#777777",
    fontSize: 8,
    marginRight: 7,
  },

  statementInfoValue: {
    width: 90,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 8,
  },

  cyanLine: {
    height: 3,
    backgroundColor: "#20AEB8",
    marginBottom: 12,
  },

  /* =======================================================
     COMPANY DETAILS
  ======================================================= */

  companyDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
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
    marginBottom: 3,
    color: "#20AEB8",
  },

  smallText: {
    fontSize: 7.5,
    color: "#555555",
    marginBottom: 2,
  },

  /* =======================================================
     CUSTOMER
  ======================================================= */

  customerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingTop: 9,
    paddingBottom: 9,
    marginBottom: 13,
  },

  customerBox: {
    width: "48%",
  },

  customerHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  customerName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },

  /* =======================================================
     TABLE
  ======================================================= */

  table: {
    width: "100%",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#20AEB8",
    paddingTop: 6,
    paddingBottom: 6,
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
    minHeight: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 5,
    paddingRight: 5,
  },

  numberColumn: {
    width: "6%",
  },

  invoiceColumn: {
    width: "23%",
  },

  dateColumn: {
    width: "18%",
  },

  dueDateColumn: {
    width: "18%",
  },

  statusColumn: {
    width: "15%",
  },

  amountColumn: {
    width: "20%",
    textAlign: "right",
  },

  tableText: {
    fontSize: 7.5,
  },

  statusText: {
    fontSize: 7.5,
    textTransform: "capitalize",
  },

  /* =======================================================
     TOTAL
  ======================================================= */

  totalArea: {
    marginTop: 8,
    marginLeft: "58%",
    width: "42%",
  },

  totalLine: {
    borderTopWidth: 1,
    borderTopColor: "#999999",
    marginTop: 3,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#20AEB8",
  },

  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },

  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#20AEB8",
  },

  /* =======================================================
     MESSAGE
  ======================================================= */

  message: {
    marginTop: 14,
  },

  messageHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 3,
    textTransform: "uppercase",
  },

  messageText: {
    fontSize: 7.5,
    color: "#555555",
    lineHeight: 1.25,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    position: "absolute",
    bottom: 18,
    left: 34,
    right: 34,
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
    marginBottom: 1,
  },
});

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

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
   PDF
========================================================= */

export default function StatementPDF({
  statement,
}: StatementPDFProps) {
  const totalInvoiced = statement.invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total || 0),
    0
  );

  return (
    <Document>
      <Page
        size="A4"
        style={styles.page}
        wrap={false}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <View style={styles.logoArea}>

            <Image
              src="/skipco-logo.jpg"
              style={styles.logo}
            />

          </View>

          <View style={styles.statementHeading}>

            <Text style={styles.statementTitle}>
              STATEMENT
            </Text>

            <View style={styles.statementInfoRow}>

              <Text style={styles.statementInfoLabel}>
                Statement Date
              </Text>

              <Text style={styles.statementInfoValue}>
                {formatDate(
                  new Date().toISOString()
                )}
              </Text>

            </View>

            <View style={styles.statementInfoRow}>

              <Text style={styles.statementInfoLabel}>
                From
              </Text>

              <Text style={styles.statementInfoValue}>
                {formatDate(statement.fromDate)}
              </Text>

            </View>

            <View style={styles.statementInfoRow}>

              <Text style={styles.statementInfoLabel}>
                To
              </Text>

              <Text style={styles.statementInfoValue}>
                {formatDate(statement.toDate)}
              </Text>

            </View>

          </View>

        </View>

        <View style={styles.cyanLine} />

        {/* =================================================
            COMPANY DETAILS
        ================================================= */}

        <View style={styles.companyDetails}>

          <View style={styles.companyDetailsLeft}>

            <Text style={styles.companyName}>
              Skip Co Solutions
            </Text>

            <Text style={styles.smallText}>
              Skip Hire & Waste Removal
            </Text>

          </View>

          <View style={styles.companyDetailsRight}>

            <Text style={styles.smallText}>
              Pellesier, Bloemfontein
            </Text>

            <Text style={styles.smallText}>
              062 737 9728
            </Text>

            <Text style={styles.smallText}>
              ddw.trading@outlook.com
            </Text>

          </View>

        </View>

        {/* =================================================
            CUSTOMER
        ================================================= */}

        <View style={styles.customerSection}>

          <View style={styles.customerBox}>

            <Text style={styles.customerHeading}>
              Statement For
            </Text>

            <Text style={styles.customerName}>
              {statement.customer.company_name}
            </Text>

            {statement.customer.trading_name && (
              <Text style={styles.smallText}>
                {statement.customer.trading_name}
              </Text>
            )}

            {statement.customer.contact_person && (
              <Text style={styles.smallText}>
                {statement.customer.contact_person}
              </Text>
            )}

            {statement.customer.phone && (
              <Text style={styles.smallText}>
                {statement.customer.phone}
              </Text>
            )}

            {statement.customer.email && (
              <Text style={styles.smallText}>
                {statement.customer.email}
              </Text>
            )}

            {statement.customer.physical_address && (
              <Text style={styles.smallText}>
                {statement.customer.physical_address}
              </Text>
            )}

          </View>

          <View style={styles.customerBox}>

            <Text style={styles.customerHeading}>
              Statement Period
            </Text>

            <Text style={styles.smallText}>
              From: {formatDate(statement.fromDate)}
            </Text>

            <Text style={styles.smallText}>
              To: {formatDate(statement.toDate)}
            </Text>

            <Text style={styles.smallText}>
              {statement.invoices.length} invoice
              {statement.invoices.length === 1
                ? ""
                : "s"}
            </Text>

          </View>

        </View>

        {/* =================================================
            INVOICE TABLE
        ================================================= */}

        <View style={styles.table}>

          <View style={styles.tableHeader}>

            <Text
              style={[
                styles.tableHeaderText,
                styles.numberColumn,
              ]}
            >
              #
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.invoiceColumn,
              ]}
            >
              INVOICE
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.dateColumn,
              ]}
            >
              DATE
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.dueDateColumn,
              ]}
            >
              DUE DATE
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.statusColumn,
              ]}
            >
              STATUS
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.amountColumn,
              ]}
            >
              AMOUNT
            </Text>

          </View>

          {statement.invoices.map(
            (invoice, index) => (

              <View
                key={
                  invoice.id ??
                  `statement-invoice-${index}`
                }
                style={styles.tableRow}
              >

                <Text
                  style={[
                    styles.tableText,
                    styles.numberColumn,
                  ]}
                >
                  {index + 1}
                </Text>

                <Text
                  style={[
                    styles.tableText,
                    styles.invoiceColumn,
                  ]}
                >
                  {invoice.invoice_number}
                </Text>

                <Text
                  style={[
                    styles.tableText,
                    styles.dateColumn,
                  ]}
                >
                  {formatDate(
                    invoice.invoice_date
                  )}
                </Text>

                <Text
                  style={[
                    styles.tableText,
                    styles.dueDateColumn,
                  ]}
                >
                  {formatDate(
                    invoice.due_date
                  )}
                </Text>

                <Text
                  style={[
                    styles.statusText,
                    styles.statusColumn,
                  ]}
                >
                  {invoice.status}
                </Text>

                <Text
                  style={[
                    styles.tableText,
                    styles.amountColumn,
                  ]}
                >
                  {formatCurrency(
                    invoice.total
                  )}
                </Text>

              </View>
            )
          )}

        </View>

        {/* =================================================
            TOTAL
        ================================================= */}

        <View style={styles.totalArea}>

          <View style={styles.totalLine} />

          <View style={styles.totalRow}>

            <Text style={styles.totalLabel}>
              TOTAL INVOICED
            </Text>

            <Text style={styles.totalValue}>
              {formatCurrency(totalInvoiced)}
            </Text>

          </View>

        </View>

        {/* =================================================
            MESSAGE
        ================================================= */}

        <View style={styles.message}>

          <Text style={styles.messageHeading}>
            Thank You
          </Text>

          <Text style={styles.messageText}>
            Thank you for your business. Please
            arrange payment for the outstanding
            invoices shown on this statement.
          </Text>

        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <View style={styles.footer}>

          <View style={styles.footerLeft}>

            <Text style={styles.footerText}>
              Skip Co Solutions
            </Text>

            <Text style={styles.footerText}>
              Pellesier, Bloemfontein
            </Text>

          </View>

          <View style={styles.footerRight}>

            <Text style={styles.footerText}>
              062 737 9728
            </Text>

            <Text style={styles.footerText}>
              ddw.trading@outlook.com
            </Text>

          </View>

        </View>

      </Page>
    </Document>
  );
}