import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loginTeam } from '@/lib/api-client';
import { hashPassword, verifyPassword, createSession } from '@/lib/auth';
import { prisma, initializeDatabase } from '@/lib/db';

const loginSchema = z.object({
  nickName: z.string().min(1, 'Nickname is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message;
        }
      }
      return NextResponse.json(
        { success: false, error: 'Validation failed', fieldErrors },
        { status: 400 },
      );
    }

    const { nickName, password } = parsed.data;

    // Try hackathon API login (non-blocking - fall back to local auth)
    let hackathonToken: string | null = null;
    try {
      const hackathonResult = await loginTeam(nickName, password);
      hackathonToken = hackathonResult.token;
    } catch {
      // Hackathon API unavailable - continue with local auth
    }

    // Find local user
    let user = await prisma.user.findUnique({
      where: { nickName },
    });

    if (user) {
      const passwordValid = await verifyPassword(password, user.password);
      if (!passwordValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 },
        );
      }
    } else if (hackathonToken) {
      const hashedPassword = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          nickName,
          password: hashedPassword,
          role: 'citizen',
          province: '',
          residenceType: '',
          specialNeeds: '[]',
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Create session JWT
    const sessionToken = await createSession({
      id: user.id,
      nickName: user.nickName,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, nickName: user.nickName, role: user.role },
    });

    response.headers.set(
      'Set-Cookie',
      `session=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
    );

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
