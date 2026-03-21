import { useAppStore } from '@/store/app-store';

export async function apiFetch(
    path: string,
    options: RequestInit = {},
): Promise<Response> {
    const token = useAppStore.getState().backendToken;
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }
    return fetch(path, { ...options, headers });
}
