"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { inviteStaffUser } from "@/app/actions";

export default function UsersManager({ staff }: { staff: Profile[] }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleInvite(formData: FormData) {
    setError(null);
    setSuccess(false);
    const result = await inviteStaffUser(formData);
    if (result?.error) setError(result.error);
    else setSuccess(true);
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-coffee mb-6">Usuarios</h1>

      <div className="bg-paper rounded-2xl p-5 shadow-sm mb-8 max-w-md">
        <p className="font-semibold text-coffee mb-3">Agregar personal</p>
        <form action={handleInvite} className="space-y-3">
          <div>
            <label className="text-sm text-coffee/70">Nombre completo</label>
            <input name="full_name" required className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-coffee/70">Correo</label>
            <input name="email" type="email" required className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-coffee/70">Contraseña temporal</label>
            <input name="password" type="password" required minLength={8} className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-coffee/70">Rol</label>
            <select name="role" className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm">
              <option value="admin">Admin</option>
              <option value="colaborador">Colaborador</option>
              <option value="propietario">Propietario</option>
            </select>
          </div>
          {error && <p className="text-chili text-sm">{error}</p>}
          {success && <p className="text-avocado text-sm">Usuario creado correctamente.</p>}
          <button className="bg-chili hover:bg-chili-dark text-cream font-semibold px-4 py-2 rounded-full text-sm">
            Crear cuenta
          </button>
        </form>
      </div>

      <p className="font-semibold text-coffee mb-3">Personal actual</p>
      <div className="bg-paper rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-cream text-coffee/70">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Desde</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-coffee/10">
                <td className="p-3">{s.full_name}</td>
                <td className="p-3 capitalize">{s.role}</td>
                <td className="p-3 text-coffee/60">{new Date(s.created_at).toLocaleDateString("es-MX")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
