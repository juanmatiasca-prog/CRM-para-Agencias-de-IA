# CRM para Agencias de IA

CRM personalizado para agencias que venden servicios de inteligencia artificial:
gestión de leads, pipeline comercial, propuestas, clientes, proyectos y seguimiento
de entregables.

Construido sobre **Firebase** (Authentication, Cloud Firestore, Cloud Functions,
Hosting y Storage).

> **Estado:** proyecto en etapa inicial. El código es público y está en desarrollo
> activo. La fase actual es de planificación: ver [`planning/`](planning/00-indice.md).

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
