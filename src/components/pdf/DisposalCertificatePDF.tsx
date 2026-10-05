import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

/* =======================================================
   DATA TYPE
======================================================= */

export interface DisposalCertificatePDFData {
  referenceNumber: string;
  jobNumber: string;
  orderNumber: string;

  customer: string;
  collectedBy: string;
  collectionDate: string;

  collectionSites: string[];
  wasteTypes: string[];
  packagings: string[];

  quantityVolume: string;

  jobType: string;
  jobDescription: string;

  clientName: string;
  clientSignature: string;
  clientSignedAt: string;

  disposalFacilities: {
    name: string;
    address: string;
  }[];

  disposalMethods: string[];
  disposalDate: string;

  facilityRepresentative: string;
  facilitySignature: string;
  facilitySignedAt: string;
}

interface DisposalCertificatePDFProps {
  data: DisposalCertificatePDFData;
}

/* =======================================================
   HELPERS
======================================================= */

function displayValue(
  value: string | null | undefined
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const text = String(value).trim();

  return text || "—";
}

/*
 * Converts:
 * 2026-09-15
 * 2026-09-15T00:00:00+00:00
 *
 * to:
 * 15/09/2026
 */

function formatDateOnly(
  value: string | null | undefined
): string {
  if (!value) return "—";

  const raw = String(value).trim();

  if (!raw) return "—";

  const isoMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return `${day}/${month}/${year}`;
  }

  const slashMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
  );

  if (slashMatch) {
    const [, day, month, year] = slashMatch;

    return `${day.padStart(
      2,
      "0"
    )}/${month.padStart(
      2,
      "0"
    )}/${year}`;
  }

  return raw.split("T")[0];
}

/*
 * Signed-at values already come from
 * the certificate page formatted as:
 *
 * 15/09/2026, 12:34
 *
 * This helper also safely handles
 * ISO values if one is ever supplied.
 */

function formatSignedAt(
  value: string | null | undefined
): string {
  if (!value) return "—";

  const raw = String(value).trim();

  if (!raw) return "—";

  if (
    raw.includes("/") &&
    raw.includes(":")
  ) {
    return raw;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year = date.getFullYear();

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

/* =======================================================
   SMALL FIELD
======================================================= */

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <Text style={styles.fieldValue}>
        {displayValue(value)}
      </Text>
    </View>
  );
}

/* =======================================================
   LIST FIELD
======================================================= */

function ListField({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  const cleanValues = values
    .map((value) => value?.trim())
    .filter(Boolean);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      {cleanValues.length === 0 ? (
        <Text style={styles.fieldValue}>
          —
        </Text>
      ) : (
        <View>
          {cleanValues.map(
            (value, index) => (
              <View
                key={`${value}-${index}`}
                style={styles.listRow}
              >
                <Text
                  style={styles.listBullet}
                >
                  •
                </Text>

                <Text
                  style={styles.listText}
                >
                  {value}
                </Text>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
}

/* =======================================================
   FACILITY FIELD
======================================================= */

function FacilityField({
  facilities,
}: {
  facilities: {
    name: string;
    address: string;
  }[];
}) {
  const cleanFacilities =
    facilities.filter(
      (facility) =>
        facility.name?.trim() ||
        facility.address?.trim()
    );

  return (
    <View style={styles.facilityField}>
      <Text style={styles.fieldLabel}>
        Disposal Facility
      </Text>

      <Text style={styles.fieldHint}>
        Facility used for disposal
      </Text>

      {cleanFacilities.length === 0 ? (
        <Text style={styles.fieldValue}>
          —
        </Text>
      ) : (
        cleanFacilities.map(
          (facility, index) => {
            const name =
              facility.name?.trim() || "—";

            const address =
              facility.address?.trim() || "";

            const showAddress =
              address &&
              address.toLowerCase() !==
                name.toLowerCase();

            return (
              <View
                key={`${name}-${index}`}
                style={
                  styles.facilityItem
                }
              >
                <Text
                  style={
                    styles.facilityName
                  }
                >
                  {name}
                </Text>

                {showAddress && (
                  <Text
                    style={
                      styles.facilityAddress
                    }
                  >
                    {address}
                  </Text>
                )}
              </View>
            );
          }
        )
      )}
    </View>
  );
}

/* =======================================================
   SIGNATURE CARD
======================================================= */

function SignatureCard({
  title,
  description,
  name,
  signature,
  signedAt,
}: {
  title: string;
  description: string;
  name: string;
  signature: string;
  signedAt: string;
}) {
  return (
    <View style={styles.signatureCard}>
      <View
        style={
          styles.signatureHeader
        }
      >
        <View>
          <Text
            style={
              styles.signatureTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.signatureDescription
            }
          >
            {description}
          </Text>
        </View>

        <View
          style={
            styles.signedBadge
          }
        >
          <Text
            style={
              styles.signedBadgeText
            }
          >
            SIGNED
          </Text>
        </View>
      </View>

      <View
        style={
          styles.signatureContent
        }
      >
        <View
          style={
            styles.signaturePerson
          }
        >
          <Text
            style={
              styles.smallLabel
            }
          >
            SIGN-OFF PERSON
          </Text>

          <Text
            style={
              styles.personName
            }
          >
            {displayValue(name)}
          </Text>

          <Text
            style={
              styles.signedAtLabel
            }
          >
            SIGNED AT
          </Text>

          <Text
            style={
              styles.signedAtValue
            }
          >
            {formatSignedAt(
              signedAt
            )}
          </Text>
        </View>

        <View
          style={
            styles.signatureImageBox
          }
        >
          <Text
            style={
              styles.smallLabel
            }
          >
            SIGNATURE
          </Text>

          {signature ? (
            <Image
              src={signature}
              style={
                styles.signatureImage
              }
            />
          ) : (
            <Text
              style={
                styles.noSignature
              }
            >
              No signature
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

/* =======================================================
   STYLES
======================================================= */

const styles = StyleSheet.create({
  page: {
    width: "100%",
    height: "100%",
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 30,
    paddingRight: 30,
    fontFamily: "Helvetica",
    color: "#202020",
    backgroundColor: "#ffffff",
    position: "relative",
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    backgroundColor: "#111111",
    paddingTop: 15,
    paddingBottom: 14,
    paddingLeft: 18,
    paddingRight: 18,
    borderBottomWidth: 3,
    borderBottomColor: "#16b8c4",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  brandBlock: {
    width: "55%",
  },

  legalName: {
    fontSize: 6.5,
    color: "#ffffff",
    fontWeight: "normal",
    marginBottom: 2,
  },

  brandName: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 1.2,
    lineHeight: 1,
  },

  brandSolutions: {
    marginTop: 3,
    fontSize: 10,
    color: "#16b8c4",
    fontWeight: "bold",
    letterSpacing: 2.2,
  },

  brandSubtext: {
    marginTop: 5,
    fontSize: 6.5,
    color: "#bdbdbd",
  },

  referenceBlock: {
    width: "38%",
    alignItems: "flex-end",
  },

  referenceItem: {
    marginBottom: 5,
    alignItems: "flex-end",
  },

  referenceLabel: {
    fontSize: 5.5,
    color: "#16b8c4",
    fontWeight: "bold",
    letterSpacing: 0.8,
  },

  referenceValue: {
    marginTop: 1.5,
    fontSize: 8,
    color: "#ffffff",
    fontWeight: "bold",
    maxWidth: 150,
    textAlign: "right",
  },

  /* =====================================================
     TITLE
  ===================================================== */

  titleArea: {
    alignItems: "center",
    paddingTop: 11,
    paddingBottom: 10,
  },

  titlePill: {
    borderWidth: 1.5,
    borderColor: "#16b8c4",
    borderRadius: 18,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 18,
    paddingRight: 18,
  },

  title: {
    fontSize: 13,
    color: "#202020",
    fontWeight: "bold",
    letterSpacing: 0.7,
  },

  titleSubtitle: {
    marginTop: 4,
    fontSize: 7,
    color: "#777777",
  },

  titleDescription: {
    marginTop: 3,
    fontSize: 6.5,
    color: "#777777",
    textAlign: "center",
  },

  /* =====================================================
     SECTION
  ===================================================== */

  section: {
    marginBottom: 9,
    borderWidth: 0.7,
    borderColor: "#dddddd",
    borderRadius: 7,
    overflow: "hidden",
  },

  sectionHeader: {
    backgroundColor: "#111111",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#16b8c4",
  },

  sectionTitle: {
    fontSize: 7.5,
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 0.8,
  },

  sectionTag: {
    fontSize: 5.5,
    color: "#16b8c4",
    fontWeight: "bold",
    letterSpacing: 0.8,
  },

  sectionBody: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 9,
    paddingRight: 9,
  },

  /* =====================================================
     FIELD GRID
  ===================================================== */

  twoColumn: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 7,
  },

  halfColumn: {
    width: "50%",
  },

  field: {
    borderWidth: 0.7,
    borderColor: "#dddddd",
    borderRadius: 5,
    backgroundColor: "#f8f8f8",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 7,
    paddingRight: 7,
    marginBottom: 6,
  },

  fieldLabel: {
    fontSize: 5.5,
    color: "#777777",
    fontWeight: "bold",
    letterSpacing: 0.45,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  fieldHint: {
    fontSize: 5.2,
    color: "#999999",
    marginBottom: 3,
  },

  fieldValue: {
    fontSize: 7.2,
    color: "#303030",
    lineHeight: 1.2,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 1.5,
  },

  listBullet: {
    width: 8,
    fontSize: 7,
    color: "#16b8c4",
    fontWeight: "bold",
  },

  listText: {
    flex: 1,
    fontSize: 7,
    color: "#303030",
    lineHeight: 1.15,
  },

  /* =====================================================
     FACILITY
  ===================================================== */

  facilityField: {
    borderWidth: 0.7,
    borderColor: "#dddddd",
    borderRadius: 5,
    backgroundColor: "#f8f8f8",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 7,
    paddingRight: 7,
    marginBottom: 6,
  },

  facilityItem: {
    borderWidth: 0.5,
    borderColor: "#e2e2e2",
    backgroundColor: "#ffffff",
    borderRadius: 4,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    marginTop: 3,
  },

  facilityName: {
    fontSize: 7,
    color: "#303030",
    fontWeight: "bold",
  },

  facilityAddress: {
    marginTop: 1.5,
    fontSize: 6.3,
    color: "#666666",
    lineHeight: 1.15,
  },

  /* =====================================================
     SIGNATURE
  ===================================================== */

  signatureSection: {
    marginTop: 2,
    paddingTop: 7,
    borderTopWidth: 0.7,
    borderTopColor: "#dddddd",
  },

  signatureSectionTitle: {
    fontSize: 7.2,
    color: "#202020",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  signatureSectionDescription: {
    marginTop: 2,
    fontSize: 5.5,
    color: "#777777",
  },

  signatureCard: {
    marginTop: 5,
    borderWidth: 0.7,
    borderColor: "#dddddd",
    borderRadius: 5,
    backgroundColor: "#ffffff",
    padding: 6,
  },

  signatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },

  signatureTitle: {
    fontSize: 6.8,
    color: "#202020",
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  signatureDescription: {
    marginTop: 1.5,
    fontSize: 5.2,
    color: "#888888",
  },

  signedBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingTop: 2.5,
    paddingBottom: 2.5,
    paddingLeft: 6,
    paddingRight: 6,
  },

  signedBadgeText: {
    fontSize: 5,
    color: "#15803d",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  signatureContent: {
    flexDirection: "row",
    gap: 7,
  },

  signaturePerson: {
    width: "42%",
    borderWidth: 0.5,
    borderColor: "#e1e1e1",
    borderRadius: 4,
    backgroundColor: "#f8f8f8",
    padding: 6,
  },

  signatureImageBox: {
    width: "58%",
    borderWidth: 0.5,
    borderColor: "#e1e1e1",
    borderRadius: 4,
    backgroundColor: "#f8f8f8",
    padding: 6,
  },

  smallLabel: {
    fontSize: 4.8,
    color: "#888888",
    fontWeight: "bold",
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  personName: {
    fontSize: 7.2,
    color: "#222222",
    fontWeight: "bold",
  },

  signedAtLabel: {
    marginTop: 6,
    fontSize: 4.8,
    color: "#888888",
    fontWeight: "bold",
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  signedAtValue: {
    fontSize: 6.3,
    color: "#444444",
  },

  signatureImage: {
    width: 145,
    height: 38,
    objectFit: "contain",
    marginTop: 1,
  },

  noSignature: {
    fontSize: 6,
    color: "#999999",
    marginTop: 12,
  },

  /* =====================================================
     DISPOSAL CONFIRMATION
  ===================================================== */

  confirmation: {
    marginTop: 7,
    borderWidth: 0.7,
    borderColor: "#b7e7eb",
    borderRadius: 5,
    backgroundColor: "#f0fbfc",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },

  confirmationTitle: {
    fontSize: 6.5,
    color: "#087b84",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  confirmationText: {
    marginTop: 2,
    fontSize: 5.8,
    color: "#4d6668",
    lineHeight: 1.25,
  },

  /* =====================================================
     FOOTER
  ===================================================== */

  footer: {
    position: "absolute",
    left: 30,
    right: 30,
    bottom: 10,
    borderTopWidth: 0.7,
    borderTopColor: "#dddddd",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerLeft: {
    fontSize: 5.3,
    color: "#777777",
  },

  footerBrand: {
    fontSize: 5.5,
    color: "#555555",
    fontWeight: "bold",
  },

  footerReference: {
    fontSize: 5.3,
    color: "#777777",
    textAlign: "right",
  },
});

/* =======================================================
   PDF COMPONENT
======================================================= */

export function DisposalCertificatePDF({
  data,
}: DisposalCertificatePDFProps) {
  const collectionSites =
    Array.isArray(
      data.collectionSites
    )
      ? data.collectionSites
      : [];

  const wasteTypes =
    Array.isArray(
      data.wasteTypes
    )
      ? data.wasteTypes
      : [];

  const packagings =
    Array.isArray(
      data.packagings
    )
      ? data.packagings
      : [];

  const disposalMethods =
    Array.isArray(
      data.disposalMethods
    )
      ? data.disposalMethods
      : [];

  const disposalFacilities =
    Array.isArray(
      data.disposalFacilities
    )
      ? data.disposalFacilities
      : [];

  return (
    <Document
      title="Certificate of Disposal"
      author="SkipCo Solutions"
      subject="Certificate of Disposal"
    >
      <Page
        size="A4"
        orientation="portrait"
        style={styles.page}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View
            style={styles.headerRow}
          >
            {/* BRAND */}

            <View
              style={styles.brandBlock}
            >
              <Text
                style={
                  styles.legalName
                }
              >
                DDW Consolidate Pty (Ltd){" "}
                t/a
              </Text>

              <Text
                style={
                  styles.brandName
                }
              >
                SKIP CO
              </Text>

              <Text
                style={
                  styles.brandSolutions
                }
              >
                SOLUTIONS
              </Text>

              <Text
                style={
                  styles.brandSubtext
                }
              >
                Waste Collection & Disposal
              </Text>
            </View>

            {/* REFERENCES */}

            <View
              style={
                styles.referenceBlock
              }
            >
              <View
                style={
                  styles.referenceItem
                }
              >
                <Text
                  style={
                    styles.referenceLabel
                  }
                >
                  JOB NO.
                </Text>

                <Text
                  style={
                    styles.referenceValue
                  }
                >
                  {displayValue(
                    data.jobNumber
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.referenceItem
                }
              >
                <Text
                  style={
                    styles.referenceLabel
                  }
                >
                  ORDER NO.
                </Text>

                <Text
                  style={
                    styles.referenceValue
                  }
                >
                  {displayValue(
                    data.orderNumber
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.referenceItem,
                  {
                    marginBottom: 0,
                  },
                ]}
              >
                <Text
                  style={
                    styles.referenceLabel
                  }
                >
                  CERTIFICATE REF.
                </Text>

                <Text
                  style={
                    styles.referenceValue
                  }
                >
                  {displayValue(
                    data.referenceNumber
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            TITLE
        ================================================= */}

        <View
          style={styles.titleArea}
        >
          <View
            style={styles.titlePill}
          >
            <Text
              style={styles.title}
            >
              CERTIFICATE OF DISPOSAL
            </Text>
          </View>

          <Text
            style={styles.titleSubtitle}
          >
            Waste Collection & Disposal Record
          </Text>

          <Text
            style={
              styles.titleDescription
            }
          >
            This certificate records the
            collection and disposal of waste
            associated with the job shown above.
          </Text>
        </View>

        {/* =================================================
            COLLECTION
        ================================================= */}

        <View
          style={styles.section}
        >
          <View
            style={styles.sectionHeader}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              1. COLLECTION
            </Text>

            <Text
              style={styles.sectionTag}
            >
              COLLECTION
            </Text>
          </View>

          <View
            style={styles.sectionBody}
          >
            {/* CUSTOMER / DATE */}

            <View
              style={styles.twoColumn}
            >
              <View
                style={
                  styles.halfColumn
                }
              >
                <Field
                  label="Customer"
                  value={data.customer}
                />
              </View>

              <View
                style={
                  styles.halfColumn
                }
              >
                <Field
                  label="Collection Date"
                  value={formatDateOnly(
                    data.collectionDate
                  )}
                />
              </View>
            </View>

            {/* SITE / WASTE TYPE */}

            <View
              style={styles.twoColumn}
            >
              <View
                style={
                  styles.halfColumn
                }
              >
                <ListField
                  label="Site"
                  values={
                    collectionSites
                  }
                />
              </View>

              <View
                style={
                  styles.halfColumn
                }
              >
                <ListField
                  label="Waste Type"
                  values={
                    wasteTypes
                  }
                />
              </View>
            </View>

            {/* PACKAGING / QUANTITY */}

            <View
              style={styles.twoColumn}
            >
              <View
                style={
                  styles.halfColumn
                }
              >
                <ListField
                  label="Packaging"
                  values={
                    packagings
                  }
                />
              </View>

              <View
                style={
                  styles.halfColumn
                }
              >
                <Field
                  label="Quantity / Volume"
                  value={
                    data.quantityVolume
                  }
                />
              </View>
            </View>

            {/* COLLECTION SIGN-OFF */}

            <View
              style={
                styles.signatureSection
              }
            >
              <SignatureCard
                title="Collection Sign-off"
                description="Client confirming collection."
                name={data.clientName}
                signature={
                  data.clientSignature
                }
                signedAt={
                  data.clientSignedAt
                }
              />
            </View>
          </View>
        </View>

        {/* =================================================
            DISPOSAL
        ================================================= */}

        <View
          style={styles.section}
        >
          <View
            style={styles.sectionHeader}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              2. DISPOSAL
            </Text>

            <Text
              style={styles.sectionTag}
            >
              DISPOSAL
            </Text>
          </View>

          <View
            style={styles.sectionBody}
          >
            {/* FACILITY / METHOD */}

            <View
              style={styles.twoColumn}
            >
              <View
                style={
                  styles.halfColumn
                }
              >
                <FacilityField
                  facilities={
                    disposalFacilities
                  }
                />
              </View>

              <View
                style={
                  styles.halfColumn
                }
              >
                <ListField
                  label="Disposal Method"
                  values={
                    disposalMethods
                  }
                />
              </View>
            </View>

            {/* DISPOSAL DATE */}

            <View
              style={styles.twoColumn}
            >
              <View
                style={
                  styles.halfColumn
                }
              >
                <Field
                  label="Disposal Date"
                  value={formatDateOnly(
                    data.disposalDate
                  )}
                />
              </View>

              <View
                style={
                  styles.halfColumn
                }
              >
                <View
                  style={styles.field}
                >
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Status
                  </Text>

                  <Text
                    style={
                      styles.fieldValue
                    }
                  >
                    Completed
                  </Text>
                </View>
              </View>
            </View>

            {/* DISPOSAL SIGN-OFF */}

            <View
              style={
                styles.signatureSection
              }
            >
              <SignatureCard
                title="Disposal Sign-off"
                description="Facility representative confirming disposal."
                name={
                  data.facilityRepresentative
                }
                signature={
                  data.facilitySignature
                }
                signedAt={
                  data.facilitySignedAt
                }
              />
            </View>

            {/* CONFIRMATION */}

            <View
              style={styles.confirmation}
            >
              <Text
                style={
                  styles.confirmationTitle
                }
              >
                Disposal Confirmation
              </Text>

              <Text
                style={
                  styles.confirmationText
                }
              >
                The waste recorded on this
                certificate was collected and
                disposed of at the facility and
                by the method stated above.
                The recorded signatures confirm
                the collection and disposal
                process.
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <View
          style={styles.footer}
          fixed
        >
          <View>
            <Text
              style={
                styles.footerLeft
              }
            >
              Job No.{" "}
              {displayValue(
                data.jobNumber
              )}
            </Text>

            <Text
              style={
                styles.footerLeft
              }
            >
              Certificate Ref.{" "}
              {displayValue(
                data.referenceNumber
              )}
            </Text>
          </View>

          <Text
            style={styles.footerBrand}
          >
            DDW Consolidate Pty (Ltd) t/a{" "}
            SkipCo Solutions
          </Text>

          <Text
            style={
              styles.footerReference
            }
          >
            CERTIFICATE OF DISPOSAL
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/* =======================================================
   DEFAULT EXPORT
======================================================= */

export default DisposalCertificatePDF;