"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, ShieldCheck, Circle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { ClayButton } from "@/components/ui/ClayButton";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Login gagal");
      }
      router.push(ROUTES.adminDashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-stretch bg-ink">
      {/* Left — deep, dark brand panel (desktop only), the "photobooth
          backdrop" feel instead of a plain login screen */}
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(156,43,60,0.55) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(47,107,73,0.35) 0%, transparent 50%)",
          }}
        />
        <div className="sprockets-light absolute left-0 right-0 top-6 h-1.5 opacity-20" />
        <div className="sprockets-light absolute bottom-6 left-0 right-0 h-1.5 opacity-20" />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-clay-sm bg-garnet-gradient shadow-clay-sm">
            <Circle size={16} className="fill-paper-light text-paper-light" strokeWidth={0} />
          </div>
          <span className="font-heading text-lg font-semibold text-paper-light">{APP_NAME}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative z-10"
        >
          <p className="font-hand text-3xl text-garnet-light">panel kontrol</p>
          <h1 className="mt-1 max-w-sm font-display text-4xl font-semibold italic leading-[1.1] text-paper-light">
            Kelola setiap sesi photobooth dari satu tempat.
          </h1>
          <p className="mt-4 max-w-sm font-body text-sm text-paper-light/60">
            Frame, hasil foto, dan notifikasi sesi baru — semuanya
            langsung sinkron begitu ada pengunjung yang selesai foto.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 flex items-center gap-2 font-body text-xs text-paper-light/45"
        >
          <ShieldCheck size={14} strokeWidth={2.2} />
          Akses terbatas hanya untuk admin terdaftar
        </motion.div>
      </div>

      {/* Right — the actual form, on paper texture so it doesn't feel
          like a bare/plain screen even without the brand panel */}
      <div className="bg-texture relative flex flex-1 items-center justify-center overflow-hidden bg-paper px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 90% 0%, rgba(156,43,60,0.08) 0%, transparent 42%), radial-gradient(circle at 0% 100%, rgba(47,107,73,0.08) 0%, transparent 45%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-clay-sm bg-garnet-gradient shadow-clay-sm">
              <Circle size={16} className="fill-paper-light text-paper-light" strokeWidth={0} />
            </div>
            <span className="font-heading text-lg font-semibold text-ink">{APP_NAME}</span>
          </div>

          <h2 className="font-display text-3xl font-semibold italic text-ink">Selamat datang kembali</h2>
          <p className="mt-1.5 font-body text-sm text-muted">
            Masuk untuk mengelola frame &amp; hasil foto pengunjung.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted">
                Username
              </label>
              <div className="relative">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" strokeWidth={2.2} />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-clay-sm bg-white py-3.5 pl-11 pr-4 font-body text-ink shadow-clay-inset outline-none transition-shadow focus-visible:shadow-[inset_0_0_0_2px_theme(colors.garnet.DEFAULT)]"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" strokeWidth={2.2} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-clay-sm bg-white py-3.5 pl-11 pr-11 font-body text-ink shadow-clay-inset outline-none transition-shadow focus-visible:shadow-[inset_0_0_0_2px_theme(colors.garnet.DEFAULT)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={17} strokeWidth={2.2} /> : <Eye size={17} strokeWidth={2.2} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-clay-sm bg-garnet/10 px-3.5 py-2.5 font-body text-sm text-garnet-dark"
              >
                {error}
              </motion.p>
            )}

            <ClayButton type="submit" variant="garnet" size="md" fullWidth disabled={loading} className="mt-2">
              <span className="flex items-center justify-center gap-2">
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
                {!loading && <ArrowRight size={18} strokeWidth={2.4} />}
              </span>
            </ClayButton>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
