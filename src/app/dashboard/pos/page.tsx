import { createClient } from "@/lib/supabase/server";
import PosTerminal from "@/components/PosTerminal";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function PosPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("flavor", { ascending: true });

  return <PosTerminal products={(products as Product[]) || []} />;
}
