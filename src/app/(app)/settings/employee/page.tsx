"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  Save,
  Users,
  WalletCards,
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

interface EmployeeSettings {
  id: string;
  employee_prefix: string | null;
  employee_start_number: number | null;

  annual_leave_days: number | null;
  sick_leave_days: number | null;
  family_responsibility_leave_days: number | null;
  maternity_leave_days: number | null;
  unpaid_leave_enabled: boolean;
  leave_requires_approval: boolean;

  pay_frequency: string | null;
  working_days_per_week: number | null;
  working_hours_per_day: number | null;
  overtime_rate_multiplier: number | null;

  created_at: string;
  updated_at: string;
}

const emptyForm = {
  employee_prefix: "EMP-",
  employee_start_number: "1001",

  annual_leave_days: "15",
  sick_leave_days: "30",
  family_responsibility_leave_days: "3",
  maternity_leave_days: "120",
  unpaid_leave_enabled: true,
  leave_requires_approval: true,

  pay_frequency: "Monthly",
  working_days_per_week: "5",
  working_hours_per_day: "8",
  overtime_rate_multiplier: "1.5",
};

export default function EmployeeSettingsPage() {
  const supabase = createClient();

  const [settings, setSettings] =
    useState<EmployeeSettings | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("employee_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Employee settings loading error:",
        error
      );

      setError(
        `Unable to load employee settings: ${error.message}`
      );

      setLoading(false);
      return;
    }

    if (data) {
      const employeeSettings =
        data as EmployeeSettings;

      setSettings(employeeSettings);

      setForm({
        employee_prefix:
          employeeSettings.employee_prefix ?? "EMP-",

        employee_start_number:
          String(
            employeeSettings.employee_start_number ?? 1001
          ),

        annual_leave_days:
          String(
            employeeSettings.annual_leave_days ?? 15
          ),

        sick_leave_days:
          String(
            employeeSettings.sick_leave_days ?? 30
          ),

        family_responsibility_leave_days:
          String(
            employeeSettings.family_responsibility_leave_days ?? 3
          ),

        maternity_leave_days:
          String(
            employeeSettings.maternity_leave_days ?? 120
          ),

        unpaid_leave_enabled:
          employeeSettings.unpaid_leave_enabled ?? true,

        leave_requires_approval:
          employeeSettings.leave_requires_approval ?? true,

        pay_frequency:
          employeeSettings.pay_frequency ?? "Monthly",

        working_days_per_week:
          String(
            employeeSettings.working_days_per_week ?? 5
          ),

        working_hours_per_day:
          String(
            employeeSettings.working_hours_per_day ?? 8
          ),

        overtime_rate_multiplier:
          String(
            employeeSettings.overtime_rate_multiplier ?? 1.5
          ),
      });
    }

    setLoading(false);
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

  async function saveSettings() {
    setError("");
    setSuccess("");
    setSaving(true);

    const employeeStartNumber = Number(
      form.employee_start_number
    );

    const annualLeaveDays = Number(
      form.annual_leave_days
    );

    const sickLeaveDays = Number(
      form.sick_leave_days
    );

    const familyResponsibilityLeaveDays = Number(
      form.family_responsibility_leave_days
    );

    const maternityLeaveDays = Number(
      form.maternity_leave_days
    );

    const workingDaysPerWeek = Number(
      form.working_days_per_week
    );

    const workingHoursPerDay = Number(
      form.working_hours_per_day
    );

    const overtimeRateMultiplier = Number(
      form.overtime_rate_multiplier
    );

    if (
      !Number.isFinite(employeeStartNumber) ||
      employeeStartNumber < 1
    ) {
      setError(
        "Please enter a valid employee starting number."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(annualLeaveDays) ||
      annualLeaveDays < 0
    ) {
      setError(
        "Please enter a valid annual leave entitlement."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(sickLeaveDays) ||
      sickLeaveDays < 0
    ) {
      setError(
        "Please enter a valid sick leave entitlement."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(
        familyResponsibilityLeaveDays
      ) ||
      familyResponsibilityLeaveDays < 0
    ) {
      setError(
        "Please enter a valid family responsibility leave entitlement."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(maternityLeaveDays) ||
      maternityLeaveDays < 0
    ) {
      setError(
        "Please enter a valid maternity leave entitlement."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(workingDaysPerWeek) ||
      workingDaysPerWeek < 1 ||
      workingDaysPerWeek > 7
    ) {
      setError(
        "Working days per week must be between 1 and 7."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(workingHoursPerDay) ||
      workingHoursPerDay <= 0 ||
      workingHoursPerDay > 24
    ) {
      setError(
        "Please enter valid working hours per day."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(overtimeRateMultiplier) ||
      overtimeRateMultiplier <= 0
    ) {
      setError(
        "Please enter a valid overtime multiplier."
      );
      setSaving(false);
      return;
    }

    const settingsData = {
      employee_prefix:
        form.employee_prefix.trim() || "EMP-",

      employee_start_number:
        employeeStartNumber,

      annual_leave_days:
        annualLeaveDays,

      sick_leave_days:
        sickLeaveDays,

      family_responsibility_leave_days:
        familyResponsibilityLeaveDays,

      maternity_leave_days:
        maternityLeaveDays,

      unpaid_leave_enabled:
        form.unpaid_leave_enabled,

      leave_requires_approval:
        form.leave_requires_approval,

      pay_frequency:
        form.pay_frequency,

      working_days_per_week:
        workingDaysPerWeek,

      working_hours_per_day:
        workingHoursPerDay,

      overtime_rate_multiplier:
        overtimeRateMultiplier,

      updated_at:
        new Date().toISOString(),
    };

    let result;

    if (settings?.id) {
      result = await supabase
        .from("employee_settings")
        .update(settingsData)
        .eq("id", settings.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("employee_settings")
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error(
        "Employee settings save error:",
        result.error
      );

      setError(
        `Unable to save employee settings: ${result.error.message}`
      );

      setSaving(false);
      return;
    }

    setSettings(
      result.data as EmployeeSettings
    );

    setSuccess(
      "Employee and leave settings saved successfully."
    );

    setSaving(false);

    await loadSettings();
  }

  return (
    <DashboardShell
      title="Employee & Leave Settings"
      subtitle="Configure employee, leave and payroll defaults"
    >
      <PageHeader
        title="Employee & Leave Settings"
        description="Manage employee numbering, leave rules and payroll-related defaults used by the Employees module."
        icon={Users}
      />

      <div className="space-y-6">

        {/* BACK */}

        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-500 transition hover:text-charcoal-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
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

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-charcoal-100 bg-white px-6 py-20 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />

            <span className="ml-3 text-sm text-charcoal-500">
              Loading employee settings...
            </span>
          </div>
        ) : (
          <>
            {/* EMPLOYEE NUMBERING */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Employee Numbering
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure the numbering format used when
                  creating employees.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Employee Prefix
                    </label>

                    <input
                      type="text"
                      value={form.employee_prefix}
                      onChange={(event) =>
                        updateField(
                          "employee_prefix",
                          event.target.value
                        )
                      }
                      placeholder="EMP-"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />

                    <p className="mt-2 text-xs text-charcoal-400">
                      Example: EMP-1001
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Starting Number
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        form.employee_start_number
                      }
                      onChange={(event) =>
                        updateField(
                          "employee_start_number",
                          event.target.value
                        )
                      }
                      placeholder="1001"
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* LEAVE RULES */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Leave Rules
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure the default leave allowances used
                  by the Leave module.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Annual Leave (days)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.annual_leave_days
                      }
                      onChange={(event) =>
                        updateField(
                          "annual_leave_days",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Sick Leave (days)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.sick_leave_days
                      }
                      onChange={(event) =>
                        updateField(
                          "sick_leave_days",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Family Responsibility Leave (days)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.family_responsibility_leave_days
                      }
                      onChange={(event) =>
                        updateField(
                          "family_responsibility_leave_days",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Maternity Leave (days)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.maternity_leave_days
                      }
                      onChange={(event) =>
                        updateField(
                          "maternity_leave_days",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                </div>

                <div className="mt-6 space-y-4">

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        form.unpaid_leave_enabled
                      }
                      onChange={(event) =>
                        updateField(
                          "unpaid_leave_enabled",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Allow unpaid leave
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Employees can submit unpaid leave
                        requests.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        form.leave_requires_approval
                      }
                      onChange={(event) =>
                        updateField(
                          "leave_requires_approval",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-charcoal-300 text-[#20AEB8] focus:ring-[#20AEB8]"
                    />

                    <div>
                      <p className="text-sm font-medium text-charcoal-800">
                        Require leave approval
                      </p>

                      <p className="mt-1 text-xs text-charcoal-500">
                        Leave requests must be approved before
                        they are finalized.
                      </p>
                    </div>
                  </label>

                </div>
              </CardContent>
            </Card>

            {/* PAYROLL DEFAULTS */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WalletCards className="h-5 w-5 text-primary" />
                  Payroll Defaults
                </CardTitle>

                <p className="text-sm text-charcoal-500">
                  Configure default values used when setting up
                  employee payroll.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Pay Frequency
                    </label>

                    <select
                      value={form.pay_frequency}
                      onChange={(event) =>
                        updateField(
                          "pay_frequency",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    >
                      <option value="Weekly">
                        Weekly
                      </option>

                      <option value="Biweekly">
                        Every 2 weeks
                      </option>

                      <option value="Monthly">
                        Monthly
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Working Days Per Week
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={
                        form.working_days_per_week
                      }
                      onChange={(event) =>
                        updateField(
                          "working_days_per_week",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Working Hours Per Day
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={
                        form.working_hours_per_day
                      }
                      onChange={(event) =>
                        updateField(
                          "working_hours_per_day",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-charcoal-700">
                      Overtime Rate Multiplier
                    </label>

                    <div className="relative">
                      <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />

                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={
                          form.overtime_rate_multiplier
                        }
                        onChange={(event) =>
                          updateField(
                            "overtime_rate_multiplier",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-charcoal-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#20AEB8] focus:ring-2 focus:ring-[#20AEB8]/10"
                      />
                    </div>

                    <p className="mt-2 text-xs text-charcoal-400">
                      Example: 1.5 = 150% of the normal hourly
                      rate.
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* SAVE */}

            <div className="flex justify-end border-t border-charcoal-100 pt-6">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20AEB8] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#1897a0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Employee Settings
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}