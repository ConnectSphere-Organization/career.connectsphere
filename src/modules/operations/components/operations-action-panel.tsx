"use client";

import { FilePlus2, LoaderCircle, ReceiptText, Send } from "lucide-react";
import {
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmployeeOption = {
  id: string;
  employeeCode: string;
  user: { name: string; email: string };
  department?: { name: string } | null;
  designation?: { name: string } | null;
};

type ActionGroup = "people" | "payroll" | "exit" | "documents";
type Result = { tone: "success" | "error"; message: string } | null;
type OperationPermissions = {
  attendance: boolean;
  leave: boolean;
  payroll: boolean;
  settlement: boolean;
  exit: boolean;
  documents: boolean;
};

const groups: Array<{ id: ActionGroup; label: string }> = [
  { id: "people", label: "People" },
  { id: "payroll", label: "Payroll" },
  { id: "exit", label: "Exit" },
  { id: "documents", label: "Documents" },
];

export function OperationsActionPanel({
  employees,
  permissions,
}: {
  employees: EmployeeOption[];
  permissions: OperationPermissions;
}) {
  const [group, setGroup] = useState<ActionGroup>("people");
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  const availableGroups = groups.filter((item) =>
    groupAllowed(item.id, permissions),
  );
  const activeGroup = availableGroups.some((item) => item.id === group)
    ? group
    : (availableGroups[0]?.id ?? "people");
  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.employeeCode} - ${employee.user.name}`,
        meta: [
          employee.department?.name,
          employee.designation?.name,
          employee.user.email,
        ]
          .filter(Boolean)
          .join(" / "),
      })),
    [employees],
  );
  if (availableGroups.length === 0) return null;

  async function submit(
    key: string,
    domain: string,
    body: Record<string, unknown>,
  ) {
    setBusy(key);
    setResult(null);
    const response = await fetch(`/api/admin/operations/${domain}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      error?: { message?: string };
    } | null;
    setBusy(null);
    if (!response.ok) {
      setResult({
        tone: "error",
        message:
          payload?.message ??
          payload?.error?.message ??
          "The operation could not be completed.",
      });
      return;
    }
    setResult({ tone: "success", message: "Operation saved successfully." });
  }

  return (
    <section
      aria-labelledby="operations-actions-heading"
      className="rounded-lg border border-slate-200 bg-white"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="operations-actions-heading"
            className="text-base font-semibold text-slate-950"
          >
            Quick operations
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Create common HR, payroll, exit and document records without leaving
            the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {availableGroups.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGroup(item.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none ${
                activeGroup === item.id
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {result ? (
        <p
          role="status"
          className={`mx-4 mt-4 rounded-md border px-3 py-2 text-sm ${
            result.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {result.message}
        </p>
      ) : null}

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {activeGroup === "people" ? (
          <>
            {permissions.attendance ? (
              <AttendanceForm
                employees={employeeOptions}
                busy={busy}
                submit={submit}
              />
            ) : null}
            {permissions.leave ? (
              <LeaveForm
                employees={employeeOptions}
                busy={busy}
                submit={submit}
              />
            ) : null}
          </>
        ) : null}
        {activeGroup === "payroll" ? (
          <>
            {permissions.payroll ? (
              <PayrollForm busy={busy} submit={submit} />
            ) : null}
            {permissions.settlement ? (
              <SettlementForm
                employees={employeeOptions}
                busy={busy}
                submit={submit}
              />
            ) : null}
          </>
        ) : null}
        {activeGroup === "exit" ? (
          <>
            {permissions.exit ? (
              <>
                <ResignationForm
                  employees={employeeOptions}
                  busy={busy}
                  submit={submit}
                />
                <TerminationForm
                  employees={employeeOptions}
                  busy={busy}
                  submit={submit}
                />
              </>
            ) : null}
          </>
        ) : null}
        {activeGroup === "documents" ? (
          <DocumentForm
            employees={employeeOptions}
            busy={busy}
            submit={submit}
          />
        ) : null}
      </div>
    </section>
  );
}

function groupAllowed(group: ActionGroup, permissions: OperationPermissions) {
  if (group === "people") return permissions.attendance || permissions.leave;
  if (group === "payroll") return permissions.payroll || permissions.settlement;
  if (group === "exit") return permissions.exit;
  return permissions.documents;
}

function AttendanceForm({
  employees,
  busy,
  submit,
}: FormProps & { employees: SelectOption[] }) {
  return (
    <ActionForm
      title="Attendance"
      description="Regularize a daily attendance record."
      actionKey="attendance"
      busy={busy}
      onSubmit={(event) => {
        const form = readForm(event);
        void submit("attendance", "attendance", {
          employeeId: text(form, "employeeId"),
          date: text(form, "date"),
          status: text(form, "status"),
          checkIn: optionalText(form, "checkIn"),
          checkOut: optionalText(form, "checkOut"),
          notes: optionalText(form, "notes"),
        });
      }}
    >
      <EmployeeSelect employees={employees} />
      <Field name="date" label="Date" type="date" required />
      <Field name="checkIn" label="Check in" type="datetime-local" />
      <Field name="checkOut" label="Check out" type="datetime-local" />
      <SelectField
        name="status"
        label="Status"
        options={["PRESENT", "ABSENT", "HALF_DAY", "REMOTE", "HOLIDAY"]}
      />
      <Field name="notes" label="Notes" />
    </ActionForm>
  );
}

function LeaveForm({
  employees,
  busy,
  submit,
}: FormProps & { employees: SelectOption[] }) {
  return (
    <ActionForm
      title="Leave request"
      description="Create a leave request for approval."
      actionKey="leave"
      busy={busy}
      onSubmit={(event) => {
        const form = readForm(event);
        void submit("leave", "leave", {
          employeeId: text(form, "employeeId"),
          leaveType: text(form, "leaveType"),
          startsAt: text(form, "startsAt"),
          endsAt: text(form, "endsAt"),
          days: number(form, "days"),
          reason: text(form, "reason"),
        });
      }}
    >
      <EmployeeSelect employees={employees} />
      <SelectField
        name="leaveType"
        label="Type"
        options={[
          "CASUAL",
          "SICK",
          "EARNED",
          "UNPAID",
          "MATERNITY",
          "PATERNITY",
        ]}
      />
      <Field name="startsAt" label="Starts" type="date" required />
      <Field name="endsAt" label="Ends" type="date" required />
      <Field
        name="days"
        label="Days"
        type="number"
        min="0.5"
        step="0.5"
        required
      />
      <Field name="reason" label="Reason" required />
    </ActionForm>
  );
}

function PayrollForm({ busy, submit }: FormProps) {
  return (
    <ActionForm
      title="Payroll run"
      description="Generate draft payslips from active salary structures."
      actionKey="payroll"
      busy={busy}
      onSubmit={(event) => {
        const form = readForm(event);
        void submit("payroll", "payroll", {
          code: text(form, "code"),
          periodStart: text(form, "periodStart"),
          periodEnd: text(form, "periodEnd"),
          payDate: text(form, "payDate"),
          currency: text(form, "currency").toUpperCase(),
        });
      }}
    >
      <Field name="code" label="Run code" placeholder="PAY-2026-07" required />
      <Field name="periodStart" label="Period start" type="date" required />
      <Field name="periodEnd" label="Period end" type="date" required />
      <Field name="payDate" label="Pay date" type="date" required />
      <Field name="currency" label="Currency" defaultValue="INR" required />
    </ActionForm>
  );
}

function SettlementForm({
  employees,
  busy,
  submit,
}: FormProps & { employees: SelectOption[] }) {
  return (
    <ActionForm
      title="Final settlement"
      description="Create a settlement draft for finance review."
      actionKey="settlement"
      busy={busy}
      onSubmit={(event) => {
        const form = readForm(event);
        void submit("settlement", "settlement", {
          employeeId: text(form, "employeeId"),
          currency: text(form, "currency").toUpperCase(),
          salaryPayable: number(form, "salaryPayable"),
          leaveEncashment: number(form, "leaveEncashment"),
          gratuity: number(form, "gratuity"),
          bonus: number(form, "bonus"),
          reimbursements: number(form, "reimbursements"),
          recoveries: number(form, "recoveries"),
          tax: number(form, "tax"),
          components: {},
        });
      }}
    >
      <EmployeeSelect employees={employees} />
      <Field name="currency" label="Currency" defaultValue="INR" required />
      <Field
        name="salaryPayable"
        label="Salary payable"
        type="number"
        min="0"
        defaultValue="0"
      />
      <Field
        name="leaveEncashment"
        label="Leave encashment"
        type="number"
        min="0"
        defaultValue="0"
      />
      <Field
        name="gratuity"
        label="Gratuity"
        type="number"
        min="0"
        defaultValue="0"
      />
      <Field
        name="bonus"
        label="Bonus"
        type="number"
        min="0"
        defaultValue="0"
      />
      <Field
        name="reimbursements"
        label="Reimbursements"
        type="number"
        min="0"
        defaultValue="0"
      />
      <Field
        name="recoveries"
        label="Recoveries"
        type="number"
        min="0"
        defaultValue="0"
      />
      <Field name="tax" label="Tax" type="number" min="0" defaultValue="0" />
    </ActionForm>
  );
}

function ResignationForm({
  employees,
  busy,
  submit,
}: FormProps & { employees: SelectOption[] }) {
  return (
    <ActionForm
      title="Resignation"
      description="Start notice tracking and exit clearance."
      actionKey="resignation"
      busy={busy}
      onSubmit={(event) => {
        const form = readForm(event);
        void submit("resignation", "resignation", {
          employeeId: text(form, "employeeId"),
          requestedLastDay: text(form, "requestedLastDay"),
          noticeDays: number(form, "noticeDays"),
          reason: text(form, "reason"),
        });
      }}
    >
      <EmployeeSelect employees={employees} />
      <Field
        name="requestedLastDay"
        label="Requested last day"
        type="date"
        required
      />
      <Field
        name="noticeDays"
        label="Notice days"
        type="number"
        min="0"
        defaultValue="30"
        required
      />
      <Field name="reason" label="Reason" required />
    </ActionForm>
  );
}

function TerminationForm({
  employees,
  busy,
  submit,
}: FormProps & { employees: SelectOption[] }) {
  return (
    <ActionForm
      title="Termination"
      description="Record termination and start exit clearance."
      actionKey="termination"
      busy={busy}
      onSubmit={(event) => {
        const form = readForm(event);
        void submit("termination", "termination", {
          employeeId: text(form, "employeeId"),
          type: text(form, "type"),
          effectiveDate: text(form, "effectiveDate"),
          noticeDays: number(form, "noticeDays"),
          reason: text(form, "reason"),
        });
      }}
    >
      <EmployeeSelect employees={employees} />
      <SelectField
        name="type"
        label="Type"
        options={[
          "PERFORMANCE",
          "MISCONDUCT",
          "REDUNDANCY",
          "CONTRACT_END",
          "OTHER",
        ]}
      />
      <Field name="effectiveDate" label="Effective date" type="date" required />
      <Field
        name="noticeDays"
        label="Notice days"
        type="number"
        min="0"
        defaultValue="0"
        required
      />
      <Field name="reason" label="Reason" required />
    </ActionForm>
  );
}

function DocumentForm({
  employees,
  busy,
  submit,
}: FormProps & { employees: SelectOption[] }) {
  return (
    <ActionForm
      title="Controlled document"
      description="Issue a verifiable document with QR status."
      actionKey="document"
      busy={busy}
      onSubmit={(event) => {
        const form = readForm(event);
        const snapshot = parseJson(optionalText(form, "snapshot") ?? "{}");
        void submit("document", "document", {
          employeeId: text(form, "employeeId"),
          type: text(form, "type"),
          title: text(form, "title"),
          expiresAt: optionalText(form, "expiresAt"),
          snapshot,
        });
      }}
      icon={<FilePlus2 className="size-4" aria-hidden="true" />}
    >
      <EmployeeSelect employees={employees} />
      <SelectField
        name="type"
        label="Type"
        options={[
          "APPOINTMENT_LETTER",
          "EXPERIENCE_LETTER",
          "RELIEVING_LETTER",
          "TERMINATION_LETTER",
          "PAYSLIP",
          "FINAL_SETTLEMENT",
          "OTHER",
        ]}
      />
      <Field name="title" label="Title" required />
      <Field name="expiresAt" label="Expires at" type="date" />
      <TextArea name="snapshot" label="Snapshot JSON" defaultValue="{}" />
    </ActionForm>
  );
}

type SelectOption = { value: string; label: string; meta?: string };
type FormProps = {
  busy: string | null;
  submit: (
    key: string,
    domain: string,
    body: Record<string, unknown>,
  ) => Promise<void>;
};

function ActionForm({
  title,
  description,
  actionKey,
  busy,
  onSubmit,
  children,
  icon,
}: {
  title: string;
  description: string;
  actionKey: string;
  busy: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  icon?: React.ReactNode;
}) {
  const loading = busy === actionKey;
  return (
    <form
      className="rounded-lg border border-slate-200 p-4"
      onSubmit={onSubmit}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
        </div>
        {icon ?? (
          <ReceiptText className="size-4 text-slate-500" aria-hidden="true" />
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <Button size="sm" className="mt-4" disabled={Boolean(busy)}>
        {loading ? <LoaderCircle className="animate-spin" /> : <Send />}
        Save
      </Button>
    </form>
  );
}

function EmployeeSelect({ employees }: { employees: SelectOption[] }) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor="employeeId">Employee</Label>
      <select
        id="employeeId"
        name="employeeId"
        required
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none"
      >
        <option value="">Select employee</option>
        {employees.map((employee) => (
          <option key={employee.value} value={employee.value}>
            {employee.label}
            {employee.meta ? ` (${employee.meta})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  name,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {humanize(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  name,
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none"
        {...props}
      />
    </div>
  );
}

function readForm(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return new FormData(event.currentTarget);
}

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function optionalText(form: FormData, key: string) {
  const value = text(form, key);
  return value || undefined;
}

function number(form: FormData, key: string) {
  return Number(text(form, key) || "0");
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}
