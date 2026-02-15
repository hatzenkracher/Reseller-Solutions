import { DeviceForm } from "@/components/device-form";

export default function NewDevicePage() {
    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-primary">Neues Gerät erfassen</h1>
            <DeviceForm />
        </div>
    );
}
