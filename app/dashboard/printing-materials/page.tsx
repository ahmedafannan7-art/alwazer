"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Box, Trash2, Plus, Save, Layers, Calculator } from "lucide-react"
import { toast } from "sonner"

export default function PrintingMaterialsPage() {
  const [prices, setPrices] = useState({ solo: "2", spot: "1.60", kavraj: "2", reega: "0.5", basmaFactor: "4", wastage: "3", misc: "50" })
  const [paperList, setPaperList] = useState<any[]>([])
  
  const [newPaperName, setNewPaperName] = useState("")
  const [priceSalim, setPriceSalim] = useState("")
  const [priceJayir, setPriceJayir] = useState("")

  useEffect(() => {
    const savedSettings = localStorage.getItem("global_settings")
    const savedPaper = localStorage.getItem("paper_list")
    if (savedSettings) setPrices(JSON.parse(savedSettings))
    if (savedPaper) setPaperList(JSON.parse(savedPaper))
  }, [])

  const addPaper = () => {
    if (!newPaperName || !priceSalim) return toast.error("اسم الورق وسعر السليم مطلوبين")
    const updatedPaper = [...paperList, { id: crypto.randomUUID(), name: newPaperName, priceSalim: priceSalim, priceJayir: priceJayir || "0" }]
    setPaperList(updatedPaper)
    localStorage.setItem("paper_list", JSON.stringify(updatedPaper))
    setNewPaperName(""); setPriceSalim(""); setPriceJayir("")
    toast.success("تمت إضافة الورق")
  }

  const deletePaper = (id: string) => {
    const updated = paperList.filter(p => p.id !== id)
    setPaperList(updated)
    localStorage.setItem("paper_list", JSON.stringify(updated))
  }

  const saveSettings = () => {
    localStorage.setItem("global_settings", JSON.stringify(prices))
    toast.success("تم حفظ إعدادات التشطيب")
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-black flex items-center gap-2"><Box className="text-blue-600"/> خامات الورق والتشطيب</h1>
        <Button onClick={saveSettings} className="bg-blue-600 font-bold px-8 h-12">حفظ التغييرات</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle className="text-lg font-black italic">إدارة أسعار الورق (سليم / جاير)</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-3 mb-6 bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-200">
                <div className="col-span-1 space-y-1"><Label>نوع الورق</Label><Input value={newPaperName} onChange={(e)=>setNewPaperName(e.target.value)} placeholder="كوشيه 150ج"/></div>
                <div className="space-y-1"><Label>سعر السليم</Label><Input type="number" value={priceSalim} onChange={(e)=>setPriceSalim(e.target.value)} placeholder="0.00"/></div>
                <div className="space-y-1"><Label>سعر الجاير</Label><Input type="number" value={priceJayir} onChange={(e)=>setPriceJayir(e.target.value)} placeholder="اختياري"/></div>
                <Button onClick={addPaper} className="mt-5 bg-green-600 font-black">إضافة</Button>
            </div>
            <table className="w-full text-right"><thead className="bg-slate-100 text-slate-500 text-xs font-bold"><tr><th className="p-4">نوع الورق</th><th className="p-4 text-center">السليم</th><th className="p-4 text-center">الجاير</th><th className="p-4 text-center">حذف</th></tr></thead>
              <tbody>{paperList.map(p => (<tr key={p.id} className="border-b hover:bg-slate-50 font-bold"><td className="p-4">{p.name}</td><td className="p-4 text-center text-green-700">{p.priceSalim} ج.م</td><td className="p-4 text-center text-orange-600">{p.priceJayir !== "0" ? `${p.priceJayir} ج.م` : "—"}</td><td className="p-4 text-center"><Button variant="ghost" onClick={()=>deletePaper(p.id)}><Trash2 className="text-red-400 w-4"/></Button></td></tr>))}</tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md p-6 bg-white space-y-6">
             <h3 className="font-black border-b pb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500"/> أسعار التشطيب (فرخ)</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>سلوفان</Label><Input type="number" value={prices.solo} onChange={(e)=>setPrices({...prices, solo: e.target.value})}/></div>
                <div className="space-y-1"><Label>إسبوط</Label><Input type="number" value={prices.spot} onChange={(e)=>setPrices({...prices, spot: e.target.value})}/></div>
                <div className="space-y-1"><Label>كفراج</Label><Input type="number" value={prices.kavraj} onChange={(e)=>setPrices({...prices, kavraj: e.target.value})}/></div>
                <div className="space-y-1"><Label>ريجة</Label><Input type="number" value={prices.reega} onChange={(e)=>setPrices({...prices, reega: e.target.value})}/></div>
             </div>
             <h3 className="font-black border-b pb-2 flex items-center gap-2"><Calculator className="w-4 h-4 text-orange-500"/> ثوابت الحساب</h3>
             <div className="space-y-3">
                <div className="flex justify-between items-center"><Label>معامل البصمة (X4):</Label><Input className="w-16 text-center" type="number" value={prices.basmaFactor} onChange={(e)=>setPrices({...prices, basmaFactor: e.target.value})}/></div>
                <div className="flex justify-between items-center"><Label>الهالك (%):</Label><Input className="w-16 text-center" type="number" value={prices.wastage} onChange={(e)=>setPrices({...prices, wastage: e.target.value})}/></div>
             </div>
        </Card>
      </div>
    </div>
  )
}