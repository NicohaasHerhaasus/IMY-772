// // src/lib/api/apiClient.ts
// // All fetch calls go through here. Keeps base URL and error handling in one place.

// const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// export class ApiError extends Error {
//   public status: number;

//   constructor(status: number, message: string) {
//     super(message);
//     this.name = 'ApiError';
//     this.status = status;
//   }
// }

// export async function apiFetch<T>(
//   path: string,
//   options?: RequestInit,
// ): Promise<T> {
//   const res = await fetch(`${BASE_URL}${path}`, {
//     headers: {
//       'Content-Type': 'application/json',
//       ...options?.headers,
//     },
//     ...options,
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => res.statusText);
//     throw new ApiError(res.status, text);
//   }

//   return res.json() as Promise<T>;
// }

// // For admin routes that require the Cognito Bearer token.
// // Import fetchAuthSession from aws-amplify when Cognito is wired up.
// export async function apiFetchProtected<T>(
//   path: string,
//   options?: RequestInit,
// ): Promise<T> {
//   // TODO: replace with real Cognito token once Amplify is configured
//   // const { tokens } = await fetchAuthSession();
//   // const token = tokens?.accessToken.toString() ?? '';
//   const token = '';

//   return apiFetch<T>(path, {
//     ...options,
//     headers: {
//       ...options?.headers,
//       Authorization: `Bearer ${token}`,
//     },
//   });
// }

// src/lib/api/apiClient.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export async function apiFetchProtected<T>(path: string, options?: RequestInit): Promise<T> {
  const token = '';
  return apiFetch<T>(path, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
}