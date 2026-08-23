/** Cliente fetch simple para consumir la API desde componentes cliente. */
export class ApiClientError extends Error {}

async function manejarRespuesta<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(data?.error || `Error ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T,>(url: string) => fetch(url).then((r) => manejarRespuesta<T>(r)),
  post: <T,>(url: string, body?: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).then((r) => manejarRespuesta<T>(r)),
  patch: <T,>(url: string, body?: unknown) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).then((r) => manejarRespuesta<T>(r)),
  put: <T,>(url: string, body?: unknown) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).then((r) => manejarRespuesta<T>(r)),
  delete: <T,>(url: string) => fetch(url, { method: "DELETE" }).then((r) => manejarRespuesta<T>(r)),
};
