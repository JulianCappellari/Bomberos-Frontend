import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import CreateVehicleForm from "@/components/equipment/CreateVehicleForm";

export default function NewVehiclePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <EquipmentPageHeader title="Nuevo vehículo" backHref="/equipment" />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <CreateVehicleForm />
      </div>
    </main>
  );
}