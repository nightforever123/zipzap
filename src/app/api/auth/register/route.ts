import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationCodes } from "@/db/schema";
import { hashPassword, generateToken, generateVerificationCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, nickname, password, confirmPassword } = await req.json();

    if (!email || !nickname || !password || !confirmPassword) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Пароли не совпадают" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль должен быть не менее 6 символов" }, { status: 400 });
    }

    if (nickname.length < 2 || nickname.length > 30) {
      return NextResponse.json({ error: "Никнейм должен быть от 2 до 30 символов" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await db.insert(users).values({
      email,
      nickname,
      password: hashedPassword,
      role: "user",
      isVerified: false,
    }).returning();

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await db.insert(verificationCodes).values({ email, code, expiresAt });

    await sendVerificationEmail(email, code);

    const token = generateToken({
      userId: newUser[0].id,
      email: newUser[0].email,
      role: newUser[0].role,
    });

    const response = NextResponse.json({
      user: { id: newUser[0].id, email: newUser[0].email, nickname: newUser[0].nickname, role: newUser[0].role, isVerified: newUser[0].isVerified },
      message: "Регистрация успешна! Проверьте email для подтверждения.",
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
