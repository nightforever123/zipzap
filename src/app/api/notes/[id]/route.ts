import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });

    const { id } = await params;
    const noteId = parseInt(id);
    if (isNaN(noteId)) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

    const { title, content, color } = await req.json();

    const existing = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, payload.userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Заметка не найдена" }, { status: 404 });
    }

    const updated = await db.update(notes).set({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(color !== undefined && { color }),
      updatedAt: new Date(),
    }).where(eq(notes.id, noteId)).returning();

    return NextResponse.json({ note: updated[0] });
  } catch (error) {
    console.error("Notes PUT error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });

    const { id } = await params;
    const noteId = parseInt(id);
    if (isNaN(noteId)) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

    if (payload.role === "developer") {
      await db.delete(notes).where(eq(notes.id, noteId));
    } else {
      await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, payload.userId)));
    }

    return NextResponse.json({ message: "Заметка удалена" });
  } catch (error) {
    console.error("Notes DELETE error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
