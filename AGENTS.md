# AGENTS.md

Instrucciones para agentes de IA (Claude Code, Codex, Cursor, Gemini CLI, etc.) que
trabajen en este repositorio.

> **Leé este archivo completo antes de escribir, mover o publicar cualquier archivo.**

---

## 1. Qué es este proyecto

**CRM personalizado para agencias de IA.** Un CRM pensado para agencias que venden
servicios de inteligencia artificial: gestión de leads, pipeline comercial,
propuestas, clientes, proyectos y seguimiento de entregables.

- **Stack**: Firebase (Authentication, Cloud Firestore, Cloud Functions, Hosting /
  App Hosting, Storage) + frontend web.
- **Repositorio**: **PÚBLICO**. Todo lo que se commitea queda visible para cualquiera,
  para siempre (incluso si después se borra el archivo: queda en el historial de Git).

---

## 2. ⚠️ Regla número uno: este código es público

El repositorio es público y además la carpeta local vive dentro de un directorio
marcado como `CONFIDENCIAL`. Por lo tanto:

### Nunca commitees

| No va al repo | Por qué / qué hacer en su lugar |
|---|---|
| `serviceAccount.json`, `*-firebase-adminsdk-*.json` | Dan control total del proyecto Firebase. Usá `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un archivo local, o Secret Manager. |
| Archivos `.env`, `.env.local`, `.env.production` | Solo se sube `.env.example` con las claves **vacías**. |
| API keys de Anthropic, OpenAI, WhatsApp, Meta, Stripe, etc. | Variables de entorno o Firebase Secret Manager (`firebase functions:secrets:set`). |
| Datos reales de clientes, leads, emails, teléfonos, facturas | Usá datos ficticios en seeds, fixtures, tests, capturas y documentación. |
| Exportaciones (`.csv`, `.xlsx`, dumps de Firestore), backups | Fuera del repo (ya están en `.gitignore`). |
| IDs de proyecto reales de Firebase en documentación | Usá `tu-proyecto-id` o `crm-agencia-demo`. |
| Capturas de pantalla con la consola de Firebase, tokens o datos de clientes | Censurá o no las subas. |
| Credenciales de clientes de la agencia (accesos a sus cuentas) | Jamás, en ningún formato, ni en comentarios. |

### Sobre la config web de Firebase (`apiKey`, `authDomain`, `appId`…)

No es un secreto: viaja en el bundle del navegador y Google lo documenta como
información pública. **Pero** identifica el proyecto, así que en este repo:

- Se carga desde variables de entorno (`VITE_FIREBASE_*`), no hardcodeada.
- La seguridad real la dan las **Security Rules**, **App Check** y las
  **restricciones de la API key** en Google Cloud Console — nunca el ocultamiento.

### Antes de cada commit

```powershell
git diff --cached
```

Revisá el diff línea por línea buscando: claves, tokens, emails reales, teléfonos,
nombres de clientes, IDs de proyecto, URLs internas. Si aparece algo dudoso, **no
commitees y avisá al usuario**.

### Si un secreto ya se publicó

1. **Rotar/revocar la credencial inmediatamente** en Firebase o en el proveedor.
   Es el único paso que realmente protege: el dato ya está expuesto.
2. Recién después limpiar el historial (`git filter-repo` o BFG) y forzar el push.
3. Avisar al usuario de forma explícita.

Un `git rm` o un commit nuevo **no borran** el secreto: sigue en el historial.

---

## 3. Reglas de seguridad en Firebase

- **Nunca** dejar Firestore o Storage en modo abierto (`allow read, write: if true`),
  ni "hasta que esté listo". Las reglas se escriben junto con la feature.
- Toda colección arranca denegando y se abre explícitamente por rol y por dueño del
  dato (`request.auth.uid`, custom claims de rol: `owner`, `admin`, `vendedor`).
- Validar forma y tamaño de los datos en las reglas, no solo en el cliente.
- Lógica sensible (facturación, cambios de rol, integraciones con APIs pagas) va en
  **Cloud Functions**, nunca en el cliente.
- Activar **App Check** antes de pasar a producción.
- Probar las reglas con el **emulador** (`firebase emulators:start`) y con tests,
  nunca contra el proyecto de producción.
- Separar proyectos: `*-dev` y `*-prod`. Los agentes trabajan contra `dev` o el
  emulador por defecto.

---

## 4. Convenciones de trabajo

### Estructura prevista

```
/src            Frontend del CRM
/functions      Cloud Functions
/firestore.rules
/storage.rules
/firestore.indexes.json
/firebase.json
/docs           Documentación del proyecto
```

### Código

- Español para nombres de dominio visibles al usuario (lead, propuesta, cliente) e
  inglés para código y APIs internas; mantené la convención que ya exista en el archivo.
- TypeScript donde sea posible, con tipos explícitos en los modelos de datos.
- Comentarios solo donde el *por qué* no sea obvio.

### Git

- Rama principal: `main`.
- Commits chicos y descriptivos, en imperativo: `agrega pipeline de leads`.
- No reescribir historial ya publicado sin pedirlo explícitamente.

### Comandos útiles

```powershell
firebase emulators:start
```

```powershell
firebase deploy --only firestore:rules
```

---

## 5. Qué debe hacer el agente

1. Leer este archivo y el `README.md` antes de empezar.
2. Preguntar antes de: desplegar a producción, borrar datos, cambiar reglas de
   seguridad de forma permisiva, instalar dependencias pesadas, o publicar algo nuevo
   en el repo público.
3. Trabajar contra el emulador o el proyecto `dev`, no contra producción.
4. Revisar el diff antes de commitear, con la checklist de la sección 2.
5. Reportar con honestidad: si algo no se probó, decirlo.

## 6. Qué NO debe hacer el agente

- Commitear o pushear secretos, datos de clientes o configuración real sensible.
- Desplegar a producción por iniciativa propia.
- Abrir las Security Rules "temporalmente" para que algo funcione.
- Inventar datos de clientes reales en ejemplos: siempre ficticios.
- Subir al repo archivos provenientes del resto de la carpeta `CONFIDENCIAL`.
