import { createClient } from "@/lib/supabase/server";
import ProductsManager from "@/components/ProductsManager";
import type { Product, Role } from "@/lib/types";

export const revalidate = 0;

export default async function ProductosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("flavor", { ascending: true });

  return (
    <ProductsManager
      role={profile!.role as Role}
      products={(products as Product[]) || []}
    />
  );
}
