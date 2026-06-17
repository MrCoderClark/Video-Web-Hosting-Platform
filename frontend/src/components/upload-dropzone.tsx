"use client";

import { useCallback, useState } from "react";
import { Upload, Film, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
  "video/x-m4v",
];

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
}

export function UploadDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

      if (!isValidType) {
        setError(`Invalid file type. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`);
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [disabled, validateAndSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      e.target.value = "";
    },
    [validateAndSelect]
  );

  if (selectedFile) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-indigo/10">
            <Film className="h-6 w-6 text-accent-indigo" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {selectedFile.name}
            </p>
            <p className="text-xs text-text-secondary">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          {!disabled && (
            <button
              onClick={onClear}
              className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-secondary transition-colors"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition-all duration-200",
          isDragOver
            ? "border-accent-indigo bg-accent-glow"
            : "border-border-subtle hover:border-border-focus",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileInput}
          disabled={disabled}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated mb-4">
          <Upload
            className={cn(
              "h-6 w-6 transition-colors",
              isDragOver ? "text-accent-indigo" : "text-text-muted"
            )}
            strokeWidth={1.5}
          />
        </div>
        <p className="text-sm font-medium text-text-primary">
          {isDragOver ? "Drop your video here" : "Drag & drop your video"}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          or click to browse — MP4, MOV, WebM, AVI, MKV up to 2 GB
        </p>
      </label>

      {error && (
        <p className="mt-3 text-sm text-error">{error}</p>
      )}
    </div>
  );
}
