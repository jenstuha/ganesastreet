"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Gift,
  Leaf,
  MapPin,
  PackageCheck,
  Plus,
  Recycle,
  Scale,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { getItemsAndMetrics } from "@/app/actions";
import {
  APP_NAME,
  APP_SUBTITLE,
  PublicItem,
  SustainabilityMetrics,
} from "@/lib/types";
import ItemDetailModal from "@/components/ItemDetailModal";
import UploadItemModal from "@/components/UploadItemModal";

interface GanesaStreetAppProps {
  initialItems: PublicItem[];
  initialMetrics: SustainabilityMetrics;
}

const QUICK_FILTERS = [
  "Semua",
  "Gratis (Giveaway)",
  "Peralatan Rumah Tangga",
  "Buku",
  "Perlengkapan Kamar",
  "Barang Elektronik",
  "Lainnya",
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusBadgeClass(status: PublicItem["status"]): string {
  switch (status) {
    case "Tersedia":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "Dalam Proses":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "Sudah Tersalurkan":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
}

export default function GanesaStreetApp({
  initialItems,
  initialMetrics,
}: GanesaStreetAppProps) {
  const [items, setItems] = useState<PublicItem[]>(initialItems);
  const [metrics, setMetrics] = useState<SustainabilityMetrics>(initialMetrics);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("Semua");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getItemsAndMetrics();
      setItems(fresh.items);
      setMetrics(fresh.metrics);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // Filter berdasarkan tombol cepat
      if (activeFilter === "Gratis (Giveaway)" && item.price !== 0) {
        return false;
      }
      if (
        activeFilter !== "Semua" &&
        activeFilter !== "Gratis (Giveaway)" &&
        item.category !== activeFilter
      ) {
        return false;
      }

      // Pencarian berdasarkan judul barang atau lokasi kos/asrama
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchLocation = item.location.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchLocation && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [items, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Recycle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                  {APP_NAME}
                </span>
                <span className="hidden rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200 sm:inline-block">
                  ITB Jatinangor
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-500 sm:text-xs">
                Give Your Items a Second Life
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Salurkan Barang</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-7">
        {/* Hero Banner & SDG 12.5 Sustainability Impact Bar */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-5 text-white shadow-md sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-teal-400/15 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="max-w-2xl">
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-50 backdrop-blur-sm">
                <Leaf className="h-3.5 w-3.5" />
                <span>Ekonomi Sirkular Kampus • SDG 12 Target 12.5</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {APP_NAME}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-emerald-50/90 sm:text-base">
                {APP_SUBTITLE}
              </p>
            </div>

            {/* Banner Dampak Keberlanjutan (3 Metrik Live dari Neon PostgreSQL) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-emerald-100">
                  <span className="text-xs font-medium">
                    Barang Tersalurkan
                  </span>
                  <PackageCheck className="h-4 w-4 text-emerald-200" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tracking-tight">
                    {metrics.distributedPercentage}%
                  </span>
                  <span className="text-xs text-emerald-100/80">
                    ({metrics.distributedItems} dari {metrics.totalItems} barang)
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-emerald-100">
                  <span className="text-xs font-medium">Total Massa Reuse</span>
                  <Scale className="h-4 w-4 text-emerald-200" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight">
                    {metrics.totalReuseMassKg}
                  </span>
                  <span className="text-sm font-semibold text-emerald-100">
                    kg
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-emerald-100">
                  <span className="text-xs font-medium">
                    Potensi Sampah Dicegah
                  </span>
                  <Trash2 className="h-4 w-4 text-emerald-200" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight">
                    {metrics.preventedWasteMassKg}
                  </span>
                  <span className="text-sm font-semibold text-emerald-100">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Terstruktur */}
        <section className="mt-6 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang atau lokasi kos (mis. Ciseke, Asrama, buku, kipas)..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            {QUICK_FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              const isGiveaway = filter === "Gratis (Giveaway)";

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? isGiveaway
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {isGiveaway && <Gift className="h-3.5 w-3.5" />}
                  <span>{filter}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Info Jumlah Hasil */}
        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <p>
            Menampilkan{" "}
            <span className="font-semibold text-slate-900">
              {filteredItems.length}
            </span>{" "}
            barang
            {activeFilter !== "Semua" ? ` pada filter "${activeFilter}"` : ""}
          </p>
          {isRefreshing && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Memperbarui data...
            </span>
          )}
        </div>

        {/* Grid Kartu Barang */}
        {filteredItems.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Belum ada barang yang cocok
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Coba ubah kata kunci pencarian atau filter kategori, atau mulai
              salurkan barang layak pakai milikmu sekarang.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("Semua");
              }}
              className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Pencarian & Filter
            </button>
          </div>
        ) : (
          <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const isFree = item.price === 0;
              const isSold = item.status === "Sudah Tersalurkan";

              return (
                <article
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedItemId(item.id);
                    }
                  }}
                  className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md ${
                    isSold ? "opacity-80" : ""
                  }`}
                >
                  {/* Foto Barang */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    {item.image_data ? (
                      <img
                        src={item.image_data}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-400">
                        <Recycle className="h-9 w-9" />
                        <span className="text-xs font-medium">Tanpa Foto</span>
                      </div>
                    )}

                    {/* Status Badge di Kiri Atas */}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>

                    {/* Kategori di Kanan Bawah */}
                    <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-slate-900/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* Detail Ringkas Kartu */}
                  <div className="flex flex-1 flex-col p-4">
                    {/* Harga atau Badge Gratis */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      {isFree ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white">
                          <Gift className="h-3 w-3" />
                          GRATIS / GIVEAWAY
                        </span>
                      ) : (
                        <span className="text-base font-extrabold text-slate-900">
                          {formatRupiah(item.price)}
                        </span>
                      )}

                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {item.estimated_weight_kg} kg
                      </span>
                    </div>

                    {/* Judul */}
                    <h2 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-emerald-700 sm:text-base">
                      {item.title}
                    </h2>

                    {/* Kondisi & Lokasi */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 font-medium ring-1 ring-slate-200/80">
                        Kondisi {item.condition}/5
                      </span>
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{item.location}</span>
                      </span>
                    </div>

                    {/* Footer Penjual & Badge Mahasiswa ITB */}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-4">
                      <span className="truncate text-xs font-medium text-slate-700">
                        {item.seller_name}
                      </span>
                      {item.is_itb && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          <span>✓ Mahasiswa ITB</span>
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Modal Detail Barang */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onSuccess={async () => {
            await refreshData();
          }}
        />
      )}

      {/* Modal Upload Barang */}
      {isUploadOpen && (
        <UploadItemModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={async () => {
            setIsUploadOpen(false);
            await refreshData();
          }}
        />
      )}
    </div>
  );
}