import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "../../../../../../lib/permissions";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type SubmittedPermission = {
  permissionId: string;
  allowed: boolean;
};

type PermissionRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
};

type RolePermissionRow = {
  permission_id: string;
  allowed: boolean;
};

type UserPermissionRow = {
  permission_id: string;
  allowed: boolean;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const permissionCheck = await requirePermission(
      "settings.users.view"
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

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
          "id, full_name, email, role, is_active, created_at"
        )
        .eq("id", userId)
        .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const { data: role, error: roleError } =
      await supabase
        .from("roles")
        .select("id, name, description")
        .eq("name", targetUser.role)
        .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: "User role could not be found." },
        { status: 404 }
      );
    }

    const {
      data: allPermissions,
      error: permissionsError,
    } = await supabase
      .from("permissions")
      .select("id, key, name, description")
      .order("key", { ascending: true });

    if (permissionsError) {
      return NextResponse.json(
        { error: permissionsError.message },
        { status: 500 }
      );
    }

    const {
      data: rolePermissions,
    } = await supabase
      .from("role_permissions")
      .select("permission_id, allowed")
      .eq("role_id", role.id);

    const {
      data: userOverrides,
    } = await supabase
      .from("user_permissions")
      .select("permission_id, allowed")
      .eq("user_id", userId);

    const rolePermissionMap = new Map<
      string,
      boolean
    >(
      ((rolePermissions ?? []) as RolePermissionRow[]).map(
        (item: RolePermissionRow) => [
          item.permission_id,
          item.allowed,
        ]
      )
    );

    const overrideMap = new Map<
      string,
      boolean
    >(
      ((userOverrides ?? []) as UserPermissionRow[]).map(
        (item: UserPermissionRow) => [
          item.permission_id,
          item.allowed,
        ]
      )
    );

    const permissions = (
      (allPermissions ?? []) as PermissionRow[]
    ).map((permission: PermissionRow) => {
      const roleAllowed =
        rolePermissionMap.get(permission.id) === true;

      const override =
        overrideMap.has(permission.id)
          ? overrideMap.get(permission.id) ?? null
          : null;

      const effectiveAllowed =
        override !== null
          ? override
          : roleAllowed;

      return {
        id: permission.id,
        key: permission.key,
        name: permission.name,
        description: permission.description,
        roleAllowed,
        override,
        effectiveAllowed,
      };
    });

    return NextResponse.json({
      user: targetUser,
      role,
      permissions,
    });
  } catch (error) {
    console.error(
      "Load user permissions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while loading permissions.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const permissionCheck = await requirePermission(
      "settings.users.permissions"
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

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

    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const submittedPermissions =
      body.permissions as SubmittedPermission[] | undefined;

    if (!Array.isArray(submittedPermissions)) {
      return NextResponse.json(
        {
          error:
            "Permissions must be provided as an array.",
        },
        { status: 400 }
      );
    }

    const {
      data: targetUser,
      error: targetUserError,
    } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", userId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (targetUser.role === "owner") {
      return NextResponse.json(
        {
          error:
            "Owner permissions cannot be changed.",
        },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const {
      data: allPermissions,
      error: permissionsError,
    } = await admin
      .from("permissions")
      .select("id, key, name")
      .order("key", { ascending: true });

    if (permissionsError) {
      return NextResponse.json(
        { error: permissionsError.message },
        { status: 500 }
      );
    }

    const validPermissionIds = new Set<string>(
      ((allPermissions ?? []) as PermissionRow[]).map(
        (permission: PermissionRow) =>
          permission.id
      )
    );

    const cleanPermissions: SubmittedPermission[] =
      submittedPermissions.filter(
        (
          item: SubmittedPermission
        ): item is SubmittedPermission =>
          typeof item.permissionId === "string" &&
          typeof item.allowed === "boolean" &&
          validPermissionIds.has(item.permissionId)
      );

    const {
      data: existingOverrides,
    } = await admin
      .from("user_permissions")
      .select("permission_id, allowed")
      .eq("user_id", userId);

    const existingMap = new Map<
      string,
      boolean
    >(
      ((existingOverrides ?? []) as UserPermissionRow[]).map(
        (item: UserPermissionRow) => [
          item.permission_id,
          item.allowed,
        ]
      )
    );

    const changes: Array<{
      permission: string;
      oldValue: boolean | null;
      newValue: boolean;
    }> = [];

    cleanPermissions.forEach(
      (item: SubmittedPermission) => {
        const oldValue = existingMap.has(
          item.permissionId
        )
          ? existingMap.get(item.permissionId) ?? null
          : null;

        if (oldValue !== item.allowed) {
          const permissionName =
            (
              (allPermissions ?? []) as PermissionRow[]
            ).find(
              (permission: PermissionRow) =>
                permission.id === item.permissionId
            )?.key ?? item.permissionId;

          changes.push({
            permission: permissionName,
            oldValue,
            newValue: item.allowed,
          });
        }
      }
    );

    const {
      error: deleteError,
    } = await admin
      .from("user_permissions")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    if (cleanPermissions.length > 0) {
      const rows = cleanPermissions.map(
        (item: SubmittedPermission) => ({
          user_id: userId,
          permission_id: item.permissionId,
          allowed: item.allowed,
        })
      );

      const {
        error: insertError,
      } = await admin
        .from("user_permissions")
        .insert(rows);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    if (changes.length > 0) {
      const {
        error: auditError,
      } = await admin
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "UPDATE",
          module: "Users & Permissions",
          record_id: userId,
          record_name: targetUser.full_name,
          description: `Updated permissions for ${targetUser.email}.`,
          old_values: {
            permissions: changes.map(
              (change) => ({
                permission: change.permission,
                allowed: change.oldValue,
              })
            ),
          },
          new_values: {
            permissions: changes.map(
              (change) => ({
                permission: change.permission,
                allowed: change.newValue,
              })
            ),
          },
        });

      if (auditError) {
        console.error(
          "Audit log error:",
          auditError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Permissions saved successfully.",
    });
  } catch (error) {
    console.error(
      "Save user permissions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while saving permissions.",
      },
      { status: 500 }
    );
  }
}