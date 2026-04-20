"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error("يرجى إدخال الإيميل وكلمة المرور")
      return
    }
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      toast.success("تم تسجيل الدخول بنجاح")
      router.replace("/dashboard")
    } catch (err: any) {
      toast.error(firebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[oklch(0.22_0.04_240)] to-[oklch(0.14_0.02_240)] p-4">
      <Card className="w-full max-w-md border-sidebar-border bg-sidebar text-sidebar-foreground">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
            <Printer className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold">مطبعة الوزير</CardTitle>
          <CardDescription className="text-sidebar-foreground/60">
            تسجيل الدخول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label className="text-sidebar-foreground/80">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground pr-10 placeholder:text-sidebar-foreground/30"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label className="text-sidebar-foreground/80">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/40" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground pr-10 pl-10 placeholder:text-sidebar-foreground/30"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground/80"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-bold mt-2"
            >
              {loading ? "جاري التحميل..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function firebaseError(code: string): string {
  const errors: Record<string, string> = {
    "auth/user-not-found": "لا يوجد حساب بهذا الإيميل",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/invalid-credential": "الإيميل أو كلمة المرور غير صحيحة",
    "auth/invalid-email": "صيغة الإيميل غير صحيحة",
    "auth/too-many-requests": "محاولات كثيرة، حاول مرة أخرى لاحقاً",
    "auth/network-request-failed": "خطأ في الاتصال، تأكد من الإنترنت",
  }
  return errors[code] || "حدث خطأ، حاول مرة أخرى"
}
