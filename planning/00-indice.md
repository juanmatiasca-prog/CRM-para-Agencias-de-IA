# 00 — Índice y resumen ejecutivo

Esta carpeta contiene la planificación de un CRM propio para una agencia de IA. Son siete documentos de análisis más éste y el roadmap. **No hay código, ni esquema de Firestore definitivo, ni reglas de seguridad, ni decisión de implementación tomada.** Lo que hay es un inventario razonado de lo que el sistema podría hacer, con la evidencia que sostiene cada afirmación y, donde no la hay, la declaración explícita de que falta.

**Cómo se produjo.** Investigación web en seis frentes —panorama de plataformas CRM y PSA, workflows comerciales de agencia, delivery y rentabilidad, especificidad de las agencias de IA, interfaces de CRM de nueva generación, y modelo de datos e integraciones sobre Firebase—, sintetizada en siete documentos escritos en paralelo por agentes distintos a partir de las notas de investigación (`research_notes/CRM para agencias de IA/`). Estado de consulta: noviembre de 2026.

**Cómo debe leerse.** Cada documento es autónomo y declara sus propias lagunas. Ninguno es una especificación: todos terminan en una tabla de decisiones abiertas que el dueño del proyecto tiene que cerrar. El orden de lectura natural es 01 → 02 → 03 → 04, con 05, 06 y 07 como capas transversales. Si solo se va a leer una cosa, que sea el resumen ejecutivo de abajo y después [08 — Roadmap y priorización](08-roadmap.md), que es donde se propone el corte.

Que el paralelismo de la redacción tiene consecuencias: los cinco catálogos de funcionalidades se escribieron sin verse entre sí, suman 198 IDs y contienen solapamientos y conflictos de prioridad. Están identificados y resueltos en el documento 08, no aquí.

---

## Cómo leer según lo que quieras hacer

| Si quieres… | Lee |
|---|---|
| Entender qué es este sistema y por qué no es un CRM genérico | [01 — Funcionalidades núcleo](01-funcionalidades-core.md), secciones 1 y 2 |
| Saber qué construir primero y qué dejar fuera | [08 — Roadmap y priorización](08-roadmap.md) |
| Diseñar el pipeline, las etapas y los criterios de avance | [02 — Workflows comerciales](02-workflows-comerciales.md), §1–§2 |
| Escribir una propuesta, un SOW o decidir el modelo de pricing | [02 — Workflows comerciales](02-workflows-comerciales.md), §3–§5 |
| Entender por qué una agencia pierde margen sin enterarse | [01](01-funcionalidades-core.md) §"El ejemplo numérico" y [03 — Delivery y rentabilidad](03-delivery-y-rentabilidad.md) §1 |
| Definir el time tracking y la facturación | [03 — Delivery y rentabilidad](03-delivery-y-rentabilidad.md), §3 y §7 |
| Medir utilización, capacidad o decidir contratar vs. vender | [03 — Delivery y rentabilidad](03-delivery-y-rentabilidad.md), §2 y §4 |
| Modelar retainers, overage y rollover | [03 — Delivery y rentabilidad](03-delivery-y-rentabilidad.md) §5 y [02](02-workflows-comerciales.md) §6 |
| Decidir cómo se cobra y se contabiliza el coste de inferencia | [04 — Específico de agencias de IA](04-especifico-agencias-ia.md), §A.2 |
| Modelar el ciclo discovery → PoC → producción → retainer | [04 — Específico de agencias de IA](04-especifico-agencias-ia.md), §A.1 y §A.7 |
| Decidir qué papel juega la IA dentro del producto | [04 — Específico de agencias de IA](04-especifico-agencias-ia.md), Parte B |
| Diseñar pantallas, vistas, filtros o el command palette | [05 — Interfaces y pantallas](05-interfaces-y-pantallas.md) |
| Definir colecciones, asociaciones, permisos o multi-tenancy | [06 — Modelo de datos](06-modelo-de-datos.md) |
| Conectar email, calendario, facturación o Slack | [07 — Integraciones y automatizaciones](07-integraciones-y-automatizaciones.md), §1–§2 |
| Construir el motor de automatizaciones | [07 — Integraciones y automatizaciones](07-integraciones-y-automatizaciones.md), §3 |
| Cumplir GDPR, derecho de supresión y retención | [07 — Integraciones y automatizaciones](07-integraciones-y-automatizaciones.md), §4 |
| Saber qué NO sabemos y dónde la evidencia es floja | §"Calidad de la evidencia" de este documento, y las secciones de lagunas de 02, 03, 04 y 05 |

---

## Índice de documentos

| Documento | Contenido | Nº de funcionalidades |
|---|---|---|
| [01 — Funcionalidades núcleo](01-funcionalidades-core.md) | Qué separa un CRM de agencia de uno genérico, el mapa de propiedad CRM/PSA/Finanzas, gating y precios verificados del mercado, modelo de objetos de referencia | **35** (`F-CORE-01..35`) |
| [02 — Workflows comerciales](02-workflows-comerciales.md) | Pipeline y exit criteria, cualificación, propuestas y SOW, modelos de pricing, estimación PERT, renovaciones, handoff a delivery, métricas comerciales | **46** (`F-COM-01..46`) |
| [03 — Delivery y rentabilidad](03-delivery-y-rentabilidad.md) | Cascada financiera, catálogo de métricas con fórmulas, time tracking, capacidad y placeholders, retainers, scope creep, facturación y cobro, dashboards | **47** (`F-DEL-01..47`) |
| [04 — Específico de agencias de IA](04-especifico-agencias-ia.md) | Ciclo discovery→PoC→producción→retainer, coste de inferencia, artefactos de IA, cumplimiento, métricas pactadas; y qué papel debe jugar la IA dentro del CRM | **33** (`F-IA-01..33`) |
| [05 — Interfaces y pantallas](05-interfaces-y-pantallas.md) | El inventario real de pantallas, anatomía de la ficha, vistas y filtros, command palette, tablas, timeline, captura rápida, móvil | **6 pantallas** (`P-01..06`) + **2 overlays** (`O-01`, `O-02`) |
| [06 — Modelo de datos](06-modelo-de-datos.md) | Entidades canónicas y asociaciones, estructura en Firestore, multi-tenancy, límites duros y blandos, roles y permisos, lo que Firestore no hace bien, audit log y borrado | **26 entidades canónicas** (sin IDs de funcionalidad) |
| [07 — Integraciones y automatizaciones](07-integraciones-y-automatizaciones.md) | Deprecación de Firebase Extensions, mapa de integraciones, email y calendario en detalle, motor de automatizaciones, GDPR, checklist de seguridad | **37** (`F-INT-01..37`) |
| [08 — Roadmap y priorización](08-roadmap.md) | El corte: solapamientos entre catálogos, criterio de v1, cuatro fases, MVP mínimo defendible, dependencias, riesgos de secuencia, decisiones bloqueantes | — |

**Total catalogado: 198 funcionalidades.** De ellas, 96 están marcadas `Must` por sus respectivos documentos. Esa cifra por sí sola ya indica que los catálogos no se pueden sumar sin arbitrar: ver [08](08-roadmap.md).

---

## Resumen ejecutivo

Los hallazgos que cambian decisiones. No los más curiosos: los que, si se ignoran, obligan a rehacer trabajo.

**1. Un CRM conoce el precio; un PSA conoce además el coste y la capacidad.** El modelo núcleo (contacto / empresa / deal / actividad) es casi idéntico entre HubSpot, Pipedrive y Attio. Lo que separa a las herramientas es lo que se monta encima: `costRate`, `budgetType`, horas vendidas por rol y planificación de recursos. *Implica que el proyecto no es "construir un CRM", es construir la mitad PSA y enchufarle un CRM delante.* → [01](01-funcionalidades-core.md)

**2. La brecha de margen es un fallo de instrumentación, no de ejecución.** El ejemplo de referencia: un retainer de $10.000/mes vendido a 64 h y $70/h y entregado a 88 h y $80/h pierde $30.720 al año en una sola cuenta, mientras el CRM muestra un cliente sano. Los campos que lo harían visible no existen en un CRM típico. *Implica que `billRate`, `costRate` y `budgetType` tienen que existir desde el primer commit aunque el módulo que los explota llegue después: añadirlos luego obliga a reescribir el histórico.* → [01](01-funcionalidades-core.md)

**3. Hay que guardar tres importes por entrada de tiempo: listado, facturado y cobrado.** Realization y effective billable rate no son informes, son un requisito de modelo de datos; con un solo importe no se pueden calcular jamás, ni retroactivamente. Cada descuadre señala un problema distinto (descuento/write-off vs. disputa/impago). *Implica que ésta es la decisión estructural más barata de tomar hoy y más cara de corregir mañana.* → [03](03-delivery-y-rentabilidad.md)

**4. El coste de inferencia es la particularidad económica del negocio, y no hay consenso de mercado sobre cómo tratarlo.** Coexisten cuatro políticas en conflicto abierto —repercusión medida, incluido a coste, absorbido, pass-through sin margen— y ninguna fuente dice qué porcentaje de agencias usa cada una. *Implica que el CRM no debe imponer un modelo: debe registrar por cliente qué política se aplicó y con qué campos, porque esa decisión determina la rentabilidad del contrato.* → [04](04-especifico-agencias-ia.md)

**5. La rentabilidad de un proyecto de IA no se puede calcular en el cierre; hay que calcularla viva.** Parte del COGS es variable, se devenga después de la venta y depende del uso que haga el cliente. La métrica deja de ser *horas facturables vs. incurridas* y pasa a ser *margen de contribución = ingreso recurrente − (horas de soporte + inferencia + infraestructura)*. *Implica un cambio de modelo de datos, no un informe más.* → [04](04-especifico-agencias-ia.md)

**6. La conversión PoC → producción es probablemente el KPI más valioso que este sistema puede producir, y nadie lo mide.** No existe benchmark público; pero el dato sale solo de la operación propia si las fases se modelan como deals encadenados con un estado go/no-go explícito y obligatorio. Producción cuesta 3–5× el PoC y el retainer se deriva del build, así que un PoC que no convierte pierde mucho más que el build. *Implica que el go/no-go no puede registrarse como "oportunidad perdida" genérica: si se hace así, el KPI es incalculable.* → [04](04-especifico-agencias-ia.md)

**7. 19 % vs 45 %: la gente ya trabaja desde el chat, no desde el CRM.** Encuesta de HubSpot a >1.000 comerciales: el 19 % usa la IA integrada en su CRM; el 45 % abre un chatbot generalista. Attio expone MCP con lectura y escritura y OAuth a nivel de usuario incluso en su plan gratuito. *Implica priorizar un servidor MCP sobre cualquier UI de IA embebida, con la condición no negociable de OAuth con permisos de usuario para el acceso de escritura.* → [04](04-especifico-agencias-ia.md)

**8. El mercado monetiza el modelo de datos, no el acceso.** Lo gateado en al menos tres de cuatro PSA es, por orden: rentabilidad por proyecto, forecasting, retainers con coste, aprobaciones, rate cards, custom fields, reporting avanzado, permisos granulares y webhooks. Attio regala API, webhooks y MCP hasta en el plan gratuito y cobra por objetos, registros, informes y SQL. *Implica dos cosas: esa lista es la hoja de ruta ordenada por valor percibido, y en un build propio el coste marginal de objetos, registros e informes cae a cero — que es la ventaja real.* → [01](01-funcionalidades-core.md)

**9. El ahorro no justifica el build.** Con precios verificados, un equipo de 10 personas paga entre $3.000 y $6.800/año por Productive Professional o Scoro End-to-end. La justificación defendible es otra: encaje del modelo de datos, el CRM como producto demostrable ante clientes, y meter los propios agentes en el núcleo del dato sin límites de crédito de terceros. *Implica que cualquier funcionalidad que solo replique lo que ya hace un PSA comercial es candidata a recortarse.* → [01](01-funcionalidades-core.md)

**10. No son doce pantallas, son seis más dos overlays.** El kanban no es un módulo: es un tipo de vista del objeto Deal agrupada por etapa. Construir "pantalla de pipeline" aparte duplica filtros, permisos, acciones de fila y estado de carga para ganar cero. *Implica que añadir un objeto nuevo (Proyecto, Retainer, Artefacto de IA) no debe requerir UI nueva; si la requiere, el motor de vistas está mal construido.* → [05](05-interfaces-y-pantallas.md)

**11. Firestore no tiene multi-tenancy nativa y no existe guía oficial de Firebase sobre el patrón.** La recomendación del documento 06 es ruta jerárquica `/tenants/{tid}/<entidad>` con el `tid` en un custom claim, frente a colecciones planas con campo `tenantId` (funcional pero con superficie de error permanente) y frente a proyecto por cliente (techo de 100 bases, coste operativo × N). Además, la región de la base se elige al crearla y **no se puede cambiar después**. *Implica que ésta es la decisión más cara de revertir de todo el proyecto y hay que cerrarla antes de la primera colección.* → [06](06-modelo-de-datos.md)

**12. Firebase Extensions está deprecado y cierra el 31 de marzo de 2027.** Tras esa fecha, una extensión instalada no se puede actualizar, reconfigurar, desinstalar ni siquiera descargar su configuración. Los *function kits* la reemplazan y exigen Cloud Functions de 2ª generación. No todas las extensiones tienen kit: BigQuery sí, Typesense no. *Implica cero dependencias de Extensions desde el primer commit, 2ª generación sin excepciones, y presupuestar como producto el mantenimiento de la sincronización de búsqueda y del pipeline de BigQuery.* → [07](07-integraciones-y-automatizaciones.md)

---

## Convenciones de marcado

Las usan los siete documentos, con pequeñas variaciones de notación. Significado unificado:

| Marca | Significado |
|---|---|
| *(sin marca)* | Dato citado con fuente primaria: documentación de API, página de precios oficial, texto legal o estudio con muestra declarada. |
| `(fuente interesada)` · ⚠️ | Dato publicado por quien vende la categoría —proveedor PSA, consultora de operaciones de agencia, agregador patrocinado—. Útil como señal de dónde está el valor percibido; no como hecho. |
| `(no verificado)` | Dato de agregador de terceros que las notas marcan como pendiente de verificar, o contradictorio entre fuentes. No usar sin contrastar. |
| `(criterio propio)` · `(inferencia)` | Decisión o deducción de este proyecto, no sostenida por ninguna fuente. **Toda priorización MoSCoW de los catálogos entra en esta categoría.** |

Regla práctica: si una cifra va a entrar en una fórmula del producto o en un umbral de alerta, tiene que venir sin marca o de `(criterio propio)` deliberado. Nunca de `(fuente interesada)` tomada como dato.

---

## Calidad de la evidencia

**La advertencia honesta.** Buena parte de la literatura de este sector es contenido de proveedores con interés comercial en sus propias conclusiones. El patrón es sistemático: quien publica el benchmark de utilización vende software de utilización; quien publica el dato de scope creep vende gestión de alcance; quien cuantifica el time tracking perdido vende time tracking. Las cifras no son necesariamente falsas, pero su selección sí está sesgada, y en varios casos los propios documentos recogen que dos artículos del mismo autor dan números incompatibles.

**Qué fuentes sí son sólidas** (muestra declarada, metodología publicada o fuente primaria):

- **Proposify, *State of Proposals 2026*** — 742.137 propuestas analizadas. Juez y parte en todo lo relativo a propuestas, pero es un dato real con muestra.
- **SPI Research, *2026 PS Maturity Benchmark*** — 509 organizaciones, >245.000 empleados, 63.000 M$ de ingresos de servicios. **Informe de pago, no consultado directamente**: todo lo citado llega vía resúmenes de Deltek, Certinia y Kantata, que son partners comerciales de SPI.
- **PMI, *Pulse of the Profession*** — el 52 % de incidencia de scope creep es la única cifra sólida de todo ese bloque.
- **Validity (2025)** — 602 usuarios y administradores de CRM; el 76 % dice que menos de la mitad del dato de su CRM es exacto y completo.
- **Documentación de producto y páginas de precios oficiales** — HubSpot (modelo de objetos y API), Pipedrive (límites por tier), Scoro, Productive, Teamwork y Attio (gating verificado).
- **Documentación oficial de Firebase y Google Cloud** — límites de Firestore, triggers, Cloud Tasks, deprecación de Extensions.
- **Texto legal** — GDPR y, con la reserva del punto siguiente, el AI Act.

**Qué preguntas quedaron sin respuesta fiable en toda la investigación.** Son huecos reales, no pereza: cada una es una decisión que habrá que tomar sin referencia externa.

1. **No existe ningún benchmark independiente de margen de retainer** para agencias. Toda la evidencia es de proveedor PSA o de consultora.
2. **Las agencias de IA no existen como categoría en ninguna investigación de mercado**: no hay benchmarks de utilización, margen, tarifa media ni modelos de retainer para ellas. Tampoco hay ninguna fuente sobre tratamiento contable de los costes de inferencia, ni ningún modelo de retainer que combine horas y cómputo. **Esta ausencia es en sí misma un hallazgo: no hay producto que copiar.**
3. **No hay dato sobre la conversión real PoC → producción.** El "pilot purgatory" se cita en prensa; nadie publica una muestra.
4. **No hay taxonomía validada de razones de pérdida** para agencias de servicios, ni número óptimo de etapas, ni duración media por etapa.
5. **No existe literatura sobre estimación de proyectos LLM**, ni rangos optimista/medio/pesimista calibrados para ese tipo de trabajo.
6. **No hay estudios independientes sobre adopción de time tracking** ni sobre el coste real de su fricción; las cifras que circulan ("30 % de horas facturables no registradas") son marketing de proveedor.
7. **No hay benchmarks auditados de DSO, CAC, churn ni NRR** específicos de agencias de software o de IA; los disponibles son de staffing, construcción o A/E.
8. **No hay ningún modelo de health score publicado y validado** para servicios profesionales, ni fórmula propuesta por ninguna fuente que lo menciona.
9. **No hay análisis independiente de build vs. buy** con datos sobre tasas de éxito o TCO real de CRM construidos a medida. Toda la evidencia disponible es anecdótica o interesada, en ambas direcciones.
10. **No hay documentación del flujo de importación CSV** (mapeo de columnas, detección de duplicados, previsualización, deshacer) en ninguna fuente consultada. Hay que diseñarlo a ciegas.
11. **No hay página oficial de Firebase sobre multi-tenancy en Firestore.** Toda la orientación es de terceros o de hilos de foro.
12. **No se verificó la normativa española de facturación** (Verifactu, Ley Crea y Crece, LOPDGDD art. 19, LSSI) ni los plazos de retención para prospección B2B. Bloquea el módulo de facturación y la base de licitud de la prospección.
13. **No se verificaron en el Diario Oficial las fechas del AI Act** citadas. Mientras no se haga, las banderas de cumplimiento deben ser informativas y no disparar lógica.

---

## Glosario

| Término | Definición de una línea |
|---|---|
| **AGI** (Agency Gross Income) | Ingresos brutos menos pass-through expenses; el denominador correcto de casi todos los ratios de agencia. |
| **ABR** (Average Billable Rate) | Ingreso medio generado por hora de trabajo de cliente: AGI ÷ horas de delivery. |
| **ACPH** (Average Cost Per Hour) | Coste medio por hora de una persona: (salario + beneficios) ÷ capacidad anual; sin él no hay margen real. |
| **Delivery margin** | (AGI − costes de delivery) ÷ AGI; el margen antes de overhead, y el único que un jefe de proyecto puede mover. |
| **Realization rate** | Cuánto de lo que valía el trabajo se llegó a facturar y a cobrar: facturado ÷ listado, y cobrado ÷ facturado. |
| **Utilización** | Horas facturables ÷ horas disponibles; no es un número sino una función, porque numerador, denominador, periodo y ámbito cambian el resultado. |
| **NRR** (Net Revenue Retention) | Ingreso recurrente de la base de clientes existente un periodo después, incluyendo altas, bajas y expansión. |
| **SOW** (Statement of Work) | Documento que fija alcance, entregables, criterios de aceptación, hitos y exclusiones de un trabajo concreto. |
| **MSA** (Master Service Agreement) | Contrato marco que fija términos legales una vez, bajo el cual cuelgan N SOW y N change orders. |
| **PoC** (Proof of Concept) | Prueba acotada que demuestra viabilidad antes de comprometer el build de producción; el punto de decisión go/no-go del negocio. |
| **Retainer** | Acuerdo recurrente con capacidad o cuota comprometida por periodo, con reglas propias de overage, rollover y caducidad. |
| **Scope creep** | Crecimiento del alcance real sobre el alcance vendido sin change order que lo compense. |
| **WIP** (Work In Progress) | Horas aprobadas y todavía no facturadas; dinero ya gastado que aún no ha empezado a cobrarse. |
| **DSO** (Days Sales Outstanding) | Días medios que tarda en cobrarse una factura emitida. |
| **MoSCoW** | Escala de priorización Must / Should / Could / Won't; aquí "Won't" significa aplazado conscientemente, no descartado. |
