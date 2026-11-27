"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GEMINI_MODEL, countClientComments, summarizeClient } from "@/lib/ai";
import type { Client } from "@/lib/types";

/**
 * Pinta el Markdown que devuelve el modelo sin traer una dependencia entera.
 *
 * El prompt pide una estructura concreta y acotada: encabezados `##`, viñetas
 * y negritas. Con eso basta, y evita cargar un parser completo de Markdown
 * para seis lineas de formato.
 */
function SummaryText({ text }: { text: string }) {
  const blocks = text.split("\n");

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {blocks.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          return (
            <h4
              key={index}
              className="mt-3 font-heading text-sm font-semibold first:mt-0"
            >
              {trimmed.slice(3)}
            </h4>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <p key={index} className="flex gap-2 text-muted-foreground">
              <span aria-hidden className="text-foreground">
                ·
              </span>
              <span className="min-w-0 flex-1">{inline(trimmed.slice(2))}</span>
            </p>
          );
        }

        return (
          <p key={index} className="text-muted-foreground text-pretty">
            {inline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Resuelve negritas y cursivas dentro de una linea.
 *
 * El orden del patron importa: `**` tiene que probarse antes que `*`, o el
 * primer asterisco de una negrita se tomaria por una cursiva y el texto
 * acabaria con asteriscos sueltos en pantalla.
 */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part}</span>;
  });
}

export function ClientSummary({ client }: { client: Client }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const commentCount = countClientComments(client);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const text = await summarizeClient(client);
      setSummary(text);
      setGeneratedAt(
        new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo generar el resumen.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Resumen del cliente
            </CardTitle>
            <CardDescription>
              {commentCount === 0
                ? "Sin comentarios todavía. Añade alguno para poder resumir."
                : `Resume los ${commentCount} comentario${commentCount === 1 ? "" : "s"} de este cliente con Gemini.`}
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant={summary ? "outline" : "default"}
            onClick={generate}
            disabled={loading || commentCount === 0}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : summary ? (
              <RefreshCw />
            ) : (
              <Sparkles />
            )}
            {loading ? "Generando…" : summary ? "Regenerar" : "Generar resumen"}
          </Button>
        </div>
      </CardHeader>

      {(summary || error || loading) && (
        <CardContent className="flex flex-col gap-3">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo generar el resumen</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && !summary && (
            <p className="text-sm text-muted-foreground">
              Leyendo los comentarios y redactando…
            </p>
          )}

          {summary && (
            <>
              <SummaryText text={summary} />
              <p className="border-t pt-3 text-xs text-muted-foreground">
                Generado con {GEMINI_MODEL}
                {generatedAt && ` a las ${generatedAt}`}. Es un resumen
                automático: contrástalo antes de actuar sobre él.
              </p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
