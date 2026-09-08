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
  site?: string | null;
  vat_enabled?: boolean;
  vat_rate?: number;
}

interface QuotePDFProps {
  quote: QuoteData;
  items: QuoteItem[];
}

const styles = StyleSheet.create({
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

  quoteHeading: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 10,
  },

  quoteTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#222222",
    marginBottom: 10,
  },

  quoteInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
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
    marginBottom: 14,
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

  siteSection: {
    borderBottomWidth: 1,
    borderBottomColor: "#D9DDE3",
    paddingBottom: 12,
    marginBottom: 18,
  },

  siteHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  siteName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#222222",
    lineHeight: 1.3,
  },

  siteEmpty: {
    fontSize: 8,
    color: "#999999",
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

  totals: {
    marginTop: 14,
    marginLeft: "58%",
    width: "42%",
  },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
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

  notes: {
    marginTop: 18,
  },

  sectionHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  notesText: {
    fontSize: 7.5,
    color: "#555555",
    lineHeight: 1.25,
  },

  terms: {
    marginTop: 18,
  },

  termText: {
    fontSize: 7,
    color: "#666666",
    lineHeight: 1.3,
    marginBottom: 2,
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

  /*
   * SITE AUTOMATICALLY COMES FROM THE QUOTE.
   *
   * First choice:
   * A specific site saved on the quote.
   *
   * Second choice:
   * The customer's physical address.
   *
   * Third choice:
   * No site specified.
   */
  const siteValue =
    quote.site?.trim() ||
    quote.customer.physical_address?.trim() ||
    "";

  return (
    <Document>
      <Page
        size="A4"
        orientation="portrait"
        style={styles.page}
        wrap
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Text style={styles.registeredName}>
              DDW Consolidate t/a SkipCo Solutions
            </Text>

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

        {/* COMPANY DETAILS */}

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

        {/* QUOTE FROM / QUOTE TO */}

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

        {/* SITE */}

        <View style={styles.siteSection}>
          <Text style={styles.siteHeading}>
            Site
          </Text>

          {siteValue ? (
            <Text style={styles.siteName}>
              {siteValue}
            </Text>
          ) : (
            <Text style={styles.siteEmpty}>
              No site specified
            </Text>
          )}
        </View>

        {/* ITEMS TABLE */}

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

        {/* TOTALS */}

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

        {/* NOTES */}

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

        {/* TERMS */}

        <View style={styles.terms}>
          <Text style={styles.sectionHeading}>
            Terms & Conditions
          </Text>

          <Text style={styles.termText}>
            • This quotation is valid until{" "}
            {formatDate(quote.valid_until)}.
          </Text>

          <Text style={styles.termText}>
            • Prices are subject to change after
            the quotation expiry date.
          </Text>

          <Text style={styles.termText}>
            • Payment terms are as agreed with
            the customer.
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

        {/* FOOTER */}

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