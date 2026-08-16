import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface QuoteCustomer {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  physical_address: string;
}

export interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuoteData {
  id?: string;
  quote_number: string;
  quote_date: string;
  valid_until: string;
  subtotal: number;
  total: number;
  status: string;
  notes?: string;
  customer: QuoteCustomer;

  vat_enabled?: boolean;
  vat_rate?: number;
}

interface QuotePDFProps {
  quote: QuoteData;
  items: QuoteItem[];
}

/* =========================================================
   STYLES
   Same layout and sizing as InvoicePDF
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

  quoteHeading: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 8,
  },

  quoteTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#222222",
    marginBottom: 8,
  },

  quoteInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },

  quoteInfoLabel: {
    width: 65,
    textAlign: "right",
    color: "#777777",
    fontSize: 8,
    marginRight: 7,
  },

  quoteInfoValue: {
    width: 75,
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
     CUSTOMER INFORMATION
  ======================================================= */

  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingTop: 9,
    paddingBottom: 9,
    marginBottom: 13,
  },

  partyBox: {
    width: "48%",
  },

  partyHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  partyName: {
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

  descriptionColumn: {
    width: "48%",
  },

  quantityColumn: {
    width: "10%",
    textAlign: "center",
  },

  priceColumn: {
    width: "18%",
    textAlign: "right",
  },

  totalColumn: {
    width: "18%",
    textAlign: "right",
  },

  tableText: {
    fontSize: 7.5,
  },

  /* =======================================================
     TOTALS
  ======================================================= */

  totals: {
    marginTop: 8,
    marginLeft: "58%",
    width: "42%",
  },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 3,
    paddingBottom: 3,
  },

  totalsLabel: {
    fontSize: 8,
    color: "#555555",
  },

  totalsValue: {
    fontSize: 8,
    fontWeight: "bold",
  },

  totalTopLine: {
    borderTopWidth: 1,
    borderTopColor: "#999999",
    marginTop: 3,
  },

  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    paddingBottom: 5,
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

  /* =======================================================
     NOTES
  ======================================================= */

  notes: {
    marginTop: 10,
  },

  sectionHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 3,
    textTransform: "uppercase",
  },

  notesText: {
    fontSize: 7.5,
    color: "#555555",
    lineHeight: 1.25,
  },

  /* =======================================================
     TERMS
  ======================================================= */

  terms: {
    marginTop: 8,
  },

  termText: {
    fontSize: 7,
    color: "#666666",
    lineHeight: 1.25,
    marginBottom: 1,
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

export default function QuotePDF({
  quote,
  items,
}: QuotePDFProps) {
  const vatEnabled = quote.vat_enabled === true;

  const vatRate = Number(quote.vat_rate ?? 15);

  const subtotal = Number(quote.subtotal || 0);

  const vatAmount = vatEnabled
    ? subtotal * (vatRate / 100)
    : 0;

  const calculatedTotal = subtotal + vatAmount;

  const total = vatEnabled
    ? calculatedTotal
    : Number(quote.total || subtotal);

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

          <View style={styles.quoteHeading}>

            <Text style={styles.quoteTitle}>
              QUOTATION
            </Text>

            <View style={styles.quoteInfoRow}>

              <Text style={styles.quoteInfoLabel}>
                Quote No.
              </Text>

              <Text style={styles.quoteInfoValue}>
                {quote.quote_number}
              </Text>

            </View>

            <View style={styles.quoteInfoRow}>

              <Text style={styles.quoteInfoLabel}>
                Quote Date
              </Text>

              <Text style={styles.quoteInfoValue}>
                {formatDate(quote.quote_date)}
              </Text>

            </View>

            <View style={styles.quoteInfoRow}>

              <Text style={styles.quoteInfoLabel}>
                Valid Until
              </Text>

              <Text style={styles.quoteInfoValue}>
                {formatDate(quote.valid_until)}
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
            QUOTE FROM / QUOTE TO
        ================================================= */}

        <View style={styles.parties}>

          <View style={styles.partyBox}>

            <Text style={styles.partyHeading}>
              Quote From
            </Text>

            <Text style={styles.partyName}>
              Skip Co Solutions
            </Text>

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

          <View style={styles.partyBox}>

            <Text style={styles.partyHeading}>
              Quote To
            </Text>

            <Text style={styles.partyName}>
              {quote.customer.company_name}
            </Text>

            {quote.customer.contact_person && (
              <Text style={styles.smallText}>
                {quote.customer.contact_person}
              </Text>
            )}

            {quote.customer.phone && (
              <Text style={styles.smallText}>
                {quote.customer.phone}
              </Text>
            )}

            {quote.customer.email && (
              <Text style={styles.smallText}>
                {quote.customer.email}
              </Text>
            )}

            {quote.customer.physical_address && (
              <Text style={styles.smallText}>
                {quote.customer.physical_address}
              </Text>
            )}

          </View>

        </View>

        {/* =================================================
            ITEMS TABLE
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
                styles.descriptionColumn,
              ]}
            >
              DESCRIPTION
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.quantityColumn,
              ]}
            >
              QTY
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.priceColumn,
              ]}
            >
              UNIT PRICE
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.totalColumn,
              ]}
            >
              TOTAL
            </Text>

          </View>

          {items.map((item, index) => (

            <View
              key={
                item.id ??
                `quote-item-${index}`
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
                  styles.descriptionColumn,
                ]}
              >
                {item.description}
              </Text>

              <Text
                style={[
                  styles.tableText,
                  styles.quantityColumn,
                ]}
              >
                {Number(item.quantity)}
              </Text>

              <Text
                style={[
                  styles.tableText,
                  styles.priceColumn,
                ]}
              >
                {formatCurrency(item.unit_price)}
              </Text>

              <Text
                style={[
                  styles.tableText,
                  styles.totalColumn,
                ]}
              >
                {formatCurrency(item.line_total)}
              </Text>

            </View>

          ))}

        </View>

        {/* =================================================
            TOTALS
        ================================================= */}

        <View style={styles.totals}>

          <View style={styles.totalsRow}>

            <Text style={styles.totalsLabel}>
              Subtotal
            </Text>

            <Text style={styles.totalsValue}>
              {formatCurrency(subtotal)}
            </Text>

          </View>

          {vatEnabled && (

            <View style={styles.totalsRow}>

              <Text style={styles.totalsLabel}>
                VAT ({vatRate.toFixed(2)}%)
              </Text>

              <Text style={styles.totalsValue}>
                {formatCurrency(vatAmount)}
              </Text>

            </View>

          )}

          <View style={styles.totalTopLine} />

          <View style={styles.grandTotalRow}>

            <Text style={styles.grandTotalLabel}>
              TOTAL
            </Text>

            <Text style={styles.grandTotalValue}>
              {formatCurrency(total)}
            </Text>

          </View>

        </View>

        {/* =================================================
            NOTES
        ================================================= */}

        {quote.notes && (

          <View style={styles.notes}>

            <Text style={styles.sectionHeading}>
              Notes
            </Text>

            <Text style={styles.notesText}>
              {quote.notes}
            </Text>

          </View>

        )}

        {/* =================================================
            TERMS & CONDITIONS
        ================================================= */}

        <View style={styles.terms}>

          <Text style={styles.sectionHeading}>
            Terms & Conditions
          </Text>

          <Text style={styles.termText}>
            • This quotation is valid until{" "}
            {formatDate(quote.valid_until)}.
          </Text>

          <Text style={styles.termText}>
            • Prices are subject to change
            after the quotation expiry date.
          </Text>

          <Text style={styles.termText}>
            • Payment terms are as agreed
            with the customer.
          </Text>

          <Text style={styles.termText}>
            • All prices are in ZAR.
          </Text>

          {vatEnabled && (
            <Text style={styles.termText}>
              • VAT is charged at{" "}
              {vatRate.toFixed(2)}%.
            </Text>
          )}

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