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
            },
            async authorize(credentials) {
                const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
                    role: data.user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                const u = user as Record<string, unknown>;
                token.backendToken = u.backendToken;
                token.role = u.role;
                token.userId = user.id;
            }
            if (account && account.provider !== 'credentials') {
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        const res = await fetch(`${BACKEND_URL}/api/v1/auth/oauth`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
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
        maxAge: 30 * 24 * 60 * 60,
    },
});
