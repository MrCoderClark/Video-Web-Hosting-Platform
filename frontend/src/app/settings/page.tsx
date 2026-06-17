import { Navbar } from "@/components/navbar";

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16 px-6">
        <div className="mx-auto max-w-3xl py-12">
          <h1 className="font-heading text-3xl font-semibold">Settings</h1>
          <p className="mt-2 text-text-secondary">
            Manage your account preferences.
          </p>
        </div>
      </div>
    </>
  );
}
