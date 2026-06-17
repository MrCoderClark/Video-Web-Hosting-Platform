import { createClient } from "@/lib/supabase/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export function uploadVideo(
  file: File,
  title: string,
  description: string,
  onProgress?: (event: UploadProgressEvent) => void
): { promise: Promise<{ id: string; status: string; message: string }>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const abortController = { abort: () => xhr.abort() };

  const promise = new Promise<{ id: string; status: string; message: string }>(
    async (resolve, reject) => {
      try {
        const authHeaders = await getAuthHeaders();

        const formData = new FormData();
        formData.append("file", file);

        const params = new URLSearchParams();
        params.set("title", title || file.name.replace(/\.[^.]+$/, ""));
        if (description) params.set("description", description);

        xhr.open("POST", `${BACKEND_URL}/api/videos/upload?${params.toString()}`);

        Object.entries(authHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percent: Math.round((e.loaded / e.total) * 100),
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.detail || `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.send(formData);
      } catch (err) {
        reject(err);
      }
    }
  );

  return { promise, abort: abortController.abort };
}
