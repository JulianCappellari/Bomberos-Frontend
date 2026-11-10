export type ContactInput = {
  name: string;
  category: string;
  phone: string;
  radioFrequency: string;
  email: string;
  address: string;
  notes: string;
  isEmergency: boolean;
};

export type OperationalContact = Omit<ContactInput, "phone" | "radioFrequency" | "email" | "address" | "notes"> & {
  id: string;
  phone: string | null;
  radioFrequency: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  revision: number;
  updatedAt: string;
};
