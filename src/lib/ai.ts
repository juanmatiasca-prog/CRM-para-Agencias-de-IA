/**
 * Resumen de la actividad de un cliente con Gemini, vía Firebase AI Logic.
 *
 * El modelo se llama DESDE EL NAVEGADOR: Firebase AI Logic actúa de pasarela,
 * así que no hace falta backend propio ni guardar una clave de API en el
 * cliente. La cuota la protege el propio proyecto de Firebase.
 *
 * MODELO. `gemini-3.8-flash` es el Flash estable actual y no exige plan Blaze.
 * No uses `gemini-3.6-flash` ni anteriores: están en proceso de apagado.
 * El nombre vive en una constante para poder cambiarlo de un sitio solo.
 */
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

import {
  checkAppCheckToken,
  ensureAppCheck,
  getFirebaseApp,
  isLocalDevHost,
} from "@/lib/firebase";
import type { Client } from "@/lib/types";

export const GEMINI_MODEL = "gemini-3.8-flash";

/** Número máximo de comentarios que se envían al modelo. */
const MAX_COMMENTS = 200;

/** Recorte por comentario, para que uno larguísimo no coma todo el contexto. */
const MAX_COMMENT_CHARS = 1500;

let modelInstance: ReturnType<typeof getGenerativeModel> | null = null;

function getModel() {
  if (!modelInstance) {
    // App Check esta impuesto sobre AI Logic en este proyecto: sin token, el
    // modelo responde 403. Tiene que quedar inicializado ANTES de `getAI`.
    ensureAppCheck();

    const ai = getAI(getFirebaseApp(), {
      backend: new GoogleAIBackend(),
      // Los modelos generativos exigen proteccion contra reenvio con tokens de
      // un solo uso. Sin esto la llamada falla con "you must enforce Firebase
      // App Check" aunque App Check este configurado.
      useLimitedUseAppCheckTokens: true,
    });
    modelInstance = getGenerativeModel(ai, {
      model: GEMINI_MODEL,
      generationConfig: {
        candidateCount: 1,
        maxOutputTokens: 1024,
        // Temperatura baja: esto es un resumen de hechos, no un texto creativo.
        temperature: 0.2,
        topP: 0.95,
      },
    });
  }
  return modelInstance;
}

/** Cuenta los comentarios de todos los proyectos de un cliente. */
export function countClientComments(client: Client): number {
  return client.projects.reduce(
    (total, project) => total + project.comments.length,
    0,
  );
}

/**
 * Construye el texto que se envía al modelo.
 *
 * Los comentarios van agrupados por proyecto y en orden cronológico, para que
 * el modelo pueda hablar de evolución y no solo de contenido.
 */
function buildTranscript(client: Client): string {
  const lines: string[] = [];

  lines.push(`Cliente: ${client.name}`);
  if (client.company) lines.push(`Empresa: ${client.company}`);
  if (client.industry) lines.push(`Sector: ${client.industry}`);
  lines.push(`Estado: ${client.status}`);
  if (client.notes) lines.push(`Notas internas: ${client.notes}`);
  lines.push("");

  let used = 0;

  for (const project of client.projects) {
    lines.push(`--- Proyecto: ${project.name} (estado: ${project.status}) ---`);
    if (project.description) lines.push(`Descripción: ${project.description}`);

    if (project.comments.length === 0) {
      lines.push("(sin comentarios)");
      lines.push("");
      continue;
    }

    for (const comment of project.comments) {
      if (used >= MAX_COMMENTS) break;
      const fecha = comment.createdAt ? comment.createdAt.slice(0, 10) : "sin fecha";
      const body = comment.body.slice(0, MAX_COMMENT_CHARS);
      lines.push(`[${fecha}] ${comment.author}: ${body}`);
      used += 1;
    }
    lines.push("");
  }

  if (used >= MAX_COMMENTS) {
    lines.push(
      `(Se han incluido los primeros ${MAX_COMMENTS} comentarios; hay más sin incluir.)`,
    );
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `Eres un analista de una agencia que desarrolla soluciones de inteligencia artificial. Resumes la actividad registrada con un cliente para que cualquiera del equipo se ponga al día en un minuto.

Escribe en español de España, en tono directo y profesional, sin adornos ni lenguaje comercial.

Estructura la respuesta en Markdown con estas secciones, y omite cualquiera que no tenga contenido real:

## Situación
Dos o tres frases sobre en qué punto está el cliente.

## Por proyecto
Una viñeta por proyecto con su estado y lo último relevante.

## Acuerdos y compromisos
Lo que se ha prometido o acordado, con fechas si constan.

## Pendiente
Tareas abiertas y próximos pasos.

## Señales de riesgo
Retrasos, silencios, cambios de alcance o cualquier aviso. Omite esta sección si no hay nada.

Reglas estrictas:
- Básate ÚNICAMENTE en los comentarios proporcionados. No inventes hechos, fechas, cifras ni nombres.
- Si la información es escasa, dilo abiertamente en lugar de rellenar.
- No repitas los comentarios uno a uno: sintetiza.
- Nada de introducciones del tipo "Aquí tienes el resumen". Empieza directamente por la primera sección.`;

/**
 * Pide a Gemini el resumen de los comentarios de un cliente.
 * Lanza un Error con mensaje en castellano si algo falla.
 */
export async function summarizeClient(client: Client): Promise<string> {
  if (countClientComments(client) === 0) {
    throw new Error("Este cliente todavía no tiene comentarios que resumir.");
  }

  // App Check esta impuesto sobre AI Logic. Si no puede emitir un token, la
  // llamada al modelo devolvera un 403 generico que es facil confundir con
  // "el servicio no esta habilitado". Comprobarlo antes permite decir con
  // precision que es lo que falla.
  const appCheckProblem = await checkAppCheckToken();
  if (appCheckProblem) {
    throw new Error(appCheckProblem);
  }

  const prompt = `${SYSTEM_PROMPT}

A continuación, la ficha del cliente y todos sus comentarios:

${buildTranscript(client)}`;

  try {
    const result = await getModel().generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) {
      throw new Error("El modelo devolvió una respuesta vacía.");
    }
    return text;
  } catch (cause) {
    // En local se vuelca el error tal cual lo devuelve el servicio. Los
    // mensajes traducidos de abajo son para la persona que usa la app, pero
    // al depurar hacen falta el codigo y el texto originales: ya ocurrio una
    // vez que un 403 se interpretara como el problema equivocado.
    if (isLocalDevHost()) {
      console.error("[IA] Error sin traducir del servicio:", cause);
    }
    throw new Error(aiErrorMessage(cause));
  }
}

/** Traduce los fallos típicos de Firebase AI Logic a algo accionable. */
export function aiErrorMessage(cause: unknown): string {
  const raw =
    cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";

  if (/App Check/i.test(raw)) {
    return "El modelo exige App Check. Hay que configurarlo en la consola de Firebase antes de usar el resumen.";
  }
  if (/appCheck|app-check/i.test(raw)) {
    return "App Check rechazó la petición. Revisa que el token de depuración de este navegador esté registrado en la consola de Firebase.";
  }
  if (/PERMISSION_DENIED|403/i.test(raw)) {
    // Un 403 aqui tiene dos causas posibles y conviene nombrar las dos: culpar
    // solo a AI Logic manda a buscar el problema donde casi nunca esta.
    return "El servicio rechazó la petición (403). Suele ser App Check sin token válido para este navegador; si no, que Firebase AI Logic no esté habilitado en el proyecto.";
  }
  // Un 429 tiene dos lecturas muy distintas y conviene separarlas: esperar no
  // arregla la falta de saldo.
  if (/prepayment credits|billing/i.test(raw)) {
    return "El proyecto se ha quedado sin crédito para la API de Gemini. Hay que recargarlo o activar la facturación en AI Studio (ai.studio/projects). Esperar no lo resuelve.";
  }
  if (/quota|RESOURCE_EXHAUSTED|429/i.test(raw)) {
    return "Se alcanzó el límite de peticiones del modelo. Espera un minuto y vuelve a intentarlo.";
  }
  if (/not found|404/i.test(raw)) {
    return `El modelo "${GEMINI_MODEL}" no está disponible en este proyecto.`;
  }
  if (/network|fetch/i.test(raw)) {
    return "No hay conexión con el servicio de IA.";
  }
  return raw || "No se pudo generar el resumen.";
}
