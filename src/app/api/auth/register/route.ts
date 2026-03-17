import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registerTeam } from '@/lib/api-client';
import { hashPassword, createSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const registerSchema = z.object({
  nickName: z.string().min(3, 'Nickname must be at least 3 characters'),
  teamName: z.string().min(1, 'Team name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  province: z.string().min(1, 'Province is required'),
  residenceType: z.string().min(1, 'Residence type is required'),
  specialNeeds: z.array(z.string()).optional().default([]),
  role: z.string().optional().default('citizen'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

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

    const { nickName, teamName, password, province, residenceType, specialNeeds, role } =
      parsed.data;

    // Register with hackathon API (non-blocking — local user is created regardless)
    try {
      await registerTeam(nickName, teamName, password);
    } catch (err) {
      console.warn('Hackathon API registration failed (continuing with local user):', err instanceof Error ? err.message : err);
    }

    // Hash password for local storage
    const hashedPassword = await hashPassword(password);

    // Create local user in Prisma
    let user;
    try {
      user = await prisma.user.create({
        data: {
          nickName,
          password: hashedPassword,
          role,
          province,
          residenceType,
          specialNeeds: JSON.stringify(specialNeeds),
        },
      });
    } catch (err) {
      // Handle unique constraint violation
      if (
        err instanceof Error &&
        err.message.includes('Unique constraint')
      ) {
        return NextResponse.json(
          { success: false, error: 'A user with this nickname already exists' },
          { status: 409 },
        );
      }
      throw err;
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
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
