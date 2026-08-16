import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type ResetPasswordBody = {
  password?: unknown;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    // --------------------------------------------------
    // 1. Check logged-in user
    // --------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Check current user's profile
    // --------------------------------------------------

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
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

    // Only Owner can reset passwords
    if (profile.role !== "owner") {
      return NextResponse.json(
        {
          error:
            "Only the Owner can reset user passwords.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. Get target user
    // --------------------------------------------------

    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const { data: targetUser, error: targetUserError } =
      await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, is_active"
        )
        .eq("id", userId)
        .single();

    if (
      targetUserError ||
      !targetUser
    ) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Never allow Owner password to be changed
    // through this employee-management endpoint.
    if (targetUser.role === "owner") {
      return NextResponse.json(
        {
          error:
            "The Owner password cannot be changed from here.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 4. Read password
    // --------------------------------------------------

    const body =
      (await request.json()) as ResetPasswordBody;

    const password = String(
      body.password ?? ""
    ).trim();

    if (!password) {
      return NextResponse.json(
        {
          error:
            "A new password is required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Update Supabase Auth password
    // --------------------------------------------------

    const admin = createAdminClient();

    const { error: passwordError } =
      await admin.auth.admin.updateUserById(
        userId,
        {
          password,
        }
      );

    if (passwordError) {
      console.error(
        "Password reset error:",
        passwordError
      );

      return NextResponse.json(
        {
          error:
            passwordError.message ||
            "Unable to reset the password.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Audit log
    // --------------------------------------------------

    const { error: auditError } =
      await admin
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "UPDATE",
          module: "Users & Permissions",
          record_id: userId,
          record_name:
            targetUser.full_name,
          description: `Reset password for ${targetUser.email}.`,
          new_values: {
            password_reset: true,
          },
        });

    if (auditError) {
      console.error(
        "Audit log error:",
        auditError
      );
    }

    // --------------------------------------------------
    // 7. Success
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully.",
    });
  } catch (error) {
    console.error(
      "Reset password API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while resetting the password.",
      },
      { status: 500 }
    );
  }
}