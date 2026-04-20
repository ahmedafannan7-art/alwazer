"use client"

import { useState, useEffect, useRef } from "react"
import { useSettings, exportAllData, importAllData, clearAllData } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Building2, Wifi, Database, Download, Upload, Trash2, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { data: settings, save: saveSettings, loaded } = useSettings()
  const [currentIP, setCurrentIP] = useState("")
  const [showResetDialog, setShowResetDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [companyName, setCompanyName] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [taxRate, setTaxRate] = useState("")
  const [registeredIP, setRegisteredIP] = useState("")

  useEffect(() => {
    if (loaded) {
      setCompanyName(settings.companyName)
      setCompanyPhone(settings.companyPhone)
      setCompanyAddress(settings.companyAddress)
      setTaxRate(settings.taxRate.toString())
      setRegisteredIP(settings.registeredIP || localStorage.getItem("acc_registered_ip") || "")
    }
  }, [loaded, settings])

  useEffect(() => {
    fetch("/api/ip")
      .then((res) => res.json())
      .then((data) => setCurrentIP(data.ip))
      .catch(() => setCurrentIP("غير متاح"))
  }, [])

  function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault()
    saveSettings({
      ...settings,
      companyName: companyName.trim(),
      companyPhone: companyPhone.trim(),
      companyAddress: companyAddress.trim(),
      taxRate: parseFloat(taxRate) || 15,
    })
    toast.success("تم حفظ بيانات الشركة")
  }

  function handleUpdateIP() {
    if (!registeredIP.trim() && registeredIP !== "any") {
      toast.error("يرجى ادخال عنوان IP")
      return
    }
    localStorage.setItem("acc_registered_ip", registeredIP.trim())
    saveSettings({ ...settings, registeredIP: registeredIP.trim() })
    toast.success("تم تحديث عنوان IP المسجل")
  }

  function handleUseCurrentIP() {
    if (!currentIP || currentIP === "غير متاح") return
    setRegisteredIP(currentIP)
    localStorage.setItem("acc_registered_ip", currentIP)
    saveSettings({ ...settings, registeredIP: currentIP })
    toast.success("تم تسجيل عنوان IP الحالي")
  }

  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `accounting-backup-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("تم تصدير البيانات بنجاح")
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      if (importAllData(content)) {
        toast.success("تم استيراد البيانات بنجاح - يرجى تحديث الصفحة")
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error("فشل في استيراد البيانات - تاكد من صحة الملف")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function handleReset() {
    clearAllData()
    localStorage.removeItem("acc_registered_ip")
    localStorage.removeItem("acc_override_ip")
    toast.success("تم مسح جميع البيانات")
    setShowResetDialog(false)
    setTimeout(() => window.location.reload(), 1000)
  }

  if (!loaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">الاعدادات</h1>
        <p className="text-sm text-muted-foreground">ادارة اعدادات النظام وبيانات الشركة</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              بيانات الشركة
            </CardTitle>
            <CardDescription>معلومات الشركة التي تظهر في الفواتير</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompany} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>اسم الشركة</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>رقم الهاتف</Label>
                <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} dir="ltr" className="text-right" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>العنوان</Label>
                <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>نسبة ضريبة القيمة المضافة (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
              <Button type="submit" className="gap-1.5">
                <Save className="h-4 w-4" />
                حفظ التعديلات
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* IP Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-5 w-5" />
              ادارة IP الجهاز
            </CardTitle>
            <CardDescription>تحكم في الاجهزة المسموح لها بالوصول</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="text-xs text-muted-foreground">عنوان IP الحالي</p>
                <p className="font-mono text-sm font-semibold" dir="ltr">{currentIP || "جاري التحميل..."}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleUseCurrentIP} className="gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                استخدام الحالي
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label>عنوان IP المسجل</Label>
              <Input
                value={registeredIP}
                onChange={(e) => setRegisteredIP(e.target.value)}
                dir="ltr"
                className="text-right"
                placeholder="ادخل عنوان IP او اكتب any للسماح لاي جهاز"
              />
              <p className="text-xs text-muted-foreground">
                اكتب &quot;any&quot; للسماح بالوصول من اي جهاز
              </p>
            </div>

            <Button onClick={handleUpdateIP} variant="outline" className="gap-1.5">
              <Save className="h-4 w-4" />
              تحديث IP المسجل
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5" />
              ادارة البيانات
            </CardTitle>
            <CardDescription>تصدير واستيراد وادارة بيانات النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExport} variant="outline" className="gap-1.5">
                <Download className="h-4 w-4" />
                تصدير البيانات (JSON)
              </Button>

              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                استيراد البيانات
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />

              <Button
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setShowResetDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                مسح جميع البيانات
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              جميع البيانات مخزنة محليا في المتصفح (localStorage). يفضل تصدير نسخة احتياطية بشكل دوري.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>مسح جميع البيانات</AlertDialogTitle>
            <AlertDialogDescription>
              هل انت متاكد من مسح جميع البيانات؟ سيتم حذف كل العملاء والفواتير والمصروفات والاعدادات. لا يمكن التراجع عن هذا الاجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>الغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              مسح الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
