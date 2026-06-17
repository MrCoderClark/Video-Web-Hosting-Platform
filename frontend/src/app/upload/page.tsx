import { Navbar } from "@/components/navbar";

export default function UploadPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16 px-6">
        <div className="mx-auto max-w-3xl py-12">
          <h1 className="font-heading text-3xl font-semibold">Upload Video</h1>
          <p className="mt-2 text-text-secondary">
            Drag and drop your video file or click to browse.
          </p>
          <div className="mt-8 flex items-center justify-center rounded-xl border-2 border-dashed border-border-subtle p-16 transition-colors hover:border-border-focus">
            <p className="text-text-muted">Upload functionality coming in Phase 2</p>
          </div>
        </div>
      </div>
    </>
  );
}
