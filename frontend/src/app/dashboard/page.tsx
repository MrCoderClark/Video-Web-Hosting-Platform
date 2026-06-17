import { Navbar } from "@/components/navbar";

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16 px-6">
        <div className="mx-auto max-w-7xl py-12">
          <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-text-secondary">
            Your videos will appear here once you upload them.
          </p>
        </div>
      </div>
    </>
  );
}
