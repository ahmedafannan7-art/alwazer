"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Eye, History, Package, Printer, User, UserPlus, PlusCircle, Banknote, CreditCard, Pencil, Trash2, MessageCircle, X } from "lucide-react"
import { toast } from "sonner"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false) 
  const [isPrintingReport, setIsPrintingReport] = useState(false)
  
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("نقدي (كاش)")
  const [paymentNotes, setPaymentNotes] = useState("")

  const [newCompany, setNewCompany] = useState("")
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")

  const [clientInvoices, setClientInvoices] = useState<any[]>([])
  const [clientTransactions, setClientTransactions] = useState<any[]>([])
  const [clientsWithBalances, setClientsWithBalances] = useState<any[]>([])

  // حسابات الرصيد الحالي للعميل المفتوح
  const totalInvoicesAmount = clientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalPrice) || 0), 0)
  const totalPaymentsAmount = clientTransactions.filter(t => t.type !== "سحب_شغل").reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  const currentDebt = totalInvoicesAmount - totalPaymentsAmount

  useEffect(() => {
    const saved = localStorage.getItem("system_clients"); 
    if (saved) setClients(JSON.parse(saved))
  }, [])

  // دالة حساب الأرصدة لجميع العملاء
  const calculateClientsBalances = () => {
    const allInvoices = JSON.parse(localStorage.getItem("all_invoices") || "[]")
    const allTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    
    const updatedClients = clients.map(client => {
      const clientInv = allInvoices.filter((inv: any) => inv.customerId === client.id)
      const totalOwed = clientInv.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalPrice || 0), 0)
      
      const clientTrans = allTransactions.filter((t: any) => t.supplierId === client.id && t.type !== "سحب_شغل")
      const totalPaid = clientTrans.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)
      
      const balance = totalOwed - totalPaid
      
      return {
        ...client,
        totalOwed: balance > 0 ? balance : 0,
        totalPaid,
        balance
      }
    })
    
    setClientsWithBalances(updatedClients)
  }

  useEffect(() => {
    if (clients.length > 0) {
      calculateClientsBalances()
    }
  }, [clients])

  // تحديث الأرصدة عند تغيير البيانات من صفحات أخرى
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("system_clients"); 
      if (saved) {
        const updatedClients = JSON.parse(saved)
        setClients(updatedClients)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // --- دالة إعادة حساب أرصدة الموردين/العملاء في الـ LocalStorage ---
  const recalcSuppliers = () => {
    const allSuppliers = JSON.parse(localStorage.getItem("suppliers") || "[]")
    const allInvoices = JSON.parse(localStorage.getItem("all_invoices") || "[]")
    const allTrans = JSON.parse(localStorage.getItem("transactions") || "[]")

    const updatedSuppliers = allSuppliers.map((s: any) => {
      // إجمالي فواتير هذا العميل/المورد
      const personInv = allInvoices.filter((inv: any) => inv.customerId === s.id)
      const totalOwedSum = personInv.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalPrice || 0), 0)

      // إجمالي مدفوعات هذا العميل/المورد
      const personTrans = allTrans.filter((t: any) => t.supplierId === s.id && t.type !== "سحب_شغل")
      const totalPaidSum = personTrans.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)

      // الرصيد الصافي
      const finalBalance = totalOwedSum - totalPaidSum
      return { 
        ...s, 
        totalOwed: finalBalance > 0 ? finalBalance : 0,
        totalPaid: totalPaidSum 
      }
    })

    localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers))
  }

  const handleAddClient = () => {
    if (!newCompany || !newName) return toast.error("برجاء إدخال اسم الشركة واسم المسؤول")
    const newClient = { id: crypto.randomUUID(), company: newCompany, name: newName, phone: newPhone || "لا يوجد" }
    const updatedClients = [newClient, ...clients]
    setClients(updatedClients)
    localStorage.setItem("system_clients", JSON.stringify(updatedClients))

    const allSuppliers = JSON.parse(localStorage.getItem("suppliers") || "[]")
    allSuppliers.push({ id: newClient.id, name: newClient.company, category: "عميل", totalOwed: 0, totalPaid: 0 })
    localStorage.setItem("suppliers", JSON.stringify(allSuppliers))

    toast.success("تم تسجيل العميل بنجاح")
    setIsAddClientOpen(false)
    setNewCompany(""); setNewName(""); setNewPhone("")
  }

  const openEditClient = (client: any) => {
    setSelectedClient(client)
    setNewCompany(client.company)
    setNewName(client.name)
    setNewPhone(client.phone === "لا يوجد" ? "" : client.phone)
    setIsEditClientOpen(true)
  }

  const handleEditClient = () => {
    if (!newCompany || !newName) return toast.error("برجاء إدخال البيانات الأساسية")
    const updatedClients = clients.map(c => c.id === selectedClient.id ? { ...c, company: newCompany, name: newName, phone: newPhone || "لا يوجد" } : c)
    setClients(updatedClients)
    localStorage.setItem("system_clients", JSON.stringify(updatedClients))

    const allSuppliers = JSON.parse(localStorage.getItem("suppliers") || "[]")
    const updatedSuppliers = allSuppliers.map((s:any) => s.id === selectedClient.id ? { ...s, name: newCompany } : s)
    localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers))

    toast.success("تم تحديث بيانات العميل بنجاح")
    setIsEditClientOpen(false)
  }

  const viewDetails = (client: any) => {
    const allInv = JSON.parse(localStorage.getItem("all_invoices") || "[]")
    const allTrans = JSON.parse(localStorage.getItem("transactions") || "[]")
    setClientInvoices(allInv.filter((inv: any) => inv.customerId === client.id))
    setClientTransactions(allTrans.filter((t: any) => t.supplierId === client.id))
    setSelectedClient(client)
    setIsDetailsOpen(true)
  }

  const handleAddPayment = () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) return toast.error("برجاء إدخال مبلغ صحيح")
    const newTrans = {
      id: crypto.randomUUID(), supplierId: selectedClient.id, amount: parseFloat(paymentAmount),
      date: new Date().toLocaleDateString("en-GB"), type: "تنزيل", method: paymentMethod, notes: paymentNotes || "تنزيل من الحساب"
    }
    const allTrans = JSON.parse(localStorage.getItem("transactions") || "[]")
    localStorage.setItem("transactions", JSON.stringify([newTrans, ...allTrans]))
    setClientTransactions([newTrans, ...clientTransactions])
    
    // إعادة حساب الأرصدة العامة بعد الدفع
    recalcSuppliers()
    calculateClientsBalances()

    setIsAddPaymentOpen(false); setPaymentAmount(""); setPaymentNotes(""); setPaymentMethod("نقدي (كاش)")
    toast.success("تم تسجيل التنزيل بنجاح")
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if(!confirm("هل أنت متأكد من حذف الفاتورة؟ سيتم تحديث كل الأرصدة تلقائيًا.")) return;

    // 1️⃣ حذف الفاتورة من المخزن الرئيسي
    const allInv = JSON.parse(localStorage.getItem("all_invoices") || "[]")
    const filteredInv = allInv.filter((inv:any) => inv.id !== invoiceId)
    localStorage.setItem("all_invoices", JSON.stringify(filteredInv))
    
    // 2️⃣ تحديث الواجهة الحالية للعميل
    setClientInvoices(clientInvoices.filter(inv => inv.id !== invoiceId))

    // 3️⃣ إعادة حساب الأرصدة في صفحة الموردين/العملاء
    // أيضاً نظف المعاملات المتعلقة بهذه الفاتورة وارجع الأرصدة للموردين والعملاء
    const allTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    let allSuppliers = JSON.parse(localStorage.getItem("suppliers") || "[]")
    let allClients = JSON.parse(localStorage.getItem("system_clients") || "[]")

    const transactionsToDelete = allTransactions.filter((t: any) => t.invoiceId === invoiceId)
    transactionsToDelete.forEach((t: any) => {
      if (t.supplierId) {
        allSuppliers = allSuppliers.map((s: any) => s.id === t.supplierId ? { ...s, totalOwed: (s.totalOwed || 0) - parseFloat(t.amount) } : s)
      }
      if (t.clientId) {
        allClients = allClients.map((c: any) => c.id === t.clientId ? { ...c, totalOwed: (c.totalOwed || 0) - parseFloat(t.amount) } : c)
      }
      // backward-compat: some places store client transactions under supplierId (client as supplier entry)
      if (!t.clientId && t.supplierId && allClients.findIndex((c:any) => c.id === t.supplierId) !== -1) {
        allClients = allClients.map((c: any) => c.id === t.supplierId ? { ...c, totalOwed: (c.totalOwed || 0) - parseFloat(t.amount) } : c)
      }
    })

    const updatedTransactions = allTransactions.filter((t: any) => t.invoiceId !== invoiceId)

    localStorage.setItem("suppliers", JSON.stringify(allSuppliers))
    localStorage.setItem("system_clients", JSON.stringify(allClients))
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions))

    // حدّث الحالة المحلية لعرض تفاصيل العميل
    setClientTransactions(clientTransactions.filter(t => t.invoiceId !== invoiceId))

    // إعادة حساب الواجهة كذلك
    recalcSuppliers()
    calculateClientsBalances()

    window.dispatchEvent(new Event('storage'))

    toast.success("تم حذف الفاتورة وتحديث أرصدة الموردين والعميل")
  }

  const handleDeletePayment = (transId: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا التنزيل؟ سيعود المبلغ لديون العميل.")) return;
    const allTrans = JSON.parse(localStorage.getItem("transactions") || "[]")
    const filteredTrans = allTrans.filter((t: any) => t.id !== transId)
    localStorage.setItem("transactions", JSON.stringify(filteredTrans))
    setClientTransactions(clientTransactions.filter(t => t.id !== transId))
    
    // إعادة حساب الأرصدة العامة بعد حذف الدفعة
    recalcSuppliers()
    calculateClientsBalances()

    toast.success("تم إلغاء التنزيل وإرجاعه للديون")
  }

  const formatMoney = (amount: number) => {
    return parseFloat(amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const sendStatementWhatsApp = () => {
    if (!selectedClient?.phone || selectedClient.phone === "لا يوجد") return toast.error("العميل ليس لديه رقم هاتف مسجل");
    let phone = selectedClient.phone.toString().trim();
    if (phone.startsWith("0")) phone = "2" + phone;
    const today = new Date();
    const formattedDate = `${today.getDate()} / ${today.getMonth() + 1} / ${today.getFullYear()}`;

    let text = `📄 *كشف حساب تفصيلي – مطبعة الوزير*\n`;
    text += `اسم الشركة: ${selectedClient.company}\n`;
    text += `التاريخ: ${formattedDate}\n`;
    text += `────────────────────\n`;
    text += `💰 *الرصيد المستحق:*\n\n`;
    text += `*${formatMoney(currentDebt)}* جنيه مصري\n`;
    text += `────────────────────\n`;

    if (clientInvoices.length > 0) {
      const lastInvoice = clientInvoices[0];
      const engDate = lastInvoice.date.replace(/[٠-٩]/g, (d:any) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
      text += `🧾 *آخر فاتورة:*\n\n`;
      text += `بتاريخ ${engDate}\n\n`;
      text += `بقيمة *${formatMoney(lastInvoice.totalPrice)}* جنيه مصري\n`;
      text += `────────────────────\n`;
    }

    text += `💳 *طرق الدفع المتاحة:*\n▪ *إنستا باي:*\n\n01092201036\n01115538224\n▪ *فودافون كاش:*\n\n01092201036\n▪ *اتصالات كاش:*\n\n01115538224\n────────────────────\nنرجو التكرم بإتمام السداد في أقرب وقت مناسب.\nشاكرين حسن تعاونكم الدائم 🌷`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  const printReport = () => { setIsPrintingReport(true); setTimeout(() => { window.print(); setIsPrintingReport(false); }, 500) }

  if (isPrintingReport) {
    return (
      <div className="p-10 bg-white min-h-screen text-right font-serif" dir="rtl">
        <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-8 text-right">
          <div className="text-right"><h1 className="text-3xl font-black">كشف حساب تفصيلي</h1><p className="text-lg font-bold mt-2 text-slate-600">التاريخ: {new Date().toLocaleDateString("en-GB")}</p></div>
          <div className="text-left"><h2 className="text-3xl font-black text-slate-800 italic">مطبعة الوزير</h2></div>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 text-right">
          <div className="text-right"><p className="text-slate-500 font-bold mb-1 underline">بيانات العميل:</p><h3 className="text-2xl font-black text-blue-900">{selectedClient?.company}</h3><p className="text-xl font-bold mt-2">المسؤول: {selectedClient?.name}</p></div>
          <div className="bg-slate-900 text-white rounded-2xl p-6 text-center shadow-lg"><p className="text-base opacity-80 mb-2 font-bold italic underline">الرصيد المتبقي (الديون)</p><h4 className="text-4xl font-black">{formatMoney(currentDebt)} ج.م</h4></div>
        </div>
        <div className="space-y-10 text-right">
          <div className="text-right"><h4 className="text-xl font-black mb-4 border-r-8 border-blue-600 pr-3">سجل العمليات والطلبيات</h4>
            <table className="w-full border-collapse border-2 border-slate-300 text-base">
              <thead className="bg-slate-100 font-bold italic text-right"><tr><th className="p-3 border border-slate-300 text-right">التاريخ</th><th className="p-3 border border-slate-300 text-right">تفاصيل الشغلانة</th><th className="p-3 border border-slate-300 text-left">التكلفة</th></tr></thead>
              <tbody className="text-right">{clientInvoices.map((inv) => (<tr key={inv.id}><td className="p-3 border border-slate-300 font-bold text-slate-600 w-32 text-center">{inv.date}</td><td className="p-3 border border-slate-300 text-right">{inv.items.map((it:any, i:number) => (<div key={i} className="font-bold">• {it.name} (كمية: {it.qty})</div>))}</td><td className="p-3 border border-slate-300 text-left font-black">{formatMoney(inv.totalPrice)} ج.م</td></tr>))}</tbody>
            </table>
          </div>
          <div className="text-right"><h4 className="text-xl font-black mb-4 border-r-8 border-green-600 pr-3">سجل التنزيلات (المدفوعات)</h4>
            <table className="w-full border-collapse border-2 border-slate-300 text-base">
              <thead className="bg-slate-100 font-bold italic text-right"><tr><th className="p-3 border border-slate-300 text-right w-32">التاريخ</th><th className="p-3 border border-slate-300 text-right w-48">طريقة الدفع</th><th className="p-3 border border-slate-300 text-right">ملاحظات</th><th className="p-3 border border-slate-300 text-left w-48">المبلغ</th></tr></thead>
              <tbody className="text-right">{clientTransactions.filter(t => t.type !== "سحب_شغل").map((t) => (<tr key={t.id}><td className="p-3 border border-slate-300 font-bold text-slate-600 text-center">{t.date}</td><td className="p-3 border border-slate-300 text-slate-700 font-bold">{t.method || 'نقدي'}</td><td className="p-3 border border-slate-300 text-slate-600">{t.notes}</td><td className="p-3 border border-slate-300 text-left font-black text-green-700">+{formatMoney(t.amount)} ج.م</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-xl md:text-2xl font-black flex items-center gap-3 text-slate-800"><Building2 className="text-blue-600 w-7 h-7"/> أرشيف الشركات والعملاء</h1>
        <Button onClick={() => { setNewCompany(""); setNewName(""); setNewPhone(""); setIsAddClientOpen(true); }} className="bg-blue-600 hover:bg-blue-700 h-12 w-full md:w-auto px-6 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"><UserPlus className="w-5 h-5"/> إضافة عميل جديد</Button>
      </div>

      <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-6">
          {clientsWithBalances.length === 0 ? (
            <div className="text-center py-16 opacity-30"><User className="w-16 h-16 mx-auto mb-3"/><p className="text-lg font-black">لا يوجد عملاء مسجلين</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientsWithBalances.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded-[0.75rem] border border-slate-100 flex flex-col gap-3 shadow-sm hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <button onClick={() => viewDetails(c)} className="text-left flex-1">
                      <h3 className="font-black text-lg text-blue-700">{c.company}</h3>
                      <p className="text-xs text-slate-500 font-bold mt-1">{c.name} <span className="text-[10px] text-slate-400 block">{c.phone}</span></p>
                    </button>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditClient(c)} className="rounded-lg border-orange-200 text-orange-600 font-bold bg-orange-50 hover:bg-orange-600 hover:text-white transition-all h-9 px-3"><Pencil className="w-4 h-4"/></Button>
                        <Button variant="outline" size="sm" onClick={() => viewDetails(c)} className="rounded-lg border-blue-200 text-blue-600 font-bold bg-blue-50 hover:bg-blue-600 hover:text-white transition-all h-9 px-3"><Eye className="w-4 h-4 ml-1.5"/> فتح</Button>
                      </div>
                      {/* عرض الرصيد */}
                      <div className={`px-3 py-1 rounded-lg text-xs font-black text-center ${c.balance > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {c.balance > 0 ? `دين: ${formatMoney(c.balance)}` : `رصيد: ${formatMoney(Math.abs(c.balance))}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة إضافة عميل */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-6 bg-white border-none shadow-2xl text-right" dir="rtl">
            <DialogHeader className="border-b-2 pb-3 mb-4"><DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2"><UserPlus className="text-blue-600 w-5 h-5"/> تسجيل عميل جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">اسم الشركة أو المحل</Label><Input value={newCompany} onChange={(e)=>setNewCompany(e.target.value)} placeholder="مثال: صيدلية الأمل" className="h-12 font-bold text-base rounded-xl border-2"/></div>
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">اسم المسؤول</Label><Input value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="مثال: د. أحمد محمد" className="h-12 font-bold text-base rounded-xl border-2"/></div>
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">رقم الهاتف (للواتساب)</Label><Input value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} placeholder="01xxxxxxxxx" className="h-12 font-bold text-base rounded-xl border-2 font-mono" dir="ltr"/></div>
                <Button onClick={handleAddClient} className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-md">حفظ بيانات العميل</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل بيانات عميل */}
      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-6 bg-white border-none shadow-2xl text-right" dir="rtl">
            <DialogHeader className="border-b-2 pb-3 mb-4"><DialogTitle className="text-xl font-black text-orange-600 flex items-center gap-2"><Pencil className="w-5 h-5"/> تعديل بيانات العميل</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">اسم الشركة أو المحل</Label><Input value={newCompany} onChange={(e)=>setNewCompany(e.target.value)} className="h-12 font-bold text-base rounded-xl border-2 border-orange-200"/></div>
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">اسم المسؤول</Label><Input value={newName} onChange={(e)=>setNewName(e.target.value)} className="h-12 font-bold text-base rounded-xl border-2 border-orange-200"/></div>
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">رقم الهاتف</Label><Input value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} className="h-12 font-bold text-base rounded-xl border-2 border-orange-200 font-mono" dir="ltr"/></div>
                <Button onClick={handleEditClient} className="w-full h-12 mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl shadow-md">حفظ التعديلات</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة تنزيل رصيد */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-6 bg-white border-none shadow-2xl text-right" dir="rtl">
            <DialogHeader className="border-b-2 pb-3 mb-4"><DialogTitle className="text-xl font-black text-green-700 flex items-center gap-2"><Banknote className="w-5 h-5"/> إضافة تنزيل رصيد</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">المبلغ المدفوع (ج.م)</Label><Input type="number" value={paymentAmount} onChange={(e)=>setPaymentAmount(e.target.value)} placeholder="0.00" className="h-14 font-black text-2xl text-center rounded-xl border-2 border-green-200 text-green-700 shadow-inner" onFocus={e=>e.target.select()}/></div>
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">طريقة الدفع (المعاملة)</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger className="h-12 font-bold text-base rounded-xl border-2 bg-slate-50"><SelectValue/></SelectTrigger><SelectContent dir="rtl"><SelectItem value="نقدي (كاش)">💵 نقدي (كاش)</SelectItem><SelectItem value="انستاباي (InstaPay)">📱 انستاباي (InstaPay)</SelectItem><SelectItem value="فودافون كاش">🔴 فودافون كاش</SelectItem><SelectItem value="تحويل بنكي">🏦 تحويل بنكي</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="font-bold text-slate-700 text-sm">ملاحظات (اختياري)</Label><Input value={paymentNotes} onChange={(e)=>setPaymentNotes(e.target.value)} placeholder="مثال: دفعة تحت الحساب..." className="h-11 font-medium rounded-xl border-2 text-sm"/></div>
                <Button onClick={handleAddPayment} className="w-full h-12 mt-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-md">تأكيد التنزيل ✅</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* نافذة ملف العميل العملاقة */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent 
          onInteractOutside={(e) => e.preventDefault()} 
          className="w-full max-w-screen-xl h-[95vh] overflow-hidden rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-200 shadow-lg bg-white text-right flex flex-col gap-4"
        >
          {/* الهيدر العلوي */}
          <div className="bg-slate-900 p-4 md:p-6 text-white relative text-right rounded-xl shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 z-50 text-white/60 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"><X className="w-6 h-6"/></Button>

            {/* Client info */}
            <div className="text-right">
              <DialogTitle className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight">{selectedClient?.company || "ملف العميل"}</DialogTitle>
              <p className="text-blue-300 font-medium flex items-center gap-2 mt-2 text-sm md:text-base"><User className="w-4 h-4"/> <span className="font-bold">{selectedClient?.name}</span> <span className="text-slate-400">|</span> <span className="font-mono">{selectedClient?.phone}</span></p>
            </div>
          </div>

          {/* البوكس منفرد في الأعلى */}
          <div className="flex justify-center shrink-0">
            <div className="bg-slate-800 p-4 md:p-6 rounded-2xl border-2 border-slate-700 w-full max-w-sm md:max-w-md flex flex-col justify-center items-center">
              <div className="bg-slate-900 rounded-xl p-4 w-full border border-slate-800">
                <p className="text-xs font-bold opacity-80 mb-2 uppercase tracking-widest text-slate-300 text-center">
                  {currentDebt > 0 ? "الرصيد المستحق (الديون)" : "الرصيد الزائد (الائتمان)"}
                </p>
                <h3 className={`text-2xl md:text-3xl lg:text-4xl font-black font-mono text-center ${currentDebt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatMoney(Math.abs(currentDebt))} <span className="text-sm md:text-base font-normal">ج.م</span>
                </h3>
                <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400 text-center space-y-1">
                  <p>فواتير: {clientInvoices.length} | مدفوعات: {clientTransactions.filter(t => t.type !== "سحب_شغل").length}</p>
                  <p>إجمالي الفواتير: {formatMoney(totalInvoicesAmount)} ج.م</p>
                </div>
              </div>
            </div>
          </div>

          {/* الجداول في الأسفل مع Scroll مستقل */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 text-right">
              
              {/* قسم الفواتير */}
              <Card className="border-none shadow-sm rounded-[1rem] bg-white flex flex-col h-full overflow-hidden border-2 border-slate-100">
                <CardHeader className="bg-slate-50 border-b pb-4 shrink-0 p-4 flex flex-row justify-between items-center">
                  <h4 className="font-black text-lg flex items-center gap-2 text-slate-800"><Package className="w-5 h-5 text-blue-600"/> سجل الطلبات والفواتير</h4>
                </CardHeader>
                <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {clientInvoices.length > 0 ? [...clientInvoices].reverse().map((inv) => (
                    <div key={inv.id} className="bg-white p-4 rounded-[0.75rem] border border-slate-100 flex flex-col gap-3 shadow-sm hover:border-blue-200 transition-all group relative">
                      <Button onClick={() => handleDeleteInvoice(inv.id)} variant="ghost" size="icon" className="absolute top-2 left-2 text-red-300 hover:text-red-600 hover:bg-red-50 h-8 w-8" title="إلغاء الفاتورة"><Trash2 className="w-4 h-4"/></Button>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2 pr-10">
                        <span className="text-slate-500 text-xs font-bold bg-slate-50 px-3 py-1 rounded-md border border-slate-100">{inv.date}</span>
                        <span className="text-blue-700 font-black text-lg">{formatMoney(inv.totalPrice)} ج.م</span>
                      </div>
                      <div className="space-y-2 px-1">
                        {inv.items.map((it:any, i:number) => (
                          <div key={i} className="flex justify-between text-sm font-bold text-slate-700 items-center">
                            <span className="flex items-center gap-2 group-hover:text-blue-900 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {it.name}</span>
                            <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-xs">الكمية: {it.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )) : <div className="text-center py-10 opacity-40"><Package className="w-12 h-12 mx-auto mb-3"/><p className="font-bold text-base">لا يوجد طلبيات</p></div>}
                </CardContent>
              </Card>

              {/* قسم التنزيلات */}
              <Card className="border-none shadow-sm rounded-[1rem] bg-white flex flex-col h-full overflow-hidden border-2 border-slate-100">
                <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row justify-between items-center shrink-0 p-4">
                  <h4 className="font-black text-lg flex items-center gap-2 text-slate-800"><History className="w-5 h-5 text-green-600"/> سجل التنزيلات</h4>
                  <Button onClick={() => setIsAddPaymentOpen(true)} className="bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold h-10 md:h-9 px-5 md:px-4 shadow-sm flex items-center gap-2 text-sm md:text-xs flex-shrink-0">
                    <PlusCircle className="w-4 h-4"/> إضافة تنزيل
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {clientTransactions.filter(t => t.type !== "سحب_شغل").length > 0 ? [...clientTransactions].filter(t => t.type !== "سحب_شغل").reverse().map((t) => (
                    <div key={t.id} className="bg-green-50/50 p-4 rounded-[0.75rem] border border-green-100 flex flex-col gap-3 shadow-sm hover:border-green-300 transition-all relative">
                      <Button onClick={() => handleDeletePayment(t.id)} variant="ghost" size="icon" className="absolute top-2 left-2 text-red-300 hover:text-red-600 hover:bg-red-50 h-8 w-8" title="إلغاء التنزيل"><Trash2 className="w-4 h-4"/></Button>
                      <div className="flex justify-between items-center border-b border-green-100/50 pb-2 pr-10">
                        <span className="text-slate-500 text-xs font-bold bg-white px-3 py-1 rounded-md border border-green-50 shadow-sm">{t.date}</span>
                        <span className="text-green-700 font-black text-lg">+{formatMoney(t.amount)} ج.م</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-800 font-bold bg-green-200/50 px-2.5 py-1 rounded flex items-center gap-1.5 text-xs"><CreditCard className="w-3.5 h-3.5"/> {t.method || 'نقدي'}</span>
                        <span className="text-slate-500 font-medium text-xs max-w-[150px] truncate">{t.notes}</span>
                      </div>
                    </div>
                  )) : <div className="text-center py-10 opacity-40"><Banknote className="w-12 h-12 mx-auto mb-3 text-green-600"/><p className="font-bold text-base">لم يتم تسجيل أي دفعات</p></div>}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* الفوتر الثابت */}
          <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0 rounded-b-[1.5rem]">
              <div className="flex gap-3 w-full md:w-auto">
                <Button onClick={printReport} className="bg-slate-900 hover:bg-slate-800 font-bold px-6 h-12 rounded-xl text-sm md:text-base shadow-md transition-all text-white flex-1 md:flex-none flex items-center justify-center gap-2"><Printer className="w-5 h-5"/> طباعة التقرير</Button>
                <Button onClick={sendStatementWhatsApp} className="bg-green-600 hover:bg-green-700 font-bold px-6 h-12 rounded-xl text-sm md:text-base shadow-md transition-all text-white flex-1 md:flex-none flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5"/> إرسال واتساب</Button>
              </div>
              <Button onClick={()=>setIsDetailsOpen(false)} variant="ghost" className="text-slate-500 font-bold text-base hover:bg-slate-100 rounded-xl px-8 h-12 w-full md:w-auto">إغلاق الملف</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}