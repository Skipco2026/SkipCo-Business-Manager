import { createClient } from "@/lib/supabase/server";

type PermissionResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      status: number;
      error: string;
    };

export async function hasPermission(
  permissionKey: string
): Promise<boolean> {
  const supabase = await createClient();

  // --------------------------------------------------
  // 1. Get logged-in user
  // --------------------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  // --------------------------------------------------
  // 2. Get user's profile
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
    return false;
  }

  // --------------------------------------------------
  // 3. Owner has full access
  // --------------------------------------------------

  if (profile.role === "owner") {
    return true;
  }

  // --------------------------------------------------
  // 4. Find permission
  // --------------------------------------------------

  const {
    data: permission,
    error: permissionError,
  } = await supabase
    .from("permissions")
    .select("id")
    .eq("key", permissionKey)
    .single();

  if (permissionError || !permission) {
    return false;
  }

  // --------------------------------------------------
  // 5. Check individual user override
  // --------------------------------------------------

  const { data: override } = await supabase
    .from("user_permissions")
    .select("allowed")
    .eq("user_id", user.id)
    .eq("permission_id", permission.id)
    .maybeSingle();

  if (override !== null) {
    return override?.allowed === true;
  }

  // --------------------------------------------------
  // 6. Find user's role
  // --------------------------------------------------

  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("name", profile.role)
    .single();

  if (!role) {
    return false;
  }

  // --------------------------------------------------
  // 7. Check role permission
  // --------------------------------------------------

  const { data: rolePermission } =
    await supabase
      .from("role_permissions")
      .select("allowed")
      .eq("role_id", role.id)
      .eq("permission_id", permission.id)
      .maybeSingle();

  return rolePermission?.allowed === true;
}

// --------------------------------------------------
// Require permission
// --------------------------------------------------

export async function requirePermission(
  permissionKey: string
): Promise<PermissionResult> {
  const allowed = await hasPermission(
    permissionKey
  );

  if (!allowed) {
    return {
      allowed: false,
      status: 403,
      error:
        "You do not have permission to perform this action.",
    };
  }

  return {
    allowed: true,
  };
}