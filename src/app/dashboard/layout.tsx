import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import type { Role } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Cuenta de Auth sin perfil asociado: no tiene rol asignado en la tienda.
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-cream">
      <Sidebar role={profile.role as Role} fullName={profile.full_name} />
      {/* pb-24 deja espacio para la barra de navegación inferior fija en móvil */}
      <main className="flex-1 min-w-0 p-4 pb-24 sm:p-8 sm:pb-8">{children}</main>
    </div>
  );
}
