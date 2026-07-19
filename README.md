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
- Cuentas por Cobrar (`facturas_venta.monto_total` / `saldo_pendiente`, + `cobranzas`),
  con alta de facturas (`/cuentas-por-cobrar/nueva`)
- Cuentas por Pagar (`v_obligaciones_situacion`, agrupado por `situacion`:
  VENCIDA / POR VENCER / PAGADA), con alta de obligaciones (`/cuentas-por-pagar/nueva`)
- Clientes: lista + alta (`/clientes/nuevo`)
- Proyectos: lista + alta (`/proyectos/nuevo`), filtrada por empresa

Pendiente (rutas ya creadas como placeholder "en construcción"): Bancos, Caja Chica,
Áreas, Presupuesto, Libros Electrónicos, PDT.

## Nota sobre el esquema de datos

Este entorno no tiene salida de red hacia `*.supabase.co`, así que no se pudo
inspeccionar el esquema en vivo — las queries se escribieron a partir de los nombres
de columna que confirmó Francisco:

- `facturas_venta.monto_total`, `facturas_venta.saldo_pendiente` (CxC)
- `v_obligaciones_situacion.situacion`, `.monto_total`, `.saldo_pendiente` (mismos
  campos que `obligaciones_por_pagar`, la vista solo agrega `situacion` con valores
  VENCIDA / POR VENCER / PAGADA)
- `cajas_chicas.saldo_actual`, `cajas_chicas.fondo_fijo`
- `clientes.razon_social` (nombre a mostrar en el selector de empresa)
- `usuarios.auth_user_id` referencia a `auth.users.id` (así se resuelve el perfil
  logueado y su `cliente_id`)
- Todas las tablas se filtran por `cliente_id` (FK a `clientes.id`)

Las tablas de CxC y CxP renderizan **todas las columnas que devuelva la consulta**,
así que funcionan aunque haya columnas extra al layout esperado. Sin acceso de red
a Supabase desde este entorno no se pudo probar el login/las queries en vivo —
conviene correr `npm run dev` localmente y confirmar antes de dar por cerrados estos
módulos.

## Formularios de alta

`facturas_venta`, `obligaciones_por_pagar`, `proyectos` y `clientes` tienen columnas
confirmadas por consulta directa a `information_schema.columns`, así que sus
formularios usan los nombres reales (incluye NOT NULL: `fecha_emision`,
`fecha_vencim` en obligaciones, `monto_total`, `saldo_pendiente`, `razon_social`,
`nombre` en proyectos). `saldo_pendiente` queda igual a `monto_total` si se deja
vacío.

Los selects de `condición de pago` y `proyecto` (`CatalogoSelect`,
`src/components/CatalogoSelect.jsx`) traen las filas de `condiciones_pago` /
`proyectos` y arman la etiqueta probando `nombre` → `descripcion` → `razon_social` →
`codigo`, porque no se confirmó el esquema exacto de la tabla `condiciones_pago`.
Si la etiqueta sale fea (muestra el id), decime las columnas de esa tabla y lo ajusto.

Quedan sin campo en los formularios (son `uuid` nullable sin tabla confirmada
todavía): `facturas_venta.deudor_id`, `obligaciones_por_pagar.proveedor_id`,
`obligaciones_por_pagar.concepto_id`, `proyectos.responsable_id`. El tipo de
documento (`tipo_doc`) es texto libre elegido de una lista fija
(Factura/Boleta/Nota de Crédito/etc.), no está tomado de la tabla
`tipos_documento_facturacion` — no hay constraint de FK que lo exija, pero
convendría cablearlo al catálogo real más adelante.
