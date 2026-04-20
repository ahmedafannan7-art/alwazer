"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Monitor, Shield, Wifi } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [currentIP, setCurrentIP] = useState("")
  const [manualIP, setManualIP] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    fetch("/api/ip")
      .then((res) => res.json())
      .then((data) => {
        setCurrentIP(data.ip)
        setLoading(false)

        // Auto-login if already registered
        const registeredIP = localStorage.getItem("acc_registered_ip")
        if (registeredIP && (registeredIP === data.ip || registeredIP === "any")) {
          router.replace("/dashboard")
        }
      })
      .catch(() => {
        setCurrentIP("غير متاح")
        setLoading(false)
      })
  }, [router])

  function handleRegister() {
    if (!currentIP || currentIP === "غير متاح") {
      setError("لا يمكن تحديد عنوان IP الخاص بك")
      return
    }
    localStorage.setItem("acc_registered_ip", currentIP)
    router.replace("/dashboard")
  }

  function handleManualLogin() {
    if (!manualIP.trim()) {
      setError("يرجى ادخال عنوان IP")
      return
    }
    localStorage.setItem("acc_registered_ip", manualIP.trim())
    router.replace("/dashboard")
  }

  function handleSkipAuth() {
    localStorage.setItem("acc_registered_ip", "any")
    router.replace("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[oklch(0.22_0.04_240)] to-[oklch(0.14_0.02_240)] p-4">
      <Card className="w-full max-w-md border-sidebar-border bg-sidebar text-sidebar-foreground">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold">نظام المحاسبة</CardTitle>
          <CardDescription className="text-sidebar-foreground/60">
            تسجيل الدخول عبر عنوان IP الخاص بجهازك
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Current IP Display */}
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
              <Wifi className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-sidebar-foreground/60">عنوان IP الحالي</p>
              <p className="font-mono text-sm font-semibold" dir="ltr">
                {loading ? "جاري التحميل..." : currentIP}
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Register with current IP */}
          <Button
            onClick={handleRegister}
            disabled={loading}
            className="h-12 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Monitor className="ml-2 h-4 w-4" />
            تسجيل الدخول بهذا الجهاز
          </Button>

          {/* Manual IP Entry */}
          {showManual ? (
            <div className="flex flex-col gap-3 rounded-lg border border-sidebar-border p-4">
              <Label className="text-sm text-sidebar-foreground/80">
                ادخال عنوان IP يدويا
              </Label>
              <Input
                value={manualIP}
                onChange={(e) => setManualIP(e.target.value)}
                placeholder="192.168.1.1"
                dir="ltr"
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
              />
              <Button onClick={handleManualLogin} variant="outline" className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
                تسجيل الدخول
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowManual(true)}
              variant="ghost"
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              ادخال عنوان IP يدويا
            </Button>
          )}

          {/* Skip Auth */}
          <Button
            onClick={handleSkipAuth}
            variant="link"
            className="text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
          >
            تخطي التحقق (السماح لاي جهاز)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
