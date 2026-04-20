"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

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
          router.replace("/dashboard")
        } else {
          router.replace("/login")
        }
      })
      .catch(() => {
        // If IP check fails, redirect to login
        router.replace("/login")
      })
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">جاري التحقق...</p>
      </div>
    </div>
  )
}