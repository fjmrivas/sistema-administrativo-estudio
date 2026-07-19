# Sistema Administrativo — Estudio Contable

App web para el estudio contable: gestión de empresas cliente (Cuentas por Cobrar,
Cuentas por Pagar, Bancos, Caja Chica, Proyectos). React + Vite + Tailwind, datos y
auth con Supabase (Postgres + Auth + RLS).

## Setup local

```bash
npm install
cp .env.example .env   # completar con URL y anon key de Supabase (Project Settings → API)
npm run dev
```

El acceso ya está resuelto por RLS en Supabase: un usuario con `cliente_id = NULL`
(staff del estudio) ve todas las empresas y elige cuál mirar desde el selector de la
barra superior; un usuario con `cliente_id` asignado ve solo su propia empresa.

## Estado actual

Construido:
- Login contra Supabase Auth
- Layout con sidebar (grupos General / Tesorería / Planeamiento / Cumplimiento SUNAT),
  responsive (drawer en mobile)
- Selector de empresa para staff
- Dashboard con KPIs de Por Cobrar, Por Pagar y Caja Chica
- Cuentas por Cobrar (facturas_venta + cobranzas)

Pendiente (rutas ya creadas como placeholder "en construcción"): Cuentas por Pagar,
Bancos, Caja Chica, Proyectos, Clientes, Áreas, Presupuesto, Libros Electrónicos, PDT.

## Nota importante sobre el esquema de datos

Este entorno no tiene salida de red hacia `*.supabase.co`, así que el scaffold se
armó **sin poder inspeccionar el esquema real** de las tablas. Se asumieron nombres
de columna razonables a partir del brief:

- `facturas_venta`, `cobranzas`, `cajas_chicas`, `v_obligaciones_situacion` filtradas
  por `cliente_id` (FK a `clientes.id`)
- Montos: se busca el primer campo que exista entre
  `monto_total`, `monto`, `importe`, `total`, `valor`, `saldo`
- `cajas_chicas.saldo` para el KPI de Caja Chica
- `clientes`: nombre para mostrar tomado de `razon_social` → `nombre_comercial` →
  `nombre` → `ruc` (lo que exista)

La tabla de Cuentas por Cobrar renderiza **todas las columnas que devuelva la
consulta**, así que funciona aunque los nombres reales difieran — pero el formato
(moneda/fecha) y los KPIs del Dashboard van a fallar silenciosamente (muestran "—")
si ninguno de esos nombres coincide con el esquema real. Cuando puedas confirmar los
nombres exactos de columnas de `facturas_venta`, `cobranzas`, `obligaciones_por_pagar`
/ `v_obligaciones_situacion`, `cajas_chicas` y `clientes`, avisame para ajustar las
queries y dejar los KPIs exactos en vez de heurísticos.
