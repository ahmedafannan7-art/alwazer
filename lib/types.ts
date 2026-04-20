export interface Client {
  id: string
  name: string
  phone: string
  company: string
  notes: string
  createdAt: string
}

export interface InvoiceItem {
  service: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  serviceType: "printing" | "social-media"
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  status: "paid" | "unpaid" | "partial"
  paidAmount: number
  createdAt: string
  notes: string
}

export type ExpenseCategory = "rent" | "salaries" | "materials" | "ads" | "other"

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  createdAt: string
}

export interface PrintingPrice {
  id: string
  service: string
  price: number
  unit: string
  notes: string
}

export interface PrintingAddon {
  id: string
  name: string
  price: number
  notes: string
}

export interface SocialMediaPackage {
  id: string
  name: string
  tier: "basic" | "standard" | "premium"
  price: number
  features: string[]
}

export interface AppSettings {
  registeredIP: string
  companyName: string
  companyPhone: string
  companyAddress: string
  taxRate: number
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  rent: "ايجار",
  salaries: "رواتب",
  materials: "مواد خام",
  ads: "اعلانات",
  other: "اخرى",
}

export const INVOICE_STATUS_LABELS: Record<Invoice["status"], string> = {
  paid: "مدفوعة",
  unpaid: "غير مدفوعة",
  partial: "مدفوعة جزئيا",
}
