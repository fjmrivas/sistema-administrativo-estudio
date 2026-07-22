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

Botón "Generar Factura" en `PresupuestoDetalle.jsx`, visible solo cuando
`isStaff` y el presupuesto está `aprobado` (al lado de "Cerrar"). Llama al RPC
`supabase.rpc('generar_factura_desde_presupuesto', { presupuesto_id: presupuestoId })`.

El nombre del parámetro (`presupuesto_id`) está confirmado — Francisco ajustó la
función en Supabase para que coincida con lo que ya mandaba el frontend.

Al generar la factura correctamente, se asume que el RPC devuelve el `id` (uuid) de
la factura creada como valor escalar — se muestra un mensaje de éxito con un link a
`/cuentas-por-cobrar/:id/editar` (no hay una vista de detalle de una sola factura
todavía, así que se reusa el formulario de edición para verla). Si el RPC devuelve
otra forma de dato (por ejemplo un objeto en vez de un uuid plano), el link va a
salir roto — avisame si es el caso.

También se agregó el botón "Desaprobar" (visible cuando `estado='aprobado'`, junto
a "Cerrar" y "Generar Factura") — hace `update` directo a `estado='registro'`,
mismo patrón que los otros botones de transición.

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
- El selector de **Proveedor** (`terceros` tipo proveedor/ambos) trae RUC y
  Teléfono de solo lectura al elegirlo. **`terceros` no tiene columna `dirección`**
  según el esquema confirmado — no se pudo mostrar ese dato, avisame si el nombre
  de columna es otro.
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
- Tab **Detalle de Artículos**: botón "+ Agregar" abre un mini-formulario inline
  (no una ruta separada, para compartir estado con la página padre sin
  complicarlo) con un select de líneas de `presupuesto_items` del presupuesto
  elegido (etiquetadas `#item_numero — concepto`). Al elegir una, precarga el
  campo `item` con el `concepto` de esa línea (editable), más Cantidad/Precio/
  Inafecto/Retención editables. `numero` de la línea se calcula igual que en
  Presupuesto (máximo existente + 1). **`sub_total`, `igv` y `total` nunca se
  envían** — son columnas generadas. Si el insert falla (por ejemplo un trigger
  que valide el tope de costo), el `error.message` de Postgres se muestra tal
  cual, sin interceptarlo.
- No hay edición ni borrado de líneas individuales de `orden_compra_items`
  todavía (el pedido solo mencionaba "Agregar") — si hace falta corregir una
  línea ya cargada, avisame y lo agrego.

Pendiente, tal como se acordó: el PDF de impresión con marca de agua, y la columna
"Aprobac. Superv." no se agrega por ahora.
