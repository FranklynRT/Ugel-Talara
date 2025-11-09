"use client"

import { ColumnDef } from "@tanstack/react-table"

// Este tipo define la forma de nuestros datos.
// También podrías usar un esquema de Zod si quieres.
export type Postulante = {
  id: string
  nombre: string
  correo: string
  estado: "pendiente" | "en revisión" | "aprobado" | "rechazado"
  puntaje: number
}

// Definición de columnas de la tabla
export const columns: ColumnDef<Postulante>[] = [
  {
    accessorKey: "estado",
    header: "Estado",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "correo",
    header: "Correo",
  },
  {
    accessorKey: "puntaje",
    header: "Puntaje",
  },
]
