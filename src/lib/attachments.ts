/**
 * Archivos adjuntos: subida a Cloud Storage y metadatos en Firestore.
 *
 * Cada adjunto vive en dos sitios:
 *
 *   - El fichero, en Storage, bajo `users/{uid}/...` espejo de la jerarquia
 *     de Firestore. Lo protege `storage.rules`.
 *   - Sus metadatos, en una subcoleccion `attachments` del cliente, del
 *     proyecto o del comentario. Los protege `firestore.rules`.
 *
 * Se sube primero el fichero y despues se registra el metadato: si la subida
 * falla, no queda una ficha apuntando a un archivo inexistente. El caso
 * contrario (fichero subido y metadato fallido) deja un huerfano en el bucket,
 * que es el fallo menos dañino de los dos.
 *
 * Las URL de descarga NO se guardan: se piden a Firebase al usarlas, para que
 * cada acceso pase por las reglas.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { getDb, getStorageBucket } from "@/lib/firebase";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  type Attachment,
  type AttachmentOwner,
} from "@/lib/types";

// ---------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------

/** Segmentos de la ruta del dueno, compartidos por Firestore y Storage. */
function ownerSegments(uid: string, owner: AttachmentOwner): string[] {
  switch (owner.kind) {
    case "client":
      return ["users", uid, "clients", owner.clientId];
    case "project":
      return [
        "users",
        uid,
        "clients",
        owner.clientId,
        "projects",
        owner.projectId,
      ];
    case "comment":
      return [
        "users",
        uid,
        "clients",
        owner.clientId,
        "projects",
        owner.projectId,
        "comments",
        owner.commentId,
      ];
  }
}

function attachmentsCol(uid: string, owner: AttachmentOwner) {
  const [first, ...rest] = [...ownerSegments(uid, owner), "attachments"];
  return collection(getDb(), first, ...rest);
}

/**
 * Limpia el nombre para usarlo en una ruta de Storage. Conserva algo legible
 * sin arrastrar barras, acentos ni caracteres que compliquen la URL.
 */
function safeFileName(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (normalized || "archivo").slice(0, 80);
}

// ---------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------

function toIso(value: unknown): string {
  if (!value) return "";
  const stamp = value as Timestamp;
  if (typeof stamp.toDate !== "function") return "";
  return stamp.toDate().toISOString();
}

function toAttachment(snapshot: QueryDocumentSnapshot<DocumentData>): Attachment {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: (data.name as string) ?? "",
    path: (data.path as string) ?? "",
    contentType: (data.contentType as string) ?? "",
    size: (data.size as number) ?? 0,
    createdAt: toIso(data.createdAt),
  };
}

// ---------------------------------------------------------------
// Validacion previa
// ---------------------------------------------------------------

/**
 * Comprueba el archivo antes de gastar ancho de banda. Las reglas vuelven a
 * comprobarlo en el servidor: esto solo sirve para dar un error inmediato y
 * claro, no es la barrera de seguridad.
 */
export function validateFile(file: File): string | null {
  if (file.size === 0) {
    return `"${file.name}" está vacío.`;
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `"${file.name}" ocupa ${mb} MB. El máximo son 10 MB.`;
  }
  if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
    return `"${file.name}" es de un tipo no admitido. Se aceptan PDF, documentos de Office, texto e imágenes.`;
  }
  return null;
}

// ---------------------------------------------------------------
// Operaciones
// ---------------------------------------------------------------

export function watchAttachments(
  uid: string,
  owner: AttachmentOwner,
  onData: (attachments: Attachment[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(attachmentsCol(uid, owner), orderBy("createdAt", "asc")),
    (snapshot) => onData(snapshot.docs.map(toAttachment)),
    onError,
  );
}

/** Sube el fichero y registra sus metadatos. Devuelve el id del metadato. */
export async function uploadAttachment(
  uid: string,
  owner: AttachmentOwner,
  file: File,
): Promise<string> {
  const problem = validateFile(file);
  if (problem) throw new Error(problem);

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = [...ownerSegments(uid, owner), `${unique}-${safeFileName(file.name)}`].join("/");

  await uploadBytes(ref(getStorageBucket(), path), file, {
    contentType: file.type,
  });

  const reference = await addDoc(attachmentsCol(uid, owner), {
    name: file.name.slice(0, 255),
    path,
    contentType: file.type.slice(0, 150),
    size: file.size,
    createdAt: serverTimestamp(),
  });

  return reference.id;
}

/** Borra el fichero y su metadato. */
export async function removeAttachment(
  uid: string,
  owner: AttachmentOwner,
  attachment: Attachment,
): Promise<void> {
  try {
    await deleteObject(ref(getStorageBucket(), attachment.path));
  } catch (cause) {
    // Si el fichero ya no existe, seguir adelante y limpiar el metadato:
    // dejarlo seria peor, porque la interfaz mostraria un adjunto roto.
    const code = (cause as { code?: string }).code;
    if (code !== "storage/object-not-found") throw cause;
  }

  const [first, ...rest] = [...ownerSegments(uid, owner), "attachments", attachment.id];
  await deleteDoc(doc(getDb(), first, ...rest));
}

/**
 * Borra todos los adjuntos de una entidad, ficheros incluidos.
 *
 * Se usa al eliminar un cliente, un proyecto o un comentario: ni Firestore ni
 * Storage borran nada en cascada, asi que sin esto quedarian ficheros
 * ocupando el bucket para siempre.
 */
export async function purgeAttachments(
  uid: string,
  owner: AttachmentOwner,
): Promise<void> {
  const snapshot = await getDocs(attachmentsCol(uid, owner));
  for (const document of snapshot.docs) {
    const attachment = toAttachment(document);
    try {
      await deleteObject(ref(getStorageBucket(), attachment.path));
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code !== "storage/object-not-found") throw cause;
    }
    await deleteDoc(document.ref);
  }
}

/** Pide a Firebase la URL de descarga. Cada llamada pasa por las reglas. */
export function attachmentUrl(path: string): Promise<string> {
  return getDownloadURL(ref(getStorageBucket(), path));
}
