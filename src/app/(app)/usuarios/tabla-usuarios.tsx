"use client"

import { useMemo, useState } from "react"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { UserRole } from "@/types/auth"
import type { UsuarioDetalle } from "@/types/domain"
import {
  ColumnDef,
  PaginationState,
  SortingState,
  useTable,
} from "@tanstack/react-table"

const VARIANTE_ROL: Record<UserRole, { texto: string; variante: "primary-light" | "info-light" | "outline" }> = {
  desarrollador: { texto: "Desarrollador", variante: "info-light" },
  propietario: { texto: "Propietario", variante: "primary-light" },
  usuario: { texto: "Usuario", variante: "outline" },
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .map((parte) => parte[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function TablaUsuarios({ usuarios }: { usuarios: UsuarioDetalle[] }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nombre", desc: false },
  ])

  const columns = useMemo<ColumnDef<DataGridFeatures, UsuarioDetalle>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataGridColumnHeader title="Persona" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              <AvatarFallback>{iniciales(row.original.nombre)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{row.original.nombre}</span>
              <span className="truncate text-xs text-muted-foreground">
                @{row.original.username}
              </span>
            </div>
          </div>
        ),
        size: 200,
        enableHiding: false,
        meta: {
          cellClassName: "",
          headerClassName: "",
        },
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <DataGridColumnHeader title="Rol" column={column} />
        ),
        cell: ({ row }) => {
          const rol = VARIANTE_ROL[row.original.role as UserRole]
          return (
            <Badge variant={rol.variante} size="xs">
              {rol.texto}
            </Badge>
          )
        },
        size: 120,
        meta: {
          cellClassName: "",
          headerClassName: "",
        },
      },
      {
        accessorKey: "level",
        header: ({ column }) => (
          <DataGridColumnHeader title="Nivel" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" size="xs" className="tabular-nums">
            Nivel {row.original.level}
          </Badge>
        ),
        size: 90,
        meta: {
          headerClassName: "text-right rtl:text-left [&>div]:justify-end",
          cellClassName: "text-right rtl:text-left",
        },
      },
      {
        accessorKey: "activo",
        header: ({ column }) => (
          <DataGridColumnHeader title="Estado" column={column} />
        ),
        cell: ({ row }) =>
          row.original.activo ? (
            <Badge variant="success-light" size="xs">
              Activo
            </Badge>
          ) : (
            <Badge variant="outline" size="xs">
              Inactivo
            </Badge>
          ),
        size: 100,
        meta: {
          headerClassName: "text-right rtl:text-left [&>div]:justify-end",
          cellClassName: "text-right rtl:text-left",
        },
      },
    ],
    [],
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: usuarios,
    pageCount: Math.max(1, Math.ceil(usuarios.length / pagination.pageSize)),
    getRowId: (row: UsuarioDetalle) => row.id,
    autoResetPageIndex: false,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  return (
    <DataGrid
      table={table}
      recordCount={usuarios.length}
      tableClassNames={{ base: "min-w-[520px]" }}
    >
      <div className="flex w-full flex-col gap-2.5">
        <DataGridContainer>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
        <DataGridPagination />
      </div>
    </DataGrid>
  )
}
