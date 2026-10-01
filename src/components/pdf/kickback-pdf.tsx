import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface KickbackPDFItem {
  id?: string;
  description?: string | null;
  rate_per_kg?: number | null;
  quantity_kg?: number | null;
  line_total?: number | null;
}

export interface KickbackPDFCustomer {
  name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface KickbackPDFJob {
  job_number?: string | null;

  // These remain part of the data so the page can still
  // pass them through, but they are intentionally NOT
  // displayed anywhere in the PDF.
  job_type?: string | null;
  description?: string | null;
}

export interface KickbackPDFData {
  id?: string;
  reference?: string | null;
  transaction_date?: string | null;
  description?: string | null;
  amount?: number | null;
  notes?: string | null;

  vat_enabled?: boolean | null;
  vat_rate?: number | null;

  customer?: KickbackPDFCustomer | null;
  job?: KickbackPDFJob | null;

  items?: KickbackPDFItem[];
}

interface KickbackPDFProps {
  kickback: KickbackPDFData;
}

const TEAL = "#20AEB8";

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222222",
  },

  /* =========================
     HEADER
  ========================= */

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

  companyDetails: {
    marginTop: 4,
    fontSize: 7.5,
    lineHeight: 1.4,
    color: "#555555",
  },

  headingArea: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 10,
  },

  documentTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#222222",
    marginBottom: 10,
  },

  referenceText: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 3,
  },

  dateText: {
    fontSize: 8,
    color: "#666666",
  },

  tealLine: {
    height: 3,
    backgroundColor: TEAL,
    marginBottom: 18,
  },

  /* =========================
     INFORMATION BOXES
  ========================= */

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  infoBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
    padding: 10,
  },

  infoTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: TEAL,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  customerName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.45,
  },

  detailRow: {
    flexDirection: "row",
    marginBottom: 3,
  },

  detailLabel: {
    width: 75,
    fontSize: 7.5,
    color: "#777777",
  },

  detailValue: {
    flex: 1,
    fontSize: 8,
    color: "#333333",
  },

  /* =========================
     DESCRIPTION
  ========================= */

  descriptionSection: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
    padding: 10,
  },

  descriptionHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: TEAL,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  descriptionText: {
    fontSize: 8.5,
    color: "#444444",
    lineHeight: 1.45,
  },

  /* =========================
     TABLE
  ========================= */

  table: {
    width: "100%",
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 3,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingVertical: 7,
    paddingHorizontal: 6,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 7,
    paddingHorizontal: 6,
  },

  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 6,
  },

  colNumber: {
    width: "7%",
    fontSize: 7.5,
  },

  colDescription: {
    width: "43%",
    fontSize: 7.5,
  },

  colQuantity: {
    width: "16%",
    textAlign: "right",
    fontSize: 7.5,
  },

  colRate: {
    width: "17%",
    textAlign: "right",
    fontSize: 7.5,
  },

  colTotal: {
    width: "17%",
    textAlign: "right",
    fontSize: 7.5,
  },

  headerText: {
    fontWeight: "bold",
    color: "#444444",
    fontSize: 7,
  },

  cellText: {
    fontSize: 7.5,
    color: "#444444",
  },

  /* =========================
     TOTALS
  ========================= */

  totalsContainer: {
    marginTop: 12,
    marginLeft: "55%",
    width: "45%",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  totalLabel: {
    fontSize: 8,
    color: "#555555",
  },

  totalValue: {
    fontSize: 8,
    color: "#333333",
  },

  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: TEAL,
    marginTop: 5,
    paddingTop: 7,
  },

  grandTotalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#222222",
  },

  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: TEAL,
  },

  /* =========================
     NOTES
  ========================= */

  notesSection: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
    padding: 10,
  },

  notesHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: TEAL,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  notesText: {
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.45,
  },

  /* =========================
     FOOTER
  ========================= */

  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerText: {
    fontSize: 6.5,
    color: "#777777",
  },

  pageNumber: {
    fontSize: 6.5,
    color: "#777777",
  },
});

function formatCurrency(value: number) {
  return `R ${value.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";

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

export default function KickbackPDF({
  kickback,
}: KickbackPDFProps) {
  const items = kickback.items || [];

  const baseAmount = Number(kickback.amount || 0);

  const vatEnabled = Boolean(kickback.vat_enabled);

  const vatRate =
    kickback.vat_rate == null
      ? 15
      : Number(kickback.vat_rate);

  const vatAmount = vatEnabled
    ? baseAmount * (vatRate / 100)
    : 0;

  const totalAmount = baseAmount + vatAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Text style={styles.registeredName}>
              DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
            </Text>

            <Image
              src="/skipco-logo.jpg"
              style={styles.logo}
            />

            <Text style={styles.companyDetails}>
              Skip Co Solutions
            </Text>

            <Text style={styles.companyDetails}>
              Skip Hire &amp; Waste Removal
            </Text>

            <Text style={styles.companyDetails}>
              Pellesier, Bloemfontein
            </Text>

            <Text style={styles.companyDetails}>
              062 737 9728
            </Text>

            <Text style={styles.companyDetails}>
              ddw.trading@outlook.com
            </Text>
          </View>

          <View style={styles.headingArea}>
            <Text style={styles.documentTitle}>
              KICKBACK
            </Text>

            <Text style={styles.documentTitle}>
              REPORT
            </Text>

            {kickback.reference && (
              <Text style={styles.referenceText}>
                {kickback.reference}
              </Text>
            )}

            {kickback.transaction_date && (
              <Text style={styles.dateText}>
                {formatDate(kickback.transaction_date)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tealLine} />

        {/* =========================
            CUSTOMER / JOB DETAILS
            IMPORTANT:
            Job Type and Job Description
            are intentionally NOT shown.
        ========================= */}

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Customer
            </Text>

            {kickback.customer?.company_name ? (
              <Text style={styles.customerName}>
                {kickback.customer.company_name}
              </Text>
            ) : kickback.customer?.name ? (
              <Text style={styles.customerName}>
                {kickback.customer.name}
              </Text>
            ) : (
              <Text style={styles.infoText}>
                No customer specified
              </Text>
            )}

            {kickback.customer?.company_name &&
              kickback.customer?.name && (
                <Text style={styles.infoText}>
                  {kickback.customer.name}
                </Text>
              )}

            {kickback.customer?.phone && (
              <Text style={styles.infoText}>
                {kickback.customer.phone}
              </Text>
            )}

            {kickback.customer?.email && (
              <Text style={styles.infoText}>
                {kickback.customer.email}
              </Text>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Job Details
            </Text>

            {/* ONLY JOB NUMBER IS DISPLAYED */}
            {kickback.job?.job_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Job Number
                </Text>

                <Text style={styles.detailValue}>
                  {kickback.job.job_number}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* =========================
            KICKBACK DESCRIPTION
            This is the kickback transaction
            description, NOT the job description.
        ========================= */}

        {kickback.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionHeading}>
              Description
            </Text>

            <Text style={styles.descriptionText}>
              {kickback.description}
            </Text>
          </View>
        )}

        {/* =========================
            ITEMS TABLE
        ========================= */}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.colNumber,
                styles.headerText,
              ]}
            >
              #
            </Text>

            <Text
              style={[
                styles.colDescription,
                styles.headerText,
              ]}
            >
              DESCRIPTION
            </Text>

            <Text
              style={[
                styles.colQuantity,
                styles.headerText,
              ]}
            >
              QTY KG
            </Text>

            <Text
              style={[
                styles.colRate,
                styles.headerText,
              ]}
            >
              RATE / KG
            </Text>

            <Text
              style={[
                styles.colTotal,
                styles.headerText,
              ]}
            >
              TOTAL
            </Text>
          </View>

          {items.length > 0 ? (
            items.map((item, index) => {
              const quantity = Number(
                item.quantity_kg || 0
              );

              const rate = Number(
                item.rate_per_kg || 0
              );

              const lineTotal =
                item.line_total != null
                  ? Number(item.line_total)
                  : quantity * rate;

              const isLast =
                index === items.length - 1;

              return (
                <View
                  key={
                    item.id ||
                    `${index}-${item.description || "item"}`
                  }
                  style={
                    isLast
                      ? styles.tableRowLast
                      : styles.tableRow
                  }
                >
                  <Text style={styles.colNumber}>
                    {index + 1}
                  </Text>

                  <Text style={styles.colDescription}>
                    {item.description || "Kickback"}
                  </Text>

                  <Text style={styles.colQuantity}>
                    {quantity.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>

                  <Text style={styles.colRate}>
                    {formatCurrency(rate)}
                  </Text>

                  <Text style={styles.colTotal}>
                    {formatCurrency(lineTotal)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.tableRowLast}>
              <Text style={styles.colNumber}>1</Text>

              <Text style={styles.colDescription}>
                Kickback
              </Text>

              <Text style={styles.colQuantity}>
                -
              </Text>

              <Text style={styles.colRate}>
                -
              </Text>

              <Text style={styles.colTotal}>
                {formatCurrency(baseAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* =========================
            TOTALS
        ========================= */}

        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Subtotal
            </Text>

            <Text style={styles.totalValue}>
              {formatCurrency(baseAmount)}
            </Text>
          </View>

          {vatEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                VAT ({vatRate.toFixed(2)}%)
              </Text>

              <Text style={styles.totalValue}>
                {formatCurrency(vatAmount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>
              TOTAL
            </Text>

            <Text style={styles.grandTotalValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        {/* =========================
            NOTES
        ========================= */}

        {kickback.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesHeading}>
              Notes
            </Text>

            <Text style={styles.notesText}>
              {kickback.notes}
            </Text>
          </View>
        )}

        {/* =========================
            FOOTER
        ========================= */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
          </Text>

          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}