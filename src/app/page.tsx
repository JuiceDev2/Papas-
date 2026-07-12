import { createClient } from "@/lib/supabase/server";
import Storefront from "@/components/Storefront";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("flavor", { ascending: true });

  return <Storefront products={(products as Product[]) || []} />;
}
