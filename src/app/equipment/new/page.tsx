import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import CreateVehicleForm from "@/components/equipment/CreateVehicleForm";

export default function NewVehiclePage() {
  return (
    <div className="space-y-4">
      <EquipmentPageHeader title="Nuevo vehículo" backHref="/equipment" />

      <div className="max-w-5xl">
        <CreateVehicleForm />
      </div>
    </div>
  );
}
