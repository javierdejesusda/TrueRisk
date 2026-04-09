import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID
            ? [Google({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            })]
            : []),
        ...(process.env.GITHUB_ID
            ? [GitHub({
                clientId: process.env.GITHUB_ID,
                clientSecret: process.env.GITHUB_SECRET!,
            })]
            : []),
        Credentials({
            credentials: {
                nickname: { label: 'Nickname', type: 'text' },
                password: { label: 'Password', type: 'password' },
                tokenData: { label: 'Token Data', type: 'text' },
            },
            async authorize(credentials) {
                // If pre-authenticated token data is provided (e.g. from registration),
                // use it directly instead of making another login request.
                if (credentials?.tokenData) {
                    const data = JSON.parse(credentials.tokenData as string);
                    return {
                        id: String(data.user.id),
                        name: data.user.nickname || data.user.display_name,
                        email: data.user.email,
                        image: data.user.avatar_url,
                        backendToken: data.access_token,
                        refreshToken: data.refresh_token,
                        tokenExpiresAt: Date.now() + data.expires_in * 1000,
                        role: data.user.role,
                    };
                }

                const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({
                        nickname: credentials?.nickname,
                        password: credentials?.password,
                    }),
                });
                if (!res.ok) return null;
                const data = await res.json();
                return {
                    id: String(data.user.id),
                    name: data.user.nickname || data.user.display_name,
                    email: data.user.email,
                    image: data.user.avatar_url,
                    backendToken: data.access_token,
                    refreshToken: data.refresh_token,
                    tokenExpiresAt: Date.now() + data.expires_in * 1000,
                    role: data.user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign-in via credentials
            if (user) {
                const u = user as Record<string, unknown>;
                token.backendToken = u.backendToken;
                token.refreshToken = u.refreshToken;
                token.tokenExpiresAt = u.tokenExpiresAt;
                token.role = u.role;
                token.userId = user.id;
            }
            // OAuth sign-in
            if (account && account.provider !== 'credentials') {
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        const res = await fetch(`${BACKEND_URL}/api/v1/auth/oauth`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                            body: JSON.stringify({
                                provider: account.provider,
                                provider_account_id: account.providerAccountId,
                                email: token.email || '',
                                display_name: token.name,
                                avatar_url: token.picture,
                            }),
                        });
                        if (res.ok) {
                            const data = await res.json();
                            token.backendToken = data.access_token;
                            token.refreshToken = data.refresh_token;
                            token.tokenExpiresAt = Date.now() + data.expires_in * 1000;
                            token.role = data.user.role;
                            token.userId = String(data.user.id);
                            break;
                        }
                    } catch {
                        if (attempt === 0) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }
            }

            // Token refresh: check if access token needs refreshing (3 min buffer)
            const REFRESH_BUFFER_MS = 3 * 60 * 1000;
            if (
                token.tokenExpiresAt &&
                Date.now() < (token.tokenExpiresAt as number) - REFRESH_BUFFER_MS
            ) {
                return token; // Still fresh
            }

            // Already cleared from a previous failed refresh — nothing to retry
            if (!token.refreshToken) {
                return token;
            }

            // Refresh needed
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        refresh_token: token.refreshToken,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    token.backendToken = data.access_token;
                    token.refreshToken = data.refresh_token;
                    token.tokenExpiresAt = Date.now() + data.expires_in * 1000;
                    return token;
                }
                console.warn('[auth] Token refresh failed:', res.status);
            } catch (err) {
                console.warn('[auth] Token refresh error:', err);
            }
            // Refresh failed -- clear tokens so useAuth triggers sign-out
            token.backendToken = null;
            token.refreshToken = null;
            token.tokenExpiresAt = null;

            return token;
        },
        async session({ session, token }) {
            return {
                ...session,
                backendToken: token.backendToken as string,
                user: {
                    ...session.user,
                    id: token.userId as string,
                    role: token.role as string,
                },
            };
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt' as const,
        maxAge: 7 * 24 * 60 * 60,  // 7 days
    },
    trustHost: true,
});
