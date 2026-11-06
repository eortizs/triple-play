"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { crearVentaAccion } from "./acciones"
import { CircleAlertIcon, PlusIcon, Trash2Icon } from "lucide-react"
import type { MetodoPago, Producto } from "@/types/domain"

interface Renglon {
  productoId: string
  cantidad: number
}

export function NuevaVentaDialog({ productos }: { productos: Producto[] }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [renglones, setRenglones] = useState<Renglon[]>([])
  const [productoId, setProductoId] = useState<string>("")
  const [cantidad, setCantidad] = useState("1")
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo")
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciarTransicion] = useTransition()

  const agregarRenglon = () => {
    const numero = Number(cantidad)
    if (!productoId) {
      setError("Selecciona un producto")
      return
    }
    if (!Number.isInteger(numero) || numero <= 0) {
      setError("La cantidad debe ser un entero mayor a cero")
      return
    }
    setError(null)
    setRenglones((renglones) => [
      ...renglones,
      { productoId, cantidad: numero },
    ])
    setProductoId("")
    setCantidad("1")
  }

  const registrar = () => {
    if (renglones.length === 0) {
      setError("Agrega al menos un producto a la venta")
      return
    }
    setError(null)
    iniciarTransicion(async () => {
      const resultado = await crearVentaAccion({
        items: renglones,
        metodoPago,
        estado: "completada",
      })
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo registrar la venta")
        return
      }
      toast.success("Venta registrada")
      setRenglones([])
      setMetodoPago("efectivo")
      setAbierto(false)
      router.refresh()
    })
  }

  const nombreProducto = (id: string) =>
    productos.find((producto) => producto.id === id)?.nombre ?? id

  const opcionesProductos = productos.map((producto) => ({
    value: producto.id,
    label: producto.nombre,
  }))

  const opcionesPago = [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia" },
  ]

  return (
    <Dialog
      open={abierto}
      onOpenChange={(valor) => {
        setAbierto(valor)
        if (!valor) setError(null)
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon aria-hidden="true" />
        Nueva venta
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar venta</DialogTitle>
          <DialogDescription>
            Agrega los productos vendidos y registra el cobro.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="producto">Producto</Label>
            <Select
              items={opcionesProductos}
              value={productoId === "" ? null : productoId}
              onValueChange={(valor) => {
                if (valor !== null) setProductoId(valor)
              }}
            >
              <SelectTrigger id="producto" className="w-full">
                <SelectValue placeholder="Elige un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((producto) => (
                  <SelectItem key={producto.id} value={producto.id}>
                    {producto.nombre} · {producto.stock} pzs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="grid w-24 gap-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                min={1}
                step={1}
                value={cantidad}
                onChange={(evento) => setCantidad(evento.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={agregarRenglon}
              className="mb-[2px]"
            >
              <PlusIcon aria-hidden="true" />
              Agregar
            </Button>
          </div>
          {renglones.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {renglones.map((renglon, indice) => (
                <li
                  key={`${renglon.productoId}-${indice}`}
                  className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                >
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {nombreProducto(renglon.productoId)}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    ×{renglon.cantidad}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar ${nombreProducto(renglon.productoId)}`}
                    onClick={() =>
                      setRenglones((renglones) =>
                        renglones.filter((_, i) => i !== indice),
                      )
                    }
                  >
                    <Trash2Icon className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="metodo">Método de pago</Label>
            <Select
              items={opcionesPago}
              value={metodoPago}
              onValueChange={(valor) => {
                if (valor !== null) setMetodoPago(valor as MetodoPago)
              }}
            >
              <SelectTrigger id="metodo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <CircleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter className="mt-6">
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Cancelar
          </DialogClose>
          <Button size="sm" onClick={registrar} disabled={pendiente}>
            {pendiente ? "Registrando…" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
