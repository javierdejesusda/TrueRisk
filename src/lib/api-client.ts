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
    const response = await fetch(path, { ...options, headers });
    if (response.status === 401) {
        handle401();
    }
    return response;
}
