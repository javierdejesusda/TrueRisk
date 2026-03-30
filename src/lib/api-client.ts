import { useAppStore } from '@/store/app-store';

let isRedirecting = false;

function handle401() {
    if (isRedirecting) return;
    isRedirecting = true;
    useAppStore.getState().clearAuth();
    window.location.href = '/login';
    setTimeout(() => { isRedirecting = false; }, 3000);
}

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
    headers.set('X-Requested-With', 'XMLHttpRequest');
    const response = await fetch(path, { ...options, headers });
    // Only redirect on 401 if we actually sent a token (meaning it's expired/invalid).
    // A 401 without a token just means auth hasn't hydrated yet — not an error.
    if (response.status === 401 && token) {
        handle401();
    }
    return response;
}
