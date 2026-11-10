import { api } from "@/lib/api-client";
import { ContactInput, OperationalContact } from "@/types/contact";

export async function getContactsRequest() {
  return (await api.get<OperationalContact[]>("/contacts")).data;
}
export async function createContactRequest(input: ContactInput) {
  return (await api.post<OperationalContact>("/contacts", input)).data;
}
export async function updateContactRequest(input: ContactInput & { id: string; revision: number }) {
  const { id, ...body } = input;
  return (await api.put<OperationalContact>(`/contacts/${id}`, body)).data;
}
export async function deleteContactRequest(input: { id: string; revision: number }) {
  return (await api.delete(`/contacts/${input.id}`, { params: { revision: input.revision } })).data;
}
