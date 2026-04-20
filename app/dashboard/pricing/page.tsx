"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calculator, Trash2, Layers, Cpu, Box, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function PricingPage() {
  const [pricingList, setPricingList] = useState<any[]>([])
  const [paperList, setPaperList] = useState<any[]>([])
  const [printFormOpen, setPrintFormOpen] = useState(false)
  const [paperEditOpen, setPaperEditOpen] = useState(false)
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState("")
  const [printType, setPrintType] = useState<"offset" | "digital">("offset")
  
  const [pService, setPService] = useState("")
  const [pPrice, setPPrice] = useState("")

  // مدخلات الحسابات
  const [sheetPrice, setSheetPrice] = useState("0")
  const [sheetCount, setSheetCount] = useState("0")
  const [printPricePer1000, setPrintPricePer1000] = useState("0")
  const [targetQty, setTargetQty] = useState("0")
  const [profitMargin, setProfitMargin] = useState("40")
  const [miscellaneous, setMiscellaneous] = useState("50")

  // الثوابت اللي إنت حددتها
  const [zinkatFixed, setZinkatFixed] = useState("400")
  const [solofanePerSheet, setSolofanePerSheet] = useState("2")
  const [basmaLength, setBasmaLength] = useState("0")
  const [basmaWidth, setBasmaWidth] = useState("0")
  const [basmaAclashie, setBasmaAclashie] = useState("0")
  const [spotPerSheet, setSpotPerSheet] = useState("1.60")
  const [kavrajPerSheet, setKavrajPerSheet] = useState("2")
  const [reegaPerSheet, setReegaPerSheet] = useState("0.5")

  // تحميل البيانات
  useEffect(() => {
    // تحميل قائمة الأسعار
    const saved = localStorage.getItem("pricing_list")
    if (saved) {
      try {
        setPricingList(JSON.parse(saved))
      } catch (e) {
        console.error("Error parsing pricing_list", e)
      }
    }
    
    // تحميل قائمة الخامات
    const savedPaper = localStorage.getItem("paper_list")
    if (savedPaper) {
      try {
        const parsed = JSON.parse(savedPaper)
        setPaperList(parsed)
      } catch (e) {
        console.error("Error parsing paper_list", e)
      }
    } else {
      // أنواع الورق الافتراضية من الصورة
      const defaultPaperList = [
        // الطباعة
        { id: "p1", category: "الطباعة", type: "طباعة سليم", weight: "60", priceSalim: 2.30, priceJayir: 1.65 },
        { id: "p2", category: "الطباعة", type: "طباعة سليم", weight: "80", priceSalim: 3.00, priceJayir: 2.15 },
        { id: "p3", category: "الطباعة", type: "طباعة سليم", weight: "100", priceSalim: 4.20, priceJayir: 2.50 },
        
        // الكشكول
        { id: "k1", category: "الكشكول", type: "كوشة جايير", weight: "115", priceSalim: 4.50, priceJayir: 3.70 },
        { id: "k2", category: "الكشكول", type: "كوشة جايير", weight: "130", priceSalim: 5.10, priceJayir: 4.20 },
        { id: "k3", category: "الكشكول", type: "كوشة جايير", weight: "150", priceSalim: 5.80, priceJayir: 4.80 },
        { id: "k4", category: "الكشكول", type: "كوشة جايير", weight: "170", priceSalim: 6.60, priceJayir: 5.50 },
        { id: "k5", category: "الكشكول", type: "كوشة جايير", weight: "200", priceSalim: 7.80, priceJayir: 6.50 },
        { id: "k6", category: "الكشكول", type: "كوشة جايير", weight: "250", priceSalim: 9.70, priceJayir: 8.00 },
        
        // فستاني
        { id: "f1", category: "فستاني", type: "فستاني سليم", weight: "230", priceSalim: 9.40, priceJayir: 7.80 },
        { id: "f2", category: "فستاني", type: "فستاني سليم", weight: "250", priceSalim: 10.20, priceJayir: 9.10 },
        { id: "f3", category: "فستاني", type: "فستاني سليم", weight: "270", priceSalim: 11.00, priceJayir: 10.45 },
        { id: "f4", category: "فستاني", type: "فستاني سليم", weight: "300", priceSalim: 12.60, priceJayir: 12.20 },
        { id: "f5", category: "فستاني", type: "فستاني سليم", weight: "350", priceSalim: 14.75, priceJayir: 14.75 },
      ]
      setPaperList(defaultPaperList)
      localStorage.setItem("paper_list", JSON.stringify(defaultPaperList))
      console.log("✅ تم إضافة بيانات الخامات الافتراضية", defaultPaperList)
    }
  }, [])

  // ✨ التعديل: ضرب عدد الأفرخ في 4 تلقائياً
  useEffect(() => {
    const count = parseFloat(sheetCount) || 0
    if (count > 0) setTargetQty((count * 4).toString())
  }, [sheetCount])

  const calculateFinal = () => {
    const qty = parseFloat(targetQty) || 1
    const sCount = parseFloat(sheetCount) || 0
    const profit = (parseFloat(profitMargin) || 0) / 100

    if (printType === "offset") {
      const paper = (parseFloat(sheetPrice) || 0) * sCount
      const print = (parseFloat(printPricePer1000) || 0) * qty
      
      // معادلة البصمة: (طول × عرض × 4) + الأكلاشيه
      const basma = ((parseFloat(basmaLength) || 0) * (parseFloat(basmaWidth) || 0) * 4) + (parseFloat(basmaAclashie) || 0)
      
      const solo = (parseFloat(solofanePerSheet) || 0) * sCount
      const spot = (parseFloat(spotPerSheet) || 0) * sCount
      const kavraj = (parseFloat(kavrajPerSheet) || 0) * sCount
      const reega = (parseFloat(reegaPerSheet) || 0) * sCount
      const zinkat = parseFloat(zinkatFixed) || 0
      
      const totalCostRaw = paper + print + basma + solo + spot + kavraj + reega + zinkat + (parseFloat(miscellaneous) || 0)
      const totalCostWithWastage = totalCostRaw * 1.03 // هالك 3%
      
      const sellingTotal = totalCostWithWastage * (1 + profit)
      const pricePer1000 = (sellingTotal / qty) * 1000

      return {
        myTotalCost: totalCostWithWastage.toFixed(2),
        myUnitCost: (totalCostWithWastage / qty).toFixed(2),
        customerPrice1000: pricePer1000.toFixed(2),
        customerTotal: sellingTotal.toFixed(2),
        profitAmount: (sellingTotal - totalCostWithWastage).toFixed(2)
      }
    } else {
      const unitCost = parseFloat(sheetPrice) || 0 // في الديجيتال نعتبر سعر الفرخ هو سعر القطعة
      const finalUnit = unitCost * (1 + profit)
      return { myTotalCost: "0", customerPrice1000: "0", customerTotal: (finalUnit * qty).toFixed(2), profitAmount: "0", myUnitCost: unitCost.toFixed(2) }
    }
  }

  const res = calculateFinal()
  const handleFocus = (e: any) => e.target.select()

  const saveEntry = () => {
    if (!pService) return toast.error("اكتب اسم المنتج")
    const newEntry = {
      id: crypto.randomUUID(),
      service: pService,
      price: pPrice || res.customerPrice1000,
      myCost: res.myUnitCost,
      unit: printType === "offset" ? "1000 قطعة" : "قطعة",
    }
    const newList = [...pricingList, newEntry]
    setPricingList(newList)
    localStorage.setItem("pricing_list", JSON.stringify(newList))
    setPrintFormOpen(false)
    toast.success("تم حفظ السعر في القائمة")
  }

  const updatePaperPrice = (paperId: string, fieldType: "priceSalim" | "priceJayir") => {
    const updatedList = paperList.map(p => 
      p.id === paperId ? { ...p, [fieldType]: parseFloat(editingPrice) || 0 } : p
    )
    setPaperList(updatedList)
    localStorage.setItem("paper_list", JSON.stringify(updatedList))
    setPaperEditOpen(false)
    setEditingPaperId(null)
    toast.success("تم تحديث السعر بنجاح")
  }

  const openPaperEdit = (paperId: string, currentPrice: number) => {
    setEditingPaperId(paperId)
    setEditingPrice(currentPrice.toString())
    setPaperEditOpen(true)
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 text-blue-400"><TrendingUp/> قائمة أسعار التشغيل</h1>
          <p className="text-xs text-slate-400">حساب التكلفة (عليا) وسعر البيع (للزبون)</p>
        </div>
        <Button onClick={() => setPrintFormOpen(true)} className="bg-blue-600 font-bold px-8 h-12">+ تسعير شغلانة جديدة</Button>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <table className="w-full text-right bg-white">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b">
            <tr>
              <th className="p-4">المنتج</th>
              <th className="p-4 text-center">تكلفتي (قطعة)</th>
              <th className="p-4 text-center">سعر الزبون (1000)</th>
              <th className="p-4 text-center">حذف</th>
            </tr>
          </thead>
          <tbody>
            {pricingList.map((p) => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-black">{p.service}</td>
                <td className="p-4 text-center text-red-500 font-mono">{p.myCost} ج.م</td>
                <td className="p-4 text-center text-blue-600 font-black">{p.price} ج.م</td>
                <td className="p-4 text-center"><Button variant="ghost" onClick={() => {
                  const newList = pricingList.filter(i => i.id !== p.id)
                  setPricingList(newList)
                  localStorage.setItem("pricing_list", JSON.stringify(newList))
                }}><Trash2 className="text-red-400 w-4"/></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* جدول الخامات (الورق) */}
      <div className="mt-12 space-y-4">
        <div className="flex items-center gap-3">
          <Box className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-black text-slate-800">قائمة الخامات (الورق)</h2>
        </div>
        
        {paperList.length === 0 ? (
          <Card className="border-2 border-dashed border-amber-200 bg-amber-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-slate-600 font-bold">جاري تحميل بيانات الخامات...</p>
            </CardContent>
          </Card>
        ) : null}
        
        {/* تجميع الورق حسب الفئة */}
        {["الطباعة", "الكشكول", "فستاني"].map(category => {
          const categoryPapers = paperList.filter(p => p.category === category)
          if (categoryPapers.length === 0) return null
          
          return (
            <Card key={category} className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-amber-50 border-b border-amber-200">
                <CardTitle className="text-lg font-black text-amber-900">{category}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-amber-100 text-amber-900 font-bold border-b">
                      <tr>
                        <th className="p-3">النوع</th>
                        <th className="p-3 text-center">الوزن (جرام)</th>
                        <th className="p-3 text-center">سعر سليم</th>
                        <th className="p-3 text-center">سعر جايير</th>
                        <th className="p-3 text-center">تعديل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {categoryPapers.map((paper) => (
                        <tr key={paper.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="p-3 font-bold text-slate-700">{paper.type}</td>
                          <td className="p-3 text-center text-slate-600">{paper.weight}</td>
                          <td className="p-3 text-center">
                            <span className="font-black text-blue-600 cursor-pointer hover:underline" onClick={() => openPaperEdit(paper.id, paper.priceSalim)}>
                              {paper.priceSalim.toFixed(2)} ج.م
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-black text-orange-600 cursor-pointer hover:underline" onClick={() => openPaperEdit(paper.id, paper.priceJayir)}>
                              {paper.priceJayir.toFixed(2)} ج.م
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openPaperEdit(paper.id, paper.priceSalim)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              تعديل
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog تعديل أسعار الورق */}
      <Dialog open={paperEditOpen} onOpenChange={setPaperEditOpen}>
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-black text-amber-800">تعديل سعر الورق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="font-bold text-amber-900 mb-2">السعر الجديد (ج.م)</Label>
              <Input 
                type="number" 
                value={editingPrice} 
                onChange={(e) => setEditingPrice(e.target.value)}
                className="text-2xl h-14 border-2 border-amber-300 text-center font-black"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => updatePaperPrice(editingPaperId || "", "priceSalim")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold h-12"
              >
                تحديث سليم
              </Button>
              <Button 
                onClick={() => updatePaperPrice(editingPaperId || "", "priceJayir")}
                className="flex-1 bg-orange-600 hover:bg-orange-700 font-bold h-12"
              >
                تحديث جايير
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={printFormOpen} onOpenChange={setPrintFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl" dir="rtl">
          <DialogHeader className="border-b pb-4"><DialogTitle className="text-2xl font-black text-blue-800">حاسبة التكاليف المتقدمة</DialogTitle></DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="font-bold">اسم المنتج (مثل: علبة دواء 300 جرام)</Label>
              <Input value={pService} onChange={(e)=>setPService(e.target.value)} required onFocus={handleFocus} className="h-12 border-blue-200 text-lg"/>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl space-y-4 border">
                <h3 className="font-black text-blue-900 border-b pb-2 text-sm italic">الورق والطباعة</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[10px]">سعر الفرخ</Label><Input type="number" value={sheetPrice} onChange={(e)=>setSheetPrice(e.target.value)} onFocus={handleFocus}/></div>
                  <div><Label className="text-[10px] font-bold text-blue-600">عدد الأفرخ</Label><Input type="number" value={sheetCount} onChange={(e)=>setSheetCount(e.target.value)} onFocus={handleFocus} className="border-blue-300"/></div>
                  <div className="col-span-2"><Label className="text-[10px]">سعر طباعة الوحدة</Label><Input type="number" value={printPricePer1000} onChange={(e)=>setPrintPricePer1000(e.target.value)} onFocus={handleFocus}/></div>
                </div>
              </div>

              <div className="bg-orange-50 p-5 rounded-2xl space-y-4 border border-orange-100">
                <h3 className="font-black text-orange-900 border-b pb-2 text-sm italic">البصمة والتشطيب (فرخ)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[10px]">طول بصمة</Label><Input type="number" value={basmaLength} onChange={(e)=>setBasmaLength(e.target.value)} onFocus={handleFocus}/></div>
                  <div><Label className="text-[10px]">عرض بصمة</Label><Input type="number" value={basmaWidth} onChange={(e)=>setBasmaWidth(e.target.value)} onFocus={handleFocus}/></div>
                  <div className="col-span-2"><Label className="text-[10px]">أكلاشيه ثابت</Label><Input type="number" value={basmaAclashie} onChange={(e)=>setBasmaAclashie(e.target.value)} onFocus={handleFocus}/></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-slate-900 p-5 rounded-2xl text-white">
              <div><Label className="text-slate-400 font-bold">الكمية (فرخ×4)</Label><Input className="bg-white/10 text-white font-black text-xl h-12" type="number" value={targetQty} readOnly /></div>
              <div><Label className="text-slate-400">نثريات</Label><Input className="bg-white/10 text-white h-12" type="number" value={miscellaneous} onChange={(e)=>setMiscellaneous(e.target.value)} onFocus={handleFocus}/></div>
              <div><Label className="text-slate-400 font-bold">الربح %</Label><Input className="bg-white/10 text-green-400 font-black text-xl h-12" type="number" value={profitMargin} onChange={(e)=>setProfitMargin(e.target.value)} onFocus={handleFocus}/></div>
            </div>

            <div className="p-6 bg-green-50 border-2 border-green-200 rounded-3xl space-y-4">
              <div className="flex justify-between items-center"><span className="text-green-800 font-black text-2xl">سعر الألف للزبون:</span><span className="font-black text-3xl text-green-600">{res.customerPrice1000} ج.م</span></div>
              <div className="grid grid-cols-2 gap-4 text-xs text-green-700 border-t border-green-200 pt-4 font-bold italic">
                <span>تكلفتي الإجمالية: {res.myTotalCost} ج.م</span>
                <span>تكلفة القطعة (خشب): {res.myUnitCost} ج.م</span>
                <span className="col-span-2 text-center text-sm mt-2 text-green-900 font-black">صافي ربحي المتوقع: {res.profitAmount} ج.م</span>
              </div>
              <Button onClick={() => setPPrice(res.customerPrice1000)} className="w-full bg-green-600 font-black h-12">اعتماد هذا السعر</Button>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-blue-700">السعر النهائي في القائمة (ج.م) *</Label>
              <Input type="number" value={pPrice} onChange={(e)=>setPPrice(e.target.value)} className="text-4xl h-20 border-4 border-blue-600 text-center font-black rounded-2xl bg-white shadow-inner" onFocus={handleFocus}/>
            </div>

            <Button onClick={saveEntry} className="w-full h-16 bg-slate-900 text-2xl font-black rounded-2xl shadow-2xl">حفظ في القائمة</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}