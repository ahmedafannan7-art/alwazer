"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Phone, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("system_clients")
    if (saved) setClients(JSON.parse(saved))
  }, [])

  const [name, setName] = useState(""); const [company, setCompany] = useState(""); const [phone, setPhone] = useState("")

  const addClient = () => {
    if (!company) return toast.error("اسم الشركة مطلوب")
    
    const clientId = crypto.randomUUID()
    const newClient = { id: clientId, name, company, phone, createdAt: new Date().toLocaleDateString("ar-EG") }
    
    // 1. حفظ في قائمة العملاء
    const updatedClients = [...clients, newClient]
    setClients(updatedClients)
    localStorage.setItem("system_clients", JSON.stringify(updatedClients))

    // 2. فتح ملف مالي تلقائياً في صفحة الحسابات (Finance)
    const savedSuppliers = JSON.parse(localStorage.getItem("suppliers") || "[]")
    const newFinanceEntry = {
      id: clientId, // نفس المعرف للربط
      name: company, // اسم الشركة هو اللي بيظهر في الحسابات
      category: "زبون",
      totalOwed: 0,
      totalPaid: 0
    }
    localStorage.setItem("suppliers", JSON.stringify([...savedSuppliers, newFinanceEntry]))

    setName(""); setCompany(""); setPhone(""); 
    toast.success("تم تسجيل الشركة وفتح ملف مالي لها بنجاح ✅")
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black flex items-center gap-2 text-slate-800"><Building2 className="text-blue-600"/> قاعدة بيانات العملاء والشركات</h1>
        <Button onClick={addClient} className="bg-blue-600 font-bold px-8 h-12 shadow-lg">+ تسجيل تعاقد جديد</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* فورم الإضافة السريع */}
        <Card className="rounded-[2rem] border-none shadow-sm h-fit">
          <CardHeader><CardTitle className="text-lg font-black italic">بيانات الشركة الجديدة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-1"><Label>اسم الشركة / المحل</Label><Input value={company} onChange={(e)=>setCompany(e.target.value)} placeholder="مثلاً: مطعم المدينة"/></div>
             <div className="space-y-1"><Label>اسم المسؤول</Label><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="مثلاً: أ/ محمد"/></div>
             <div className="space-y-1"><Label>رقم التليفون</Label><Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="010..."/></div>
             <Button onClick={addClient} className="w-full bg-slate-900 h-12 font-bold mt-2">تأكيد التسجيل</Button>
          </CardContent>
        </Card>

        {/* جدول العرض */}
        <Card className="md:col-span-2 rounded-[2rem] border-none shadow-sm overflow-hidden">
          <table className="w-full text-right bg-white">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b text-xs">
              <tr><th className="p-5">اسم الشركة</th><th className="p-5">المسؤول</th><th className="p-5 text-center">حذف</th></tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="p-5 font-black text-blue-700">{c.company}</td>
                  <td className="p-5 font-bold">{c.name}</td>
                  <td className="p-5 text-center"><Button variant="ghost" size="icon"><Trash2 className="text-red-300 w-4"/></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}