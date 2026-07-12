export type Role = "propietario" | "admin" | "colaborador";

export type Presentation = "150g" | "1000g";

export interface Product {
  id: string;
  name: string;
  flavor: string;
  presentation: Presentation;
  price: number;
  popular: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "pendiente" | "cobrado";
export type OrderSource = "cliente" | "pos";

export interface Order {
  id: string;
  folio: string;
  source: OrderSource;
  customer_name: string | null;
  customer_phone: string | null;
  status: OrderStatus;
  total: number;
  received: number | null;
  change: number | null;
  created_by: string | null;
  cobrado_by: string | null;
  cobrado_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  flavor: string;
  presentation: Presentation;
  unit_price: number;
  qty: number;
  subtotal: number;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: string;
  actor_name: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  created_at: string;
}

export interface CartLine {
  product: Product;
  qty: number;
}
