import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Hashes a plaintext password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hashed: string,
): Promise<boolean> {
  return compare(password, hashed);
}

interface SessionPayload {
  id: number;
  nickName: string;
  role: string;
}

/**
 * Creates a signed JWT session token.
 * Token expires in 24 hours.
 */
export async function createSession(user: SessionPayload): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    nickName: user.nickName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecret());

  return token;
}

/**
 * Verifies a JWT token and returns the session payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    const id = payload.id;
    const nickName = payload.nickName;
    const role = payload.role;

    if (typeof id !== 'number' || typeof nickName !== 'string' || typeof role !== 'string') {
      return null;
    }

    return { id, nickName, role };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies a session from request cookies.
 * Looks for a "session" cookie containing the JWT.
 */
export async function getSessionFromCookies(
  cookies: { get(name: string): { value: string } | undefined },
): Promise<SessionPayload | null> {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie?.value) {
    return null;
  }

  return verifySession(sessionCookie.value);
}
