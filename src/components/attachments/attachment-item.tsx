"use client";

import { useEffect, useState } from "react";
import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { attachmentUrl } from "@/lib/attachments";
import type { Attachment } from "@/lib/types";

/** Tamano legible: 847 B, 12,3 KB, 2,1 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(contentType: string) {
  if (contentType.startsWith("image/")) return FileImage;
  if (contentType === "application/pdf" || contentType.startsWith("text/")) {
    return FileText;
  }
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) {
    return FileSpreadsheet;
  }
  return FileIcon;
}

export function AttachmentItem({
  attachment,
  onDelete,
}: {
  attachment: Attachment;
  onDelete?: () => Promise<void> | void;
}) {
  const isImage = attachment.contentType.startsWith("image/");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // La miniatura necesita la URL firmada, que se pide a Firebase y por tanto
  // pasa por las reglas. Solo se hace para imagenes: para un PDF no aporta.
  useEffect(() => {
    if (!isImage) return;
    let alive = true;
    attachmentUrl(attachment.path)
      .then((url) => {
        if (alive) setThumbnail(url);
      })
      .catch(() => {
        // Sin miniatura se muestra el icono. No merece un aviso al usuario.
      });
    return () => {
      alive = false;
    };
  }, [isImage, attachment.path]);

  const Icon = iconFor(attachment.contentType);

  async function open() {
    setWorking(true);
    try {
      const url = await attachmentUrl(attachment.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("No se pudo abrir el archivo.");
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!onDelete) return;
    setWorking(true);
    try {
      await onDelete();
    } finally {
      setWorking(false);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded bg-muted">
        {thumbnail ? (
          // Imagen remota con URL firmada de Storage y vida corta. Se usa
          // <img> en vez de next/image a proposito: el optimizador no aporta
          // nada en un export estatico y obligaria a declarar el dominio.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="size-9 object-cover" />
        ) : (
          <Icon className="size-4 text-muted-foreground" />
        )}
      </span>

      <button
        type="button"
        onClick={open}
        className="min-w-0 flex-1 text-left"
        title={`Abrir ${attachment.name}`}
      >
        <span className="block truncate text-sm font-medium hover:underline">
          {attachment.name}
        </span>
        <span className="block text-xs text-muted-foreground">
          {formatBytes(attachment.size)}
        </span>
      </button>

      {working ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <span className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Abrir ${attachment.name}`}
            onClick={open}
          >
            <Download />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${attachment.name}`}
              onClick={remove}
            >
              <X />
            </Button>
          )}
        </span>
      )}
    </li>
  );
}
