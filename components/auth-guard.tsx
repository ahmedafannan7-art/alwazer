"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const registeredIP = localStorage.getItem("acc_registered_ip")
    if (!registeredIP) {
      router.replace("/login")
      return
    }

    fetch("/api/ip")
      .then((res) => res.json())
      .then((data) => {
        const overrideIP = localStorage.getItem("acc_override_ip")
        const currentIP = data.ip
        const allowedIP = overrideIP || registeredIP

        if (currentIP === allowedIP || registeredIP === "any") {
          setAuthorized(true)
        } else {
          router.replace("/login")
        }
      })
      .catch(() => {
        // If IP check fails, allow access (offline mode)
        setAuthorized(true)
      })
      .finally(() => setChecking(false))
  }, [router])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">جاري التحقق...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}
