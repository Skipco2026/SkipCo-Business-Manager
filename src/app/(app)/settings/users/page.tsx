"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
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

interface Employee {
  id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  job_title: string | null;
  department: string | null;
  employment_status: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface UserAccount {
  id: string;
  employee_id: string | null;
  role_id: string | null;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employee?: Employee | null;
  role?: Role | null;
}

const emptyForm = {
  employee_id: "",
  role_id: "",
  full_name: "",
  email: "",
  is_active: true,
};

export default function UsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] =
    useState<UserAccount | null>(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      usersResult,
      employeesResult,
      rolesResult,
    ] = await Promise.all([
      supabase
        .from("users")
        .select(`
          *,
          employee:employees (
            id,
            employee_number,
            first_name,
            last_name,
            email,
            job_title,
            department,
            employment_status
          ),
          role:roles (
            id,
            name,
            description
          )
        `)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employees")
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          email,
          job_title,
          department,
          employment_status
        `)
        .order("first_name"),

      supabase
        .from("roles")
        .select(`
          id,
          name,
          description
        `)
        .order("name"),
    ]);

    if (usersResult.error) {
      console.error(
        "Users loading error:",
        usersResult.error
      );

      setError(
        `Unable to load users: ${usersResult.error.message}`
      );

      setLoading(false);
      return;
    }

    if (employeesResult.error) {
      console.error(
        "Employees loading error:",
        employeesResult.error
      );

      setError(
        `Unable to load employees: ${employeesResult.error.message}`
      );

      setLoading(false);
      return;
    }

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

    setUsers(
      (usersResult.data as UserAccount[]) ?? []
    );

    setEmployees(
      (employeesResult.data as Employee[]) ?? []
    );

    setRoles(
      (rolesResult.data as Role[]) ?? []
    );

    setLoading(false);
  }

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(user: UserAccount) {
    setEditingUser(user);

    setForm({
      employee_id: user.employee_id ?? "",
      role_id: user.role_id ?? "",
      full_name: user.full_name,
      email: user.email,
      is_active: user.is_active,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof typeof emptyForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEmployeeChange(
    employeeId: string
  ) {
    const employee = employees.find(
      (item) => item.id === employeeId
    );

    if (!employee) {
      updateField("employee_id", "");
      return;
    }

    setForm((current) => ({
      ...current,
      employee_id: employee.id,
      full_name:
        `${employee.first_name} ${employee.last_name}`.trim(),
      email: employee.email ?? "",
    }));
  }

  const availableEmployees = useMemo(() => {
    if (editingUser?.employee_id) {
      return employees;
    }

    const assignedEmployeeIds = new Set(
      users
        .filter((user) => user.employee_id)
        .map((user) => user.employee_id)
    );

    return employees.filter(
      (employee) =>
        !assignedEmployeeIds.has(employee.id)
    );
  }, [employees, users, editingUser]);

  async function saveUser() {
    setError("");
    setSuccess("");

    if (!form.employee_id) {
      setError(
        "Please select an employee."
      );
      return;
    }

    if (!form.role_id) {
      setError(
        "Please select a role."
      );
      return;
    }

    if (!form.full_name.trim()) {
      setError(
        "Please enter the user's full name."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Please enter the user's email address."
      );
      return;
    }

    setSaving(true);

    const userData = {
      employee_id: form.employee_id,
      role_id: form.role_id,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (editingUser) {
      result = await supabase
        .from("users")
        .update(userData)
        .eq("id", editingUser.id)
        .select(`
          *,
          employee:employees (
            id,
            employee_number,
            first_name,
            last_name,
            email,
            job_title,
            department,
            employment_status
          ),
          role:roles (
            id,
            name,
            description
          )
        `)
        .single();
    } else {
      result = await supabase
        .from("users")
        .insert(userData)
        .select(`
          *,
          employee:employees (
            id,
            employee_number,
            first_name,
            last_name,
            email,
            job_title,
            department,
            employment_status
          ),
          role:roles (
            id,
            name,
            description
          )
        `)
        .single();
    }

    if (result.error) {
      console.error(
        "User save error:",
        result.error
      );

      setError(
        `Unable to save user: ${result.error.message}`
      );

      setSaving(false);
      return;
    }

    const savedUser =
      result.data as UserAccount;

    if (editingUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === savedUser.id
            ? savedUser
            : user
        )
      );

      setSuccess(
        "User account updated successfully."
      );
    } else {
      setUsers((current) => [
        savedUser,
        ...current,
      ]);

      setSuccess(
        "User account created successfully."
      );
    }

    setSaving(false);
    closeModal();
  }

  async function toggleUserStatus(
    user: UserAccount
  ) {
    setError("");
    setSuccess("");

    const newStatus = !user.is_active;

    const { error } = await supabase
      .from("users")
      .update({
        is_active: newStatus,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error(
        "User status update error:",
        error
      );

      setError(
        `Unable to update user: ${error.message}`
      );

      return;
    }

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
              ...item,
              is_active: newStatus,
            }
          : item
      )
    );

    setSuccess(
      `${user.full_name} has been ${
        newStatus
          ? "activated"
          : "deactivated"
      }.`
    );
  }

  async function deleteUser(
    user: UserAccount
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete the user account for ${user.full_name}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (error) {
      console.error(
        "User deletion error:",
        error
      );

      setError(
        `Unable to delete user: ${error.message}`
      );

      return;
    }

    setUsers((current) =>
      current.filter(
        (item) => item.id !== user.id
      )
    );

    setSuccess(
      "User account deleted successfully."
    );
  }

  return (
    <DashboardShell
      title="Users"
      subtitle="Manage Business Manager user accounts and access"
    >
      <PageHeader
        title="Users"
        description="Create user accounts, assign roles and control who can access your Business Manager."
        icon={UserCog}
      />

      <div className="space-y-6">

        {/* BACK + ADD */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-500 transition hover:text-charcoal-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#20AEB8] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1897a0]"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>

        </div>

        {/* SUCCESS */}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* USERS */}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-20 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading users...
            </span>
          </div>
        ) : (
          <Card>

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                User Accounts
              </CardTitle>

              <p className="text-sm text-charcoal-500">
                Each user receives the permissions assigned to their role.
              </p>
            </CardHeader>

            <CardContent>

              {users.length === 0 ? (
                <div className="rounded-xl border border-dashed border-charcoal-200 px-6 py-16 text-center">

                  <UserCog className="mx-auto h-10 w-10 text-charcoal-300" />

                  <p className="mt-4 text-sm font-medium text-charcoal-700">
                    No user accounts yet
                  </p>

                  <p className="mt-1 text-sm text-charcoal-500">
                    Add your first Business Manager user.
                  </p>

                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1897a0]"
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </button>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px]">

                    <thead>
                      <tr className="border-b border-charcoal-100 text-left">

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                          User
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                          Employee
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                          Role
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                          Actions
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-charcoal-100">

                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="transition hover:bg-charcoal-50"
                        >

                          <td className="px-4 py-4">

                            <p className="text-sm font-semibold text-charcoal-900">
                              {user.full_name}
                            </p>

                            <p className="mt-1 text-xs text-charcoal-500">
                              {user.email}
                            </p>

                          </td>

                          <td className="px-4 py-4">

                            {user.employee ? (
                              <>
                                <p className="text-sm font-medium text-charcoal-800">
                                  {
                                    user.employee
                                      .first_name
                                  }{" "}
                                  {
                                    user.employee
                                      .last_name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-charcoal-500">
                                  {user.employee.employee_number ||
                                    "No employee number"}
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-charcoal-400">
                                Not linked
                              </span>
                            )}

                          </td>

                          <td className="px-4 py-4">

                            {user.role ? (
                              <span className="inline-flex items-center rounded-full bg-[#20AEB8]/10 px-3 py-1 text-xs font-medium text-[#168892]">
                                {user.role.name}
                              </span>
                            ) : (
                              <span className="text-sm text-red-500">
                                No role
                              </span>
                            )}

                          </td>

                          <td className="px-4 py-4">

                            {user.is_active ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal-100 px-3 py-1 text-xs font-medium text-charcoal-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-charcoal-400" />
                                Inactive
                              </span>
                            )}

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    user
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-charcoal-200 text-charcoal-500 transition hover:border-[#20AEB8] hover:text-[#20AEB8]"
                                title="Edit user"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleUserStatus(
                                    user
                                  )
                                }
                                className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-medium transition ${
                                  user.is_active
                                    ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                    : "border-green-200 text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {user.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteUser(
                                    user
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                            </div>

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </CardContent>

          </Card>
        )}

      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p className="mt-1 text-sm text-charcoal-500">
                  Assign an employee and role to this user.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-5 px-6 py-6">

              {/* EMPLOYEE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Employee *
                </label>

                <div className="relative">

                  <select
                    value={form.employee_id}
                    onChange={(event) =>
                      handleEmployeeChange(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                  >
                    <option value="">
                      Select employee
                    </option>

                    {availableEmployees.map(
                      (employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.first_name}{" "}
                          {employee.last_name}
                          {employee.employee_number
                            ? ` — ${employee.employee_number}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                </div>

                <p className="mt-1.5 text-xs text-charcoal-400">
                  Each employee can have one Business Manager user account.
                </p>

              </div>

              {/* ROLE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Role *
                </label>

                <div className="relative">

                  <select
                    value={form.role_id}
                    onChange={(event) =>
                      updateField(
                        "role_id",
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                  >
                    <option value="">
                      Select role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ))}

                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                </div>

                <p className="mt-1.5 text-xs text-charcoal-400">
                  The user will receive the permissions assigned to this role.
                </p>

              </div>

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Full Name *
                </label>

                <input
                  type="text"
                  value={form.full_name}
                  onChange={(event) =>
                    updateField(
                      "full_name",
                      event.target.value
                    )
                  }
                  placeholder="Full name"
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm font-medium text-charcoal-700">
                  Login Email *
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="employee@company.co.za"
                  className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                />

                <p className="mt-1.5 text-xs text-charcoal-400">
                  This is the email address the user will use to sign in.
                </p>

              </div>

              {/* ACTIVE */}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">

                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateField(
                      "is_active",
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                />

                <div>

                  <p className="text-sm font-medium text-charcoal-800">
                    User account is active
                  </p>

                  <p className="mt-1 text-xs text-charcoal-500">
                    Inactive users should not be allowed to access the Business Manager.
                  </p>

                </div>

              </label>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-charcoal-100 px-6 py-4">

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveUser}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {editingUser
                      ? "Save Changes"
                      : "Create User"}
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}

    </DashboardShell>
  );
}