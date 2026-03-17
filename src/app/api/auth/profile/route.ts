import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma, initializeDatabase } from '@/lib/db';
import type { SpecialNeed } from '@/types/user';

const VALID_RESIDENCE_TYPES = [
  'sotano',
  'planta_baja',
  'piso_bajo',
  'piso_alto',
  'atico',
  'casa_unifamiliar',
  'caravana',
] as const;

const VALID_SPECIAL_NEEDS = [
  'wheelchair',
  'elderly',
  'children',
  'pets',
  'medical_equipment',
  'hearing_impaired',
  'visual_impaired',
  'respiratory',
] as const;

const updateProfileSchema = z.object({
  province: z.string().min(1, 'Province is required'),
  residenceType: z.enum(VALID_RESIDENCE_TYPES),
  specialNeeds: z.array(z.enum(VALID_SPECIAL_NEEDS)),
});

// ── GET ──────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    await initializeDatabase();
    const cookieStore = await cookies();
    const session = await getSessionFromCookies(cookieStore);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    let specialNeeds: SpecialNeed[] = [];
    try {
      specialNeeds = JSON.parse(user.specialNeeds) as SpecialNeed[];
    } catch {
      specialNeeds = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nickName: user.nickName,
        role: user.role,
        province: user.province,
        residenceType: user.residenceType,
        specialNeeds,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── PATCH ────────────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
    await initializeDatabase();
    const cookieStore = await cookies();
    const session = await getSessionFromCookies(cookieStore);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

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

    const { province, residenceType, specialNeeds } = parsed.data;

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        province,
        residenceType,
        specialNeeds: JSON.stringify(specialNeeds),
      },
    });

    let parsedNeeds: SpecialNeed[] = [];
    try {
      parsedNeeds = JSON.parse(user.specialNeeds) as SpecialNeed[];
    } catch {
      parsedNeeds = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nickName: user.nickName,
        role: user.role,
        province: user.province,
        residenceType: user.residenceType,
        specialNeeds: parsedNeeds,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
