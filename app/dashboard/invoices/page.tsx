"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useClients, useInvoices, useSuppliers } from "@/lib/store"
import { addInvoice, deleteInvoice, addSupplierTransaction, addClientTransaction, deleteSupplierTransaction, deleteClientTransaction, getSupplierTransactions, getClientTransactions } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText, Trash2, Box, Zap, Calculator,
  Building2, CheckCircle2, PlusCircle, Printer,
  MessageCircle, Scissors, TrendingUp, TrendingDown,
  Clock, PlayCircle, XCircle, X, Layers, Sparkles, MoveRight
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Invoice } from "@/lib/types"
import { SUPPLIER_CATEGORIES } from "@/lib/types"

export default function InvoicesPage() {
  const { user } = useAuth()
  const { clients } = useClients()
  const { invoices: savedInvoices, loading: invLoading } = useInvoices()
  const { suppliers } = useSuppliers()

  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [invoiceItems, setInvoiceItems] = useState<any[]>([])
  const [calcOpen, setCalcOpen] = useState(false)
  const [printingInvoice, setPrintingInvoice] = useState<any>(null)
  const [suspendedInvoices, setSuspendedInvoices] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  // ─── Calculator state ────────────────────────────────────────────────────
  const [tempService, setTempService] = useState("")
  const [sheetPrice, setSheetPrice] = useState("0")
  const [sheetCount, setSheetCount] = useState("")
  const [targetQty, setTargetQty] = useState("0")
  const [printPricePer1000, setPrintPricePer1000] = useState("0")
  const [zinkat, setZinkat] = useState("0")
  const [profitMargin, setProfitMargin] = useState("20")
  const [manualPrice, setManualPrice] = useState("")

  const [paperSupId, setPaperSupId] = useState("")
  const [printSupId, setPrintSupId] = useState("")
  const [zinkSupId, setZinkSupId] = useState("")
  const [soloSupId, setSoloSupId] = useState("")
  const [spotSupId, setSpotSupId] = useState("")
  const [basmaSupId, setBasmaSupId] = useState("")
  const [basmaClichéSupId, setBasmaClichéSupId] = useState("")
  const [taksirSupId, setTaksirSupId] = useState("")
  const [taksirStampSupId, setTaksirStampSupId] = useState("")

  const [useSolo, setUseSolo] = useState(false)
  const [useSpot, setUseSpot] = useState(false)
  const [useBasma, setUseBasma] = useState(false)
  const [useTaksir, setUseTaksir] = useState(false)

  const [basmaL, setBasmaL] = useState("0")
  const [basmaW, setBasmaW] = useState("0")
  const [basmaAclashie, setBasmaAclashie] = useState("0")
  const [estambaPrice, setEstambaPrice] = useState("0")
  const [taksirPrice, setTaksirPrice] = useState("0")

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getSuppliersForCategory = (catId: string) =>
    suppliers.filter((s) => s.categoryId === catId)

  const formatMoney = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // ─── Calculator ──────────────────────────────────────────────────────────

  const calculate = () => {
    const sCount = parseFloat(sheetCount) || 0
    const paper = (parseFloat(sheetPrice) || 0) * sCount
    const print = (parseFloat(printPricePer1000) || 0) * (parseFloat(targetQty) || 0)
    const wastage = 3
    const soloRate = 2
    const spotRate = 1.6
    const basmaFactor = 4
    const misc = 50

    const halk = (paper + print) * (wastage / 100)
    const soloCost = useSolo ? soloRate * sCount : 0
    const spotCost = useSpot ? spotRate * sCount : 0
    const taksirTotal = useTaksir ? (parseFloat(estambaPrice) || 0) + (parseFloat(taksirPrice) || 0) : 0
    const basmaCost = useBasma ? parseFloat(basmaL) * parseFloat(basmaW) * basmaFactor : 0
    const basmaTotal = useBasma ? basmaCost + (parseFloat(basmaAclashie) || 0) : 0
    const zinkCost = parseFloat(zinkat) || 0

    const actual = paper + print + halk + soloCost + spotCost + taksirTotal + basmaTotal + zinkCost + misc
    const total = actual * (1 + parseFloat(profitMargin) / 100)

    return { actual, total, paper, print, soloCost, spotCost, basmaCost }
  }

  const res = calculate()
  const currentInvoiceTotal = invoiceItems.reduce((acc, i) => acc + parseFloat(i.total), 0)
  const currentInvoiceActual = invoiceItems.reduce((acc, i) => acc + parseFloat(i.actual), 0)
  const currentInvoiceProfit = currentInvoiceTotal - currentInvoiceActual

  // ─── Add Item ─────────────────────────────────────────────────────────────

  const addItem = () => {
    if (!tempService) return toast.error("برجاء إدخال اسم الصنف")
    const finalPrice = manualPrice && !isNaN(Number(manualPrice))
      ? parseFloat(manualPrice).toFixed(2)
      : res.total.toFixed(2)

    const costs: any = {}
    if (paperSupId) costs.paper = { supplierId: paperSupId, amount: res.paper }
    if (printSupId) costs.print = { supplierId: printSupId, amount: res.print }
    if (zinkSupId) costs.zink = { supplierId: zinkSupId, amount: parseFloat(zinkat) || 0 }
    if (useSolo && soloSupId) costs.solo = { supplierId: soloSupId, amount: res.soloCost }
    if (useSpot && spotSupId) costs.spot = { supplierId: spotSupId, amount: res.spotCost }
    if (useBasma) {
      if (basmaSupId) costs.basma = { supplierId: basmaSupId, amount: res.basmaCost }
      if (basmaClichéSupId) costs.basmaCliché = { supplierId: basmaClichéSupId, amount: parseFloat(basmaAclashie) || 0 }
    }
    if (useTaksir) {
      if (taksirSupId) costs.taksirService = { supplierId: taksirSupId, amount: parseFloat(taksirPrice) || 0 }
      if (taksirStampSupId) costs.taksirStamp = { supplierId: taksirStampSupId, amount: parseFloat(estambaPrice) || 0 }
    }

    setInvoiceItems([...invoiceItems, {
      id: crypto.randomUUID(), name: tempService,
      qty: targetQty, total: finalPrice, actual: res.actual.toFixed(2), suppliersCost: costs
    }])

    setCalcOpen(false); setTempService(""); setSheetCount(""); setTargetQty("0")
    setUseSolo(false); setUseSpot(false); setUseBasma(false); setUseTaksir(false)
    setEstambaPrice("0"); setTaksirPrice("0"); setBasmaAclashie("0"); setManualPrice("")
  }

  // ─── Save Invoice to Firestore ────────────────────────────────────────────

  const saveAndSync = async () => {
    if (invoiceItems.length === 0) return toast.error("الفاتورة فارغة")
    const client = clients.find((c) => c.id === selectedCustomerId)
    if (!client) return toast.error("برجاء اختيار عميل")
    if (!user) return
    setSaving(true)

    try {
      const invoiceDate = new Date().toLocaleDateString("en-GB")
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(savedInvoices.length + 1).padStart(4, "0")}`

      // 1. Save invoice
      const invoiceId = await addInvoice(user.uid, {
        invoiceNumber,
        customerId: selectedCustomerId,
        clientName: client.company,
        date: invoiceDate,
        items: invoiceItems.map((i) => ({
          name: i.name, qty: parseFloat(i.qty) || 0,
          unitPrice: parseFloat(i.total) || 0, cost: parseFloat(i.actual) || 0, total: parseFloat(i.total) || 0
        })),
        totalPrice: currentInvoiceTotal,
        totalCost: currentInvoiceActual,
        createdAt: new Date().toISOString(),
      })

      // 2. Add supplier cost transactions
      for (const item of invoiceItems) {
        for (const [, cost] of Object.entries<any>(item.suppliersCost || {})) {
          if (cost.supplierId && cost.amount > 0) {
            await addSupplierTransaction(user.uid, {
              supplierId: cost.supplierId,
              supplierName: suppliers.find((s) => s.id === cost.supplierId)?.name || "",
              supplierCategoryId: suppliers.find((s) => s.id === cost.supplierId)?.categoryId || "",
              supplierCategoryName: suppliers.find((s) => s.id === cost.supplierId)?.categoryName || "",
              amount: cost.amount,
              date: invoiceDate,
              type: "تكلفة_فاتورة",
              notes: `تكلفة بند [${item.name}] - ${invoiceNumber}`,
              invoiceId,
            })
          }
        }
      }

      // 3. Add client invoice transaction
      await addClientTransaction(user.uid, {
        clientId: selectedCustomerId,
        clientName: client.company,
        amount: currentInvoiceTotal,
        date: invoiceDate,
        type: "فاتورة",
        notes: `فاتورة مبيعات - ${invoiceNumber}`,
        invoiceId,
      })

      setInvoiceItems([]); setSelectedCustomerId("")
      toast.success("تم حفظ الفاتورة وترحيل الديون بنجاح ✅")
    } catch (err) {
      console.error(err)
      toast.error("فشل في حفظ الفاتورة")
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete Invoice ───────────────────────────────────────────────────────

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("هل أنت متأكد من حذف الفاتورة؟ سيتم حذف جميع المعاملات المرتبطة بها.")) return
    if (!user) return
    try {
      await deleteInvoice(user.uid, invoiceId)
      // Delete linked supplier transactions
      const supTxs = await getSupplierTransactions(user.uid)
      for (const tx of supTxs.filter((t) => t.invoiceId === invoiceId)) {
        await deleteSupplierTransaction(user.uid, tx.id)
      }
      // Delete linked client transactions
      const cliTxs = await getClientTransactions(user.uid)
      for (const tx of cliTxs.filter((t) => t.invoiceId === invoiceId)) {
        await deleteClientTransaction(user.uid, tx.id)
      }
      toast.success("تم حذف الفاتورة وجميع المعاملات المرتبطة")
    } catch {
      toast.error("فشل في حذف الفاتورة")
    }
  }

  // ─── Suspend / Resume ─────────────────────────────────────────────────────

  const suspendInvoice = () => {
    if (invoiceItems.length === 0) return toast.error("لا يمكن تعليق فاتورة فارغة")
    setSuspendedInvoices([...suspendedInvoices, {
      id: crypto.randomUUID(), customerId: selectedCustomerId,
      date: new Date().toLocaleString("en-GB"),
      items: invoiceItems, totalPrice: currentInvoiceTotal
    }])
    setInvoiceItems([]); setSelectedCustomerId("")
    toast.success("تم تعليق الفاتورة كمسودة")
  }

  const resumeInvoice = (draft: any) => {
    setInvoiceItems(draft.items); setSelectedCustomerId(draft.customerId)
    setSuspendedInvoices(suspendedInvoices.filter((d) => d.id !== draft.id))
    toast.success("تم استرجاع الفاتورة المعلقة")
  }

  // ─── Print / WhatsApp ─────────────────────────────────────────────────────

  const sendWhatsApp = (inv: any) => {
    const client = clients.find((c) => c.id === inv.customerId)
    if (!client?.phone || client.phone === "لا يوجد") return toast.error("العميل ليس لديه رقم هاتف")
    let phone = client.phone.toString().trim()
    if (phone.startsWith("0")) phone = "2" + phone
    let text = `🧾 *فاتورة مبيعات – مطبعة الوزير*\nالتاريخ: ${inv.date}\nالشركة: ${inv.clientName}\n────────────────────\n*الأصناف:*\n\n`
    inv.items.forEach((item: any) => {
      text += `🔹 ${item.name}\n   (الكمية: ${item.qty}) = ${parseFloat(item.total).toLocaleString()} ج.م\n\n`
    })
    text += `────────────────────\n💰 *الإجمالي: ${parseFloat(inv.totalPrice).toLocaleString()} جنيه مصري*\n\nشكراً لتعاملكم معنا 🌷`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handlePrint = (inv: any) => {
    setPrintingInvoice(inv); setTimeout(() => { window.print(); setPrintingInvoice(null) }, 500)
  }

  // ─── Print View ───────────────────────────────────────────────────────────

  if (printingInvoice) {
    return (
      <div className="p-10 text-right bg-white min-h-screen font-serif" dir="rtl">
        <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-8">
          <div><h1 className="text-4xl font-black mb-2">فاتورة مبيعات</h1><p className="text-lg font-bold text-slate-500">رقم الفاتورة: #{printingInvoice.invoiceNumber} | التاريخ: {printingInvoice.date}</p></div>
          <h2 className="text-3xl font-black text-slate-800">مطبعة الوزير</h2>
        </div>
        <div className="mb-8 bg-slate-50 p-6 rounded-2xl border-2"><p className="text-slate-500 font-bold mb-1">مطلوب من السادة:</p><h3 className="text-2xl font-black text-blue-900">{printingInvoice.clientName}</h3></div>
        <table className="w-full border-2 border-black font-bold text-right text-lg">
          <thead><tr className="bg-slate-200"><th className="text-right p-4 border border-black">البيان</th><th className="text-center p-4 border border-black w-32">الكمية</th><th className="text-left p-4 border border-black w-48">القيمة</th></tr></thead>
          <tbody>{printingInvoice.items.map((it: any, i: number) => (<tr key={i}><td className="p-4 border border-black">{it.name}</td><td className="p-4 border border-black text-center font-mono">{it.qty}</td><td className="p-4 border border-black text-left font-black">{parseFloat(it.total).toLocaleString()} ج.م</td></tr>))}</tbody>
        </table>
        <div className="mt-10 flex justify-between items-end">
          <div className="text-center font-bold text-slate-500"><p className="mb-8">توقيع المستلم</p><p>.....................</p></div>
          <h2 className="text-4xl font-black text-left border-t-4 border-black pt-6">الإجمالي: {parseFloat(printingInvoice.totalPrice).toLocaleString()} ج.م</h2>
        </div>
      </div>
    )
  }

  if (invLoading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  return (
    <div className="p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl md:text-2xl font-black flex items-center gap-3"><FileText className="text-blue-600 w-7 h-7" /> الفواتير والتشغيل</h1>
        {suspendedInvoices.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{suspendedInvoices.length} فاتورة معلقة</span>
          </div>
        )}
      </div>

      {/* New Invoice Builder */}
      <Card className="rounded-[1.5rem] border-none shadow-sm bg-white">
        <CardHeader className="border-b p-5">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col gap-2 flex-1">
              <Label className="font-bold text-slate-700">اختر الشركة / العميل</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-12 font-bold rounded-xl border-2 max-w-sm"><SelectValue placeholder="اختر العميل..." /></SelectTrigger>
                <SelectContent dir="rtl">
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company} - {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => { if (!selectedCustomerId) return toast.error("اختر العميل أولاً"); setCalcOpen(true) }} className="bg-blue-600 hover:bg-blue-700 font-bold h-11 px-5 rounded-xl flex items-center gap-2"><Calculator className="w-4 h-4" /> إضافة صنف</Button>
              <Button onClick={suspendInvoice} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 font-bold h-11 px-5 rounded-xl flex items-center gap-2"><Clock className="w-4 h-4" /> تعليق</Button>
              <Button onClick={saveAndSync} disabled={saving || invoiceItems.length === 0} className="bg-green-600 hover:bg-green-700 font-bold h-11 px-5 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ الفاتورة"}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {invoiceItems.length === 0 ? (
            <div className="text-center py-12 opacity-30"><FileText className="w-16 h-16 mx-auto mb-3" /><p className="font-black text-lg">لا يوجد أصناف. اضغط &quot;إضافة صنف&quot; للبدء</p></div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {invoiceItems.map((item, i) => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-black text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-500">الكمية: {item.qty} | التكلفة: {formatMoney(parseFloat(item.actual))} ج</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-blue-700 text-lg">{formatMoney(parseFloat(item.total))} ج</span>
                      <Button variant="ghost" size="icon" onClick={() => setInvoiceItems(invoiceItems.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 flex flex-wrap gap-4 justify-between">
                <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-sm font-bold text-slate-600">التكلفة الفعلية: {formatMoney(currentInvoiceActual)} ج</span></div>
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm font-bold text-slate-600">الربح: {formatMoney(currentInvoiceProfit)} ج</span></div>
                <div className="text-xl font-black text-blue-700">الإجمالي: {formatMoney(currentInvoiceTotal)} ج.م</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Suspended Drafts */}
      {suspendedInvoices.length > 0 && (
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-white">
          <CardHeader className="border-b p-4"><h3 className="font-black text-amber-700 flex items-center gap-2"><Clock className="w-5 h-5" /> الفواتير المعلقة</h3></CardHeader>
          <CardContent className="p-4 space-y-3">
            {suspendedInvoices.map((d) => (
              <div key={d.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-black text-slate-800">{clients.find((c) => c.id === d.customerId)?.company || "عميل غير معروف"}</p>
                  <p className="text-xs text-slate-500">{d.date} | {d.items.length} صنف | {formatMoney(d.totalPrice)} ج</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resumeInvoice(d)} className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 px-3 flex items-center gap-1"><PlayCircle className="w-4 h-4" /> استرجاع</Button>
                  <Button size="sm" variant="outline" onClick={() => setSuspendedInvoices(suspendedInvoices.filter((x) => x.id !== d.id))} className="border-red-200 text-red-500 hover:bg-red-50 rounded-lg h-9 px-3"><XCircle className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Saved Invoices List */}
      <Card className="rounded-[1.5rem] border-none shadow-sm bg-white">
        <CardHeader className="border-b p-4"><h3 className="font-black text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> الفواتير المحفوظة ({savedInvoices.length})</h3></CardHeader>
        <CardContent className="p-4">
          {savedInvoices.length === 0 ? (
            <div className="text-center py-10 opacity-30"><FileText className="w-12 h-12 mx-auto mb-3" /><p className="font-bold">لا توجد فواتير محفوظة</p></div>
          ) : (
            <div className="space-y-3">
              {savedInvoices.map((inv) => (
                <div key={inv.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm hover:border-blue-200 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <h4 className="font-black text-slate-800">{inv.clientName}</h4>
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-bold">{inv.invoiceNumber}</span>
                    </div>
                    <p className="text-xs text-slate-500">{inv.date} | {inv.items.length} صنف</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inv.items.map((it: any, i: number) => (
                        <span key={i} className="text-xs bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded">{it.name} ({it.qty})</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-blue-700 text-lg">{formatMoney(inv.totalPrice)} ج</span>
                    <Button size="sm" variant="outline" onClick={() => handlePrint(inv)} className="rounded-lg h-9 px-3 text-slate-600 border-slate-200 hover:bg-slate-100 flex items-center gap-1"><Printer className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => sendWhatsApp(inv)} className="rounded-lg h-9 px-3 text-green-600 border-green-200 hover:bg-green-50 flex items-center gap-1"><MessageCircle className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteInvoice(inv.id)} className="rounded-lg h-9 px-3 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculator Dialog */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 bg-white" dir="rtl">
          <div className="bg-slate-900 p-5 text-white sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={() => setCalcOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white hover:bg-white/10 rounded-full h-9 w-9"><X className="w-5 h-5" /></Button>
            <DialogTitle className="text-xl font-black flex items-center gap-2"><Calculator className="w-5 h-5 text-blue-400" /> حاسبة التكلفة والسعر</DialogTitle>
          </div>

          <div className="p-5 space-y-5">
            {/* Service Name */}
            <div className="space-y-1.5"><Label className="font-bold text-slate-700">اسم الصنف / الخدمة</Label><Input value={tempService} onChange={(e) => setTempService(e.target.value)} placeholder="مثال: كروت فزتنج" className="h-12 font-bold text-base rounded-xl border-2" /></div>

            {/* Paper Section */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-black text-amber-800 flex items-center gap-2"><FileText className="w-4 h-4" /> الورق</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs font-bold text-slate-600">سعر الورقة (ج)</Label><Input type="number" value={sheetPrice} onChange={(e) => setSheetPrice(e.target.value)} className="h-11 font-bold rounded-xl border-2" /></div>
                <div className="space-y-1"><Label className="text-xs font-bold text-slate-600">عدد الورق</Label><Input type="number" value={sheetCount} onChange={(e) => { setSheetCount(e.target.value); setTargetQty((parseFloat(e.target.value) * 4).toString()) }} className="h-11 font-bold rounded-xl border-2" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs font-bold text-slate-600">مورد الورق</Label>
                <Select value={paperSupId} onValueChange={setPaperSupId}>
                  <SelectTrigger className="h-10 text-sm rounded-xl border-2"><SelectValue placeholder="اختر مورد الورق..." /></SelectTrigger>
                  <SelectContent dir="rtl">{getSuppliersForCategory("paper").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Printing Section */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-black text-blue-800 flex items-center gap-2"><Printer className="w-4 h-4" /> الطباعة</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs font-bold">سعر الطباعة / 1000</Label><Input type="number" value={printPricePer1000} onChange={(e) => setPrintPricePer1000(e.target.value)} className="h-11 font-bold rounded-xl border-2" /></div>
                <div className="space-y-1"><Label className="text-xs font-bold">الكمية المستهدفة</Label><Input type="number" value={targetQty} onChange={(e) => setTargetQty(e.target.value)} className="h-11 font-bold rounded-xl border-2" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs font-bold">مورد الطباعة</Label>
                <Select value={printSupId} onValueChange={setPrintSupId}>
                  <SelectTrigger className="h-10 text-sm rounded-xl border-2"><SelectValue placeholder="اختر مورد الطباعة..." /></SelectTrigger>
                  <SelectContent dir="rtl">{getSuppliersForCategory("printing").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Zinc */}
            <div className="bg-cyan-50 border-2 border-cyan-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-black text-cyan-800 flex items-center gap-2"><Sparkles className="w-4 h-4" /> الزنكات</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs font-bold">تكلفة الزنكات (ج)</Label><Input type="number" value={zinkat} onChange={(e) => setZinkat(e.target.value)} className="h-11 font-bold rounded-xl border-2" /></div>
                <div className="space-y-1"><Label className="text-xs font-bold">مورد الزنكات</Label>
                  <Select value={zinkSupId} onValueChange={setZinkSupId}>
                    <SelectTrigger className="h-10 text-sm rounded-xl border-2"><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent dir="rtl">{getSuppliersForCategory("zincs").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Optional: Solo, Spot, Basma, Taksir */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "useSolo", label: "سلوفان", state: useSolo, set: setUseSolo, icon: <Layers className="w-4 h-4" /> },
                { id: "useSpot", label: "سبوت", state: useSpot, set: setUseSpot, icon: <Box className="w-4 h-4" /> },
                { id: "useBasma", label: "بصمة", state: useBasma, set: setUseBasma, icon: <Sparkles className="w-4 h-4" /> },
                { id: "useTaksir", label: "تكسير / إسطمبة", state: useTaksir, set: setUseTaksir, icon: <Scissors className="w-4 h-4" /> },
              ].map((opt) => (
                <button key={opt.id} onClick={() => opt.set(!opt.state)}
                  className={cn("flex items-center gap-2 justify-center py-3 rounded-xl font-bold border-2 transition-all text-sm", opt.state ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {/* Basma Details */}
            {useBasma && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-yellow-800">تفاصيل البصمة</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-xs">طول (سم)</Label><Input type="number" value={basmaL} onChange={(e) => setBasmaL(e.target.value)} className="h-11 rounded-xl border-2" /></div>
                  <div><Label className="text-xs">عرض (سم)</Label><Input type="number" value={basmaW} onChange={(e) => setBasmaW(e.target.value)} className="h-11 rounded-xl border-2" /></div>
                  <div><Label className="text-xs">كليشيه (ج)</Label><Input type="number" value={basmaAclashie} onChange={(e) => setBasmaAclashie(e.target.value)} className="h-11 rounded-xl border-2" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">مورد البصمة</Label><Select value={basmaSupId} onValueChange={setBasmaSupId}><SelectTrigger className="h-10 text-sm rounded-xl border-2"><SelectValue placeholder="اختر..." /></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("emboss").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">مورد الكليشيه</Label><Select value={basmaClichéSupId} onValueChange={setBasmaClichéSupId}><SelectTrigger className="h-10 text-sm rounded-xl border-2"><SelectValue placeholder="اختر..." /></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("dies").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
            )}

            {/* Taksir Details */}
            {useTaksir && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-red-800 flex items-center gap-2"><Scissors className="w-4 h-4" /> تفاصيل التكسير</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">سعر التكسير (ج)</Label><Input type="number" value={taksirPrice} onChange={(e) => setTaksirPrice(e.target.value)} className="h-11 rounded-xl border-2" /></div>
                  <div><Label className="text-xs">سعر الإسطمبة (ج)</Label><Input type="number" value={estambaPrice} onChange={(e) => setEstambaPrice(e.target.value)} className="h-11 rounded-xl border-2" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">مورد التكسير</Label><Select value={taksirSupId} onValueChange={setTaksirSupId}><SelectTrigger className="h-10 text-sm rounded-xl border-2"><SelectValue placeholder="اختر..." /></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("cutting").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">مورد الإسطمبة</Label><Select value={taksirStampSupId} onValueChange={setTaksirStampSupId}><SelectTrigger className="h-10 text-sm rounded-xl border-2"><SelectValue placeholder="اختر..." /></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("dies").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
            )}

            {/* Profit Margin */}
            <div className="space-y-1.5"><Label className="font-bold text-slate-700">نسبة الربح (%)</Label>
              <div className="flex gap-2">
                {["10", "15", "20", "25", "30"].map((p) => (
                  <button key={p} onClick={() => setProfitMargin(p)} className={cn("flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all", profitMargin === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300")}>{p}%</button>
                ))}
                <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} className="w-20 h-11 font-bold rounded-xl border-2 text-center" />
              </div>
            </div>

            {/* Result */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center bg-slate-800 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">التكلفة الفعلية</p><p className="text-2xl font-black text-red-400">{formatMoney(res.actual)} ج</p></div>
                <div className="text-center bg-slate-800 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">سعر البيع ({profitMargin}% ربح)</p><p className="text-2xl font-black text-green-400">{formatMoney(res.total)} ج</p></div>
              </div>
              <div className="space-y-1.5 mb-4">
                <Label className="text-sm font-bold text-slate-300">سعر يدوي (اختياري)</Label>
                <Input type="number" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder={`السعر المقترح: ${formatMoney(res.total)}`} className="h-12 font-black text-lg text-center bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl" />
              </div>
              <Button onClick={addItem} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-xl">
                <PlusCircle className="w-5 h-5 ml-2" /> إضافة هذا الصنف للفاتورة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
