import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AttendanceAction = "approved" | "rejected";

type AttendanceBody = {
  employeeId?: unknown;
  attendanceDate?: unknown;
  clockIn?: unknown;
  breakStart?: unknown;
  breakEnd?: unknown;
  clockOut?: unknown;
  employeeNotes?: unknown;
  attendanceId?: unknown;
  action?: unknown;
  managementNotes?: unknown;
};

function calculateHours(
  clockIn: string,
  breakStart: string,
  breakEnd: string,
  clockOut: string
) {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);

    return hours * 60 + minutes;
  };

  let minutes = toMinutes(clockOut) - toMinutes(clockIn);

  if (minutes < 0) {
    minutes += 24 * 60;
  }

  if (breakStart && breakEnd) {
    let breakMinutes =
      toMinutes(breakEnd) - toMinutes(breakStart);

    if (breakMinutes < 0) {
      breakMinutes += 24 * 60;
    }

    minutes -= breakMinutes;
  }

  if (minutes < 0) {
    minutes = 0;
  }

  const total = minutes / 60;

  const normal = Math.min(total, 8);

  const overtime = Math.max(total - 8, 0);

  return {
    normal_hours: Math.round(normal * 100) / 100,
    overtime_hours: Math.round(overtime * 100) / 100,
  };
}

/* =========================================================
   GET ATTENDANCE
========================================================= */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      !profile.is_active
    ) {
      return NextResponse.json(
        {
          error: "Your account is not authorised.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const startDate =
      searchParams.get("startDate");

    const endDate =
      searchParams.get("endDate");

    let query = supabase
      .from("attendance")
      .select(`
        id,
        employee_id,
        attendance_date,
        clock_in,
        break_start,
        break_end,
        clock_out,
        normal_hours,
        overtime_hours,
        employee_notes,
        status,
        submitted_at,
        approved_by,
        approved_at,
        management_notes,
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

    const {
      data: attendance,
      error: attendanceError,
    } = await query;

    if (attendanceError) {
      console.error(
        "Attendance load error:",
        attendanceError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load attendance records.",
          details: attendanceError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attendance: attendance ?? [],
    });
  } catch (error) {
    console.error(
      "Attendance GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while loading attendance.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST ATTENDANCE
========================================================= */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      !profile.is_active
    ) {
      return NextResponse.json(
        {
          error: "Your account is not authorised.",
        },
        { status: 403 }
      );
    }

    const body =
      (await request.json()) as AttendanceBody;

    const employeeId = String(
      body.employeeId ?? ""
    ).trim();

    const attendanceDate = String(
      body.attendanceDate ?? ""
    ).trim();

    const clockIn = String(
      body.clockIn ?? ""
    ).trim();

    const breakStart = String(
      body.breakStart ?? ""
    ).trim();

    const breakEnd = String(
      body.breakEnd ?? ""
    ).trim();

    const clockOut = String(
      body.clockOut ?? ""
    ).trim();

    const employeeNotes = String(
      body.employeeNotes ?? ""
    ).trim();

    if (!employeeId) {
      return NextResponse.json(
        {
          error: "Employee is required.",
        },
        { status: 400 }
      );
    }

    if (!attendanceDate) {
      return NextResponse.json(
        {
          error: "Attendance date is required.",
        },
        { status: 400 }
      );
    }

    if (!clockIn) {
      return NextResponse.json(
        {
          error: "Clock-in time is required.",
        },
        { status: 400 }
      );
    }

    if (!clockOut) {
      return NextResponse.json(
        {
          error: "Clock-out time is required.",
        },
        { status: 400 }
      );
    }

    if (
      (breakStart && !breakEnd) ||
      (!breakStart && breakEnd)
    ) {
      return NextResponse.json(
        {
          error:
            "Both break start and break end are required.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------
       Make sure employee exists
    --------------------------------------------- */

    const { data: employee, error: employeeError } =
      await supabase
        .from("employees")
        .select(
          "id, employee_number, first_name, last_name, employment_status"
        )
        .eq("id", employeeId)
        .single();

    if (
      employeeError ||
      !employee
    ) {
      return NextResponse.json(
        {
          error: "Employee could not be found.",
        },
        { status: 404 }
      );
    }

    /* ---------------------------------------------
       Check duplicate attendance
    --------------------------------------------- */

    const {
      data: existingAttendance,
      error: existingError,
    } = await supabase
      .from("attendance")
      .select("id, status")
      .eq("employee_id", employeeId)
      .eq(
        "attendance_date",
        attendanceDate
      )
      .maybeSingle();

    if (existingError) {
      console.error(
        "Attendance duplicate check error:",
        existingError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check existing attendance.",
          details: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existingAttendance) {
      if (
        existingAttendance.status ===
        "rejected"
      ) {
        /*
         * Rejected records are allowed to be
         * submitted again.
         */
      } else {
        return NextResponse.json(
          {
            error:
              "Attendance for this employee and date already exists.",
          },
          { status: 409 }
        );
      }
    }

    const hours = calculateHours(
      clockIn,
      breakStart,
      breakEnd,
      clockOut
    );

    const admin =
      createAdminClient();

    /* ---------------------------------------------
       If rejected, update existing record
       instead of creating duplicate
    --------------------------------------------- */

    let attendanceRecord;

    if (
      existingAttendance &&
      existingAttendance.status ===
        "rejected"
    ) {
      const {
        data,
        error,
      } = await admin
        .from("attendance")
        .update({
          clock_in: clockIn,
          break_start:
            breakStart || null,
          break_end:
            breakEnd || null,
          clock_out: clockOut,
          normal_hours:
            hours.normal_hours,
          overtime_hours:
            hours.overtime_hours,
          employee_notes:
            employeeNotes || null,
          status: "submitted",
          submitted_at:
            new Date().toISOString(),
          approved_by: null,
          approved_at: null,
          management_notes: null,
        })
        .eq(
          "id",
          existingAttendance.id
        )
        .select()
        .single();

      if (error) {
        console.error(
          "Attendance resubmission error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to resubmit attendance.",
            details: error.message,
          },
          { status: 500 }
        );
      }

      attendanceRecord = data;
    } else {
      const {
        data,
        error,
      } = await admin
        .from("attendance")
        .insert({
          employee_id: employeeId,
          attendance_date:
            attendanceDate,
          clock_in: clockIn,
          break_start:
            breakStart || null,
          break_end:
            breakEnd || null,
          clock_out: clockOut,
          normal_hours:
            hours.normal_hours,
          overtime_hours:
            hours.overtime_hours,
          employee_notes:
            employeeNotes || null,
          status: "submitted",
          submitted_at:
            new Date().toISOString(),
          submitted_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Attendance insert error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to submit attendance.",
            details: error.message,
          },
          { status: 500 }
        );
      }

      attendanceRecord = data;
    }

    /* ---------------------------------------------
       Audit log
    --------------------------------------------- */

    const { error: auditError } =
      await admin
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "CREATE",
          module: "Employees - Attendance",
          record_id:
            attendanceRecord.id,
          record_name:
            `${employee.first_name} ${employee.last_name} - ${attendanceDate}`,
          description:
            `Submitted attendance for ${employee.employee_number} on ${attendanceDate}.`,
          new_values: {
            employee_id: employeeId,
            attendance_date:
              attendanceDate,
            clock_in: clockIn,
            break_start:
              breakStart || null,
            break_end:
              breakEnd || null,
            clock_out: clockOut,
            normal_hours:
              hours.normal_hours,
            overtime_hours:
              hours.overtime_hours,
            status: "submitted",
          },
        });

    if (auditError) {
      console.error(
        "Attendance audit log error:",
        auditError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Attendance submitted for management approval.",
        attendance: attendanceRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Attendance POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while submitting attendance.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT - MANAGEMENT APPROVAL / REJECTION
========================================================= */

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, role, is_active"
      )
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !profile.is_active
    ) {
      return NextResponse.json(
        {
          error:
            "Your account is not authorised.",
        },
        { status: 403 }
      );
    }

    /*
     * Only management can approve
     * attendance.
     *
     * Owner / Manager are allowed.
     */

    const managementRoles = [
      "owner",
      "manager",
      "admin",
    ];

    if (
      !managementRoles.includes(
        String(profile.role).toLowerCase()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only management can approve attendance.",
        },
        { status: 403 }
      );
    }

    const body =
      (await request.json()) as AttendanceBody;

    const attendanceId = String(
      body.attendanceId ?? ""
    ).trim();

    const action =
      String(
        body.action ?? ""
      ).trim() as AttendanceAction;

    const managementNotes =
      String(
        body.managementNotes ?? ""
      ).trim();

    if (!attendanceId) {
      return NextResponse.json(
        {
          error:
            "Attendance record is required.",
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
            "Invalid attendance action.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    /* ---------------------------------------------
       Get attendance record
    --------------------------------------------- */

    const {
      data: attendanceRecord,
      error: attendanceError,
    } = await admin
      .from("attendance")
      .select(`
        id,
        employee_id,
        attendance_date,
        normal_hours,
        overtime_hours,
        status,
        employee:employees (
          employee_number,
          first_name,
          last_name
        )
      `)
      .eq("id", attendanceId)
      .single();

    if (
      attendanceError ||
      !attendanceRecord
    ) {
      return NextResponse.json(
        {
          error:
            "Attendance record could not be found.",
        },
        { status: 404 }
      );
    }

    /* ---------------------------------------------
       Prevent changing approved records
    --------------------------------------------- */

    if (
      attendanceRecord.status ===
      "approved"
    ) {
      return NextResponse.json(
        {
          error:
            "Approved attendance is locked and cannot be changed.",
        },
        { status: 409 }
      );
    }

    /* ---------------------------------------------
       Only submitted records can be reviewed
    --------------------------------------------- */

    if (
      attendanceRecord.status !==
      "submitted"
    ) {
      return NextResponse.json(
        {
          error:
            "Only submitted attendance can be approved or rejected.",
        },
        { status: 409 }
      );
    }

    const newStatus =
      action === "approved"
        ? "approved"
        : "rejected";

    const updateData: Record<
      string,
      unknown
    > = {
      status: newStatus,
      management_notes:
        managementNotes || null,
    };

    if (action === "approved") {
      updateData.approved_by =
        user.id;

      updateData.approved_at =
        new Date().toISOString();
    } else {
      updateData.approved_by =
        null;

      updateData.approved_at =
        null;
    }

    const {
      data: updatedAttendance,
      error: updateError,
    } = await admin
      .from("attendance")
      .update(updateData)
      .eq(
        "id",
        attendanceId
      )
      .select()
      .single();

    if (updateError) {
      console.error(
        "Attendance approval error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to update attendance.",
          details:
            updateError.message,
        },
        { status: 500 }
      );
    }

    /* ---------------------------------------------
       Audit log
    --------------------------------------------- */

    const employee =
      Array.isArray(
        attendanceRecord.employee
      )
        ? attendanceRecord.employee[0]
        : attendanceRecord.employee;

    const employeeName =
      employee
        ? `${employee.first_name} ${employee.last_name}`
        : attendanceRecord.employee_id;

    const { error: auditError } =
      await admin
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action:
            action === "approved"
              ? "APPROVE"
              : "REJECT",
          module:
            "Employees - Attendance",
          record_id:
            attendanceId,
          record_name:
            `${employeeName} - ${attendanceRecord.attendance_date}`,
          description:
            action === "approved"
              ? `Approved and signed attendance for ${employeeName}.`
              : `Rejected attendance for ${employeeName}.`,
          new_values: {
            status: newStatus,
            management_notes:
              managementNotes ||
              null,
            approved_by:
              action === "approved"
                ? user.id
                : null,
            approved_at:
              action === "approved"
                ? new Date().toISOString()
                : null,
          },
        });

    if (auditError) {
      console.error(
        "Attendance approval audit error:",
        auditError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approved"
          ? "Attendance approved and signed."
          : "Attendance rejected and returned to the employee.",
      attendance:
        updatedAttendance,
    });
  } catch (error) {
    console.error(
      "Attendance PUT error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating attendance.",
      },
      { status: 500 }
    );
  }
}