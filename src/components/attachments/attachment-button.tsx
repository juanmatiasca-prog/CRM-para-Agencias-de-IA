"use client";

import { useId, useRef } from "react";
import { Loader2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ATTACHMENT_ACCEPT } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Clip que abre el selector de archivos del sistema.
 *
 * El `<input type="file">` va oculto y se dispara desde el boton: es la unica
 * forma de abrir el dialogo nativo del sistema operativo, que es lo que se
 * pidio. El atributo `accept` filtra lo que muestra el dialogo, pero no impide
 * elegir otra cosa: la validacion real esta en `validateFile` y en las reglas.
 */
export function AttachmentButton({
  onFiles,
  busy = false,
  label = "Adjuntar archivo",
  className,
}: {
  onFiles: (files: File[]) => void;
  busy?: boolean;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  return (
    <>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          // Permite volver a elegir el mismo archivo: sin esto el navegador
          // no dispara `change` la segunda vez.
          event.target.value = "";
        }}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            disabled={busy}
            className={cn(className)}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Paperclip />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </>
  );
}
