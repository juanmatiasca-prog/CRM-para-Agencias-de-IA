"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { AttachmentButton } from "@/components/attachments/attachment-button";
import { AttachmentItem } from "@/components/attachments/attachment-item";
import {
  removeAttachment,
  uploadAttachment,
  validateFile,
  watchAttachments,
} from "@/lib/attachments";
import type { Attachment, AttachmentOwner } from "@/lib/types";

/** Mensaje util a partir de un fallo de Storage o de Firestore. */
function uploadError(cause: unknown): string {
  if (cause instanceof Error && cause.message.includes("MB")) return cause.message;
  const code = (cause as { code?: string }).code;
  if (code === "storage/unauthorized" || code === "permission-denied") {
    return "La subida fue rechazada. Revisa las reglas de Storage.";
  }
  if (code === "storage/retry-limit-exceeded" || code === "storage/canceled") {
    return "La subida se interrumpió. Inténtalo otra vez.";
  }
  if (cause instanceof Error) return cause.message;
  return "No se pudo subir el archivo.";
}

/**
 * Clip y lista de adjuntos de un cliente o de un proyecto.
 *
 * Sube en cuanto se elige el archivo: el cliente y el proyecto ya existen, asi
 * que no hace falta esperar a nada. Para los comentarios el flujo es otro,
 * porque el comentario todavia no existe cuando se elige el fichero.
 */
export function AttachmentsPanel({
  owner,
  title = "Archivos",
  emptyHint,
}: {
  owner: AttachmentOwner;
  title?: string;
  emptyHint?: string;
}) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  // `owner` llega como objeto literal y cambiaria de identidad en cada
  // render, resuscribiendo sin parar. La clave serializada lo evita.
  const ownerKey = JSON.stringify(owner);

  useEffect(() => {
    if (!uid) return;
    const parsed = JSON.parse(ownerKey) as AttachmentOwner;
    return watchAttachments(uid, parsed, setAttachments, () => {
      toast.error("No se pudieron cargar los archivos.");
    });
  }, [uid, ownerKey]);

  const parsedOwner = useMemo(
    () => JSON.parse(ownerKey) as AttachmentOwner,
    [ownerKey],
  );

  async function handleFiles(files: File[]) {
    if (!uid) return;
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of files) {
        const problem = validateFile(file);
        if (problem) {
          toast.error(problem);
          continue;
        }
        await uploadAttachment(uid, parsedOwner, file);
        uploaded += 1;
      }
      if (uploaded > 0) {
        toast.success(
          uploaded === 1 ? "Archivo subido" : `${uploaded} archivos subidos`,
        );
      }
    } catch (cause) {
      toast.error(uploadError(cause));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachment: Attachment) {
    if (!uid) return;
    try {
      await removeAttachment(uid, parsedOwner, attachment);
      toast.success("Archivo eliminado");
    } catch {
      toast.error("No se pudo eliminar el archivo.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">
          {title}
          {attachments.length > 0 && (
            <span className="ml-1.5 font-mono">{attachments.length}</span>
          )}
        </h4>
        <AttachmentButton onFiles={handleFiles} busy={uploading} />
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {emptyHint ?? "Sin archivos. Usa el clip para subir contratos, facturas o capturas."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDelete={() => handleDelete(attachment)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
