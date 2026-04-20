"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  Client,
  Invoice,
  Expense,
  PrintingPrice,
  SocialMediaPackage,
  AppSettings,
} from "./types"

const STORE_KEYS = {
  clients: "acc_clients",
  invoices: "acc_invoices",
  expenses: "acc_expenses",
  printingPrices: "acc_printing_prices",
  socialMediaPackages: "acc_social_packages",
  settings: "acc_settings",
} as const

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// Custom event for cross-component reactivity
const STORAGE_EVENT = "acc_storage_update"

function emitStorageUpdate(key: string) {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }))
}

export function useStore<T>(key: string, fallback: T) {
  const [data, setData] = useState<T>(fallback)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setData(getFromStorage(key, fallback))
    setLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.key === key) {
        setData(getFromStorage(key, fallback))
      }
    }
    window.addEventListener(STORAGE_EVENT, handler)
    return () => window.removeEventListener(STORAGE_EVENT, handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const save = useCallback(
    (newData: T) => {
      setData(newData)
      setToStorage(key, newData)
      emitStorageUpdate(key)
    },
    [key]
  )

  return { data, save, loaded }
}

// Typed store hooks
export function useClients() {
  return useStore<Client[]>(STORE_KEYS.clients, [])
}

export function useInvoices() {
  return useStore<Invoice[]>(STORE_KEYS.invoices, [])
}

export function useExpenses() {
  return useStore<Expense[]>(STORE_KEYS.expenses, [])
}

export function usePrintingPrices() {
  return useStore<PrintingPrice[]>(STORE_KEYS.printingPrices, getDefaultPrintingPrices())
}

export function useSocialMediaPackages() {
  return useStore<SocialMediaPackage[]>(STORE_KEYS.socialMediaPackages, getDefaultSocialPackages())
}

export function useSettings() {
  return useStore<AppSettings>(STORE_KEYS.settings, getDefaultSettings())
}

function getDefaultSettings(): AppSettings {
  return {
    registeredIP: "",
    companyName: "شركة الاعلانات",
    companyPhone: "01000000000",
    companyAddress: "جمهورية مصر العربية",
    taxRate: 14,
  }
}

function getDefaultPrintingPrices(): PrintingPrice[] {
  return [
    { id: "1", service: "طباعة بنر", price: 25, unit: "متر مربع", notes: "" },
    { id: "2", service: "طباعة ستيكر", price: 30, unit: "متر مربع", notes: "" },
    { id: "3", service: "طباعة كروت شخصية", price: 150, unit: "500 كرت", notes: "" },
    { id: "4", service: "طباعة بروشورات", price: 200, unit: "500 نسخة", notes: "" },
    { id: "5", service: "طباعة رول اب", price: 120, unit: "قطعة", notes: "" },
    { id: "6", service: "طباعة لوحة اكريليك", price: 350, unit: "متر مربع", notes: "" },
  ]
}

function getDefaultSocialPackages(): SocialMediaPackage[] {
  return [
    {
      id: "1",
      name: "الباقة الاساسية",
      tier: "basic",
      price: 1500,
      features: ["ادارة حسابين", "15 منشور شهريا", "تصميم بوستات", "تقرير شهري"],
    },
    {
      id: "2",
      name: "الباقة المتقدمة",
      tier: "standard",
      price: 3000,
      features: [
        "ادارة 4 حسابات",
        "30 منشور شهريا",
        "تصميم بوستات وستوريز",
        "ادارة الحملات الاعلانية",
        "تقرير اسبوعي",
      ],
    },
    {
      id: "3",
      name: "الباقة الاحترافية",
      tier: "premium",
      price: 5000,
      features: [
        "ادارة 6 حسابات",
        "60 منشور شهريا",
        "تصميم بوستات وستوريز وريلز",
        "ادارة الحملات الاعلانية",
        "تصوير منتجات",
        "تقرير يومي",
        "مدير حساب مخصص",
      ],
    },
  ]
}

// Export/Import all data
export function exportAllData(): string {
  const allData = {
    clients: getFromStorage(STORE_KEYS.clients, []),
    invoices: getFromStorage(STORE_KEYS.invoices, []),
    expenses: getFromStorage(STORE_KEYS.expenses, []),
    printingPrices: getFromStorage(STORE_KEYS.printingPrices, []),
    socialMediaPackages: getFromStorage(STORE_KEYS.socialMediaPackages, []),
    settings: getFromStorage(STORE_KEYS.settings, {}),
    exportDate: new Date().toISOString(),
  }
  return JSON.stringify(allData, null, 2)
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    if (data.clients) setToStorage(STORE_KEYS.clients, data.clients)
    if (data.invoices) setToStorage(STORE_KEYS.invoices, data.invoices)
    if (data.expenses) setToStorage(STORE_KEYS.expenses, data.expenses)
    if (data.printingPrices) setToStorage(STORE_KEYS.printingPrices, data.printingPrices)
    if (data.socialMediaPackages) setToStorage(STORE_KEYS.socialMediaPackages, data.socialMediaPackages)
    if (data.settings) setToStorage(STORE_KEYS.settings, data.settings)
    // Emit updates for all keys
    Object.values(STORE_KEYS).forEach(emitStorageUpdate)
    return true
  } catch {
    return false
  }
}

export function clearAllData(): void {
  Object.values(STORE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
    emitStorageUpdate(key)
  })
}

// Generate next invoice number
export function generateInvoiceNumber(invoices: Invoice[]): string {
  const year = new Date().getFullYear()
  const count = invoices.filter((inv) => inv.invoiceNumber.startsWith(`INV-${year}`)).length
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`
}
