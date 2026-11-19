"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Gift,
  ImagePlus,
  KeyRound,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createItem } from "@/app/actions";
import {
  FALLBACK_PLANS,
  FallbackPlan,
  ITEM_CATEGORIES,
  ItemCategory,
  LOCATION_SUGGESTIONS,
} from "@/lib/types";

interface UploadItemModalProps {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const CONDITION_LABELS: Record<number, string> = {
  1: "1 - Layak pakai (ada minus)",
  2: "2 - Cukup baik",
  3: "3 - Baik",
  4: "4 - Sangat baik",
  5: "5 - Seperti baru",
};

/**
 * Kompresi foto otomatis di browser menggunakan HTML5 Canvas:
 * - Lebar maksimal 600px (rasio aspek dipertahankan)
 * - Format JPEG kualitas 0.7 menjadi Base64 ringan
 */
function compressImageToBase64(file: File): Promise<{
  dataUrl: string;
  sizeKb: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.onload = () => {
        const maxWidth = 600;
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > maxWidth) {
          const ratio = maxWidth / targetWidth;
          targetWidth = maxWidth;
          targetHeight = Math.round(img.height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Browser tidak mendukung HTML5 Canvas."));
          return;
        }

        // Latar putih untuk gambar PNG transparan agar rapi saat dikonversi ke JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({ dataUrl, sizeKb });
      };

      img.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

export default function UploadItemModal({
  onClose,
  onSuccess,
}: UploadItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Perlengkapan Kamar");
  const [condition, setCondition] = useState<number>(4);
  const [estimatedWeight, setEstimatedWeight] = useState<string>("1.0");
  const [fallbackPlan, setFallbackPlan] =
    useState<FallbackPlan>("Akan dibuang");
  const [isGiveaway, setIsGiveaway] = useState<boolean>(false);
  const [price, setPrice] = useState<string>("0");
  const [location, setLocation] = useState<string>("");
  const [sellerName, setSellerName] = useState<string>("");
  const [sellerEmail, setSellerEmail] = useState<string>("");
  const [sellerWa, setSellerWa] = useState<string>("");
  const [pin, setPin] = useState<string>("");

  const [imageData, setImageData] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleToggleGiveaway = (checked: boolean) => {
    setIsGiveaway(checked);
    if (checked) {
      setPrice("0");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsCompressing(true);

    try {
      const { dataUrl, sizeKb } = await compressImageToBase64(file);
      setImageData(dataUrl);
      setImageSizeKb(sizeKb);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengompresi gambar."
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImageData(null);
    setImageSizeKb(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await createItem({
        title,
        description,
        category,
        condition,
        price: isGiveaway ? 0 : Number(price) || 0,
        estimated_weight_kg: Number(estimatedWeight) || 1.0,
        fallback_plan: fallbackPlan,
        location,
        seller_name: sellerName,
        seller_email: sellerEmail,
        seller_wa: sellerWa,
        pin,
        image_data: imageData,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan barang.");
        return;
      }

      await onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isItbEmailValid = sellerEmail
    .trim()
    .toLowerCase()
    .endsWith("@mahasiswa.itb.ac.id");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
              Salurkan Barang Layak Pakai
            </h2>
            <p className="text-xs text-slate-500">
              Beri kehidupan kedua untuk barangmu tanpa perlu buat akun
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form upload"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5">
          <div className="space-y-4">
            {/* Upload & Preview Foto (HTML5 Canvas Compression) */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Foto Barang (Kompresi Otomatis ≤ 600px)
              </label>

              {imageData ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img
                    src={imageData}
                    alt="Preview barang"
                    className="max-h-56 w-full object-contain bg-slate-100"
                  />
                  <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3.5 py-2 text-xs">
                    <span className="font-medium text-emerald-700">
                      Terkompresi JPEG 70% ({imageSizeKb ?? 0} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40">
                  {isCompressing ? (
                    <Loader2 className="mb-2 h-7 w-7 animate-spin text-emerald-600" />
                  ) : (
                    <ImagePlus className="mb-2 h-7 w-7 text-slate-400" />
                  )}
                  <span className="text-xs font-semibold text-slate-700">
                    {isCompressing
                      ? "Mengompresi gambar..."
                      : "Klik untuk pilih foto dari galeri / kamera"}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-400">
                    JPG, PNG, WEBP — otomatis diperkecil agar ringan
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Judul */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Judul Barang *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kipas Angin Meja Miyako / Buku Fisika Dasar Halliday"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Deskripsi Lengkap
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kondisi barang, kelengkapan, alasan dilepas, dan waktu pengambilan yang fleksibel..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Kategori & Kondisi */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Skala Kondisi (1–5) *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {[5, 4, 3, 2, 1].map((scale) => (
                    <option key={scale} value={scale}>
                      {CONDITION_LABELS[scale]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimasi Berat & Rencana Fallback */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Estimasi Berat (kg) *
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  max="999"
                  step="0.1"
                  value={estimatedWeight}
                  onChange={(e) => setEstimatedWeight(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Digunakan untuk metrik massa reuse SDG 12.5
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Rencana jika barang tidak tersalurkan *
                </label>
                <select
                  value={fallbackPlan}
                  onChange={(e) =>
                    setFallbackPlan(e.target.value as FallbackPlan)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {FALLBACK_PLANS.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Menghitung estimasi potensi sampah yang dicegah
                </p>
              </div>
            </div>

            {/* Opsi Giveaway & Harga */}
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={isGiveaway}
                  onChange={(e) => handleToggleGiveaway(e.target.checked)}
                  className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 sm:text-sm">
                  <Gift className="h-4 w-4 text-emerald-600" />
                  Opsi Pemberian Gratis (Giveaway)
                </span>
              </label>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  disabled={isGiveaway}
                  value={isGiveaway ? "0" : price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* Lokasi Kos/Asrama */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Lokasi Kos / Asrama *
              </label>
              <input
                type="text"
                required
                list="jatinangor-locations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Asrama ITB Jatinangor, Ciseke, Sayang"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <datalist id="jatinangor-locations">
                {LOCATION_SUGGESTIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Info Penjual */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Nama Penjual *
                </label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Nama panggilan / lengkap"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  No. WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={sellerWa}
                  onChange={(e) => setSellerWa(e.target.value)}
                  placeholder="081234567890"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Email ITB (Opsional) & 4 Digit PIN */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Email ITB (Opsional)
                </label>
                <input
                  type="email"
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  placeholder="18226xxx@mahasiswa.itb.ac.id"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                  {isItbEmailValid ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Badge ✓ Mahasiswa ITB akan ditampilkan
                    </span>
                  ) : (
                    <span>
                      Gunakan @mahasiswa.itb.ac.id untuk badge terverifikasi
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-700">
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                  Buat 4 Digit PIN Penjual *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm font-bold tracking-[0.35em] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Simpan PIN ini untuk menandai barang sudah tersalurkan
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Tayangkan Barang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}