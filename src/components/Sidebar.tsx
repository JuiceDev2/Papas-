"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { logoutStaff } from "@/app/actions";

const TABS: Record<Role, { href: string; label: string }[]> = {
  propietario: [
    { href: "/dashboard", label: "Resumen" },
    { href: "/dashboard/pos", label: "Venta" },
    { href: "/dashboard/productos", label: "Productos" },
    { href: "/dashboard/pedidos", label: "Pedidos" },
    { href: "/dashboard/historial", label: "Historial" },
    { href: "/dashboard/usuarios", label: "Usuarios" },
  ],
  admin: [
    { href: "/dashboard", label: "Resumen" },
    { href: "/dashboard/productos", label: "Productos" },
    { href: "/dashboard/pedidos", label: "Pedidos" },
    { href: "/dashboard/historial", label: "Historial" },
  ],
  colaborador: [
    { href: "/dashboard/pos", label: "Venta" },
    { href: "/dashboard/productos", label: "Agregar" },
    { href: "/dashboard/pedidos", label: "Pedidos" },
  ],
};

export default function Sidebar({ role, fullName }: { role: Role; fullName: string }) {
  const pathname = usePathname();
  const tabs = TABS[role];

  return (
    <>
      {/* Barra superior en móvil: identidad + cerrar sesión */}
      <div className="sm:hidden safe-top bg-coffee text-cream px-4 pb-3 flex items-center justify-between sticky top-0 z-40">
        <div>
          <p className="font-display font-extrabold text-sm leading-tight">Papas Doradas 🥔</p>
          <p className="text-[10px] text-gold uppercase tracking-wide">
            {fullName} · {role}
          </p>
        </div>
        <form action={logoutStaff}>
          <button className="text-xs text-cream/70 underline underline-offset-2">Salir</button>
        </form>
      </div>

      {/* Sidebar en escritorio */}
      <aside className="hidden sm:flex sm:flex-col w-56 shrink-0 bg-coffee text-cream min-h-screen">
        <div className="p-4">
          <p className="font-display font-extrabold">Papas Doradas 🥔</p>
          <p className="text-xs text-cream/60 mt-1">{fullName}</p>
          <p className="text-xs uppercase tracking-wide text-gold">{role}</p>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 rounded-lg text-sm ${
                pathname === t.href ? "bg-gold text-coffee font-semibold" : "hover:bg-cream/10"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-2">
          <form action={logoutStaff}>
            <button className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-cream/10">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Barra de navegación inferior en móvil (estilo app instalada) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-coffee text-cream flex safe-bottom pt-1.5 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.15)]">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 text-center text-[11px] font-semibold py-1.5 rounded-lg mx-0.5 ${
              pathname === t.href ? "bg-gold text-coffee" : "text-cream/70"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
