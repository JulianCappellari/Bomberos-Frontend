"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MapPin, Pencil, Phone, Plus, Radio, RefreshCw, Search, ShieldAlert, Trash2, X } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";
import { createContactRequest, deleteContactRequest, getContactsRequest, updateContactRequest } from "@/services/contacts.service";
import { ContactInput, OperationalContact } from "@/types/contact";

const emptyForm: ContactInput = {
  name: "", category: "", phone: "", radioFrequency: "", email: "", address: "", notes: "", isEmergency: false,
};

export default function ContactsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const client = useQueryClient();
  const contacts = useQuery({ queryKey: ["contacts"], queryFn: getContactsRequest });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [editing, setEditing] = useState<OperationalContact | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [error, setError] = useState("");
  const rows = contacts.data || [];
  const categories = [...new Set(rows.map((contact) => contact.category))].sort();
  const visible = rows.filter((contact) =>
    (!category || contact.category === category) &&
    (!emergencyOnly || contact.isEmergency) &&
    [contact.name, contact.category, contact.phone, contact.radioFrequency, contact.email, contact.address, contact.notes]
      .some((value) => value?.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  );
  function refresh() {
    client.invalidateQueries({ queryKey: ["contacts"] });
    client.invalidateQueries({ queryKey: ["audit-logs"] });
  }
  const save = useMutation({
    mutationFn: () => editing
      ? updateContactRequest({ ...form, id: editing.id, revision: editing.revision })
      : createContactRequest(form),
    onSuccess: () => { refresh(); setFormOpen(false); setEditing(null); setForm(emptyForm); },
  });
  const remove = useMutation({ mutationFn: deleteContactRequest, onSuccess: refresh });
  const pending = save.isPending || remove.isPending;

  function openForm(contact: OperationalContact | null) {
    setEditing(contact);
    setForm(contact ? {
      name: contact.name, category: contact.category, phone: contact.phone || "",
      radioFrequency: contact.radioFrequency || "", email: contact.email || "",
      address: contact.address || "", notes: contact.notes || "", isEmergency: contact.isEmergency,
    } : { ...emptyForm });
    setError("");
    setFormOpen(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (![form.phone, form.radioFrequency, form.email].some((value) => value.trim())) {
      setError("Ingrese al menos un telefono, frecuencia de radio o correo.");
      return;
    }
    try { await save.mutateAsync(); }
    catch (err) { setError(getErrorMessage(err, "No se pudo guardar el contacto.")); refresh(); }
  }
  async function deleteContact(contact: OperationalContact) {
    if (!window.confirm(`Eliminar el contacto "${contact.name}"?`)) return;
    setError("");
    try { await remove.mutateAsync({ id: contact.id, revision: contact.revision }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo eliminar el contacto.")); refresh(); }
  }

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Contactos operativos</h1>
            <p className="mt-1 text-sm text-[var(--mut)]">{rows.length} contactos · {rows.filter((row) => row.isEmergency).length} prioritarios</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-icon" title="Actualizar contactos" aria-label="Actualizar contactos" onClick={refresh}><RefreshCw className="h-4 w-4" /></button>
            {canManage && <button type="button" className="app-button app-button-red w-auto" disabled={pending} onClick={() => openForm(null)}><Plus className="h-4 w-4" /> Nuevo contacto</button>}
          </div>
        </div>

        {error && <div role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        {canManage && formOpen && (
          <form onSubmit={submit} className="mb-5 border-y border-[var(--bord)] py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-bold text-white">{editing ? "Editar contacto" : "Nuevo contacto"}</h2>
              <button type="button" className="btn-icon" title="Cerrar formulario" aria-label="Cerrar formulario" disabled={pending} onClick={() => setFormOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
              {([
                ["name", "Nombre o institucion", 140], ["category", "Categoria", 80],
                ["phone", "Telefono", 40], ["radioFrequency", "Radio / canal / frecuencia", 80],
                ["email", "Correo", 120], ["address", "Direccion", 200],
              ] as const).map(([key, label, maxLength]) => (
                <label key={key}>
                  <span className="app-label">{label}</span>
                  <input className="app-input" type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                    required={key === "name" || key === "category"} minLength={key === "name" || key === "category" ? 2 : undefined}
                    maxLength={maxLength} list={key === "category" ? "contact-categories" : undefined}
                    value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
                </label>
              ))}
              <datalist id="contact-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist>
              <label className="sm:col-span-2">
                <span className="app-label">Notas operativas</span>
                <textarea className="app-input min-h-20" maxLength={4000} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--txt)]">
                <input type="checkbox" checked={form.isEmergency} onChange={(event) => setForm((current) => ({ ...current, isEmergency: event.target.checked }))} /> Contacto prioritario
              </label>
              <button type="submit" className="app-button app-button-red">{save.isPending ? "Guardando..." : "Guardar contacto"}</button>
            </fieldset>
          </form>
        )}

        <div className="mb-4 grid items-center gap-3 sm:grid-cols-[1fr_180px_auto]">
          <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[var(--mut)]" /><input aria-label="Buscar contactos" className="app-input pl-9" type="search" placeholder="Buscar contacto, telefono o canal" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <select aria-label="Filtrar por categoria" className="app-input" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas las categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <label className="flex items-center gap-2 text-sm text-[var(--mut)]"><input type="checkbox" checked={emergencyOnly} onChange={(event) => setEmergencyOnly(event.target.checked)} /> Prioritarios</label>
        </div>

        {contacts.isLoading && <p className="py-6 text-sm text-[var(--mut)]">Cargando contactos...</p>}
        {contacts.isError && <div role="alert" className="py-4 text-red-300">No se pudieron cargar los contactos. <button type="button" className="underline" onClick={() => contacts.refetch()}>Reintentar</button></div>}
        {!contacts.isLoading && !contacts.isError && visible.length === 0 && <p className="py-8 text-center text-sm text-[var(--mut)]">{rows.length ? "No hay contactos para estos filtros." : "Todavia no hay contactos registrados."}</p>}

        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((contact) => (
            <article key={contact.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="text-xs text-[var(--mut)]">{contact.category}</div><h2 className="mt-1 break-words text-lg font-bold text-white">{contact.name}</h2></div>
                {contact.isEmergency && <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" aria-label="Prioritario" />}
              </div>
              <div className="mt-3 space-y-3 text-sm">
                {contact.phone && <a className="flex items-center gap-2 break-all text-green-300" href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}><Phone className="h-4 w-4 shrink-0" />{contact.phone}</a>}
                {contact.radioFrequency && <div className="flex items-center gap-2 text-sky-300"><Radio className="h-4 w-4 shrink-0" /><span className="break-words">{contact.radioFrequency}</span></div>}
                {contact.email && <a className="flex items-center gap-2 break-all text-[var(--txt)]" href={`mailto:${contact.email}`}><Mail className="h-4 w-4 shrink-0" />{contact.email}</a>}
                {contact.address && <p className="flex items-center gap-2 text-[var(--mut)]"><MapPin className="h-4 w-4 shrink-0" />{contact.address}</p>}
                {contact.notes && <p className="whitespace-pre-wrap break-words text-[var(--mut)]">{contact.notes}</p>}
              </div>
              {canManage && <div className="mt-4 flex justify-end gap-2 border-t border-[var(--bord)] pt-3">
                <button type="button" className="btn-icon" title="Editar contacto" aria-label={`Editar ${contact.name}`} disabled={pending} onClick={() => openForm(contact)}><Pencil className="h-4 w-4" /></button>
                <button type="button" className="btn-icon text-red-300" title="Eliminar contacto" aria-label={`Eliminar ${contact.name}`} disabled={pending} onClick={() => deleteContact(contact)}><Trash2 className="h-4 w-4" /></button>
              </div>}
            </article>
          ))}
        </div>
      </main>
    </ProtectedLayout>
  );
}
