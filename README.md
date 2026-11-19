# CRM para Agencias de IA

CRM personalizado para agencias que venden servicios de inteligencia artificial:
gestión de leads, pipeline comercial, propuestas, clientes, proyectos y seguimiento
de entregables.

Construido sobre **Firebase** (Authentication, Cloud Firestore, Cloud Functions,
Hosting y Storage).

> **Estado:** proyecto en etapa inicial. El código es público y está en desarrollo
> activo. La fase actual es de planificación: ver [`planning/`](planning/00-indice.md).

## Seguridad y privacidad

Este repositorio es **público**. No contiene —ni debe contener— credenciales,
service accounts, archivos `.env` ni datos reales de clientes. La configuración
sensible se maneja con variables de entorno y Firebase Secret Manager.

Si trabajás en este proyecto (persona o agente de IA), leé **[AGENTS.md](AGENTS.md)**
antes de commitear.

## Puesta en marcha

1. Clonar el repositorio.
2. Copiar la plantilla de variables de entorno y completarla con tu propio proyecto
   de Firebase:

```powershell
Copy-Item .env.example .env
```

3. Instalar la CLI de Firebase y autenticarte:

```powershell
npm install -g firebase-tools; firebase login
```

4. Levantar los emuladores para desarrollo local:

```powershell
firebase emulators:start
```

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| `src/` | Frontend del CRM |
| `functions/` | Cloud Functions (lógica de backend) |
| `firestore.rules` | Reglas de seguridad de Firestore |
| `storage.rules` | Reglas de seguridad de Storage |
| `planning/` | Investigación y catálogo de funcionalidades (empieza por [planning/00-indice.md](planning/00-indice.md)) |
| `docs/` | Documentación del proyecto |
| `AGENTS.md` | Instrucciones para agentes de IA |

## Licencia

MIT — ver [LICENSE](LICENSE).
