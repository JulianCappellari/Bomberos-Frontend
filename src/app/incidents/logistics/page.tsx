"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import {
  ErrorNotice,
  Field,
  personName,
  stationDate,
} from "@/components/operations/operations-ui";
import { useAuth } from "@/features/auth/auth-context";
import { isCommand, isDutyManager } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { UserRosterItem } from "@/types/user";

type Authorization = {
  assetId: string;
  userId: string;
  requiredClass: string;
  validUntil: string;
  revision: number;
  licenseRevision: number | null;
  licenseCurrent: boolean;
};

type Options = {
  assets: Array<{ id: string; name: string; status: string }>;
  people: UserRosterItem[];
  authorizations: Authorization[];
};

export default function DriverAuthorizationsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const allowed = isDutyManager(user?.role);
  const canEdit = isCommand(user?.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = useQuery({
    queryKey: ["mission-options", user?.id],
    enabled: allowed,
    queryFn: async () => (await api.get<Options>("/incidents/logistics/options")).data,
  });

  async function save(path: string, data: unknown, method: "post" | "put") {
    setBusy(true);
    setError("");
    try {
      await api.request({ url: `/incidents/logistics${path}`, method, data });
      await client.invalidateQueries({ queryKey: ["mission-options"] });
      return true;
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "No se pudo guardar la habilitación."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitAuthorization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const assetId = String(form.get("assetId"));
    const userId = String(form.get("userId"));
    const existing = options.data?.authorizations.find(
      (authorization) =>
        authorization.assetId === assetId && authorization.userId === userId,
    );
    const saved = await save(
      "/authorizations",
      { ...Object.fromEntries(form), revision: existing?.revision ?? 0 },
      "put",
    );
    if (saved) formElement.reset();
  }

  async function revokeAuthorization(
    event: FormEvent<HTMLFormElement>,
    authorization: Authorization,
  ) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const reason = String(new FormData(formElement).get("reason") || "");
    const saved = await save(
      "/authorizations/revoke",
      {
        assetId: authorization.assetId,
        userId: authorization.userId,
        revision: authorization.revision,
        reason,
      },
      "post",
    );
    if (saved) formElement.reset();
  }

  const pending = options.data?.authorizations.filter(
    (authorization) =>
      !authorization.licenseCurrent &&
      authorization.validUntil.slice(0, 10) >= stationDate(),
  );

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <Link href="/incidents" className="text-sm underline">
          Volver a intervenciones
        </Link>
        <h1 className="my-4 text-2xl font-bold">Habilitaciones de conductores</h1>
        <p className="mb-4 text-sm text-[var(--mut)]">
          Las salidas y sus retornos se registran en la planilla única de cada
          emergencia. Aquí solo se administran las habilitaciones de conducción.
        </p>
        {!allowed ? (
          <ErrorNotice>Acceso reservado a guardia y jefatura.</ErrorNotice>
        ) : (
          <>
            {(error || options.isError) && (
              <ErrorNotice>{error || "No se pudieron consultar las habilitaciones."}</ErrorNotice>
            )}
            {options.isLoading && <ListSkeleton label="Cargando habilitaciones" />}
            {pending && pending.length > 0 && (
              <section className="my-4 border-l-4 border-amber-500 pl-3">
                <h2 className="font-bold">Conductores pendientes de revalidación</h2>
                <ul className="mt-2 text-sm">
                  {pending.map((authorization) => (
                    <li key={`${authorization.assetId}:${authorization.userId}`}>
                      {options.data?.assets.find((asset) => asset.id === authorization.assetId)?.name}
                      {" · "}
                      {personName(
                        options.data?.people.find(
                          (person) => person.id === authorization.userId,
                        ) || {
                          id: authorization.userId,
                          username: "Personal",
                          role: "FIREFIGHTER",
                          profile: null,
                        },
                      )}
                      {" · "}
                      {authorization.licenseRevision
                        ? `Licencia revisada: versión ${authorization.licenseRevision}; modificada o no vigente`
                        : "Sin licencia vinculada"}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {canEdit && options.data && (
              <section className="card">
                <h2 className="font-bold">Nueva o renovada habilitación</h2>
                <p className="my-2 text-sm text-[var(--mut)]">
                  La licencia debe estar declarada y vigente hasta la fecha de
                  habilitación. Si cambia, jefatura debe revisarla nuevamente.
                </p>
                <form onSubmit={submitAuthorization}>
                  <fieldset
                    disabled={busy}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Field label="Móvil">
                      <select name="assetId" required className="app-input">
                        {options.data.assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Conductor">
                      <select name="userId" required className="app-input">
                        {options.data.people
                          .filter((person) => person.id !== user?.id)
                          .map((person) => (
                            <option key={person.id} value={person.id}>
                              {personName(person)}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Clase de licencia exigida">
                      <input
                        name="requiredClass"
                        required
                        maxLength={12}
                        className="app-input"
                      />
                    </Field>
                    <p className="text-sm text-[var(--mut)] sm:col-span-2">
                      La habilitación rige hasta el vencimiento de la licencia
                      declarada y se conserva si la licencia se renueva sin
                      cambiar número ni clases.
                    </p>
                    <Field label="Motivo y verificación realizada">
                      <textarea
                        name="reason"
                        minLength={10}
                        maxLength={1000}
                        required
                        className="app-input"
                      />
                    </Field>
                    <button className="app-button self-end">
                      Guardar habilitación
                    </button>
                  </fieldset>
                </form>
              </section>
            )}
            <section className="card mt-4">
              <h2 className="font-bold">Habilitaciones registradas</h2>
              {!options.data?.authorizations.length ? (
                <p className="mt-2 text-sm text-[var(--mut)]">
                  No hay habilitaciones de conducción registradas.
                </p>
              ) : (
                <ul className="mt-2 space-y-3 text-sm">
                  {options.data.authorizations.map((authorization) => (
                    <li
                      key={`${authorization.assetId}:${authorization.userId}`}
                      className="border-t border-[var(--bord)] pt-3"
                    >
                      <p>
                        {options.data?.assets.find(
                          (asset) => asset.id === authorization.assetId,
                        )?.name}
                        {" · "}
                        {personName(
                          options.data?.people.find(
                            (person) => person.id === authorization.userId,
                          ) || {
                            id: authorization.userId,
                            username: "Personal",
                            role: "FIREFIGHTER",
                            profile: null,
                          },
                        )}
                        {" · Clase "}
                        {authorization.requiredClass}
                        {" · Hasta "}
                        {authorization.validUntil.slice(0, 10)}
                        {" · "}
                        {authorization.licenseCurrent
                          ? "Licencia vigente"
                          : "Requiere revalidación"}
                      </p>
                      {canEdit &&
                        authorization.validUntil.slice(0, 10) >= stationDate() && (
                          <form
                            className="my-2 flex flex-wrap gap-2"
                            onSubmit={(event) =>
                              void revokeAuthorization(event, authorization)
                            }
                          >
                            <input
                              aria-label="Motivo de revocación"
                              name="reason"
                              placeholder="Motivo de revocación"
                              required
                              minLength={10}
                              maxLength={1000}
                              className="app-input min-w-0 flex-1"
                              disabled={busy}
                            />
                            <button className="app-button w-auto" disabled={busy}>
                              Revocar habilitación
                            </button>
                          </form>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </ProtectedLayout>
  );
}
