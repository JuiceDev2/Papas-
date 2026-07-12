import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsersManager from "@/components/UsersManager";
import type { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "propietario") {
    redirect("/dashboard");
  }

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return <UsersManager staff={(staff as Profile[]) || []} />;
}
