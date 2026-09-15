import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export interface DisposalCertificatePDFData {
  referenceNumber: string;
  jobNumber: string;
  jobDate: string;
  jobType: string;
  description: string;
  collectionAddress: string;
  disposalAddress: string;

  companyName: string;
  tradingName: string;
  contactPerson: string;
  customerEmail: string;
  customerPhone: string;

  assignedPerson: string;

  clientName: string;
  clientSignature: string;
  clientSignedAt: string;

  facilityRepresentative: string;
  facilitySignature: string;
  facilitySignedAt: string;

  certificateStatus: string;

  logoDataUrl: string;
}

interface DisposalCertificatePDFProps {
  data: DisposalCertificatePDFData;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 38,
    paddingRight: 38,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    paddingBottom: 12,
    marginBottom: 14,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  logoSection: {
    width: 230,
  },

  companyLegalName: {
    fontSize: 7,
    color: "#555555",
    marginBottom: 5,
  },

  logo: {
    width: 145,
    height: 58,
    objectFit: "contain",
  },

  certificateTitleSection: {
    alignItems: "flex-end",
    width: 220,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 8,
    color: "#555555",
  },

  reference: {
    marginTop: 7,
    fontSize: 9,
    fontWeight: "bold",
    color: "#111111",
  },

  section: {
    marginBottom: 12,
  },

  sectionTitle: {
    backgroundColor: "#222222",
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 7,
  },

  grid: {
    flexDirection: "row",
    gap: 8,
  },

  column: {
    flex: 1,
  },

  infoBox: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    padding: 8,
    minHeight: 52,
  },

  label: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#666666",
    textTransform: "uppercase",
    marginBottom: 3,
  },

  value: {
    fontSize: 8.5,
    color: "#222222",
    lineHeight: 1.35,
  },

  descriptionBox: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    padding: 9,
    minHeight: 62,
  },

  signatureGrid: {
    flexDirection: "row",
    gap: 10,
  },

  signatureColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    padding: 9,
    minHeight: 150,
  },

  signatureArea: {
    height: 62,
    borderBottomWidth: 1,
    borderBottomColor: "#888888",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },

  signatureImage: {
    maxWidth: 180,
    maxHeight: 55,
    objectFit: "contain",
  },

  noSignature: {
    fontSize: 7,
    color: "#888888",
  },

  signatureName: {
    fontSize: 8,
    marginBottom: 3,
  },

  signatureDate: {
    fontSize: 7,
    color: "#555555",
  },

  footer: {
    marginTop: "auto",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerText: {
    fontSize: 7,
    color: "#666666",
  },

  statusCompleted: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#176B35",
  },

  statusPending: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#8A5A00",
  },
});

export function DisposalCertificatePDF({
  data,
}: DisposalCertificatePDFProps) {
  const isCompleted =
    data.certificateStatus === "Completed";

  return (
    <Document
      title={`Certificate of Disposal - ${data.jobNumber}`}
      author="DDW Consolidate Pty (Ltd) t/a SkipCo Solutions"
      subject="Certificate of Disposal"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoSection}>
              <Text style={styles.companyLegalName}>
                DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
              </Text>

              {data.logoDataUrl ? (
                <Image
                  src={data.logoDataUrl}
                  style={styles.logo}
                />
              ) : null}
            </View>

            <View style={styles.certificateTitleSection}>
              <Text style={styles.title}>
                CERTIFICATE OF DISPOSAL
              </Text>

              <Text style={styles.subtitle}>
                Waste Collection &amp; Disposal
              </Text>

              <Text style={styles.reference}>
                Reference: {data.referenceNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* JOB INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            JOB INFORMATION
          </Text>

          <View style={styles.grid}>
            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Job Number
                </Text>

                <Text style={styles.value}>
                  {data.jobNumber}
                </Text>
              </View>
            </View>

            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Job Date
                </Text>

                <Text style={styles.value}>
                  {data.jobDate}
                </Text>
              </View>
            </View>

            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Job Type
                </Text>

                <Text style={styles.value}>
                  {data.jobType}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CUSTOMER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            CUSTOMER
          </Text>

          <View style={styles.grid}>
            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Company
                </Text>

                <Text style={styles.value}>
                  {data.companyName}
                </Text>

                {data.tradingName &&
                  data.tradingName !== "—" && (
                    <Text style={styles.value}>
                      {data.tradingName}
                    </Text>
                  )}
              </View>
            </View>

            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Contact Person
                </Text>

                <Text style={styles.value}>
                  {data.contactPerson}
                </Text>
              </View>
            </View>

            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Contact Details
                </Text>

                <Text style={styles.value}>
                  {data.customerPhone}
                </Text>

                <Text style={styles.value}>
                  {data.customerEmail}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* COLLECTION & DISPOSAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            COLLECTION &amp; DISPOSAL
          </Text>

          <View style={styles.grid}>
            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Collection
                </Text>

                <Text style={styles.value}>
                  {data.collectionAddress}
                </Text>
              </View>
            </View>

            <View style={styles.column}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>
                  Disposal
                </Text>

                <Text style={styles.value}>
                  {data.disposalAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* JOB DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            WASTE / JOB DESCRIPTION
          </Text>

          <View style={styles.descriptionBox}>
            <Text style={styles.value}>
              {data.description}
            </Text>
          </View>
        </View>

        {/* ASSIGNED PERSON */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            COLLECTION / DISPOSAL REPRESENTATIVE
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>
              Assigned To
            </Text>

            <Text style={styles.value}>
              {data.assignedPerson}
            </Text>
          </View>
        </View>

        {/* SIGNATURES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            SIGN-OFF
          </Text>

          <View style={styles.signatureGrid}>
            {/* CLIENT */}
            <View style={styles.signatureColumn}>
              <Text style={styles.label}>
                CLIENT COLLECTION SIGN-OFF
              </Text>

              <Text style={styles.signatureName}>
                Name: {data.clientName}
              </Text>

              <View style={styles.signatureArea}>
                {data.clientSignature ? (
                  <Image
                    src={data.clientSignature}
                    style={styles.signatureImage}
                  />
                ) : (
                  <Text style={styles.noSignature}>
                    Awaiting client signature
                  </Text>
                )}
              </View>

              <Text style={styles.signatureDate}>
                Signed: {data.clientSignedAt}
              </Text>
            </View>

            {/* FACILITY */}
            <View style={styles.signatureColumn}>
              <Text style={styles.label}>
                DISPOSAL FACILITY SIGN-OFF
              </Text>

              <Text style={styles.signatureName}>
                Representative:{" "}
                {data.facilityRepresentative}
              </Text>

              <View style={styles.signatureArea}>
                {data.facilitySignature ? (
                  <Image
                    src={data.facilitySignature}
                    style={styles.signatureImage}
                  />
                ) : (
                  <Text style={styles.noSignature}>
                    Awaiting facility signature
                  </Text>
                )}
              </View>

              <Text style={styles.signatureDate}>
                Signed: {data.facilitySignedAt}
              </Text>
            </View>
          </View>
        </View>

        {/* STATUS */}
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>
              Certificate Status
            </Text>

            <Text
              style={
                isCompleted
                  ? styles.statusCompleted
                  : styles.statusPending
              }
            >
              {data.certificateStatus}
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
          </Text>

          <Text style={styles.footerText}>
            062 737 9728 | ddw.trading@outlook.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}