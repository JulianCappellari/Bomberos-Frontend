"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  ExternalLink,
  FileCheck2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { useAssets } from "@/hooks/use-assets";
import {
  useComplianceRecords,
  useComplianceSummary,
  useCreateComplianceRecord,
  useDeleteComplianceRecord,
  useUpdateComplianceRecord,
} from "@/hooks/use-compliance";
import { getErrorMessage } from "@/lib/get-error-message";
import { getUserRosterRequest } from "@/services/user.service";
import {
  ComplianceCategory,
  ComplianceInput,
  ComplianceRecord,
  ComplianceStatus,
  ComplianceSubjectType,
} from "@/types/compliance";

const CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  TRAINING: "Capacitacion",
  CERTIFICATION: "Certificacion",
  MEDICAL_EXAM: "Apto medico",
  DRIVER_LICENSE: "Licencia de conducir",
  INSURANCE: "Seguro",
  VTV: "VTV",
  SERVICE: "Service",
  SCBA_SERVICE: "Service SCBA",
  OTHER: "Otro",
};

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  VALID: "Vigente",
  DUE_SOON: "Por vencer",
  EXPIRED: "Vencido",
  NO_EXPIRY: "Sin vencimiento",
};

const categories = Object.keys(CATEGORY_LABELS) as ComplianceCategory[];

const emptyForm: ComplianceInput = {
  subjectType: "USER",
  userId: "",
  assetId: "",
  category: "TRAINING",
  title: "",
  issuer: "",
  issuedAt: "",
  expiresAt: "",
  warningDays: 30,
  documentUrl: "",
  notes: "",
};

function inputFromRecord(record: ComplianceRecord): ComplianceInput {
  return {
    subjectType: record.subjectType,
    userId: record.userId || "",
    assetId: record.assetId || "",
    category: record.category,
    title: record.title,
    issuer: record.issuer || "",
    issuedAt: record.issuedAt?.slice(0, 10) || "",
    expiresAt: record.expiresAt?.slice(0, 10) || "",
    warningDays: record.warningDays,
    documentUrl: record.documentUrl || "",
    notes: record.notes || "",
  };
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status: ComplianceStatus) {
  if (status === "VALID") return "badge-green";
  if (status === "DUE_SOON") return "badge-yellow";
  if (status === "EXPIRED") return "badge-red";
  return "badge-gray";
}

export default function CompliancePage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "OPERATOR" || user?.role === "GUARD";
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ComplianceStatus | "ALL">("ALL");
  const [subjectType, setSubjectType] = useState<ComplianceSubjectType | "ALL">(
    "ALL",
  );
  const [category, setCategory] = useState<ComplianceCategory | "ALL">("ALL");
  const [editing, setEditing] = useState<ComplianceRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const query = useMemo(
    () => ({
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(status !== "ALL" ? { status } : {}),
      ...(subjectType !== "ALL" ? { subjectType } : {}),
      ...(category !== "ALL" ? { category } : {}),
    }),
    [q, status, subjectType, category],
  );
  const recordsQuery = useComplianceRecords(query);
  const summaryQuery = useComplianceSummary();
  const deleteMutation = useDeleteComplianceRecord();

  async function remove(record: ComplianceRecord) {
    if (!window.confirm(`Eliminar "${record.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(record.id);
    } catch (error) {
      window.alert(getErrorMessage(error, "No se pudo eliminar el registro."));
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(record: ComplianceRecord) {
    setEditing(record);
    setFormOpen(true);
  }

  const summary = summaryQuery.data;
  const records = recordsQuery.data || [];

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="section-title mb-1 mt-0">Cumplimiento y vencimientos</div>
            <p className="text-sm text-[var(--mut)]">
              Capacitaciones, documentacion y mantenimiento preventivo.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="app-button app-button-red w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Nuevo registro
            </button>
          )}
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          <Metric label="Total" value={summary?.total} icon={<FileCheck2 />} />
          <Metric label="Vigentes" value={summary?.valid} tone="green" icon={<BadgeCheck />} />
          <Metric label="Por vencer" value={summary?.dueSoon} tone="yellow" icon={<CalendarClock />} />
          <Metric label="Vencidos" value={summary?.expired} tone="red" icon={<AlertTriangle />} />
          <Metric label="Sin fecha" value={summary?.noExpiry} icon={<FileCheck2 />} />
        </section>

        <section className="card mt-4">
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,auto))]">
            <label className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--mut)]" />
              <input
                className="input-dark pl-10"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Buscar titulo, persona, vehiculo o emisor"
              />
            </label>
            <FilterSelect value={status} onChange={(value) => setStatus(value as ComplianceStatus | "ALL")}>
              <option value="ALL">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={subjectType} onChange={(value) => setSubjectType(value as ComplianceSubjectType | "ALL")}>
              <option value="ALL">Personas y equipos</option>
              <option value="USER">Bomberos</option>
              <option value="ASSET">Vehiculos / equipos</option>
            </FilterSelect>
            <FilterSelect value={category} onChange={(value) => setCategory(value as ComplianceCategory | "ALL")}>
              <option value="ALL">Todas las categorias</option>
              {categories.map((value) => (
                <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>
              ))}
            </FilterSelect>
          </div>
        </section>

        {recordsQuery.isLoading && <Panel text="Cargando registros..." />}
        {recordsQuery.isError && <Panel text="No se pudieron cargar los vencimientos." error />}
        {!recordsQuery.isLoading && !recordsQuery.isError && records.length === 0 && (
          <Panel text="No hay registros para los filtros seleccionados." />
        )}

        <section className="grid gap-3 xl:grid-cols-2">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              canManage={canManage}
              onEdit={() => openEdit(record)}
              onDelete={() => remove(record)}
            />
          ))}
        </section>

        {formOpen && (
          <RecordFormModal
            record={editing}
            onClose={() => setFormOpen(false)}
          />
        )}
      </main>
    </ProtectedLayout>
  );
}

function Metric({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value?: number;
  icon: React.ReactNode;
  tone?: "default" | "green" | "yellow" | "red";
}) {
  const colors = {
    default: "text-red-400 bg-red-500/10",
    green: "text-emerald-300 bg-emerald-500/10",
    yellow: "text-yellow-200 bg-yellow-500/10",
    red: "text-red-300 bg-red-500/10",
  }[tone];
  return (
    <div className="card mb-0 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${colors}`}>
        <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value ?? "..."}</div>
        <div className="text-xs uppercase text-[var(--mut)]">{label}</div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select className="input-dark" value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  );
}

function RecordCard({
  record,
  canManage,
  onEdit,
  onDelete,
}: {
  record: ComplianceRecord;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const remaining =
    record.daysRemaining === null
      ? "No requiere renovacion"
      : record.daysRemaining < 0
        ? `Vencio hace ${Math.abs(record.daysRemaining)} dias`
        : record.daysRemaining === 0
          ? "Vence hoy"
          : `${record.daysRemaining} dias restantes`;

  return (
    <article className="card mb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${statusClass(record.status)}`}>
              {STATUS_LABELS[record.status]}
            </span>
            <span className="badge badge-blue">{CATEGORY_LABELS[record.category]}</span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">{record.title}</h2>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--mut)]">
            <UserRound className="h-4 w-4 shrink-0" />
            <span className="truncate">{record.subjectName}</span>
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <button className="btn-icon" onClick={onEdit} title="Editar" aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </button>
            <button className="btn-icon text-red-300" onClick={onDelete} title="Eliminar" aria-label="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Info label="Emision" value={formatDate(record.issuedAt)} />
        <Info label="Vencimiento" value={formatDate(record.expiresAt)} />
      </div>
      <div className={`mt-2 rounded-[8px] border px-3 py-2 text-sm ${
        record.status === "EXPIRED"
          ? "border-red-500/25 bg-red-500/10 text-red-200"
          : record.status === "DUE_SOON"
            ? "border-yellow-500/25 bg-yellow-500/10 text-yellow-100"
            : "border-[var(--bord)] bg-[var(--card2)] text-[var(--mut)]"
      }`}>
        {remaining}
      </div>

      {(record.issuer || record.notes || record.documentUrl) && (
        <div className="mt-3 border-t border-[var(--bord)] pt-3 text-sm text-[var(--mut)]">
          {record.issuer && <div>Emisor: <span className="text-white">{record.issuer}</span></div>}
          {record.notes && <p className="mt-1 whitespace-pre-wrap">{record.notes}</p>}
          {record.documentUrl && (
            <a
              href={record.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 font-bold text-red-300"
            >
              <ExternalLink className="h-4 w-4" /> Ver documento
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--bord)] bg-[var(--card2)] p-3">
      <div className="text-xs uppercase text-[var(--mut)]">{label}</div>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function Panel({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div className={`card text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-200" : "text-[var(--mut)]"}`}>
      {text}
    </div>
  );
}

function RecordFormModal({
  record,
  onClose,
}: {
  record: ComplianceRecord | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ComplianceInput>(
    record ? inputFromRecord(record) : emptyForm,
  );
  const [error, setError] = useState("");
  const rosterQuery = useQuery({ queryKey: ["users", "roster"], queryFn: getUserRosterRequest });
  const assetsQuery = useAssets();
  const createMutation = useCreateComplianceRecord();
  const updateMutation = useUpdateComplianceRecord();
  const pending = createMutation.isPending || updateMutation.isPending;

  function set<K extends keyof ComplianceInput>(key: K, value: ComplianceInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (record) {
        await updateMutation.mutateAsync({ id: record.id, data: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onClose();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo guardar el registro."));
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-xl border border-[var(--bord)] bg-[var(--surf)] p-4 sm:max-w-2xl sm:rounded-xl sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold uppercase text-white">
              {record ? "Editar registro" : "Nuevo registro"}
            </h2>
            <p className="text-xs text-[var(--mut)]">Control documental y preventivo</p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Aplicar a">
            <select
              className="input-dark"
              value={form.subjectType}
              onChange={(event) => set("subjectType", event.target.value as ComplianceSubjectType)}
            >
              <option value="USER">Bombero</option>
              <option value="ASSET">Vehiculo / equipo</option>
            </select>
          </Field>
          <Field label={form.subjectType === "USER" ? "Bombero" : "Vehiculo / equipo"}>
            {form.subjectType === "USER" ? (
              <select className="input-dark" required value={form.userId} onChange={(event) => set("userId", event.target.value)}>
                <option value="">Seleccionar...</option>
                {(rosterQuery.data || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.profile?.fullName || item.username} - {item.profile?.rank || item.role}
                  </option>
                ))}
              </select>
            ) : (
              <select className="input-dark" required value={form.assetId} onChange={(event) => set("assetId", event.target.value)}>
                <option value="">Seleccionar...</option>
                {(assetsQuery.data || []).map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Categoria">
            <select className="input-dark" value={form.category} onChange={(event) => set("category", event.target.value as ComplianceCategory)}>
              {categories.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}
            </select>
          </Field>
          <Field label="Titulo">
            <input className="input-dark" required minLength={3} maxLength={140} value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Ej: RCP avanzado 2026" />
          </Field>
          <Field label="Institucion / emisor">
            <input className="input-dark" maxLength={140} value={form.issuer} onChange={(event) => set("issuer", event.target.value)} />
          </Field>
          <Field label="Avisar con anticipacion">
            <select className="input-dark" value={form.warningDays} onChange={(event) => set("warningDays", Number(event.target.value))}>
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </Field>
          <Field label="Fecha de emision">
            <input className="input-dark" type="date" value={form.issuedAt} onChange={(event) => set("issuedAt", event.target.value)} />
          </Field>
          <Field label="Fecha de vencimiento">
            <input className="input-dark" type="date" min={form.issuedAt || undefined} value={form.expiresAt} onChange={(event) => set("expiresAt", event.target.value)} />
          </Field>
          <Field label="URL del documento" wide>
            <input className="input-dark" type="url" value={form.documentUrl} onChange={(event) => set("documentUrl", event.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Notas" wide>
            <textarea className="input-dark min-h-24 resize-y" maxLength={4000} value={form.notes} onChange={(event) => set("notes", event.target.value)} />
          </Field>
        </div>

        {error && <div className="mt-3 rounded-[8px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="app-button app-button-outline sm:w-auto">Cancelar</button>
          <button type="submit" disabled={pending} className="app-button app-button-red sm:w-auto">
            {pending ? "Guardando..." : "Guardar registro"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="app-label">{label}</span>
      {children}
    </label>
  );
}
