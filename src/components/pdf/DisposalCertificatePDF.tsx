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
    width: "210mm",
    height: "297mm",
    paddingTop: 16,
    paddingBottom: 48,
    paddingLeft: 26,
    paddingRight: 26,
    fontFamily: "Helvetica",
    color: "#202020",
    backgroundColor: "#ffffff",
    position: "relative",
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    height: 72,
    backgroundColor: "#202020",
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 9,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#16b8c4",
  },

  brandBlock: {
    justifyContent: "center",
  },

  brandSmall: {
    fontSize: 8,
    color: "#ffffff",
    marginBottom: 2,
  },

  brandMain: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#ffffff",
    lineHeight: 0.95,
    letterSpacing: 0.6,
  },

  brandAccent: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#16b8c4",
    marginTop: 3,
    letterSpacing: 1.3,
  },

  headerRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerCompanyDetails: {
    fontSize: 6.5,
    color: "#dddddd",
    marginBottom: 1,
  },

  referenceBox: {
    marginTop: 5,
    minWidth: 115,
    borderWidth: 1,
    borderColor: "#555555",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: "flex-end",
  },

  referenceLabel: {
    fontSize: 5.2,
    color: "#aaaaaa",
    letterSpacing: 0.5,
    marginBottom: 1,
  },

  referenceValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
  },

  /* =========================
     TITLE
  ========================= */

  titleSection: {
    height: 86,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
    textAlign: "center",
  },

  titleAccent: {
    color: "#16b8c4",
  },

  /* =========================
     SECTIONS
  ========================= */

  section: {
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#d5d5d5",
  },

  sectionHeader: {
    height: 20,
    backgroundColor: "#202020",
    paddingLeft: 9,
    paddingRight: 9,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#16b8c4",
  },

  sectionHeaderText: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.7,
  },

  sectionBody: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 5,
    paddingRight: 5,
  },

  /* =========================
     ROWS / FIELDS
  ========================= */

  row: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 4,
  },

  rowLast: {
    flexDirection: "row",
    gap: 5,
  },

  field: {
    flex: 1,
    minHeight: 30,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    paddingTop: 4,
    paddingBottom: 3,
    paddingLeft: 7,
    paddingRight: 7,
  },

  fieldWide: {
    flex: 2,
    minHeight: 30,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    paddingTop: 4,
    paddingBottom: 3,
    paddingLeft: 7,
    paddingRight: 7,
  },

  fieldLabel: {
    fontSize: 5.3,
    color: "#777777",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.25,
  },

  fieldValue: {
    fontSize: 7,
    color: "#222222",
    lineHeight: 1.1,
  },

  description: {
    minHeight: 35,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 7,
    paddingRight: 7,
    marginBottom: 4,
  },

  descriptionText: {
    fontSize: 7,
    color: "#222222",
    lineHeight: 1.15,
  },

  /* =========================
     SIGNATURE
  ========================= */

  signatureCard: {
    height: 74,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#d5d5d5",
    backgroundColor: "#ffffff",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
  },

  signatureTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 3,
  },

  signatureArea: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#777777",
    justifyContent: "flex-end",
    paddingBottom: 2,
  },

  signatureImage: {
    width: 165,
    height: 26,
    objectFit: "contain",
    objectPosition: "left",
  },

  noSignature: {
    fontSize: 6,
    color: "#999999",
    marginBottom: 4,
  },

  signatureDetails: {
    flexDirection: "row",
    gap: 8,
    marginTop: 3,
  },

  signatureDetail: {
    flex: 1,
  },

  signatureDetailLabel: {
    fontSize: 5,
    color: "#777777",
    textTransform: "uppercase",
    marginBottom: 1,
  },

  signatureDetailValue: {
    fontSize: 6.5,
    color: "#222222",
  },

  /* =========================
     CONFIRMATION
  ========================= */

  confirmation: {
    marginTop: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#16b8c4",
    backgroundColor: "#f3fbfc",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
  },

  confirmationTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 2,
  },

  confirmationText: {
    fontSize: 6,
    color: "#555555",
    lineHeight: 1.15,
  },

  /* =========================
     FOOTER
  ========================= */

  footer: {
    position: "absolute",
    left: 26,
    right: 26,
    bottom: 12,
    height: 25,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#16b8c4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerText: {
    fontSize: 5.5,
    color: "#777777",
  },

  footerBrand: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#16b8c4",
  },
});

function displayValue(value: string | null | undefined): string {
  if (!value || value.trim() === "") {
    return "—";
  }

  return value;
}

interface FieldProps {
  label: string;
  value: string | null | undefined;
  wide?: boolean;
}

function Field({
  label,
  value,
  wide = false,
}: FieldProps) {
  return (
    <View style={wide ? styles.fieldWide : styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Text style={styles.fieldValue}>
        {displayValue(value)}
      </Text>
    </View>
  );
}

interface SignatureCardProps {
  title: string;
  name: string;
  signature: string;
  signedAt: string;
}

function SignatureCard({
  title,
  name,
  signature,
  signedAt,
}: SignatureCardProps) {
  const hasSignature =
    Boolean(signature) && signature.trim().length > 0;

  return (
    <View style={styles.signatureCard}>
      <Text style={styles.signatureTitle}>
        {title}
      </Text>

      <View style={styles.signatureArea}>
        {hasSignature ? (
          <Image
            src={signature}
            style={styles.signatureImage}
          />
        ) : (
          <Text style={styles.noSignature}>
            Signature not provided
          </Text>
        )}
      </View>

      <View style={styles.signatureDetails}>
        <View style={styles.signatureDetail}>
          <Text style={styles.signatureDetailLabel}>
            Name
          </Text>

          <Text style={styles.signatureDetailValue}>
            {displayValue(name)}
          </Text>
        </View>

        <View style={styles.signatureDetail}>
          <Text style={styles.signatureDetailLabel}>
            Signed At
          </Text>

          <Text style={styles.signatureDetailValue}>
            {displayValue(signedAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function DisposalCertificatePDF({
  data,
}: DisposalCertificatePDFProps) {
  return (
    <Document>
      <Page
        size="A4"
        orientation="portrait"
        style={styles.page}
      >
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandSmall}>
              DDW Consolidate Pty (Ltd) t/a
            </Text>

            <Text style={styles.brandMain}>
              SKIP CO
            </Text>

            <Text style={styles.brandAccent}>
              SOLUTIONS
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.headerCompanyDetails}>
              062 737 9728
            </Text>

            <Text style={styles.headerCompanyDetails}>
              ddw.trading@outlook.com
            </Text>

            <Text style={styles.headerCompanyDetails}>
              Pellesier, Bloemfontein
            </Text>

            <View style={styles.referenceBox}>
              <Text style={styles.referenceLabel}>
                CERTIFICATE REFERENCE
              </Text>

              <Text style={styles.referenceValue}>
                {displayValue(data.referenceNumber)}
              </Text>
            </View>
          </View>
        </View>

        {/* =========================
            LARGE CENTRED TITLE
        ========================= */}

        <View style={styles.titleSection}>
          <Text style={styles.title}>
            CERTIFICATE OF{" "}
            <Text style={styles.titleAccent}>
              DISPOSAL
            </Text>
          </Text>
        </View>

        {/* =========================
            1. COLLECTION
        ========================= */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              1. COLLECTION
            </Text>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <Field
                label="Customer"
                value={data.customer}
                wide
              />

              <Field
                label="Collection Date"
                value={data.collectionDate}
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Collection Location"
                value={data.collectionLocation}
                wide
              />

              <Field
                label="Collected By"
                value={data.collectedBy}
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Job Type"
                value={data.jobType}
              />

              <Field
                label="Job Number"
                value={data.jobNumber}
              />

              <Field
                label="Waste Type"
                value={data.wasteType}
              />
            </View>

            <View style={styles.description}>
              <Text style={styles.fieldLabel}>
                JOB DESCRIPTION
              </Text>

              <Text style={styles.descriptionText}>
                {displayValue(data.jobDescription)}
              </Text>
            </View>

            <SignatureCard
              title="Client / Customer Confirmation"
              name={data.clientName}
              signature={data.clientSignature}
              signedAt={data.clientSignedAt}
            />
          </View>
        </View>

        {/* =========================
            2. DISPOSAL
        ========================= */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              2. DISPOSAL
            </Text>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <Field
                label="Quantity / Volume"
                value={data.quantityVolume}
                wide
              />

              <Field
                label="Packaging"
                value={data.packaging}
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Condition at Receipt"
                value={data.conditionAtReceipt}
              />

              <Field
                label="Disposal Method"
                value={data.disposalMethod}
                wide
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Disposal Facility"
                value={data.disposalFacilityName}
                wide
              />

              <Field
                label="Disposal Date"
                value={data.disposalDate}
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Facility Representative"
                value={data.facilityRepresentative}
                wide
              />

              <Field
                label="Facility Address"
                value={data.disposalFacilityAddress}
                wide
              />
            </View>

            <SignatureCard
              title="Disposal Facility Representative"
              name={data.facilityRepresentative}
              signature={data.facilitySignature}
              signedAt={data.facilitySignedAt}
            />

            <View style={styles.confirmation}>
              <Text style={styles.confirmationTitle}>
                DISPOSAL CONFIRMATION
              </Text>

              <Text style={styles.confirmationText}>
                This certificate confirms that the waste
                described above was collected and delivered
                for disposal at the facility and on the date
                recorded in this certificate.
              </Text>
            </View>
          </View>
        </View>

        {/* =========================
            FOOTER — FIXED TO A4 BOTTOM
        ========================= */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Certificate Reference:{" "}
            {displayValue(data.referenceNumber)}
          </Text>

          <Text style={styles.footerBrand}>
            SkipCo Solutions
          </Text>
        </View>
      </Page>
    </Document>
  );
}