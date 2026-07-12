"use client";

import { useState } from "react";
import { loginStaff } from "@/app/actions";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginStaff(formData);
    setLoading(false);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-coffee">Correo</label>
        <input
          name="email"
          type="email"
          required
          className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
          placeholder="tu@correo.com"
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-coffee">Contraseña</label>
        <input
          name="password"
          type="password"
          required
          className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-chili text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-chili disabled:opacity-50 hover:bg-chili-dark text-cream font-semibold py-2.5 rounded-full transition-colors"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
