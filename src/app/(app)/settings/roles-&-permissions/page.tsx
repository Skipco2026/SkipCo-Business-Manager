"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface RolePermissionRow {
  permission_id: string;
}

const standardRoles = [
  "Owner",
  "Manager",
  "Accounts",
  "Operations",
  "Driver",
];

export default function RolesPermissionsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [selectedPermissions, setSelectedPermissions] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCreateRole, setShowCreateRole] =
    useState(false);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expandedModules, setExpandedModules] =
    useState<Set<string>>(new Set());

  const getPermissionModule = useCallback(
    (key: string): string => {
      const moduleName = key.split(".")[0];

      const names: Record<string, string> = {
        dashboard: "Dashboard",
        customers: "Customers",
        quotes: "Quotes",
        invoices: "Invoices",
        statements: "Statements",
        jobs: "Jobs",
        employees: "Employees",
        payroll: "Payroll",
        attendance: "Attendance",
        leave: "Leave",
        contractors: "Contractors",
        reports: "Reports",
        settings: "Settings",
        audit: "Audit Log",
      };

      return (
        names[moduleName] ??
        moduleName.charAt(0).toUpperCase() +
          moduleName.slice(1)
      );
    },
    []
  );

  const selectRole = useCallback(
    async (role: Role) => {
      setSelectedRole(role);
      setError("");
      setSuccess("");

      const { data, error: permissionError } =
        await supabase
          .from("role_permissions")
          .select("permission_id")
          .eq("role_id", role.id);

      if (permissionError) {
        console.error(
          "Role permissions loading error:",
          permissionError
        );

        setError(
          `Unable to load role permissions: ${permissionError.message}`
        );

        return;
      }

      const permissionRows =
        (data ?? []) as RolePermissionRow[];

      const permissionIds = new Set<string>(
        permissionRows.map(
          (item) => item.permission_id
        )
      );

      setSelectedPermissions(permissionIds);

      const modules = new Set<string>();

      permissions.forEach((permission) => {
        if (permissionIds.has(permission.id)) {
          modules.add(
            getPermissionModule(permission.key)
          );
        }
      });

      setExpandedModules(modules);
    },
    [getPermissionModule, permissions, supabase]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [rolesResult, permissionsResult] =
      await Promise.all([
        supabase
          .from("roles")
          .select("*")
          .order("name"),

        supabase
          .from("permissions")
          .select("*")
          .order("key"),
      ]);

    if (rolesResult.error) {
      console.error(
        "Roles loading error:",
        rolesResult.error
      );

      setError(
        `Unable to load roles: ${rolesResult.error.message}`
      );

      setLoading(false);
      return;
    }

    if (permissionsResult.error) {
      console.error(
        "Permissions loading error:",
        permissionsResult.error
      );

      setError(
        `Unable to load permissions: ${permissionsResult.error.message}`
      );

      setLoading(false);
      return;
    }

    const loadedRoles =
      (rolesResult.data as Role[]) ?? [];

    const loadedPermissions =
      (permissionsResult.data as Permission[]) ?? [];

    setRoles(loadedRoles);
    setPermissions(loadedPermissions);

    if (loadedRoles.length > 0) {
      const currentRoleStillExists =
        selectedRole
          ? loadedRoles.some(
              (role) =>
                role.id === selectedRole.id
            )
          : false;

      if (!currentRoleStillExists) {
        await selectRole(loadedRoles[0]);
      }
    } else {
      setSelectedRole(null);
      setSelectedPermissions(new Set());
    }

    setLoading(false);
  }, [selectRole, selectedRole, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<
      string,
      Permission[]
    > = {};

    permissions.forEach((permission) => {
      const moduleName =
        getPermissionModule(permission.key);

      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }

      groups[moduleName].push(permission);
    });

    return groups;
  }, [permissions, getPermissionModule]);

  function togglePermission(
    permissionId: string
  ) {
    setSelectedPermissions((current) => {
      const next = new Set(current);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });

    setSuccess("");
  }

  function toggleModule(moduleName: string) {
    setExpandedModules((current) => {
      const next = new Set(current);

      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }

      return next;
    });
  }

  function selectAllModule(
    modulePermissions: Permission[]
  ) {
    setSelectedPermissions((current) => {
      const next = new Set(current);

      modulePermissions.forEach((permission) => {
        next.add(permission.id);
      });

      return next;
    });

    setSuccess("");
  }

  function clearModule(
    modulePermissions: Permission[]
  ) {
    setSelectedPermissions((current) => {
      const next = new Set(current);

      modulePermissions.forEach((permission) => {
        next.delete(permission.id);
      });

      return next;
    });

    setSuccess("");
  }

  async function savePermissions() {
    if (!selectedRole) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const deleteResult = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", selectedRole.id);

    if (deleteResult.error) {
      console.error(
        "Permission delete error:",
        deleteResult.error
      );

      setError(
        `Unable to save permissions: ${deleteResult.error.message}`
      );

      setSaving(false);
      return;
    }

    const permissionRows = Array.from(
      selectedPermissions
    ).map((permissionId) => ({
      role_id: selectedRole.id,
      permission_id: permissionId,
    }));

    if (permissionRows.length > 0) {
      const insertResult = await supabase
        .from("role_permissions")
        .insert(permissionRows);

      if (insertResult.error) {
        console.error(
          "Permission insert error:",
          insertResult.error
        );

        setError(
          `Unable to save permissions: ${insertResult.error.message}`
        );

        setSaving(false);
        return;
      }
    }

    setSuccess(
      `Permissions for ${selectedRole.name} saved successfully.`
    );

    setSaving(false);
  }

  async function createRole() {
    setError("");
    setSuccess("");

    const name = newRoleName.trim();
    const description =
      newRoleDescription.trim();

    if (!name) {
      setError("Please enter a role name.");
      return;
    }

    if (
      roles.some(
        (role) =>
          role.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      setError(
        "A role with this name already exists."
      );
      return;
    }

    const { data, error: createError } =
      await supabase
        .from("roles")
        .insert({
          name,
          description: description || null,
        })
        .select()
        .single();

    if (createError) {
      console.error(
        "Role creation error:",
        createError
      );

      setError(
        `Unable to create role: ${createError.message}`
      );

      return;
    }

    const newRole = data as Role;

    const updatedRoles = [
      ...roles,
      newRole,
    ].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setRoles(updatedRoles);

    setSelectedRole(newRole);
    setSelectedPermissions(new Set());

    setNewRoleName("");
    setNewRoleDescription("");
    setShowCreateRole(false);

    setSuccess(
      `Role "${newRole.name}" created successfully.`
    );
  }

  async function deleteRole() {
    if (!selectedRole) {
      return;
    }

    if (
      standardRoles.includes(
        selectedRole.name
      )
    ) {
      setError(
        "The standard system roles cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the "${selectedRole.name}" role?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } =
      await supabase
        .from("roles")
        .delete()
        .eq("id", selectedRole.id);

    if (deleteError) {
      console.error(
        "Role deletion error:",
        deleteError
      );

      setError(
        `Unable to delete role: ${deleteError.message}`
      );

      return;
    }

    const remainingRoles = roles.filter(
      (role) =>
        role.id !== selectedRole.id
    );

    setRoles(remainingRoles);

    if (remainingRoles.length > 0) {
      await selectRole(remainingRoles[0]);
    } else {
      setSelectedRole(null);
      setSelectedPermissions(new Set());
    }

    setSuccess(
      "Role deleted successfully."
    );
  }

  return (
    <DashboardShell
      title="Roles & Permissions"
      subtitle="Control exactly what each role can access"
    >
      <PageHeader
        title="Roles & Permissions"
        description="Create roles and manually control the permissions available to each role."
        icon={ShieldCheck}
      />

      <div className="space-y-6">

        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-500 transition hover:text-charcoal-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-20 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading roles and permissions...
            </span>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Roles
                  </CardTitle>

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateRole(true)
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#20AEB8] text-white transition hover:bg-[#1897a0]"
                    title="Create role"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-charcoal-500">
                  Select a role to manage its permissions.
                </p>
              </CardHeader>

              <CardContent className="space-y-2">

                {roles.length === 0 ? (
                  <p className="py-6 text-center text-sm text-charcoal-500">
                    No roles found.
                  </p>
                ) : (
                  roles.map((role) => {
                    const active =
                      selectedRole?.id === role.id;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() =>
                          void selectRole(role)
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-[#20AEB8] bg-[#20AEB8]/10"
                            : "border-charcoal-100 bg-white hover:border-[#20AEB8]/40 hover:bg-charcoal-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-charcoal-900">
                              {role.name}
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs text-charcoal-500">
                              {role.description ||
                                "No description"}
                            </p>
                          </div>

                          {active && (
                            <Check className="h-4 w-4 shrink-0 text-[#20AEB8]" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <CardTitle>
                      {selectedRole
                        ? `${selectedRole.name} Permissions`
                        : "Permissions"}
                    </CardTitle>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Tick only the permissions this role should have.
                    </p>
                  </div>

                  {selectedRole && (
                    <div className="flex items-center gap-2">

                      {!standardRoles.includes(
                        selectedRole.name
                      ) && (
                        <button
                          type="button"
                          onClick={() =>
                            void deleteRole()
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          void savePermissions()
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Permissions
                          </>
                        )}
                      </button>

                    </div>
                  )}

                </div>
              </CardHeader>

              <CardContent>

                {!selectedRole ? (
                  <div className="rounded-xl border border-dashed border-charcoal-200 px-6 py-16 text-center">
                    <ShieldCheck className="mx-auto h-10 w-10 text-charcoal-300" />

                    <p className="mt-4 text-sm font-medium text-charcoal-700">
                      Select a role
                    </p>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Choose a role on the left to manage its permissions.
                    </p>
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-charcoal-200 px-6 py-16 text-center">
                    <p className="text-sm font-medium text-charcoal-700">
                      No permissions found
                    </p>

                    <p className="mt-1 text-sm text-charcoal-500">
                      Add permissions to your permissions table first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">

                    {Object.entries(
                      groupedPermissions
                    ).map(
                      ([
                        moduleName,
                        modulePermissions,
                      ]) => {
                        const expanded =
                          expandedModules.has(
                            moduleName
                          );

                        const selectedCount =
                          modulePermissions.filter(
                            (permission) =>
                              selectedPermissions.has(
                                permission.id
                              )
                          ).length;

                        const allSelected =
                          selectedCount ===
                            modulePermissions.length &&
                          modulePermissions.length >
                            0;

                        return (
                          <div
                            key={moduleName}
                            className="overflow-hidden rounded-xl border border-charcoal-100"
                          >

                            <div className="flex items-center justify-between bg-charcoal-50 px-4 py-3">

                              <button
                                type="button"
                                onClick={() =>
                                  toggleModule(
                                    moduleName
                                  )
                                }
                                className="flex items-center gap-3"
                              >
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4 text-charcoal-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-charcoal-400" />
                                )}

                                <span className="text-sm font-semibold text-charcoal-800">
                                  {moduleName}
                                </span>

                                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-charcoal-500">
                                  {selectedCount}/
                                  {
                                    modulePermissions.length
                                  }
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  allSelected
                                    ? clearModule(
                                        modulePermissions
                                      )
                                    : selectAllModule(
                                        modulePermissions
                                      )
                                }
                                className="text-xs font-medium text-[#20AEB8] hover:underline"
                              >
                                {allSelected
                                  ? "Clear all"
                                  : "Select all"}
                              </button>

                            </div>

                            {expanded && (
                              <div className="divide-y divide-charcoal-100 bg-white">
                                {modulePermissions.map(
                                  (permission) => {
                                    const checked =
                                      selectedPermissions.has(
                                        permission.id
                                      );

                                    return (
                                      <label
                                        key={
                                          permission.id
                                        }
                                        className="flex cursor-pointer items-start gap-3 px-4 py-4 transition hover:bg-charcoal-50"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            checked
                                          }
                                          onChange={() =>
                                            togglePermission(
                                              permission.id
                                            )
                                          }
                                          className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                                        />

                                        <div>
                                          <p className="text-sm font-medium text-charcoal-800">
                                            {
                                              permission.name
                                            }
                                          </p>

                                          <p className="mt-1 text-xs text-charcoal-500">
                                            {permission.description ||
                                              permission.key}
                                          </p>

                                          <p className="mt-1 font-mono text-[11px] text-charcoal-400">
                                            {
                                              permission.key
                                            }
                                          </p>
                                        </div>
                                      </label>
                                    );
                                  }
                                )}
                              </div>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </CardContent>
            </Card>

          </div>
        )}

      </div>

      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  Create Role
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Create a custom role for your business.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateRole(false)
                }
                className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-5 px-6 py-6">

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Role Name *
                </label>

                <input
                  type="text"
                  value={newRoleName}
                  onChange={(event) =>
                    setNewRoleName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Dispatcher"
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={newRoleDescription}
                  onChange={(event) =>
                    setNewRoleDescription(
                      event.target.value
                    )
                  }
                  placeholder="Describe what this role is responsible for..."
                  className="w-full resize-y rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-charcoal-100 px-6 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowCreateRole(false)
                }
                className="rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void createRole()
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1897a0]"
              >
                <Plus className="h-4 w-4" />
                Create Role
              </button>

            </div>

          </div>
        </div>
      )}

    </DashboardShell>
  );
}