"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface NewProjectInput {
  name: string;
  description: string;
  budget: number | null;
}

export function NewProjectDialog({
  clientName,
  onCreate,
}: {
  clientName: string;
  onCreate: (input: NewProjectInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  function reset() {
    setName("");
    setDescription("");
    setBudget("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const parsed = budget.trim() === "" ? null : Number(budget);
    onCreate({
      name,
      description,
      budget: parsed !== null && Number.isFinite(parsed) ? parsed : null,
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus />
          Nuevo proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
            <DialogDescription>
              Se añadirá a {clientName}. Empieza en estado Discovery.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Nombre del proyecto *</Label>
              <Input
                id="project-name"
                required
                autoFocus
                placeholder="Agente de soporte en WhatsApp"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-budget">Presupuesto (€)</Label>
              <Input
                id="project-budget"
                type="number"
                min="0"
                step="100"
                placeholder="12000"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-description">Descripción</Label>
              <Textarea
                id="project-description"
                rows={3}
                placeholder="Alcance, entregables, supuestos…"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Crear proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
