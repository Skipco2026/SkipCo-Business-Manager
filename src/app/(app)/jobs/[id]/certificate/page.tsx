"use client";

import {
  useEffect,
  useState,
  type MouseEvent,
  type TouchEvent,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  MapPin,
  PenLine,
  Save,
} from "lucide-react";

import { pdf } from "@react-pdf/renderer";

import {
  DisposalCertificatePDF,
  type DisposalCertificatePDFData,
} from "@/components/pdf/DisposalCertificatePDF";

import { DashboardShell } from "@/components/layout/dashboard-shell";

import MasterOptionTable from "@/components/disposal/MasterOptionTable";

import { createClient } from "@/lib/supabase/client";

/* =======================================================
   TYPES
======================================================= */

interface Customer {
  id: string;
  company_name: string | null;
  trading_name: string | null;
  physical_address?: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface Job {
  id: string;
  job_number: string;
  customer_id: string | null;
  assigned_employee_id: string | null;
  job_date: string | null;
  job_type: string | null;
  description: string | null;
  collection_address: string | null;
  delivery_address: string | null;
  status: string;
  completed: boolean;
  completed_at: string | null;
}

interface CollectionListItem {
  value: string;
}

interface DisposalFacilityItem {
  name: string;
  address: string;
}

interface DisposalMethodItem {
  value: string;
}

interface DisposalCertificate {
  id: string;
  job_id: string;
  reference_number: string;
  order_number: string | null;

  collection_status: "Pending" | "Signed";

  collected_by: string | null;
  collection_date: string | null;
  collection_location: string | null;

  collection_sites: CollectionListItem[] | null;
  waste_types: CollectionListItem[] | null;
  packagings: CollectionListItem[] | null;

  client_name: string | null;
  client_signature: string | null;
  client_signed_at: string | null;

  waste_type: string | null;
  quantity_volume: string | null;
  packaging: string | null;
  condition_at_receipt: string | null;

  disposal_method: string | null;
  disposal_facility_name: string | null;
  disposal_facility_address: string | null;
  disposal_date: string | null;

  disposal_facilities: DisposalFacilityItem[] | null;
  disposal_methods: DisposalMethodItem[] | null;

  facility_representative: string | null;
  facility_signature: string | null;
  facility_signed_at: string | null;

  certificate_status:
    | "Pending"
    | "Collection Signed"
    | "Completed";

  created_at?: string;
  updated_at?: string;
}

/* =======================================================
   HELPERS
======================================================= */

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normaliseCollectionItems(
  items: CollectionListItem[] | null,
  fallback: string | null
): string[] {
  if (Array.isArray(items) && items.length > 0) {
    return items
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.value || ""
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback?.trim()
    ? [fallback.trim()]
    : [];
}

function normaliseMethods(
  items: DisposalMethodItem[] | null,
  fallback: string | null
): string[] {
  if (Array.isArray(items) && items.length > 0) {
    return items
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.value || ""
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback?.trim()
    ? [fallback.trim()]
    : [];
}

function normaliseFacilities(
  items: DisposalFacilityItem[] | null,
  fallbackName: string | null,
  fallbackAddress: string | null
): DisposalFacilityItem[] {
  if (Array.isArray(items) && items.length > 0) {
    return items
      .map((item) => ({
        name:
          typeof item === "string"
            ? item
            : item?.name || "",
        address:
          typeof item === "string"
            ? ""
            : item?.address || "",
      }))
      .filter(
        (item) =>
          item.name.trim() ||
          item.address.trim()
      );
  }

  if (
    fallbackName?.trim() ||
    fallbackAddress?.trim()
  ) {
    return [
      {
        name: fallbackName?.trim() || "",
        address:
          fallbackAddress?.trim() || "",
      },
    ];
  }

  return [];
}

/* =======================================================
   SIGNATURE PAD
======================================================= */

function SignaturePad({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [drawing, setDrawing] =
    useState(false);

  const [hasDrawn, setHasDrawn] =
    useState(Boolean(value));

  function getCanvas() {
    return document.getElementById(
      "signature-pad"
    ) as HTMLCanvasElement | null;
  }

  function getPosition(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>
  ) {
    const canvas = getCanvas();

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect =
      canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0];

      if (!touch) {
        return { x: 0, y: 0 };
      }

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>
  ) {
    if (disabled) return;

    event.preventDefault();

    const canvas = getCanvas();

    if (!canvas) return;

    const position = getPosition(event);

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.beginPath();
    context.moveTo(
      position.x,
      position.y
    );

    setDrawing(true);
    setHasDrawn(true);
  }

  function draw(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>
  ) {
    if (!drawing || disabled) return;

    event.preventDefault();

    const canvas = getCanvas();

    if (!canvas) return;

    const position = getPosition(event);

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111111";

    context.lineTo(
      position.x,
      position.y
    );

    context.stroke();

    onChange(
      canvas.toDataURL("image/png")
    );
  }

  function stopDrawing() {
    setDrawing(false);
  }

  function clearSignature() {
    if (disabled) return;

    const canvas = getCanvas();

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    setHasDrawn(false);
    onChange("");
  }

  useEffect(() => {
    const canvas = getCanvas();

    if (!canvas || !value) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    const image = new Image();

    image.onload = () => {
      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    image.src = value;
  }, [value]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
      <canvas
        id="signature-pad"
        width={700}
        height={220}
        className={`h-[180px] w-full touch-none ${
          disabled
            ? "cursor-default bg-gray-50"
            : "cursor-crosshair"
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {!disabled && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2">
          <span className="text-xs text-gray-500">
            Sign above
          </span>

          <button
            type="button"
            onClick={clearSignature}
            disabled={!hasDrawn}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}

      {disabled && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-green-600">
          Existing signature preserved.
        </div>
      )}
    </div>
  );
}

/* =======================================================
   PAGE
======================================================= */

export default function DisposalCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const jobId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  /* =======================================================
     CERTIFICATE REFERENCE GENERATOR
     
     NEW:
     JOB-136987 -> DC-JOB136987

     Existing certificate references are preserved because
     this function is only called when certificate is null
     or when an existing reference is missing.
  ======================================================= */

  async function generateUniqueCertificateNumber(
    jobNumber: string
  ) {
    const cleanJobNumber = jobNumber
      .trim()
      .replace(/[^A-Za-z0-9]/g, "");

    const baseReference =
      `DC-${cleanJobNumber}`;

    /*
     * Check whether the exact new reference
     * already exists.
     */

    const {
      data,
      error: referenceCheckError,
    } = await supabase
      .from("disposal_certificates")
      .select("id")
      .eq(
        "reference_number",
        baseReference
      )
      .limit(1);

    if (referenceCheckError) {
      throw new Error(
        `Unable to check certificate reference availability: ${referenceCheckError.message}`
      );
    }

    /*
     * No duplicate.
     */

    if (!data || data.length === 0) {
      return baseReference;
    }

    /*
     * Extremely unlikely duplicate fallback.
     *
     * Existing certificate remains untouched.
     */

    let attempt = 2;

    while (attempt <= 100) {
      const candidate =
        `${baseReference}-${attempt}`;

      const {
        data: duplicate,
        error: duplicateError,
      } = await supabase
        .from("disposal_certificates")
        .select("id")
        .eq(
          "reference_number",
          candidate
        )
        .limit(1);

      if (duplicateError) {
        throw new Error(
          `Unable to check certificate reference availability: ${duplicateError.message}`
        );
      }

      if (
        !duplicate ||
        duplicate.length === 0
      ) {
        return candidate;
      }

      attempt++;
    }

    throw new Error(
      "Unable to generate a unique Certificate of Disposal reference number."
    );
  }

  /*
   * Synchronous display-only fallback.
   *
   * This does NOT save anything.
   */

  function getDisplayCertificateReference(
    jobNumber: string
  ) {
    const cleanJobNumber = jobNumber
      .trim()
      .replace(/[^A-Za-z0-9]/g, "");

    return `DC-${cleanJobNumber}`;
  }

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [generatingPDF, setGeneratingPDF] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [job, setJob] =
    useState<Job | null>(null);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [certificate, setCertificate] =
    useState<DisposalCertificate | null>(
      null
    );

  const [orderNumber, setOrderNumber] =
    useState("");

  const [clientName, setClientName] =
    useState("");

  const [clientSignature, setClientSignature] =
    useState("");

  /*
   * MASTER LIST SELECTIONS
   */

  const [collectionSites, setCollectionSites] =
    useState<string[]>([]);

  const [wasteTypes, setWasteTypes] =
    useState<string[]>([]);

  const [packagings, setPackagings] =
    useState<string[]>([]);

  const [facilityNames, setFacilityNames] =
    useState<string[]>([]);

  const [disposalMethods, setDisposalMethods] =
    useState<string[]>([]);

  /*
   * FACILITY ADDRESSES
   */

  const [facilityAddresses, setFacilityAddresses] =
    useState<Record<string, string>>({});

  const [quantityVolume, setQuantityVolume] =
    useState("");

  /*
   * COLLECTION DATE
   */

  const [collectionDate, setCollectionDate] =
    useState("");

  /*
   * DISPOSAL DATE
   */

  const [disposalDate, setDisposalDate] =
    useState("");

  const [
    facilityRepresentative,
    setFacilityRepresentative,
  ] = useState("");

  const [
    facilitySignature,
    setFacilitySignature,
  ] = useState("");

  const [jobStatus, setJobStatus] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    async function loadCertificate() {
      if (!jobId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      try {
        /*
         * LOAD JOB
         */

        const {
          data: jobData,
          error: jobError,
        } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .maybeSingle();

        if (jobError) {
          throw new Error(
            jobError.message
          );
        }

        if (!jobData) {
          setJob(null);
          setLoading(false);
          return;
        }

        setJob(jobData as Job);

        setJobStatus(
          jobData.status || ""
        );

        /*
         * LOAD CUSTOMER
         */

        if (jobData.customer_id) {
          const {
            data: customerData,
            error: customerError,
          } = await supabase
            .from("customers")
            .select(
              "id, company_name, trading_name, physical_address"
            )
            .eq(
              "id",
              jobData.customer_id
            )
            .maybeSingle();

          if (customerError) {
            console.warn(
              "Customer could not be loaded:",
              customerError.message
            );
          } else {
            setCustomer(
              customerData as Customer | null
            );
          }
        }

        /*
         * LOAD EMPLOYEE
         */

        if (
          jobData.assigned_employee_id
        ) {
          const {
            data: employeeData,
            error: employeeError,
          } = await supabase
            .from("employees")
            .select(
              "id, first_name, last_name, employee_number"
            )
            .eq(
              "id",
              jobData.assigned_employee_id
            )
            .maybeSingle();

          if (employeeError) {
            console.warn(
              "Employee could not be loaded:",
              employeeError.message
            );
          } else {
            setEmployee(
              employeeData as Employee | null
            );
          }
        }

        /*
         * LOAD EXISTING CERTIFICATE
         */

        const {
          data: certificateData,
          error: certificateError,
        } = await supabase
          .from("disposal_certificates")
          .select("*")
          .eq("job_id", jobId)
          .maybeSingle();

        if (certificateError) {
          throw new Error(
            certificateError.message
          );
        }

        if (certificateData) {
          const cert =
            certificateData as DisposalCertificate;

          /*
           * IMPORTANT:
           * Existing certificate reference is
           * restored exactly as stored.
           */

          setCertificate(cert);

          setCollectionDate(
            cert.collection_date ||
              jobData.job_date ||
              ""
          );

          setOrderNumber(
            cert.order_number || ""
          );

          setClientName(
            cert.client_name || ""
          );

          setClientSignature(
            cert.client_signature || ""
          );

          setCollectionSites(
            normaliseCollectionItems(
              cert.collection_sites,
              cert.collection_location
            )
          );

          setWasteTypes(
            normaliseCollectionItems(
              cert.waste_types,
              cert.waste_type
            )
          );

          setPackagings(
            normaliseCollectionItems(
              cert.packagings,
              cert.packaging
            )
          );

          setQuantityVolume(
            cert.quantity_volume || ""
          );

          /*
           * FACILITIES
           */

          const loadedFacilities =
            normaliseFacilities(
              cert.disposal_facilities,
              cert.disposal_facility_name,
              cert.disposal_facility_address
            );

          const loadedFacilityNames =
            loadedFacilities
              .map((facility) =>
                facility.name.trim()
              )
              .filter(Boolean);

          setFacilityNames(
            loadedFacilityNames
          );

          const addressMap: Record<
            string,
            string
          > = {};

          loadedFacilities.forEach(
            (facility) => {
              const name =
                facility.name.trim();

              if (name) {
                addressMap[name] =
                  facility.address.trim();
              }
            }
          );

          setFacilityAddresses(
            addressMap
          );

          /*
           * DISPOSAL METHODS
           */

          setDisposalMethods(
            normaliseMethods(
              cert.disposal_methods,
              cert.disposal_method
            )
          );

          setDisposalDate(
            cert.disposal_date || ""
          );

          setFacilityRepresentative(
            cert.facility_representative ||
              ""
          );

          setFacilitySignature(
            cert.facility_signature ||
              ""
          );
        } else {
          /*
           * NEW CERTIFICATE
           */

          setCollectionDate(
            jobData.job_date || ""
          );

          if (jobData.collection_address) {
            setCollectionSites([
              jobData.collection_address,
            ]);
          } else {
            setCollectionSites([]);
          }

          setCertificate(null);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load disposal certificate."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCertificate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  /* =======================================================
     STATUS
  ======================================================= */

  const collectionSigned =
    certificate?.collection_status ===
    "Signed";

  const facilitySigned = Boolean(
    certificate?.facility_signature
  );

  const certificateCompleted =
    certificate?.certificate_status ===
      "Completed" &&
    collectionSigned &&
    facilitySigned;

  /* =======================================================
     FACILITY HELPERS
  ======================================================= */

  function handleFacilitySelection(
    values: string[]
  ) {
    setFacilityNames(values);

    setFacilityAddresses(
      (current) => {
        const next: Record<
          string,
          string
        > = {};

        values.forEach((name) => {
          next[name] =
            current[name] || "";
        });

        return next;
      }
    );
  }

  function getFacilityItems(): DisposalFacilityItem[] {
    return facilityNames
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        address:
          facilityAddresses[name] ||
          "",
      }));
  }

  /* =======================================================
     SAVE CERTIFICATE EDITS
  ======================================================= */

  async function saveCertificateEdits() {
    setError("");
    setSuccess("");

    const validSites =
      collectionSites
        .map((item) => item.trim())
        .filter(Boolean);

    const validWasteTypes =
      wasteTypes
        .map((item) => item.trim())
        .filter(Boolean);

    const validPackagings =
      packagings
        .map((item) => item.trim())
        .filter(Boolean);

    const validMethods =
      disposalMethods
        .map((item) => item.trim())
        .filter(Boolean);

    const validFacilities =
      getFacilityItems();

    if (validSites.length === 0) {
      setError(
        "Please select at least one collection Site."
      );
      return;
    }

    if (validWasteTypes.length === 0) {
      setError(
        "Please select at least one Waste Type."
      );
      return;
    }

    if (validPackagings.length === 0) {
      setError(
        "Please select at least one Packaging option."
      );
      return;
    }

    if (!quantityVolume.trim()) {
      setError(
        "Please enter the Quantity / Volume."
      );
      return;
    }

    if (validFacilities.length === 0) {
      setError(
        "Please select at least one Disposal Facility."
      );
      return;
    }

    if (validMethods.length === 0) {
      setError(
        "Please select at least one Disposal Method."
      );
      return;
    }

    if (!disposalDate) {
      setError(
        "Please select the Disposal Date."
      );
      return;
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      /*
       * IMPORTANT:
       *
       * If the certificate already exists,
       * preserve its exact existing reference.
       *
       * If this is a new certificate, generate
       * a new DC-JOB... reference.
       */

      const referenceNumber =
        certificate?.reference_number ||
        await generateUniqueCertificateNumber(
          job?.job_number || "JOB"
        );

      const certificatePayload = {
        job_id: jobId,

        reference_number:
          referenceNumber,

        order_number:
          orderNumber.trim() || null,

        collection_status:
          certificate?.collection_status ||
          "Pending",

        collection_date:
          collectionDate || null,

        collection_sites:
          validSites.map((value) => ({
            value,
          })),

        waste_types:
          validWasteTypes.map((value) => ({
            value,
          })),

        packagings:
          validPackagings.map((value) => ({
            value,
          })),

        collection_location:
          validSites[0],

        waste_type:
          validWasteTypes[0],

        packaging:
          validPackagings[0],

        quantity_volume:
          quantityVolume.trim(),

        disposal_method:
          validMethods[0],

        disposal_methods:
          validMethods.map((value) => ({
            value,
          })),

        disposal_facilities:
          validFacilities,

        disposal_facility_name:
          validFacilities[0]?.name ||
          null,

        disposal_facility_address:
          validFacilities[0]?.address ||
          null,

        disposal_date:
          disposalDate,

        /*
         * PRESERVE COLLECTION SIGNATURE
         */

        client_name:
          certificate?.client_name ||
          null,

        client_signature:
          certificate?.client_signature ||
          null,

        client_signed_at:
          certificate?.client_signed_at ||
          null,

        /*
         * PRESERVE FACILITY SIGNATURE
         */

        facility_representative:
          certificate?.facility_representative ||
          null,

        facility_signature:
          certificate?.facility_signature ||
          null,

        facility_signed_at:
          certificate?.facility_signed_at ||
          null,

        certificate_status:
          certificate?.certificate_status ||
          "Pending",

        updated_at: now,
      };

      let savedCertificate:
        | DisposalCertificate
        | null = null;

      if (certificate) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("disposal_certificates")
          .update(
            certificatePayload
          )
          .eq(
            "id",
            certificate.id
          )
          .select()
          .single();

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        savedCertificate =
          data as DisposalCertificate;
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("disposal_certificates")
          .insert(
            certificatePayload
          )
          .select()
          .single();

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        savedCertificate =
          data as DisposalCertificate;
      }

      setCertificate(
        savedCertificate
      );

      setCollectionDate(
        savedCertificate?.collection_date ||
          collectionDate ||
          job?.job_date ||
          ""
      );

      setCollectionSites(
        validSites
      );

      setWasteTypes(
        validWasteTypes
      );

      setPackagings(
        validPackagings
      );

      setFacilityNames(
        validFacilities.map(
          (facility) =>
            facility.name
        )
      );

      setDisposalMethods(
        validMethods
      );

      setSuccess(
        "Disposal Certificate updated successfully. Existing signatures were preserved."
      );

      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save disposal certificate."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SIGN COLLECTION
  ======================================================= */

  async function signCollection() {
    setError("");
    setSuccess("");

    const validSites =
      collectionSites
        .map((item) => item.trim())
        .filter(Boolean);

    const validWasteTypes =
      wasteTypes
        .map((item) => item.trim())
        .filter(Boolean);

    const validPackagings =
      packagings
        .map((item) => item.trim())
        .filter(Boolean);

    if (!clientName.trim()) {
      setError(
        "Please enter the collection sign-off person's name."
      );
      return;
    }

    if (!clientSignature) {
      setError(
        "Please add the client's signature."
      );
      return;
    }

    if (validSites.length === 0) {
      setError(
        "Please select at least one collection Site."
      );
      return;
    }

    if (validWasteTypes.length === 0) {
      setError(
        "Please select at least one Waste Type."
      );
      return;
    }

    if (validPackagings.length === 0) {
      setError(
        "Please select at least one Packaging option."
      );
      return;
    }

    if (!quantityVolume.trim()) {
      setError(
        "Please enter the Quantity / Volume."
      );
      return;
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const currentFacilities =
        getFacilityItems();

      /*
       * Preserve an existing certificate reference.
       *
       * If there is no certificate yet,
       * create the new DC-JOB... reference.
       */

      const referenceNumber =
        certificate?.reference_number ||
        await generateUniqueCertificateNumber(
          job?.job_number || "JOB"
        );

      const payload = {
        job_id: jobId,

        reference_number:
          referenceNumber,

        order_number:
          orderNumber.trim() || null,

        collection_status:
          "Signed",

        collected_by:
          certificate?.collected_by ||
          (employee
            ? `${employee.first_name} ${employee.last_name}`
            : null),

        collection_date:
          collectionDate ||
          job?.job_date ||
          null,

        collection_location:
          validSites[0],

        collection_sites:
          validSites.map((value) => ({
            value,
          })),

        waste_types:
          validWasteTypes.map((value) => ({
            value,
          })),

        packagings:
          validPackagings.map((value) => ({
            value,
          })),

        client_name:
          clientName.trim(),

        client_signature:
          clientSignature,

        client_signed_at:
          certificate?.client_signed_at ||
          now,

        waste_type:
          validWasteTypes[0],

        quantity_volume:
          quantityVolume.trim(),

        packaging:
          validPackagings[0],

        /*
         * Preserve existing disposal data.
         */

        disposal_method:
          certificate?.disposal_method ||
          null,

        disposal_methods:
          certificate?.disposal_methods ||
          [],

        disposal_facilities:
          currentFacilities.length > 0
            ? currentFacilities
            : certificate?.disposal_facilities ||
              [],

        disposal_facility_name:
          currentFacilities[0]?.name ||
          certificate?.disposal_facility_name ||
          null,

        disposal_facility_address:
          currentFacilities[0]?.address ||
          certificate?.disposal_facility_address ||
          null,

        disposal_date:
          certificate?.disposal_date ||
          null,

        facility_representative:
          certificate?.facility_representative ||
          null,

        facility_signature:
          certificate?.facility_signature ||
          null,

        facility_signed_at:
          certificate?.facility_signed_at ||
          null,

        certificate_status:
          "Collection Signed",

        updated_at: now,
      };

      const {
        data,
        error: upsertError,
      } = await supabase
        .from("disposal_certificates")
        .upsert(payload, {
          onConflict: "job_id",
        })
        .select()
        .single();

      if (upsertError) {
        throw new Error(
          upsertError.message
        );
      }

      setCertificate(
        data as DisposalCertificate
      );

      setCollectionDate(
        (data as DisposalCertificate)
          .collection_date ||
          collectionDate ||
          job?.job_date ||
          ""
      );

      setSuccess(
        "Collection sign-off completed successfully. The certificate is now awaiting facility sign-off."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign collection."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SIGN FACILITY
  ======================================================= */

  async function signFacility() {
    setError("");
    setSuccess("");

    const validMethods =
      disposalMethods
        .map((item) => item.trim())
        .filter(Boolean);

    const validFacilities =
      getFacilityItems();

    if (!collectionSigned) {
      setError(
        "The collection must be signed before completing disposal."
      );
      return;
    }

    if (validFacilities.length === 0) {
      setError(
        "Please select at least one Disposal Facility."
      );
      return;
    }

    if (validMethods.length === 0) {
      setError(
        "Please select at least one Disposal Method."
      );
      return;
    }

    if (!disposalDate) {
      setError(
        "Please select the Disposal Date."
      );
      return;
    }

    if (!facilityRepresentative.trim()) {
      setError(
        "Please enter the facility representative's name."
      );
      return;
    }

    if (!facilitySignature) {
      setError(
        "Please add the facility representative's signature."
      );
      return;
    }

    if (!certificate) {
      setError(
        "No disposal certificate exists yet. Please sign the collection first."
      );
      return;
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const firstFacility =
        validFacilities[0];

      const {
        data,
        error: updateError,
      } = await supabase
        .from("disposal_certificates")
        .update({
          disposal_method:
            validMethods[0],

          disposal_methods:
            validMethods.map((value) => ({
              value,
            })),

          disposal_facilities:
            validFacilities,

          disposal_facility_name:
            firstFacility.name,

          disposal_facility_address:
            firstFacility.address,

          disposal_date:
            disposalDate,

          facility_representative:
            facilityRepresentative.trim(),

          facility_signature:
            facilitySignature,

          facility_signed_at:
            certificate.facility_signed_at ||
            now,

          certificate_status:
            "Completed",

          updated_at: now,
        })
        .eq(
          "id",
          certificate.id
        )
        .select()
        .single();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setCertificate(
        data as DisposalCertificate
      );

      const {
        error: jobUpdateError,
      } = await supabase
        .from("jobs")
        .update({
          status: "Completed",
          completed: true,
          completed_at:
            job?.completed_at ||
            now,
        })
        .eq("id", jobId);

      if (jobUpdateError) {
        throw new Error(
          jobUpdateError.message
        );
      }

      setJob((current) =>
        current
          ? {
              ...current,
              status: "Completed",
              completed: true,
              completed_at:
                current.completed_at ||
                now,
            }
          : current
      );

      setJobStatus("Completed");

      setSuccess(
        "Disposal facility sign-off completed. The Certificate of Disposal is now complete and ready to download."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete disposal certificate."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SAVE JOB STATUS
  ======================================================= */

  async function saveJobStatus() {
    if (!job) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const completed =
        jobStatus === "Completed";

      const {
        error: updateError,
      } = await supabase
        .from("jobs")
        .update({
          status: jobStatus,
          completed,
          completed_at: completed
            ? job.completed_at ||
              now
            : null,
        })
        .eq("id", job.id);

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setJob((current) =>
        current
          ? {
              ...current,
              status: jobStatus,
              completed,
              completed_at: completed
                ? current.completed_at ||
                  now
                : null,
            }
          : current
      );

      setSuccess(
        "Job status updated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update Job Status."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     PDF DATA
  ======================================================= */

  const pdfData:
    | DisposalCertificatePDFData
    | null =
    certificate && job
      ? {
          referenceNumber:
            certificate.reference_number,

          jobNumber:
            job.job_number,

          orderNumber:
            certificate.order_number ||
            "",

          customer:
            customer?.trading_name ||
            customer?.company_name ||
            certificate.client_name ||
            "-",

          collectedBy:
            certificate.collected_by ||
            (employee
              ? `${employee.first_name} ${employee.last_name}`
              : "-"),

          collectionDate:
            formatDate(
              collectionDate ||
                certificate.collection_date ||
                job.job_date
            ),

          collectionSites:
            collectionSites
              .map((item) => item.trim())
              .filter(Boolean),

          wasteTypes:
            wasteTypes
              .map((item) => item.trim())
              .filter(Boolean),

          packagings:
            packagings
              .map((item) => item.trim())
              .filter(Boolean),

          quantityVolume:
            certificate.quantity_volume ||
            quantityVolume ||
            "-",

          jobType:
            job.job_type || "-",

          jobDescription:
            job.description || "-",

          clientName:
            certificate.client_name ||
            "-",

          clientSignature:
            certificate.client_signature ||
            "",

          clientSignedAt:
            formatDateTime(
              certificate.client_signed_at
            ),

          disposalFacilities:
            getFacilityItems()
              .map((facility) => ({
                name:
                  facility.name.trim(),
                address:
                  facility.address.trim(),
              }))
              .filter(
                (facility) =>
                  facility.name ||
                  facility.address
              ),

          disposalMethods:
            disposalMethods
              .map((item) => item.trim())
              .filter(Boolean),

          disposalDate:
            formatDate(
              certificate.disposal_date
            ),

          facilityRepresentative:
            certificate.facility_representative ||
            "-",

          facilitySignature:
            certificate.facility_signature ||
            "",

          facilitySignedAt:
            formatDateTime(
              certificate.facility_signed_at
            ),
        }
      : null;

  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  async function downloadPDF() {
    setError("");
    setSuccess("");

    if (!certificate || !pdfData) {
      setError(
        "There is no disposal certificate available to download yet."
      );
      return;
    }

    if (!certificateCompleted) {
      setError(
        "Please complete both the client and disposal facility signatures before downloading the Certificate of Disposal."
      );
      return;
    }

    setGeneratingPDF(true);

    try {
      const pdfDocument = (
        <DisposalCertificatePDF
          data={pdfData}
        />
      );

      const blob = await pdf(
        pdfDocument
      ).toBlob();

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `Certificate-of-Disposal-${certificate.reference_number}.pdf`;

      link.style.display = "none";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      setSuccess(
        "Certificate PDF downloaded successfully."
      );
    } catch (err) {
      console.error(
        "Certificate PDF generation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate the Certificate of Disposal PDF."
      );
    } finally {
      setGeneratingPDF(false);
    }
  }

  /* =======================================================
     SELECTED VALUES
  ======================================================= */

  function SelectedValues({
    values,
    icon,
  }: {
    values: string[];
    icon?: ReactNode;
  }) {
    if (values.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          -
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {values.map((value) => (
          <div
            key={value}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800"
          >
            {icon}
            <span>{value}</span>
          </div>
        ))}
      </div>
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DashboardShell
        title="Disposal Certificate"
        subtitle="Loading certificate..."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading disposal certificate...
          </div>
        </div>
      </DashboardShell>
    );
  }

  /* =======================================================
     NO JOB
  ======================================================= */

  if (!job) {
    return (
      <DashboardShell
        title="Disposal Certificate"
        subtitle="Certificate not found"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error ||
            "The job could not be found."}
        </div>
      </DashboardShell>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardShell
      title="Disposal Certificate"
      subtitle={`Job ${job.job_number}`}
    >
      <div className="space-y-6">

        {/* TOP HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <button
            type="button"
            onClick={() =>
              router.push("/jobs")
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job
          </button>

          <div className="flex flex-wrap items-center gap-3">

            {certificate && (
              <button
                type="button"
                onClick={() =>
                  setEditing(
                    (current) => !current
                  )
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold shadow-sm transition ${
                  editing
                    ? "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "border-cyan-600 bg-white text-cyan-700 hover:bg-cyan-50"
                }`}
              >
                {editing ? (
                  <>
                    <ArrowLeft className="h-4 w-4" />
                    Cancel Edit
                  </>
                ) : (
                  <>
                    <PenLine className="h-4 w-4" />
                    Edit
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={downloadPDF}
              disabled={
                generatingPDF ||
                !certificateCompleted
              }
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {generatingPDF
                ? "Preparing PDF..."
                : "Download PDF"}
            </button>

            {certificateCompleted ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-700">
                <Check className="h-4 w-4" />
                Certificate Completed
              </div>
            ) : collectionSigned ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-700">
                Awaiting Facility Sign-off
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700">
                Awaiting Collection
              </div>
            )}

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* EDIT NOTICE */}

        {editing && (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm text-cyan-800">
            <strong>
              Edit mode is active.
            </strong>{" "}
            Select existing master options or
            use <strong>ADD</strong> at the top
            of each list to create a new reusable
            option. Existing signatures will be
            preserved.
          </div>
        )}

        {/* CERTIFICATE HEADER */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="relative overflow-hidden bg-[#111111] px-6 py-7 text-white sm:px-8">

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="text-2xl font-black tracking-wide">
                  SKIP CO
                </div>

                <div className="text-sm font-bold tracking-[0.25em] text-cyan-400">
                  SOLUTIONS
                </div>

                <p className="mt-2 text-xs text-gray-300">
                  DDW Consolidate Pty (Ltd) t/a
                  SkipCo Solutions
                </p>
              </div>

              <div className="text-left sm:text-right">

                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  JOB NO.
                </p>

                <p className="mt-1 text-lg font-bold">
                  {job.job_number}
                </p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  ORDER NO.
                </p>

                {editing ? (
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(event) =>
                      setOrderNumber(
                        event.target.value
                      )
                    }
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  />
                ) : (
                  <p className="mt-1 text-sm font-bold text-white">
                    {orderNumber || "—"}
                  </p>
                )}

                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Certificate Ref.
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  {certificate?.reference_number ||
                    getDisplayCertificateReference(
                      job.job_number
                    )}
                </p>

              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">

            <div className="text-center">

              <div className="mx-auto inline-flex rounded-full border-2 border-cyan-500 px-6 py-2">

                <h2 className="text-xl font-black tracking-wide text-gray-900">
                  CERTIFICATE OF DISPOSAL
                </h2>

              </div>

              <p className="mt-3 text-sm text-gray-500">
                Waste Collection & Disposal Record
              </p>

              <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                This certificate records the
                collection and disposal of waste
                associated with the job shown below.
              </p>

            </div>

          </div>
        </div>

        {/* ===================================================
            COLLECTION
        =================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between rounded-t-2xl bg-[#111111] px-5 py-3">

            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              1. Collection
            </h3>

            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Collection
            </span>

          </div>

          <div className="space-y-6 p-5">

            {/* CUSTOMER / DATE */}

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Customer
                </p>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                  {customer?.trading_name ||
                    customer?.company_name ||
                    "-"}
                </div>
              </div>

              {/* COLLECTION DATE */}

              <div>
                <label
                  htmlFor="collection-date"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  Collection Date
                </label>

                {editing ? (
                  <input
                    id="collection-date"
                    type="date"
                    value={collectionDate}
                    onChange={(event) =>
                      setCollectionDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    {formatDate(
                      collectionDate
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* SITE */}

            <div>

              {editing ? (
                <MasterOptionTable
                  title="Site"
                  category="site"
                  selected={
                    collectionSites
                  }
                  onChange={
                    setCollectionSites
                  }
                />
              ) : (
                <>
                  <div className="mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Site
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Collection site / address
                    </p>
                  </div>

                  <SelectedValues
                    values={
                      collectionSites
                    }
                    icon={
                      <MapPin className="h-4 w-4 text-cyan-600" />
                    }
                  />
                </>
              )}

            </div>

            {/* WASTE TYPE */}

            <div>

              {editing ? (
                <MasterOptionTable
                  title="Waste Type"
                  category="waste_type"
                  selected={
                    wasteTypes
                  }
                  onChange={
                    setWasteTypes
                  }
                />
              ) : (
                <>
                  <div className="mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Waste Type
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Applicable waste types
                    </p>
                  </div>

                  <SelectedValues
                    values={
                      wasteTypes
                    }
                  />
                </>
              )}

            </div>

            {/* PACKAGING */}

            <div>

              {editing ? (
                <MasterOptionTable
                  title="Packaging"
                  category="packaging"
                  selected={
                    packagings
                  }
                  onChange={
                    setPackagings
                  }
                />
              ) : (
                <>
                  <div className="mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Packaging
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Skip, bag, loose, container,
                      etc.
                    </p>
                  </div>

                  <SelectedValues
                    values={
                      packagings
                    }
                  />
                </>
              )}

            </div>

            {/* QUANTITY */}

            <div className="max-w-md">

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Quantity / Volume
              </p>

              {editing ? (
                <input
                  type="text"
                  value={
                    quantityVolume
                  }
                  onChange={(event) =>
                    setQuantityVolume(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 6m³"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                  {quantityVolume ||
                    "-"}
                </div>
              )}

            </div>

            {/* COLLECTION SIGN-OFF */}

            <div className="border-t border-gray-200 pt-5">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    Collection Sign-off
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Existing signature information
                    is preserved.
                  </p>
                </div>

                {collectionSigned && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                    <Check className="h-3.5 w-3.5" />
                    Signed
                  </span>
                )}

              </div>

              <div className="grid gap-5 lg:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Sign-off Person&apos;s Name *
                  </label>

                  <input
                    type="text"
                    value={
                      clientName
                    }
                    onChange={(event) =>
                      setClientName(
                        event.target.value
                      )
                    }
                    disabled={
                      collectionSigned &&
                      !editing
                    }
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
                  />

                </div>

                <div>

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Signature *
                  </p>

                  <SignaturePad
                    value={
                      clientSignature
                    }
                    onChange={
                      setClientSignature
                    }
                    disabled={Boolean(
                      clientSignature
                    )}
                  />

                </div>

              </div>

              {!collectionSigned && (
                <div className="mt-5 flex justify-end border-t border-gray-100 pt-5">

                  <button
                    type="button"
                    onClick={
                      signCollection
                    }
                    disabled={
                      saving
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}

                    {saving
                      ? "Saving..."
                      : "Sign Collection"}
                  </button>

                </div>
              )}

              {collectionSigned && (
                <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  Collection signed on{" "}
                  <strong>
                    {formatDateTime(
                      certificate?.client_signed_at ||
                        null
                    )}
                  </strong>
                  .
                </div>
              )}

            </div>

          </div>
        </div>

        {/* ===================================================
            DISPOSAL
        =================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between rounded-t-2xl bg-[#111111] px-5 py-3">

            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              2. Disposal
            </h3>

            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Disposal
            </span>

          </div>

          <div className="space-y-6 p-5">

            {/* FACILITY */}

            <div>

              {editing ? (
                <>
                  <MasterOptionTable
                    title="Disposal Facility"
                    category="disposal_facility"
                    selected={
                      facilityNames
                    }
                    onChange={
                      handleFacilitySelection
                    }
                  />

                  {facilityNames.length >
                    0 && (
                    <div className="mt-5 space-y-4">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Facility Addresses
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Enter the address for each
                          selected disposal facility.
                        </p>
                      </div>

                      {facilityNames.map(
                        (facilityName) => (
                          <div
                            key={
                              facilityName
                            }
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                          >
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                              {
                                facilityName
                              }
                            </label>

                            <textarea
                              value={
                                facilityAddresses[
                                  facilityName
                                ] || ""
                              }
                              onChange={(
                                event
                              ) =>
                                setFacilityAddresses(
                                  (
                                    current
                                  ) => ({
                                    ...current,
                                    [facilityName]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder="Enter facility address"
                              rows={2}
                              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                            />
                          </div>
                        )
                      )}

                    </div>
                  )}

                </>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Disposal Facility
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Facility used for disposal
                    </p>
                  </div>

                  <div className="space-y-3">

                    {getFacilityItems()
                      .length ===
                    0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        -
                      </div>
                    ) : (
                      getFacilityItems().map(
                        (facility) => (
                          <div
                            key={
                              facility.name
                            }
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                          >
                            <p className="text-sm font-semibold text-gray-800">
                              {facility.name ||
                                "-"}
                            </p>

                            {facility.address && (
                              <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                                {
                                  facility.address
                                }
                              </p>
                            )}
                          </div>
                        )
                      )
                    )}

                  </div>
                </>
              )}

            </div>

            {/* DISPOSAL METHOD */}

            <div>

              {editing ? (
                <MasterOptionTable
                  title="Disposal Method"
                  category="disposal_method"
                  selected={
                    disposalMethods
                  }
                  onChange={
                    setDisposalMethods
                  }
                />
              ) : (
                <>
                  <div className="mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Disposal Method
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Applicable disposal methods
                    </p>
                  </div>

                  <SelectedValues
                    values={
                      disposalMethods
                    }
                  />
                </>
              )}

            </div>

            {/* DISPOSAL DATE */}

            <div className="max-w-md">

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Disposal Date *
              </label>

              {editing ? (
                <input
                  type="date"
                  value={
                    disposalDate
                  }
                  onChange={(event) =>
                    setDisposalDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                  {formatDate(
                    certificate?.disposal_date ||
                      null
                  )}
                </div>
              )}

            </div>

            {/* DISPOSAL SIGN-OFF */}

            <div className="border-t border-gray-200 pt-5">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    Disposal Sign-off
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Facility representative confirming
                    disposal.
                  </p>
                </div>

                {facilitySigned && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                    <Check className="h-3.5 w-3.5" />
                    Signed
                  </span>
                )}

              </div>

              <div className="grid gap-5 lg:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Sign-off Person&apos;s Name *
                  </label>

                  {editing ? (
                    <input
                      type="text"
                      value={
                        facilityRepresentative
                      }
                      onChange={(event) =>
                        setFacilityRepresentative(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                      {
                        facilityRepresentative ||
                        "-"
                      }
                    </div>
                  )}

                </div>

                <div>

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Signature *
                  </p>

                  <SignaturePad
                    value={
                      facilitySignature
                    }
                    onChange={
                      setFacilitySignature
                    }
                    disabled={Boolean(
                      facilitySignature
                    )}
                  />

                </div>

              </div>

              {!certificateCompleted &&
                collectionSigned && (
                  <div className="mt-5 flex justify-end border-t border-gray-100 pt-5">

                    <button
                      type="button"
                      onClick={
                        signFacility
                      }
                      disabled={
                        saving
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}

                      {saving
                        ? "Completing..."
                        : "Complete Disposal Certificate"}
                    </button>

                  </div>
                )}

              {certificateCompleted && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">

                  <div className="flex items-start gap-3">

                    <div className="rounded-full bg-green-100 p-2 text-green-700">
                      <Check className="h-5 w-5" />
                    </div>

                    <div>

                      <h4 className="font-bold text-green-800">
                        Certificate Completed
                      </h4>

                      <p className="mt-1 text-sm text-green-700">
                        Both required signatures
                        have been recorded.
                      </p>

                      <p className="mt-2 text-xs text-green-600">
                        Facility signed:{" "}
                        {formatDateTime(
                          certificate?.facility_signed_at ||
                            null
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>
        </div>

        {/* ===================================================
            SAVE EDITS
        =================================================== */}

        {editing && (
          <div className="flex justify-end">

            <button
              type="button"
              onClick={
                saveCertificateEdits
              }
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : "Save Certificate Changes"}

            </button>

          </div>
        )}

        {/* ===================================================
            JOB STATUS
        =================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="rounded-t-2xl bg-[#111111] px-5 py-3">

            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Job Status
            </h3>

          </div>

          <div className="p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

              <div className="flex-1">

                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Current Job Status
                </label>

                <select
                  value={
                    jobStatus
                  }
                  onChange={(event) =>
                    setJobStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >

                  <option value="">
                    Select status
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>

                  <option value="Collected">
                    Collected
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>

                </select>

              </div>

              <button
                type="button"
                onClick={
                  saveJobStatus
                }
                disabled={
                  saving ||
                  !jobStatus
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Update Job Status

              </button>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Changing this status updates the
              linked Job record automatically.
            </p>

          </div>
        </div>

        {/* ===================================================
            DOWNLOAD AREA
        =================================================== */}

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-bold text-gray-900">
                Certificate of Disposal PDF
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {certificateCompleted
                  ? "Your completed Certificate of Disposal is ready to download."
                  : "The PDF will be available once both required signatures have been completed."}
              </p>

            </div>

            <button
              type="button"
              onClick={
                downloadPDF
              }
              disabled={
                generatingPDF ||
                !certificateCompleted
              }
              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {generatingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {generatingPDF
                ? "Preparing PDF..."
                : "Download Certificate PDF"}

            </button>

          </div>
        </div>

        {/* FOOTER */}

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-center text-xs text-gray-500">

          <p className="font-semibold text-gray-700">
            DDW Consolidate Pty (Ltd) t/a
            SkipCo Solutions
          </p>

          <p className="mt-1">
            Certificate of Disposal •{" "}
            {job.job_number}
          </p>

        </div>

      </div>
    </DashboardShell>
  );
}