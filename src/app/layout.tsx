import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NotesApp — Заметки",
  description: "Приложение для заметок с авторизацией",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen bg-[#0f0f1a] text-slate-200">
        {children}
      </body>
    </html>
  );
}
