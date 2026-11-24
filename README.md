# CRM_MKt_HACKERS

CRM personalizado para agencias que venden servicios de inteligencia artificial:
clientes, proyectos y seguimiento del avance en un solo sitio.

> **Estado:** primera versión funcional. Landing pública, registro e inicio de
> sesión con Firebase Authentication, y la primera pestaña del CRM (Clientes)
> operativa. **Todavía no hay base de datos**: los datos se guardan en el
> navegador. Ver [Persistencia](#persistencia-temporal-en-el-navegador).

## Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 15** (App Router) con **React 19** | Rutas por carpetas y export estático en el mismo proyecto |
| Lenguaje | **TypeScript** | Tipado estricto en el modelo de datos del CRM |
| UI | **[shadcn/ui](https://ui.shadcn.com)** (estilo `radix-nova`) | Toda la interfaz está construida con shadcn/ui: componentes copiados al repo en `src/components/ui/`, no una dependencia opaca. Se pueden editar |
| Estilos | **Tailwind CSS v4** | Tokens de tema en `src/app/globals.css` |
| Iconos | **lucide-react** | Los que trae el preset de shadcn |
| Avisos | **sonner** | Toasts de confirmación y error |
| Autenticación | **Firebase Authentication** (correo y contraseña) | Sin backend propio que mantener |
| Hosting | **Firebase Hosting** | El export estático se sirve como ficheros |

### Sobre shadcn/ui

La página entera —landing, acceso y app— usa componentes de shadcn/ui. Los
componentes viven en `src/components/ui/` y son código del repositorio: se
modifican como cualquier otro fichero. La configuración está en
`components.json`.

Para añadir un componente nuevo:

```powershell
npx -y shadcn@latest add dialog
```

## Puesta en marcha

1. Instalar dependencias:

```powershell
npm install
```

2. Crear el fichero de variables de entorno a partir de la plantilla:

```powershell
Copy-Item .env.example .env.local
```

3. Rellenar las variables `NEXT_PUBLIC_FIREBASE_*` con la configuración de tu
   proyecto. Se obtienen con la CLI, sin pasar por la consola web:

```powershell
npx -y firebase-tools@latest apps:sdkconfig WEB --project <TU_PROJECT_ID>
```

4. Arrancar en local:

```powershell
npm run dev
```

## Despliegue

El proyecto se exporta como sitio estático (`output: "export"` en
`next.config.ts`) y se publica en Firebase Hosting:

```powershell
npm run build; if ($?) { npx -y firebase-tools@latest deploy --only hosting }
```

El build escribe en `out/`, que es el directorio público declarado en
`firebase.json`.

> Al ser un export estático no hay servidor: toda la lógica, incluida la
> comprobación de sesión, corre en el navegador. Si más adelante hace falta SSR,
> rutas de API o Server Actions, habrá que migrar a **Firebase App Hosting** y
> quitar `output: "export"`.

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| `src/app/page.tsx` | Landing pública |
| `src/app/login/`, `src/app/signup/` | Acceso y alta de cuenta |
| `src/app/dashboard/` | La app, protegida por sesión |
| `src/app/dashboard/clientes/` | Pestaña de Clientes |
| `src/components/ui/` | Componentes de shadcn/ui |
| `src/components/clientes/` | Componentes de la pestaña de Clientes |
| `src/components/auth/` | Proveedor de sesión y guarda de rutas |
| `src/lib/nav.ts` | **Las pestañas del menú lateral** |
| `src/lib/types.ts` | Modelo de datos |
| `src/lib/storage.ts` | Persistencia en el navegador |
| `src/hooks/use-clients.ts` | Estado y mutaciones de clientes |
| `planning/` | Investigación y catálogo de funcionalidades |
| `AGENTS.md` | Instrucciones para agentes de IA |

## Añadir una pestaña al menú lateral

El menú se genera a partir de un array, así que una pestaña nueva son dos pasos:

1. Crear la página en `src/app/dashboard/<ruta>/page.tsx`.
2. Añadir la entrada en [`src/lib/nav.ts`](src/lib/nav.ts).

Las entradas con `ready: false` aparecen desactivadas con la etiqueta «Pronto»,
útil para dejar el roadmap visible sin romper la navegación.

## Funcionalidades actuales

- **Landing** pública con el planteamiento del producto.
- **Alta y acceso** con correo y contraseña, con mensajes de error en castellano.
- **Rutas protegidas**: `/dashboard` redirige al login si no hay sesión.
- **Pestaña Clientes**: lista con búsqueda y detalle en vista partida.
  - Crear cliente con contacto, empresa, sector y notas.
  - Estado del cliente: lead, activo, pausado, cerrado.
  - **Proyectos por cliente**, con estado (discovery, propuesta, en curso,
    entregado, cancelado) y presupuesto.
  - **Comentarios por proyecto**, con autor y fecha. Ctrl + Enter para enviar.
- **Menú lateral** colapsable, con las siguientes pestañas ya listadas y
  desactivadas: Empresas, Pipeline, Proyectos, Tiempo, Facturación y Ajustes.

## Persistencia temporal en el navegador

No hay base de datos conectada todavía. `src/lib/storage.ts` guarda los datos en
`localStorage`, con una clave por usuario (`crm_mkt_hackers:v1:<uid>`). Esto
implica:

- Los datos **no se comparten** entre usuarios, navegadores ni dispositivos.
- Se **pierden** si se borran los datos del sitio.
- La protección de rutas es de interfaz, no de datos.

El módulo está aislado a propósito: al conectar Cloud Firestore solo hay que
sustituir su implementación manteniendo la misma interfaz, y mover el control de
acceso real a las Security Rules.

## Seguridad y privacidad

Este repositorio es **público**. No contiene —ni debe contener— credenciales,
service accounts, archivos `.env` ni datos reales de clientes. La configuración
sensible se maneja con variables de entorno y Firebase Secret Manager.

La configuración web de Firebase (`apiKey`, `appId`…) no es secreta: viaja en el
bundle del navegador. Aun así se lee de variables de entorno para no fijar un
proyecto concreto en el código. La seguridad real la dan las **Security Rules**,
**App Check** y las **restricciones de la API key** en Google Cloud Console.

Si trabajás en este proyecto (persona o agente de IA), leé **[AGENTS.md](AGENTS.md)**
antes de commitear.

## Sobre la carpeta `planning/` — leer antes de usarla

Los documentos de [`planning/`](planning/00-indice.md) son el resultado de una
**investigación** sobre cómo funcionan los CRM y las agencias de servicios. Son
material de referencia, no un plan de obra.

Concretamente:

- **No es la planificación real del proyecto** y no hay que seguirla al pie de la letra.
- **Nada de lo que contiene está decidido.** Las prioridades, las fases y el MVP que
  proponen son criterio de quien redactó cada documento, no acuerdos tomados.
- **Se usa solo como referencia** para no partir de cero y para saber qué preguntas
  existen. Apartarse de ella no requiere justificación.
- Buena parte de la evidencia procede de proveedores con interés comercial en sus
  propias conclusiones. Los documentos lo señalan en línea; conviene leerlo con esa
  advertencia presente.

**Ante cualquier duda, preguntá al usuario en lugar de decidir por tu cuenta
apoyándote en estos documentos.** Esto aplica especialmente a los agentes de IA que
trabajen en el repositorio: `planning/` no es una fuente de autoridad sobre qué
construir.

## Licencia

MIT — ver [LICENSE](LICENSE).
