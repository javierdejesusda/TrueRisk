import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, initializeDatabase } from '@/lib/db';

const EMERGENCY_TYPES = [
  'flood',
  'heat_wave',
  'cold_snap',
  'wind_storm',
  'thunderstorm',
  'general',
] as const;

// ── POST schema ──────────────────────────────────────────────────────────

const createAlertSchema = z.object({
  severity: z.number().int().min(1).max(5),
  type: z.enum(EMERGENCY_TYPES),
  province: z.string().optional(),
  municipality: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  weatherData: z.record(z.string(), z.unknown()).optional(),
});

// ── PATCH schema ─────────────────────────────────────────────────────────

const updateAlertSchema = z.object({
  id: z.number().int(),
  isActive: z.boolean().optional(),
  severity: z.number().int().min(1).max(5).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

// ── DELETE schema ────────────────────────────────────────────────────────

const deleteAlertSchema = z.object({
  id: z.number().int(),
});

// ── GET ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');
    const provinceParam = searchParams.get('province');

    const where: Record<string, unknown> = {};

    if (activeParam === 'true') {
      where.isActive = true;
    } else if (activeParam === 'false') {
      where.isActive = false;
    }

    if (provinceParam) {
      where.province = provinceParam;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (err) {
    console.error('Alerts GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── POST ─────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = createAlertSchema.safeParse(body);

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

    const { severity, type, province, municipality, title, description, weatherData } =
      parsed.data;

    const alert = await prisma.alert.create({
      data: {
        severity,
        type,
        province: province ?? null,
        municipality: municipality ?? null,
        title,
        description,
        weatherData: weatherData ? JSON.stringify(weatherData) : null,
        isActive: true,
        autoDetected: false,
      },
    });

    return NextResponse.json({ success: true, data: alert }, { status: 201 });
  } catch (err) {
    console.error('Alerts POST error:', err);
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
    const body = await request.json();
    const parsed = updateAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed' },
        { status: 400 },
      );
    }

    const { id, ...updates } = parsed.data;

    const alert = await prisma.alert.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, data: alert });
  } catch (err) {
    console.error('Alerts PATCH error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = deleteAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed' },
        { status: 400 },
      );
    }

    await prisma.alert.delete({ where: { id: parsed.data.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Alerts DELETE error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
