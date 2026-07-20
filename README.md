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
- Clientes: lista + alta/edición/borrado (`/clientes/nuevo`, `/clientes/:id/editar`)
- Proyectos: lista + alta/edición/borrado (`/proyectos/nuevo`, `/proyectos/:id/editar`),
  filtrada por empresa
- Facturas de venta y obligaciones por pagar: edición/borrado desde CxC/CxP
  (`/cuentas-por-cobrar/:id/editar`, `/cuentas-por-pagar/:id/editar`)
- Bancos (`/bancos`): Cuentas Bancarias, Documentos de Banco y Transferencias entre
  Cuentas, cada una con alta/edición/borrado
- Caja Chica (`/caja-chica`): lista de cajas con alta/edición/borrado; cada caja abre
  su propio detalle de movimientos (`/caja-chica/:cajaId/movimientos`) con
  alta/edición/borrado de movimientos

Pendiente (rutas ya creadas como placeholder "en construcción"): Áreas, Presupuesto,
Libros Electrónicos, PDT.

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

Los selects de FK (`CatalogoSelect`, `src/components/CatalogoSelect.jsx`) traen las
filas de la tabla indicada y arman la etiqueta probando `nombre` → `descripcion` →
`razon_social` → `codigo` → `numero`. Confirmados y cableados:

- Condición de pago → `condiciones_pago.nombre` (muestra `nombre`)
- Proyecto → `proyectos` filtrado por `cliente_id` de la empresa activa
- Deudor (en Nueva Factura) → `terceros.razon_social`, filtrado por
  `tipo IN ('deudor', 'ambos')`
- Proveedor (en Nueva Obligación) → `terceros.razon_social`, filtrado por
  `tipo IN ('proveedor', 'ambos')`
- Responsable (en Nuevo Proyecto) → `responsables.nombre`
- Área (en Nuevo Proyecto) → `areas`, etiqueta por heurística (esquema no
  confirmado — si sale fea, pasame las columnas de `areas`)

`CatalogoSelect`/`useCatalogo` (`src/lib/catalogo.js`) soportan filtros `IN` pasando
un array como valor del filtro (ej. `{ tipo: ['deudor', 'ambos'] }`).

Queda sin campo en los formularios: `obligaciones_por_pagar.concepto_id` (uuid
nullable, tabla de catálogo aún sin confirmar). El tipo de documento (`tipo_doc`) es
texto libre elegido de una lista fija (Factura/Boleta/Nota de Crédito/etc.), no está
tomado de la tabla `tipos_documento_facturacion` — no hay constraint de FK que lo
exija, pero convendría cablearlo al catálogo real más adelante.

## Edición y borrado

Los 4 formularios de alta (`NuevoCliente`, `NuevoProyecto`, `NuevaFactura`,
`NuevaObligacion`) también manejan edición: si la ruta trae `:id` (ej.
`/clientes/:id/editar`), el formulario precarga el registro con `select().eq('id',
id).single()` y el submit hace `update().eq('id', id)` en vez de `insert()`. Al
editar, `cliente_id` no se reenvía (se deja como está en la fila) para no
reasignarla por error si cambió la empresa activa en el selector mientras se
editaba.

Borrar usa `window.confirm()` como confirmación antes del `delete().eq('id', id)` —
sin modal, simple y suficiente para una herramienta interna. Las listas (Clientes,
Proyectos, facturas en CxC, obligaciones en CxP) muestran una columna de acciones
con Editar/Borrar (`AccionesFila`, `src/components/AccionesFila.jsx`) agregada vía
la nueva prop `acciones` de `DataTable`.

La columna de Editar/Borrar solo se renderiza si `isStaff` (`cliente_id IS NULL` en
`usuarios`) es `true` — se pasa `acciones={isStaff ? (fila) => <AccionesFila .../> :
undefined}` en cada página, así que un usuario cliente ni ve los botones. Esto es
puramente cosmético: la seguridad real sigue siendo la RLS de UPDATE/DELETE que
Francisco configuró en Supabase (solo staff) — si alguien llegara a
`/algo/:id/editar` por URL directa sin ser staff, el formulario carga pero el
guardado le va a fallar con el error de Postgres igual.

## Bancos y Caja Chica

Columnas confirmadas por `information_schema.columns` (igual que CxC/CxP):
`cajas_chicas`, `cuentas_bancarias`, `documentos_banco`, `movimientos_caja_chica`,
`transferencias_entre_cuentas`.

**`saldo_actual` es de solo lectura**, en `cajas_chicas` y también en
`cuentas_bancarias` (mismo patrón de columna, probablemente actualizada por trigger
igual que la de caja chica — asumido por analogía, avisame si esto no es así para
cuentas bancarias). Ninguno de los dos formularios (`NuevaCaja`, `NuevaCuentaBancaria`)
lo incluye en el payload de insert/update; en las listas se ve porque `DataTable`
renderiza todas las columnas de la fila, pero no hay forma de editarlo desde la UI.

`documentos_banco` y `transferencias_entre_cuentas` no tienen columna `cliente_id`
propia — se relacionan con la empresa indirectamente a través de
`cuenta_bancaria_id` / `cuenta_origen_id` / `cuenta_destino_id`, que sí pertenecen a
una cuenta de `cuentas_bancarias.cliente_id`. `Bancos.jsx` resuelve esto en dos
pasos: primero trae las cuentas de la empresa activa, y con esos ids arma un
`.in()` (documentos) o `.or()` con dos `.in()` (transferencias, porque puede
aparecer como origen o como destino).

Caja Chica es un patrón de lista → detalle: `/caja-chica` lista las cajas de la
empresa activa (cada una con su botón "Movimientos"), y
`/caja-chica/:cajaId/movimientos` muestra los movimientos de esa caja puntual con
el saldo actual y el fondo fijo como KPIs arriba. El alta de movimiento
(`NuevoMovimientoCaja`) fija `caja_chica_id` a la caja de la URL, no es un campo del
formulario.

Sin confirmar todavía: el campo `tercero_id` en Documentos de Banco no se filtra por
`tipo` (puede ser cualquier tercero, no solo deudor o proveedor) porque no quedó
claro para qué lado del movimiento aplica — si hace falta filtrarlo, avisame el
criterio.
