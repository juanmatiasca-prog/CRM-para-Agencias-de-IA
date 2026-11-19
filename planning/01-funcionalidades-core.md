# 01 — Funcionalidades núcleo

Este documento fija el catálogo de funcionalidades núcleo del CRM propio para una agencia de IA, priorizado con MoSCoW y derivado de la investigación recogida en `research_notes/CRM para agencias de IA/panorama_plataformas.md` (estado consultado: noviembre de 2026). No es un documento de implementación: no contiene esquemas de Firestore definitivos, reglas de seguridad ni código. Cada afirmación está marcada como dato verificado contra fuente primaria, dato de proveedor interesado, o criterio propio del proyecto.

**Convenciones de marcado usadas en todo el documento:**

| Marca | Significado |
|---|---|
| (sin marca) | Dato citado en las notas con fuente primaria del proveedor (documentación de API o página de pricing oficial). |
| `(fuente interesada)` | Dato procedente de un proveedor que vende la categoría o de una consultora del sector. Útil como señal, no como hecho. |
| `(no verificado)` | Dato de agregador de terceros que las notas marcan explícitamente como pendiente de verificar o contradictorio entre fuentes. |
| `(criterio propio)` / `(inferencia)` | Decisión o deducción de este proyecto, no sostenida directamente por las fuentes. |

---

## Qué separa un CRM genérico de un CRM de agencia

El modelo de datos núcleo es sorprendentemente estable entre plataformas: contacto / empresa / oportunidad con pipeline y etapas / actividad, más propiedades personalizadas, asociaciones y pipelines configurables como primitivas del sistema. Eso lo tienen HubSpot, Pipedrive y Attio por igual. Lo que separa las herramientas no es ese núcleo sino lo que se monta encima: presupuestos recurrentes (retainers), tarifas de coste frente a tarifas de venta, planificación de recursos y facturación.

La formulación corta: **un CRM conoce el precio; un PSA conoce además el coste y la capacidad.** El CRM termina en *closed-won*. El PSA empieza ahí y mide horas vendidas contra horas entregadas, margen por retainer y utilización del equipo `(fuente interesada: Teamwork, que vende PSA)`.

### El mapa de propiedad de registros

Las notas recogen una regla operativa útil: **un dueño por registro, flujo unidireccional** `(fuente interesada: Teamwork)`.

| Sistema | Qué posee |
|---|---|
| CRM | Company / client account, contactos clave, valor y etapa del deal, scope vendido (SOW/propuesta), **horas vendidas por rol**, fee + rate card |
| PSA | **Budget type** (retainer, fixed fee o T&M, construido a partir del fee en closed-won), plan de proyecto y resourcing, **actuals de tiempo y coste**, **margen por retainer** |
| Finanzas | Factura y cobro, alimentados por el tiempo facturable que envía el PSA |

Y los **cinco campos que deben cruzar en closed-won**: client account ID, sold scope, sold hours by role, fee + budget type, start date + account owner. Esta lista es el contrato de integración entre las dos mitades del sistema y, en un build propio, es el único punto de acoplamiento que de verdad hay que diseñar bien `(criterio propio)`.

### El ejemplo numérico del margen perdido

Las notas recogen este ejemplo explícitamente como **fuente de proveedor PSA e ilustrativo, no un dato de campo** `(fuente interesada: Teamwork)`. Se reproduce porque explica el mecanismo, no porque sea un benchmark:

Retainer de **$10.000/mes**, cuenta anual de **$120.000**.

| | Horas/mes | Coste combinado/h | Coste mensual | Margen bruto | Beneficio bruto anual |
|---|---|---|---|---|---|
| **Como se vendió** | 64 h | $70/h | $4.480 | **55,2 %** | $66.240 |
| **Como se entrega** | 88 h | $80/h | $7.040 | **29,6 %** | $35.520 |
| **Brecha** | +24 h | +$10/h | +$2.560 | −25,6 pp | **−$30.720** |

Treinta mil setecientos veinte dólares perdidos en **una sola cuenta**, mientras el CRM sigue mostrando un cliente sano: deal ganado, renovación activa, ninguna señal roja. La brecha no es un fallo de ejecución, es un fallo de instrumentación. Los campos que la harían visible (horas vendidas por rol, coste por hora, horas registradas contra el periodo de retainer) simplemente no existen en un CRM típico, así que la alerta nunca se dispara.

El valor del PSA, según esa misma fuente, es detectar la deriva **en la semana en que ocurre**, para poder tener la conversación con el cliente antes de haber regalado el trabajo. De ahí la regla de diseño de este proyecto: el diferencial no es el informe mensual bonito, es la **alerta semanal de burn** `(criterio propio, derivado de la inferencia ya recogida en las notas)`.

### Las dos consecuencias de arquitectura

1. **Sin `costRate` no hay margen; sin `budgetType` no hay retainer** `(inferencia)`. Dos tarifas por persona (`billRate` y `costRate`) y un `budgetType` ∈ {retainer, fixed_fee, time_and_materials} tienen que existir desde el día uno, aunque el módulo que los explota llegue después. Añadirlos más tarde obliga a reescribir el histórico.
2. **Los objetivos de utilización deben ser configurables, no constantes del producto** `(inferencia)`. Los benchmarks disponibles se contradicen entre sí dentro de la misma fuente: un artículo de Parakeeto de 2023 sitúa la utilización "exitosa" entre 75 % y 90 %, mientras que un deck de webinar con AMI da objetivos de 65 %+ a nivel agencia y 60 %+ a nivel proyecto para productores puros `(fuente interesada: Parakeeto vende servicios de operaciones de agencia)`. Si las propias fuentes del sector discrepan 25 puntos, el número no es un dato del producto sino un ajuste por organización y por rol.

### Vocabulario de métricas de agencia

Nomenclatura estándar del sector que el sistema debería calcular `(fuente interesada: Parakeeto)`:

| Métrica | Definición | Ejemplo citado |
|---|---|---|
| **AGI** (Agency Gross Income) | Ingresos retenidos tras restar pass-through expenses y costes de terceros | $1M de revenue − $50k de pass-through = **$950.000 de AGI** |
| **ABR** (Average Billable Rate) | Revenue medio generado por hora de trabajo de cliente | — |
| **Utilization** | Medida sobre **todo el equipo**, no solo el equipo billable/delivery | Benchmarks contradictorios: 75–90 % vs 65 %+ |
| **Billable Efficiency** | Horas billable estimadas / capacidad bruta | 10.000 h sobre 20.000 de capacidad = **50 %** |
| **Delivery Margin** | (AGI − delivery costs) / AGI; la fuente argumenta medir *delivery hours* en vez de *billable hours* | — |

> Aviso de fiabilidad que las notas dejan por escrito: casi toda la evidencia de esta sección procede de Teamwork (proveedor PSA) y Parakeeto (consultora de operaciones de agencia). **No hay en las notas ningún benchmark independiente y verificable de margen de retainer.** La mención a SPI Research ("Professional Services Maturity Benchmark") apareció citada de segunda mano y las notas indican expresamente que **no debe citarse como dato confirmado**.

---

## Catálogo principal

Escala MoSCoW aplicada a la **v1** del producto. `Won't (v1)` significa decisión consciente de aplazar, no descarte permanente.

| ID | Funcionalidad | Qué hace | Prioridad |
|---|---|---|---|
| F-CORE-01 | Contactos | Registro de persona con identidad única por email, propietario, estado de ciclo de vida y vínculo a empresa | Must |
| F-CORE-02 | Empresas / cuentas | Registro de organización cliente o prospecto, raíz de agregación de deals, proyectos y margen | Must |
| F-CORE-03 | Deals con pipelines y etapas configurables | Oportunidad con valor, moneda, etapa, probabilidad y fecha esperada de cierre; pipelines y etapas como datos, no como código | Must |
| F-CORE-04 | Actividades polimórficas | Llamadas, reuniones, emails, notas y tareas como registros de primera clase asociados a cualquier objeto | Must |
| F-CORE-05 | Esquema de campos como datos | Definición de propiedades por objeto (tipo, opciones, obligatoriedad) almacenada como dato, con mapa de valores por registro | Must |
| F-CORE-06 | Asociaciones entre registros | Vínculos tipados entre objetos (contacto↔empresa, deal↔contacto, actividad↔cualquiera) con etiqueta de rol | Must |
| F-CORE-07 | Rate cards con `billRate` y `costRate` | Tarifa de venta y tarifa de coste por persona y por rol, con vigencia temporal | Must |
| F-CORE-08 | Presupuestos con `budgetType` | Objeto de presupuesto por proyecto con tipo retainer / fixed_fee / T&M, periodo, fee y horas vendidas por rol | Must |
| F-CORE-09 | Handoff automático de closed-won | Al pasar un deal a `won`, crear proyecto y presupuesto copiando los cinco campos del mapa de propiedad | Must |
| F-CORE-10 | Time tracking billable vs non-billable | Registro de tiempo contra proyecto y presupuesto, con marca de facturable y captura de tarifas vigentes | Must |
| F-CORE-11 | Alerta de burn de presupuesto | Comparación programada de horas y coste registrados contra lo vendido en el periodo, con notificación por umbral | Must |
| F-CORE-12 | Reporting de margen por proyecto y cliente | Margen bruto real (fee − coste de delivery) por proyecto, cliente y periodo, comparado contra lo vendido | Must |
| F-CORE-13 | API, webhooks y servidor MCP | Exposición del modelo de datos a agentes y a integraciones, sin límites de crédito ni gating | Must |
| F-CORE-14 | Forecast ponderado de pipeline | `value` × `probability` agrupado por `expectedCloseDate` y etapa | Should |
| F-CORE-15 | Campos derivados denormalizados | `nextActivityId`, `lastActivityId` y contadores de actividades, notas y ficheros mantenidos por función en vez de por query | Should |
| F-CORE-16 | Leads como objeto separado del deal | Entrada previa a la oportunidad, con fuente, etiqueta y conversión explícita a deal | Should |
| F-CORE-17 | Utilización con objetivo configurable | Cálculo de utilización por persona, rol y agencia contra un objetivo ajustable por organización | Should |
| F-CORE-18 | Productos, line items y presupuestos de venta (quotes) | Catálogo de servicios con precio, y líneas de oferta con descuentos, fees e impuestos | Should |
| F-CORE-19 | Planificación de recursos y capacidad | Asignación de personas a proyectos por periodo, con indicador de disponibilidad y detección de sobrerreserva | Should |
| F-CORE-20 | Reconciliación de overage de retainer | Horas excedidas del periodo convertidas en línea de factura o consumidas del banco de horas del periodo siguiente | Should |
| F-CORE-21 | Captura automática de datos desde email, calendario y transcripción | Derivación de contactos, actividades y notas sin tecleo manual | Should |
| F-CORE-22 | Facturación básica y recurrente | Generación de factura desde presupuesto y tiempo facturable, con facturación recurrente para retainers | Could |
| F-CORE-23 | Aprobaciones de timesheet y gasto | Flujo de revisión antes de que las horas y los gastos impacten margen y factura | Could |
| F-CORE-24 | Gestión de gastos y pass-through | Registro de gastos repercutibles y de terceros, base para calcular AGI | Could |
| F-CORE-25 | Portal de cliente | Vista externa con progreso, consumo de retainer y documentos | Could |
| F-CORE-26 | Formularios de intake con lógica condicional | Captura estructurada de peticiones con ramas if/then | Could |
| F-CORE-27 | Actividad fijada (pinned engagement) | Una actividad destacada arriba del registro | Could |
| F-CORE-28 | Permisos granulares, equipos y grupos de visibilidad | Control de acceso por equipo, rol y visibilidad de registro | Could |
| F-CORE-29 | Revenue forecasting y escenarios | Proyección de ingresos y simulación de escenarios de capacidad y contratación | Won't (v1) |
| F-CORE-30 | Cálculo de overhead y subsidiarias múltiples | Imputación de costes indirectos y consolidación multi-entidad y multi-divisa | Won't (v1) |
| F-CORE-31 | Contratos con firma electrónica | Generación de contrato desde propuesta aceptada y e-signature | Won't (v1) |
| F-CORE-32 | Sequences y sincronización completa de email | Secuencias de envío automatizado y sync bidireccional del buzón | Won't (v1) |
| F-CORE-33 | Enrichment de datos de empresa y persona | Enriquecimiento automático con headcount, ARR, funding, teléfono y email | Won't (v1) |
| F-CORE-34 | Órdenes de compra, notas de crédito y facturas programadas | Instrumentos contables accesorios | Won't (v1) |
| F-CORE-35 | Gestión de ausencias y time off | Solicitud y aprobación de vacaciones como insumo de capacidad | Won't (v1) |

**Lógica de corte** `(criterio propio)`: los `Must` son exactamente el CRM clásico más los cuatro elementos sin los cuales la brecha de margen de la sección anterior sigue siendo invisible (coste, tipo de presupuesto, tiempo y alerta), más la superficie de API/MCP que justifica el build para una agencia de IA. Los `Should` son lo que convierte el sistema en operativo semana a semana. Los `Could` dependen de si la agencia factura desde el sistema o desde contabilidad. Los `Won't (v1)` son, casi todos, precisamente lo que los PSA reservan para sus tiers más altos: es la parte cara de construir y la que menos se usa con 3–10 personas.

---

## Detalle por funcionalidad Must

### F-CORE-01 — Contactos

**Qué incluye.** CRUD de personas, búsqueda por email y nombre, vista de registro con timeline de actividades asociadas, propietario asignado y estado de ciclo de vida.

**Campos mínimos.** HubSpot documenta como requeridas (al menos una de) `email`, `firstname`, `lastname`, con **`email` recomendado siempre como identificador único primario**. Recomendadas: `lifecyclestage`, `phone`, `mobilephone`, `fax`, `jobtitle`, `address`, `city`, `state`, `country`, `zip`, `hs_timezone`. En ejemplos de la API aparecen además `company`, `website`, `hs_lead_status`. De sistema y solo lectura: `hs_object_id`, `createdate`, `lastmodifieddate`, `hs_pinned_engagement_id`, `hs_additional_emails`.

Conjunto mínimo propuesto para v1 `(criterio propio, subconjunto del anterior)`: `email` (único), `firstName`, `lastName`, `phone`, `jobTitle`, `lifecycleStage`, `leadStatus`, `ownerId`, `companyId`, `createdAt`, `updatedAt`, `customFields`.

**Errores a evitar.**
- Permitir duplicados por email. El identificador único primario debe estar impuesto desde el inicio; deduplicar un histórico sucio cuesta más que la restricción.
- Hacer obligatorios `firstName` y `lastName` a la vez. La propia referencia de HubSpot acepta cualquiera de los tres campos; un contacto capturado desde un formulario a menudo solo trae email.
- Inventar campos propios donde existe un nombre estándar. Usar el vocabulario de HubSpot reduce la fricción de cualquier importación o integración futura `(criterio propio)`.
- Olvidar `hs_additional_emails` como concepto: una persona con dos direcciones es el caso normal, no la excepción, y resolverlo tarde fuerza una migración.

### F-CORE-02 — Empresas / cuentas

**Qué incluye.** Registro de organización, raíz de agregación sobre la que se cuelgan contactos, deals, proyectos, presupuestos y, en última instancia, el margen por cliente.

**Campos mínimos.** HubSpot `0-2` sugiere `name`, `domain`, `industry`, `ownerId`, más campos personalizados. Pipedrive usa Organizations con `org_id` referenciado desde el deal.

Propuesta v1 `(criterio propio)`: `name`, `domain` (clave natural de deduplicación), `industry`, `ownerId`, `customFields`, más un flag que distinga **cuenta cliente activa** de **prospecto**, porque el reporting de margen solo tiene sentido sobre las primeras.

**Errores a evitar.**
- No tener clave natural de deduplicación. El dominio cumple para la empresa el papel que el email cumple para el contacto.
- Modelar la cuenta cliente y el prospecto como objetos distintos. Es la misma entidad en distinto estado; separarlos duplica el histórico al convertir `(criterio propio)`.
- Dejar el margen colgando solo del proyecto. El dueño de la pregunta "¿este cliente es rentable?" es la empresa, no el proyecto individual.

### F-CORE-03 — Deals con pipelines y etapas configurables

**Qué incluye.** Oportunidad de venta con etapa, valor, probabilidad y fecha esperada de cierre; pipelines y etapas almacenados como datos editables, incluyendo probabilidad por etapa. HubSpot aplica pipelines no solo a deals sino también a tickets, señal de que la primitiva conviene genérica.

**Campos mínimos.** Pipedrive documenta como campos estándar del Deal: `title` (el único obligatorio al crear), `owner_id`, `person_id`, `org_id`, `pipeline_id`, `stage_id`, `value`, `currency`, `status` (open / won / lost / deleted), `probability`, `lost_reason` (solo cuando `status = lost`), `visible_to`, `close_time` / `won_time` / `lost_time`, `expected_close_date`, `is_archived` + `archive_time`, `label_ids`, `channel` + `channel_id`, `origin_id` (solo en creación), `custom_fields`, `is_deleted`.

Añadidos propios imprescindibles para el caso agencia `(inferencia, ya recogida en las notas)`: **`soldHoursByRole`** y **`budgetType`**. Son los dos campos que hacen posible el handoff de F-CORE-09 y, sin ellos, el margen de la sección anterior nunca se puede comparar contra lo vendido.

**Errores a evitar.**
- Codificar las etapas en el frontend. Las etapas son datos; un cambio de proceso comercial no puede requerir un despliegue.
- Omitir `lostReason`. Sin motivo de pérdida estructurado no hay análisis de pipeline posible, y añadirlo después deja un histórico ciego.
- Confundir probabilidad de etapa con probabilidad de deal. Conviene heredar de la etapa por defecto y permitir sobreescritura explícita en el registro `(criterio propio)`.
- Tratar `won` como un cambio de estado cosmético. Es el evento de dominio más importante del sistema (ver F-CORE-09).
- No separar retainers de deals puntuales. Las notas señalan que conviene trackearlos aparte para detectar churn de renovación `(fuente interesada: Teamwork)`.

### F-CORE-04 — Actividades polimórficas

**Qué incluye.** Un registro único para llamadas, comunicaciones (SMS, LinkedIn, WhatsApp), emails, reuniones, notas, correo postal y tareas, diferenciado por `type` y asociable a cualquier objeto. HubSpot modela cada uno de estos como objeto de primera clase (`Calls 0-48`, `Communications 0-18`, `Emails 0-49`, `Meetings 0-47`, `Notes 0-46`, `Postal mail 0-116`, `Tasks 0-27`); Pipedrive los unifica en Activities con Activity types y Activity fields como entidades propias.

**Campos mínimos** `(criterio propio, siguiendo el patrón Pipedrive por ser el más económico de implementar)`: `type`, `subject`, `dueAt`, `completedAt`, `ownerId`, `refs[]` (asociaciones polimórficas), `body`, `createdAt`.

**Errores a evitar.**
- Crear una colección por tipo de actividad. Multiplica el coste del timeline, que es la vista más usada del producto `(criterio propio)`.
- Hacer los tipos de actividad un enum de código. Pipedrive los expone como entidad editable precisamente porque cada organización inventa los suyos.
- Calcular "próxima actividad" por query en cada render. Ver F-CORE-15.
- No distinguir `dueAt` de `completedAt`. Una tarea vencida y una tarea hecha tarde son señales distintas.

### F-CORE-05 — Esquema de campos como datos

**Qué incluye.** Definición de propiedades por tipo de objeto (nombre, tipo, opciones, obligatoriedad, orden) almacenada como dato, con un mapa de valores personalizados en cada registro. Es el patrón universal: HubSpot lo expone vía Properties API versionada por fecha (`/crm/properties/2026-09/{objectTypeId}`, por ejemplo `/0-1` para contactos) y los objetos personalizados vía `/crm-object-schemas/2026-09/schemas`; Pipedrive separa explícitamente "field definition" de "value", con endpoints independientes de Lead fields, Activity fields, Product fields y Project fields; Attio modela todo el CRM como objects configurables.

Las notas lo califican como **la decisión de arquitectura más consecuente** del sistema: permite que el producto evolucione sin migraciones de esquema `(inferencia)`.

**Campos mínimos de la definición** `(criterio propio)`: `objectType`, `key`, `label`, `dataType`, `options[]` (para enumerados), `required`, `order`, `isSystem`, `createdAt`.

**Errores a evitar.**
- Usar hashes opacos como claves de campo. Pipedrive expone `custom_fields` con **claves que son hashes de 40 caracteres, no nombres legibles**; es un lastre de DX citado en las propias notas y no hay razón para replicarlo.
- No versionar la definición de campos. HubSpot versiona la Properties API por fecha; sin versión, cambiar el tipo de un campo rompe en silencio todo lo construido encima.
- Permitir borrar una definición con valores vivos. Debe archivarse, no eliminarse `(criterio propio)`.
- Tratar el esquema flexible como lujo diferible. Es gratis en el stack elegido y es un recurso escaso y caro en SaaS: Productive da **5 custom fields** en Essential y **15 en Professional**; Pipedrive Ultimate topa en **500 custom fields**. Es una de las ventajas estructurales reales del build.

### F-CORE-06 — Asociaciones entre registros

**Qué incluye.** Vínculos tipados entre objetos, con **tipo/etiqueta de asociación** que describa el rol del vínculo. HubSpot lo trata como primitiva transversal, con association types/labels, límites, endpoints de detalle y de esquema; las asociaciones se crean en el mismo payload de creación del registro, mediante un objeto `associations` que lleva el `id` destino y un `types` con `associationCategory` + `associationTypeId`.

**Campos mínimos** `(criterio propio)`: `fromObjectType` + `fromId`, `toObjectType` + `toId`, `associationType` (etiqueta de rol: decisor, firmante, facturación, sponsor técnico…), `createdAt`.

**Errores a evitar.**
- Reducir la relación contacto↔empresa a un `companyId` plano. Un contacto puede ser decisor en una cuenta y referente en otra.
- No permitir crear la asociación en el mismo momento que el registro. Obliga a dos escrituras y abre la puerta a registros huérfanos.
- Olvidar las etiquetas de rol. Sin ellas no se puede responder "¿quién firma en esta cuenta?", que es la pregunta operativa real.

### F-CORE-07 — Rate cards con `billRate` y `costRate`

**Qué incluye.** Tarifa de venta y tarifa de coste por persona y por rol, con **vigencia temporal**, de modo que un cambio de tarifa no reescriba el margen histórico. Teamwork nombra explícitamente "billable rates por persona" junto a "custom cost rates" dentro de su bloque de "Cost and profitability management" `(fuente interesada)`; Productive reserva **rate cards** para el plan Professional y el **overhead calculation** para Ultimate.

**Campos mínimos** `(criterio propio, consolidando lo observado)`: `subjectType` (person | role), `subjectId`, `billRate`, `costRate`, `currency`, `validFrom`, `validTo`, `createdAt`.

**Errores a evitar.**
- Guardar una sola tarifa. **Sin `costRate` no hay margen**, y es exactamente el campo que los CRM genéricos no tienen.
- No fechar la vigencia. Una subida de sueldo recalcularía retroactivamente el margen de proyectos cerrados.
- Resolver la tarifa en el momento del informe en vez de congelarla en la entrada de tiempo. Ver F-CORE-10.
- Modelar solo tarifa por persona. El deal se vende en **horas por rol**, no por nombre; hacen falta ambos niveles con precedencia definida.

### F-CORE-08 — Presupuestos con `budgetType`

**Qué incluye.** Objeto de presupuesto colgado del proyecto, con tipo, periodo, fee, horas vendidas por rol y tratamiento del remanente. Es el mecanismo que todos los PSA nombran de forma distinta y gatean alto: Productive lo llama **Recurring budgets** y lo reserva a Professional+; Teamwork escala de "Time budgets" a "Time, cost and fixed-fee budgets" y de "Time retainers" a "Time and cost retainers"; Scoro lo nombra **Retainer management** dentro de su app Deliver; Accelo menciona correr "fixed-fee projects and ongoing retainers side by side".

**Campos mínimos** `(criterio propio, sobre el esquema ya esbozado en las notas)`: `projectId`, `budgetType` ∈ {retainer, fixed_fee, time_and_materials}, `periodStart`, `periodEnd`, `recurrence` (para retainers), `fee`, `currency`, `soldHoursByRole` (mapa rol → horas), `rolloverPolicy` (si las horas no consumidas pasan al periodo siguiente), `status`.

**Errores a evitar.**
- Modelar el retainer como una suma de proyectos mensuales. Es un presupuesto recurrente con periodos; la pregunta "¿cuánto llevamos consumido este mes?" exige periodo explícito.
- Guardar solo el fee total y no las horas vendidas por rol. Es la mitad izquierda de la tabla del margen; sin ella no hay comparación posible.
- Omitir la política de rollover. Decide si el cliente acumula horas no usadas, y es fuente directa de conflicto comercial si queda implícita.
- Presuponer que un proyecto tiene un solo presupuesto. Un cliente con retainer que encarga un proyecto puntual es el caso habitual en agencia `(criterio propio)`.

### F-CORE-09 — Handoff automático de closed-won

**Qué incluye.** Disparador sobre el cambio de `status` del deal a `won` que crea proyecto y presupuesto copiando los **cinco campos** del mapa de propiedad: client account ID, sold scope, sold hours by role, fee + budget type, start date + account owner. Las notas lo señalan como **probablemente la función de mayor ROI de todo el sistema** `(inferencia)`.

**Campos mínimos de la operación** `(criterio propio)`: referencia al deal origen (idempotencia), `clientAccountId`, `soldScope`, `soldHoursByRole`, `fee` + `budgetType`, `startDate`, `accountOwnerId`, `createdFromDealId`.

**Errores a evitar.**
- No hacer la operación idempotente. Un deal que pasa a `won`, se revierte y se vuelve a ganar no puede generar dos proyectos.
- Dejar el flujo bidireccional. La regla es **un dueño por registro, flujo unidireccional**: lo vendido lo posee el CRM y no se edita desde delivery; los actuals los posee el PSA y no se editan desde el deal.
- Copiar el fee sin el `budgetType`. Son el mismo campo funcional: el fee sin tipo no permite construir el presupuesto.
- Pedir al usuario que rellene los cinco campos en el momento del handoff. Deben ser obligatorios **antes** de poder marcar el deal como ganado, o el handoff degenera en formulario que nadie completa `(criterio propio)`.

### F-CORE-10 — Time tracking billable vs non-billable

**Qué incluye.** Entradas de tiempo contra proyecto y presupuesto, con marca de facturable y captura de las tarifas vigentes en el momento del registro. Es el módulo que **todas** las plataformas PSA incluyen incluso en sus tiers bajos: Productive lo da en Essential; Scoro lo nombra "Time tracker / Timesheets / Billable time / Labor cost"; Teamwork lo escalona por plan; Bonsai hace que el tiempo registrado alimente directamente la factura.

**Campos mínimos** `(criterio propio, sobre el esquema de las notas)`: `userId`, `projectId`, `budgetId`, `date`, `minutes`, `billable` (bool), `billRate` y `costRate` **congelados en el momento del registro**, `roleId`, `notes`, `approvedAt`.

**Errores a evitar.**
- No congelar las tarifas en la entrada. Si el margen se recalcula con la tarifa actual, el histórico cambia cada vez que alguien sube de sueldo.
- Registrar solo horas facturables. La utilización debe medirse sobre **todo el equipo** y sobre el tiempo total, no solo el facturable `(fuente interesada: Parakeeto)`.
- No ligar la entrada al presupuesto, solo al proyecto. Un proyecto con retainer y extra puntual necesita saber contra qué bolsa se consume.
- Dejar la entrada editable indefinidamente. Bonsai usa *timesheet locking* por esta razón; sin bloqueo tras facturar, los importes cobrados y los registrados divergen.

### F-CORE-11 — Alerta de burn de presupuesto

**Qué incluye.** Tarea programada que compara horas y coste registrados contra lo vendido en el periodo del presupuesto y notifica al superar umbrales. Teamwork lo nombra "budget burn" con *budget notifications* que alertan según sube el consumo `(fuente interesada)`. Las notas lo elevan a diferencial principal: el valor está en detectar la deriva **en la semana en que ocurre**, no en el informe de cierre de mes.

**Campos mínimos** `(criterio propio)`: `budgetId`, `periodo evaluado`, `horasConsumidas` por rol, `costeAcumulado`, `porcentajeConsumido`, `umbralesConfigurados[]` (p. ej. 50 / 75 / 90 / 100 %), `destinatarios`, `ultimaNotificacionEnviada`.

**Errores a evitar.**
- Notificar solo al 100 %. Al llegar al 100 % el margen ya se perdió; el objetivo es la conversación con el cliente **antes**.
- Reenviar la misma alerta cada ejecución. Hay que registrar el último umbral notificado por periodo para no generar ruido que el equipo aprenda a ignorar `(criterio propio)`.
- Alertar solo sobre horas. La brecha del ejemplo tiene dos componentes: **más horas (64→88) y hora más cara ($70→$80)**. Vigilar solo el recuento de horas pierde la mitad del problema.
- Disparar la alerta solo al account manager. La conversación con cliente la tiene una persona, pero el coste lo genera otra `(criterio propio)`.

### F-CORE-12 — Reporting de margen por proyecto y cliente

**Qué incluye.** Margen bruto real por proyecto, cliente y periodo (fee menos coste de delivery), contrastado con el margen vendido. Es exactamente lo que los PSA ponen detrás de su paywall más alto: Teamwork sitúa "profit by project/client + forecasts" en Optimize; Scoro reserva **WIP report** y **Quoted vs actuals** al plan End-to-end vía el add-on Advanced Financials; Productive reserva revenue forecasting a Ultimate. Las notas advierten de que **ésta es la parte cara de construir, no los contactos** `(inferencia)`.

**Campos mínimos del cálculo** `(criterio propio)`: por periodo y presupuesto — `feeReconocido`, `horasVendidasPorRol`, `horasRegistradasPorRol`, `costeReal` (Σ minutos × `costRate` congelado), `margenBrutoReal`, `margenBrutoVendido`, `desviacionEnPuntos`, y opcionalmente `passThroughExpenses` para derivar AGI cuando exista F-CORE-24.

**Errores a evitar.**
- Reportar solo el margen real sin el vendido al lado. La métrica accionable es la **brecha**, no el valor absoluto; es lo que el formato "Quoted vs actuals" de Scoro codifica.
- Mezclar revenue y AGI. El AGI descuenta pass-through y costes de terceros; en una agencia que subcontrata, la diferencia es material.
- Calcular todo en tiempo de consulta. Los agregados por periodo conviene mantenerlos precalculados, igual que los contadores de F-CORE-15 `(criterio propio)`.
- Presentarlo como informe mensual. Debe ser consultable en cualquier momento del periodo, con el dato parcial marcado como parcial.

### F-CORE-13 — API, webhooks y servidor MCP

**Qué incluye.** Acceso programático completo al modelo de datos, eventos salientes y un servidor MCP que permita a agentes operar el CRM. Attio es el caso de referencia: ofrece **API, webhooks y MCP server en todos los planes, incluido el gratuito**, y monetiza en cambio objetos, registros, reports y SQL (SQL en workflows y vía API/MCP solo en Ultra, a €850/mes anual). Accelo lista "AI & MCP" como área de producto de primer nivel; Productive marca "Agents and Connectors" en Ultimate.

Las notas son explícitas: para una agencia de IA, el servidor MCP del propio CRM **pasó de diferencial a mesa de juego**, es barato de construir y es la feature que más encaja con el posicionamiento `(inferencia)`.

**Campos mínimos** `(criterio propio)`: superficie de lectura y escritura sobre `contacts`, `companies`, `deals`, `activities` y `budgets`; autenticación por clave con ámbito; registro de auditoría por llamada con actor, objeto y operación; webhooks con evento, payload y reintento.

**Errores a evitar.**
- Exponer MCP sin registro de auditoría. Un agente que escribe en el CRM sin traza convierte cualquier error en un misterio forense.
- Replicar el modelo de monetización ajeno. Attio **monetiza el modelo de datos, no el acceso**; en un sistema propio el coste marginal de objetos, registros, reports y acceso cae a cero, y ése es el argumento del build.
- Construir el MCP sobre una capa distinta de la que usa la aplicación. Dos caminos a los datos equivalen a dos juegos de reglas de validación que divergen `(criterio propio)`.
- Dar a los agentes las mismas credenciales que a las personas. Los permisos de agente deben ser un ámbito propio y restringible.

---

## Detalle por funcionalidad Should

### F-CORE-14 — Forecast ponderado de pipeline

**Qué incluye.** Suma de `value` × `probability` agrupada por `expectedCloseDate`, pipeline y etapa. Las notas identifican `probability` + `expected_close_date` + `value` de Pipedrive como **el triplete mínimo para cualquier forecast ponderado**; HubSpot lo resuelve vía propiedades de deal y probabilidad por etapa `(inferencia)`.

**Campos mínimos.** Ninguno nuevo: se construye sobre F-CORE-03. Requiere únicamente que la probabilidad por etapa esté poblada y que `expectedCloseDate` sea obligatorio al pasar de la primera etapa `(criterio propio)`.

**Errores a evitar.**
- Dejar `expectedCloseDate` opcional. Un deal sin fecha no entra en ningún periodo y desaparece del forecast en silencio.
- Confundir forecast de ventas con forecast de ingresos. Un retainer ganado genera ingreso recurrente que el pipeline ya no refleja; son dos cálculos distintos.
- Construir escenarios y proyección de capacidad en v1: eso es F-CORE-29, declarado `Won't (v1)`.

### F-CORE-15 — Campos derivados denormalizados

**Qué incluye.** Mantenimiento automático de agregados en el registro padre. Pipedrive los expone como campos derivados de solo lectura que se piden con `include_fields`: `next_activity_id`, `last_activity_id`, `products_count`, `files_count`, `notes_count`, `followers_count`, `activities_count`, `participants_count`. Las notas señalan que son exactamente el tipo de agregado que conviene mantener denormalizado por función en vez de calcular por query `(inferencia)`.

"Next activity" como campo del deal, y no solo como lista, es el patrón de UX que sostiene toda la metodología de *activity-based selling* de Pipedrive, y es trivial de replicar.

**Campos mínimos** `(criterio propio)`: en deal y contacto — `nextActivityId`, `lastActivityId`, `activitiesCount`, `notesCount`, `filesCount`.

**Errores a evitar.**
- Dejar los contadores editables desde la API. Son derivados; Pipedrive los marca de solo lectura por este motivo.
- No reconstruirlos. Hace falta un procedimiento de recálculo, porque cualquier fallo en el disparador los desincroniza para siempre.
- Denormalizar más de lo que se lee. Cada agregado es una escritura extra; solo valen los que aparecen en una vista de lista `(criterio propio)`.

### F-CORE-16 — Leads como objeto separado del deal

**Qué incluye.** Entrada previa a la oportunidad, con fuente y etiqueta, y conversión explícita a deal. Los dos grandes lo separan: HubSpot tiene `Leads 0-136` como objeto propio, y Pipedrive tiene Leads con **Lead fields, Lead labels y Lead sources como entidades independientes**, con límites de plan expresados conjuntamente como "leads + deals" (2.500/usuario en Lite, 5.000/usuario en Growth, 15.000/empresa en Premium).

**Campos mínimos** `(criterio propio, siguiendo Pipedrive)`: `title`, `personId`, `orgId`, `ownerId`, `sourceId`, `labelIds`, `value` estimado, `status`, `convertedToDealId`, `createdAt`.

**Errores a evitar.**
- Meter los leads en el mismo pipeline que los deals. Ensucian el forecast con oportunidades que aún no lo son.
- Hacer `source` un texto libre. Pipedrive lo modela como entidad precisamente para poder agrupar por canal de adquisición.
- No registrar la conversión. Sin `convertedToDealId` no hay tasa de conversión lead→deal, que es la única métrica que justifica el objeto.

### F-CORE-17 — Utilización con objetivo configurable

**Qué incluye.** Cálculo de utilización por persona, rol y agencia, contra un objetivo **ajustable por organización y por rol**. Es feature gateada en todas las plataformas revisadas: Teamwork da "utilization reports" en Accelerate y "billable utilization targets" en Optimize; Scoro la pone en su app Resource.

**Campos mínimos** `(criterio propio)`: `capacidadBruta` por persona y periodo, `horasRegistradas` totales y facturables, `objetivoUtilizacion` por rol y por organización, `periodo`.

**Errores a evitar.**
- Fijar el objetivo como constante del producto. Las fuentes del propio sector se contradicen entre 65 % y 75–90 %; es un parámetro, no un dato.
- Medir solo sobre el equipo de delivery. Parakeeto insiste en medir sobre **todo el equipo** `(fuente interesada)`.
- Mezclar utilización con *billable efficiency*. Son métricas distintas: la segunda es horas billable estimadas / capacidad bruta (ejemplo citado: 10.000 sobre 20.000 = 50 %).
- Usar utilización como métrica de desempeño individual sin contexto de capacidad. Lleva a inflar registros de tiempo y envenena el dato de margen `(criterio propio)`.

### F-CORE-18 — Productos, line items y presupuestos de venta

**Qué incluye.** Catálogo de servicios con precio y líneas de oferta. Está en las dos referencias: HubSpot con `Products 0-7`, `Line items 0-8`, `Discounts 0-84`, `Fees 0-85`, `Taxes 0-86` y `Quotes 0-14`; Pipedrive con Products, Product fields y Deal products. Scoro lo nombra "Quote & budget builder" y "Quote templates" dentro de su app Estimate, junto a "Cost & margin planning".

**Campos mínimos** `(criterio propio)`: producto — `name`, `sku`, `unitPrice`, `currency`, `defaultRoleId`, `unitCost` estimado. Línea — `quoteId`, `productId`, `quantity`, `unitPrice`, `discount`, `tax`, `total`. Quote — `dealId`, `status`, `validUntil`, `total`.

**Errores a evitar.**
- Construir el quote sin coste estimado por línea. Scoro empareja deliberadamente "Cost & margin planning" con el quote builder: el margen se planifica al cotizar, no al facturar.
- Tratar descuentos, fees e impuestos como campos escalares del quote. HubSpot los modela como objetos de línea propios porque conviven varios en la misma oferta.
- No derivar `soldHoursByRole` del quote. Si el presupuesto de venta ya descompone por rol, el handoff de F-CORE-09 se rellena solo `(criterio propio)`.

### F-CORE-19 — Planificación de recursos y capacidad

**Qué incluye.** Asignación de personas a proyectos por periodo con indicador de disponibilidad. Scoro lo descompone en "Planner, Bookings, Availability indicators, Utilization report"; Teamwork escala de "workloads por equipo y rol" a "availability, skills, auto-assign"; Productive lo llama "Resource planning" y lo incluye ya en Essential; Accelo lo nombra "Resourcing & Capacity Planning". Teamwork añade un patrón concreto: **Tentative Projects** que reservan capacidad por rol mostrando las asignaciones existentes para evitar sobrerreserva `(fuente interesada)`.

**Campos mínimos** `(criterio propio)`: `userId`, `projectId`, `roleId`, `periodStart`, `periodEnd`, `horasAsignadas`, `tentative` (bool), `capacidadSemanal` por persona.

**Errores a evitar.**
- Planificar solo sobre proyectos confirmados. El patrón de reserva tentativa existe porque el deal en etapa avanzada ya compromete capacidad real.
- No contrastar asignación contra capacidad. Un planner que acepta 60 horas semanales por persona no es un planner.
- Añadir skills y auto-assign en v1. Incluso Teamwork los reserva a su tier alto; son refinamientos sobre un planner que primero tiene que existir `(criterio propio)`.

### F-CORE-20 — Reconciliación de overage de retainer

**Qué incluye.** Conversión automática de las horas excedidas del periodo en línea de factura o en consumo del banco de horas del periodo siguiente, según la política de rollover del presupuesto. Las notas lo identifican como **feature concreta y poco cubierta en el mercado**: una reseña señala que en Scoro la facturación programada es un add-on de pago y **no se auto-ajusta a los overages** del retainer `(fuente interesada: Productive, competidor directo de Scoro, en un artículo de "alternativas a Scoro")`.

**Campos mínimos** `(criterio propio)`: `budgetId`, `periodo`, `horasVendidas`, `horasConsumidas`, `overageHoras`, `overagePolicy` ∈ {facturar, rollover, absorber}, `overageRate`, `resultadoAplicado`, `aprobadoPor`.

**Errores a evitar.**
- Automatizar la facturación del overage sin aprobación humana. El exceso es una conversación comercial antes que un asiento contable.
- No registrar la decisión. Si el overage se absorbe, eso es coste de la agencia y debe aparecer en el margen, no desvanecerse.
- Aplicar la misma política a todos los clientes. El rollover suele estar negociado contrato a contrato.

### F-CORE-21 — Captura automática de datos desde email, calendario y transcripción

**Qué incluye.** Derivación de contactos, actividades y notas desde fuentes existentes, sin tecleo. Las notas lo elevan a regla de diseño: "bloat" y "manual data entry" son las dos quejas estructurales sobre los CRM, y **toda captura de datos que pueda derivarse de un email, calendario o transcripción no debería teclearse** — señalando que ahí una agencia de IA tiene ventaja estructural real frente a los incumbentes `(inferencia)`. Attio reserva **call intelligence a Pro+** y escalona el email sync (solo asuntos y metadatos en Free, completo workspace-wide en Plus, completo por persona y registro en Pro+), lo que confirma que el mercado lo considera caro.

**Campos mínimos** `(criterio propio)`: en cada registro derivado — `source` (email | calendar | transcript | manual), `sourceRef`, `confidence`, `reviewedBy`, `reviewedAt`.

**Errores a evitar.**
- Escribir directamente en el CRM sin revisión. Todo dato derivado necesita procedencia y, por encima de cierto impacto, confirmación humana.
- No guardar `sourceRef`. Sin puntero al origen no se puede auditar una extracción dudosa.
- Empezar por la transcripción. El calendario y el email dan más cobertura con menos complejidad `(criterio propio)`.
- Ignorar las implicaciones de privacidad de sincronizar buzones completos. Attio escalona precisamente el alcance del sync (metadatos vs contenido completo).

---

## Lo que está detrás de paywall en el mercado (= lo que de verdad vale)

El paywall es el mejor indicador de qué features el mercado considera valiosas. El patrón es consistente: **lo básico (contactos, deals, pipeline, tareas, time tracking) es barato o gratis; lo que se cobra caro es automatización, forecasting y rentabilidad, custom objects y campos, aprobaciones, permisos granulares y reporting avanzado.**

### Ranking de valor percibido

Las notas destilan la lista de lo gateado en al menos 3 de 4 plataformas PSA, y la presentan como **prácticamente la hoja de ruta de un CRM propio ordenada por valor percibido** `(inferencia)`:

| # | Capacidad gateada | ID equivalente en este catálogo |
|---|---|---|
| 1 | Rentabilidad por proyecto / cliente | F-CORE-12 |
| 2 | Forecasting de ingresos | F-CORE-29 (`Won't v1`) |
| 3 | Presupuestos recurrentes / retainers con coste además de tiempo | F-CORE-08 |
| 4 | Aprobaciones (timesheets, gastos, tiempo facturable) | F-CORE-23 |
| 5 | Rate cards y cost rates | F-CORE-07 |
| 6 | Custom fields más allá de un puñado | F-CORE-05 |
| 7 | Reporting avanzado con pivot y agrupación | F-CORE-12 |
| 8 | Permisos granulares, teams y grupos de visibilidad | F-CORE-28 |
| 9 | Webhooks y automatización | F-CORE-13 |

### Precios y gating verificados

**Productive.io** — Essential ~$10/usuario/mes; Professional ~$25-29/usuario/mes; Ultimate a medida. *Las notas advierten de que la propia página muestra totales inconsistentes: "$90/month for 10 users" en Essential y "$240/month for 10 users" en Professional, que no cuadran con el precio unitario anunciado — pendiente de verificar.*

| Tier | Qué desbloquea |
|---|---|
| Essential | Budgeting, resource planning, project & task management, docs, time tracking, expense management, reporting, time off management, **5 custom fields a nivel cuenta**, acceso API, AI Assistant |
| Professional | Integraciones HRIS e invoicing, **recurring budgets (retainers)**, teams, advanced task management, advanced reports (grouping, pivoting, currency conversion), **15 custom fields**, billable time approvals, expense approvals, **rate cards**, aprobación de vacaciones |
| Ultimate | **Revenue forecasting**, **Scenario Builder**, multiple subsidiaries, integración HubSpot, advanced time tracking, advanced custom fields, **overhead calculation**, entrega programada de informes, SSO/2FA obligatorio, **webhooks** |

**Scoro** — venta por combinaciones de apps, **mínimo 5 asientos en todas**, prueba de 14 días sin tarjeta, descuento anual del 13-17 %.

| Combinación | Precio | Apps incluidas |
|---|---|---|
| Time-billing | €15 / $17 / £13 | Track + Invoice |
| Projects & Resources | €25 / $29 / £22 | Do, Deliver, Track, Resource |
| Quote to Cash | €25 / $29 / £22 | Estimate, Deliver, Track, Invoice |
| **End-to-end** | **€52 / $57 / £43** | Sell, Estimate, Do, Deliver, Track, Resource, Spend, Invoice + add-ons Advanced Work y Advanced Financials |

Detrás del paywall más alto: **WIP report** y **Quoted vs actuals**, solo en End-to-end vía Advanced Financials. "Orders & contracts" es un extra de pago.

**Teamwork.com** — Free ($0, máx. 5 usuarios); **Basics $9,99/usuario/mes anual** ($13,99 mensual, mínimo 3 usuarios); **Accelerate $24,99/usuario/mes anual** ($29,99 mensual, mínimo 5); Optimize y Enterprise a medida.

| Tier | Qué desbloquea |
|---|---|
| Free / Basics | **No tienen** facturación, presupuestos, retainers, resource scheduling, utilización ni profitability. Project templates: 2 en Free, ilimitados desde Basics. Client users desde Basics |
| Accelerate | Timesheets + recordatorios, basic invoices, **time budgets**, **time retainers**, workloads por equipo y rol, **utilization reports**, intake forms con if/then |
| Optimize | Timesheet approvals, facturación con margen/impuestos/descuentos, **time+cost+fixed-fee budgets**, **time and cost retainers**, availability/skills/auto-assign, **billable utilization targets**, **profit by project/client + forecasts** |

**Attio** — precio por **workspace** + usuarios adicionales, no puro por asiento. Free €0 hasta 3 usuarios; Plus €35/mes anual (€45 mensual) con 1 usuario incluido y €31/usuario adicional anual; Pro €85/mes anual (€110 mensual), 1 usuario incluido, €74/adicional; **Ultra €850/mes solo anual**, 5 usuarios incluidos, €167/adicional.

Gating, por ser el más instructivo del conjunto:

| Dimensión | Free | Plus | Pro | Ultra |
|---|---|---|---|---|
| Objetos | 3 | 5 | 12 (extras facturados aparte) | Ilimitados |
| Custom objects | — | — | **Sí** | Sí |
| Lists | Ninguna | Privadas | Privadas + hasta 10 de equipo | Ilimitadas |
| Workflows | Sí | Sí | Sí | Sí + **SQL en workflows** |
| Reports | 3 | 15 | 100 | Ilimitados |
| Tipos de report | Insights | +funnels, segments | +targets, trends | Todos |
| Call intelligence | — | — | **Sí** | Sí |
| Sequences | — | — | **Sí** | Sí |
| **API, webhooks, MCP server** | **Sí** | **Sí** | **Sí** | Sí (+SQL vía API/MCP) |
| Email sync | Asuntos y metadatos | Completo workspace-wide | Completo por persona/registro | Ídem |
| Emails enviados / usuario / mes | 200 | 1.000 | Ilimitados | Ilimitados |
| Registros | 50.000 | 250.000 | 1.000.000 | 3.000.000 |
| SSO | — | — | Add-on Governance €25/usuario/mes anual | Incluido |

Enrichment escalonado: people + core company profile → +headcount y ARR → +funding. Los AI agents están en todos los planes, medidos con "Ask Attio credits per user": **100 / 500 / 1.000 / 2.500** según plan.

**Lectura de Attio** `(inferencia)`: regala API, webhooks y MCP incluso en el plan gratuito y monetiza **objetos, registros, reports y SQL**. Es decir, **monetiza el modelo de datos, no el acceso**. Replicar eso en propio significa que el coste marginal de esas cuatro dimensiones cae a cero.

**HubSpot Sales Hub** — Free: $0, hasta 2 usuarios, **sin pipelines**, sin workflows de automatización de ventas, 1 link de reunión con marca HubSpot, 3 snippets, 3 plantillas de email, sin calling, sin Goals, reporting limitado a 10 dashboards × 50 informes. Starter: desde $7/asiento/mes con pago anual anticipado (promocional), $10 mes a mes, **precio estándar $20/asiento/mes**; añade hasta 15 pipelines, hasta 50 workflows con triggers y acciones restringidos, 500 minutos de llamada + 1 número, 1.000 meeting links sin marca, hasta 5.000 snippets y 10.000 plantillas, 30 dashboards × 50 informes, Goals limitado.

*Las notas advierten de que la página de pricing de CRM de HubSpot **no cubre Professional ni Enterprise** ni documenta ahí el gating de custom properties, quotes, forecasting, sequences, playbooks o custom objects.*

**Pipedrive** — estructura de 4 planes (Lite, Growth, Premium, Ultimate) introducida en 2025, reemplazando los 5 anteriores (Essential, Advanced, Professional, Power, Enterprise). **Los nombres antiguos siguen apareciendo en muchas comparativas de terceros; están deprecados.**

Precios `(no verificado — las notas indican que la página oficial devolvió HTTP 403 a la consulta y que los agregadores se contradicen)`: por asiento/mes con facturación anual, Lite $14, Growth $39, Premium **$49 o $59 según la fuente**, Ultimate $79; mensual $24/$49/$79/$99. Capterra da "desde $19/usuario/mes", que las notas marcan como outlier.

Límites documentados **por el propio Pipedrive** (estos sí son fuente primaria): Lite 2.500 leads+deals por usuario; Growth 5.000 por usuario, 50 reports, 3 pasos if/else por automatización; Premium 15.000 leads+deals por empresa, 250 reports/usuario, **150 automatizaciones activas**, 10 pasos if/else, 3 email syncs/usuario, 15 teams, 15 grupos de visibilidad, 15 permission sets, 25 sequences, 150.000 tokens API; Ultimate **500 custom fields**, 500 reports/usuario, 25 teams, 25 grupos de visibilidad, 25 permission sets.

Features por tier: Lite = leads/calendario/pipeline + creación de informes con IA + 500 integraciones; Growth añade sync completo de email con tracking y plantillas, automatizaciones y sequences, subscription y forecast reports, meeting scheduler; Premium añade **LeadBooster**, **AI deal scoring**, enriquecimiento de empresa, **contratos y e-signature**, **projects**, team inbox, custom scoring; Ultimate añade seguridad reforzada, enriquecimiento de teléfono/email, límites maximizados y sandbox.

**Accelo** — **no publica precios**: "basado en el tamaño del equipo y objetivos de crecimiento", solo cotización a medida. No hay comparación de coste posible.

**Otros proveedores** `(no verificado — las notas marcan estos datos como procedentes íntegramente de agregadores de terceros, con fechas entre marzo y octubre de 2026 y discrepancias notables entre ellos; no usar sin verificar en la web del proveedor)`:

| Producto | Precio citado por agregadores |
|---|---|
| Zoho CRM | Anual: Standard $14, Professional $23, Enterprise $40, Ultimate $52 por usuario/mes; plan gratuito hasta 3 usuarios y 5.000 registros |
| Copper | Capterra: $29 / $69 / $134 por usuario/mes, sin plan gratuito; otra fuente: desde $23/usuario/mes anual ($29 mensual) |
| Monday CRM | Basic $18, Standard $25 por usuario/mes, **mínimo 3 asientos**; los rangos varían mucho entre fuentes ($12-28 vs $18-41) |
| Insightly | $0-99/usuario/mes en 4 planes, tier gratuito hasta 2 usuarios |
| Capsule | Starter desde $18/usuario/mes anual |
| folk | Entrada de pago $24/usuario/mes (Standard, anual, dato de junio 2026) |

Las notas registran además que **no se pudo verificar nada sobre ClickUp** (ni precios ni features de su módulo CRM) en esa ronda.

### Qué implica todo esto para el build

- **El cálculo de coste puro no justifica el build a escala pequeña** `(inferencia)`. Con los precios verificados, Scoro End-to-end a $57/usuario/mes con mínimo 5 asientos, o Productive Professional a $25-29/usuario/mes, dan para un equipo de 10 entre **$3.000 y $6.800/año**. A ese nivel la justificación tiene que ser encaje de modelo de datos y propiedad del flujo, no ahorro.
- **La justificación defendible** `(inferencia)` es triple: (a) el CRM como producto demostrable ante clientes; (b) integrar los propios agentes en el núcleo del dato en vez de a través de APIs de terceros con límites de crédito — Attio cobra "Ask Attio credits" por usuario; (c) el modelo de datos específico del negocio, porque **los proyectos de IA tienen entregables, modelos, costes de inferencia y consumo que ningún PSA revisado modela**.
- **Los mínimos de asientos son un impuesto fijo sobre agencias pequeñas** `(inferencia)`: 5 en Scoro, 3-5 en Teamwork, 3 en Monday. Para un equipo de 3-6 personas distorsionan mucho el cálculo.
- **El riesgo real del build no es el CRUD** `(inferencia)`: lo que se subestima es la facturación, los permisos y los informes. Que todos los PSA revisados pongan *profitability reporting* y *forecasting* en sus tiers más altos es la señal de dónde está el coste de construcción.
- El contrapunto honesto: las notas recogen que tanto Zendesk como Salesforce argumentan en contra del build, señalando mantenimiento, time-to-market, gestión de datos y coste de integraciones `(fuente interesada: ambos venden CRM)`. Y que la cifra de contraste más citada — HubSpot Professional a $90/usuario/mes para 20 usuarios, cifrado en $108.000 — procede de una agencia low-code que vende builds a medida `(fuente interesada)`. **Las notas son explícitas: no hay ningún análisis independiente con datos sobre tasas de éxito o TCO real de CRM construidos a medida por agencias. Toda la evidencia de build vs buy es anecdótica o interesada.**

---

## Modelo de objetos de referencia

Vocabulario de partida. HubSpot y Pipedrive son las dos referencias con documentación primaria accesible; las notas advierten de que **no se obtuvieron los modelos de objeto de Monday CRM, ClickUp, Zoho, Copper, Capsule, Insightly, Close ni Attio**, así que cualquier otra nomenclatura debe considerarse sin verificar.

### HubSpot

HubSpot define **32 objetos CRM estándar**, cada uno con un `objectTypeId`. Los objetos personalizados tienen la forma `2-XXX` y se crean con la Schemas API.

| objectTypeId | Objeto | | objectTypeId | Objeto |
|---|---|---|---|---|
| `0-1` | Contacts | | `0-74` | Goals |
| `0-2` | Companies | | `0-84` | Discounts |
| `0-3` | Deals | | `0-85` | Fees |
| `0-5` | Tickets | | `0-86` | Taxes |
| `0-7` | Products | | `0-101` | Payments |
| `0-8` | Line items | | `0-115` | Users |
| `0-14` | Quotes | | `0-116` | Postal mail |
| `0-18` | Communications | | `0-123` | Orders |
| `0-19` | Feedback submissions | | `0-136` | Leads |
| `0-27` | Tasks | | `0-142` | Carts |
| `0-46` | Notes | | `0-162` | Services |
| `0-47` | Meetings | | `0-410` | Courses |
| `0-48` | Calls | | `0-420` | Listings |
| `0-49` | Emails | | `0-421` | Appointments |
| `0-53` | Invoices | | `0-54` | Marketing events |
| `0-69` | Subscriptions | | `0-970` | **Projects** |

Las **cuatro primitivas transversales** de HubSpot son las que importan para el diseño propio:

| Primitiva | Qué es | Dónde vive |
|---|---|---|
| **Properties** | Campos, con propiedades por defecto + personalizadas | Properties API, versionada por fecha: `/crm/properties/2026-09/0-1` |
| **Associations** | Vínculos entre registros, con association types/labels y límites | Endpoints de detalle y de esquema |
| **Pipelines** | Etapas, no solo para deals sino también para tickets | Pipelines API |
| **Custom objects** | `objectTypeId` con forma `2-XXX` | Schemas API: `/crm-object-schemas/2026-09/schemas` |

Dos detalles de UX replicables y baratos: HubSpot modela como objetos de primera clase todos los tipos de *engagement* (Calls, Communications — SMS, LinkedIn, WhatsApp —, Emails, Meetings, Notes, Postal mail, Tasks), y expone **pinned engagement** (`hs_pinned_engagement_id`): una actividad fijada arriba del registro.

### Pipedrive

| Entidad | Notas |
|---|---|
| Persons | Equivalente a Contacts |
| Organizations | Equivalente a Companies |
| **Leads** | Objeto propio, con **Lead fields, Lead labels y Lead sources** como entidades independientes |
| Deals | Ver campos abajo |
| Pipelines, Stages | Separados como entidades |
| Activities | Unificadas, con Activity fields y Activity types como entidades |
| Products | Con Product fields y Deal products |
| **Projects** | Con Project boards, fields, phases y templates; disponible desde el plan Premium |

Campos estándar del **Deal**: `title` (único obligatorio al crear), `owner_id`, `person_id`, `org_id`, `pipeline_id`, `stage_id`, `value`, `currency`, `status` (open / won / lost / deleted), `probability`, `lost_reason` (solo cuando `status = lost`), `visible_to`, `close_time` / `won_time` / `lost_time`, `expected_close_date`, `is_archived` + `archive_time`, `label_ids` (array), `channel` (int) + `channel_id` (string), `origin_id` (solo en creación), `custom_fields`, `is_deleted`.

Campos derivados de solo lectura (`include_fields`): `next_activity_id`, `last_activity_id`, `products_count`, `files_count`, `notes_count`, `followers_count`, `activities_count`, `participants_count`.

Particularidad a **no** copiar: los campos personalizados se exponen como un objeto `custom_fields` cuyas **claves son hashes de 40 caracteres**, no nombres legibles. Pipedrive sí acierta en separar "field definition" de "value" como entidades distintas.

### Nomenclatura de los PSA de agencia

Útil como vocabulario, no como arquitectura. Cada producto nombra lo mismo de forma distinta:

| Concepto | Scoro | Productive | Teamwork | Accelo |
|---|---|---|---|---|
| Agrupación de producto | "apps": Sell, Estimate, Do, Deliver, Track, Resource, Spend, Invoice (+ add-ons Advanced Work y Advanced Financials) | Módulos | Planes | Áreas: Platform Overview, AI & MCP, Client Management, Project Management, Client Workspace, Project Financials, Business Intelligence, Resourcing & Capacity Planning |
| Retainer | "Retainer management" (Deliver) | "Recurring budgets" | "Time retainers" → "Time and cost retainers" | "ongoing retainers" junto a "fixed-fee projects" |
| Presupuesto | "Quote & budget builder", "Cost & margin planning" (Estimate) | "Budgeting" | "Time budgets" → "Time, cost and fixed-fee budgets" | "Project Financials" |
| Tiempo | "Time tracker", "Timesheets", "Billable time", "Labor cost" (Track) | "Time tracking", "Billable time approvals" | Time tracking billable vs non-billable, timesheets, approvals | — |
| Recursos | "Planner", "Bookings", "Availability indicators", "Utilization report" (Resource) | "Resource planning" | Workloads por equipo y rol → availability, skills, auto-assign | "Resourcing & Capacity Planning" |
| Facturación | "Invoice generation", "Recurring billing", "Scheduled invoices", "Credit notes"; "Purchase orders" (Spend) | "Invoicing" (Professional) | "Basic invoices" → "Margin, tax, discounts" | — |
| Rentabilidad | "Margin report" (Invoice), "WIP report", "Quoted vs actuals" (Advanced Financials) | "Revenue forecasting", "Scenario Builder", "Overhead calculation" | "Profit by project/client + forecasts", "billable utilization targets" | "Business Intelligence" |
| Portal cliente | — | — | "Client users" | "Client Workspace" |

Attio, por su parte, modela el CRM como **"objects"** configurables (incluyendo custom objects), **"lists"** (privadas y de equipo), workflows/automatizaciones, data enrichment, reports (tipos: Insights, funnels, segments, targets, trends), call intelligence, AI agents con créditos "Ask Attio", sequences, API + webhooks y servidor MCP.

### Esquema mínimo propuesto en las notas

Las notas incluyen esta propuesta y la marcan explícitamente como **inferencia del investigador, no recomendación de las fuentes**. Se reproduce aquí como punto de partida del documento de modelo de datos, no como decisión cerrada:

| Colección | Análogo | Campos núcleo derivados de las fuentes |
|---|---|---|
| `contacts` | HubSpot `0-1` | email (único), firstname, lastname, phone, jobtitle, lifecycleStage, leadStatus, ownerId, companyId, createdAt, updatedAt, customFields |
| `companies` | HubSpot `0-2` | name, domain, industry, ownerId, customFields |
| `deals` | HubSpot `0-3` / Pipedrive Deal | title, value, currency, pipelineId, stageId, status, probability, expectedCloseDate, wonAt/lostAt, lostReason, ownerId, personId, orgId, labelIds, source/channel, **soldHoursByRole**, **budgetType**, customFields |
| `activities` | Calls/Meetings/Emails/Notes/Tasks | type, subject, dueAt, completedAt, ownerId, refs[], body (+ `nextActivityId`/`lastActivityId` denormalizados en el deal) |
| `pipelines` + `stages` | Pipelines API | name, order, probability por etapa |
| `schemas` | Properties API | definición de campos por objeto (tipo, opciones, obligatoriedad) |
| `projects` | HubSpot `0-970` / Pipedrive Projects | dealId, clientId, status, startDate, phases/boards, templateId |
| `budgets` | Recurring budgets / retainers | projectId, budgetType (retainer / fixed_fee / T&M), periodo, horas vendidas por rol, fee, rollover |
| `timeEntries` | Time tracking | userId, projectId, budgetId, minutes, billable, billRate, costRate, approvedAt |
| `people` / `rates` | Rate cards / cost rates | billRate y costRate por persona y por rol, con vigencia temporal |
| `quotes` + `lineItems` | HubSpot `0-14` + `0-8` | con discounts/fees/taxes como líneas (`0-84`/`0-85`/`0-86`) |
| `invoices` + `payments` | HubSpot `0-53` + `0-101` | recurring billing, scheduled invoices, credit notes (nomenclatura Scoro) |

Las notas resumen el alcance así: ~12 colecciones, de las cuales **6 son CRM clásico y 6 son delivery/finanzas**.

---

## Decisiones abiertas

Preguntas que el dueño del proyecto debe responder antes de implementar. Cada una cambia el alcance o el modelo de datos.

### Sobre el alcance

1. **¿El sistema factura, o solo alimenta a contabilidad?** Determina si F-CORE-22, F-CORE-24 y F-CORE-34 entran alguna vez. Las notas señalan que la facturación es, junto a permisos e informes, la parte cara de construir.
2. **¿Cuántas personas registrarán tiempo?** El time tracking (F-CORE-10) solo produce margen fiable si lo usa todo el equipo de delivery. Si la adopción va a ser parcial, el reporting de margen (F-CORE-12) nace contaminado y conviene replantear la secuencia.
3. **¿La agencia subcontrata o usa pass-through de forma material?** Si sí, el AGI deja de ser igual al revenue y F-CORE-24 sube de `Could` a `Must`.
4. **¿Habrá clientes con acceso al sistema?** El portal de cliente (F-CORE-25) arrastra un modelo de permisos completo; si la respuesta es sí, F-CORE-28 deja de ser `Could`.
5. **¿Se modela lo específico de IA (entregables, modelos, coste de inferencia, consumo) en v1 o después?** Las notas identifican esto como la justificación más sólida del build — "ningún PSA lo modela" — pero el catálogo actual no lo incluye en ningún ID. **Es el hueco más visible de este documento** `(criterio propio)`.

### Sobre el modelo de datos

6. **¿Retainer y proyecto puntual son el mismo objeto `project` con distinto `budgetType`, o entidades separadas?** Las notas sugieren trackear retainers por separado de los deals puntuales para detectar churn, pero eso aplica al deal, no necesariamente al proyecto.
7. **¿Las tarifas se definen por persona, por rol, o ambas con precedencia?** F-CORE-07 asume ambas; hay que fijar qué gana cuando entran en conflicto.
8. **¿Multi-divisa desde el inicio?** Afecta a `deals`, `budgets`, `timeEntries` e `invoices` a la vez. Productive reserva la conversión de divisa a Professional y las subsidiarias múltiples a Ultimate; retrofitearlo es caro.
9. **¿El `rolloverPolicy` es por presupuesto, por cliente o global?** Determina dónde vive el campo y si F-CORE-20 necesita herencia.
10. **¿Se adopta la nomenclatura de HubSpot tal cual (`lifecyclestage`, `hs_lead_status`) o se traduce al español?** Importa menos la estética que la consistencia; cambiar después rompe integraciones y datos derivados.

### Sobre operación y riesgo

11. **¿Quién recibe la alerta de burn (F-CORE-11) y con qué umbrales?** La alerta sin destinatario claro no cambia ningún comportamiento.
12. **¿Qué objetivo de utilización se fija y para qué roles?** Las fuentes del sector discrepan entre 65 % y 75–90 %; el número tiene que salir de la propia agencia.
13. **¿Qué nivel de autonomía tienen los agentes sobre el CRM vía MCP (F-CORE-13)?** Lectura, escritura con revisión, o escritura directa. Define el modelo de auditoría desde el inicio.
14. **¿Qué pasa con el histórico?** Si hay datos en una herramienta actual, la estrategia de importación condiciona las claves naturales (email, dominio) y los campos personalizados.
15. **¿Cuál es el criterio de abandono?** Las notas recogen que la señal de "momento de comprar" es no saber aún exactamente qué se necesita del CRM `(fuente interesada: agencia low-code que vende builds)`. Conviene fijar de antemano qué evidencia haría parar el build.

---

## Fuentes

Las URLs proceden de las notas de investigación, estado consultado noviembre de 2026. Las marcas de fiabilidad son las que las propias notas asignan.

**Documentación primaria de proveedor (modelo de datos)**
- HubSpot, Understanding the CRM — https://developers.hubspot.com/docs/guides/api/crm/understanding-the-crm
- HubSpot, Contacts API — https://developers.hubspot.com/docs/reference/api/crm/objects/contacts
- Pipedrive, Deals API — https://developers.pipedrive.com/docs/api/v1/Deals

**Páginas de pricing oficiales (features y gating)**
- Scoro pricing — https://www.scoro.com/pricing/
- Productive pricing — https://productive.io/pricing/ *(las notas señalan totales inconsistentes en esta página)*
- Teamwork pricing — https://www.teamwork.com/pricing/
- Accelo pricing — https://www.accelo.com/pricing/ *(no publica precios)*
- Attio pricing — https://attio.com/pricing
- HubSpot CRM pricing — https://www.hubspot.com/pricing/crm *(no cubre Professional ni Enterprise)*
- Pipedrive, new plans (límites oficiales por tier) — https://support.pipedrive.com/en/article/new-pipedrive-plans

**Fuentes de proveedor interesado (señal, no hecho)**
- Teamwork, PSA vs CRM — https://www.teamwork.com/blog/psa-vs-crm/ *(origen del mapa de propiedad, los cinco campos de closed-won y el ejemplo numérico del margen; proveedor PSA, ejemplo ilustrativo)*
- Zoom/Bonsai, CRM features — https://www.zoom.com/en/products/bonsai/features/crm/
- Productive, Scoro alternatives — https://productive.io/blog/scoro-alternatives *(competidor directo de Scoro)*
- Zendesk, building a CRM — https://www.zendesk.com/blog/sales/building-a-crm-critical-considerations/ *(argumenta contra el build; vende CRM)*
- Salesforce, build vs buy CRM — https://www.salesforce.com/blog/build-vs-buy-crm/ *(ídem)*
- Lowcode.agency, when should a business build a CRM — https://www.lowcode.agency/blog/when-should-a-business-build-a-crm-instead-of-buying-one *(vende builds a medida; la cifra de $108.000 es ejemplo propio del autor)*
- Closebot, self-owned and vibe-coded CRMs — https://closebot.com/blog/self-owned-and-vibe-coded-crms-ai-sales-agent-systems/
- Capsule, Attio alternatives — https://capsulecrm.com/blog/attio-crm-alternatives/
- folk, Attio vs Close — https://www.folk.app/articles/attio-vs-close-crm

**Métricas de agencia (consultora del sector, benchmarks contradictorios entre sí)**
- Parakeeto, Agency Gross Income (AGI) — https://parakeeto.com/glossary/agency-gross-income-agi/
- Parakeeto, Average Billable Rate — https://www.parakeeto.com/average-billable-rate/
- Parakeeto, Utilization Rate — https://parakeeto.com/glossary/utilization-rate/
- Parakeeto, measuring profitability 2023 — https://www.parakeeto.com/blog/measuring-and-improving-your-agencys-profitabilty-the-2023-guide/
- AMI/Parakeeto webinar deck (PDF) — https://agencymanagementinstitute.com/wp-content/uploads/2025/09/91525ParakeetoAMIwebinar.pdf
- Parakeeto, agency metrics — https://parakeeto.com/blog/agency-metrics/

**Reseñas y quejas de usuario (agregadores; señal débil según las notas)**
- G2, HubSpot Marketing Hub — https://www.g2.com/products/hubspot-marketing-hub/ *(4,4/5 sobre 15.958 reseñas; 730 reseñas sobre limitaciones de planes baratos, 667 sobre precio, 519 sobre complejidad)*
- Community Insights, digest r/CRM — https://communityinsights.pages.dev/reports/CRM *(cita Reddit de segunda mano)*
- BigIdeasDB, CRM too complicated — https://bigideasdb.com/crm-too-complicated-for-small-business
- Noloco, agency CRM chaos — https://noloco.io/blog/agency-crm-chaos
- The Digital Project Manager, Hello Bonsai review — https://thedigitalprojectmanager.com/tools/hello-bonsai-review/
- Agiled vs Bonsai — https://agiled.app/compare/agiled-vs-bonsai
- Rework, Attio alternatives — https://resources.rework.com/tools/crm/best-attio-alternatives *(las notas advierten de que el texto traducido de esta fuente está parcialmente corrupto)*
- Indie Hackers, why we threw out our $20k CRM — https://www.indiehackers.com/post/why-we-threw-out-our-20k-crm-building-a-custom-solution-with-ai-b4b7e01403

**Precios de terceros no verificados contra proveedor**
- Costbench, CRM pricing — https://costbench.com/software/crm/
- Costbench, Copper vs Insightly — https://costbench.com/compare/copper-vs-insightly/
- Costbench, Copper vs monday CRM — https://costbench.com/compare/copper-vs-monday-crm/
- Zeeg, Pipedrive pricing 2026 — https://zeeg.me/en/blog/post/pipedrive-pricing
- Tech.co, Pipedrive pricing — https://tech.co/crm-software/pipedrive-pricing

**Huecos declarados en las notas que este documento hereda**
- No hay lista oficial de propiedades por defecto de Deal, Company, Ticket ni Quote de HubSpot (la página de knowledge base devolvió 404). Obtenerlas con `GET /crm/v3/properties/0-3`, `/0-2`, `/0-5`, `/0-14` desde una cuenta real.
- No hay modelo de objetos verificado de Attio, Close, Copper, Capsule, Insightly, Zoho, Monday CRM ni ClickUp.
- No hay benchmark independiente de margen de retainer ni de TCO de CRM a medida. La referencia a SPI Research apareció de segunda mano y **no debe citarse como dato confirmado**.
- No se pudo acceder a hilos primarios de r/agency, r/webdev, r/msp ni Indie Hackers/HN; las quejas "derivadas de Reddit" son indirectas.
