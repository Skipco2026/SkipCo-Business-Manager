"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eraser,
  Loader2,
  MapPin,
  PenLine,
  Save,
} from "lucide-react";

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

interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

function SignaturePad({
  value,
  onChange,
  label = "Signature",
  disabled = false,
}: SignaturePadProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (value) {
      const image = new window.Image();

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
    }
  }, [value]);

  function getPosition(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch =
        event.touches[0];

      return {
        x:
          ((touch.clientX - rect.left) /
            rect.width) *
          canvas.width,

        y:
          ((touch.clientY - rect.top) /
            rect.height) *
          canvas.height,
      };
    }

    return {
      x:
        ((event.clientX - rect.left) /
          rect.width) *
        canvas.width,

      y:
        ((event.clientY - rect.top) /
          rect.height) *
        canvas.height,
    };
  }

  function startDrawing(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) {
    if (disabled) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const context =
      canvas?.getContext("2d");

    if (!canvas || !context) return;

    const position =
      getPosition(event);

    drawing.current = true;

    context.beginPath();

    context.moveTo(
      position.x,
      position.y
    );
  }

  function draw(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) {
    if (disabled) return;

    event.preventDefault();

    if (!drawing.current) return;

    const canvas = canvasRef.current;
    const context =
      canvas?.getContext("2d");

    if (!canvas || !context) return;

    const position =
      getPosition(event);

    context.lineTo(
      position.x,
      position.y
    );

    context.stroke();
  }

  function stopDrawing() {
    if (!drawing.current) return;

    drawing.current = false;

    const canvas = canvasRef.current;

    if (!canvas) return;

    onChange(
      canvas.toDataURL("image/png")
    );
  }

  function clearSignature() {
    if (disabled) return;

    const canvas = canvasRef.current;

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

    onChange("");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-charcoal-200 bg-white">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={900}
          height={260}
          className={`h-52 w-full touch-none bg-white ${
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
            <div className="text-center text-charcoal-300">
              <PenLine
                size={28}
                className="mx-auto mb-2"
              />

              <p className="text-sm">
                Sign here
              </p>
            </div>
          </div>
        )}

        {!value && disabled && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-charcoal-300">
              Signature required
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-charcoal-100 bg-charcoal-50 px-3 py-2">
        <p className="text-xs text-charcoal-400">
          {label}
        </p>

        {!disabled && (
          <button
            type="button"
            onClick={clearSignature}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-white hover:text-charcoal-900"
          >
            <Eraser size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DisposalCertificatePage() {
  const params = useParams();
  const router = useRouter();

  const supabase = createClient();

  const jobId = String(
    params?.id ?? ""
  );

  /* =======================================================
     STATE
  ======================================================= */

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

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     COLLECTION FORM
  ======================================================= */

  const [clientName, setClientName] =
    useState("");

  const [clientSignature, setClientSignature] =
    useState("");

  const [wasteType, setWasteType] =
    useState("");

  const [quantityVolume, setQuantityVolume] =
    useState("");

  const [packaging, setPackaging] =
    useState("");

  const [conditionAtReceipt, setConditionAtReceipt] =
    useState("");

  /* =======================================================
     FACILITY FORM
  ======================================================= */

  const [disposalMethod, setDisposalMethod] =
    useState("");

  const [facilityName, setFacilityName] =
    useState("");

  const [facilityAddress, setFacilityAddress] =
    useState("");

  const [disposalDate, setDisposalDate] =
    useState("");

  const [facilityRepresentative, setFacilityRepresentative] =
    useState("");

  const [facilitySignature, setFacilitySignature] =
    useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    async function loadCertificate() {
      if (!jobId) {
        setError(
          "No job was supplied."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        /* -----------------------------------------------
           JOB
        ------------------------------------------------ */

        const {
          data: jobData,
          error: jobError,
        } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        if (jobError) {
          throw jobError;
        }

        if (!jobData) {
          throw new Error(
            "Job not found."
          );
        }

        const jobRecord =
          jobData as Job;

        setJob(jobRecord);

        /* -----------------------------------------------
           CUSTOMER
        ------------------------------------------------ */

        if (jobRecord.customer_id) {
          const {
            data: customerData,
            error: customerError,
          } = await supabase
            .from("customers")
            .select("*")
            .eq(
              "id",
              jobRecord.customer_id
            )
            .single();

          if (
            customerError &&
            customerError.code !== "PGRST116"
          ) {
            throw customerError;
          }

          if (customerData) {
            setCustomer(
              customerData as Customer
            );
          }
        }

        /* -----------------------------------------------
           EMPLOYEE
        ------------------------------------------------ */

        if (
          jobRecord.assigned_employee_id
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
              jobRecord.assigned_employee_id
            )
            .single();

          if (
            employeeError &&
            employeeError.code !== "PGRST116"
          ) {
            throw employeeError;
          }

          if (employeeData) {
            setEmployee(
              employeeData as Employee
            );
          }
        }

        /* -----------------------------------------------
           CERTIFICATE
        ------------------------------------------------ */

        const {
          data: certificateData,
          error: certificateError,
        } = await supabase
          .from("disposal_certificates")
          .select("*")
          .eq("job_id", jobId)
          .maybeSingle();

        if (certificateError) {
          throw certificateError;
        }

        if (certificateData) {
          const certificateRecord =
            certificateData as DisposalCertificate;

          setCertificate(
            certificateRecord
          );

          /* Collection */

          setClientName(
            certificateRecord.client_name ??
              ""
          );

          setClientSignature(
            certificateRecord.client_signature ??
              ""
          );

          setWasteType(
            certificateRecord.waste_type ??
              ""
          );

          setQuantityVolume(
            certificateRecord.quantity_volume ??
              ""
          );

          setPackaging(
            certificateRecord.packaging ??
              ""
          );

          setConditionAtReceipt(
            certificateRecord.condition_at_receipt ??
              ""
          );

          /* Facility */

          setDisposalMethod(
            certificateRecord.disposal_method ??
              ""
          );

          setFacilityName(
            certificateRecord.disposal_facility_name ??
              ""
          );

          setFacilityAddress(
            certificateRecord.disposal_facility_address ??
              jobRecord.delivery_address ??
              ""
          );

          if (
            certificateRecord.disposal_date
          ) {
            const date =
              new Date(
                certificateRecord.disposal_date
              );

            if (
              !Number.isNaN(
                date.getTime()
              )
            ) {
              setDisposalDate(
                date
                  .toISOString()
                  .slice(0, 10)
              );
            }
          }

          setFacilityRepresentative(
            certificateRecord.facility_representative ??
              ""
          );

          setFacilitySignature(
            certificateRecord.facility_signature ??
              ""
          );
        } else {
          /* Pre-fill facility address from job */

          if (jobRecord.delivery_address) {
            setFacilityAddress(
              jobRecord.delivery_address
            );
          }
        }
      } catch (err) {
        console.error(
          "Certificate loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load certificate."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCertificate();
  }, [jobId]);

  /* =======================================================
     SIGN COLLECTION
  ======================================================= */

  async function signCollection() {
    if (!job) return;

    setError("");
    setSuccess("");

    if (!clientName.trim()) {
      setError(
        "Please enter the client's name."
      );

      return;
    }

    if (!clientSignature) {
      setError(
        "The client must sign the collection certificate."
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
        "Please enter the quantity or volume collected."
      );

      return;
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const referenceNumber =
        certificate?.reference_number ??
        generateCertificateNumber(
          job.job_number
        );

      const payload = {
        job_id: job.id,

        reference_number:
          referenceNumber,

        collection_status:
          "Signed",

        collected_by:
          employee
            ? `${employee.first_name} ${employee.last_name}`
            : null,

        collection_date:
          now,

        collection_location:
          job.collection_address,

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
        error: saveError,
      } = await supabase
        .from("disposal_certificates")
        .upsert(
          payload,
          {
            onConflict:
              "job_id",
          }
        )
        .select("*")
        .single();

      if (saveError) {
        throw saveError;
      }

      setCertificate(
        data as DisposalCertificate
      );

      setSuccess(
        "Client collection signed successfully. The job remains in progress until the disposal facility signs the certificate."
      );
    } catch (err) {
      console.error(
        "Collection certificate save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the collection certificate."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     COMPLETE FACILITY SIGN-OFF
  ======================================================= */

  async function signFacility() {
    if (!job) return;

    setError("");
    setSuccess("");

    /*
      IMPORTANT:
      The client must have signed first.
    */

    if (!clientSignature) {
      setError(
        "The client collection must be signed before the waste can be completed."
      );

      return;
    }

    if (
      certificate?.collection_status !==
      "Signed"
    ) {
      setError(
        "The client collection has not been signed."
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
        "The disposal facility representative must sign the certificate."
      );

      return;
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      /*
        STEP 1
        Save the completed certificate.
      */

      const {
        data: certificateData,
        error: certificateError,
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
            new Date(
              `${disposalDate}T12:00:00`
            ).toISOString(),

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
        .eq("id", certificate?.id)
        .eq("job_id", job.id)
        .select("*")
        .single();

      if (certificateError) {
        throw certificateError;
      }

      if (!certificateData) {
        throw new Error(
          "The disposal certificate could not be completed."
        );
      }

      /*
        STEP 2
        Only AFTER the certificate has both signatures,
        mark the job as completed.
      */

      const {
        data: updatedJob,
        error: jobError,
      } = await supabase
        .from("jobs")
        .update({
          status: "Completed",
          completed: true,
          completed_at: now,
        })
        .eq("id", job.id)
        .select("*")
        .single();

      if (jobError) {
        /*
          The certificate has been completed but the job
          update failed. We throw the error so the user
          knows something needs attention.
        */

        throw jobError;
      }

      if (!updatedJob) {
        throw new Error(
          "The certificate was completed, but the job could not be updated."
        );
      }

      setCertificate(
        certificateData as DisposalCertificate
      );

      setJob(
        updatedJob as Job
      );

      setSuccess(
        "Disposal facility sign-off recorded successfully. The certificate is complete and the job has been completed."
      );
    } catch (err) {
      console.error(
        "Facility sign-off error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the disposal certificate."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DashboardShell
        title="Disposal Certificate"
        subtitle="Job certificate"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-charcoal-500">
            <Loader2
              size={22}
              className="animate-spin"
            />

            Loading certificate...
          </div>
        </div>
      </DashboardShell>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !job) {
    return (
      <DashboardShell
        title="Disposal Certificate"
        subtitle="Job certificate"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </DashboardShell>
    );
  }

  if (!job) {
    return null;
  }

  /* =======================================================
     STATUS
  ======================================================= */

  const collectionSigned =
    certificate?.collection_status ===
    "Signed";

  const facilitySigned =
    Boolean(
      certificate?.facility_signature
    );

  const certificateCompleted =
    certificate?.certificate_status ===
      "Completed" &&
    collectionSigned &&
    facilitySigned;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardShell
      title="Disposal Certificate"
      subtitle={`${job.job_number} · Certificate`}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-charcoal-500 hover:text-charcoal-900"
          >
            <ArrowLeft size={16} />
            Back to Job
          </button>

          <h1 className="text-2xl font-bold text-charcoal-900">
            Disposal Certificate
          </h1>

          <p className="mt-1 text-sm text-charcoal-500">
            {job.job_number}
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            certificateCompleted
              ? "bg-green-100 text-green-700"
              : collectionSigned
                ? "bg-yellow-100 text-yellow-700"
                : "bg-charcoal-100 text-charcoal-600"
          }`}
        >
          {certificateCompleted ? (
            <>
              <Check size={16} />
              Certificate Completed
            </>
          ) : collectionSigned ? (
            <>
              <Loader2 size={16} />
              Awaiting Facility Sign-off
            </>
          ) : (
            "Awaiting Collection"
          )}
        </div>
      </div>

      {/* ===================================================
          ALERTS
      =================================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{success}</span>
        </div>
      )}

      {/* ===================================================
          CERTIFICATE
      =================================================== */}

      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-sm">

        {/* -------------------------------------------------
            CERTIFICATE HEADER
        ------------------------------------------------- */}

        <div className="border-b-4 border-cyan-500 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                Skip Co Solutions
              </p>

              <h2 className="mt-2 text-3xl font-bold uppercase tracking-wide text-charcoal-900">
                Disposal Certificate
              </h2>

              <p className="mt-2 text-sm text-charcoal-500">
                Waste Collection & Disposal Record
              </p>
            </div>

            <div className="rounded-xl bg-charcoal-50 px-5 py-4 sm:text-right">
              <p className="text-xs uppercase tracking-wide text-charcoal-400">
                Certificate No.
              </p>

              <p className="mt-1 font-bold text-charcoal-900">
                {certificate?.reference_number ??
                  generateCertificateNumber(
                    job.job_number
                  )}
              </p>

              <p className="mt-2 text-xs text-charcoal-500">
                Job: {job.job_number}
              </p>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            JOB INFORMATION
        ------------------------------------------------- */}

        <div className="grid gap-6 border-b border-charcoal-100 p-6 sm:p-8 md:grid-cols-2">

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cyan-600">
              Client / Collection
            </p>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-charcoal-400">
                  Client
                </p>

                <p className="font-semibold text-charcoal-900">
                  {customer?.trading_name ||
                    customer?.company_name ||
                    "Client"}
                </p>
              </div>

              <div>
                <p className="text-xs text-charcoal-400">
                  Collection Address
                </p>

                <p className="flex items-start gap-2 text-sm text-charcoal-700">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-cyan-600"
                  />

                  {job.collection_address ||
                    "-"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cyan-600">
              Job Information
            </p>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-charcoal-400">
                  Job Type
                </p>

                <p className="font-semibold text-charcoal-900">
                  {job.job_type || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-charcoal-400">
                  Job Date
                </p>

                <p className="text-sm text-charcoal-700">
                  {formatDate(
                    job.job_date
                  )}
                </p>
              </div>

              {job.description && (
                <div>
                  <p className="text-xs text-charcoal-400">
                    Description
                  </p>

                  <p className="text-sm text-charcoal-700">
                    {job.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            WASTE DETAILS
        ------------------------------------------------- */}

        <div className="border-b border-charcoal-100 p-6 sm:p-8">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
              Waste Collection Details
            </p>

            <p className="mt-1 text-sm text-charcoal-500">
              Record what was collected from the client.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Waste Type
              </label>

              <input
                type="text"
                value={wasteType}
                onChange={(event) =>
                  setWasteType(
                    event.target.value
                  )
                }
                disabled={
                  collectionSigned ||
                  certificateCompleted
                }
                placeholder="e.g. Recycling waste"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Quantity / Volume
              </label>

              <input
                type="text"
                value={quantityVolume}
                onChange={(event) =>
                  setQuantityVolume(
                    event.target.value
                  )
                }
                disabled={
                  collectionSigned ||
                  certificateCompleted
                }
                placeholder="e.g. 2 recycling bins"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Packaging / Container
              </label>

              <input
                type="text"
                value={packaging}
                onChange={(event) =>
                  setPackaging(
                    event.target.value
                  )
                }
                disabled={
                  collectionSigned ||
                  certificateCompleted
                }
                placeholder="e.g. Wheelie bins"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Condition at Collection
              </label>

              <input
                type="text"
                value={conditionAtReceipt}
                onChange={(event) =>
                  setConditionAtReceipt(
                    event.target.value
                  )
                }
                disabled={
                  collectionSigned ||
                  certificateCompleted
                }
                placeholder="e.g. Good / Sealed / As received"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            CLIENT SIGN-OFF
        ------------------------------------------------- */}

        <div className="border-b border-charcoal-100 p-6 sm:p-8">

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                Collection Confirmation
              </p>

              <h3 className="mt-1 text-lg font-bold text-charcoal-900">
                Client Sign-off
              </h3>

              <p className="mt-1 text-sm text-charcoal-500">
                The client confirms that the waste listed above was collected.
              </p>
            </div>

            {collectionSigned && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                <Check size={14} />
                Client Signed
              </span>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
              Client / Representative Name
            </label>

            <input
              type="text"
              value={clientName}
              onChange={(event) =>
                setClientName(
                  event.target.value
                )
              }
              disabled={
                collectionSigned ||
                certificateCompleted
              }
              placeholder="Enter client's full name"
              className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
            />
          </div>

          <SignaturePad
            value={clientSignature}
            onChange={setClientSignature}
            label="Client signature"
            disabled={
              collectionSigned ||
              certificateCompleted
            }
          />

          {certificate?.client_signed_at && (
            <p className="mt-3 text-xs text-charcoal-400">
              Signed on{" "}
              {formatDateTime(
                certificate.client_signed_at
              )}
            </p>
          )}

          {!collectionSigned &&
            !certificateCompleted && (
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={signCollection}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  Sign & Confirm Collection
                </button>
              </div>
            )}
        </div>

        {/* -------------------------------------------------
            FACILITY SIGN-OFF
        ------------------------------------------------- */}

        <div className="border-b border-charcoal-100 p-6 sm:p-8">

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                Disposal Confirmation
              </p>

              <h3 className="mt-1 text-lg font-bold text-charcoal-900">
                Disposal Facility Sign-off
              </h3>

              <p className="mt-1 text-sm text-charcoal-500">
                The facility confirms that the waste was received for proper disposal.
              </p>
            </div>

            {facilitySigned && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                <Check size={14} />
                Facility Signed
              </span>
            )}
          </div>

          {!collectionSigned && (
            <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-900">
                Client collection sign-off required
              </p>

              <p className="mt-1 text-sm text-yellow-800">
                The disposal facility section becomes available after the client has signed the collection.
              </p>
            </div>
          )}

          <div
            className={`grid gap-5 md:grid-cols-2 ${
              !collectionSigned
                ? "opacity-60"
                : ""
            }`}
          >

            {/* FACILITY NAME */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Disposal Facility Name
              </label>

              <input
                type="text"
                value={facilityName}
                onChange={(event) =>
                  setFacilityName(
                    event.target.value
                  )
                }
                disabled={
                  !collectionSigned ||
                  facilitySigned ||
                  certificateCompleted
                }
                placeholder="e.g. Mangaung Recycling Centre"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>

            {/* FACILITY ADDRESS */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Facility Address
              </label>

              <input
                type="text"
                value={facilityAddress}
                onChange={(event) =>
                  setFacilityAddress(
                    event.target.value
                  )
                }
                disabled={
                  !collectionSigned ||
                  facilitySigned ||
                  certificateCompleted
                }
                placeholder="Enter disposal facility address"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>

            {/* DISPOSAL METHOD */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Disposal Method
              </label>

              <select
                value={disposalMethod}
                onChange={(event) =>
                  setDisposalMethod(
                    event.target.value
                  )
                }
                disabled={
                  !collectionSigned ||
                  facilitySigned ||
                  certificateCompleted
                }
                className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              >
                <option value="">
                  Select disposal method
                </option>

                <option value="Recycling">
                  Recycling
                </option>

                <option value="Landfill">
                  Landfill
                </option>

                <option value="Waste Transfer">
                  Waste Transfer
                </option>

                <option value="Composting">
                  Composting
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            {/* DISPOSAL DATE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Disposal Date
              </label>

              <input
                type="date"
                value={disposalDate}
                onChange={(event) =>
                  setDisposalDate(
                    event.target.value
                  )
                }
                disabled={
                  !collectionSigned ||
                  facilitySigned ||
                  certificateCompleted
                }
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>

            {/* REPRESENTATIVE */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-charcoal-700">
                Facility Representative
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
                  facilitySigned ||
                  certificateCompleted
                }
                placeholder="Enter the name of the person receiving the waste"
                className="w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 disabled:bg-charcoal-50"
              />
            </div>

            {/* FACILITY SIGNATURE */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-charcoal-700">
                Facility Representative Signature
              </label>

              <SignaturePad
                value={facilitySignature}
                onChange={
                  setFacilitySignature
                }
                label="Facility representative signature"
                disabled={
                  !collectionSigned ||
                  facilitySigned ||
                  certificateCompleted
                }
              />
            </div>
          </div>

          {certificate?.facility_signed_at && (
            <p className="mt-3 text-xs text-charcoal-400">
              Facility signed on{" "}
              {formatDateTime(
                certificate.facility_signed_at
              )}
            </p>
          )}

          {collectionSigned &&
            !facilitySigned &&
            !certificateCompleted && (
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={signFacility}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={17} />
                  )}

                  Sign & Complete Disposal
                </button>
              </div>
            )}

          {certificateCompleted && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2 text-green-700">
                  <Check size={18} />
                </div>

                <div>
                  <h3 className="font-semibold text-green-900">
                    Disposal Certificate Completed
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-green-800">
                    The client has signed for collection
                    and the disposal facility has signed
                    for receipt and proper disposal.
                    This job has now been completed.
                  </p>

                  <div className="mt-3 text-xs text-green-700">
                    Certificate:{" "}
                    {certificate.reference_number}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* -------------------------------------------------
            DISPOSAL STATUS
        ------------------------------------------------- */}

        {!certificateCompleted && (
          <div className="bg-charcoal-50 p-6 sm:p-8">
            <div
              className={`rounded-xl border p-5 ${
                collectionSigned
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-charcoal-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                {collectionSigned ? (
                  <Loader2
                    size={20}
                    className="mt-0.5 shrink-0 text-yellow-600"
                  />
                ) : (
                  <PenLine
                    size={20}
                    className="mt-0.5 shrink-0 text-charcoal-400"
                  />
                )}

                <div>
                  <h3
                    className={`font-semibold ${
                      collectionSigned
                        ? "text-yellow-900"
                        : "text-charcoal-900"
                    }`}
                  >
                    {collectionSigned
                      ? "Disposal facility sign-off required"
                      : "Client collection sign-off required"}
                  </h3>

                  <p
                    className={`mt-1 text-sm leading-6 ${
                      collectionSigned
                        ? "text-yellow-800"
                        : "text-charcoal-600"
                    }`}
                  >
                    {collectionSigned
                      ? "The client collection has been recorded, but this job cannot be completed yet. The waste must be delivered to the disposal or recycling facility and signed for by the facility representative."
                      : "The client must first sign to confirm that the waste was collected. The job will remain in progress until the disposal facility signs for receipt."}
                  </p>

                  {collectionSigned &&
                    job.delivery_address && (
                      <p className="mt-3 text-sm font-medium text-yellow-900">
                        Drop-off point:{" "}
                        {job.delivery_address}
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------
            COMPLETED STATUS
        ------------------------------------------------- */}

        {certificateCompleted && (
          <div className="bg-green-50 p-6 sm:p-8">
            <div className="rounded-xl border border-green-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2 text-green-700">
                  <Check size={20} />
                </div>

                <div>
                  <h3 className="font-semibold text-green-900">
                    Job Completed
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-green-800">
                    Both required signatures have been
                    recorded. The disposal certificate is
                    complete and the job has been marked as
                    completed.
                  </p>

                  {job.completed_at && (
                    <p className="mt-3 text-xs text-green-700">
                      Completed on{" "}
                      {formatDateTime(
                        job.completed_at
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------
            CERTIFICATE FOOTER
        ------------------------------------------------- */}

        <div className="border-t border-charcoal-200 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-2 text-xs text-charcoal-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Skip Co Solutions · Waste Collection &
              Disposal
            </p>

            <p>
              Job {job.job_number}
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}