import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable."
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

/*
|--------------------------------------------------------------------------
| TIME HELPERS
|--------------------------------------------------------------------------
*/

function toMinutes(value: string): number {
  const [hours, minutes] = value
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function calculateTotalHours(
  clockIn: string,
  breakStart: string | null,
  breakEnd: string | null,
  clockOut: string
): number {
  let minutes =
    toMinutes(clockOut) -
    toMinutes(clockIn);

  // Overnight shift
  if (minutes < 0) {
    minutes += 1440;
  }

  if (breakStart && breakEnd) {
    let breakMinutes =
      toMinutes(breakEnd) -
      toMinutes(breakStart);

    if (breakMinutes < 0) {
      breakMinutes += 1440;
    }

    minutes -= breakMinutes;
  }

  if (minutes < 0) {
    minutes = 0;
  }

  return Number(
    (minutes / 60).toFixed(2)
  );
}

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const startDate =
      searchParams.get("startDate");

    const endDate =
      searchParams.get("endDate");

    const employeeId =
      searchParams.get("employeeId");

    let query = supabase
      .from("attendance")
      .select(`
        *,
        employee:employees (
          id,
          employee_number,
          first_name,
          last_name,
          job_title,
          department,
          pay_type,
          hourly_rate
        )
      `)
      .order("attendance_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (startDate) {
      query = query.gte(
        "attendance_date",
        startDate
      );
    }

    if (endDate) {
      query = query.lte(
        "attendance_date",
        endDate
      );
    }

    if (employeeId) {
      query = query.eq(
        "employee_id",
        employeeId
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "GET attendance error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attendance: data ?? [],
    });
  } catch (error) {
    console.error(
      "GET attendance exception:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load attendance.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST ATTENDANCE
|--------------------------------------------------------------------------
|
| Employee enters hours.
|
| IMPORTANT:
| This does NOT approve the attendance.
|
| It creates a "submitted" record that must
| be reviewed and signed by management.
|
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      employeeId,
      attendanceDate,
      clockIn,
      breakStart,
      breakEnd,
      clockOut,
      employeeNotes,
    } = body;

    if (!employeeId) {
      return NextResponse.json(
        {
          error:
            "Employee is required.",
        },
        { status: 400 }
      );
    }

    if (!attendanceDate) {
      return NextResponse.json(
        {
          error:
            "Attendance date is required.",
        },
        { status: 400 }
      );
    }

    if (!clockIn) {
      return NextResponse.json(
        {
          error:
            "Clock-in time is required.",
        },
        { status: 400 }
      );
    }

    if (!clockOut) {
      return NextResponse.json(
        {
          error:
            "Clock-out time is required.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EMPLOYEE
    |--------------------------------------------------------------------------
    */

    const {
      data: employee,
      error: employeeError,
    } = await supabase
      .from("employees")
      .select("id, employment_status")
      .eq("id", employeeId)
      .single();

    if (
      employeeError ||
      !employee
    ) {
      return NextResponse.json(
        {
          error:
            "The selected employee could not be found.",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PREVENT DUPLICATES
    |--------------------------------------------------------------------------
    */

    const {
      data: existingRecord,
      error: existingError,
    } = await supabase
      .from("attendance")
      .select("id, status")
      .eq(
        "employee_id",
        employeeId
      )
      .eq(
        "attendance_date",
        attendanceDate
      )
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          error:
            existingError.message,
        },
        { status: 500 }
      );
    }

    if (existingRecord) {
      return NextResponse.json(
        {
          error:
            "Attendance already exists for this employee on this date.",
        },
        { status: 409 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULATE ACTUAL HOURS ONLY
    |--------------------------------------------------------------------------
    |
    | DO NOT calculate overtime here.
    |
    | Payroll will later calculate the employee's
    | approved weekly hours and apply the 45-hour rule.
    |
    */

    const totalHours =
      calculateTotalHours(
        clockIn,
        breakStart || null,
        breakEnd || null,
        clockOut
      );

    if (totalHours <= 0) {
      return NextResponse.json(
        {
          error:
            "The calculated hours must be greater than zero.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ATTENDANCE
    |--------------------------------------------------------------------------
    */

    const {
      data,
      error,
    } = await supabase
      .from("attendance")
      .insert({
        employee_id:
          employeeId,

        attendance_date:
          attendanceDate,

        clock_in:
          clockIn,

        break_start:
          breakStart || null,

        break_end:
          breakEnd || null,

        clock_out:
          clockOut,

        /*
         * At this stage all hours are simply
         * recorded hours.
         *
         * Payroll decides normal/overtime later.
         */
        normal_hours:
          totalHours,

        overtime_hours:
          0,

        employee_notes:
          employeeNotes?.trim() ||
          null,

        status:
          "submitted",

        submitted_at:
          new Date().toISOString(),

        manager_name:
          null,

        manager_signature:
          null,

        approved_by:
          null,

        approved_at:
          null,

        management_notes:
          null,
      })
      .select(`
        *,
        employee:employees (
          id,
          employee_number,
          first_name,
          last_name,
          job_title,
          department,
          pay_type,
          hourly_rate
        )
      `)
      .single();

    if (error) {
      console.error(
        "POST attendance error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to submit attendance.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "Hours submitted for manager approval.",
        attendance: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST attendance exception:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit attendance.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT — MANAGER APPROVAL
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      attendanceId,
      action,
      managerName,
      managerSignature,
      managementNotes,
    } = body;

    if (!attendanceId) {
      return NextResponse.json(
        {
          error:
            "Attendance ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "approved" &&
      action !== "rejected"
    ) {
      return NextResponse.json(
        {
          error:
            "Action must be approved or rejected.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MANAGER SIGNATURE REQUIRED
    |--------------------------------------------------------------------------
    */

    if (action === "approved") {
      if (!managerName?.trim()) {
        return NextResponse.json(
          {
            error:
              "Manager name is required.",
          },
          { status: 400 }
        );
      }

      if (!managerSignature?.trim()) {
        return NextResponse.json(
          {
            error:
              "Manager signature is required before attendance can be approved.",
          },
          { status: 400 }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD RECORD
    |--------------------------------------------------------------------------
    */

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("attendance")
      .select("*")
      .eq("id", attendanceId)
      .single();

    if (
      existingError ||
      !existing
    ) {
      return NextResponse.json(
        {
          error:
            "Attendance record could not be found.",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LOCK APPROVED RECORDS
    |--------------------------------------------------------------------------
    */

    if (
      existing.status ===
      "approved"
    ) {
      return NextResponse.json(
        {
          error:
            "Approved attendance is locked and cannot be changed.",
        },
        { status: 400 }
      );
    }

    if (
      existing.status !==
      "submitted"
    ) {
      return NextResponse.json(
        {
          error:
            "Only submitted attendance can be reviewed.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REJECTION
    |--------------------------------------------------------------------------
    */

    if (action === "rejected") {
      const {
        data,
        error,
      } = await supabase
        .from("attendance")
        .update({
          status:
            "rejected",

          management_notes:
            managementNotes?.trim() ||
            null,

          manager_name:
            null,

          manager_signature:
            null,

          approved_by:
            null,

          approved_at:
            null,
        })
        .eq("id", attendanceId)
        .eq(
          "status",
          "submitted"
        )
        .select(`
          *,
          employee:employees (
            id,
            employee_number,
            first_name,
            last_name,
            job_title,
            department,
            pay_type,
            hourly_rate
          )
        `)
        .single();

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to reject attendance.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message:
          "Attendance rejected and returned to the employee.",
        attendance: data,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVAL
    |--------------------------------------------------------------------------
    */

    const approvalTime =
      new Date().toISOString();

    const {
      data,
      error,
    } = await supabase
      .from("attendance")
      .update({
        status:
          "approved",

        manager_name:
          managerName.trim(),

        manager_signature:
          managerSignature.trim(),

        /*
         * For now approved_by stores
         * the manager's name.
         *
         * When we connect your actual
         * authentication/roles system,
         * this can become the manager's
         * authenticated user ID.
         */
        approved_by:
          managerName.trim(),

        approved_at:
          approvalTime,

        management_notes:
          managementNotes?.trim() ||
          null,

        /*
         * IMPORTANT:
         * Approved hours remain actual
         * hours worked.
         *
         * Payroll calculates overtime.
         */
        overtime_hours:
          0,
      })
      .eq("id", attendanceId)
      .eq(
        "status",
        "submitted"
      )
      .select(`
        *,
        employee:employees (
          id,
          employee_number,
          first_name,
          last_name,
          job_title,
          department,
          pay_type,
          hourly_rate
        )
      `)
      .single();

    if (error) {
      console.error(
        "Approve attendance error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to approve attendance.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Attendance approved, signed and locked.",
      attendance: data,
    });
  } catch (error) {
    console.error(
      "PUT attendance exception:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process attendance.",
      },
      { status: 500 }
    );
  }
}