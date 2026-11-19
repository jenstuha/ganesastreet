export const APP_NAME = "GanesaStreet";
export const APP_TAGLINE = "Give Your Items a Second Life";
export const APP_SUBTITLE =
  "Give Your Items a Second Life — Penyaluran Barang Layak Pakai Mahasiswa ITB Jatinangor";

export const ITEM_CATEGORIES = [
  "Peralatan Rumah Tangga",
  "Buku",
  "Perlengkapan Kamar",
  "Barang Elektronik",
  "Lainnya",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const FALLBACK_PLANS = [
  "Akan dibuang",
  "Disimpan di kos",
  "Lainnya",
] as const;

export type FallbackPlan = (typeof FALLBACK_PLANS)[number];

export const ITEM_STATUSES = [
  "Tersedia",
  "Dalam Proses",
  "Sudah Tersalurkan",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const LOCATION_SUGGESTIONS = [
  "Asrama ITB Jatinangor",
  "Ciseke",
  "Sayang",
  "Kos Cisitu/Jatinangor",
  "Hegarmanah",
  "Cikuda",
] as const;

/**
 * Representasi publik barang yang dikirim ke browser.
 * Kolom `pin` sengaja TIDAK pernah disertakan pada tipe maupun query SELECT.
 */
export interface PublicItem {
  id: number;
  title: string;
  description: string | null;
  category: ItemCategory;
  condition: number;
  price: number;
  estimated_weight_kg: number;
  fallback_plan: FallbackPlan;
  location: string;
  seller_name: string;
  is_itb: boolean;
  seller_wa: string;
  status: ItemStatus;
  buyer_name: string | null;
  buyer_wa: string | null;
  image_data: string | null;
  created_at: string;
}

export interface SustainabilityMetrics {
  totalItems: number;
  distributedItems: number;
  distributedPercentage: number;
  totalReuseMassKg: number;
  preventedWasteMassKg: number;
}

export interface ItemsAndMetricsResponse {
  items: PublicItem[];
  metrics: SustainabilityMetrics;
}

export interface CreateItemInput {
  title: string;
  description: string;
  category: ItemCategory;
  condition: number;
  price: number;
  estimated_weight_kg: number;
  fallback_plan: FallbackPlan;
  location: string;
  seller_name: string;
  seller_email?: string;
  seller_wa: string;
  pin: string;
  image_data: string | null;
}

export interface ActionResult<T = undefined> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}