import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });
    }

    const result = await db.select({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, payload.userId));

    if (result.length === 0) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
