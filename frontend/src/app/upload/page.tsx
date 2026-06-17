"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { uploadVideo, type UploadProgressEvent } from "@/lib/api";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type UploadState = "idle" | "uploading" | "done" | "error";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState<UploadProgressEvent | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;

    setUploadState("uploading");
    setProgress({ loaded: 0, total: file.size, percent: 0 });

    const { promise, abort } = uploadVideo(
      file,
      title || file.name.replace(/\.[^.]+$/, ""),
      description,
      (event) => setProgress(event)
    );

    abortRef.current = abort;

    try {
      const result = await promise;
      setUploadState("done");
      toast.success("Upload complete! Video queued for processing.");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      if (message === "Upload cancelled") {
        setUploadState("idle");
        setProgress(null);
      } else {
        setUploadState("error");
        toast.error(message);
      }
    }
  };

  const handleCancel = () => {
    abortRef.current?.();
    setUploadState("idle");
    setProgress(null);
  };

  const isUploading = uploadState === "uploading";
  const isDone = uploadState === "done";

  return (
    <>
      <Navbar />
      <div className="pt-16 px-6">
        <div className="mx-auto max-w-2xl py-12">
          <h1 className="font-heading text-3xl font-semibold">Upload Video</h1>
          <p className="mt-2 text-text-secondary">
            Share your work with the world.
          </p>

          <div className="mt-8 space-y-6">
            {/* Dropzone */}
            <UploadDropzone
              onFileSelect={setFile}
              selectedFile={file}
              onClear={() => {
                setFile(null);
                setUploadState("idle");
                setProgress(null);
              }}
              disabled={isUploading || isDone}
            />

            {/* Metadata fields */}
            {file && (
              <div className="space-y-4 rounded-xl border border-border-subtle bg-bg-surface p-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-text-secondary text-sm">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder={file.name.replace(/\.[^.]+$/, "")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading || isDone}
                    className="bg-bg-elevated border-border-subtle focus:border-accent-indigo placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-text-secondary text-sm"
                  >
                    Description{" "}
                    <span className="text-text-muted">(optional)</span>
                  </Label>
                  <textarea
                    id="description"
                    placeholder="Add a description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading || isDone}
                    rows={3}
                    className="flex w-full rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {/* Progress */}
            {progress && isUploading && (
              <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-surface p-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Uploading...</span>
                  <span className="font-mono text-text-primary">
                    {progress.percent}%
                  </span>
                </div>
                <Progress value={progress.percent} className="h-2" />
                <p className="text-xs text-text-muted">
                  {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
                </p>
              </div>
            )}

            {/* Done state */}
            {isDone && (
              <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.5} />
                <p className="text-sm text-success">
                  Upload complete — redirecting to dashboard...
                </p>
              </div>
            )}

            {/* Actions */}
            {file && !isDone && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-accent-indigo hover:bg-accent-indigo-hover text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all active:scale-[0.97]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
                {isUploading && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-border-subtle text-text-secondary hover:border-border-focus hover:text-text-primary"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
