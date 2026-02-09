export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type ApiError = {
  message: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const { headers, ...rest } = options;
  const mergedHeaders = new Headers({ 'Content-Type': 'application/json' });

  if (headers) {
    const extraHeaders = new Headers(headers);
    extraHeaders.forEach((value, key) => mergedHeaders.set(key, value));
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return (await response.json()) as T;
}
