"use client";

import { FormEvent, useState } from "react";
import { ErrorNotice, Field, personName } from "@/components/operations/operations-ui";
import { localNow, dateTime } from "@/components/operations/work-ui";
import { getErrorMessage } from "@/lib/get-error-message";
import { saveNotebook } from "@/services/work.service";
import { NotebookCategory, NotebookEntry } from "@/types/work";

const categories: Record<NotebookCategory, string> = {
  PLACE: "Lugar",
  PERSON: "Persona / tercero",
  VEHICLE: "Móvil / daño",
  AGENCY: "Otra fuerza o servicio",
  NOTE: "Novedad / nota",
  NOVELTY: "Novedad posterior",
  THIRD_PARTY: "Datos de terceros",
  CORRECTION: "Correccion documental",
  DAMAGE: "Daños y roturas",
};

export function IncidentNotebook({
  incidentId,
  entries,
  incidentOpen,
  canWrite,
  canAddAnnex,
  saved,
}: {
  incidentId: string;
  entries: NotebookEntry[];
  incidentOpen: boolean;
  canWrite: boolean;
  canAddAnnex: boolean;
  saved: () => Promise<unknown>;
}) {
  const [category, setCategory] = useState<NotebookCategory>("NOTE");
  const [occurredAt, setOccurredAt] = useState(localNow);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mayAdd = (incidentOpen && canWrite) || (!incidentOpen && canAddAnnex);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await saveNotebook(incidentId, null, {
        category,
        title: form.get("title"),
        body: form.get("body"),
        occurredAt: new Date(occurredAt).toISOString(),
      });
      event.currentTarget.reset();
      setCategory("NOTE");
      setOccurredAt(localNow());
      await saved();
    } catch (submitError: unknown) {
      setError(
        getErrorMessage(
          submitError,
          "No se pudo agregar la novedad a la planilla.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 space-y-4 rounded-lg border border-[var(--bord)] p-4">
      <div>
        <h2 className="text-lg font-bold">Bitácora de la emergencia</h2>
        <p className="text-sm text-[var(--mut)]">
          Novedades por categoría que forman parte de esta misma planilla.
          {incidentOpen
            ? " Se conserva quién anotó cada dato y cuándo ocurrió."
            : " Los anexos posteriores se agregan sin reabrir ni modificar el cierre."}
        </p>
      </div>
      {mayAdd && (
        <form className="space-y-3" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Categoría">
              <select
                className="app-input"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as NotebookCategory)
                }
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha y hora de la novedad">
              <input
                required
                className="app-input"
                type="datetime-local"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Título">
            <input
              required
              className="app-input"
              name="title"
              minLength={3}
              maxLength={160}
            />
          </Field>
          <Field label="Detalle">
            <textarea
              required
              className="app-input min-h-24"
              name="body"
              minLength={3}
              maxLength={4000}
            />
          </Field>
          {error && <ErrorNotice>{error}</ErrorNotice>}
          <button className="app-button app-button-red w-auto" disabled={busy}>
            {busy ? "Agregando..." : incidentOpen ? "Agregar a la planilla" : "Agregar anexo posterior"}
          </button>
        </form>
      )}
      {!incidentOpen && !canAddAnnex && (
        <p className="text-sm text-[var(--mut)]">
          Para agregar un anexo posterior se requiere registrar presencia activa por QR en el cuartel.
        </p>
      )}
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--mut)]">Todavía no hay novedades.</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-md border border-[var(--bord)] p-3"
            >
              <p className="text-xs font-bold uppercase text-red-300">
                {categories[entry.category]}
              </p>
              <h3 className="mt-1 font-bold">{entry.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">{entry.body}</p>
              <p className="mt-2 text-xs text-[var(--mut)]">
                {personName(entry.author)} · {dateTime(entry.occurredAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
