"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Presentation, Role } from "@/lib/types";

// ---------------------------------------------------------------
// AUTENTICACIÓN DE PERSONAL (propietario / admin / colaborador)
// ---------------------------------------------------------------
export async function loginStaff(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y tu contraseña." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/dashboard");
}

export async function logoutStaff() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function requireRole(allowed: Role[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No has iniciado sesión.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !allowed.includes(profile.role as Role)) {
    throw new Error("No tienes permiso para realizar esta acción.");
  }
  return { supabase, user, profile };
}

// ---------------------------------------------------------------
// PRODUCTOS
// Propietario: agregar / editar / eliminar
// Admin: agregar / editar (no elimina)
// Colaborador: solo agregar (no edita precio ajeno ni elimina)
// ---------------------------------------------------------------
export async function addProduct(formData: FormData) {
  const { supabase, user } = await requireRole(["propietario", "admin", "colaborador"]);

  const name = String(formData.get("name") || "Papas Doradas").trim();
  const flavor = String(formData.get("flavor") || "").trim();
  const presentation = String(formData.get("presentation") || "150g") as Presentation;
  const price = Number(formData.get("price") || 0);
  const popular = formData.get("popular") === "on";

  if (!flavor) return { error: "El sabor es obligatorio." };
  if (!["150g", "1000g"].includes(presentation)) return { error: "Presentación inválida." };
  if (!(price > 0)) return { error: "El precio debe ser mayor a 0." };

  const { error } = await supabase.from("products").insert({
    name,
    flavor,
    presentation,
    price,
    popular,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/productos");
  revalidatePath("/");
  return { success: true };
}

export async function updateProduct(productId: string, formData: FormData) {
  const { supabase } = await requireRole(["propietario", "admin"]);

  const flavor = String(formData.get("flavor") || "").trim();
  const price = Number(formData.get("price") || 0);
  const popular = formData.get("popular") === "on";

  if (!flavor) return { error: "El sabor es obligatorio." };
  if (!(price > 0)) return { error: "El precio debe ser mayor a 0." };

  const { error } = await supabase
    .from("products")
    .update({ flavor, price, popular, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/productos");
  revalidatePath("/");
  return { success: true };
}

// Solo el propietario puede eliminar (el colaborador NO puede, según el
// requisito original). RLS lo refuerza también a nivel base de datos.
export async function deleteProduct(productId: string) {
  const { supabase } = await requireRole(["propietario"]);
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/productos");
  revalidatePath("/");
  return { success: true };
}

// ---------------------------------------------------------------
// PEDIDO DEL CLIENTE (tienda pública, sin login)
// ---------------------------------------------------------------
export async function createClienteOrder(
  customerName: string,
  customerPhone: string,
  items: { product_id: string; qty: number }[]
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("create_cliente_order", {
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_items: items,
  });

  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath("/dashboard/pedidos");
  return { success: true, orderId: row.order_id, folio: row.folio, total: row.total };
}

// ---------------------------------------------------------------
// VENTA DE MOSTRADOR (POS) — Propietario / Colaborador
// ---------------------------------------------------------------
export async function createPosSale(
  items: { product_id: string; qty: number }[],
  received: number
) {
  const { supabase } = await requireRole(["propietario", "colaborador"]);

  const { data, error } = await supabase.rpc("create_pos_sale", {
    p_items: items,
    p_received: received,
  });

  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath("/dashboard/historial");
  revalidatePath("/dashboard");
  return {
    success: true,
    orderId: row.order_id,
    folio: row.folio,
    total: row.total,
    change: row.change,
  };
}

// ---------------------------------------------------------------
// MARCAR PEDIDO DE CLIENTE COMO COBRADO/DESPACHADO
// Propietario / Colaborador (el admin solo consulta)
// ---------------------------------------------------------------
export async function markOrderCobrado(orderId: string) {
  const { supabase } = await requireRole(["propietario", "colaborador"]);
  const { error } = await supabase.rpc("mark_order_cobrado", { p_order_id: orderId });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---------------------------------------------------------------
// GESTIÓN DE PERSONAL — Solo Propietario
// Crea la cuenta en Supabase Auth (Service Role) + su perfil/rol
// ---------------------------------------------------------------
export async function inviteStaffUser(formData: FormData) {
  await requireRole(["propietario"]);

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "") as Role;

  if (!email || !password || !fullName) return { error: "Todos los campos son obligatorios." };
  if (!["admin", "colaborador", "propietario"].includes(role)) {
    return { error: "Rol inválido." };
  }
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created?.user) {
    return { error: createErr?.message || "No se pudo crear el usuario." };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    role,
    full_name: fullName,
  });

  if (profileErr) return { error: profileErr.message };

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}
