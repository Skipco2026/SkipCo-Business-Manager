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

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  page: {
    width: "210mm",
    height: "297mm",
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#17202a",
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    height: 48,
    backgroundColor: "#111111",
    paddingHorizontal: 28,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 48,
    height: 28,
    marginRight: 10,
    justifyContent: "center",
  },

  logo: {
    maxWidth: 48,
    maxHeight: 28,
    objectFit: "contain",
  },

  companyBlock: {
    justifyContent: "center",
  },

  companyName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
  },

  companySub: {
    marginTop: 2,
    fontSize: 6.5,
    color: "#bfc7cc",
  },

  contact: {
    marginTop: 2,
    fontSize: 6.5,
    color: "#bfc7cc",
  },

  referenceBlock: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  referenceLabel: {
    fontSize: 6,
    color: "#8b979e",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  referenceNumber: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
  },

  turquoiseLine: {
    height: 4,
    backgroundColor: "#06b6d4",
  },

  /* =======================================================
     MAIN CONTENT
  ======================================================= */

  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 12,
    flex: 1,
  },

  titleArea: {
    alignItems: "center",
    marginBottom: 14,
  },

  titlePill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#111111",
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1.2,
  },

  subtitle: {
    marginTop: 7,
    maxWidth: 470,
    textAlign: "center",
    fontSize: 7.5,
    lineHeight: 11,
    color: "#66727a",
  },

  /* =======================================================
     SECTIONS
  ======================================================= */

  section: {
    marginBottom: 11,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#06b6d4",
    marginRight: 7,
  },

  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111111",
    letterSpacing: 0.7,
  },

  sectionSubtitle: {
    marginLeft: 11,
    fontSize: 6.5,
    color: "#8a959c",
  },

  /* =======================================================
     INFORMATION GRID
  ======================================================= */

  infoBox: {
    borderWidth: 1,
    borderColor: "#dce2e5",
    borderRadius: 7,
    overflow: "hidden",
  },

  infoRow: {
    flexDirection: "row",
    minHeight: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f2",
  },

  infoRowLast: {
    flexDirection: "row",
    minHeight: 25,
  },

  infoCell: {
    flex: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    justifyContent: "center",
  },

  infoCellRight: {
    flex: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#edf0f2",
  },

  label: {
    fontSize: 5.8,
    color: "#8a959c",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  value: {
    fontSize: 7.5,
    color: "#202a30",
    fontWeight: "bold",
  },

  valueNormal: {
    fontSize: 7.2,
    color: "#39454c",
  },

  /* =======================================================
     SIGNATURE AREAS
  ======================================================= */

  signoffGrid: {
    flexDirection: "row",
    gap: 10,
  },

  signoffBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dce2e5",
    borderRadius: 7,
    padding: 9,
    minHeight: 88,
  },

  signoffHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  signoffTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#111111",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  signedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#dcfce7",
  },

  signedBadgeText: {
    fontSize: 5.5,
    fontWeight: "bold",
    color: "#15803d",
  },

  signatureArea: {
    height: 43,
    borderWidth: 1,
    borderColor: "#edf0f2",
    borderRadius: 4,
    backgroundColor: "#fafbfc",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  signature: {
    width: "92%",
    height: 39,
    objectFit: "contain",
  },

  signatureLine: {
    position: "absolute",
    left: 9,
    right: 9,
    bottom: 6,
    height: 0.7,
    backgroundColor: "#9aa5ab",
  },

  signName: {
    marginTop: 5,
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#263238",
  },

  signDate: {
    marginTop: 2,
    fontSize: 5.5,
    color: "#8a959c",
  },

  /* =======================================================
     FINAL STATEMENT
  ======================================================= */

  statement: {
    marginTop: 3,
    padding: 9,
    borderRadius: 7,
    backgroundColor: "#f0fbfd",
    borderWidth: 1,
    borderColor: "#b9edf4",
  },

  statementTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#0e7490",
    marginBottom: 3,
  },

  statementText: {
    fontSize: 6.4,
    lineHeight: 9,
    color: "#3c5962",
  },

  /* =======================================================
     WATERMARK
  ======================================================= */

  watermark: {
    position: "absolute",
    left: 55,
    right: 55,
    top: 390,
    alignItems: "center",
    opacity: 0.035,
  },

  watermarkText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#111111",
    letterSpacing: 2,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    height: 28,
    backgroundColor: "#06b6d4",
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerLeft: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#ffffff",
  },

  footerRight: {
    fontSize: 6,
    color: "#e6fbff",
  },
});

/* =========================================================
   HELPERS
========================================================= */

function display(value: string | null | undefined) {
  if (!value || !value.trim()) {
    return "-";
  }

  return value;
}

/* =========================================================
   PDF COMPONENT
========================================================= */

export default function DisposalCertificatePDF({
  data,
}: {
  data: DisposalCertificatePDFData;
}) {
  return (
    <Document
      title={`Certificate of Disposal - ${data.referenceNumber}`}
      author="Skip Co Solutions"
      subject="Certificate of Disposal"
      creator="Skip Co Business Manager"
    >
      <Page size="A4" style={styles.page}>
        {/* =================================================
            WATERMARK
        ================================================= */}

        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>
            SKIP CO SOLUTIONS
          </Text>
        </View>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              {/* 
                If your logo is stored in /public/skipco-logo.png,
                this will display it automatically.
              */}
              <Image
                src="/skipco-logo.png"
                style={styles.logo}
              />
            </View>

            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>
                DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
              </Text>

              <Text style={styles.companySub}>
                Waste Collection &amp; Disposal Services
              </Text>

              <Text style={styles.contact}>
                Phone:  •  Email:
              </Text>
            </View>
          </View>

          <View style={styles.referenceBlock}>
            <Text style={styles.referenceLabel}>
              Reference Number
            </Text>

            <Text style={styles.referenceNumber}>
              {display(data.referenceNumber)}
            </Text>

            <Text style={styles.referenceLabel}>
              Job {display(data.jobNumber)}
            </Text>
          </View>
        </View>

        <View style={styles.turquoiseLine} />

        {/* =================================================
            MAIN
        ================================================= */}

        <View style={styles.content}>
          {/* TITLE */}

          <View style={styles.titleArea}>
            <View style={styles.titlePill}>
              <Text style={styles.title}>
                CERTIFICATE OF DISPOSAL
              </Text>
            </View>

            <Text style={styles.subtitle}>
              This certificate confirms that the waste described
              below was collected from the stated location and
              received by the disposal facility indicated below.
            </Text>
          </View>

          {/* =================================================
              COLLECTION DETAILS
          ================================================= */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />

              <Text style={styles.sectionTitle}>
                COLLECTION DETAILS
              </Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Customer
                  </Text>

                  <Text style={styles.value}>
                    {display(data.customer)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Job / Reference
                  </Text>

                  <Text style={styles.value}>
                    {display(data.jobNumber)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Collection Date
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.collectionDate)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Collected By
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.collectedBy)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Collection Location
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.collectionLocation)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Waste Type
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.wasteType)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Quantity / Volume
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.quantityVolume)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Packaging / Container
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.packaging)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRowLast}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Condition at Collection
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.conditionAtReceipt)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Client Representative
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.clientName)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =================================================
              CLIENT SIGN-OFF
          ================================================= */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />

              <Text style={styles.sectionTitle}>
                CLIENT COLLECTION SIGN-OFF
              </Text>
            </View>

            <View style={styles.signoffGrid}>
              <View style={styles.signoffBox}>
                <View style={styles.signoffHeader}>
                  <Text style={styles.signoffTitle}>
                    Client Confirmation
                  </Text>

                  <View style={styles.signedBadge}>
                    <Text style={styles.signedBadgeText}>
                      SIGNED
                    </Text>
                  </View>
                </View>

                <View style={styles.signatureArea}>
                  {data.clientSignature ? (
                    <Image
                      src={data.clientSignature}
                      style={styles.signature}
                    />
                  ) : (
                    <Text style={styles.valueNormal}>
                      Signature not available
                    </Text>
                  )}

                  <View style={styles.signatureLine} />
                </View>

                <Text style={styles.signName}>
                  {display(data.clientName)}
                </Text>

                <Text style={styles.signDate}>
                  Signed: {display(data.clientSignedAt)}
                </Text>
              </View>

              <View style={styles.signoffBox}>
                <Text style={styles.signoffTitle}>
                  Collection Confirmation
                </Text>

                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 6.6,
                    lineHeight: 9,
                    color: "#59666d",
                  }}
                >
                  The client confirms that the waste described
                  on this certificate was collected from the
                  stated collection location.
                </Text>

                <Text
                  style={{
                    marginTop: 9,
                    fontSize: 6.2,
                    color: "#8a959c",
                  }}
                >
                  Collected by:
                </Text>

                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 7,
                    fontWeight: "bold",
                    color: "#263238",
                  }}
                >
                  {display(data.collectedBy)}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              DISPOSAL FACILITY
          ================================================= */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />

              <Text style={styles.sectionTitle}>
                DISPOSAL FACILITY
              </Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Disposal Facility
                  </Text>

                  <Text style={styles.value}>
                    {display(data.disposalFacilityName)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Disposal Method
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.disposalMethod)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Facility Address
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.disposalFacilityAddress)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Disposal Date
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.disposalDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRowLast}>
                <View style={styles.infoCell}>
                  <Text style={styles.label}>
                    Facility Representative
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.facilityRepresentative)}
                  </Text>
                </View>

                <View style={styles.infoCellRight}>
                  <Text style={styles.label}>
                    Waste Received
                  </Text>

                  <Text style={styles.valueNormal}>
                    {display(data.quantityVolume)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =================================================
              FACILITY SIGN-OFF
          ================================================= */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />

              <Text style={styles.sectionTitle}>
                DISPOSAL FACILITY SIGN-OFF
              </Text>
            </View>

            <View style={styles.signoffGrid}>
              <View style={styles.signoffBox}>
                <View style={styles.signoffHeader}>
                  <Text style={styles.signoffTitle}>
                    Facility Confirmation
                  </Text>

                  <View style={styles.signedBadge}>
                    <Text style={styles.signedBadgeText}>
                      SIGNED
                    </Text>
                  </View>
                </View>

                <View style={styles.signatureArea}>
                  {data.facilitySignature ? (
                    <Image
                      src={data.facilitySignature}
                      style={styles.signature}
                    />
                  ) : (
                    <Text style={styles.valueNormal}>
                      Signature not available
                    </Text>
                  )}

                  <View style={styles.signatureLine} />
                </View>

                <Text style={styles.signName}>
                  {display(data.facilityRepresentative)}
                </Text>

                <Text style={styles.signDate}>
                  Signed: {display(data.facilitySignedAt)}
                </Text>
              </View>

              <View style={styles.signoffBox}>
                <Text style={styles.signoffTitle}>
                  Disposal Confirmation
                </Text>

                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 6.6,
                    lineHeight: 9,
                    color: "#59666d",
                  }}
                >
                  The disposal facility confirms receipt of
                  the waste described on this certificate for
                  the disposal method stated above.
                </Text>

                <Text
                  style={{
                    marginTop: 9,
                    fontSize: 6.2,
                    color: "#8a959c",
                  }}
                >
                  Facility:
                </Text>

                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 7,
                    fontWeight: "bold",
                    color: "#263238",
                  }}
                >
                  {display(data.disposalFacilityName)}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              FINAL STATEMENT
          ================================================= */}

          <View style={styles.statement}>
            <Text style={styles.statementTitle}>
              FINAL DISPOSAL STATEMENT
            </Text>

            <Text style={styles.statementText}>
              This Certificate of Disposal records the
              collection, receipt and disposal of the waste
              identified above. The certificate has been signed
              by the client representative and the disposal
              facility representative and forms part of the
              Skip Co Solutions job record.
            </Text>
          </View>
        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            SKIP CO SOLUTIONS · WASTE COLLECTION &amp; DISPOSAL
          </Text>

          <Text style={styles.footerRight}>
            {display(data.referenceNumber)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}