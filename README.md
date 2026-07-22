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
- Layout con sidebar (grupos General / Tesorería / Planeamiento / Cumplimiento
  SUNAT / Maestros), responsive (drawer en mobile)
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
- Presupuesto (`/presupuesto`): lista de presupuestos (cabecera) con
  alta/edición/borrado; cada uno abre su detalle de ítems
  (`/presupuesto/:presupuestoId/items`) con los totales de
  `v_presupuesto_totales` como KPIs y alta/edición/borrado de ítems
- Maestros (grupo nuevo en el sidebar): Terceros, Ejecutivos, Productores, Áreas y
  Secciones de Presupuesto — los 5 catálogos que alimentan los selects de FK del
  resto de la app, mismo patrón lista + alta/edición/borrado filtrado por
  `cliente_id`

Pendiente (rutas ya creadas como placeholder "en construcción"): Libros
Electrónicos, PDT.

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
- Responsable (en Proyecto y Caja Chica) → `responsables.nombre`, filtrado por
  `cliente_id` de la empresa activa
- Área (en Proyecto, Caja Chica y Presupuesto) → `areas.nombre`, filtrado por
  `cliente_id` de la empresa activa
- Ejecutivo (en Presupuesto) → `ejecutivos.nombre`, filtrado por `cliente_id`
- Productor (en Presupuesto) → `productores.nombre`, filtrado por `cliente_id`
- Sección (en Presupuesto) → `secciones_presupuesto.nombre`, filtrado por
  `cliente_id`

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
`cuentas_bancarias` (confirmado: mismo trigger que caja chica). Ninguno de los dos
formularios (`NuevaCaja`, `NuevaCuentaBancaria`)
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

El campo `tercero_id` en Documentos de Banco queda sin filtrar por `tipo` a
propósito — confirmado que no hay columna que distinga proveedor/deudor ahí, se
ajusta más adelante si hace falta.

## Presupuesto

Cabecera (`presupuestos`) + líneas (`presupuesto_items`), columnas confirmadas por
`information_schema.columns`. Puntos clave:

- **`precio_total` y `costo_total_estimado` son columnas generadas** (cantidad ×
  precio/costo unitario) — `NuevoPresupuestoItem` nunca las incluye en el payload de
  insert/update, se calculan solas en la base.
- **Los totales de cabecera salen de `v_presupuesto_totales`**, no se recalculan en
  el frontend: Sub Total, IGV, Total, Costo Estimado, Costo Real, Utilidad Estimada,
  Utilidad Real se muestran como KPIs en `PresupuestoDetalle.jsx`, una fila por
  `presupuesto_id`.
- **El margen por línea sale de `v_presupuesto_items_margen`**, no de
  `presupuesto_items` directo — esa vista es la que lista los ítems en el detalle
  (trae además `margen_estimado_monto/pct` y `margen_real_monto/pct`, ya protegidos
  contra división por cero según dijiste). Editar/Borrar de un ítem sí opera sobre
  `presupuesto_items` (la tabla base), la vista es solo para mostrar.
- Selects filtrados por empresa: Proyecto, Deudor (`terceros` tipo deudor/ambos),
  Ejecutivo (`ejecutivos.nombre`), Productor (`productores.nombre`), Área y Sección
  (`secciones_presupuesto.nombre`) — todos con `filtro={{ cliente_id: empresaId }}`.
  Tipo de documento a emitir sale de `tipos_documento_facturacion` sin filtrar
  (catálogo global, como `condiciones_pago` y `bancos`).
- El número de ítem (`item_numero`) se sugiere automáticamente al crear uno nuevo
  (máximo existente + 1 para ese presupuesto), pero queda editable por si hace falta
  reordenar.
- **`numero`, `cod_aprobacion` y `fecha_aprobacion` de la cabecera se autogeneran en
  la base** al aprobar — el formulario no los pide ni los envía nunca. `numero` ya
  se ve como columna en la lista (`Presupuestos.jsx`, render genérico de
  `DataTable`); `cod_aprobacion` y `fecha_aprobacion` se muestran de solo lectura en
  el detalle (`PresupuestoDetalle.jsx`) una vez que existen.
- El campo `deudor_id` se muestra como **"Cliente Final"** en la interfaz (el nombre
  de columna en la base sigue siendo `deudor_id`).
- **`estado` no tiene dropdown libre.** Al crear, no se envía en absoluto — queda en
  el default `registro` de la base. Los cambios de estado se hacen desde
  `PresupuestoDetalle.jsx` con botones según el estado actual: en `registro` →
  Aprobar (`aprobado`) o Anular (`anulado`); en `aprobado` → Cerrar (`cerrado`). Los
  demás estados (`cerrado`, `anulado`, `finalizado`, `contabilizado`) no tienen
  botones todavía — avisame si hace falta alguna transición más. Los botones están
  gateados por `isStaff`, igual que Editar/Borrar. `version` sigue sin exponerse.

## Maestros

Los catálogos que llenan los selects de FK de toda la app, agrupados bajo un grupo
"Maestros" en el sidebar (`Sidebar.jsx`) — Áreas se movió ahí desde el grupo
General.

Con alta/edición/borrado (mismo patrón lista + form, filtrado por `cliente_id`):

- **Terceros** (`/terceros`): `tipo` (proveedor / deudor ("Cliente Final") / ambos),
  `razon_social`, `ruc`, `email`, `telefono`
- **Ejecutivos** (`/ejecutivos`) y **Productores** (`/productores`): idénticos,
  `nombre` + `activo` (checkbox)
- **Áreas** (`/areas`, reemplaza el placeholder anterior): `nombre`, `descripcion`
- **Secciones de Presupuesto** (`/secciones-presupuesto`): solo `nombre`

De solo lectura, sin alta/editar/borrar:

- **Tipos de Documento** (`/tipos-documento`, `TiposDocumento.jsx`): `codigo` y
  `nombre` de `tipos_documento_facturacion` — catálogo oficial de SUNAT, no scoped
  por `cliente_id` (es global, igual que se usa en los selects de "Tipo de
  documento a emitir" de Presupuesto). Sin `NuevoButton`, sin columna de acciones,
  sin gate de `isStaff` — cualquier usuario logueado lo puede ver.

## Nombres en vez de UUIDs en las listas

Las columnas FK (`ejecutivo_id`, `proyecto_id`, `deudor_id`, etc.) ya no se muestran
como UUID crudo en ninguna lista de la app — se resuelven a su nombre real
(`ejecutivos.nombre`, `proyectos.nombre`, `terceros.razon_social`, etc.) antes de
pasarlas a `DataTable`.

**Por qué no usa embeds de PostgREST** (`select('*, ejecutivos(nombre)')`): esa
sintaxis depende de que existan foreign keys declaradas en Postgres entre las
columnas y las tablas referenciadas, y esta sesión no tiene forma de confirmar eso
contra la base real (sin acceso de red a Supabase). Si las FK no están declaradas,
un embed falla con un error de "no se encontró la relación". En vez de arriesgar
esa dependencia no verificada, se optó por resolver del lado del cliente con el
mismo patrón simple de `.eq()`/`.in()` que ya se usaba en el resto de la app
(`CatalogoSelect`, filtros de Bancos por lista de ids, etc.) — funciona sin
importar si hay FK declaradas o no.

El mecanismo vive en `src/lib/relaciones.js`:

- `useMapaNombres(tabla, campoEtiqueta, filtro)`: trae `id` + el campo pedido de una
  tabla (con el mismo filtro `{ campo: valor }` / `{ campo: [valores] }` que
  `useCatalogo`) y arma un `Map(id → valor)`.
- `resolverFilas(filas, resoluciones, camposOcultar)`: por cada fila, reemplaza cada
  `campoId` (ej. `ejecutivo_id`) por un nuevo `campoDestino` (ej. `ejecutivo`) con el
  nombre resuelto desde el mapa correspondiente, y borra cualquier columna extra en
  `camposOcultar` (ids de scope redundantes, como `caja_chica_id` en la lista de
  movimientos de una caja puntual, o `presupuesto_id` en la lista de ítems).

Aplicado en: Presupuestos (7 FKs: cliente, proyecto, cliente final/deudor,
ejecutivo, productor, área, tipo de documento), Proyectos (área, responsable),
facturas en CxC (proyecto, deudor, condición de pago), obligaciones en CxP
(proyecto, proveedor, condición de pago), Bancos — las 3 secciones (banco en
cuentas; cuenta + tercero en documentos; cuenta origen/destino en transferencias),
Caja Chica (área, responsable) y sus movimientos (proyecto), e ítems de presupuesto
(proveedor, sección).

De paso, `DataTable` ahora excluye `cliente_id` del render genérico por defecto
(igual que ya excluía `id`) — es redundante en cualquier lista de esta app, porque
siempre está filtrada a una sola empresa.

**Actualización**: la lista de Presupuesto ya no usa el render genérico de
`DataTable` (columnas automáticas a partir de las keys de la fila) — ver la
sección "Lista de Presupuesto" más abajo, que reemplazó ese enfoque por una
columna explícita con formato a medida.

## Generar Factura desde Presupuesto

**Cambio de enfoque**: el botón "Generar Factura" en `PresupuestoDetalle.jsx`
(visible con `isStaff` y `estado='aprobado'`, junto a "Cerrar" y "Desaprobar") ya
**no** llama al RPC `generar_factura_desde_presupuesto` — ese RPC quedó sin uso.
Ahora arma los valores precargados y navega a `/cuentas-por-cobrar/nueva` (`Link`
de React Router con `state`, sin query params) dejando que completes y confirmes
el formulario antes de grabar nada:

- **Selección de líneas**: la tabla de ítems tiene una columna de checkbox a la
  izquierda (`DataTable` ahora soporta `accionesInicio`, un render-prop simétrico
  a `acciones` pero para la primera columna — no afecta ningún uso existente,
  es opt-in). Si hay líneas marcadas, "Generar Factura" usa solo esas; si no hay
  ninguna marcada, usa **todas** las líneas del presupuesto.
- **Monto precargado** = suma de `precio_total + igv` de las líneas relevantes,
  tomando ambas columnas directo de `presupuesto_items` (vía
  `v_presupuesto_items_margen`, que las expone igual que `precio_total`) — sin
  recalcular con el `igv_porcentaje` de la cabecera, corregido según confirmaste.
- **Deudor y Proyecto** precargados desde `presupuesto.deudor_id` / `proyecto_id`.
- **Tipo de documento**: se busca el `nombre` de `presupuesto.tipo_doc_emitir_id`
  (tabla `tipos_documento_facturacion`) y se intenta hacer matching exacto
  (sin distinguir mayúsculas) contra las 4 opciones fijas del select de Factura
  (`Factura` / `Boleta` / `Nota de Crédito` / `Nota de Débito`). Si no hay
  coincidencia exacta, el campo queda en su default ("Factura") y lo tenés que
  ajustar a mano — **`facturas_venta.tipo_doc` es texto libre con esas 4 opciones,
  no una FK al catálogo SUNAT de `tipos_documento_facturacion`**, así que no
  siempre hay una correspondencia 1 a 1 (por ejemplo, un tipo de documento con
  código de Recibo por Honorarios no matchea ninguna opción).
- Al confirmar el formulario de "Nueva Factura" (`NuevaFactura.jsx`), además de
  crear la fila en `facturas_venta`, si venís desde este flujo se inserta una fila
  en **`factura_presupuesto_items`** por cada línea seleccionada, con
  `factura_id` (la factura recién creada), `presupuesto_item_id` y `monto` (el
  mismo `precio_total + IGV` calculado antes). **Los nombres de columna de
  `factura_presupuesto_items` son una suposición — no tengo el
  `information_schema.columns` de esa tabla.** Si no coinciden, el guardado de la
  factura en sí funciona igual (ya se insertó antes), pero este segundo insert va
  a fallar y te va a mostrar el error de Postgres tal cual. Pasame el esquema de
  esa tabla y lo ajusto.
- El flujo por RPC anterior (con el link "Ver factura →" a partir del uuid que
  devolvía la función) se eliminó por completo, ya no queda código muerto de esa
  versión.

## Lista de Presupuesto: `v_presupuestos_resumen`

La lista de `/presupuesto` (`Presupuestos.jsx`) dejó de leer de la tabla
`presupuestos` y ahora lee de la vista `v_presupuestos_resumen`, con exactamente
las 18 columnas pedidas, en este orden: Situación, Periodo, Número, Fecha, Fecha de
Aprobación, Cod. Aprobación, Proyecto, Cliente Final, Nombre del Presupuesto,
Importe, Costo Real, %, Importe Facturado, Ejecutivo, Productor, N° Factura,
Cobrado, Fecha de Cobro.

Como el conjunto de columnas y el formato de cada una es muy específico (no es "lo
que devuelva la tabla" como en el resto de la app), esta lista dejó de usar el
render 100% genérico de `DataTable` y ahora pasa explícitamente:

- `columnas`: el array con el orden exacto pedido
- `titulos`: mapa de `campo → etiqueta`, para los casos donde el título automático
  (`tituloColumna`, que solo separa `_` y capitaliza) no alcanza — acentos y
  abreviaturas como "Cod. Aprobación" o "%" no salen bien de un nombre de columna
  en snake_case sin acentos
- `renderizadores`: mapa de `campo → (valor, fila) => JSX` para casos que el
  formateo automático de `DataTable` no cubre:
  - `estado` → el mismo badge de color que ya se usaba en el detalle
    (`COLOR_ESTADO`/`ETIQUETA_ESTADO`, ahora en `src/lib/estadoDocumento.js` para
    compartirlo entre `Presupuestos.jsx` y `PresupuestoDetalle.jsx`)
  - `importe`, `costo_real`, `importe_facturado` → `formatoMoneda` usando la
    **moneda de cada fila** (`fila.moneda`), porque el formateo automático de
    `DataTable` siempre asume PEN
  - `porcentaje_margen` → texto con `%` (`XX.XX%`)
  - `cobrado` → un `<input type="checkbox" disabled>` en vez de "Sí"/"No" — es de
    **solo lectura**: la vista no es escribible directamente y el estado real de
    cobro debería salir de las `cobranzas` asociadas a la factura, así que no se
    intentó hacerlo un toggle editable. Avisame si en realidad lo necesitás
    interactivo y de dónde tendría que salir el update.

`DataTable` (`src/components/DataTable.jsx`) ahora acepta `titulos` y
`renderizadores` como props opcionales — no rompe ningún uso existente en el
resto de la app, que sigue con el render 100% automático.

Editar/Borrar de un presupuesto individual siguen apuntando a la tabla
`presupuestos` (no a la vista), igual que ya pasaba con obligaciones/
`v_obligaciones_situacion` — la vista es solo para leer la lista.

## Ajustes de detalle en Presupuesto (segunda vuelta)

- **Costo Real / Margen Real** en la tabla de ítems (`PresupuestoDetalle.jsx`) ahora
  muestran `costo_real_calculado` y `margen_real_monto` de
  `v_presupuesto_items_margen` bajo esas etiquetas exactas (vía `titulos`); el
  `costo_real` manual/antiguo se oculta (`camposOcultar` de `resolverFilas`) para no
  tener dos columnas ambiguas con nombres parecidos.
- **Tipo de IGV** (`tipo_igv_id`) se agregó como select en la cabecera del
  presupuesto, catálogo global `tipos_igv` (sin `cliente_id`, como
  `tipos_documento_facturacion`).
- **Usuario que aprobó** (`usuario_aprobador_id` resuelto vía `usuarios.nombre`,
  sin filtrar por `cliente_id` porque quien aprueba suele ser staff con
  `cliente_id = NULL`) y **Última actualización** (`actualizado_en`, con hora —
  nuevo helper `formatoFechaHora` en `src/lib/format.js`) se muestran de solo
  lectura en el detalle, solo cuando existen.

## Ajustes de detalle en Presupuesto (tercera vuelta)

- **Selección múltiple**: columna de checkbox a la izquierda de cada línea, vía un
  nuevo prop `accionesInicio` en `DataTable` (`src/components/DataTable.jsx`) —
  render-prop simétrico a `acciones` pero para la primera columna en vez de la
  última; opt-in, no afecta ningún uso existente de `DataTable`. Vive en
  `PresupuestoDetalle.jsx` como
  un `Set` de ids de `presupuesto_items`; se usa tanto para "Generar Factura"
  (ver esa sección) como potencial base para otras acciones masivas a futuro.
- **Botón "Generar OC" por línea**: cada fila del detalle tiene, junto a
  Editar/Borrar (gateado por `isStaff`, mismo criterio), un link "Generar OC" que
  navega a `/ordenes-compra/nueva` con `state={{ presupuestoId, presupuestoItemId: fila.id }}`
  (React Router `state`, no query params). `OrdenCompraDetalle.jsx` usa ese
  estado para: (1) precargar el select de Presupuesto en el formulario de alta,
  y (2) una vez grabada la cabecera de la OC, saltar automáticamente al tab
  "Detalle de Artículos" con el mini-formulario de agregar ítem ya abierto y con
  esa línea del presupuesto preseleccionada — el usuario solo tiene que revisar/
  completar Cantidad, Precio, Inafecto y Retención y grabar. El resto de los
  datos de la cabecera (Proveedor, Fecha, Documento, etc.) los sigue completando
  a mano, no hay forma de inferirlos desde una línea de presupuesto.
- **Columna "Saldo x Facturar"**: se agregó al final de la tabla de ítems,
  leyendo `saldo_por_facturar` de la vista `v_presupuesto_items_facturacion`
  (join por `presupuesto_item_id`, con `.in()` sobre los ids de los ítems ya
  cargados — no se asumió que la vista tenga una columna `presupuesto_id` propia
  para filtrar directo). Formateada como moneda con la moneda del presupuesto,
  igual que el resto de columnas de importe.

## Órdenes de Compra (módulo completo)

Reemplaza el botón simple "Generar OC" que se había armado antes (se borró
`NuevaOrdenCompra.jsx` y su ruta). Tablas `ordenes_compra` / `orden_compra_items`,
columnas confirmadas por `information_schema.columns`.

**`ordenes_compra` no tiene `cliente_id` propio** — se relaciona con la empresa
indirectamente vía `presupuesto_id` (igual patrón que `documentos_banco`/
`transferencias_entre_cuentas` en Bancos): `OrdenesCompra.jsx` primero trae los
`presupuestos.id` de la empresa activa y después filtra `ordenes_compra` con
`.in('presupuesto_id', ids)`.

**Lista** (`/ordenes-compra`, `OrdenesCompra.jsx`): FKs resueltas a nombre
(proveedor, tipo, documento, condición de pago, presupuesto, creado/aprobado por),
badge de estado. Botones: "+ Nueva Orden de Compra", "Exportar" (CSV client-side,
sin librerías nuevas — arma el CSV a mano y dispara la descarga con un Blob), y por
fila "Ver" (siempre), "Anular"/"Eliminar" (solo `isStaff` y `estado='registro'`).
"Exportar" es un botón único de página que exporta la lista completa cargada, no un
botón por fila — no quedó explícito en el pedido cuál de las dos interpretaciones
querías, avisame si en realidad era por-fila.

**Detalle** (`/ordenes-compra/nueva` y `/ordenes-compra/:id`, ambos en
`OrdenCompraDetalle.jsx` — mismo componente para alta y edición, como el resto de
la app) con dos tabs, "Datos Generales" y "Detalle de Artículos" (la segunda
deshabilitada hasta que la cabecera tenga `id`, porque `orden_compra_items`
necesita un `orden_compra_id` real):

- El selector de **Presupuesto** (`CatalogoSelect` filtrado por `cliente_id` y
  `estado: 'aprobado'`) solo aparece en modo alta; una vez grabado queda fijo. Al
  elegirlo (o al cargar una OC existente), se trae ese presupuesto completo y se
  muestran de solo lectura Cliente/Proyecto (resueltos) / Nombre del Presupuesto /
  Moneda / Tipo de Cambio — estos dos últimos también se copian tal cual al
  `insert`/`update` de la OC (no son editables de forma independiente).
- El selector de **Proveedor** (`terceros` tipo proveedor/ambos) trae RUC,
  Teléfono y Dirección de solo lectura al elegirlo (`terceros.direccion`).
- **Documento** (`tipo_doc_id`) usa `useCatalogo('tipos_documento_facturacion')`
  directo (no el `CatalogoSelect` genérico) porque necesita el `codigo` de la fila
  elegida, no solo su `id`, para la regla de "Con Retención": el checkbox solo se
  habilita si el documento elegido tiene `codigo === '02'` (Recibo por Honorarios);
  si no, queda deshabilitado y se fuerza a `false`.
- Botón **Grabar**: `insert` (alta, con `usuario_creador_id` = `perfil.id` del
  usuario logueado) o `update` (edición) sobre `ordenes_compra`. `numero` y
  `estado` nunca se envían — quedan en su default de la base
  (`numero` se autogenera igual que `presupuestos.numero`).
- Botón **Aprobar** (visible con `isStaff` y `estado='registro'`): `update` directo
  a `estado='aprobado'`, `fecha_aprobacion` = hoy, `usuario_aprobador_id` =
  `perfil.id` — sin trigger en la base todavía, tal como se pidió.
- Botón **Desaprobar** (visible con `isStaff` y `estado='aprobado'`, junto al
  bloque "Aprobada el... por..."): `update` directo a `estado='registro'`, sin
  tocar `fecha_aprobacion`/`usuario_aprobador_id` — mismo patrón que el botón
  "Desaprobar" de `PresupuestoDetalle.jsx`. Con esto la OC vuelve a `registro` y
  ahí sí quedan disponibles de nuevo Anular/Eliminar (los botones que ya existían
  en `OrdenesCompra.jsx`, gateados igual por `estado='registro'`) y el tab de
  Detalle de Artículos vuelve a ser editable.
- Preselección desde Presupuesto: si se llega a `/ordenes-compra/nueva` con
  `state={{ presupuestoId, presupuestoItemId }}` (desde el botón "Generar OC" de
  `PresupuestoDetalle.jsx`), el select de Presupuesto arranca precargado y, apenas
  se graba la cabecera, la pantalla salta sola al tab de artículos con esa línea
  del presupuesto ya elegida en el mini-formulario de agregar.
- Tab **Detalle de Artículos**: botón "+ Agregar" abre un mini-formulario inline
  (no una ruta separada, para compartir estado con la página padre sin
  complicarlo) con un select de líneas de `presupuesto_items` del presupuesto
  elegido (etiquetadas `#item_numero — concepto`). Al elegir una, precarga el
  campo `item` con el `concepto` de esa línea (editable), más Cantidad/Precio/
  Inafecto/Retención editables. `numero` de la línea se calcula igual que en
  Presupuesto (máximo existente + 1). **`sub_total`, `igv` y `total` nunca se
  envían** — son columnas generadas. Si el insert/update falla (por ejemplo un
  trigger que valide el tope de costo), el `error.message` de Postgres se
  muestra tal cual, sin interceptarlo.
- Cada línea de la tabla tiene **Editar/Borrar** (mismo mini-formulario inline
  para editar — precarga los campos de esa línea; "Borrar" pide confirmación con
  `window.confirm` y hace `delete` directo sobre `orden_compra_items`), visibles
  solo con `isStaff` y `estado === 'registro'` (mismo criterio que el resto de la
  app). El botón "+ Agregar" también se oculta cuando `estado !== 'registro'`
  (sin el gateo por `isStaff`, igual que los demás botones "+ Nuevo" de la app —
  la RLS es la que realmente lo protege) — una vez aprobada la OC el tab queda de
  solo lectura, sin forma de agregar, editar ni borrar líneas desde la UI.

Pendiente, tal como se acordó: el PDF de impresión con marca de agua, y la columna
"Aprobac. Superv." no se agrega por ahora.

## Ajustes de flujo Presupuesto/Órdenes de Compra (cuarta vuelta)

1. **Presupuesto solo editable en `registro`**: en `PresupuestoDetalle.jsx`, el
   botón "+ Nuevo Ítem" y las acciones Editar/Borrar de cada línea (dentro del
   mismo `acciones` que ya tenía el link "Generar OC") ahora están condicionados a
   `estado === 'registro'`. Con el presupuesto `aprobado` hay que usar
   "Desaprobar" primero para poder tocar las líneas de nuevo — "Generar OC" y
   "Generar Factura" siguen disponibles en `aprobado`, no se tocaron (tiene
   sentido facturar/generar OCs justo después de aprobar).
2. **Lista de Órdenes de Compra**: se sacaron `creado_en` y `actualizado_en` de la
   tabla (nuevo tercer argumento `camposOcultar` en el `resolverFilas` de
   `OrdenesCompra.jsx`).
3. **Botón "Generar Orden de Compra" (selección múltiple)**: junto a "Generar
   Factura" en `PresupuestoDetalle.jsx`, usa el mismo `Set` de checkboxes (todas
   las líneas si no hay ninguna marcada). Navega a `/ordenes-compra/nueva` con
   `state={{ presupuestoId, presupuestoItemIds: [...] }}` (plural, a diferencia
   del link "Generar OC" por línea que sigue mandando `presupuestoItemId`
   singular). `OrdenCompraDetalle.jsx` distingue ambos casos: con un solo id
   sigue abriendo el mini-formulario de agregar precargado (como antes); con
   varios ids, apenas se graba la cabecera, inserta directo en
   `orden_compra_items` una fila por cada línea marcada — `item` = `concepto`,
   `cantidad` y `precio` = `cantidad`/`precio_unitario` de la línea del
   presupuesto, `inafecto`/`retencion` en `0` — y aterriza en el tab de artículos
   ya con todas esas líneas cargadas, listas para ajustar Precio (y el resto) con
   "Editar" por línea. El Proveedor y demás datos de cabecera los sigue
   completando el usuario a mano antes de grabar, no hay forma de inferirlos de
   una línea de presupuesto.
4. **Fecha por defecto en Nueva Orden de Compra**: ya estaba implementado desde
   el módulo original (`inicial.fecha = hoy` en `OrdenCompraDetalle.jsx`) — se
   confirmó que sigue así, no hizo falta ningún cambio.
5. **Maestro "Tipos de Orden de Compra"** (`/tipos-orden-compra`,
   `TiposOrdenCompra.jsx` + `NuevoTipoOrdenCompra.jsx`): catálogo global de
   `tipos_orden_compra` (sin `cliente_id`, mismo criterio que
   `tipos_documento_facturacion`), solo campo `nombre`. La lista es visible para
   cualquier usuario logueado (sin gate), pero el botón "+ Nuevo Tipo" y
   Editar/Borrar de cada fila están condicionados a `isStaff` — a diferencia de
   "Tipos de Documento" (que es 100% solo lectura, catálogo de SUNAT), este sí es
   editable por el estudio.
6. **Retención automática por línea** (`orden_compra_items.tipo_retencion_id`,
   catálogo `tipo_retencion`): cuando "Con Retención" está activo en la cabecera
   (documento = Recibo por Honorarios), el mini-formulario de agregar/editar
   línea muestra un select "Tipo de Retención" (`useCatalogo('tipo_retencion')`,
   catálogo global). Por defecto elige el tipo con `porcentaje === 8` (o el
   primero de la lista si no hay ninguno al 8%) apenas se abre el formulario para
   una línea **nueva**. El campo `retencion` se recalcula automáticamente como
   `precio × (porcentaje / 100)` cada vez que cambian el Precio o el Tipo de
   Retención elegidos, pero sigue siendo un input editable — si lo ajustás a
   mano después, ese valor manual no se pisa solo (el recálculo automático
   depende de que cambies Precio o Tipo de Retención de nuevo). Al **editar**
   una línea ya guardada, este auto-cálculo no se dispara al abrir el
   formulario, para no pisar una retención que ya haya sido ajustada a mano
   antes — si el usuario cambia Precio o Tipo de Retención durante la edición,
   ahí sí se recalcula. `tipo_retencion.porcentaje` (nombre de columna
   confirmado) trae el porcentaje usado tanto en el label del select como en el
   cálculo.

## Ajustes de experiencia (quinta vuelta)

1. **Precio en 0 al generar OC desde Presupuesto con checkboxes**:
   `precargarLineasDesdePresupuesto` (en `OrdenCompraDetalle.jsx`) ya no copia
   `precio_unitario` del presupuesto — deja `precio: 0` en cada línea nueva.
   Sigue precargando `item` (desde `concepto`) y `cantidad`. Proveedor (a nivel
   de cabecera) y Precio quedan para completar a mano, como se pidió.
2. **Filas clickeables en todas las listas**: `DataTable` (`src/components/DataTable.jsx`)
   ahora acepta un prop opcional `onRowClick(fila)` — pinta la fila con
   `cursor-pointer` y navega al hacer click en cualquier parte de ella. Los `<td>`
   de `accionesInicio` y `acciones` llevan `onClick={(e) => e.stopPropagation()}`
   para que un click en un checkbox o en un botón (Borrar, Anular, Generar OC,
   etc.) no dispare también la navegación de la fila.
   - `AccionesFila` (`src/components/AccionesFila.jsx`) ahora trata `editarTo`
     como opcional — si no se pasa, no renderiza el link "Editar" (queda solo
     "Borrar"). Se usa así en casi todas las listas, porque el click en la fila
     ya cubre lo que hacía "Editar".
   - Aplicado en: Presupuestos (fila → `/presupuesto/:id/items`, sin gate de
     `isStaff` — es la misma vista de detalle que ya era pública; "Editar"
     cabecera se mantiene aparte porque apunta a otro formulario), ítems de
     Presupuesto (fila → editar ítem, gateado por `isStaff` y `estado==='registro'`,
     igual que ya estaba gateado el botón "Editar"; "Generar OC" se mantiene
     aparte), Órdenes de Compra (fila → `/ordenes-compra/:id`, sin gate — igual
     que el link "Ver" que reemplaza; Anular/Eliminar siguen aparte), ítems de
     Orden de Compra (fila → abre el mini-formulario de edición inline, mismo
     gate que "Editar" tenía), Facturas, Obligaciones, Clientes, Proyectos,
     Bancos (3 tablas), Caja Chica (fila → `/caja-chica/:id/movimientos`, sin
     gate, igual que el link que reemplaza; "Editar" cabecera aparte) y sus
     Movimientos, y todos los Maestros (Terceros, Ejecutivos, Productores,
     Áreas, Secciones de Presupuesto, Tipos de Orden de Compra). En los casos
     donde antes solo `isStaff` veía "Editar", el click de fila quedó con el
     mismo gate — un no-staff no gana una forma nueva de llegar a un formulario
     que antes no podía ni ver. "Tipos de Documento" (100% solo lectura, sin
     ruta de edición) no se tocó.

## Consulta de RUC en Terceros

Botón "Consultar RUC" en `NuevoTercero.jsx`, junto al campo RUC. Habilitado solo
cuando el RUC tiene exactamente 11 dígitos (`/^\d{11}$/`). Al hacer click llama
`supabase.functions.invoke('consultar-ruc', { body: { ruc: form.ruc } })` — la
Edge Function ya existe en Supabase y devuelve
`{ razon_social, direccion, estado, condicion }`.

- **Autocompleta** `razon_social` y `direccion` en el formulario (sobrescribe lo
  que hubiera escrito antes; sigue siendo editable a mano después).
- **Muestra de solo lectura** `estado`/`condicion` (ej. "ACTIVO / HABIDO") en un
  bloque debajo del botón — no se guardan en `terceros`, son solo para que el
  usuario los vea al momento de completar el formulario.
- Si el invoke devuelve error, se muestra `error.message` tal cual, sin
  interceptarlo (mismo criterio que el resto de la app).
- **`terceros.direccion` pasó a ser un campo editable del formulario** (antes
  solo se leía/mostraba en Órdenes de Compra, pero no existía como input en
  `NuevoTercero.jsx` — hacía falta para poder guardar el valor autocompletado
  desde la consulta de RUC). Se agregó a `inicial`, al prefill de edición y al
  payload de insert/update, como cualquier otro campo del formulario.

## Sidebar: grupos colapsables

Cada grupo del menú (`Sidebar.jsx`) ahora se abre/cierra con click en su título
— un `<button>` con una flecha (`›`) que rota 90° cuando el grupo está abierto,
en vez del `<p>` estático de antes. Estado `abiertos` (`{ [titulo]: boolean }`)
vive en `useState` dentro de `SidebarContent`, derivado directamente del array
`GRUPOS` (`Object.fromEntries(GRUPOS.map(...))`, todos abiertos por defecto)  —
cualquier grupo nuevo que se agregue a `GRUPOS` queda colapsable automáticamente
sin tocar nada más. Es estado en memoria (se pierde en un refresh completo de
la página, pero se mantiene mientras se navega entre rutas de la SPA, porque
`Sidebar`/`Layout` no se desmontan en cada cambio de ruta).
