"use client";

import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { useMemo } from "react";

export interface KickbackStatementCustomer {
  id: string;
  company_name: string;
  trading_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  physical_address?: string | null;
}

export interface KickbackStatementEntry {
  id: string;
  reference: string;
  transaction_date: string;
  description: string;
  amount: number;
  site?: string | null;
  notes?: string | null;
  vat_enabled: boolean;
  vat_rate: number;
}

interface KickbackStatementProps {
  customer: KickbackStatementCustomer;
  kickbacks: KickbackStatementEntry[];
  fromDate: string;
  toDate: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 45,
    paddingHorizontal: 34,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logoArea: { width: "55%" },
  logo: { width: 175, height: 94, objectFit: "contain" },
  heading: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    letterSpacing: 0.6,
    textAlign: "right",
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.4,
    textAlign: "right",
    marginTop: 2,
    marginBottom: 8,
  },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: {
    width: 70,
    textAlign: "right",
    color: "#777777",
    marginRight: 7,
  },
  infoValue: { width: 90, textAlign: "right", fontWeight: "bold" },
  cyanLine: { height: 3, backgroundColor: "#20AEB8", marginBottom: 12 },
  companyDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  companyLeft: { width: "48%" },
  companyRight: { width: "48%", alignItems: "flex-end" },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 3,
  },
  smallText: { fontSize: 7.5, color: "#555555", marginBottom: 2 },
  customerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    paddingVertical: 9,
    marginBottom: 13,
  },
  customerBox: { width: "48%" },
  sectionHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 5,
  },
  customerName: { fontSize: 10, fontWeight: "bold", marginBottom: 3 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#20AEB8",
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  headerText: { color: "#FFFFFF", fontSize: 7, fontWeight: "bold" },
  tableRow: {
    flexDirection: "row",
    minHeight: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  cell: { fontSize: 7.2 },
  numberCol: { width: "6%" },
  referenceCol: { width: "16%" },
  dateCol: { width: "16%" },
  siteCol: { width: "18%" },
  descriptionCol: { width: "23%" },
  amountCol: { width: "21%", textAlign: "right" },
  totals: { marginTop: 8, marginLeft: "55%", width: "45%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#D9DDE3",
  },
  totalLabel: { fontSize: 8.5 },
  totalValue: { fontSize: 8.5, fontWeight: "bold" },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 7,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#20AEB8",
  },
  grandLabel: { fontSize: 10, fontWeight: "bold" },
  grandValue: { fontSize: 11, fontWeight: "bold", color: "#20AEB8" },
  message: { marginTop: 14 },
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
  footerText: { fontSize: 6.5, color: "#777777", marginBottom: 1 },
});

function money(value: number) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function date(value: string) {
  if (!value) return "-";

  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function KickbackStatementDocument({
  customer,
  kickbacks,
  fromDate,
  toDate,
}: KickbackStatementProps) {
  const totals = useMemo(() => {
    const base = kickbacks.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const vat = kickbacks.reduce(
      (sum, item) =>
        sum +
        (item.vat_enabled
          ? Number(item.amount || 0) *
            (Number(item.vat_rate ?? 15) / 100)
          : 0),
      0
    );

    return { base, vat, total: base + vat };
  }, [kickbacks]);

  return (
    <Document
      title="Kickback Statement"
      author="SkipCo Solutions"
      subject={`Kickback statement for ${customer.company_name}`}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Image src="/skipco-logo.jpg" style={styles.logo} />
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>KICKBACK</Text>
            <Text style={styles.subtitle}>STATEMENTS</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Statement Date</Text>
              <Text style={styles.infoValue}>
                {date(new Date().toISOString())}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>From</Text>
              <Text style={styles.infoValue}>{date(fromDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>To</Text>
              <Text style={styles.infoValue}>{date(toDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cyanLine} />

        <View style={styles.companyDetails}>
          <View style={styles.companyLeft}>
            <Text style={styles.companyName}>Skip Co Solutions</Text>
            <Text style={styles.smallText}>
              Skip Hire &amp; Waste Removal
            </Text>
          </View>

          <View style={styles.companyRight}>
            <Text style={styles.smallText}>Pellesier, Bloemfontein</Text>
            <Text style={styles.smallText}>062 737 9728</Text>
            <Text style={styles.smallText}>
              ddw.trading@outlook.com
            </Text>
          </View>
        </View>

        <View style={styles.customerSection}>
          <View style={styles.customerBox}>
            <Text style={styles.sectionHeading}>STATEMENT FOR</Text>
            <Text style={styles.customerName}>
              {customer.company_name}
            </Text>

            {customer.trading_name ? (
              <Text style={styles.smallText}>
                {customer.trading_name}
              </Text>
            ) : null}

            {customer.contact_person ? (
              <Text style={styles.smallText}>
                {customer.contact_person}
              </Text>
            ) : null}

            {customer.phone ? (
              <Text style={styles.smallText}>{customer.phone}</Text>
            ) : null}

            {customer.email ? (
              <Text style={styles.smallText}>{customer.email}</Text>
            ) : null}

            {customer.physical_address ? (
              <Text style={styles.smallText}>
                {customer.physical_address}
              </Text>
            ) : null}
          </View>

          <View style={styles.customerBox}>
            <Text style={styles.sectionHeading}>STATEMENT PERIOD</Text>
            <Text style={styles.smallText}>
              From: {date(fromDate)}
            </Text>
            <Text style={styles.smallText}>
              To: {date(toDate)}
            </Text>
            <Text style={styles.smallText}>
              {kickbacks.length} kickback
              {kickbacks.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.numberCol]}>#</Text>
            <Text style={[styles.headerText, styles.referenceCol]}>
              REFERENCE
            </Text>
            <Text style={[styles.headerText, styles.dateCol]}>DATE</Text>
            <Text style={[styles.headerText, styles.siteCol]}>SITE</Text>
            <Text style={[styles.headerText, styles.descriptionCol]}>
              DESCRIPTION
            </Text>
            <Text style={[styles.headerText, styles.amountCol]}>
              AMOUNT
            </Text>
          </View>

          {kickbacks.map((item, index) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, styles.numberCol]}>
                {index + 1}
              </Text>
              <Text style={[styles.cell, styles.referenceCol]}>
                {item.reference}
              </Text>
              <Text style={[styles.cell, styles.dateCol]}>
                {date(item.transaction_date)}
              </Text>
              <Text style={[styles.cell, styles.siteCol]}>
                {item.site || "-"}
              </Text>
              <Text style={[styles.cell, styles.descriptionCol]}>
                {item.description}
              </Text>
              <Text style={[styles.cell, styles.amountCol]}>
                {money(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Base Amount</Text>
            <Text style={styles.totalValue}>
              {money(totals.base)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT</Text>
            <Text style={styles.totalValue}>
              {money(totals.vat)}
            </Text>
          </View>

          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>TOTAL KICKBACKS</Text>
            <Text style={styles.grandValue}>
              {money(totals.total)}
            </Text>
          </View>
        </View>

        <View style={styles.message}>
          <Text style={styles.sectionHeading}>KICKBACK RECORD</Text>
          <Text style={styles.smallText}>
            This document records kickback transactions for the selected
            customer and period. It is a standalone record and does not
            change invoice balances or invoice statement allocations.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerText}>Skip Co Solutions</Text>
            <Text style={styles.footerText}>
              Pellesier, Bloemfontein
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.footerText}>062 737 9728</Text>
            <Text style={styles.footerText}>
              ddw.trading@outlook.com
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default function KickbackStatementPDFDownloadButton(
  props: KickbackStatementProps
) {
  const filename = `Kickback-Statement-${props.customer.company_name
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")}.pdf`;

  return (
    <PDFDownloadLink
      document={<KickbackStatementDocument {...props} />}
      fileName={filename}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: "#0891b2",
        color: "#ffffff",
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {({ loading }) =>
        loading ? "Preparing PDF..." : "Download Kickback Statement PDF"
      }
    </PDFDownloadLink>
  );
}