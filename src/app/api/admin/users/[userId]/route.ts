import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type UpdateBody = {
  fullName?: unknown;
  email?: unknown;
  role?: unknown;
  isActive?: unknown;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const supabase = await createClient();

    // --------------------------------------------------
    // 1. Check logged-in user
    // --------------------------------------------------

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

    const { data: currentProfile, error: currentProfileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

    if (
      currentProfileError ||
      !currentProfile ||
      !currentProfile.is_active
    ) {
      return NextResponse.json(
        { error: "Your account is not authorised." },
        { status: 403 }
      );
    }

    // Only Owner can manage users
    if (currentProfile.role !== "owner") {
      return NextResponse.json(
        {
          error:
            "Only the Owner can manage user accounts.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. Get target user ID
    // --------------------------------------------------

    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Get target user
    // --------------------------------------------------

    const { data: targetUser, error: targetUserError } =
      await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, is_active"
        )
        .eq("id", userId)
        .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Owner account cannot be modified
    if (targetUser.role === "owner") {
      return NextResponse.json(
        {
          error:
            "The Owner account cannot be modified.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 5. Read request
    // --------------------------------------------------

    const body = (await request.json()) as UpdateBody;

    const admin = createAdminClient();

    // --------------------------------------------------
    // 6. Prepare updates
    // --------------------------------------------------

    const updates: {
      full_name?: string;
      email?: string;
      role?: string;
      is_active?: boolean;
    } = {};

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    // --------------------------------------------------
    // Full name
    // --------------------------------------------------

    if (body.fullName !== undefined) {
      const fullName = String(body.fullName).trim();

      if (!fullName) {
        return NextResponse.json(
          { error: "Full name cannot be empty." },
          { status: 400 }
        );
      }

      if (fullName !== targetUser.full_name) {
        updates.full_name = fullName;

        oldValues.full_name = targetUser.full_name;
        newValues.full_name = fullName;
      }
    }

    // --------------------------------------------------
    // Email
    // --------------------------------------------------

    if (body.email !== undefined) {
      const email = String(body.email)
        .trim()
        .toLowerCase();

      if (!email) {
        return NextResponse.json(
          { error: "Email address cannot be empty." },
          { status: 400 }
        );
      }

      if (email !== targetUser.email) {
        // Check whether another profile already uses it
        const { data: existingUser } = await admin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .neq("id", userId)
          .maybeSingle();

        if (existingUser) {
          return NextResponse.json(
            {
              error:
                "Another user already uses this email address.",
            },
            { status: 400 }
          );
        }

        updates.email = email;

        oldValues.email = targetUser.email;
        newValues.email = email;

        // Update Supabase Auth email as well
        const { error: authEmailError } =
          await admin.auth.admin.updateUserById(
            userId,
            {
              email,
              email_confirm: true,
            }
          );

        if (authEmailError) {
          return NextResponse.json(
            {
              error:
                authEmailError.message ||
                "Unable to update the login email.",
            },
            { status: 400 }
          );
        }
      }
    }

    // --------------------------------------------------
    // Role
    // --------------------------------------------------

    if (body.role !== undefined) {
      const role = String(body.role).trim();

      if (!role) {
        return NextResponse.json(
          { error: "A role is required." },
          { status: 400 }
        );
      }

      const { data: selectedRole, error: roleError } =
        await admin
          .from("roles")
          .select("id, name")
          .eq("name", role)
          .single();

      if (roleError || !selectedRole) {
        return NextResponse.json(
          {
            error:
              "The selected role does not exist.",
          },
          { status: 400 }
        );
      }

      if (role !== targetUser.role) {
        updates.role = role;

        oldValues.role = targetUser.role;
        newValues.role = role;

        // Update profile role
        const { error: profileRoleError } =
          await admin
            .from("profiles")
            .update({
              role,
            })
            .eq("id", userId);

        if (profileRoleError) {
          return NextResponse.json(
            {
              error:
                "Unable to update the user's role.",
            },
            { status: 500 }
          );
        }

        // Remove existing role assignments
        const { error: deleteRoleError } =
          await admin
            .from("user_roles")
            .delete()
            .eq("user_id", userId);

        if (deleteRoleError) {
          return NextResponse.json(
            {
              error:
                "Unable to update the user's role assignment.",
            },
            { status: 500 }
          );
        }

        // Add new role assignment
        const { error: insertRoleError } =
          await admin
            .from("user_roles")
            .insert({
              user_id: userId,
              role_id: selectedRole.id,
            });

        if (insertRoleError) {
          return NextResponse.json(
            {
              error:
                "Unable to assign the new role.",
            },
            { status: 500 }
          );
        }
      }
    }

    // --------------------------------------------------
    // Active / Disabled
    // --------------------------------------------------

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          {
            error:
              "isActive must be true or false.",
          },
          { status: 400 }
        );
      }

      if (body.isActive !== targetUser.is_active) {
        updates.is_active = body.isActive;

        oldValues.is_active = targetUser.is_active;
        newValues.is_active = body.isActive;
      }
    }

    // --------------------------------------------------
    // 7. Update profile
    // --------------------------------------------------

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await admin
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json(
          {
            error: updateError.message,
          },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------
    // 8. Update Auth metadata
    // --------------------------------------------------

    if (
      updates.full_name !== undefined
    ) {
      const { error: metadataError } =
        await admin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              full_name: updates.full_name,
            },
          }
        );

      if (metadataError) {
        console.error(
          "Auth metadata update error:",
          metadataError
        );
      }
    }

    // --------------------------------------------------
    // 9. Audit log
    // --------------------------------------------------

    if (Object.keys(newValues).length > 0) {
      const changedFields =
        Object.keys(newValues).join(", ");

      const { error: auditError } =
        await admin.from("audit_logs").insert({
          user_id: user.id,
          action: "UPDATE",
          module: "Users & Permissions",
          record_id: userId,
          record_name:
            updates.full_name ??
            targetUser.full_name,
          description: `Updated user ${targetUser.email}: ${changedFields}.`,
          old_values: oldValues,
          new_values: newValues,
        });

      if (auditError) {
        console.error(
          "Audit log error:",
          auditError
        );
      }
    }

    // --------------------------------------------------
    // 10. Return updated user
    // --------------------------------------------------

    const { data: updatedUser } = await admin
      .from("profiles")
      .select(
        "id, full_name, email, role, is_active, created_at"
      )
      .eq("id", userId)
      .single();

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update user API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating the user.",
      },
      { status: 500 }
    );
  }
}