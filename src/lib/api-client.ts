import { useAppStore } from '@/store/app-store';

let isRedirecting = false;

function handle401() {
    if (isRedirecting) return;
    isRedirecting = true;
    useAppStore.getState().clearAuth();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
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
    let response = await fetch(path, { ...options, headers });

    // On 401, try refreshing the session (which triggers JWT callback / token rotation)
    if (response.status === 401 && token) {
        try {
            const { getSession } = await import('next-auth/react');
            const session = await getSession();
            const newToken = (session as Record<string, unknown> | null)?.backendToken as
                | string
                | undefined;
            if (newToken && newToken !== token) {
                useAppStore.getState().setBackendToken(newToken);
                headers.set('Authorization', `Bearer ${newToken}`);
                response = await fetch(path, { ...options, headers });
            }
        } catch {
            // Session refresh failed
        }

        if (response.status === 401) {
            handle401();
        }
    }

    return response;
}
