"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { MouseEvent, TouchEvent } from "react";

import {
  ArrowLeft,
  Check,
  Download,
  Eraser,
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
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

interface Customer {
  id: string;
  company_name: string | null;
  trading_name: string | null;
  physical_address?: string | null;
  address?: string | null;
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

interface DisposalCertificate {
  id: string;
  job_id: string;
  reference_number: string;

  collection_status: "Pending" | "Signed";

  collected_by: string | null;
  collection_date: string | null;
  collection_location: string | null;

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

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateCertificateNumber(jobNumber: string) {
  return `DC-${jobNumber.replace(/[^a-zA-Z0-9]/g, "")}`;
}

/* =========================================================
   SIGNATURE PAD
========================================================= */

function SignaturePad({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const image = new Image();

      image.onload = () => {
        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.fillStyle = "#ffffff";

        context.fillRect(
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
    }
  }, [value]);

  function getPosition(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect = canvas.getBoundingClientRect();

    const clientX =
      "touches" in event
        ? event.touches[0]?.clientX ?? 0
        : event.clientX;

    const clientY =
      "touches" in event
        ? event.touches[0]?.clientY ?? 0
        : event.clientY;

    return {
      x:
        ((clientX - rect.left) / rect.width) *
        canvas.width,

      y:
        ((clientY - rect.top) / rect.height) *
        canvas.height,
    };
  }

  function startDrawing(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>
  ) {
    if (disabled) return;

    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const { x, y } = getPosition(event);

    drawingRef.current = true;

    context.beginPath();
    context.moveTo(x, y);
  }

  function draw(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>
  ) {
    if (disabled || !drawingRef.current) return;

    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const { x, y } = getPosition(event);

    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111111";

    context.lineTo(x, y);
    context.stroke();
  }

  function stopDrawing() {
    if (disabled) return;

    if (!drawingRef.current) return;

    drawingRef.current = false;

    const canvas = canvasRef.current;

    if (!canvas) return;

    onChange(canvas.toDataURL("image/png"));
  }

  function clearSignature() {
    if (disabled) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.fillStyle = "#ffffff";

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        <canvas
          ref={canvasRef}
          width={900}
          height={260}
          className={`h-40 w-full touch-none ${
            disabled
              ? "cursor-not-allowed opacity-70"
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

        {!value && !disabled && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <PenLine className="h-4 w-4" />
              Sign here
            </div>
          </div>
        )}
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear Signature
        </button>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function DisposalCertificatePage() {
  const params = useParams();
  const router = useRouter();

  const jobId = String(params.id);

  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [certificate, setCertificate] =
    useState<DisposalCertificate | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientSignature, setClientSignature] = useState("");

  const [wasteType, setWasteType] = useState("");
  const [quantityVolume, setQuantityVolume] = useState("");
  const [packaging, setPackaging] = useState("");
  const [conditionAtReceipt, setConditionAtReceipt] =
    useState("");

  const [facilityName, setFacilityName] = useState("");
  const [facilityAddress, setFacilityAddress] = useState("");
  const [disposalMethod, setDisposalMethod] = useState("");
  const [disposalDate, setDisposalDate] = useState("");
  const [facilityRepresentative, setFacilityRepresentative] =
    useState("");
  const [facilitySignature, setFacilitySignature] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const {
          data: jobData,
          error: jobError,
        } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        if (jobError) {
          throw new Error(jobError.message);
        }

        if (!jobData) {
          throw new Error("Job not found.");
        }

        setJob(jobData as Job);

        if (jobData.customer_id) {
          const {
            data: customerData,
          } = await supabase
            .from("customers")
            .select(
              "id, company_name, trading_name, physical_address, address"
            )
            .eq("id", jobData.customer_id)
            .single();

          setCustomer(
            (customerData as Customer) || null
          );
        }

        if (jobData.assigned_employee_id) {
          const {
            data: employeeData,
          } = await supabase
            .from("employees")
            .select(
              "id, first_name, last_name, employee_number"
            )
            .eq(
              "id",
              jobData.assigned_employee_id
            )
            .single();

          setEmployee(
            (employeeData as Employee) || null
          );
        }

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
          const loaded =
            certificateData as DisposalCertificate;

          setCertificate(loaded);

          setClientName(
            loaded.client_name || ""
          );

          setClientSignature(
            loaded.client_signature || ""
          );

          setWasteType(
            loaded.waste_type || ""
          );

          setQuantityVolume(
            loaded.quantity_volume || ""
          );

          setPackaging(
            loaded.packaging || ""
          );

          setConditionAtReceipt(
            loaded.condition_at_receipt || ""
          );

          setFacilityName(
            loaded.disposal_facility_name || ""
          );

          setFacilityAddress(
            loaded.disposal_facility_address || ""
          );

          setDisposalMethod(
            loaded.disposal_method || ""
          );

          if (loaded.disposal_date) {
            setDisposalDate(
              loaded.disposal_date.substring(0, 10)
            );
          }

          setFacilityRepresentative(
            loaded.facility_representative || ""
          );

          setFacilitySignature(
            loaded.facility_signature || ""
          );
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

    if (jobId) {
      loadData();
    }
  }, [jobId]);

  /* =======================================================
     STATUS
  ======================================================= */

  const collectionSigned =
    certificate?.collection_status === "Signed";

  const facilitySigned = Boolean(
    certificate?.facility_signature
  );

  const certificateCompleted =
    certificate?.certificate_status === "Completed" &&
    collectionSigned &&
    facilitySigned;

  /* =======================================================
     SIGN COLLECTION
  ======================================================= */

  async function signCollection() {
    setError("");
    setSuccess("");

    if (!job) {
      setError(
        "Job information is not loaded."
      );
      return;
    }

    if (!clientName.trim()) {
      setError(
        "Please enter the client's name."
      );
      return;
    }

    if (!clientSignature) {
      setError(
        "Please add the client's signature."
      );
      return;
    }

    if (!wasteType.trim()) {
      setError(
        "Please enter the waste type."
      );
      return;
    }

    if (!quantityVolume.trim()) {
      setError(
        "Please enter the quantity / volume."
      );
      return;
    }

    setSaving(true);

    try {
      const referenceNumber =
        certificate?.reference_number ||
        generateCertificateNumber(
          job.job_number
        );

      const now = new Date().toISOString();

      const payload = {
        job_id: job.id,

        reference_number:
          referenceNumber,

        collection_status:
          "Signed",

        collected_by:
          certificate?.collected_by ||
          (employee
            ? `${employee.first_name} ${employee.last_name}`
            : null),

        collection_date:
          certificate?.collection_date ||
          job.job_date ||
          now,

        collection_location:
          job.collection_address ||
          null,

        client_name:
          clientName.trim(),

        client_signature:
          clientSignature,

        client_signed_at:
          now,

        waste_type:
          wasteType.trim(),

        quantity_volume:
          quantityVolume.trim(),

        packaging:
          packaging.trim() || null,

        condition_at_receipt:
          conditionAtReceipt.trim() ||
          null,

        certificate_status:
          "Collection Signed",

        updated_at:
          now,
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

      setSuccess(
        "Collection has been signed successfully. The certificate is now awaiting facility sign-off."
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

    if (!certificate) {
      setError(
        "Please complete the collection sign-off first."
      );
      return;
    }

    if (!collectionSigned) {
      setError(
        "The client must sign the collection section first."
      );
      return;
    }

    if (!facilityName.trim()) {
      setError(
        "Please enter the disposal facility name."
      );
      return;
    }

    if (!facilityAddress.trim()) {
      setError(
        "Please enter the disposal facility address."
      );
      return;
    }

    if (!disposalMethod.trim()) {
      setError(
        "Please enter the disposal method."
      );
      return;
    }

    if (!disposalDate) {
      setError(
        "Please enter the disposal date."
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

    setSaving(true);

    try {
      const now = new Date().toISOString();

      const {
        data,
        error: updateError,
      } = await supabase
        .from("disposal_certificates")
        .update({
          disposal_method:
            disposalMethod.trim(),

          disposal_facility_name:
            facilityName.trim(),

          disposal_facility_address:
            facilityAddress.trim(),

          disposal_date:
            disposalDate,

          facility_representative:
            facilityRepresentative.trim(),

          facility_signature:
            facilitySignature,

          facility_signed_at:
            now,

          certificate_status:
            "Completed",

          updated_at:
            now,
        })
        .eq("id", certificate.id)
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
          completed_at: now,
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
              completed_at: now,
            }
          : current
      );

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
              certificate.collection_date
            ),

          collectionLocation:
            certificate.collection_location ||
            job.collection_address ||
            "-",

          jobType:
            job.job_type || "-",

          jobDescription:
            job.description || "-",

          wasteType:
            certificate.waste_type ||
            "-",

          quantityVolume:
            certificate.quantity_volume ||
            "-",

          packaging:
            certificate.packaging ||
            "-",

          conditionAtReceipt:
            certificate.condition_at_receipt ||
            "-",

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

          disposalMethod:
            certificate.disposal_method ||
            "-",

          disposalFacilityName:
            certificate.disposal_facility_name ||
            "-",

          disposalFacilityAddress:
            certificate.disposal_facility_address ||
            job.delivery_address ||
            "-",

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
      /*
       * IMPORTANT:
       * DisposalCertificatePDF is a DEFAULT export.
       * It must therefore be imported as:
       *
       * import DisposalCertificatePDF from "...";
       */

      const pdfDocument = (
        <DisposalCertificatePDF data={pdfData} />
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
          {error || "The job could not be found."}
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
                  Reference Number
                </p>

                <p className="mt-1 text-lg font-bold">
                  {certificate?.reference_number ||
                    generateCertificateNumber(
                      job.job_number
                    )}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Job {job.job_number}
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
                This certificate records the collection
                and disposal of waste associated with
                the job shown below. The certificate is
                completed once both the client collection
                sign-off and disposal facility sign-off
                have been recorded.
              </p>

            </div>

          </div>

        </div>

        {/* COLLECTION SECTION */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between rounded-t-2xl bg-[#111111] px-5 py-3">

            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              1. Collection
            </h3>

            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Collection
            </span>

          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">

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

            <div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Job Date
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {formatDate(
                  certificate?.collection_date ||
                    job.job_date
                )}
              </div>

            </div>

            <div className="md:col-span-2">

              <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <MapPin className="h-3.5 w-3.5" />
                Collection Address
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {certificate?.collection_location ||
                  job.collection_address ||
                  "-"}
              </div>

            </div>

            <div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Job Type
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {job.job_type || "-"}
              </div>

            </div>

            <div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Job Description
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {job.description || "-"}
              </div>

            </div>

            <div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Waste Type
              </p>

              <input
                type="text"
                value={wasteType}
                onChange={(event) =>
                  setWasteType(event.target.value)
                }
                disabled={collectionSigned}
                placeholder="e.g. General Waste, Building Rubble"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
              />

            </div>

            <div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Quantity / Volume
              </p>

              <input
                type="text"
                value={quantityVolume}
                onChange={(event) =>
                  setQuantityVolume(event.target.value)
                }
                disabled={collectionSigned}
                placeholder="e.g. 6m³"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
              />

            </div>

            <div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Packaging / Container
              </p>

              <input
                type="text"
                value={packaging}
                onChange={(event) =>
                  setPackaging(event.target.value)
                }
                disabled={collectionSigned}
                placeholder="e.g. Skip, Bags, Loose"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
              />

            </div>

            {/* COLLECTION SIGN-OFF */}

            <div className="md:col-span-2 border-t border-gray-200 pt-5">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    Collection Sign-off
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Person confirming collection of the waste.
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
                    value={clientName}
                    onChange={(event) =>
                      setClientName(event.target.value)
                    }
                    disabled={collectionSigned}
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
                  />

                </div>

                <div>

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Signature *
                  </p>

                  <SignaturePad
                    value={clientSignature}
                    onChange={setClientSignature}
                    disabled={collectionSigned}
                  />

                </div>

              </div>

              {!collectionSigned && (
                <div className="mt-5 flex justify-end border-t border-gray-100 pt-5">

                  <button
                    type="button"
                    onClick={signCollection}
                    disabled={saving}
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

        {/* DISPOSAL SECTION */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between rounded-t-2xl bg-[#111111] px-5 py-3">

            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              2. Disposal
            </h3>

            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Disposal
            </span>

          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">

            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Disposal Facility *
              </label>

              <input
                type="text"
                value={facilityName}
                onChange={(event) =>
                  setFacilityName(event.target.value)
                }
                disabled={
                  !collectionSigned ||
                  certificateCompleted
                }
                placeholder="Enter facility name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
              />

            </div>

            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Disposal Date *
              </label>

              <input
                type="date"
                value={disposalDate}
                onChange={(event) =>
                  setDisposalDate(event.target.value)
                }
                disabled={
                  !collectionSigned ||
                  certificateCompleted
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
              />

            </div>

            <div className="md:col-span-2">

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Disposal Facility Address *
              </label>

              <textarea
                value={facilityAddress}
                onChange={(event) =>
                  setFacilityAddress(event.target.value)
                }
                disabled={
                  !collectionSigned ||
                  certificateCompleted
                }
                placeholder="Enter full facility address"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
              />

            </div>

            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Disposal Method *
              </label>

              <input
                type="text"
                value={disposalMethod}
                onChange={(event) =>
                  setDisposalMethod(event.target.value)
                }
                disabled={
                  !collectionSigned ||
                  certificateCompleted
                }
                placeholder="e.g. Landfill, Recycling"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
              />

            </div>

            {/* DISPOSAL SIGN-OFF */}

            <div className="md:col-span-2 border-t border-gray-200 pt-5">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    Disposal Sign-off
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Facility representative confirming disposal.
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

                  <input
                    type="text"
                    value={facilityRepresentative}
                    onChange={(event) =>
                      setFacilityRepresentative(
                        event.target.value
                      )
                    }
                    disabled={
                      !collectionSigned ||
                      certificateCompleted
                    }
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
                  />

                </div>

                <div>

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Signature *
                  </p>

                  <SignaturePad
                    value={facilitySignature}
                    onChange={setFacilitySignature}
                    disabled={certificateCompleted}
                  />

                </div>

              </div>

              {!certificateCompleted && (
                <div className="mt-5 flex justify-end border-t border-gray-100 pt-5">

                  <button
                    type="button"
                    onClick={signFacility}
                    disabled={saving}
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
                        have been recorded. Your
                        Certificate of Disposal is
                        ready to download.
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

        {/* DOWNLOAD AREA */}

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
              onClick={downloadPDF}
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
            DDW Consolidate Pty (Ltd) t/a SkipCo
            Solutions
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