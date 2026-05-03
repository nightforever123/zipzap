import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, notes } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== "developer") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    const allNotes = await db.select({
      id: notes.id,
      userId: notes.userId,
      title: notes.title,
      content: notes.content,
      color: notes.color,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
      userNickname: users.nickname,
      userEmail: users.email,
    }).from(notes)
      .leftJoin(users, eq(notes.userId, users.id))
      .orderBy(desc(notes.createdAt));

    const totalNotes = await db.select().from(notes);

    return NextResponse.json({
      stats: {
        totalUsers: allUsers.length,
        totalNotes: totalNotes.length,
        verifiedUsers: allUsers.filter(u => u.isVerified).length,
      },
      users: allUsers,
      notes: allNotes,
    });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== "developer") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const { type, id } = await req.json();

    if (type === "user") {
      await db.delete(users).where(eq(users.id, id));
      return NextResponse.json({ message: "Пользователь удалён" });
    } else if (type === "note") {
      await db.delete(notes).where(eq(notes.id, id));
      return NextResponse.json({ message: "Заметка удалена" });
    }

    return NextResponse.json({ error: "Неверный тип" }, { status: 400 });
  } catch (error) {
    console.error("Admin DELETE error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
