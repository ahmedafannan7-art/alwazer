"use client"

/**
 * ✅ نظام الفواتير والحسابات المترابطة:
 * 
 * 🔗 التكامل بين الصفحات:
 * 1. صفحة الموردين (Finance): تدير الموردين وتقسمهم حسب الأقسام (طباعة، ورق، زنكات، إلخ)
 * 2. صفحة العملاء (Clients): تدير بيانات العملاء والشركات
 * 3. صفحة الفواتير (Invoices): تربط كل هذا معاً
 * 
 * 💰 عند إنشاء فاتورة:
 * - السعر المبيع يُضاف إلى حساب العميل (كدين عليه)
 * - مصاريف كل بند توزع على الموردين المختارين حسب تخصصهم
 * - تكاليف الورق توزع على مورد الورق
 * - تكاليف الطباعة توزع على مورد الطباعة
 * - تكاليف الزنكات على مورد الزنكات وهكذا...
 * 
 * 📊 الموردين يظهرون مصنفين حسب الفئات:
 * - الطباعة | الورق | البصمة | السلوفان | السبوت | الريجا | التكسير | الإسطمبات
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, Trash2, Box, Zap, Calculator, 
  Building2, CheckCircle2, PlusCircle, Printer, 
  MessageCircle, Scissors, Edit3, TrendingUp, TrendingDown,
  Clock, PlayCircle, XCircle, X, Layers, Sparkles
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function InvoicesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [paperList, setPaperList] = useState<any[]>([])
  const [globalPrices, setGlobalPrices] = useState<any>(null)
  const [savedInvoices, setSavedInvoices] = useState<any[]>([]) 
  const [suspendedInvoices, setSuspendedInvoices] = useState<any[]>([]) 

  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [invoiceItems, setInvoiceItems] = useState<any[]>([])
  const [calcOpen, setCalcOpen] = useState(false) 
  
  const [printingInvoice, setPrintingInvoice] = useState<any>(null)

  // --- دالة توحيد النصوص لضمان عمل الفلاتر بدقة ---
  const normalize = (text: string) => {
    if (!text) return "";
    return text.trim().replace(/^حد\s?/, "").replace(/^ال/, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, "");
  };

  // --- الحاسبة الذكية ---
  const [tempService, setTempService] = useState("")
  const [sheetPrice, setSheetPrice] = useState("0")
  const [sheetCount, setSheetCount] = useState("")
  const [targetQty, setTargetQty] = useState("0")
  const [printPricePer1000, setPrintPricePer1000] = useState("0")
  const [zinkat, setZinkat] = useState("0")
  const [profitMargin, setProfitMargin] = useState("20")
  const [paperMode, setPaperMode] = useState<"salim" | "jayir">("salim")
  
  // موردين الحاسبة (تم الحفاظ عليهم لربط الحسابات)
  const [paperSupId, setPaperSupId] = useState("")
  const [printSupId, setPrintSupId] = useState("")
  const [zinkSupId, setZinkSupId] = useState("")
  const [soloSupId, setSoloSupId] = useState("")
  const [spotSupId, setSpotSupId] = useState("")
  const [basmaSupId, setBasmaSupId] = useState("")
  const [basmaClichéSupId, setBasmaClichéSupId] = useState("")
  const [taksirSupId, setTaksirSupId] = useState("")
  const [taksirStampSupId, setTaksirStampSupId] = useState("")

  // فئات الموردين
  const supplierCategories = [
    { id: "printing", name: "الطباعة", nameAr: "طباع" },
    { id: "paper", name: "الورق", nameAr: "ورق" },
    { id: "zincs", name: "الزنكات", nameAr: "زنكات" },
    { id: "emboss", name: "البصمة", nameAr: "بصم" },
    { id: "lamination", name: "السلوفان", nameAr: "سلوفان" },
    { id: "spot", name: "السبوت", nameAr: "سبوت" },
    { id: "riga", name: "الريجا", nameAr: "ريجا" },
    { id: "cutting", name: "التكسير", nameAr: "تكسير" },
    { id: "dies", name: "الإسطمبات", nameAr: "اسطمبات" },
  ]

  const getSuppliersForCategory = (categoryId: string) => {
    return suppliers.filter((s: any) => s.categoryId === categoryId)
  }

  const [useSolo, setUseSolo] = useState(false)
  const [useSpot, setUseSpot] = useState(false)
  const [useBasma, setUseBasma] = useState(false)
  const [useTaksir, setUseTaksir] = useState(false)

  const [basmaL, setBasmaL] = useState("0")
  const [basmaW, setBasmaW] = useState("0")
  const [basmaAclashie, setBasmaAclashie] = useState("0")
  
  const [estambaPrice, setEstambaPrice] = useState("0")
  const [taksirPrice, setTaksirPrice] = useState("0")
  const [manualPrice, setManualPrice] = useState("")

  useEffect(() => {
    try {
      const c = localStorage.getItem("system_clients"); 
      const s = localStorage.getItem("suppliers"); 
      const p = localStorage.getItem("paper_list"); 
      const g = localStorage.getItem("global_settings");
      const inv = localStorage.getItem("all_invoices");
      const susp = localStorage.getItem("suspended_invoices");
      
      if (c) {
        try {
          setClients(JSON.parse(c));
        } catch (e) {
          console.error("Error parsing clients:", e);
        }
      }
      
      if (s) {
        try {
          const parsedSuppliers = JSON.parse(s);
          setSuppliers(Array.isArray(parsedSuppliers) ? parsedSuppliers : []);
        } catch (e) {
          console.error("Error parsing suppliers:", e);
        }
      }
      
      if (p) {
        try {
          setPaperList(JSON.parse(p));
        } catch (e) {
          console.error("Error parsing paper_list:", e);
        }
      }
      
      if (g) {
        try {
          setGlobalPrices(JSON.parse(g));
        } catch (e) {
          console.error("Error parsing global_settings:", e);
        }
      }
      
      if (inv) {
        try {
          setSavedInvoices(JSON.parse(inv));
        } catch (e) {
          console.error("Error parsing invoices:", e);
        }
      }
      
      if (susp) {
        try {
          setSuspendedInvoices(JSON.parse(susp));
        } catch (e) {
          console.error("Error parsing suspended invoices:", e);
        }
      }
    } catch (e) {
      console.error("Error in useEffect:", e);
    }
  }, []);

  useEffect(() => { 
    setTargetQty(((parseFloat(sheetCount) || 0) * 4).toString());
  }, [sheetCount]);

  const calculate = () => {
    const sCount = parseFloat(sheetCount) || 0; 
    const paper = (parseFloat(sheetPrice) || 0) * sCount;
    const print = (parseFloat(printPricePer1000) || 0) * ((parseFloat(targetQty) || 0));
    const gPrices = globalPrices || { wastage: "3", solo: "2", spot: "1.6", basmaFactor: "4", misc: "50" };
    
    const halk = (paper + print) * (parseFloat(gPrices.wastage) / 100);
    let soloCost = useSolo ? parseFloat(gPrices.solo) * sCount : 0;
    let spotCost = useSpot ? parseFloat(gPrices.spot) * sCount : 0;
    let taksirTotal = useTaksir ? (parseFloat(estambaPrice) || 0) + (parseFloat(taksirPrice) || 0) : 0;
    let basmaTotal = useBasma ? (parseFloat(basmaL) * parseFloat(basmaW) * parseFloat(gPrices.basmaFactor)) + parseFloat(basmaAclashie) : 0;

    const actual = paper + print + halk + soloCost + spotCost + taksirTotal + basmaTotal + parseFloat(zinkat) + parseFloat(gPrices.misc);
    const total = actual * (1 + (parseFloat(profitMargin) / 100));
    
    return { actual, total, paper, print, soloCost, spotCost, basmaCost: basmaTotal - parseFloat(basmaAclashie) };
  }

  const res = calculate();
  const currentInvoiceTotal = invoiceItems.reduce((acc, i) => acc + parseFloat(i.total), 0);
  const currentInvoiceActual = invoiceItems.reduce((acc, i) => acc + parseFloat(i.actual), 0);
  const currentInvoiceProfit = currentInvoiceTotal - currentInvoiceActual;

  const handleOpenCalc = () => {
    if (!selectedCustomerId) return toast.error("⚠️ برجاء اختيار الشركة أو العميل أولاً قبل إدراج أي صنف!");
    setCalcOpen(true);
  }

  const addItem = () => {
    if (!tempService) return toast.error("برجاء إدخال اسم الصنف");
    const finalPriceToUse = (manualPrice && !isNaN(Number(manualPrice))) ? parseFloat(manualPrice).toFixed(2) : res.total.toFixed(2);

    // تجميع التكاليف للموردين
    const costs: any = {};
    if (paperSupId) costs.paper = { supplierId: paperSupId, amount: res.paper };
    if (printSupId) costs.print = { supplierId: printSupId, amount: res.print };
    if (zinkSupId) costs.zink = { supplierId: zinkSupId, amount: parseFloat(zinkat) || 0 };
    if (useSolo && soloSupId) costs.solo = { supplierId: soloSupId, amount: res.soloCost };
    if (useSpot && spotSupId) costs.spot = { supplierId: spotSupId, amount: res.spotCost };
    if (useBasma) {
        if (basmaSupId) costs.basma = { supplierId: basmaSupId, amount: res.basmaCost };
        if (basmaClichéSupId) costs.basmaCliché = { supplierId: basmaClichéSupId, amount: parseFloat(basmaAclashie) || 0 };
    }
    if (useTaksir) {
        if (taksirSupId) costs.taksirService = { supplierId: taksirSupId, amount: parseFloat(taksirPrice) || 0 };
        if (taksirStampSupId) costs.taksirStamp = { supplierId: taksirStampSupId, amount: parseFloat(estambaPrice) || 0 };
    }

    setInvoiceItems([...invoiceItems, { 
      id: crypto.randomUUID(), name: tempService, qty: targetQty, 
      total: finalPriceToUse, actual: res.actual.toFixed(2),
      suppliersCost: costs
    }]);
    
    setCalcOpen(false); setTempService(""); setSheetCount(""); 
    setUseSolo(false); setUseSpot(false); setUseBasma(false); setUseTaksir(false);
    setEstambaPrice("0"); setTaksirPrice("0"); setBasmaAclashie("0");
    setManualPrice(""); 
  }

  const suspendInvoice = () => {
    if (invoiceItems.length === 0) return toast.error("لا يمكن تعليق فاتورة فارغة");
    const newDraft = {
        id: crypto.randomUUID(), customerId: selectedCustomerId,
        date: new Date().toLocaleDateString("en-GB") + " - " + new Date().toLocaleTimeString("en-GB", {hour: '2-digit', minute:'2-digit'}),
        items: invoiceItems, totalPrice: currentInvoiceTotal
    };
    const updatedSuspended = [newDraft, ...suspendedInvoices];
    setSuspendedInvoices(updatedSuspended);
    localStorage.setItem("suspended_invoices", JSON.stringify(updatedSuspended));
    setInvoiceItems([]); setSelectedCustomerId("");
    toast.success("تم تعليق الفاتورة بنجاح كمسودة");
  }

  const resumeInvoice = (draft: any) => {
    setInvoiceItems(draft.items);
    setSelectedCustomerId(draft.customerId);
    const updatedSuspended = suspendedInvoices.filter(d => d.id !== draft.id);
    setSuspendedInvoices(updatedSuspended);
    localStorage.setItem("suspended_invoices", JSON.stringify(updatedSuspended));
    toast.success("تم استرجاع الفاتورة المعلقة بنجاح");
  }

  const deleteSuspended = (id: string) => {
    if(!confirm("هل أنت متأكد من مسح هذه المسودة نهائياً؟")) return;
    const updatedSuspended = suspendedInvoices.filter(d => d.id !== id);
    setSuspendedInvoices(updatedSuspended);
    localStorage.setItem("suspended_invoices", JSON.stringify(updatedSuspended));
  }

  // --- دالة الحفظ مع ربط الموردين والعملاء ---
  const saveAndSync = () => {
    if (invoiceItems.length === 0) return toast.error("الفاتورة فارغة لا يمكن حفظها");
    const clientComp = clients.find((c:any) => c.id === selectedCustomerId);
    if (!clientComp) return toast.error("خطأ في بيانات العميل");

    const newInvoice = { 
        id: crypto.randomUUID(), customerId: selectedCustomerId, clientName: clientComp.company,
        clientPhone: clientComp.phone, date: new Date().toLocaleDateString("en-GB"), 
        totalPrice: currentInvoiceTotal, items: invoiceItems 
    };
    
    let allSuppliers = JSON.parse(localStorage.getItem("suppliers") || "[]");
    let allClients = JSON.parse(localStorage.getItem("system_clients") || "[]");
    let allTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");

    // 1. تسجيل ديون الموردين وربطها بالـ ID بتاع الفاتورة
    invoiceItems.forEach((item: any) => {
      Object.values(item.suppliersCost || {}).forEach((cost: any) => {
        allSuppliers = allSuppliers.map((s: any) => 
          s.id === cost.supplierId ? { ...s, totalOwed: (s.totalOwed || 0) + cost.amount } : s
        );
        allTransactions.unshift({
          id: crypto.randomUUID(),
          supplierId: cost.supplierId,
          invoiceId: newInvoice.id,
          amount: cost.amount,
          date: new Date().toLocaleDateString("en-GB"),
          type: "تكلفة_فاتورة",
          notes: `تكلفة بند [${item.name}] فاتورة #${newInvoice.id.slice(0,5)}`
        });
      });
    });

    // 2. تحديث حساب العميل (دين عليه) — حفظ التغير في مصفوفة العملاء
    allClients = allClients.map((c: any) => c.id === selectedCustomerId ? { ...c, totalOwed: (c.totalOwed || 0) + currentInvoiceTotal } : c);
    allTransactions.unshift({
      id: crypto.randomUUID(),
      clientId: selectedCustomerId,
      invoiceId: newInvoice.id,
      amount: currentInvoiceTotal,
      date: new Date().toLocaleDateString("en-GB"),
      type: "سحب_شغل",
      notes: "فاتورة مبيعات"
    });

    const updatedInvoices = [newInvoice, ...savedInvoices];
    setSavedInvoices(updatedInvoices);
    localStorage.setItem("all_invoices", JSON.stringify(updatedInvoices));
    localStorage.setItem("suppliers", JSON.stringify(allSuppliers));
    localStorage.setItem("system_clients", JSON.stringify(allClients));
    localStorage.setItem("transactions", JSON.stringify(allTransactions));

    setInvoiceItems([]); setSelectedCustomerId("");
    toast.success("تم حفظ الفاتورة وترحيل الديون للموردين والعميل بنجاح ✅");
  }

  // --- دالة المسح الذكية ---
  const handleDeleteInvoice = (invoiceId: string) => {
    if(!confirm("هل أنت متأكد من حذف الفاتورة؟ (سيتم خصم تكلفتها من حسابات الموردين وإلغاء دين العميل تلقائياً)")) return;

    const updatedInvoices = savedInvoices.filter((inv: any) => inv.id !== invoiceId);
    setSavedInvoices(updatedInvoices);
    localStorage.setItem("all_invoices", JSON.stringify(updatedInvoices));

    const allTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    let allSuppliers = JSON.parse(localStorage.getItem("suppliers") || "[]");
    let allClients = JSON.parse(localStorage.getItem("system_clients") || "[]");

    const transactionsToDelete = allTransactions.filter((t: any) => t.invoiceId === invoiceId);
    transactionsToDelete.forEach((t: any) => {
      if (t.supplierId) {
        allSuppliers = allSuppliers.map((s: any) => 
          s.id === t.supplierId ? { ...s, totalOwed: (s.totalOwed || 0) - parseFloat(t.amount) } : s
        );
      }
      if (t.clientId) {
        allClients = allClients.map((c: any) => 
          c.id === t.clientId ? { ...c, totalOwed: (c.totalOwed || 0) - parseFloat(t.amount) } : c
        );
      }
    });

    const updatedTransactions = allTransactions.filter((t: any) => t.invoiceId !== invoiceId);

    localStorage.setItem("suppliers", JSON.stringify(allSuppliers));
    localStorage.setItem("system_clients", JSON.stringify(allClients));
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
    window.dispatchEvent(new Event('storage'));

    toast.success("تم مسح الفاتورة وتحديث جميع الحسابات بنجاح 🗑️");
  };

  const sendWhatsApp = (inv: any) => {
    if(!inv.clientPhone || inv.clientPhone === "لا يوجد") return toast.error("العميل ليس لديه رقم هاتف مسجل");
    let phone = inv.clientPhone.toString().trim();
    if (phone.startsWith("0")) phone = "2" + phone;
    let text = `🧾 *فاتورة مبيعات – مطبعة الوزير*\nرقم الفاتورة: #${inv.id.slice(0, 5)}\nالتاريخ: ${inv.date}\nالشركة: ${inv.clientName}\n────────────────────\n*الأصناف:*\n\n`;
    inv.items.forEach((item: any) => { text += `🔹 ${item.name}\n   (الكمية: ${item.qty}) = ${parseFloat(item.total).toLocaleString()} ج.م\n\n`; });
    text += `────────────────────\n💰 *الإجمالي المطلوب: ${parseFloat(inv.totalPrice).toLocaleString()} جنيه مصري*\n\nشكراً لتعاملكم معنا 🌷`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  const handlePrint = (inv: any) => {
      setPrintingInvoice(inv);
      setTimeout(() => { window.print(); setPrintingInvoice(null); }, 500);
  }

  if (printingInvoice) {
      return (
        <div className="p-10 text-right bg-white min-h-screen font-serif" dir="rtl">
          <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-8">
             <div className="text-right">
                 <h1 className="text-4xl font-black mb-2">فاتورة مبيعات</h1>
                 <p className="text-lg font-bold text-slate-500">رقم الفاتورة: #{printingInvoice.id.slice(0,6)} | التاريخ: {printingInvoice.date}</p>
             </div>
             <div className="text-left"><h2 className="text-3xl font-black text-slate-800">مطبعة الوزير</h2></div>
          </div>
          <div className="mb-8 bg-slate-50 p-6 rounded-2xl border-2 border-slate-200">
              <p className="text-slate-500 font-bold mb-1">مطلوب من السادة:</p>
              <h3 className="text-2xl font-black text-blue-900">{printingInvoice.clientName}</h3>
          </div>
          <table className="w-full border-2 border-black font-bold text-right text-lg">
            <thead><tr className="bg-slate-200"><th className="text-right p-4 border border-black">البيان (الصنف)</th><th className="text-center p-4 border border-black w-32">الكمية</th><th className="text-left p-4 border border-black w-48">القيمة</th></tr></thead>
            <tbody>{printingInvoice.items.map((it:any, i:number) => (<tr key={i}><td className="p-4 border border-black text-right">{it.name}</td><td className="p-4 border border-black text-center font-mono">{it.qty}</td><td className="p-4 border border-black text-left font-black">{parseFloat(it.total).toLocaleString()} ج.م</td></tr>))}</tbody>
          </table>
          <div className="mt-10 flex justify-between items-end">
              <div className="text-center font-bold text-slate-500"><p className="mb-8">توقيع المستلم</p><p>.....................</p></div>
              <h2 className="text-4xl font-black text-left border-t-4 border-black pt-6">الإجمالي: {parseFloat(printingInvoice.totalPrice).toLocaleString()} ج.م</h2>
          </div>
        </div>
      )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-xl md:text-2xl font-black flex items-center gap-3 text-slate-800"><FileText className="text-blue-600 w-7 h-7"/> إنشاء فاتورة جديدة</h1>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={suspendInvoice} disabled={invoiceItems.length===0} variant="outline" className="h-12 md:h-14 px-4 md:px-6 font-bold rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-2 flex-1 md:flex-none">
            <Clock className="w-5 h-5"/> تعليق كمسودة
          </Button>
          <Button onClick={saveAndSync} disabled={invoiceItems.length===0} className="bg-slate-900 hover:bg-slate-800 h-12 md:h-14 px-6 md:px-8 font-bold rounded-xl shadow-md transition-all text-sm md:text-base flex-1 md:flex-none">
            حفظ الفاتورة 🚀
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
        <Card className="lg:col-span-2 shadow-sm border-none rounded-[1.5rem] md:rounded-[2rem] bg-white overflow-hidden flex flex-col">
          <CardHeader className="p-6 md:p-8 border-b bg-slate-50 shrink-0">
            <Label className="text-blue-700 block mb-3 text-sm md:text-base font-black text-right flex items-center gap-2"><Building2 className="w-5 h-5"/> اختيار العميل للفاتورة:</Label>
            {clients.length === 0 ? (
              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-700 font-bold text-center">
                ⚠️ لا توجد عملاء مسجلة بعد. يرجى الذهاب إلى <span className="text-blue-600">صفحة العملاء</span> لإضافة عميل أولاً
              </div>
            ) : (
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-14 text-base md:text-lg font-bold rounded-xl shadow-sm text-right bg-white border-2 border-slate-200">
                    <SelectValue placeholder="-- اختر الشركة أو العميل --" />
                </SelectTrigger>
                <SelectContent dir="rtl" className="text-right max-h-60">
                    {clients.map((c:any) => <SelectItem key={c.id} value={c.id} className="text-right font-bold text-sm md:text-base">{c.company} ({c.name})</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-4 flex-1">
            {invoiceItems.map((item, idx) => (
              <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-white border-2 border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors gap-3">
                <div>
                  <h4 className="font-black text-lg text-slate-800 text-right">{item.name}</h4>
                  <p className="text-xs text-slate-500 font-bold text-right mt-1">الكمية: {item.qty} قطعة</p>
                </div>
                <div className="flex flex-col items-end w-full md:w-auto gap-2">
                  <div className="flex items-center gap-4">
                    <span className="font-black text-blue-600 text-xl">{parseFloat(item.total).toLocaleString()} <span className="text-xs">ج.م</span></span>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-9 w-9" onClick={()=>setInvoiceItems(invoiceItems.filter((_,i)=>i!==idx))}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-red-500">التكلفة: {parseFloat(item.actual).toLocaleString()}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-green-600">الربح: {(parseFloat(item.total) - parseFloat(item.actual)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {invoiceItems.length === 0 && <div className="text-center py-10 opacity-40"><Calculator className="w-12 h-12 mx-auto mb-3 text-slate-400"/><p className="text-sm font-bold">لم يتم إضافة أصناف للفاتورة بعد</p></div>}
            <Button onClick={handleOpenCalc} className="w-full py-12 md:py-16 border-dashed border-2 bg-blue-50/50 border-blue-200 text-blue-700 font-black text-lg md:text-xl rounded-2xl hover:bg-blue-100 transition-all flex flex-col items-center gap-3 mt-4">
              <PlusCircle className="w-8 h-8 md:w-10 md:h-10"/> إدراج صنف من الحاسبة الذكية
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 text-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] w-full md:w-auto md:h-fit md:sticky md:top-6 shadow-xl border-4 border-slate-800 flex flex-col justify-center mt-4 md:mt-0">
            <h3 className="text-slate-400 font-bold mb-2 uppercase text-xs tracking-widest text-right">إجمالي المطلوب للعميل</h3>
            <div className="text-4xl md:text-5xl font-black text-blue-400 mb-6 font-mono text-right tracking-tighter">
                {currentInvoiceTotal.toLocaleString()} <span className="text-sm text-white font-normal">ج.م</span>
            </div>
            <div className="border-t border-slate-700 pt-5 space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">التكلفة الفعلية عليك:</span>
                  <span className="text-red-300 font-black font-mono">{currentInvoiceActual.toLocaleString()} ج.م</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">صافي الربح المتوقع:</span>
                  <span className="text-green-400 font-black font-mono">+{currentInvoiceProfit.toLocaleString()} ج.م</span>
               </div>
            </div>
        </Card>
      </div>

      {/* بوكس الفواتير المعلقة */}
      {suspendedInvoices.length > 0 && (
        <Card className="mt-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-orange-200 shadow-sm bg-orange-50/40">
          <CardHeader className="p-5 md:p-6 border-b border-orange-100">
            <CardTitle className="text-lg md:text-xl font-black text-orange-700 flex items-center gap-2"><Clock className="w-5 h-5"/> فواتير معلقة (قيد الانتظار)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {suspendedInvoices.map(draft => {
               const client = clients.find(c => c.id === draft.customerId);
               return (
                 <div key={draft.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all">
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm md:text-base">{client ? client.company : 'عميل غير محدد'}</h4>
                      <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-1">{draft.date} | الأصناف: {draft.items.length}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="font-black text-orange-600 mr-2 text-sm md:text-base">{draft.totalPrice.toLocaleString()} ج.م</span>
                      <Button onClick={()=>resumeInvoice(draft)} className="bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold h-9 px-3 rounded-lg flex items-center gap-1 text-xs"><PlayCircle className="w-3.5 h-3.5"/> استكمال</Button>
                      <Button onClick={()=>deleteSuspended(draft.id)} variant="ghost" className="text-red-400 hover:text-red-600 h-9 w-9 p-0 rounded-lg bg-red-50"><XCircle className="w-4 h-4"/></Button>
                   </div>
                 </div>
               )
            })}
          </CardContent>
        </Card>
      )}

      {/* سجل الفواتير السابقة ومسح الفاتورة */}
      {savedInvoices.length > 0 && (
        <Card className="mt-8 rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 p-6 border-b flex flex-row justify-between items-center">
            <CardTitle className="text-lg md:text-xl font-black text-slate-800">سجل الفواتير السابقة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 md:p-0">
              {/* Mobile: show simple cards list */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {savedInvoices.map((inv: any) => (
                  <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-slate-800">{inv.clientName}</h4>
                      <p className="text-xs text-slate-500 mt-1">#{inv.id.slice(0,6)} • {inv.date} • أصناف {inv.items.length}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-black text-blue-600">{parseFloat(inv.totalPrice).toLocaleString()} ج.م</span>
                      <div className="flex gap-2">
                        <Button onClick={() => handlePrint(inv)} variant="outline" size="sm" className="rounded-lg border-slate-200 hover:bg-slate-900 hover:text-white text-xs h-8">طباعة</Button>
                        <Button onClick={() => sendWhatsApp(inv)} size="sm" className="rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs h-8">واتساب</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: full table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white text-slate-400 text-xs font-bold uppercase tracking-widest border-b-2">
                    <tr><th className="p-4">رقم الفاتورة</th><th className="p-4">العميل</th><th className="p-4 text-center">التاريخ</th><th className="p-4 text-left">الإجمالي</th><th className="p-4 text-center">إجراءات</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {savedInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-mono text-slate-400 text-xs font-bold">#{inv.id.slice(0, 6)}</td>
                        <td className="p-4 font-black text-slate-800 text-sm md:text-base">{inv.clientName}</td>
                        <td className="p-4 text-center"><span className="bg-slate-50 px-3 py-1 rounded-md text-[10px] md:text-xs font-bold border border-slate-100">{inv.date}</span></td>
                        <td className="p-4 text-left font-black text-blue-600 text-sm md:text-base">{parseFloat(inv.totalPrice).toLocaleString()} ج.م</td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button onClick={() => handlePrint(inv)} variant="outline" size="sm" className="rounded-lg border-slate-200 hover:bg-slate-900 hover:text-white transition-all text-xs h-8">طباعة</Button>
                            <Button onClick={() => sendWhatsApp(inv)} size="sm" className="rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all text-xs h-8">واتساب</Button>
                            <Button onClick={() => handleDeleteInvoice(inv.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8"><Trash2 className="w-4 h-4"/></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🚀 نافذة الحاسبة الذكية بالتصميم الجديد والبيانات المترابطة 🚀 */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-[95vw] md:max-w-4xl lg:max-w-5xl w-full max-h-[96vh] overflow-y-auto rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-2xl text-right bg-slate-50 border-none flex flex-col" dir="rtl">
          
          <div className="shrink-0 mb-4 flex justify-between items-center border-b border-slate-200 pb-3">
             <DialogTitle className="text-xl md:text-2xl font-black text-blue-800 flex items-center gap-2"><Calculator className="w-6 h-6"/> الحاسبة الذكية</DialogTitle>
             <Button variant="ghost" onClick={() => setCalcOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold px-4 h-10 rounded-lg flex items-center gap-1 text-sm"><X className="w-4 h-4"/> إغلاق</Button>
          </div>
          
          <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto pr-1">
            <Input value={tempService} onChange={(e)=>setTempService(e.target.value)} placeholder="اسم المنتج (مثال: علبة دواء)" className="h-12 md:h-14 text-lg md:text-xl font-bold border-2 border-slate-200 bg-white rounded-xl px-4 shadow-sm text-right"/>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-right">
              {/* قسم الورق */}
              <div className="bg-blue-50/40 p-4 md:p-5 rounded-xl border border-blue-100 space-y-4">
                <h3 className="font-black text-sm text-blue-900 border-b pb-2 flex items-center gap-2"><Box className="w-4 h-4 text-blue-500"/> حساب الورق</h3>
                <div className="grid grid-cols-2 gap-2">
                    <Select value={paperSupId} onValueChange={setPaperSupId}>
                      <SelectTrigger className="h-10 font-bold bg-white border-2 text-xs text-slate-500"><SelectValue placeholder="- مورد الورق -" /></SelectTrigger>
                      <SelectContent dir="rtl">{getSuppliersForCategory("paper").map((s: any) => <SelectItem key={s.id} value={s.id} className="font-bold text-xs">{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={(val)=>{
                      const s = paperList.find((p:any)=>p.id===val); 
                      if(s){setSheetPrice(s.priceSalim); setPaperMode("salim")}
                    }}>
                      <SelectTrigger className="h-10 font-bold bg-white border-2 text-xs"><SelectValue placeholder="- نوع الورق -" /></SelectTrigger>
                      <SelectContent dir="rtl">{paperList.map((p:any)=><SelectItem key={p.id} value={p.id} className="font-bold text-xs">{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 p-1 bg-white rounded-lg border border-blue-100 font-bold">
                  <Button size="sm" variant={paperMode==="salim"?"default":"ghost"} className={cn("flex-1 rounded-md font-bold h-9 text-xs", paperMode==="salim" && "bg-blue-600 text-white")} onClick={()=>{setPaperMode("salim"); const s = paperList.find((p:any)=>p.priceSalim===sheetPrice || p.priceJayir===sheetPrice); if(s) setSheetPrice(s.priceSalim)}}>سليم ✅</Button>
                  <Button size="sm" variant={paperMode==="jayir"?"default":"ghost"} className={cn("flex-1 rounded-md font-bold h-9 text-xs", paperMode==="jayir" && "bg-orange-500 text-white")} onClick={()=>{setPaperMode("jayir"); const s = paperList.find((p:any)=>p.priceSalim===sheetPrice || p.priceJayir===sheetPrice); if(s) setSheetPrice(s.priceJayir)}}>جاير ⚠️</Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-[10px] md:text-xs font-bold text-blue-700">عدد الأفرخ</Label><Input type="number" value={sheetCount} onChange={(e)=>setSheetCount(e.target.value)} className="font-black border-2 border-blue-200 h-12 text-center text-lg rounded-lg bg-white" onFocus={(e)=>e.target.select()}/></div>
                    <div className="space-y-1 text-center bg-white rounded-lg border-2 border-blue-100 flex flex-col justify-center py-2"><p className="text-[10px] md:text-xs font-bold text-slate-400">سعر الفرخ</p><p className="text-sm md:text-base font-black text-blue-600 font-mono">{sheetPrice} <span className="text-[10px]">ج.م</span></p></div>
                </div>
              </div>
              
              {/* قسم الطباعة والزنكات */}
              <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-black text-sm text-slate-700 border-b pb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500"/> الطباعة والزنكات</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">المطبعة</Label>
                        <Select value={printSupId} onValueChange={setPrintSupId}>
                          <SelectTrigger className="h-10 font-bold bg-white border-2 text-xs"><SelectValue placeholder="- اختر المطبعة -" /></SelectTrigger>
                          <SelectContent dir="rtl">{getSuppliersForCategory("printing").map((s: any)=><SelectItem key={s.id} value={s.id} className="font-bold text-xs">{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">مورد الزنكات</Label>
                        <Select value={zinkSupId} onValueChange={setZinkSupId}>
                          <SelectTrigger className="h-10 font-bold bg-white border-2 text-xs"><SelectValue placeholder="- مورد الزنكات -" /></SelectTrigger>
                          <SelectContent dir="rtl">{getSuppliersForCategory("zincs").map((s: any)=><SelectItem key={s.id} value={s.id} className="font-bold text-xs">{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-[10px] md:text-xs font-bold">سعر الطباعة للوحدة</Label><Input type="number" value={printPricePer1000} onChange={(e)=>setPrintPricePer1000(e.target.value)} className="font-black h-12 text-center text-base rounded-lg border-2" onFocus={(e)=>e.target.select()}/></div>
                  <div className="space-y-1.5"><Label className="text-[10px] md:text-xs font-bold">سعر الزنكات</Label><Input type="number" value={zinkat} onChange={(e)=>setZinkat(e.target.value)} className="font-black h-12 text-center text-base rounded-lg border-2" onFocus={(e)=>e.target.select()}/></div>
                </div>
              </div>
            </div>

            {/* قسم التشطيب */}
            <div className="bg-white p-4 md:p-5 rounded-xl border-2 border-slate-100 space-y-4 shadow-sm">
              <h3 className="font-black text-xs md:text-sm border-b pb-2 text-slate-500 flex items-center gap-2"><Layers className="w-4 h-4"/> مفاتيح التشطيب</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-2">
                    <Button variant={useSolo?"default":"outline"} onClick={()=>setUseSolo(!useSolo)} className={cn("font-bold h-10 text-xs rounded-lg border-2", useSolo && "bg-green-600 border-green-700 text-white")}>سلوفان {useSolo && "✅"}</Button>
                    {useSolo && <Select value={soloSupId} onValueChange={setSoloSupId}><SelectTrigger className="h-8 text-[10px] bg-slate-50"><SelectValue placeholder="مورد السلوفان"/></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("lamination").map((s: any)=><SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent></Select>}
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant={useSpot?"default":"outline"} onClick={()=>setUseSpot(!useSpot)} className={cn("font-bold h-10 text-xs rounded-lg border-2", useSpot && "bg-green-600 border-green-700 text-white")}>إسبوط {useSpot && "✅"}</Button>
                    {useSpot && <Select value={spotSupId} onValueChange={setSpotSupId}><SelectTrigger className="h-8 text-[10px] bg-slate-50"><SelectValue placeholder="مورد الإسبوط"/></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("spot").map((s: any)=><SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent></Select>}
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant={useBasma?"default":"outline"} onClick={()=>setUseBasma(!useBasma)} className={cn("font-bold h-10 text-xs rounded-lg border-2", useBasma && "bg-amber-500 border-amber-600 text-white")}>بصمة {useBasma && "✅"}</Button>
                    {useBasma && <Select value={basmaSupId} onValueChange={setBasmaSupId}><SelectTrigger className="h-8 text-[10px] bg-slate-50"><SelectValue placeholder="مورد البصمة"/></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("emboss").map((s: any)=><SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent></Select>}
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant={useTaksir?"default":"outline"} onClick={()=>setUseTaksir(!useTaksir)} className={cn("font-bold h-10 text-xs rounded-lg border-2", useTaksir && "bg-purple-600 border-purple-700 text-white")}>تكسير {useTaksir && "✅"}</Button>
                    {useTaksir && <Select value={taksirSupId} onValueChange={setTaksirSupId}><SelectTrigger className="h-8 text-[10px] bg-slate-50"><SelectValue placeholder="مورد التكسير"/></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("cutting").map((s: any)=><SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent></Select>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {useBasma && (<div className="flex flex-col bg-amber-50/50 p-3 rounded-lg border-2 border-dashed border-amber-200 mt-2 gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[10px] font-bold">طول البصمة</Label><Input type="number" value={basmaL} onChange={(e)=>setBasmaL(e.target.value)} className="h-9 font-bold text-center text-sm rounded-md bg-white" onFocus={(e)=>e.target.select()}/></div>
                        <div><Label className="text-[10px] font-bold">عرض البصمة</Label><Input type="number" value={basmaW} onChange={(e)=>setBasmaW(e.target.value)} className="h-9 font-bold text-center text-sm rounded-md bg-white" onFocus={(e)=>e.target.select()}/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-amber-100 pt-2">
                        <div>
                            <Label className="text-[10px] font-bold text-amber-700">مورد الكليشيه</Label>
                            <Select value={basmaClichéSupId} onValueChange={setBasmaClichéSupId}><SelectTrigger className="h-9 text-[10px] bg-white"><SelectValue placeholder="اختر المورد"/></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("dies").map((s: any)=><SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div><Label className="text-[10px] font-bold text-amber-700">تكلفة الكليشيه</Label><Input type="number" value={basmaAclashie} onChange={(e)=>setBasmaAclashie(e.target.value)} className="h-9 font-bold text-center text-sm rounded-md text-amber-700 border-amber-300 bg-white" onFocus={(e)=>e.target.select()}/></div>
                    </div>
                </div>)}

                {useTaksir && (
                  <div className="flex flex-col bg-purple-50 p-3 rounded-lg border-2 border-dashed border-purple-200 mt-2 gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] md:text-xs font-bold text-purple-700 flex items-center gap-1"><PlayCircle className="w-3 h-3"/> تكلفة التكسير</Label>
                        <Input type="number" value={taksirPrice} onChange={(e)=>setTaksirPrice(e.target.value)} className="h-9 font-black text-center text-sm rounded-md bg-white border-purple-200" onFocus={(e)=>e.target.select()}/>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] md:text-xs font-bold text-purple-700 flex items-center gap-1"><Scissors className="w-3 h-3"/> سعر الإسطمبة</Label>
                        <Input type="number" value={estambaPrice} onChange={(e)=>setEstambaPrice(e.target.value)} className="h-9 font-black text-center text-sm rounded-md bg-white border-purple-200" onFocus={(e)=>e.target.select()}/>
                      </div>
                    </div>
                    <div className="border-t border-purple-100 pt-2">
                        <Label className="text-[10px] font-bold text-purple-700">مورد الإسطمبة (الفورمة)</Label>
                        <Select value={taksirStampSupId} onValueChange={setTaksirStampSupId}><SelectTrigger className="h-9 text-[10px] bg-white border-purple-200"><SelectValue placeholder="اختر مورد الفورمة"/></SelectTrigger><SelectContent dir="rtl">{getSuppliersForCategory("dies").map((s: any)=><SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* لوحة التحكم في الأسعار والنتيجة */}
            <div className="p-4 md:p-6 bg-slate-100 border-2 border-slate-200 rounded-2xl shadow-sm shrink-0">
              <div className="grid grid-cols-2 gap-4 mb-5">
                 <div className="bg-white p-3 md:p-4 rounded-xl border-l-4 border-red-500 shadow-sm text-center">
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-1 flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3 text-red-500"/> التكلفة الفعلية عليك</p>
                    <div className="text-xl md:text-2xl font-black text-red-600 font-mono">{res.actual.toFixed(2)}</div>
                 </div>
                 <div className="bg-white p-3 md:p-4 rounded-xl border-r-4 border-green-500 shadow-sm text-center">
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3 text-green-500"/> سعر البيع (النظام)</p>
                    <div className="text-xl md:text-2xl font-black text-green-700 font-mono">{res.total.toFixed(2)}</div>
                 </div>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-blue-100 flex flex-col md:flex-row items-center justify-between gap-3 mb-4 shadow-sm w-full">
                <Label className="text-xs md:text-sm font-bold text-slate-600 flex items-center gap-2"><Edit3 className="w-4 h-4 text-blue-500"/> تعديل السعر النهائي (اختياري):</Label>
                <Input type="number" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="اكتب السعر اليدوي..." className="h-12 font-black text-lg text-center text-blue-700 border-2 border-blue-200 focus:border-blue-500 rounded-lg shadow-inner w-full md:w-1/2 bg-blue-50/30"/>
              </div>
              <Button onClick={addItem} className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-lg md:text-xl h-14 md:h-16 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"><CheckCircle2 className="w-6 h-6"/> إدراج البند للفاتورة</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}