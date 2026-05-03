import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationCodes } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Введите код" }, { status: 400 });
    }

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });
    }

    const codes = await db.select().from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, payload.email),
          eq(verificationCodes.code, code),
          gt(verificationCodes.expiresAt, new Date())
        )
      );

    if (codes.length === 0) {
      return NextResponse.json({ error: "Неверный или просроченный код" }, { status: 400 });
    }

    await db.update(users).set({ isVerified: true }).where(eq(users.email, payload.email));
    await db.delete(verificationCodes).where(eq(verificationCodes.email, payload.email));

    return NextResponse.json({ message: "Email подтверждён!" });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
