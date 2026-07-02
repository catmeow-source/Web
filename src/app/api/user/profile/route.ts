import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, theme, reminderTiming } = await request.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (theme !== undefined) updateData.theme = theme;
    if (reminderTiming !== undefined) updateData.reminderTiming = parseInt(reminderTiming, 10);

    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      // Check if email already taken
      const emailCheck = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (emailCheck) {
        return NextResponse.json({ error: 'Email address is already in use' }, { status: 400 });
      }
      updateData.email = normalizedEmail;
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        theme: true,
        reminderTiming: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT user profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
