import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickName: true,
        role: true,
        province: true,
        residenceType: true,
        specialNeeds: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse specialNeeds from JSON string to array
    const parsed = users.map((u) => {
      let needs: string[] = [];
      try {
        needs = JSON.parse(u.specialNeeds) as string[];
      } catch {
        needs = [];
      }
      return { ...u, specialNeeds: needs };
    });

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Citizens GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
