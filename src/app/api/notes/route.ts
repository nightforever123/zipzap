import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });

    const userNotes = await db.select().from(notes)
      .where(eq(notes.userId, payload.userId))
      .orderBy(desc(notes.createdAt));

    return NextResponse.json({ notes: userNotes });
  } catch (error) {
    console.error("Notes GET error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });

    const { title, content, color } = await req.json();
    if (!title) return NextResponse.json({ error: "Заголовок обязателен" }, { status: 400 });

    const newNote = await db.insert(notes).values({
      userId: payload.userId,
      title,
      content: content || "",
      color: color || "#7c3aed",
    }).returning();

    return NextResponse.json({ note: newNote[0] });
  } catch (error) {
    console.error("Notes POST error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
