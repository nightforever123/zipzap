import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { verificationCodes } from "@/db/schema";
import { verifyToken, generateVerificationCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });
    }

    await db.delete(verificationCodes).where(eq(verificationCodes.email, payload.email));

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await db.insert(verificationCodes).values({ email: payload.email, code, expiresAt });

    await sendVerificationEmail(payload.email, code);

    return NextResponse.json({ message: "Код отправлен повторно" });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
