import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma, initializeDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initializeDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        nickName: true,
        role: true,
        province: true,
        residenceType: true,
        specialNeeds: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nickName: user.nickName,
        role: user.role,
        province: user.province,
        residenceType: user.residenceType,
        specialNeeds: JSON.parse(user.specialNeeds || '[]'),
      },
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}
