"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CircleAlertIcon, LoaderCircleIcon } from "lucide-react"

interface CredencialDemo {
  username: string
  password: string
  nombre: string
  rol: string
}

export function LoginForm({ demoUsuarios }: { demoUsuarios: CredencialDemo[] }) {
  const router = useRouter()
  const parametros = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (usuario: string, contrasena: string) => {
    setEnviando(true)
    setError(null)
    try {
      const respuesta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usuario, password: contrasena }),
      })
      const datos = await respuesta.json()
      if (!respuesta.ok || !datos.ok) {
        setError(datos.error ?? "No se pudo iniciar sesión")
        return
      }
      const destino = parametros.get("from") ?? "/dashboard"
      router.replace(destino.startsWith("/") ? destino : "/dashboard")
      router.refresh()
    } catch {
      setError("Error de red, intenta de nuevo")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Inicia sesión</CardTitle>
        <CardDescription>
          Ingresa con las credenciales de tu cuenta
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          void enviar(username, password)
        }}
      >
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="tu-usuario"
              value={username}
              onChange={(evento) => setUsername(evento.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>No se pudo iniciar sesión</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            Entrar
          </Button>
        </CardFooter>
      </form>
      {demoUsuarios.length > 0 ? (
        <CardFooter className="flex-col items-start gap-2 border-t">
          <p className="text-xs text-muted-foreground">
            Cuentas de demostración (modo maquetación):
          </p>
          <div className="flex w-full flex-wrap gap-2">
            {demoUsuarios.map((cuenta) => (
              <Button
                key={cuenta.username}
                type="button"
                variant="outline"
                size="sm"
                disabled={enviando}
                onClick={() => {
                  setUsername(cuenta.username)
                  setPassword(cuenta.password)
                  void enviar(cuenta.username, cuenta.password)
                }}
              >
                <span className="font-medium">{cuenta.nombre}</span>
                <Badge variant="outline" size="xs" radius="full">
                  {cuenta.rol}
                </Badge>
              </Button>
            ))}
          </div>
        </CardFooter>
      ) : null}
    </Card>
  )
}
