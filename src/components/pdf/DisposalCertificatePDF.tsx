import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
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
    width: "100%",
    height: "100%",
    paddingTop: 32,
    paddingBottom: 44,
    paddingLeft: 38,
    paddingRight: 38,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
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

  certificateHeading: {
    width: "40%",
    alignItems: "flex-end",
    paddingTop: 10,
  },

  certificateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.8,
    color: "#222222",
    marginBottom: 10,
    textAlign: "right",
  },

  referenceRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  referenceLabel: {
    width: 72,
    textAlign: "right",
    color: "#777777",
    fontSize: 7.5,
    marginRight: 7,
  },

  referenceValue: {
    width: 95,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 7.5,
  },

  cyanLine: {
    height: 3,
    backgroundColor: "#20AEB8",
    marginBottom: 16,
  },

  /* =====================================================
     INTRODUCTION
  ===================================================== */

  introduction: {
    marginBottom: 16,
  },

  introductionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  introductionText: {
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.35,
  },

  /* =====================================================
     SECTIONS
  ===================================================== */

  section: {
    marginBottom: 14,
  },

  sectionHeading: {
    backgroundColor: "#20AEB8",
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    textTransform: "uppercase",
  },

  sectionBody: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DDE3",
    padding: 9,
  },

  /* =====================================================
     DETAIL GRID
  ===================================================== */

  detailRow: {
    flexDirection: "row",
    marginBottom: 7,
  },

  detailRowLast: {
    flexDirection: "row",
  },

  detailColumn: {
    width: "50%",
    paddingRight: 8,
  },

  detailColumnRight: {
    width: "50%",
    paddingLeft: 8,
  },

  detailLabel: {
    fontSize: 6.5,
    color: "#777777",
    marginBottom: 2,
    textTransform: "uppercase",
  },

  detailValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#222222",
    lineHeight: 1.25,
  },

  detailValueNormal: {
    fontSize: 8,
    color: "#333333",
    lineHeight: 1.25,
  },

  /* =====================================================
     SIGNATURES
  ===================================================== */

  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  signatureBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#D9DDE3",
    minHeight: 92,
    padding: 8,
  },

  signatureHeading: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#20AEB8",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  signatureImageContainer: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },

  signatureImage: {
    maxWidth: 180,
    maxHeight: 45,
    objectFit: "contain",
  },

  noSignature: {
    fontSize: 7,
    color: "#999999",
  },

  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#999999",
    paddingTop: 4,
  },

  signatureName: {
    fontSize: 7,
    fontWeight: "bold",
  },

  signatureDate: {
    fontSize: 6.5,
    color: "#777777",
    marginTop: 2,
  },

  /* =====================================================
     FINAL CONFIRMATION
  ===================================================== */

  confirmation: {
    borderWidth: 1,
    borderColor: "#20AEB8",
    backgroundColor: "#F2FCFD",
    padding: 10,
    marginTop: 2,
  },

  confirmationTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#20AEB8",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  confirmationText: {
    fontSize: 7.5,
    color: "#444444",
    lineHeight: 1.3,
  },

  /* =====================================================
     FOOTER
  ===================================================== */

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

  watermark: {
    position: "absolute",
    bottom: 55,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 5.5,
    color: "#BBBBBB",
  },
});

/* =====================================================
   HELPERS
===================================================== */

function displayValue(value: string | null | undefined) {
  return value?.trim() || "-";
}

/* =====================================================
   DISPOSAL CERTIFICATE PDF
===================================================== */

export default function DisposalCertificatePDF({
  data,
}: DisposalCertificatePDFProps) {
  return (
    <Document>
      <Page
        size="A4"
        orientation="portrait"
        style={styles.page}
        wrap
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View style={styles.logoArea}>
            {/* SMALL LEGAL NAME ABOVE LOGO — SAME AS INVOICE */}
            <Text style={styles.registeredName}>
              DDW Consolidate t/a SkipCo Solutions
            </Text>

            {/* SAME LOGO AS INVOICE */}
            <Image
              src="/skipco-logo.jpg"
              style={styles.logo}
            />
          </View>

          <View style={styles.certificateHeading}>
            <Text style={styles.certificateTitle}>
              CERTIFICATE OF DISPOSAL
            </Text>

            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>
                Reference No.
              </Text>

              <Text style={styles.referenceValue}>
                {displayValue(data.referenceNumber)}
              </Text>
            </View>

            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>
                Job No.
              </Text>

              <Text style={styles.referenceValue}>
                {displayValue(data.jobNumber)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cyanLine} />

        {/* =================================================
            CERTIFICATION STATEMENT
        ================================================= */}

        <View style={styles.introduction}>
          <Text style={styles.introductionTitle}>
            Waste Collection & Disposal Record
          </Text>

          <Text style={styles.introductionText}>
            This certificate confirms that the waste/material described
            below was collected and received for disposal at the
            designated disposal facility. The information recorded
            represents the collection and disposal details confirmed
            by the relevant parties.
          </Text>
        </View>

        {/* =================================================
            COLLECTION DETAILS
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            1. Collection Details
          </Text>

          <View style={styles.sectionBody}>
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Customer
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.customer)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Collected By
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.collectedBy)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Collection Date
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.collectionDate)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Collection Location
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.collectionLocation)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Job Type
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.jobType)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Job Description
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.jobDescription)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRowLast}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Client Name
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.clientName)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Client Sign-Off Date
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.clientSignedAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            WASTE DETAILS
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            Waste Details
          </Text>

          <View style={styles.sectionBody}>
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Waste Type
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.wasteType)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Quantity / Volume
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.quantityVolume)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Packaging
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.packaging)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Condition at Receipt
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.conditionAtReceipt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            CLIENT SIGN-OFF
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            Client Collection Sign-Off
          </Text>

          <View style={styles.sectionBody}>
            <View style={styles.signatureSection}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureHeading}>
                  Client Signature
                </Text>

                <View style={styles.signatureImageContainer}>
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

                <View style={styles.signatureLine}>
                  <Text style={styles.signatureName}>
                    {displayValue(data.clientName)}
                  </Text>

                  <Text style={styles.signatureDate}>
                    Signed: {displayValue(data.clientSignedAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.signatureBox}>
                <Text style={styles.signatureHeading}>
                  Collection Confirmation
                </Text>

                <Text style={styles.confirmationText}>
                  I confirm that the waste/material described on
                  this certificate was collected from the stated
                  collection location.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            DISPOSAL FACILITY
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            2. Disposal Facility
          </Text>

          <View style={styles.sectionBody}>
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Disposal Facility
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.disposalFacilityName)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Disposal Date
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.disposalDate)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Facility Address
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.disposalFacilityAddress)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Disposal Method
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.disposalMethod)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRowLast}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>
                  Facility Representative
                </Text>

                <Text style={styles.detailValue}>
                  {displayValue(data.facilityRepresentative)}
                </Text>
              </View>

              <View style={styles.detailColumnRight}>
                <Text style={styles.detailLabel}>
                  Facility Sign-Off Date
                </Text>

                <Text style={styles.detailValueNormal}>
                  {displayValue(data.facilitySignedAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            FACILITY SIGN-OFF
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            Disposal Facility Sign-Off
          </Text>

          <View style={styles.sectionBody}>
            <View style={styles.signatureSection}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureHeading}>
                  Facility Representative Signature
                </Text>

                <View style={styles.signatureImageContainer}>
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

                <View style={styles.signatureLine}>
                  <Text style={styles.signatureName}>
                    {displayValue(data.facilityRepresentative)}
                  </Text>

                  <Text style={styles.signatureDate}>
                    Signed: {displayValue(data.facilitySignedAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.signatureBox}>
                <Text style={styles.signatureHeading}>
                  Disposal Confirmation
                </Text>

                <Text style={styles.confirmationText}>
                  The disposal facility representative confirms
                  receipt and processing of the waste/material
                  described in this certificate according to the
                  disposal method recorded above.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            FINAL CONFIRMATION
        ================================================= */}

        <View style={styles.confirmation}>
          <Text style={styles.confirmationTitle}>
            Final Disposal Confirmation
          </Text>

          <Text style={styles.confirmationText}>
            This Certificate of Disposal forms part of the official
            waste collection and disposal record for the above job.
            The certificate should be retained together with the
            relevant job and disposal documentation.
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

        <Text style={styles.watermark}>
          DDW Consolidate Pty (Ltd) t/a SkipCo Solutions
        </Text>
      </Page>
    </Document>
  );
}