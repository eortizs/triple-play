"use client"

import { useEffect } from "react"

export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
    if (document.readyState === "complete") {
      registrar()
      return
    }
    window.addEventListener("load", registrar)
    return () => window.removeEventListener("load", registrar)
  }, [])

  return null
}
