"use server";

import { revalidatePath } from "next/cache";
import { ensureItemsTable, getDb } from "@/lib/db";
import {
  ActionResult,
  CreateItemInput,
  FALLBACK_PLANS,
  FallbackPlan,
  ITEM_CATEGORIES,
  ItemCategory,
  ItemStatus,
  ItemsAndMetricsResponse,
  PublicItem,
  SustainabilityMetrics,
} from "@/lib/types";

/**
 * Membersihkan nomor WhatsApp agar seragam diawali 628 tanpa spasi/strip/tanda plus.
 */
function normalizeWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("6208")) {
    return "62" + digits.slice(3);
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  if (digits.startsWith("08")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  return digits;
}

/**
 * SVG data URI ringan untuk data seed awal agar kartu barang tampil rapi tanpa dependensi eksternal.
 */
function createSeedPlaceholderImage(
  label: string,
  subtitle: string,
  bgStart: string,
  bgEnd: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="450" fill="url(#g)"/>
    <circle cx="510" cy="85" r="95" fill="rgba(255,255,255,0.12)"/>
    <circle cx="90" cy="390" r="120" fill="rgba(255,255,255,0.10)"/>
    <rect x="48" y="310" width="504" height="92" rx="18" fill="rgba(15,23,42,0.34)"/>
    <text x="72" y="348" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700">${label}</text>
    <text x="72" y="380" fill="rgba(255,255,255,0.88)" font-family="system-ui, -apple-system, sans-serif" font-size="16">${subtitle}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Mengisi 3 data contoh mahasiswa ITB Jatinangor apabila tabel masih kosong.
 */
async function seedInitialItemsIfEmpty() {
  const sql = getDb();
  const countRows = await sql`SELECT COUNT(*)::int AS total FROM items`;
  const total = Number(countRows[0]?.total ?? 0);

  if (total > 0) return;

  const seedItems = [
    {
      title: "Buku Kalkulus Purcell Edisi 9 (Jilid 1 & 2)",
      description:
        "Buku pegangan TPB ITB masih bersih, halaman lengkap tanpa robek, hanya ada sedikit stabilo di bab turunan dan integral. Cocok untuk mahasiswa baru TPB Jatinangor.",
      category: "Buku",
      condition: 4,
      price: 0,
      estimated_weight_kg: 1.8,
      fallback_plan: "Disimpan di kos",
      location: "Asrama ITB Jatinangor",
      seller_name: "Nadia Putri",
      is_itb: true,
      seller_wa: "6281234567801",
      pin: "1234",
      status: "Tersedia",
      buyer_name: null,
      buyer_wa: null,
      image_data: createSeedPlaceholderImage(
        "Buku Kalkulus TPB",
        "Gratis / Giveaway • Asrama ITB Jatinangor",
        "#047857",
        "#0f766e"
      ),
    },
    {
      title: "Rice Cooker Mini Cosmos 0.6L + Steamer",
      description:
        "Pemakaian 1 tahun di kos, fungsi memasak dan menghangatkan normal 100%, panci anti lengket masih mulus. Dilepas karena mau pindah kos setelah lulus.",
      category: "Barang Elektronik",
      condition: 4,
      price: 115000,
      estimated_weight_kg: 2.2,
      fallback_plan: "Akan dibuang",
      location: "Ciseke",
      seller_name: "Raka Pratama",
      is_itb: true,
      seller_wa: "6281234567802",
      pin: "2026",
      status: "Tersedia",
      buyer_name: null,
      buyer_wa: null,
      image_data: createSeedPlaceholderImage(
        "Rice Cooker Mini 0.6L",
        "Kondisi 4/5 • Ciseke, Jatinangor",
        "#0369a1",
        "#1d4ed8"
      ),
    },
    {
      title: "Rak Buku Lipat 4 Susun & Lampu Belajar LED",
      description:
        "Satu paket rak serbaguna ringan dan lampu meja jepit. Sudah diambil oleh adik tingkat dari kos sebelah daripada dibuang saat pindahan asrama.",
      category: "Perlengkapan Kamar",
      condition: 5,
      price: 0,
      estimated_weight_kg: 3.5,
      fallback_plan: "Akan dibuang",
      location: "Sayang",
      seller_name: "Dimas Mahendra",
      is_itb: true,
      seller_wa: "6281234567803",
      pin: "4321",
      status: "Sudah Tersalurkan",
      buyer_name: "Fajar",
      buyer_wa: "6281299988877",
      image_data: createSeedPlaceholderImage(
        "Rak 4 Susun + Lampu LED",
        "Sudah Tersalurkan • Sayang, Jatinangor",
        "#334155",
        "#0f172a"
      ),
    },
  ];

  for (const item of seedItems) {
    await sql`
      INSERT INTO items (
        title,
        description,
        category,
        condition,
        price,
        estimated_weight_kg,
        fallback_plan,
        location,
        seller_name,
        is_itb,
        seller_wa,
        pin,
        status,
        buyer_name,
        buyer_wa,
        image_data
      ) VALUES (
        ${item.title},
        ${item.description},
        ${item.category},
        ${item.condition},
        ${item.price},
        ${item.estimated_weight_kg},
        ${item.fallback_plan},
        ${item.location},
        ${item.seller_name},
        ${item.is_itb},
        ${item.seller_wa},
        ${item.pin},
        ${item.status},
        ${item.buyer_name},
        ${item.buyer_wa},
        ${item.image_data}
      )
    `;
  }
}

/**
 * Mengambil daftar seluruh barang (TANPA kolom `pin`) beserta metrik dampak keberlanjutan SDG 12.5.
 */
export async function getItemsAndMetrics(): Promise<ItemsAndMetricsResponse> {
  await ensureItemsTable();
  await seedInitialItemsIfEmpty();

  const sql = getDb();

  // WAJIB: Kolom `pin` tidak disertakan pada query SELECT agar tidak bocor ke client/browser
  const rows = await sql`
    SELECT
      id,
      title,
      description,
      category,
      condition,
      price,
      estimated_weight_kg,
      fallback_plan,
      location,
      seller_name,
      is_itb,
      seller_wa,
      status,
      buyer_name,
      buyer_wa,
      image_data,
      created_at
    FROM items
    ORDER BY created_at DESC, id DESC
  `;

  const items: PublicItem[] = rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    category: row.category as ItemCategory,
    condition: Number(row.condition),
    price: Number(row.price),
    estimated_weight_kg: Number(row.estimated_weight_kg),
    fallback_plan: row.fallback_plan as FallbackPlan,
    location: String(row.location),
    seller_name: String(row.seller_name),
    is_itb: Boolean(row.is_itb),
    seller_wa: String(row.seller_wa),
    status: row.status as ItemStatus,
    buyer_name: row.buyer_name ? String(row.buyer_name) : null,
    buyer_wa: row.buyer_wa ? String(row.buyer_wa) : null,
    image_data: row.image_data ? String(row.image_data) : null,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(String(row.created_at)).toISOString(),
  }));

  const totalItems = items.length;
  const distributedList = items.filter(
    (item) => item.status === "Sudah Tersalurkan"
  );
  const distributedItems = distributedList.length;
  const distributedPercentage =
    totalItems > 0
      ? Number(((distributedItems / totalItems) * 100).toFixed(1))
      : 0;

  const totalReuseMassKg = Number(
    distributedList
      .reduce((sum, item) => sum + item.estimated_weight_kg, 0)
      .toFixed(2)
  );

  const preventedWasteMassKg = Number(
    distributedList
      .filter((item) => item.fallback_plan === "Akan dibuang")
      .reduce((sum, item) => sum + item.estimated_weight_kg, 0)
      .toFixed(2)
  );

  const metrics: SustainabilityMetrics = {
    totalItems,
    distributedItems,
    distributedPercentage,
    totalReuseMassKg,
    preventedWasteMassKg,
  };

  return { items, metrics };
}

/**
 * Menambahkan barang baru ke database.
 */
export async function createItem(
  data: CreateItemInput
): Promise<ActionResult<{ id: number }>> {
  try {
    await ensureItemsTable();

    const title = data.title?.trim();
    const description = data.description?.trim() || "";
    const location = data.location?.trim();
    const sellerName = data.seller_name?.trim();
    const cleanedWa = normalizeWhatsApp(data.seller_wa || "");
    const pin = (data.pin || "").trim();

    if (!title || title.length < 3) {
      return { success: false, error: "Judul barang minimal 3 karakter." };
    }
    if (!ITEM_CATEGORIES.includes(data.category)) {
      return { success: false, error: "Kategori barang tidak valid." };
    }
    if (!FALLBACK_PLANS.includes(data.fallback_plan)) {
      return {
        success: false,
        error: "Pilihan rencana jika barang tidak tersalurkan tidak valid.",
      };
    }

    const condition = Number(data.condition);
    if (!Number.isInteger(condition) || condition < 1 || condition > 5) {
      return { success: false, error: "Skala kondisi harus antara 1 sampai 5." };
    }

    const price = Math.max(0, Math.round(Number(data.price) || 0));
    const weight = Number(data.estimated_weight_kg);
    if (Number.isNaN(weight) || weight <= 0 || weight > 999.99) {
      return {
        success: false,
        error: "Estimasi berat harus lebih dari 0 kg (maks. 999.99 kg).",
      };
    }

    if (!location) {
      return { success: false, error: "Lokasi kos/asrama wajib diisi." };
    }
    if (!sellerName) {
      return { success: false, error: "Nama penjual wajib diisi." };
    }
    if (!cleanedWa || cleanedWa.length < 10) {
      return {
        success: false,
        error: "Nomor WhatsApp tidak valid. Gunakan format seperti 0812xxxx.",
      };
    }
    if (!/^\d{4}$/.test(pin)) {
      return {
        success: false,
        error: "PIN rahasia harus berupa tepat 4 digit angka.",
      };
    }

    const normalizedEmail = (data.seller_email || "").trim().toLowerCase();
    const isItb = normalizedEmail.endsWith("@mahasiswa.itb.ac.id");

    const imageData =
      data.image_data && data.image_data.startsWith("data:image/")
        ? data.image_data
        : null;

    const sql = getDb();
    const inserted = await sql`
      INSERT INTO items (
        title,
        description,
        category,
        condition,
        price,
        estimated_weight_kg,
        fallback_plan,
        location,
        seller_name,
        is_itb,
        seller_wa,
        pin,
        status,
        image_data
      ) VALUES (
        ${title},
        ${description},
        ${data.category},
        ${condition},
        ${price},
        ${Number(weight.toFixed(2))},
        ${data.fallback_plan},
        ${location},
        ${sellerName},
        ${isItb},
        ${cleanedWa},
        ${pin},
        'Tersedia',
        ${imageData}
      )
      RETURNING id
    `;

    revalidatePath("/");

    return {
      success: true,
      message: "Barang berhasil ditayangkan!",
      data: { id: Number(inserted[0].id) },
    };
  } catch (error) {
    console.error("Error createItem:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan barang. Silakan coba lagi.",
    };
  }
}

/**
 * Mengubah status barang dari 'Tersedia' menjadi 'Dalam Proses' dan menyimpan data penerima/pembeli.
 */
export async function bookItem(
  id: number,
  buyerName: string,
  buyerWa: string
): Promise<ActionResult> {
  try {
    await ensureItemsTable();

    const cleanName = buyerName?.trim();
    const cleanedWa = normalizeWhatsApp(buyerWa || "");

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Nama penerima/pembeli wajib diisi." };
    }
    if (!cleanedWa || cleanedWa.length < 10) {
      return {
        success: false,
        error: "Nomor WhatsApp penerima/pembeli tidak valid.",
      };
    }

    const sql = getDb();
    const updated = await sql`
      UPDATE items
      SET
        status = 'Dalam Proses',
        buyer_name = ${cleanName},
        buyer_wa = ${cleanedWa}
      WHERE id = ${id} AND status = 'Tersedia'
      RETURNING id
    `;

    if (updated.length === 0) {
      return {
        success: false,
        error:
          "Barang tidak ditemukan atau saat ini sudah tidak berstatus Tersedia.",
      };
    }

    revalidatePath("/");

    return {
      success: true,
      message:
        "Booking berhasil! Silakan lanjutkan koordinasi pengambilan dengan penjual via WhatsApp.",
    };
  } catch (error) {
    console.error("Error bookItem:", error);
    return {
      success: false,
      error: "Gagal memproses booking barang. Silakan coba lagi.",
    };
  }
}

/**
 * Memverifikasi 4 digit PIN penjual di server lalu mengubah status menjadi 'Sudah Tersalurkan'.
 */
export async function markAsSold(
  id: number,
  inputPin: string
): Promise<ActionResult> {
  try {
    await ensureItemsTable();

    const cleanPin = (inputPin || "").trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return {
        success: false,
        error: "Masukkan tepat 4 digit angka PIN penjual.",
      };
    }

    const sql = getDb();
    const rows = await sql`
      SELECT id, pin, status
      FROM items
      WHERE id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { success: false, error: "Barang tidak ditemukan." };
    }

    const item = rows[0];
    if (item.status === "Sudah Tersalurkan") {
      return {
        success: false,
        error: "Barang ini sudah berstatus Sudah Tersalurkan.",
      };
    }

    if (String(item.pin) !== cleanPin) {
      return {
        success: false,
        error: "PIN tidak cocok. Pastikan 4 digit PIN sesuai saat mengunggah barang.",
      };
    }

    await sql`
      UPDATE items
      SET status = 'Sudah Tersalurkan'
      WHERE id = ${id}
    `;

    revalidatePath("/");

    return {
      success: true,
      message:
        "Barang berhasil ditandai Sudah Tersalurkan! Terima kasih telah mendukung ekonomi sirkular.",
    };
  } catch (error) {
    console.error("Error markAsSold:", error);
    return {
      success: false,
      error: "Gagal memperbarui status barang. Silakan coba lagi.",
    };
  }
}