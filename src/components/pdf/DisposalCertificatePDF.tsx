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
  customer: string;
  collectedBy: string;
  collectionDate: string;
  collectionLocation: string;

  jobType: string;
  jobDescription: string;

  wasteType: string;
  quantityVolume: string;
  packaging: string;
  conditionAtReceipt: string;

  clientName: string;
  clientSignature: string;
  clientSignedAt: string;

  disposalMethod: string;
  disposalFacilityName: string;
  disposalFacilityAddress: string;
  disposalDate: string;

  facilityRepresentative: string;
  facilitySignature: string;
  facilitySignedAt: string;
}

interface DisposalCertificatePDFProps {
  data: DisposalCertificatePDFData;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 30,
    paddingLeft: 32,
    paddingRight: 32,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#202020",
  },

  header: {
    backgroundColor: "#111111",
    borderRadius: 8,
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 17,
    paddingRight: 17,
    position: "relative",
  },

  accentBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: "#16b8c4",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoArea: {
    width: 245,
  },

  logo: {
    width: 135,
    height: 52,
    objectFit: "contain",
  },

  legalName: {
    color: "#d7d7d7",
    fontSize: 6.8,
    marginTop: 4,
  },

  referenceArea: {
    width: 190,
    alignItems: "flex-end",
  },

  referenceLabel: {
    color: "#16b8c4",
    fontSize: 6.5,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },

  referenceNumber: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: "bold",
    marginTop: 3,
  },

  jobNumber: {
    color: "#bdbdbd",
    fontSize: 6.8,
    marginTop: 3,
  },

  titleArea: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  titlePill: {
    borderWidth: 1.4,
    borderColor: "#16b8c4",
    borderRadius: 16,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 20,
    paddingRight: 20,
  },

  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
    letterSpacing: 0.8,
  },

  subtitle: {
    fontSize: 7.5,
    color: "#666666",
    marginTop: 4,
  },

  statement: {
    fontSize: 6.8,
    color: "#666666",
    lineHeight: 1.35,
    textAlign: "center",
    marginTop: 5,
    paddingLeft: 15,
    paddingRight: 15,
  },

  section: {
    marginTop: 8,
  },

  sectionHeader: {
    backgroundColor: "#111111",
    borderRadius: 4,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 0.6,
  },

  sectionAccent: {
    color: "#16b8c4",
    fontSize: 6.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  row: {
    flexDirection: "row",
    marginTop: 4,
  },

  fieldHalfLeft: {
    width: "50%",
    paddingRight: 2.5,
  },

  fieldHalfRight: {
    width: "50%",
    paddingLeft: 2.5,
  },

  fieldThirdLeft: {
    width: "33.333%",
    paddingRight: 3,
  },

  fieldThirdMiddle: {
    width: "33.333%",
    paddingLeft: 1.5,
    paddingRight: 1.5,
  },

  fieldThirdRight: {
    width: "33.333%",
    paddingLeft: 3,
  },

  fieldFull: {
    width: "100%",
  },

  fieldBox: {
    borderWidth: 0.7,
    borderColor: "#d8d8d8",
    borderRadius: 3,
    backgroundColor: "#fafafa",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 6,
    paddingRight: 6,
    minHeight: 31,
  },

  fieldLabel: {
    fontSize: 5.8,
    fontWeight: "bold",
    color: "#777777",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  fieldValue: {
    fontSize: 7.3,
    color: "#222222",
    lineHeight: 1.25,
  },

  descriptionBox: {
    borderWidth: 0.7,
    borderColor: "#d8d8d8",
    borderRadius: 3,
    backgroundColor: "#fafafa",
    padding: 7,
    marginTop: 4,
    minHeight: 45,
  },

  descriptionText: {
    fontSize: 7.3,
    color: "#222222",
    lineHeight: 1.35,
  },

  signatureRow: {
    flexDirection: "row",
    marginTop: 5,
  },

  signatureLeft: {
    width: "50%",
    paddingRight: 2.5,
  },

  signatureRight: {
    width: "50%",
    paddingLeft: 2.5,
  },

  signatureCard: {
    borderWidth: 0.7,
    borderColor: "#d8d8d8",
    borderRadius: 4,
    backgroundColor: "#fafafa",
    padding: 7,
    minHeight: 92,
  },

  signatureTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 3,
  },

  signatureName: {
    fontSize: 6.6,
    color: "#555555",
    marginBottom: 3,
  },

  signatureArea: {
    height: 43,
    backgroundColor: "#ffffff",
    borderWidth: 0.5,
    borderColor: "#eeeeee",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },

  signatureImage: {
    width: 120,
    height: 38,
    objectFit: "contain",
  },

  noSignature: {
    fontSize: 6.2,
    color: "#999999",
  },

  signedAt: {
    fontSize: 5.8,
    color: "#777777",
    marginTop: 3,
  },

  confirmation: {
    marginTop: 7,
    borderLeftWidth: 3,
    borderLeftColor: "#16b8c4",
    backgroundColor: "#f3fbfc",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },

  confirmationTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 2,
  },

  confirmationText: {
    fontSize: 6.2,
    color: "#555555",
    lineHeight: 1.3,
  },

  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 9,
    height: 17,
    backgroundColor: "#111111",
    borderRadius: 3,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerText: {
    color: "#ffffff",
    fontSize: 5.6,
  },

  footerAccent: {
    color: "#16b8c4",
    fontSize: 5.6,
    fontWeight: "bold",
  },
});

export function DisposalCertificatePDF({
  data,
}: DisposalCertificatePDFProps) {
  const logoSource =
    "https://skip-co-business-manager.vercel.app/skipco-logo.jpg";

  return (
    <Document
      title={`Certificate of Disposal - ${data.referenceNumber}`}
      author="DDW Consolidate Pty (Ltd) t/a SkipCo Solutions"
      subject="Certificate of Disposal"
    >
      <Page
        size="A4"
        orientation="portrait"
        style={styles.page}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoArea}>
              <Image
                src={logoSource}
                style={styles.logo}
              />

              <Text style={styles.legalName}>
                DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
              </Text>
            </View>

            <View style={styles.referenceArea}>
              <Text style={styles.referenceLabel}>
                CERTIFICATE REFERENCE
              </Text>

              <Text style={styles.referenceNumber}>
                {data.referenceNumber}
              </Text>

              <Text style={styles.jobNumber}>
                Job: {data.jobNumber}
              </Text>
            </View>
          </View>

          <View style={styles.accentBar} />
        </View>

        {/* TITLE */}
        <View style={styles.titleArea}>
          <View style={styles.titlePill}>
            <Text style={styles.title}>
              CERTIFICATE OF DISPOSAL
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Waste Collection &amp; Disposal Record
          </Text>

          <Text style={styles.statement}>
            This certificate records the collection and disposal
            of the waste associated with the job identified above.
          </Text>
        </View>

        {/* 1. WASTE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              1. WASTE
            </Text>

            <Text style={styles.sectionAccent}>
              WASTE DETAILS
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldThirdLeft}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Waste Type
                </Text>

                <Text style={styles.fieldValue}>
                  {data.wasteType}
                </Text>
              </View>
            </View>

            <View style={styles.fieldThirdMiddle}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Quantity / Volume
                </Text>

                <Text style={styles.fieldValue}>
                  {data.quantityVolume}
                </Text>
              </View>
            </View>

            <View style={styles.fieldThirdRight}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Packaging / Container
                </Text>

                <Text style={styles.fieldValue}>
                  {data.packaging}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldHalfLeft}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Condition at Receipt
                </Text>

                <Text style={styles.fieldValue}>
                  {data.conditionAtReceipt}
                </Text>
              </View>
            </View>

            <View style={styles.fieldHalfRight}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Job Type
                </Text>

                <Text style={styles.fieldValue}>
                  {data.jobType}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionBox}>
            <Text style={styles.fieldLabel}>
              Job Description
            </Text>

            <Text style={styles.descriptionText}>
              {data.jobDescription}
            </Text>
          </View>
        </View>

        {/* 2. COLLECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              2. COLLECTION
            </Text>

            <Text style={styles.sectionAccent}>
              COLLECTION DETAILS
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldHalfLeft}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Customer
                </Text>

                <Text style={styles.fieldValue}>
                  {data.customer}
                </Text>
              </View>
            </View>

            <View style={styles.fieldHalfRight}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Collected By
                </Text>

                <Text style={styles.fieldValue}>
                  {data.collectedBy}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldThirdLeft}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Collection Date
                </Text>

                <Text style={styles.fieldValue}>
                  {data.collectionDate}
                </Text>
              </View>
            </View>

            <View style={styles.fieldThirdMiddle}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Job Type
                </Text>

                <Text style={styles.fieldValue}>
                  {data.jobType}
                </Text>
              </View>
            </View>

            <View style={styles.fieldThirdRight}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Collection Location
                </Text>

                <Text style={styles.fieldValue}>
                  {data.collectionLocation}
                </Text>
              </View>
            </View>
          </View>

          {/* CLIENT SIGNATURE DIRECTLY UNDER COLLECTION */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureLeft}>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureTitle}>
                  CLIENT COLLECTION SIGN-OFF
                </Text>

                <Text style={styles.signatureName}>
                  Client: {data.clientName}
                </Text>

                <View style={styles.signatureArea}>
                  {data.clientSignature ? (
                    <Image
                      src={data.clientSignature}
                      style={styles.signatureImage}
                    />
                  ) : (
                    <Text style={styles.noSignature}>
                      No signature recorded
                    </Text>
                  )}
                </View>

                <Text style={styles.signedAt}>
                  Signed: {data.clientSignedAt}
                </Text>
              </View>
            </View>

            <View style={styles.signatureRight}>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureTitle}>
                  COLLECTION RECORD
                </Text>

                <Text style={styles.signatureName}>
                  Collected by: {data.collectedBy}
                </Text>

                <Text style={styles.signedAt}>
                  Date: {data.collectionDate}
                </Text>

                <Text style={styles.signedAt}>
                  Location: {data.collectionLocation}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. DISPOSAL FACILITY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              3. DISPOSAL FACILITY
            </Text>

            <Text style={styles.sectionAccent}>
              DISPOSAL DETAILS
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldHalfLeft}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Disposal Facility
                </Text>

                <Text style={styles.fieldValue}>
                  {data.disposalFacilityName}
                </Text>
              </View>
            </View>

            <View style={styles.fieldHalfRight}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Disposal Date
                </Text>

                <Text style={styles.fieldValue}>
                  {data.disposalDate}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldHalfLeft}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Facility Address
                </Text>

                <Text style={styles.fieldValue}>
                  {data.disposalFacilityAddress}
                </Text>
              </View>
            </View>

            <View style={styles.fieldHalfRight}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Disposal Method
                </Text>

                <Text style={styles.fieldValue}>
                  {data.disposalMethod}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldFull}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>
                  Facility Representative
                </Text>

                <Text style={styles.fieldValue}>
                  {data.facilityRepresentative}
                </Text>
              </View>
            </View>
          </View>

          {/* FACILITY SIGNATURE DIRECTLY UNDER DISPOSAL DETAILS */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureLeft}>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureTitle}>
                  DISPOSAL FACILITY SIGN-OFF
                </Text>

                <Text style={styles.signatureName}>
                  Representative: {data.facilityRepresentative}
                </Text>

                <View style={styles.signatureArea}>
                  {data.facilitySignature ? (
                    <Image
                      src={data.facilitySignature}
                      style={styles.signatureImage}
                    />
                  ) : (
                    <Text style={styles.noSignature}>
                      No signature recorded
                    </Text>
                  )}
                </View>

                <Text style={styles.signedAt}>
                  Signed: {data.facilitySignedAt}
                </Text>
              </View>
            </View>

            <View style={styles.signatureRight}>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureTitle}>
                  DISPOSAL RECORD
                </Text>

                <Text style={styles.signatureName}>
                  Facility: {data.disposalFacilityName}
                </Text>

                <Text style={styles.signedAt}>
                  Date: {data.disposalDate}
                </Text>

                <Text style={styles.signedAt}>
                  Method: {data.disposalMethod}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CONFIRMATION */}
        <View style={styles.confirmation}>
          <Text style={styles.confirmationTitle}>
            FINAL DISPOSAL CONFIRMATION
          </Text>

          <Text style={styles.confirmationText}>
            SkipCo Solutions confirms that the above collection
            and disposal details have been recorded against the
            stated job and that the required client and disposal
            facility sign-offs have been completed.
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
          </Text>

          <Text style={styles.footerAccent}>
            CERTIFICATE OF DISPOSAL • {data.referenceNumber}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
