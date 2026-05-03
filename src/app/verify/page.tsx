"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [codes, setCodes] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (data.user) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCodes.every(c => c !== "")) {
      handleVerify(newCodes.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setCodes(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess("Email подтверждён! Перенаправляем...");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("Ошибка подключения");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/resend", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setTimer(60);
      setCanResend(false);
      setCodes(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Ошибка подключения");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-indigo-900/20" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="glass rounded-2xl p-8 w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Подтверждение Email
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Мы отправили 4-значный код на
          </p>
          <p className="text-purple-400 text-sm font-medium mt-1">{userEmail || "ваш email"}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl mb-6 text-sm animate-fade-in">
            {success}
          </div>
        )}

        <div className="flex justify-center gap-3 mb-8">
          {codes.map((code, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-16 h-20 text-center text-3xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 transition-all"
              disabled={loading}
            />
          ))}
        </div>

        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium text-sm"
            >
              {resendLoading ? "Отправка..." : "Отправить код повторно"}
            </button>
          ) : (
            <p className="text-slate-500 text-sm">
              Отправить повторно через <span className="text-purple-400 font-mono">{timer}с</span>
            </p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center mt-4">
            <svg className="animate-spin h-5 w-5 text-purple-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
