"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

type Employee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  pay_type: string | null;
  hourly_rate: number | null;
};

type PayrollAttendance = {
  id: string;
  employee_id: string;
  attendance_date: string;
  clock_in: string | null;
  break_start: string | null;
  break_end: string | null;
  clock_out: string | null;
  normal_hours: number;
  overtime_hours: number;
  status: "approved";
  employee: Employee | null;
};

type PublicHoliday = {
  holiday_date: string;
  holiday_name: string;
};

type PayrollEmployee = {
  employee: Employee;
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
  sundayHours: number;
  publicHolidayHours: number;
  normalPay: number;
  overtimePay: number;
  sundayPay: number;
  publicHolidayPay: number;
  grossPay: number;
};

function getFirstDayOfMonth(): string {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-01`;
}

function getLastDayOfMonth(): string {
  const now = new Date();

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(lastDay).padStart(
    2,
    "0"
  )}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getDayOfWeek(dateString: string): number {
  const date = new Date(`${dateString}T00:00:00`);

  return date.getDay();
}

/**
 * Returns the Monday date for the week
 * containing the supplied attendance date.
 *
 * Payroll weeks run Monday -> Sunday.
 */
function getWeekKey(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  const day = date.getDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + mondayOffset);

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const dayOfMonth = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${dayOfMonth}`;
}

export default function PayrollPage() {
  const [attendance, setAttendance] =
    useState<PayrollAttendance[]>([]);

  const [publicHolidays, setPublicHolidays] =
    useState<PublicHoliday[]>([]);

  const [startDate, setStartDate] = useState(
    getFirstDayOfMonth()
  );

  const [endDate, setEndDate] = useState(
    getLastDayOfMonth()
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadPayroll(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("startDate", startDate);
      params.set("endDate", endDate);

      const response = await fetch(
        `/api/payroll?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load payroll."
        );
      }

      setAttendance(
        data.attendance ?? []
      );

      const holidayResponse =
        await fetch(
          `/api/public-holidays?startDate=${encodeURIComponent(
            startDate
          )}&endDate=${encodeURIComponent(
            endDate
          )}`
        );

      if (holidayResponse.ok) {
        const holidayData =
          await holidayResponse.json();

        setPublicHolidays(
          holidayData.holidays ?? []
        );
      } else {
        setPublicHolidays([]);
      }
    } catch (err) {
      console.error(
        "Payroll loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payroll."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayroll();
  }, []);

  const holidayDates = useMemo(() => {
    return new Set(
      publicHolidays.map(
        (holiday) =>
          holiday.holiday_date
      )
    );
  }, [publicHolidays]);

  const payrollEmployees =
    useMemo<PayrollEmployee[]>(() => {
      /*
       * Group approved attendance
       * by employee.
       */
      const employeeRecords =
        new Map<
          string,
          PayrollAttendance[]
        >();

      for (const record of attendance) {
        if (!record.employee) {
          continue;
        }

        const records =
          employeeRecords.get(
            record.employee_id
          ) ?? [];

        records.push(record);

        employeeRecords.set(
          record.employee_id,
          records
        );
      }

      const results: PayrollEmployee[] =
        [];

      /*
       * Calculate payroll employee by
       * employee.
       */
      for (const [
        employeeId,
        records,
      ] of employeeRecords) {
        const employee =
          records[0]?.employee;

        if (!employee) {
          continue;
        }

        const hourlyRate =
          Number(
            employee.hourly_rate
          ) || 0;

        /*
         * We calculate overtime per
         * Monday-Sunday week.
         *
         * 45 hours per week are normal.
         * Everything above 45 is 1.5x.
         *
         * Sunday and public holiday
         * hours are handled separately
         * at 2x.
         */
        const weeklyOrdinaryHours =
          new Map<string, number>();

        /*
         * Sort attendance chronologically.
         * This is important because the
         * first 45 applicable hours in
         * each week must be normal.
         */
        const sortedRecords = [
          ...records,
        ].sort((a, b) =>
          a.attendance_date.localeCompare(
            b.attendance_date
          )
        );

        let totalHours = 0;
        let normalHours = 0;
        let overtimeHours = 0;
        let sundayHours = 0;
        let publicHolidayHours = 0;

        for (const record of sortedRecords) {
          const recordNormalHours =
            Number(
              record.normal_hours
            ) || 0;

          const recordOvertimeHours =
            Number(
              record.overtime_hours
            ) || 0;

          /*
           * The attendance record may
           * contain hours split into
           * normal/OT by the Attendance
           * module.
           *
           * Payroll uses the actual
           * approved total hours.
           */
          const recordTotalHours =
            Math.max(
              recordNormalHours +
                recordOvertimeHours,
              0
            );

          if (recordTotalHours <= 0) {
            continue;
          }

          totalHours += recordTotalHours;

          const dayOfWeek =
            getDayOfWeek(
              record.attendance_date
            );

          const isSunday =
            dayOfWeek === 0;

          const isPublicHoliday =
            holidayDates.has(
              record.attendance_date
            );

          /*
           * Sunday and public holiday
           * hours are paid at 2x.
           *
           * Public holiday takes
           * priority if a date happens
           * to be both.
           */
          if (isPublicHoliday) {
            publicHolidayHours +=
              recordTotalHours;

            continue;
          }

          if (isSunday) {
            sundayHours +=
              recordTotalHours;

            continue;
          }

          /*
           * Normal weekday hours are
           * subject to the 45-hour
           * weekly threshold.
           */
          const weekKey =
            getWeekKey(
              record.attendance_date
            );

          const hoursAlreadyInWeek =
            weeklyOrdinaryHours.get(
              weekKey
            ) ?? 0;

          /*
           * How many hours are still
           * available before reaching
           * 45 ordinary hours?
           */
          const remainingNormalHours =
            Math.max(
              45 -
                hoursAlreadyInWeek,
              0
            );

          /*
           * Hours up to the remaining
           * 45-hour threshold are normal.
           */
          const recordNormal =
            Math.min(
              recordTotalHours,
              remainingNormalHours
            );

          /*
           * Anything beyond the
           * 45-hour weekly threshold
           * is overtime.
           */
          const recordOvertime =
            Math.max(
              recordTotalHours -
                recordNormal,
              0
            );

          normalHours +=
            recordNormal;

          overtimeHours +=
            recordOvertime;

          weeklyOrdinaryHours.set(
            weekKey,
            hoursAlreadyInWeek +
              recordTotalHours
          );
        }

        const normalPay =
          normalHours *
          hourlyRate;

        const overtimePay =
          overtimeHours *
          hourlyRate *
          1.5;

        const sundayPay =
          sundayHours *
          hourlyRate *
          2;

        const publicHolidayPay =
          publicHolidayHours *
          hourlyRate *
          2;

        const grossPay =
          normalPay +
          overtimePay +
          sundayPay +
          publicHolidayPay;

        results.push({
          employee,
          totalHours,
          normalHours,
          overtimeHours,
          sundayHours,
          publicHolidayHours,
          normalPay,
          overtimePay,
          sundayPay,
          publicHolidayPay,
          grossPay,
        });
      }

      return results.sort(
        (a, b) =>
          a.employee.first_name.localeCompare(
            b.employee.first_name
          )
      );
    }, [
      attendance,
      holidayDates,
    ]);

  const totals = useMemo(() => {
    return payrollEmployees.reduce(
      (total, item) => {
        total.totalHours +=
          item.totalHours;

        total.normalHours +=
          item.normalHours;

        total.overtimeHours +=
          item.overtimeHours;

        total.sundayHours +=
          item.sundayHours;

        total.publicHolidayHours +=
          item.publicHolidayHours;

        total.grossPay +=
          item.grossPay;

        return total;
      },
      {
        totalHours: 0,
        normalHours: 0,
        overtimeHours: 0,
        sundayHours: 0,
        publicHolidayHours: 0,
        grossPay: 0,
      }
    );
  }, [payrollEmployees]);

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payroll
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Payroll calculated from approved
            hourly attendance.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadPayroll()
          }
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <RefreshCw size={17} />
          )}

          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* PAY PERIOD */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays
            size={19}
            className="text-gray-500"
          />

          <h2 className="font-semibold text-gray-900">
            Pay Period
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadPayroll()
          }
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading && (
            <Loader2
              size={16}
              className="animate-spin"
            />
          )}

          Calculate Payroll
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Employees
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {payrollEmployees.length}
              </p>
            </div>

            <Users
              size={24}
              className="text-gray-400"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Hours
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totals.totalHours.toFixed(
              2
            )}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Normal Hours
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totals.normalHours.toFixed(
              2
            )}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Overtime 1.5×
          </p>

          <p className="mt-1 text-2xl font-bold text-orange-600">
            {totals.overtimeHours.toFixed(
              2
            )}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Sunday / PH
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {(
              totals.sundayHours +
              totals.publicHolidayHours
            ).toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Estimated Gross
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(
                  totals.grossPay
                )}
              </p>
            </div>

            <DollarSign
              size={24}
              className="text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* PAYROLL TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={19}
              className="text-green-600"
            />

            <h2 className="font-semibold text-gray-900">
              Payroll Breakdown
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Only approved attendance is
            included in payroll.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
            <Loader2
              size={20}
              className="animate-spin"
            />

            Loading payroll...
          </div>
        ) : payrollEmployees.length ===
          0 ? (
          <div className="p-12 text-center">
            <DollarSign
              size={36}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 font-semibold text-gray-900">
              No approved hours
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              There are no approved
              attendance records for
              this pay period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">
                    Employee
                  </th>

                  <th className="px-5 py-3">
                    Hourly Rate
                  </th>

                  <th className="px-5 py-3">
                    Total Hours
                  </th>

                  <th className="px-5 py-3">
                    Normal 1×
                  </th>

                  <th className="px-5 py-3">
                    OT 1.5×
                  </th>

                  <th className="px-5 py-3">
                    Sunday 2×
                  </th>

                  <th className="px-5 py-3">
                    Public Holiday 2×
                  </th>

                  <th className="px-5 py-3">
                    Normal Pay
                  </th>

                  <th className="px-5 py-3">
                    OT Pay
                  </th>

                  <th className="px-5 py-3">
                    Sunday Pay
                  </th>

                  <th className="px-5 py-3">
                    PH Pay
                  </th>

                  <th className="px-5 py-3">
                    Gross Pay
                  </th>
                </tr>
              </thead>

              <tbody>
                {payrollEmployees.map(
                  (item) => {
                    const employee =
                      item.employee;

                    return (
                      <tr
                        key={
                          employee.id
                        }
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">
                            {
                              employee.first_name
                            }{" "}
                            {
                              employee.last_name
                            }
                          </div>

                          <div className="text-xs text-gray-500">
                            {
                              employee.employee_number
                            }
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                          {formatCurrency(
                            Number(
                              employee.hourly_rate
                            ) || 0
                          )}
                          <div className="mt-1 text-xs font-normal text-gray-400">
                            per hour
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {item.totalHours.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {item.normalHours.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-orange-600">
                          {item.overtimeHours.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                          {item.sundayHours.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                          {item.publicHolidayHours.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {formatCurrency(
                            item.normalPay
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-orange-600">
                          {formatCurrency(
                            item.overtimePay
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                          {formatCurrency(
                            item.sundayPay
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                          {formatCurrency(
                            item.publicHolidayPay
                          )}
                        </td>

                        <td className="px-5 py-4 text-base font-bold text-gray-900">
                          {formatCurrency(
                            item.grossPay
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>

              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-5 py-4">
                    Total
                  </td>

                  <td className="px-5 py-4" />

                  <td className="px-5 py-4">
                    {totals.totalHours.toFixed(
                      2
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {totals.normalHours.toFixed(
                      2
                    )}
                  </td>

                  <td className="px-5 py-4 text-orange-600">
                    {totals.overtimeHours.toFixed(
                      2
                    )}
                  </td>

                  <td className="px-5 py-4 text-blue-600">
                    {totals.sundayHours.toFixed(
                      2
                    )}
                  </td>

                  <td className="px-5 py-4 text-blue-600">
                    {totals.publicHolidayHours.toFixed(
                      2
                    )}
                  </td>

                  <td className="px-5 py-4" />

                  <td className="px-5 py-4" />

                  <td className="px-5 py-4" />

                  <td className="px-5 py-4" />

                  <td className="px-5 py-4 font-bold">
                    {formatCurrency(
                      totals.grossPay
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* PAYROLL RULES */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock
            size={19}
            className="text-gray-500"
          />

          <h3 className="font-semibold text-gray-900">
            Payroll Rules
          </h3>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <strong className="text-gray-900">
              Hourly rate
            </strong>

            <p className="mt-1">
              Employees are paid according
              to their saved hourly rate.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <strong className="text-gray-900">
              First 45 hours
            </strong>

            <p className="mt-1">
              The first 45 applicable
              ordinary hours in each
              Monday-Sunday week are paid
              at the normal hourly rate.
            </p>
          </div>

          <div className="rounded-lg bg-orange-50 p-3">
            <strong className="text-orange-700">
              Above 45 hours
            </strong>

            <p className="mt-1 text-orange-700">
              Any applicable ordinary hours
              above 45 hours in the week
              are paid at 1.5× the hourly
              rate.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3">
            <strong className="text-blue-700">
              Sunday / Public Holiday
            </strong>

            <p className="mt-1 text-blue-700">
              Sunday and public-holiday
              hours are calculated separately
              at 2× the hourly rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}