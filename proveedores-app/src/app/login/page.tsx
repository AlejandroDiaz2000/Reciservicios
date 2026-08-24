"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const resultado = await signIn("credentials", {
      correo,
      password,
      redirect: false,
    });

    setCargando(false);

    if (resultado?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-navy-950)] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-slate-100">
          <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center mb-3 p-1.5 overflow-hidden">
            <Image src="/logo.png" alt="Reciservicios" width={64} height={64} className="h-full w-full object-contain" priority />
          </div>
          <h1 className="text-xl font-semibold">Reciservicios</h1>
          <p className="text-sm text-slate-400">Gestión de cumplimiento empresarial</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-slate-500 mb-6">
            Ingresa con tu correo corporativo para continuar.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                autoFocus
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)]"
                placeholder="nombre@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)]"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-[var(--color-navy-800)] hover:bg-[var(--color-navy-700)] text-white text-sm font-medium py-2.5 transition disabled:opacity-60"
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Acceso restringido a personal autorizado. Toda la actividad queda registrada para fines de auditoría.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
