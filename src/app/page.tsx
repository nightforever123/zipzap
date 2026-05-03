"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <div className="animate-pulse text-purple-400 text-xl">Загрузка...</div>
    </div>
  );
}
