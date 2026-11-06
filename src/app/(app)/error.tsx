"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { CircleAlertIcon } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <CircleAlertIcon />
        <AlertTitle>Algo salió mal</AlertTitle>
        <AlertDescription>
          {error.message || "No se pudieron cargar los datos."}
        </AlertDescription>
        <Button variant="outline" size="sm" onClick={reset}>
          Reintentar
        </Button>
      </Alert>
    </div>
  )
}
