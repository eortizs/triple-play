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
import { Filters } from "@/components/reui/filters/filters"
import { createFilterQuery, flattenFilterConditions } from "@/components/reui/filters/filters-query"
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types"
import { Badge } from "@/components/reui/badge"
import type { CategoriaProducto, Producto } from "@/types/domain"
import {
  ColumnDef,
  PaginationState,
  SortingState,
  useTable,
} from "@tanstack/react-table"

const CAMPOS: FilterField[] = [
  { id: "nombre", label: "Producto", type: "text" },
  {
    id: "categoria",
    label: "Categoría",
    type: "select",
    options: [
      { value: "abarrotes", label: "Abarrotes" },
      { value: "bebidas", label: "Bebidas" },
      { value: "snacks", label: "Snacks" },
      { value: "limpieza", label: "Limpieza" },
      { value: "otros", label: "Otros" },
    ],
  },
  { id: "stock", label: "Stock", type: "number" },
]

function aplicarCondiciones(productos: Producto[], query: FilterQuery) {
  const condiciones = flattenFilterConditions(query)
  return productos.filter((producto) =>
    condiciones.every((condicion) => {
      const valores = condicion.values
      switch (condicion.field) {
        case "nombre": {
          const texto = producto.nombre.toLowerCase()
          const valor = String(valores[0] ?? "").toLowerCase()
          if (condicion.operator === "contains")
            return condicion.negated
              ? !texto.includes(valor)
              : texto.includes(valor)
          if (condicion.operator === "not_contains")
            return !texto.includes(valor)
          return !condicion.negated
        }
        case "categoria": {
          const activo = producto.categoria === valores[0]
          return condicion.negated ? !activo : activo
        }
        case "stock": {
          const numero = Number(valores[0])
          switch (condicion.operator) {
            case "is":
              return producto.stock === numero !== condicion.negated
            case "gt":
              return (producto.stock > numero) !== condicion.negated
            case "gte":
              return (producto.stock >= numero) !== condicion.negated
            case "lt":
              return (producto.stock < numero) !== condicion.negated
            case "lte":
              return (producto.stock <= numero) !== condicion.negated
            default:
              return !condicion.negated
          }
        }
        default:
          return !condicion.negated
      }
    }),
  )
}

function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor)
}

export function TablaInventario({ productos }: { productos: Producto[] }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nombre", desc: false },
  ])
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery())

  const filtrados = useMemo(
    () => aplicarCondiciones(productos, query),
    [productos, query],
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, Producto>[]>(
    () => [
      {
        accessorKey: "sku",
        header: ({ column }) => (
          <DataGridColumnHeader title="SKU" column={column} />
        ),
        cell: (info) => (
          <span className="text-muted-foreground tabular-nums">
            {info.getValue() as string}
          </span>
        ),
        size: 90,
        enableHiding: false,
        meta: {
          cellClassName: "",
          headerClassName: "",
        },
      },
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataGridColumnHeader title="Producto" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.nombre}</span>
            {row.original.atributos.marca ? (
              <span className="text-xs text-muted-foreground">
                {row.original.atributos.marca}
              </span>
            ) : null}
          </div>
        ),
        size: 220,
        meta: {
          cellClassName: "",
          headerClassName: "",
        },
      },
      {
        accessorKey: "categoria",
        header: ({ column }) => (
          <DataGridColumnHeader title="Categoría" column={column} />
        ),
        cell: ({ row }) => {
          const categoria = row.original.categoria as CategoriaProducto
          const etiquetas: Record<CategoriaProducto, string> = {
            abarrotes: "Abarrotes",
            bebidas: "Bebidas",
            snacks: "Snacks",
            limpieza: "Limpieza",
            otros: "Otros",
          }
          return (
            <Badge variant="outline" size="xs">
              {etiquetas[categoria]}
            </Badge>
          )
        },
        size: 110,
        meta: {
          cellClassName: "",
          headerClassName: "",
        },
      },
      {
        accessorKey: "precio",
        header: ({ column }) => (
          <DataGridColumnHeader title="Precio" column={column} />
        ),
        cell: (info) => (
          <span className="tabular-nums">{formatearMoneda(info.getValue() as number)}</span>
        ),
        size: 100,
        meta: {
          headerClassName: "text-right rtl:text-left [&>div]:justify-end",
          cellClassName: "text-right rtl:text-left",
        },
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <DataGridColumnHeader title="Stock" column={column} />
        ),
        cell: ({ row }) => {
          const bajo = row.original.stock <= row.original.minStock
          return (
            <Badge
              variant={bajo ? "warning-light" : "success-light"}
              size="xs"
              className="tabular-nums"
            >
              {row.original.stock} pzs
            </Badge>
          )
        },
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
    data: filtrados,
    pageCount: Math.max(1, Math.ceil(filtrados.length / pagination.pageSize)),
    getRowId: (row: Producto) => row.id,
    autoResetPageIndex: false,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  return (
    <DataGrid
      table={table}
      recordCount={filtrados.length}
      tableClassNames={{ base: "min-w-[640px]" }}
    >
      <div className="flex w-full flex-col gap-2.5">
        <Filters fields={CAMPOS} query={query} onQueryChange={setQuery} size="sm" />
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
