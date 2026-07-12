"use client";

import { useState } from "react";
import type { Product, Role } from "@/lib/types";
import { formatMXN, formatPresentation } from "@/lib/currency";
import { addProduct, deleteProduct, updateProduct } from "@/app/actions";

export default function ProductsManager({ role, products }: { role: Role; products: Product[] }) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const canDelete = role === "propietario";
  const canEdit = role === "propietario" || role === "admin";

  async function handleAdd(formData: FormData) {
    setError(null);
    const result = await addProduct(formData);
    if (result?.error) setError(result.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto del catálogo?")) return;
    const result = await deleteProduct(id);
    if (result?.error) setError(result.error);
  }

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateProduct(id, formData);
    if (result?.error) setError(result.error);
    else setEditing(null);
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-coffee mb-6">
        {role === "colaborador" ? "Agregar producto" : "Productos"}
      </h1>

      <div className="bg-paper rounded-2xl p-5 shadow-sm mb-8 max-w-lg">
        <p className="font-semibold text-coffee mb-3">Nuevo producto</p>
        <form action={handleAdd} className="space-y-3">
          <div>
            <label className="text-sm text-coffee/70">Nombre</label>
            <input
              name="name"
              defaultValue="Papas Doradas"
              className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-coffee/70">Sabor</label>
            <input
              name="flavor"
              required
              placeholder="Ej. Chile Picante"
              className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-sm text-coffee/70">Presentación</label>
              <select
                name="presentation"
                className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
              >
                <option value="150g">Bolsa 150 g</option>
                <option value="1000g">Kilo 1000 g</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm text-coffee/70">Precio (MXN)</label>
              <input
                name="price"
                type="number"
                step="0.5"
                min="0"
                required
                className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-coffee/70">
            <input type="checkbox" name="popular" /> Mostrar en el carrusel de populares
          </label>
          {error && <p className="text-chili text-sm">{error}</p>}
          <button className="bg-chili hover:bg-chili-dark text-cream font-semibold px-4 py-2 rounded-full text-sm">
            Agregar producto
          </button>
        </form>
      </div>

      <p className="font-semibold text-coffee mb-3">Catálogo actual</p>
      <div className="bg-paper rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-cream text-coffee/70">
            <tr>
              <th className="text-left p-3">Sabor</th>
              <th className="text-left p-3">Presentación</th>
              <th className="text-left p-3">Precio</th>
              <th className="text-left p-3">Popular</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-coffee/10">
                {editing === p.id ? (
                  <td colSpan={5} className="p-3">
                    <form
                      action={(fd) => handleUpdate(p.id, fd)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        name="flavor"
                        defaultValue={p.flavor}
                        className="border border-coffee/20 rounded-lg px-2 py-1 text-sm w-40"
                      />
                      <input
                        name="price"
                        type="number"
                        step="0.5"
                        defaultValue={p.price}
                        className="border border-coffee/20 rounded-lg px-2 py-1 text-sm w-24"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="popular" defaultChecked={p.popular} /> Popular
                      </label>
                      <button className="bg-avocado text-cream text-xs font-semibold px-3 py-1.5 rounded-full">
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="text-xs text-coffee/60"
                      >
                        Cancelar
                      </button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="p-3 font-medium text-coffee">{p.flavor}</td>
                    <td className="p-3 text-coffee/70">{formatPresentation(p.presentation)}</td>
                    <td className="p-3 font-mono">{formatMXN(p.price)}</td>
                    <td className="p-3">{p.popular ? "Sí" : "—"}</td>
                    <td className="p-3 text-right space-x-2">
                      {canEdit && (
                        <button
                          onClick={() => setEditing(p.id)}
                          className="text-xs font-semibold text-coffee/70 hover:text-coffee"
                        >
                          Editar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-xs font-semibold text-chili hover:text-chili-dark"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!canDelete && (
        <p className="text-xs text-coffee/50 mt-2">
          Tu rol puede agregar productos al catálogo, pero no eliminarlos.
        </p>
      )}
    </div>
  );
}
