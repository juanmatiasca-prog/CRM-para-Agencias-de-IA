# CRM_MKt_HACKERS

CRM personalizado para agencias que venden servicios de inteligencia artificial:
clientes, proyectos y seguimiento del avance en un solo sitio.

> **Estado:** primera versión funcional. Landing pública, registro e inicio de
> sesión con Firebase Authentication, la primera pestaña del CRM (Clientes)
> operativa y los datos en **Cloud Firestore**, con aislamiento por usuario
> impuesto por Security Rules. Ver
> [Base de datos](#base-de-datos-y-aislamiento-por-usuario).

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
| Base de datos | **Cloud Firestore** (base con nombre `mkt-hackers-db-id`) | Sincronización en tiempo real y reglas de acceso declarativas |
| Archivos | **Cloud Storage for Firebase** | Adjuntos de clientes, proyectos y comentarios, con las mismas reglas de aislamiento |
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

Las reglas de seguridad se despliegan aparte. **Hay que hacerlo cada vez que se
toque `firestore.rules`**, o la base seguirá con las reglas anteriores:

```powershell
npx -y firebase-tools@latest deploy --only firestore,storage
```

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
| `src/lib/repo.ts` | Acceso a Firestore: rutas, lecturas y escrituras |
| `src/lib/attachments.ts` | Subida, listado y borrado de archivos |
| `src/components/attachments/` | El clip y la lista de adjuntos |
| `src/lib/migrate.ts` | Migración puntual desde `localStorage` |
| `firestore.rules` | **Reglas de seguridad de la base de datos** |
| `storage.rules` | **Reglas de seguridad de los archivos** |
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
  - **Archivos adjuntos** en los tres niveles: cliente, proyecto y comentario.
  - Todo se guarda en Firestore y se sincroniza en tiempo real entre pestañas
    y dispositivos.
- **Menú lateral** colapsable, con las siguientes pestañas ya listadas y
  desactivadas: Empresas, Pipeline, Proyectos, Tiempo, Facturación y Ajustes.

## Base de datos y aislamiento por usuario

Los datos viven en **Cloud Firestore**, en la base de datos con nombre
`mkt-hackers-db-id` (no la `(default)`; el id se pasa explícitamente en
`src/lib/firebase.ts`).

### Estructura

```
/users/{uid}                                                    perfil
/users/{uid}/clients/{clientId}                                 cliente
/users/{uid}/clients/{clientId}/projects/{projectId}            proyecto
/users/{uid}/clients/{clientId}/projects/{projectId}/comments/{commentId}
```

Todo cuelga del `uid` de Firebase Auth. **Cada persona que se registra tiene su
propio espacio y nadie más puede leerlo ni escribirlo.** No hay datos
compartidos, ni equipos, ni administradores, ni lectura pública.

### Dónde está la seguridad

La aplicación es un sitio estático sin backend: todo el acceso a datos ocurre
desde el navegador. Por tanto **`firestore.rules` es el único control de acceso
real que existe**. La comprobación de sesión del frontend solo evita enseñar
pantallas vacías; no protege nada.

Las reglas hacen cuatro cosas:

1. Deniegan todo por defecto y abren solo `/users/{uid}/...` para su dueño.
2. Validan el esquema en `create` **y** en `update`: tipos, campos obligatorios,
   valores de `status` dentro de su lista cerrada y ningún campo desconocido.
3. Limitan el tamaño de cada campo de texto, para que nadie escriba un megabyte
   en `notes` o en un comentario.
4. Congelan `createdAt` y hacen los comentarios inmutables: se crean y se
   borran, no se editan.

Comprobado contra la base real: leer los datos propios devuelve `200`; leer los
de otro usuario o entrar sin sesión devuelve `403 PERMISSION_DENIED`.

> Las reglas son un prototipo sólido, no una garantía. Antes de abrir la
> aplicación a mucha gente conviene revisarlas y endurecerlas con calma.

### Migración desde el almacenamiento local

La versión anterior guardaba los datos en `localStorage`. `src/lib/migrate.ts`
los sube a Firestore la primera vez que el usuario entra, una sola vez por
navegador, y **no borra el original** por si algo falla. Es código de
transición: puede eliminarse cuando ya nadie tenga datos locales pendientes.

### Limitaciones conocidas

- Borrar un cliente recorre sus proyectos y comentarios en lote, porque
  Firestore **no** borra las subcolecciones al borrar el documento padre.
- La lista de clientes abre una suscripción por cliente para contar sus
  proyectos. Es suficiente para un CRM personal; con cientos de clientes habría
  que denormalizar un contador.

## Archivos adjuntos

Se pueden subir archivos en tres sitios, cada uno con su clip:

| Dónde | Para qué |
|---|---|
| Cliente | Contratos, facturas, documentación de la cuenta |
| Proyecto | Propuestas, planos, entregables |
| Comentario | Capturas y documentos puntuales del seguimiento |

El clip abre el **selector de archivos del sistema operativo**. Se pueden elegir
varios de una vez.

### Límites

- **10 MB por archivo.**
- Tipos admitidos: PDF, Word, Excel, PowerPoint, RTF, texto, CSV y las imágenes
  JPG, PNG, WEBP, GIF y HEIC.

Ambos límites están **duplicados a propósito**: en el navegador, para dar un
error inmediato, y en `storage.rules`, que es donde de verdad se imponen. Si
cambias uno, cambia el otro o las subidas se rechazarán a mitad.

### Cómo se guardan

El fichero va a Cloud Storage bajo una ruta que replica la jerarquía de
Firestore:

```
users/{uid}/clients/{clientId}/...
users/{uid}/clients/{clientId}/projects/{projectId}/...
users/{uid}/clients/{clientId}/projects/{projectId}/comments/{commentId}/...
```

Sus metadatos (nombre, tamaño, tipo y ruta) van a una subcolección
`attachments` del cliente, del proyecto o del comentario.

**Las URL de descarga no se guardan en la base de datos.** Se piden a Firebase
en el momento de abrir o previsualizar el archivo, para que cada acceso pase por
las reglas en lugar de quedar un enlace permanente almacenado.

### Detalles que conviene conocer

- Al borrar un cliente o un proyecto se recorren sus archivos y se eliminan del
  bucket. Ni Firestore ni Storage borran nada en cascada por su cuenta: sin ese
  recorrido quedarían ficheros ocupando espacio para siempre.
- En un comentario, el archivo se elige antes de publicar y se sube **después**
  de crear el comentario, porque los adjuntos cuelgan de él.
- El `contentType` lo declara el navegador. La lista de tipos permitidos frena
  subidas accidentales y el uso del bucket como almacén general, pero no es una
  comprobación del contenido real del fichero.

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
