import { getItemsAndMetrics } from "@/app/actions";
import GanesaStreetApp from "@/components/GanesaStreetApp";
import { AlertTriangle, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const initialData = await getItemsAndMetrics();

    return (
      <GanesaStreetApp
        initialItems={initialData.items}
        initialMetrics={initialData.metrics}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal terhubung ke database Neon PostgreSQL.";

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-amber-700">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Koneksi Database Belum Siap
              </h1>
              <p className="text-xs text-slate-500">
                Neon Serverless PostgreSQL
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600">
            {message}
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-900">
              <Database className="h-4 w-4 text-emerald-600" />
              Langkah Cepat Setup:
            </div>
            <ol className="list-inside list-decimal space-y-1">
              <li>Buat database PostgreSQL gratis di Neon (neon.tech).</li>
              <li>
                Tambahkan <code className="font-mono font-semibold">DATABASE_URL</code> ke file{" "}
                <code className="font-mono font-semibold">.env.local</code> atau Environment Variables Vercel.
              </li>
              <li>Muat ulang halaman — tabel dan data awal akan dibuat otomatis.</li>
            </ol>
          </div>
        </div>
      </main>
    );
  }
}