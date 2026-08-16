import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CreateUserBody = {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Check currently logged-in user
    // --------------------------------------------------

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
          error: "Your account is not authorised.",
        },
        { status: 403 }
      );
    }

    // Only Owner can create users
    if (profile.role !== "owner") {
      return NextResponse.json(
        {
          error: "Only the Owner can create users.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. Read submitted information
    // --------------------------------------------------

    const body =
      (await request.json()) as CreateUserBody;

    const fullName = String(
      body.fullName ?? ""
    ).trim();

    const email = String(
      body.email ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password ?? ""
    ).trim();

    const role = String(
      body.role ?? "employee"
    ).trim();

    // --------------------------------------------------
    // 4. Validate information
    // --------------------------------------------------

    if (!fullName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email address is required.",
        },
        { status: 400 }
      );
    }

    if (
      !password ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          error: "A role is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Check requested role
    // --------------------------------------------------

    const {
      data: selectedRole,
      error: roleError,
    } = await supabase
      .from("roles")
      .select("id, name")
      .eq("name", role)
      .single();

    if (
      roleError ||
      !selectedRole
    ) {
      return NextResponse.json(
        {
          error:
            "The selected role does not exist.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Create Supabase Auth user
    // --------------------------------------------------

    const admin = createAdminClient();

    const {
      data: createdUser,
      error: createUserError,
    } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (
      createUserError ||
      !createdUser.user
    ) {
      console.error(
        "Supabase user creation error:",
        createUserError
      );

      return NextResponse.json(
        {
          error:
            createUserError?.message ||
            "Unable to create the user account.",
        },
        { status: 400 }
      );
    }

    const newUserId =
      createdUser.user.id;

    // --------------------------------------------------
    // 7. Check whether a profile already exists
    // --------------------------------------------------

    const {
      data: existingProfile,
      error: existingProfileError,
    } = await admin
      .from("profiles")
      .select("id")
      .eq("id", newUserId)
      .maybeSingle();

    if (existingProfileError) {
      console.error(
        "Profile lookup error:",
        existingProfileError
      );

      await admin.auth.admin.deleteUser(
        newUserId
      );

      return NextResponse.json(
        {
          error:
            "Unable to check the user profile.",
          details:
            existingProfileError.message,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 8. Create or update profile
    // --------------------------------------------------

    if (existingProfile) {
      // A Supabase trigger already created
      // the profile. Update it instead of
      // attempting another INSERT.

      const {
        error: profileUpdateError,
      } = await admin
        .from("profiles")
        .update({
          full_name: fullName,
          email,
          role,
          is_active: true,
        })
        .eq("id", newUserId);

      if (profileUpdateError) {
        console.error(
          "Profile update error:",
          profileUpdateError
        );

        await admin.auth.admin.deleteUser(
          newUserId
        );

        return NextResponse.json(
          {
            error:
              "The user profile could not be updated.",
            details:
              profileUpdateError.message,
          },
          { status: 500 }
        );
      }
    } else {
      // No automatic profile exists,
      // so create one manually.

      const {
        error: profileInsertError,
      } = await admin
        .from("profiles")
        .insert({
          id: newUserId,
          full_name: fullName,
          email,
          role,
          is_active: true,
        });

      if (profileInsertError) {
        console.error(
          "Profile creation error:",
          profileInsertError
        );

        await admin.auth.admin.deleteUser(
          newUserId
        );

        return NextResponse.json(
          {
            error:
              "Profile creation failed.",
            details:
              profileInsertError.message,
          },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------
    // 9. Check whether user role already exists
    // --------------------------------------------------

    const {
      data: existingUserRole,
      error: existingUserRoleError,
    } = await admin
      .from("user_roles")
      .select("user_id, role_id")
      .eq("user_id", newUserId)
      .eq("role_id", selectedRole.id)
      .maybeSingle();

    if (existingUserRoleError) {
      console.error(
        "User role lookup error:",
        existingUserRoleError
      );

      await admin
        .from("profiles")
        .delete()
        .eq("id", newUserId);

      await admin.auth.admin.deleteUser(
        newUserId
      );

      return NextResponse.json(
        {
          error:
            "Unable to check the user's role.",
          details:
            existingUserRoleError.message,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 10. Assign role if not already assigned
    // --------------------------------------------------

    if (!existingUserRole) {
      const {
        error: userRoleError,
      } = await admin
        .from("user_roles")
        .insert({
          user_id: newUserId,
          role_id: selectedRole.id,
        });

      if (userRoleError) {
        console.error(
          "User role assignment error:",
          userRoleError
        );

        await admin
          .from("profiles")
          .delete()
          .eq("id", newUserId);

        await admin.auth.admin.deleteUser(
          newUserId
        );

        return NextResponse.json(
          {
            error:
              "The user was created but the role could not be assigned.",
            details:
              userRoleError.message,
          },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------
    // 11. Write audit log
    // --------------------------------------------------

    const {
      error: auditError,
    } = await admin
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "CREATE",
        module: "Users & Permissions",
        record_id: newUserId,
        record_name: fullName,
        description:
          `Created user ${email} with role ${role}.`,
        new_values: {
          full_name: fullName,
          email,
          role,
          is_active: true,
        },
      });

    if (auditError) {
      console.error(
        "Audit log error:",
        auditError
      );

      // Audit failure does not stop
      // successful user creation.
    }

    // --------------------------------------------------
    // 12. Success
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "User created successfully.",
        user: {
          id: newUserId,
          fullName,
          email,
          role,
          isActive: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create user API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while creating the user.",
      },
      { status: 500 }
    );
  }
}