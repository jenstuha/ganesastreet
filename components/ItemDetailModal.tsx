"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Gift,
  KeyRound,
  Loader2,
  MapPin,
  MessageCircle,
  Recycle,
  Scale,
  ShieldCheck,
  Tag,
  User,
  X,
} from "lucide-react";
import {
  claimOrReserveItem,
  markItemAsDistributed,
} from "@/app/actions";
import { PublicItem } from "@/lib/types";
import {
  formatRupiah,
  getStatusBadgeClass,
} from "@/components/GanesaStreetApp";

interface ItemDetailModalProps {
  item: PublicItem;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function ItemDetailModal({
  item,
  onClose,
  onSuccess,
}: ItemDetailModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [pickupPlan, setPickupPlan] = useState("");
  const [sellerPin, setSellerPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setBuyerName("");
    setPickupPlan("");
    setSellerPin("");
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [item.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isFree = item.price === 0;
  const whatsappClean = item.whatsapp.replace(/\D/g, "");
  const whatsappText = encodeURIComponent(
    `Halo ${item.seller_name}, saya tertarik dengan barang "${item.title}" di GanesaStreet (${item.location}). Apakah masih tersedia?`
  );
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${whatsappText}`;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await claimOrReserveItem({
        itemId: item.id,
        buyerName,
        pickupPlan,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      setSuccessMsg(res.message);
      await onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDistributed = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await markItemAsDistributed({
        itemId: item.id,
        pin: sellerPin,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      setSuccessMsg(res.message);
      setSellerPin("");
      await onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail barang"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-slate-950"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto">
          <div className="relative aspect-[16/10] w-full bg-slate-100">
            {item.image_data ? (
              <img
                src={item.image_data}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                <Recycle className="h-12 w-12" />
                <span className="text-xs font-medium">Tidak ada foto barang</span>
              </div>
            )}

            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${getStatusBadgeClass(
                item.status
              )}`}
            >
              {item.status}
            </span>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {isFree ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                    <Gift className="h-3.5 w-3.5" />
                    GRATIS / GIVEAWAY
                  </span>
                ) : (
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatRupiah(item.price)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  {item.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Scale className="h-3.5 w-3.5" />
                  {item.estimated_weight_kg} kg
                </span>
              </div>

              <h2 className="text-lg font-extrabold leading-snug text-slate-900 sm:text-xl">
                {item.title}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                  Kondisi {item.condition}/5
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  {item.location}
                </span>
              </div>
            </div>

            {item.description && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {item.description}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">
                      {item.seller_name}
                    </span>
                    {item.is_itb && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Mahasiswa ITB
                      </span>
                    )}
                  </div>
                  <p className="text-xs text