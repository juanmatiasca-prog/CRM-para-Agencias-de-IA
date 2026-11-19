# 07 — Integraciones, automatizaciones y cumplimiento

> Base documental: `research_notes/CRM para agencias de IA/modelo_datos_e_integraciones.md` (estado: noviembre de 2026). Todo lo marcado **(criterio propio)** es inferencia de diseño, no hallazgo documentado.

---

## AVISO DE PLATAFORMA: Firebase Extensions está deprecado

> **El servicio Firebase Extensions está deprecado y cierra el 31 de marzo de 2027.** Firebase "recomienda encarecidamente migrar antes de esa fecha". La segunda fase de la migración arrancó en **septiembre de 2026**.
>
> **Qué sigue funcionando:** las extensiones ya desplegadas "corren directamente sobre infraestructura estándar de Google Cloud (Cloud Functions, Eventarc, Cloud Run y Cloud Tasks) y seguirán ejecutándose indefinidamente".
>
> **Qué se pierde tras el 31/03/2027:** la capacidad de **actualizarlas, reconfigurarlas o desinstalarlas** desde consola o CLI, **y también la de descargar las configuraciones existentes**. Es decir, una extensión instalada hoy y olvidada se convierte en una caja negra que no se puede tocar ni inspeccionar.
>
> **Qué lo reemplaza:** los **function kits**, paquetes npm que permiten desplegar las mismas funciones dentro del propio codebase de Cloud Functions, con soporte para múltiples instancias igual que las extensiones. Requisitos: **funciones de 2ª generación** y **`firebase-tools` ≥ 15.32.0**.
>
> **Pero no todas las extensiones tienen kit de reemplazo.** La de BigQuery sí (`@firebase-function-kits/firestore-bigquery-export`). La de Typesense **no**: su publisher no ha provisto kit, y la propia página recomienda hacer fork de la extensión y mantenerla uno mismo. Todas las extensiones son open source, así que forkear es viable para las que se queden sin kit.

### Qué significa esto desde el día uno

Este CRM empieza a construirse en noviembre de 2026, es decir, **16 meses antes del cierre**. Cualquier guía de arquitectura Firebase+CRM escrita antes de 2026 asume Extensions como mecanismo de integración por defecto, y esa suposición ya no es válida. Tres consecuencias que condicionan todas las decisiones de este documento:

1. **Ninguna dependencia de Firebase Extensions.** Las piezas que tradicionalmente se resolvían instalando una extensión —sincronización con motor de búsqueda, exportación a BigQuery, borrado de datos de usuario— se escriben como Cloud Functions propias o se adoptan como function kits desde el primer commit. Instalar una extensión ahora significa migrarla antes de marzo de 2027 de todas formas; es trabajo duplicado.
2. **Cloud Functions de 2ª generación, sin excepciones.** Los function kits lo exigen, y la documentación de triggers de Firestore lo recomienda por su cuenta: la 1ª gen requiere la base `(default)` en modo nativo, no soporta bases con nombre ni modo Datastore, y en 1ª gen los eventos que exceden el tamaño máximo de petición pueden no entregarse (se registran como error).
3. **El coste de mantenimiento cambia de sitio.** Lo que antes era "instalar una extensión" ahora es código propio en el repositorio: hay que presupuestar el mantenimiento de la sincronización de búsqueda y del pipeline de BigQuery como parte del producto, no como configuración.

**Hueco documental:** no se verificó si el cierre de Extensions afecta también a la disponibilidad del catálogo `extensions.dev` como fuente de código open source tras marzo de 2027. Si desaparece, la vía "forkear la extensión de Typesense" deja de estar disponible. **(criterio propio)** Prudencia mínima: si se decide esa vía, clonar el código al repositorio propio ahora, no en 2027.

---

## 1. Mapa de integraciones

> **Advertencia sobre esta sección.** **No se encontró ninguna fuente primaria citable** —ni informe de analista ni documentación de producto— que establezca un conjunto canónico de integraciones "imprescindibles" para un CRM de agencia. La priorización que sigue es **criterio propio** en su totalidad: un inventario razonado, no un hallazgo investigado. Lo que sí está bien documentado es el *cómo* de las dos primeras (§2).

Dato de contexto que sí procede de fuente: HubSpot modela como **objetos CRM nativos** varios artefactos que en otros sistemas serían integraciones — Emails, Calls, Meetings, Notes, Tasks, Quotes, Invoices y Orders. Es decir, parte de lo que aquí se lista como "integración" es, en un CRM maduro, estructura de datos propia alimentada por una integración.

| Integración | Para qué | Prioridad | Dificultad |
|---|---|---|---|
| **Email bidireccional** (Gmail / Microsoft 365) | Registro automático de actividades. Es el sistema nervioso del CRM: sin él las actividades se registran a mano y el CRM muere | Crítica | Alta — Pub/Sub, renovación de watch, reconciliación, verificación OAuth (§2) |
| **Calendario** (Google Calendar / Outlook) | Reuniones ligadas a deals y contactos | Crítica | Alta — notificaciones sin cuerpo, canales por calendario, sin renovación automática (§2) |
| **Formularios web / captación** | Entrada de leads con `utm_*` y consentimiento registrado | Alta | Baja — endpoint HTTP propio + validación |
| **Facturación / contabilidad** | Emisión de facturas y conciliación | Alta | Alta — ver nota normativa abajo |
| **Firma electrónica** | Propuestas y contratos firmados, con evento de firma como actividad | Alta | Media — API de proveedor + webhook entrante |
| **Slack** | Notificaciones de pipeline y alertas de automatización | Media | Baja — webhook saliente |
| **Videollamada** (grabación / transcripción) | Transcripción de reunión como actividad vinculada al deal | Media | Media — depende del proveedor y del volumen de almacenamiento |
| **Pasarela de pago** | Cobro de facturas y anticipos | Media | Media — webhooks de estado de pago |
| **WhatsApp Business API** | Canal de comunicación con cliente registrado como actividad | Baja | Alta — proceso de alta del proveedor, plantillas aprobadas |
| **LinkedIn** | Enriquecimiento y prospección | Baja | Muy alta — la API pública es muy restrictiva, lo que empuja a scraping o a herramientas de terceros con riesgo de incumplir los términos de servicio |
| **Herramientas de proyecto** | Sincronización de tareas de entrega | Baja | Media |
| **Exportación a BigQuery** | Reporting analítico e histórico de cambios | Alta | Baja — hay function kit oficial (`@firebase-function-kits/firestore-bigquery-export`) |
| **Motor de búsqueda externo** (Typesense/Algolia) | Búsqueda full-text y filtros arbitrarios | Condicionada | Alta — sin function kit para Typesense; hay que forkear y mantener |

**Nota normativa sobre facturación:** en España, Verifactu/TicketBAI y la factura electrónica B2B obligatoria por la Ley Crea y Crece condicionan esta pieza. **Este dato no se verificó en la investigación** y no debe darse por bueno sin confirmarlo con fuente oficial (AEAT) antes de diseñar el módulo de facturación.

**No investigados en esta ronda:** las APIs concretas de DocuSign/Signaturit, Stripe, Slack, WhatsApp Business y LinkedIn. Las entradas correspondientes de la tabla reflejan dificultad estimada, no análisis técnico.

### 1.1 Patrón técnico común a todas las integraciones

Se repite literalmente en Gmail, Calendar y Microsoft Graph, así que conviene implementarlo una vez:

- **`/tenants/{tid}/integrations/{provider}`** — configuración de la conexión: cuenta vinculada, scopes concedidos, estado. **Los refresh tokens OAuth van en Secret Manager, nunca en Firestore.**
- **`/tenants/{tid}/syncState/{provider}`** — cursores de sincronización: `historyId` (Gmail), `deltaLink` (Graph), `syncToken` (Calendar), `channelId`, `expiration`.
- **`/tenants/{tid}/syncChannels/{channelId}`** — suscripciones push activas con `provider`, `userId`, `externalChannelId`, `resourceId`, `expiresAt`.
- **Cloud Scheduler** para la renovación de canales (§2.4).
- **`/tenants/{tid}/inbox/{eventId}`** — **toda integración entrante escribe primero el evento crudo y procesa después.** Dos razones: idempotencia (los eventos llegan al menos una vez, §3) y capacidad de replay sin volver a llamar al proveedor.
- **`/tenants/{tid}/outbox/{id}`** — toda acción saliente se escribe como documento y la ejecuta una segunda función (§3.5).

---

## 2. Email y calendario: cómo funciona realmente

Gmail y Microsoft Graph resuelven el mismo problema con arquitecturas distintas, y Google Calendar con una tercera. Ninguna de las tres garantiza entrega.

### 2.1 Gmail: Pub/Sub + sincronización incremental

Gmail **no envía el contenido del cambio**. Empuja a **Cloud Pub/Sub** una notificación mínima y obliga a reconsultar.

**Montaje:** hay que crear un topic de Pub/Sub, una suscripción (push HTTP o pull) y **conceder permiso de publicación al service account `gmail-api-push@system.gserviceaccount.com`**. Las organizaciones con *domain-restricted sharing* pueden necesitar una excepción explícita para esa cuenta — es un bloqueante de despliegue fácil de descubrir tarde.

**Suscripción:** `users.watch` admite filtros opcionales por `labelIds` (p. ej. `INBOX`) y `labelFilterBehavior` (`INCLUDE` o excluir). Devuelve un `historyId` y un `expiration`, y dispara inmediatamente una notificación al topic.

**Caducidad: el watch expira y hay que llamar a `watch` al menos cada 7 días, o las actualizaciones se detienen para ese usuario.** La guía oficial recomienda **renovar una vez al día** usando el campo `expiration`.

**Qué llega:** un `PubsubMessage` JSON con `messageId`, `publishTime` y `subscription`. Atención a una trampa de nomenclatura: **el `messageId` es un identificador de Pub/Sub, no un ID de mensaje de Gmail.** Los datos de Gmail van en `message.data` codificados en Base64URL y contienen `emailAddress` y el nuevo `historyId`.

**Sincronización incremental:** al recibir la notificación hay que llamar a `users.history.list` con el último `historyId` conocido como `startHistoryId`, procesar, y guardar el `historyId` más reciente.

**Límite de notificación: cada usuario vigilado recibe como máximo una notificación por segundo; el exceso se descarta.** Además hay que evitar acciones en el handler que provoquen más cambios en el buzón, porque generan un bucle de notificaciones.

**Fiabilidad:** la entrega suele ser en segundos, pero **las notificaciones pueden retrasarse o perderse**; la propia documentación propone como fallback llamar periódicamente a `history.list` tras un periodo de silencio. Los mensajes no confirmados se reintentan. `users.stop` detiene las notificaciones de un buzón "en pocos minutos".

Un apunte de alcance: para aplicaciones de usuario final (móvil, navegador) Google recomienda **sync por polling en lugar de push**. El push es para backends como este.

### 2.2 Microsoft Graph: webhook HTTPS propio

**Tipos de notificación:** básicas (solo el `id` del recurso cambiado), **enriquecidas** (incluyen los datos del recurso) y **de ciclo de vida** (avisan cuando el cliente corre riesgo de perderse notificaciones). Los canales de entrega disponibles son webhooks, Azure Event Hubs y Azure Event Grid.

**Recursos relevantes:** Outlook `message` (`/users/{id}/messages`, `/me/mailFolders('inbox')/messages`), Outlook `event` (`/users/{id}/events`) y `contact`. Todos con un **máximo de 1.000 suscripciones activas por buzón para todas las aplicaciones**. Ese límite no es problema para una agencia con una suscripción por buzón, pero sí lo sería un diseño que creara una suscripción por carpeta o por contacto. Superar las cuotas devuelve **`403 Forbidden`**, con la propiedad `message` explicando qué límite se excedió.

**Caducidades — el dato que más condiciona la operación:**

| Tipo de suscripción | Caducidad máxima |
|---|---|
| `message`, `event`, `contact` | **10.080 minutos (menos de 7 días)** |
| Suscripciones con datos de recurso (rich notifications) | **1.440 minutos (menos de 1 día)** |

Las suscripciones se renuevan explícitamente antes de expirar, o hay que crear una nueva; también se pueden cancelar en cualquier momento.

**Latencias documentadas:** `message` y `contact`, menos de 1 minuto de media con máximo de 3 minutos; `calendar`, menos de 1 minuto con máximo de 3 minutos. Para `event` la tabla oficial indica latencia **"Unknown"**: no hay cifra de latencia para notificaciones de eventos de calendario de Outlook.

Graph ofrece además **change tracking (delta query)** como alternativa o complemento al push, que es exactamente la pieza que necesita el reconciliador de §2.4.

### 2.3 Google Calendar: notificaciones con cuerpo vacío

**Recursos observables:** `Acl`, `CalendarList`, `Events` y `Settings`. El usuario debe ser propietario o tener acceso al recurso, o la petición falla.

**Creación del canal:** el body del `watch` requiere `id` (string único por proyecto, máximo 64 caracteres, devuelto en `X-Goog-Channel-ID`), `type: "web_hook"` y `address` (URL HTTPS de callback). Opcionalmente `token` (máximo 256 caracteres, devuelto en `X-Goog-Channel-Token`, útil para verificar autenticidad) y `expiration` (timestamp Unix en milisegundos).

**Requisito de certificado:** el callback **debe usar HTTPS con certificado SSL válido**. No se aceptan certificados autofirmados, de emisores no confiables, revocados, ni con subject que no coincida con el hostname. Cloud Functions lo provee de serie.

**No hay renovación automática.** Antes de que expire el canal hay que crear uno **nuevo con un `id` único distinto**, y "es probable que haya un periodo de solapamiento" con ambos canales activos — lo que significa notificaciones duplicadas durante ese solapamiento, que el lado CRM tiene que absorber sin duplicar actividades.

**Las notificaciones son POST sin cuerpo.** Siempre incluyen las cabeceras `X-Goog-Channel-ID`, `X-Goog-Message-Number`, `X-Goog-Resource-ID`, `X-Goog-Resource-State` y `X-Goog-Resource-URI`. Los estados son `sync` (canal creado, con message number siempre 1), `exists` (recurso creado, modificado o borrado) y `not_exists`. **Como el cuerpo va vacío, hay que llamar a la API para obtener los detalles del cambio.** Los números de mensaje crecen pero **no son secuenciales**, así que no sirven para detectar huecos.

**Respuestas esperadas:** 200, 201, 202, 204 o 102 indican éxito. Con la client library de Google, devolver 500/502/503/504 provoca reintento con backoff exponencial, y cualquier otro código se trata como fallo.

**Limitaciones de alcance:** `Events` y `Acl` son **por calendario** (una suscripción por calendario); `Settings` y `CalendarList` son por usuario. **No se notifica cuando se gana acceso a un calendario nuevo** — hay que descubrirlo por otra vía. Y el aviso explícito de la documentación: **"las notificaciones no son 100 % fiables y algunos mensajes pueden perderse"**; la aplicación debe tolerar mensajes ausentes y seguir sincronizada.

Detalle de gobernanza que importa al operar en producción: un canal creado por un usuario normal **solo puede detenerlo ese usuario desde el mismo cliente OAuth**; uno creado por un service account puede detenerlo cualquier usuario del mismo cliente.

### 2.4 La regla que se deriva de todo lo anterior

> **Todo push necesita un reconciliador periódico. Sin excepción.**

Ninguno de los tres proveedores garantiza entrega: Gmail **descarta** notificaciones por encima de 1/s por usuario y advierte de que pueden perderse; Calendar lo dice explícitamente; Graph ofrece notificaciones de ciclo de vida precisamente porque asume que el cliente puede perderse eventos. Por tanto **el push es una optimización de latencia sobre un reconciliador, nunca la única vía de sincronización**.

**(criterio propio) Dimensionamiento del reconciliador:** un barrido cada 15–60 minutos por cuenta conectada, usando el mecanismo incremental de cada proveedor — `history.list` con el `historyId` guardado en Gmail, delta query en Graph, `syncToken` en Calendar.

**Hueco documental:** la página de push de Calendar **no cubre `syncToken` ni la sincronización incremental** (remite a otra página no consultada), así que falta el detalle exacto de cómo recuperar qué cambió tras una notificación `exists`. Hay que resolverlo antes de implementar.

**La renovación es la parte que más se rompe en producción.** Calendario propuesto:

| Proveedor | Caducidad | Frecuencia de renovación propuesta **(criterio propio)** |
|---|---|---|
| Gmail `watch` | 7 días | Diaria (la propia guía de Google lo recomienda) |
| Graph `message` / `event` | < 7 días | Al menos cada 48 h |
| Graph con rich notifications | < 1 día | Cada 12 h |
| Google Calendar | Según el `expiration` devuelto | Antes del `expiration`, con canal de `id` nuevo |

Un fallo silencioso de renovación produce el peor modo de fallo posible: **"el CRM dejó de registrar emails" sin ningún error visible**. Hay que alarmar sobre canales con `expiresAt` próximo y sin renovación confirmada, y tratar esa alarma como incidente.

### 2.5 Idempotencia y volumen en el lado CRM

**Idempotencia.** La clave natural para no duplicar actividades es el **`Message-Id` RFC 5322** del email (o el **`iCalUId`** del evento), usado como ID de documento en `/tenants/{tid}/activities/`. Eso convierte un reprocesamiento —por reintento, por solapamiento de canales, por replay desde el `inbox`— en un `set()` idempotente en lugar de un duplicado.

**Volumen, coste y privacidad.** Sincronizar los buzones completos de todo el equipo a Firestore es caro y arriesgado. El patrón habitual es **logging selectivo**: registrar solo los emails cuyo remitente o destinatario coincide con un contacto del CRM (match por dirección), guardar metadatos y snippet en Firestore, y dejar el cuerpo completo en el proveedor, recuperándolo bajo demanda. Esto reduce drásticamente la superficie GDPR (§4) y mantiene los documentos lejos del límite de 1 MiB.

**Hueco de planificación:** no se investigó el proceso de **verificación de app de Google**. Los scopes restringidos de Gmail requieren una *security assessment* anual realizada por un tercero, lo que es un bloqueante de calendario y un coste real para cualquier CRM que lea correo. **Dato no verificado en esta ronda**, pero con impacto directo en el cronograma del proyecto: conviene confirmarlo antes de comprometer fechas para la integración de email.

---

## 3. Motor de automatizaciones

El modelo universal de los motores de workflow de CRM es **trigger → condiciones → acciones**, con ramas y esperas. Sobre Firebase se implementa con triggers de Firestore de 2ª generación, Cloud Tasks o Cloud Scheduler para las esperas y los SLA, y una disciplina estricta de idempotencia y anti-bucle.

**Hueco de fuentes:** no se consultó la documentación de los motores de workflow de HubSpot ni Salesforce (Flow Builder, Workflows), así que **la taxonomía de triggers y acciones que sigue es criterio propio**, no una categorización respaldada por fuente.

### 3.1 Triggers (criterio propio)

- **Cambio de etapa de un deal** — entrada o salida de una etapa concreta del pipeline.
- **Creación de registro** — contacto, lead, deal, proyecto.
- **Cambio de campo** — `lifecycleStage`, `ownerId`, `amount`, `closeDate`.
- **Actividad registrada** — email entrante, reunión celebrada, llamada registrada.
- **Inactividad** — N días sin actividad en un deal abierto.
- **Fecha relativa** — X días antes del `closeDate`, del vencimiento de un `Retainer` o del fin de un `Contract`.
- **Umbral consumido** — porcentaje de horas de un retainer agotado.
- **Evento externo** — firma de contrato, pago recibido, envío de formulario web.

### 3.2 Condiciones (criterio propio)

Comparaciones sobre campos del registro disparador y de sus relaciones directas: importe, pipeline, owner, equipo, `lifecycleStage`, origen (`utm_*`), tipo de servicio del line item, antigüedad del registro, existencia de actividad previa. Combinables con Y/O y negación.

### 3.3 Acciones (criterio propio)

- Crear tarea asignada a un usuario, equipo o al owner del registro.
- Enviar email desde plantilla (vía `outbox`, §3.5).
- Notificar en Slack.
- Cambiar campo del registro (etapa, owner, prioridad, `lifecycleStage`).
- Asignar owner por round-robin o por regla de territorio.
- Crear proyecto a partir de un deal ganado, con tareas plantilla.
- Generar borrador de propuesta o de factura.
- Llamar a un webhook externo.
- Esperar N días/horas y continuar (§3.6).
- Escalar si no hay respuesta (SLA).

### 3.4 Ejemplos concretos del negocio de agencia (criterio propio)

- **Lead entrante desde formulario** → asignar comercial por round-robin, crear tarea "primer contacto" con vencimiento a 24 h, enviar email de acuse, y si a las 24 h no hay actividad registrada, escalar al admin.
- **Deal pasa a "Propuesta enviada"** → crear tarea de seguimiento a 3 días, notificar en el canal de Slack de ventas, y si a los 7 días sigue en la misma etapa, marcar como "en riesgo".
- **Deal pasa a "Ganado"** → crear `Contract`, crear `Project` con las tareas plantilla del servicio contratado, asignar equipo de delivery, notificar a delivery, y generar borrador de primera factura.
- **Retainer alcanza el 80 % de horas consumidas** → notificar al comercial responsable y crear tarea de conversación de ampliación con el cliente.
- **Contrato a 30 días de su fin** → crear tarea de renovación, notificar al owner del deal original.
- **Contacto responde un email tras 60 días de silencio** → reabrir el deal asociado si estaba en "pausado", notificar al owner.
- **Factura vencida sin cobro** → tarea de recobro al owner, escalado a admin a los 15 días.

### 3.5 Arquitectura: despachador único e `outbox`

**Las definiciones de workflow son datos, no código.** `/tenants/{tid}/workflows/{wid}` con trigger, condiciones, acciones, `enabled` y `version`; y `/tenants/{tid}/workflowRuns/{runId}` con el estado de cada ejecución (`pending`, `waiting`, `done`, `failed`, `nextStepAt`). Guardarlas como datos permite que el usuario cree automatizaciones **sin desplegar código**, y una única Cloud Function genérica interpreta la definición.

**Despachador único vs función por regla.** Con una función `onDocumentWritten` por entidad que lee las workflows activas del tenant y evalúa condiciones, se evita desplegar funciones nuevas por cada automatización. El coste es una lectura (cacheable) de las definiciones por evento. **(criterio propio)** Es el trade-off correcto para este producto: el despliegue por automatización sería inadmisible para un usuario final.

**Las acciones de salida van por `outbox`.** Email, Slack y webhooks se escriben primero como documento en `/tenants/{tid}/outbox/{id}` y los procesa una **segunda** función, en lugar de llamar a la API externa dentro del trigger. Así un fallo de la API externa no obliga a reintentar toda la lógica del workflow, y queda registro auditable de qué se intentó enviar y con qué resultado.

**Consideración de región:** la latencia de red aumenta si la instancia de Firestore y la función están en regiones distintas; conviene fijar la región de la función explícitamente.

### 3.6 Esperas, SLA y temporizadores

Firestore no tiene temporizadores. Dos patrones, ambos sobre stack estándar de Firebase — las extensiones desplegadas corren sobre Cloud Functions, Eventarc, Cloud Run y **Cloud Tasks**, lo que confirma que Cloud Tasks es parte del stack soportado:

- **(a) Cloud Tasks con `scheduleTime`** para esperas precisas por ejecución ("si no hay respuesta en 24 h, escalar"). Escala mejor y no genera lecturas en vacío.
- **(b) Cloud Scheduler + consulta periódica** sobre `where('nextStepAt','<=',now)`, con un barrido cada minuto. Más simple, y permite cancelar una espera simplemente borrando el campo.

**(criterio propio)** Para SLA de respuesta —tiempo hasta primer contacto— (a) es preferible porque el evento es por-registro. Para barridos de estado agregado, (b) basta.

**Hueco:** no se investigaron Cloud Workflows ni Cloud Tasks en detalle (límites de tareas programadas, horizonte máximo de `scheduleTime`), lo que sería necesario para dimensionar esperas largas del tipo "recordar en 6 meses".

### 3.7 At-least-once y sin orden garantizado: lo que exige

Dos garantías de los triggers de Firestore condicionan todo el diseño del motor:

> **"Los eventos se entregan al menos una vez, pero un solo evento puede provocar múltiples invocaciones de la función."** No hay que confiar en entrega exactamente-una-vez: las funciones deben ser idempotentes.

> **El orden no está garantizado**: cambios rápidos pueden llegar en secuencia inesperada.

**Qué exige la primera garantía: deduplicación por event ID.** "Enviar email de bienvenida al crear contacto" puede enviarse dos veces. El patrón correcto es escribir un documento `/tenants/{tid}/workflowRuns/{eventId}_{workflowId}` con una operación de **creación que falla si el documento ya existe**, **antes** de ejecutar la acción, usando el **ID de evento de Eventarc** como clave de deduplicación. Si la creación falla, el evento ya se procesó y la invocación termina sin hacer nada.

**Qué exige la segunda: versionado de documentos.** Si un deal pasa de Stage A → B → C en dos segundos, la función puede ver la transición B→C **antes** que A→B. Una automatización del tipo "cuando un deal entra en B, crear tarea" se dispararía fuera de orden o se perdería. Las dos salidas:

1. **Leer el estado actual del documento dentro de una transacción** en vez de confiar en el `before` del evento.
2. **Versionar el documento** con un campo `rev: number` incremental y **descartar los eventos cuyo `rev` sea menor que el último ya procesado**.

**(criterio propio)** Usar ambas: `rev` como filtro barato en la entrada de la función, y lectura transaccional para las automatizaciones que dependen de la transición concreta.

**Anti-bucle.** Escribir de vuelta en el documento que disparó la función puede causar un bucle infinito; la documentación recomienda comprobar si el dato relevante cambió realmente comparando `before` y `after`, y salir pronto si no. En un CRM esto es un problema real, no teórico: "al actualizar un deal, recalcular el total de line items y escribirlo en el deal" se autodispara. La guarda estándar es comparar el valor calculado con el existente y salir si coinciden, más un campo `_lastWriteBy: "system"` que la función ignora. Ayuda que **las escrituras sin cambio real no generan evento**; pero no basta, porque un recálculo que produce un valor ligeramente distinto sí lo genera.

**Granularidad del trigger.** La ruta del trigger debe apuntar a un documento, no a una colección; los wildcards (`{userId}`) se extraen en `event.params`. Y **no se puede disparar sobre campos específicos**: el filtrado por campo se hace dentro de la función.

**Higiene de despliegue.** Un trigger está ligado a una única base de datos, y la función y la base deben estar en el mismo proyecto. **Borrar una base de datos no borra sus triggers**: dejan de recibir eventos pero siguen existiendo hasta eliminarlos explícitamente.

**Asignación automática (round-robin).** Necesita un cursor compartido, que es un documento de escritura concurrente — exactamente el caso de hotspot descrito en el documento 06. Para volúmenes de agencia (decenas de leads al día) un único documento transaccional basta; para volúmenes altos hay que shardear o asignar por hash del lead.

**Hueco documental:** la documentación consultada no describe las políticas de reintento ni cifras de latencia de los triggers más allá de la garantía at-least-once. **Falta el dato de cuántas veces y durante cuánto tiempo reintenta Eventarc un evento fallido**, que es necesario para dimensionar el manejo de errores del `outbox`.

---

## 4. Cumplimiento

> **Esto no es asesoramiento legal.** Es un resumen técnico de los requisitos que condicionan el modelo de datos y la arquitectura, elaborado a partir del texto del GDPR y de la documentación de privacidad de Firebase. Cualquier decisión con efecto jurídico —bases de licitud, plazos de retención, redacción de cláusulas, registro de actividades de tratamiento— debe validarla un profesional cualificado.

Un CRM es casi por definición un tratamiento de datos personales a gran escala. El reparto de papeles está documentado: **el cliente del CRM es el responsable (controller) y Google/Firebase el encargado (processor)** — "los clientes son típicamente el 'responsable del tratamiento' del GDPR (...) y Google actúa generalmente como 'encargado del tratamiento'".

### 4.1 Artículo 17: derecho de supresión

**Art. 17(1) — supuestos que obligan a suprimir sin dilación indebida:**

- (a) los datos ya no son necesarios para los fines para los que se recogieron o trataron;
- (b) el interesado retira el consentimiento y no existe otra base jurídica;
- (c) el interesado se opone en virtud del Art. 21(1) y no prevalecen motivos legítimos, **o se opone conforme al Art. 21(2) — marketing directo**;
- (d) los datos se trataron ilícitamente;
- (e) la supresión es una obligación legal de la UE o de un Estado miembro;
- (f) los datos se obtuvieron en relación con servicios de la sociedad de la información ofrecidos a menores (Art. 8(1)).

**Art. 17(3) — excepciones, cuando el tratamiento es necesario:**

- (a) para la libertad de expresión e información;
- (b) para cumplir una obligación legal o una misión de interés público;
- (c) por razones de salud pública (Art. 9(2)(h)(i) y 9(3));
- (d) para archivo en interés público, investigación científica/histórica o estadística (Art. 89(1)), cuando la supresión impediría u obstaculizaría gravemente esos fines;
- **(e) para la formulación, el ejercicio o la defensa de reclamaciones.**

**El supuesto más relevante para un CRM de agencia es el 17(1)(c) con remisión al Art. 21(2):** la oposición al marketing directo es **incondicional** y no admite ponderación de intereses. En la práctica, el CRM debe soportar "no borrar al contacto pero no volver a contactarle nunca", lo que obliga a una **lista de supresión** que sobreviva al borrado del contacto. La paradoja es deliberada: **hay que conservar un hash del email precisamente para garantizar que nunca se le vuelva a escribir**, y ese hash debe justificarse como cumplimiento de una obligación, no como dato de marketing.

**La excepción más relevante es la 17(3)(e):** la defensa de reclamaciones es la base que justifica conservar facturas, contratos y comunicaciones de un cliente tras su petición de borrado; en España hay además obligaciones mercantiles y fiscales de conservación. Consecuencia de diseño: **el derecho al olvido en un CRM de agencia casi nunca es un borrado total, sino una anonimización selectiva** — borrar nombre, email, teléfono y actividades de marketing, conservar la factura con el NIF que exige la ley. El modelo de datos debe permitir anonimizar un contacto sin romper las referencias desde `Invoice` y `Contract`, lo que refuerza la decisión del documento 06 de referenciar por ID y guardar nombres como *snapshots* históricos en los documentos financieros.

**Campos mínimos que esto impone a `Contact`:** `lawfulBasis` ("consent" | "legitimate_interest" | "contract"), `consents[]` (canal, finalidad, timestamp, fuente, **texto exacto mostrado**, IP si procede — el consentimiento hay que *poder demostrarlo*), `optOutAt` por finalidad, `retentionUntil` y `source`. Sin estos campos el CRM no puede responder a una solicitud ni demostrar cumplimiento.

### 4.2 El riesgo fácil de pasar por alto: BigQuery conserva los datos tras borrarlos en Firestore

> La exportación a BigQuery es un **espejo con historial**. La tabla changelog almacena "el historial completo de cambios con metadatos como `timestamp`, `document_name` y `operation`", y la vista "latest" el estado actual.
>
> **Por tanto, un borrado en Firestore solo añade una operación `DELETE` a la changelog. Los datos personales siguen en BigQuery.**
>
> Cualquier diseño que incluya exportación a BigQuery **debe incluir un procedimiento explícito de supresión en BigQuery**, o no cumple el Art. 17. **Este es probablemente el fallo de cumplimiento más fácil de cometer en esta arquitectura**, porque la exportación se instala una vez, funciona bien, y nadie vuelve a mirarla.

A esto se suma la fricción propia de Firestore: **borrar un documento no borra sus subcolecciones** — los `consents` de un contacto, su `stageHistory`, sus líneas — y "no se pueden borrar subcolecciones fácilmente". El procedimiento de supresión tiene que ser un recorrido explícito, no un `delete`.

Y una advertencia de alcance general: **hay que poder ejecutar la petición de borrado también en copias de seguridad y sistemas conectados**, no solo en la base operacional. Cada integración (Typesense Cloud, Algolia, Slack, la pasarela de firma) es un **sub-encargado** que debe figurar en el DPA con el cliente y en el registro de tratamientos. Una arquitectura que sincroniza todos los contactos a un motor de búsqueda externo multiplica la superficie de cumplimiento; **limitar los campos sincronizados** (nombre y empresa, sin teléfono ni notas) es una medida de minimización defendible **(criterio propio)**.

### 4.3 Firebase Authentication opera solo desde centros de datos de EE. UU.

> **Firebase Authentication opera únicamente desde centros de datos de Estados Unidos.** La mayoría de los demás servicios corren sobre infraestructura global de Google; algunos permiten seleccionar ubicación, lo que restringe el tratamiento a esa ubicación. Si un servicio no ofrece selección, los datos pueden tratarse donde Google o sus agentes mantengan instalaciones.

Para un responsable europeo esto es un **tratamiento con transferencia internacional**. Google lo cubre con el marco EU-U.S. Data Privacy Framework y el Cloud DPA, pero **debe reflejarse en el Registro de Actividades de Tratamiento y en la información que se da a los interesados** — no es un detalle técnico que se pueda omitir.

Firestore, en cambio, **sí permite elegir ubicación de la base de datos**: la documentación recomienda elegirla cerca de usuarios y recursos de cómputo, multi-región para disponibilidad o regional para menor coste y latencia de escritura. Para un proyecto europeo, `europe-west1` o la multi-región `eur3`. **Esa elección se toma al crear la base y no se puede cambiar después.**

### 4.4 Marco contractual y retención documentados

- Los términos de tratamiento aplicables son los **Firebase Data Processing and Security Terms**; los servicios Firebase regidos por los términos de GCP quedan cubiertos por el **Cloud Data Processing Addendum**. **Google Analytics es un servicio aparte con sus propios términos.**
- Firebase ha completado evaluaciones **ISO 27001 y SOC 1, 2 y 3**; algunos servicios también ISO 27017 y 27018. Google declara cumplir los marcos EU-U.S., Swiss-U.S. y UK Extension Data Privacy Framework.
- **Plazos de borrado documentados:** Authentication, App Distribution y los servicios basados en installation ID (Cloud Messaging, In-App Messaging, Remote Config) eliminan los datos de sistemas vivos y de backup **en un plazo de 180 días** desde que el cliente inicia el borrado.
- **Retenciones fijas:** Crashlytics conserva datos de fallos **90 días**; Performance Monitoring conserva eventos asociados a IP **30 días** y datos asociados a installation **60 días**; los tokens de App Check duran como máximo **7 días** y los de protección contra replay se guardan como máximo **30 días**.
- **"Los clientes son responsables de atender los derechos de los interesados."** Firebase no lo hace por nadie.
- Sin un DPA (acuerdo de encargo) con cada cliente, "careces de la protección contractual requerida para el tratamiento lícito bajo el GDPR".

**Herramienta de retención automática:** las políticas **TTL de campo único** de Firestore permiten purga por fecha usando `retentionUntil` como campo TTL. Dos avisos del documento 06 que aplican aquí: el cupo (200 sin facturación / 1.000 con facturación por base) **comparte presupuesto con las configuraciones de indexación**, y los campos TTL están indexados por defecto, por lo que conviene eximirlos. La práctica documentada en el sector respalda el mecanismo: la supresión "solo es completa si el CRM borra los datos automáticamente una vez vencido el periodo de retención de la empresa", y hay proveedores (Zoho) que bloquean el registro durante el periodo de retención definido en los términos del responsable y después dejan que este decida si lo borra.

**Opción intermedia:** la **restricción del tratamiento** es la salida más ligera cuando el interesado disputa la exactitud de los datos o se ha opuesto. Merece un estado propio en el modelo (`processingRestricted`) además del borrado lógico **(criterio propio)**.

Última nota de higiene que afecta al modelado: **no almacenar datos sensibles en IDs de proyecto, nombres de documento ni nombres de campo.** Esto tiene una interacción directa con la decisión del documento 06 de usar el `Message-Id` de email como ID de documento — un `Message-Id` RFC 5322 no es un dato personal en sí, pero sí lo sería usar la dirección de email como ID.

### 4.5 Lo que falta cubrir: normativa española específica

**No se investigó la normativa española aplicable**, y es directamente relevante para una agencia que hace prospección comercial en España. Quedan sin cubrir, como mínimo:

- **LOPDGDD Art. 19**, sobre el tratamiento de datos de contacto de empresarios individuales y profesionales liberales — el supuesto exacto de la prospección B2B de una agencia.
- **LSSI**, sobre comunicaciones comerciales electrónicas.
- **Verifactu / TicketBAI** y la **factura electrónica B2B obligatoria por la Ley Crea y Crece**, que condicionan el módulo de facturación.
- Plazos de retención concretos aplicables a datos de prospección comercial B2B, y el tratamiento del interés legítimo en CRM B2B. **No se encontró fuente primaria (EDPB, AEPD) sobre estos puntos**: las fuentes disponibles sobre GDPR aplicado a CRM son casi todas blogs de proveedores, no autoridades.
- El detalle de **qué cláusulas de supresión y plazos de purga en backups** contienen los Firebase Data Processing and Security Terms.

**Hueco adicional:** la página de privacidad de Firebase **no menciona ninguna "extensión de borrado de datos de usuario"**. No se pudo confirmar si sigue existiendo `delete-user-data` ni si tiene function kit de reemplazo tras la deprecación de Extensions. **(criterio propio)** Dado el aviso de la cabecera de este documento, lo prudente es asumir que el procedimiento de supresión —Firestore, subcolecciones, BigQuery, motor de búsqueda externo y Auth— se escribe como código propio del proyecto.

---

## 5. Checklist de seguridad para un repositorio público

Dado todo lo anterior, lo que **nunca** puede acabar en el repositorio:

**Credenciales y secretos**

- [ ] **Refresh tokens OAuth** de Gmail, Google Calendar o Microsoft Graph. Van en Secret Manager, nunca en Firestore ni en el repo.
- [ ] **Client secrets** de las aplicaciones OAuth (Google Cloud, Azure AD).
- [ ] Claves de API de Typesense, Algolia, Slack, la pasarela de pago, el proveedor de firma electrónica.
- [ ] **Ficheros de service account JSON** del Admin SDK. Una filtración aquí es total: las escrituras del Admin SDK **saltan las Security Rules** y "pueden alcanzar cualquier parte de la base de datos".
- [ ] El `token` o `clientState` usado para validar las notificaciones entrantes de Calendar y Graph. Sin esa validación cualquiera puede inyectar notificaciones falsas; publicarlo equivale a no tenerlo.
- [ ] Ficheros `.env`, `.runtimeconfig.json`, exports de configuración de Cloud Functions.

**Datos personales y de negocio**

- [ ] Volcados de Firestore, exports de BigQuery, backups o *fixtures* con datos reales de contactos, emails o facturas.
- [ ] Snippets o cuerpos de email reales en tests o en documentación.
- [ ] Capturas de pantalla con datos de clientes sin anonimizar.
- [ ] La `suppressionList`, aunque esté hasheada: es una lista de personas que ejercieron un derecho.
- [ ] IDs de tenant reales en ejemplos, si identifican a un cliente de la agencia.

**Configuración que revela superficie de ataque**

- [ ] URLs de las Cloud Functions de webhook entrante (Graph, Calendar, formularios) junto con sus esquemas de validación.
- [ ] Nombres de topics y suscripciones de Pub/Sub de producción.
- [ ] `project_id` de producción en ficheros de configuración versionados.

**Prácticas que lo hacen sostenible (criterio propio)**

- [ ] Ficheros `*.example` versionados y los reales en `.gitignore`, comprobado **antes** del primer commit — no después.
- [ ] Escaneo de secretos en pre-commit y en CI.
- [ ] Reglas de Firestore e índices **sí** se versionan: son la especificación de seguridad y deben revisarse en pull request. No contienen secretos.
- [ ] Un secreto que llegó a un repositorio público se considera comprometido y se rota, aunque el commit se haya reescrito. El historial de Git no es un borrador.

---

## 6. Funcionalidades derivadas

Prioridad MoSCoW: **M** Must have · **S** Should have · **C** Could have · **W** Won't have (esta vez).

| ID | Funcionalidad | Prioridad |
|---|---|---|
| F-INT-01 | Conexión OAuth de cuenta Google o Microsoft por usuario, con refresh token en Secret Manager | M |
| F-INT-02 | Sincronización entrante de email con registro selectivo (solo correos que casan con un contacto del CRM) | M |
| F-INT-03 | Idempotencia de actividades por `Message-Id` RFC 5322 / `iCalUId` como ID de documento | M |
| F-INT-04 | Colección `inbox` de eventos crudos con capacidad de replay | M |
| F-INT-05 | Renovación automática de canales push (Gmail diaria, Graph ≤48 h, Calendar según `expiration`) | M |
| F-INT-06 | Reconciliador periódico por proveedor (`history.list` / delta query / `syncToken`), cada 15–60 min | M |
| F-INT-07 | Alarma por canal de sincronización próximo a expirar sin renovación confirmada | M |
| F-INT-08 | Validación de autenticidad de las notificaciones entrantes (`token` de Calendar, `clientState` de Graph) | M |
| F-INT-09 | Sincronización de calendario con vinculación de reuniones a deals y contactos | M |
| F-INT-10 | Colección `outbox` para toda acción saliente, procesada por función separada y reintentable | M |
| F-INT-11 | Motor de workflows con definiciones almacenadas como datos (`workflows` + `workflowRuns`) | M |
| F-INT-12 | Deduplicación de ejecuciones por event ID de Eventarc, con creación que falla si ya existe | M |
| F-INT-13 | Versionado de documentos (`rev`) y descarte de eventos fuera de orden | M |
| F-INT-14 | Guardas anti-bucle en todos los triggers (comparación `before`/`after` + `_lastWriteBy`) | M |
| F-INT-15 | Esperas y SLA con Cloud Tasks (`scheduleTime`) y barrido con Cloud Scheduler | M |
| F-INT-16 | Registro de consentimiento por canal y finalidad, con texto exacto mostrado y timestamp | M |
| F-INT-17 | Lista de supresión por hash de email, que sobrevive al borrado del contacto | M |
| F-INT-18 | Procedimiento de supresión GDPR end-to-end: Firestore + subcolecciones + BigQuery + motor de búsqueda + Auth | M |
| F-INT-19 | Anonimización selectiva de contacto conservando snapshots en facturas y contratos | M |
| F-INT-20 | Retención automática por TTL (`retentionUntil`), con exención de índice sobre el campo TTL | M |
| F-INT-21 | Exportación a BigQuery vía function kit oficial, con cobertura explícita de subcolecciones por wildcard | S |
| F-INT-22 | Captación de leads desde formulario web con `utm_*` y consentimiento | S |
| F-INT-23 | Notificaciones a Slack desde el motor de automatizaciones | S |
| F-INT-24 | Asignación automática de leads (round-robin con cursor transaccional) | S |
| F-INT-25 | Estado de "restricción del tratamiento" independiente del borrado lógico | S |
| F-INT-26 | Firma electrónica de propuestas y contratos, con el evento de firma como actividad | S |
| F-INT-27 | Portal de exportación de datos del interesado (derecho de acceso y portabilidad) | S |
| F-INT-28 | Búsqueda full-text (vía Enterprise, Typesense propio o `searchTokens`), condicionada a la decisión abierta nº 1 | S |
| F-INT-29 | Integración con pasarela de pago y conciliación de facturas | C |
| F-INT-30 | Transcripción de videollamadas como actividad vinculada al deal | C |
| F-INT-31 | Facturación electrónica conforme a normativa española (Verifactu / Ley Crea y Crece) | C |
| F-INT-32 | Editor visual de workflows para usuario final | C |
| F-INT-33 | WhatsApp Business API como canal registrado | C |
| F-INT-34 | Sincronización bidireccional con herramientas de gestión de proyecto | C |
| F-INT-35 | Integración con LinkedIn (API pública muy restrictiva; alternativas con riesgo de incumplir ToS) | W |
| F-INT-36 | Dependencia de cualquier Firebase Extension sin function kit de reemplazo | W |
| F-INT-37 | Sincronización de buzones completos a Firestore (coste y superficie GDPR inasumibles) | W |

---

## 7. Decisiones abiertas

1. **Function kit, fork o código propio para la sincronización de búsqueda.** Typesense no tiene kit de reemplazo y su página recomienda forkear. Hay que decidir si se asume ese mantenimiento o se va por la edición Enterprise de Firestore (decisión ligada a la nº 1 del documento 06).
2. **Verificación de app de Google y security assessment anual.** No investigada. Los scopes restringidos de Gmail la requieren, y es un bloqueante de calendario y presupuesto. **Hay que confirmar coste y plazo antes de comprometer fechas para F-INT-02.**
3. **Alcance del registro de email: selectivo o completo.** El logging selectivo es la recomendación, pero hay que fijar la regla de matching (¿solo contactos existentes? ¿también dominios de empresas cliente?) y qué hacer con los correos que no casan.
4. **Procedimiento de supresión en BigQuery.** Sin él no se cumple el Art. 17. Hay que decidir si se borra por `document_name` en la changelog, si se reescribe la tabla, o si se opta por no exportar a BigQuery los campos personales.
5. **Horizonte máximo de esperas del motor de automatizaciones.** Depende de límites de Cloud Tasks no investigados. Si no soporta "recordar en 6 meses", hace falta el patrón (b) de barrido para esperas largas.
6. **Política de reintentos del `outbox`.** Falta el dato de cuántas veces y durante cuánto tiempo reintenta Eventarc un evento fallido, necesario para no duplicar la lógica de reintento.
7. **Normativa española.** LOPDGDD Art. 19, LSSI, Verifactu y Ley Crea y Crece sin investigar. Condiciona F-INT-31 y la base de licitud de toda la prospección.
8. **Plazos de retención por tipo de dato.** No hay fuente primaria (EDPB, AEPD) sobre prospección B2B en España. Hasta tenerla, los valores de `retentionUntil` son una decisión del cliente responsable, no un valor por defecto del producto.
9. **DPA y lista de sub-encargados.** Cada integración activada añade un sub-encargado. Hay que decidir si el producto trae una plantilla de DPA y un registro de sub-encargados mantenido, o si lo deja al cliente.
10. **Qué hacer con las notificaciones de ciclo de vida de Graph.** Existen precisamente para avisar de riesgo de pérdida de eventos, pero no se diseñó su manejo. Pueden reducir la frecuencia necesaria del reconciliador.
11. **Vigencia del catálogo `extensions.dev` tras marzo de 2027.** Si desaparece como fuente de código open source, la vía de forkear deja de existir. Clonar al repositorio propio ahora **(criterio propio)**.

---

## 8. Fuentes

**Plataforma — deprecación de Extensions**

- [Firebase Extensions FAQ and troubleshooting](https://firebase.google.com/docs/extensions/faq-and-troubleshooting) — cierre el 31/03/2027, qué se pierde, function kits, open source
- [Migrate Firebase Extensions to function kits](https://firebase.google.com/docs/extensions/users/migrate) — requisitos de 2ª gen y `firebase-tools` ≥ 15.32.0, fases de migración
- [extensions.dev, firestore-typesense-search](https://extensions.dev/extensions/typesense/firestore-typesense-search) — sin function kit de reemplazo, recomendación de fork, requisitos
- [extensions.dev, firestore-bigquery-export](https://extensions.dev/extensions/firebase/firestore-bigquery-export) — changelog y vista latest, subcolecciones, import de datos existentes, partición y clustering, function kit disponible

**Email y calendario**

- [Gmail API, Push notifications](https://developers.google.com/workspace/gmail/api/guides/push) — Pub/Sub, service account `gmail-api-push@system.gserviceaccount.com`, `users.watch`, caducidad de 7 días, `history.list`, límite de 1 notificación/segundo por usuario, fiabilidad
- [Microsoft Graph, Change notifications overview](https://learn.microsoft.com/en-us/graph/change-notifications-overview) — tipos de notificación, recursos, 1.000 suscripciones por buzón, caducidades de 10.080 y 1.440 minutos, latencias, delta query, `403 Forbidden`
- [Google Calendar API, Push notifications](https://developers.google.com/workspace/calendar/api/guides/push) — recursos observables, parámetros del canal, requisito HTTPS, ausencia de renovación automática, notificaciones sin cuerpo, cabeceras y estados, códigos de respuesta, limitaciones de fiabilidad

**Automatizaciones**

- [Firebase, Firestore triggers](https://firebase.google.com/docs/functions/firestore-events) — tipos de evento de 2ª gen y variantes `WithAuthContext`, entrega at-least-once, orden no garantizado, no-op writes, riesgo de bucle infinito, triggers ligados a una base, 1ª gen vs 2ª gen, latencia por región
- [Firestore, Quotas and limits](https://firebase.google.com/docs/firestore/quotas) — límite de transacción (270 s / 60 s de inactividad), 500 transformaciones de campo, cupos TTL

**Cumplimiento**

- [GDPR Art. 17](https://gdpr-info.eu/art-17-gdpr/) — supuestos del 17(1) y excepciones del 17(3) (fuente primaria)
- [Firebase, Privacy and Security](https://firebase.google.com/support/privacy) — responsable/encargado, Firebase DPST y Cloud DPA, certificaciones, plazo de 180 días, retenciones de Crashlytics/Performance/App Check, **Authentication solo en EE. UU.**, responsabilidad del cliente sobre los derechos de los interesados
- [Firestore, Best practices](https://firebase.google.com/docs/firestore/best-practices) — elección de ubicación de la base, no almacenar datos sensibles en IDs ni nombres de campo
- [Firestore, Structure data](https://firebase.google.com/docs/firestore/manage-data/structure-data) — las subcolecciones no se borran fácilmente

**Cumplimiento — fuentes secundarias (sin equivalente oficial)**

- [DPO Centre](https://www.dpocentre.com/?p=30268) — principio de limitación del plazo de conservación
- [GDPRLocal](https://gdprlocal.com/?p=131917) — borrado automático al vencer la retención; necesidad del DPA
- [Zoho CRM, Data subject rights](https://help.zoho.com/portal/en/kb/crm-v2-1/security-control/compliance-setting/gdpr/articles/crm-v2-data-subject-rights) — práctica de bloqueo durante el periodo de retención
- [HubSpot, GDPR and CRM](https://blog.hubspot.com/sales/crm-gdpr) — restricción del tratamiento como opción intermedia
- [Kabooly](https://kabooly.pages.dev/blog/gdpr-compliance-crm-uk-businesses) — borrado también en backups y sistemas conectados

**Integraciones (contexto)**

- [HubSpot, Understanding the CRM](https://developers.hubspot.com/docs/guides/api/crm/understanding-the-crm) — Emails, Calls, Meetings, Notes, Tasks, Quotes, Invoices y Orders como objetos nativos

**Nota sobre las fuentes:** la práctica totalidad de las fuentes sobre GDPR aplicado a CRM son blogs de proveedores, no autoridades de protección de datos. El Art. 17 es la única fuente primaria de la sección 4. No hay fuente alguna que respalde la lista de integraciones "imprescindibles" de §1 ni la taxonomía de triggers y acciones de §3.
