# Papas Doradas 🥔

App web para vender papas doradas por **bolsa (150 g)** y por **kilo (1000 g)**.
Next.js 14 (React + TypeScript) + Supabase (Postgres, Auth, RLS) + Vercel.

## Roles

| Rol | Puede hacer |
|---|---|
| **Propietario** | Ve el historial completo de todos los usuarios, agrega/edita/elimina productos, usa el POS, marca pedidos como cobrados, crea cuentas de personal. |
| **Admin** | Ve todo el historial de ventas/pedidos y el catálogo de productos (agrega/edita, no elimina). No marca pedidos como cobrados ni gestiona usuarios. |
| **Colaborador** | Usa el punto de venta (POS), agrega productos al catálogo (no puede eliminarlos), ve y marca como cobrados los pedidos que llegan de la tienda pública. |
| **Cliente** | No necesita cuenta. Ve la tienda pública, arma su carrito y hace su pedido con nombre + teléfono. |

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Entra a **SQL Editor** y pega el contenido completo de `supabase/schema.sql`. Ejecútalo.
   Esto crea las tablas, las políticas de seguridad (RLS) y las funciones que
   procesan pedidos, ventas de mostrador e historial. También agrega 10 productos
   de ejemplo (5 sabores x 2 presentaciones).
3. Ve a **Project Settings > API** y copia:
   - `Project URL`
   - `anon public key`
   - `service_role key` (¡mantenla secreta, solo se usa en el servidor!)

## 2. Crear las 3 cuentas de personal

La primera cuenta (Propietario) se crea manualmente una sola vez; desde ahí,
el propietario puede crear a los demás desde la pestaña **Usuarios** del panel.

Para crear la primera cuenta manualmente:

1. En Supabase, ve a **Authentication > Users > Add user**, crea un usuario con
   correo y contraseña.
2. Ve a **Table Editor > profiles** y agrega una fila:
   - `id`: el UUID del usuario que acabas de crear (columna `id` en Authentication > Users)
   - `role`: `propietario`
   - `full_name`: el nombre que quieras mostrar

Con esa cuenta ya puedes entrar a `/login` y desde **Usuarios** crear al Admin
y al Colaborador (esto crea la cuenta de Auth y su perfil en un solo paso).

## 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Llena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` con los valores del paso 1.

## 4. Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` para la tienda pública, y
`http://localhost:3000/login` para el acceso del personal.

## 5. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub/GitLab.
2. En [vercel.com](https://vercel.com), importa el repositorio.
3. En **Environment Variables**, agrega las mismas 3 variables de `.env.local`
   (marca `SUPABASE_SERVICE_ROLE_KEY` como variable solo de servidor).
4. Deploy. Vercel detecta Next.js automáticamente.

## Notas de diseño

- **Historial preciso (propietario):** cada acción relevante (pedido de
  cliente, venta de mostrador, producto agregado, pedido cobrado) se guarda en
  la tabla `audit_log` desde las funciones de base de datos, así que no depende
  de que el frontend "recuerde" registrar nada.
- **El colaborador no puede borrar productos:** reforzado dos veces — no hay
  botón de eliminar en su vista, y además la política RLS `products_delete_owner`
  en Supabase solo permite `DELETE` al rol `propietario`, aunque alguien intente
  llamar a la API directamente.
- **Ticket por WhatsApp:** el botón "Enviar por WhatsApp" abre `wa.me` con el
  resumen del pedido ya redactado, para elegir el contacto y enviarlo
  manualmente (no requiere una cuenta de WhatsApp Business ni un número fijo).
- **Precios de ejemplo:** los precios del seed son solo de referencia; cámbialos
  desde la pestaña Productos cuando quieras.

## Responsive y PWA

- Toda la interfaz (tienda, login y panel) está pensada mobile-first: catálogo
  en cuadrícula de 2/3/4 columnas según el ancho, carrito en cajón lateral en
  escritorio y a pantalla completa en celular, tablas con scroll horizontal en
  pantallas chicas, y en el punto de venta el resumen de la venta aparece
  primero en móvil para cobrar sin tener que hacer scroll.
- En el panel (`/dashboard`), el menú lateral se convierte en una barra de
  navegación inferior fija en móvil, como una app nativa.
- La app es instalable (PWA): tiene `manifest.webmanifest`, íconos, y un
  service worker (`public/sw.js`) que permite abrir la tienda y el panel aunque
  se pierda la conexión momentáneamente (los datos se refrescan en cuanto
  vuelve la señal).
- **Para instalarla:**
  - **Android/Chrome:** abre la URL, toca el menú (⋮) y selecciona
    "Instalar aplicación" o "Agregar a pantalla de inicio".
  - **iPhone/Safari:** abre la URL, toca el ícono de compartir (□↑) y elige
    "Agregar a pantalla de inicio".
- El service worker solo se activa en producción o sirviendo con `npm run build && npm run start`
  (en `npm run dev` puede que Chrome no lo registre de inmediato; no afecta el
  funcionamiento normal de la app, solo la instalación offline).
