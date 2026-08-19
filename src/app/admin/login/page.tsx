"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, ShieldCheck, Eye, EyeOff, ArrowRight, Camera, Sparkles } from "lucide-react";
import { ClayButton } from "@/components/ui/ClayButton";
import { Logo } from "@/components/ui/Logo";
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
    <main className="relative flex min-h-screen w-full overflow-hidden">
      {/* ===== BACKGROUND DEEP MAROON DENGAN TEKSTUR SUPER KELIHATAN ===== */}
      <div className="absolute inset-0">
        {/* Base color - Deep Maroon */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, #4a1515 0%, #2d0a0a 30%, #1a0505 60%, #0a0202 100%)
            `
          }}
        />
        
        {/* TEKSTUR 1: Efek Velvet/Kain - garis-garis halus */}
        <div 
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 1px,
                rgba(255,215,215,0.05) 1px,
                rgba(255,215,215,0.05) 2px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255,200,200,0.03) 2px,
                rgba(255,200,200,0.03) 3px
              )
            `
          }}
        />

        {/* TEKSTUR 2: Efek Granit/Kertas - noise kasar */}
        <div 
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 10% 20%, rgba(255,200,200,0.08) 0%, transparent 50%),
              radial-gradient(circle at 90% 80%, rgba(200,150,150,0.06) 0%, transparent 50%),
              repeating-conic-gradient(
                rgba(255,200,200,0.02) 0% 25%,
                transparent 0% 50%
              )
            `
          }}
        />

        {/* TEKSTUR 3: Efek Butiran Pasir - titik-titik */}
        <div 
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
            mixBlendMode: 'overlay'
          }}
        />

        {/* TEKSTUR 4: Efek Goresan - garis diagonal */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.02) 10px,
                rgba(255,255,255,0.02) 11px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 15px,
                rgba(255,255,255,0.015) 15px,
                rgba(255,255,255,0.015) 16px
              )
            `
          }}
        />

        {/* TEKSTUR 5: Efek Linen - anyaman */}
        <div 
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                rgba(200,150,150,0.03) 0px,
                rgba(200,150,150,0.03) 1px,
                transparent 1px,
                transparent 3px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(200,150,150,0.03) 0px,
                rgba(200,150,150,0.03) 1px,
                transparent 1px,
                transparent 3px
              )
            `
          }}
        />

        {/* Efek Vignette tebal */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)
            `
          }}
        />
      </div>

      {/* ===== DECORATIVE FRAME BORDER ===== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-cream/15 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-cream/15 to-transparent" />
        <div className="absolute top-8 bottom-8 left-8 w-[1px] bg-gradient-to-b from-transparent via-cream/15 to-transparent" />
        <div className="absolute top-8 bottom-8 right-8 w-[1px] bg-gradient-to-b from-transparent via-cream/15 to-transparent" />
        
        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-cream/10 rounded-tl-xl" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-cream/10 rounded-tr-xl" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-cream/10 rounded-bl-xl" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-cream/10 rounded-br-xl" />
      </div>

      {/* ===== LEFT PANEL - BRAND DEEP MAROON ===== */}
      <div className="relative hidden w-[45%] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Decorative orbs dengan efek cahaya */}
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-cream/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-garnet/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-cream/3 blur-3xl" />

        {/* Texture overlay di panel kiri */}
        <div 
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px'
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-4"
        >
          <Logo
            size={56}
            className="rounded-2xl shadow-2xl shadow-black/40"
            fallback={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cream to-cream-dark shadow-2xl shadow-black/40">
                <Camera size={24} className="text-maroon-deep" strokeWidth={1.8} />
              </div>
            }
          />
          <div>
            <span className="font-heading text-2xl font-bold text-cream tracking-tight drop-shadow-lg">{APP_NAME}</span>
            <span className="block text-cream/30 text-xs font-medium tracking-[0.2em] uppercase">Photobooth Studio</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative z-10 max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream/5 border border-cream/10 backdrop-blur-sm mb-8">
            <Sparkles size={14} className="text-cream/40" />
            <span className="text-xs font-medium text-cream/30 tracking-[0.15em] uppercase">Premium Studio</span>
          </div>
          
          <h1 className="font-display text-5xl font-bold leading-[1.1] text-cream drop-shadow-2xl">
            Kelola Studio
            <span className="block text-cream/60 mt-2">Dengan Elegan</span>
          </h1>
          
          <div className="mt-8 space-y-4">
            <p className="text-cream/35 text-base leading-relaxed max-w-md">
              Pantau setiap sesi photobooth, kelola frame, dan lihat hasil foto 
              pengunjung secara real-time dari satu dashboard terpusat.
            </p>
            
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2.5 text-cream/25 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-cream/30" />
                <span>Live Monitoring</span>
              </div>
              <div className="flex items-center gap-2.5 text-cream/25 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-cream/30" />
                <span>Photo Management</span>
              </div>
              <div className="flex items-center gap-2.5 text-cream/25 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-cream/30" />
                <span>Analytics</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 flex items-center gap-3 text-cream/15 text-xs font-medium tracking-widest"
        >
          <ShieldCheck size={14} strokeWidth={2} />
          <span>Secure Access — Authorized Administrators Only</span>
        </motion.div>
      </div>

      {/* ===== RIGHT PANEL - FORM CREAM ===== */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        {/* Background Cream dengan tekstur */}
        <div className="absolute inset-0">
          {/* Base cream dengan gradasi */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 40% 30%, #fdf6ed 0%, #f5e8d4 40%, #ede0cc 70%, #e8d8c0 100%)
              `
            }}
          />
          
          {/* TEKSTUR KERTAS VINTAGE 1: Noise */}
          <div 
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '256px 256px'
            }}
          />

          {/* TEKSTUR KERTAS 2: Serat kertas */}
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  rgba(139,69,19,0.02) 0px,
                  rgba(139,69,19,0.02) 1px,
                  transparent 1px,
                  transparent 4px
                ),
                repeating-linear-gradient(
                  90deg,
                  rgba(139,69,19,0.015) 0px,
                  rgba(139,69,19,0.015) 1px,
                  transparent 1px,
                  transparent 6px
                )
              `
            }}
          />

          {/* TEKSTUR KERTAS 3: Bintik vintage */}
          <div 
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(139,69,19,0.1) 1px, transparent 1px),
                radial-gradient(circle at 60% 70%, rgba(139,69,19,0.08) 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, rgba(139,69,19,0.06) 1px, transparent 1px),
                radial-gradient(circle at 40% 90%, rgba(139,69,19,0.07) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px, 150px 150px, 200px 200px, 120px 120px'
            }}
          />

          {/* Efek vignette cream */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(139,69,19,0.08) 100%)'
            }}
          />
        </div>

        {/* Decorative frame di form */}
        <div className="absolute inset-8 pointer-events-none">
          <div className="absolute inset-0 border border-maroon/5 rounded-3xl" />
          <div className="absolute inset-4 border border-maroon/5 rounded-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Logo
              size={40}
              className="rounded-xl shadow-xl shadow-maroon-deep/40"
              fallback={
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-maroon-deep shadow-xl shadow-maroon-deep/40">
                  <Camera size={18} className="text-cream" />
                </div>
              }
            />
            <span className="font-heading text-lg font-bold text-maroon-deep tracking-tight">{APP_NAME}</span>
          </div>

          {/* ===== CARD LOGIN CREAM + MAROON ===== */}
          <div className="relative rounded-2xl bg-cream/90 backdrop-blur-sm border border-cream shadow-2xl shadow-maroon-deep/15 p-10">
            {/* Corner decorations - maroon accent */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-maroon/20 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-maroon/20 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-maroon/20 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-maroon/20 rounded-br-lg" />
            
            {/* Top decorative line - maroon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-gradient-to-r from-transparent via-maroon/30 to-transparent" />

            {/* Card texture overlay */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 200px'
              }}
            />

            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-maroon-deep">Selamat Datang</h2>
                <p className="mt-1.5 text-maroon/40 text-sm font-medium">
                  Masuk ke dashboard admin Anda
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-maroon/40">
                    Username
                  </label>
                  <div className="relative group">
                    <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon/30 group-focus-within:text-maroon transition-colors" strokeWidth={2} />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                      className="w-full rounded-xl bg-white/60 border border-maroon/10 py-3.5 pl-11 pr-4 text-maroon-deep placeholder:text-maroon/20 font-body outline-none transition-all focus:border-maroon/40 focus:bg-white/80 focus:shadow-[0_0_30px_-10px_rgba(74,26,26,0.15)]"
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-maroon/40">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon/30 group-focus-within:text-maroon transition-colors" strokeWidth={2} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl bg-white/60 border border-maroon/10 py-3.5 pl-11 pr-12 text-maroon-deep placeholder:text-maroon/20 font-body outline-none transition-all focus:border-maroon/40 focus:bg-white/80 focus:shadow-[0_0_30px_-10px_rgba(74,26,26,0.15)]"
                      placeholder="Masukkan password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-maroon/30 hover:text-maroon/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-garnet/10 border border-garnet/20 px-4 py-3"
                  >
                    <p className="text-sm text-garnet font-medium">{error}</p>
                  </motion.div>
                )}

                <ClayButton 
                  type="submit" 
                  variant="garnet" 
                  size="md" 
                  fullWidth 
                  disabled={loading} 
                  className="mt-2 h-12 rounded-xl text-base font-semibold shadow-xl shadow-maroon-deep/30 hover:shadow-maroon-deep/50 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2.5">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-cream/30 border-t-cream animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Masuk ke Dashboard
                        <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </ClayButton>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-maroon/20 font-medium tracking-widest">
            Protected by Advanced Security Protocols
          </p>
        </motion.div>
      </div>
    </main>
  );
}