"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  HomeIcon,
  PackageIcon,
  ReceiptTextIcon,
  UsersIcon,
} from "lucide-react"

interface ElementoNav {
  href: string
  etiqueta: string
  icono: "inicio" | "inventario" | "ventas" | "usuarios"
}

const ICONOS = {
  inicio: HomeIcon,
  inventario: PackageIcon,
  ventas: ReceiptTextIcon,
  usuarios: UsersIcon,
} as const

export function NavInferior({ elementos }: { elementos: ElementoNav[] }) {
  const ruta = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex w-full max-w-5xl items-stretch justify-around px-2">
        {elementos.map((elemento) => {
          const Icono = ICONOS[elemento.icono]
          const activo =
            ruta === elemento.href || ruta.startsWith(`${elemento.href}/`)
          return (
            <Button
              key={elemento.href}
              nativeButton={false}
              render={<Link href={elemento.href} />}
              variant={activo ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 flex-col gap-0.5 rounded-none px-2 py-2 text-xs"
              aria-current={activo ? "page" : undefined}
            >
              <Icono className="size-4" aria-hidden="true" />
              {elemento.etiqueta}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
