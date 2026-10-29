import type { Metadata } from 'next'
import { CalendarCheck2, CheckCircle2, GitBranch, Sparkles } from 'lucide-react'
import { UnimetLogo } from '@/presentation/components/brand/unimet-logo'
import { LoginForm } from '@/presentation/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión | Sirius UNIMET',
}

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Universidad Metropolitana">
        <div className="login-grid" />
        <div className="login-orb login-orb-sky" />
        <div className="login-orb login-orb-orange" />
        <div className="login-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="login-float login-float-top glass-card float-a p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.7rem] font-bold text-white/70">FPTSP07</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f68629] px-2 py-1 text-[0.62rem] font-bold">
              <Sparkles className="h-3 w-3" /> Disponible
            </span>
          </div>
          <p className="mt-2 font-display text-lg font-bold uppercase leading-tight">Ingeniería de Software</p>
          <div className="mt-3 flex items-center gap-2 text-[0.7rem] text-white/70">
            <GitBranch className="h-3.5 w-3.5" /> Prela: Bases de Datos I · Sist. de Información
          </div>
        </div>
        <div className="login-float login-float-bottom glass-card float-b items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Prelaciones verificadas</p>
            <p className="text-[0.7rem] text-white/65">Solo ves lo que puedes pre-inscribir</p>
          </div>
        </div>

        <div className="reveal flex items-center justify-between gap-4">
          <UnimetLogo inverted />
          <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold backdrop-blur sm:inline-flex">
            <span className="pulse-dot" /> Pre-inscripciones abiertas
          </span>
        </div>

        <div className="relative my-10 lg:my-0">
          <h1 className="login-headline reveal reveal-1">
            <span className="line-small">Tu inscripción</span>
            <span className="line-hero">Se reimagina</span>
            <span className="line-accent">Aquí.</span>
          </h1>
          <p className="reveal reveal-2 mt-6 max-w-md text-[0.95rem] leading-relaxed text-white/75 lg:text-base">
            Planifica tu período, revisa tus prelaciones y pre-inscribe tus materias en un solo lugar, sin filas ni
            papeleo.
          </p>
        </div>

        <div className="reveal reveal-4 hidden grid-cols-3 gap-3 sm:grid">
          {[
            { value: '6', label: 'Carreras de Ingeniería' },
            { value: '12', label: 'Trimestres por plan' },
            { value: '24/7', label: 'Acceso a tu flujograma' },
          ].map((item) => (
            <div key={item.label} className="glass-card px-4 py-3.5">
              <p className="font-display text-2xl font-extrabold">{item.value}</p>
              <p className="mt-0.5 text-[0.72rem] leading-snug text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card reveal reveal-2">
          <div className="mb-8 hidden lg:block">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#003087]/8 px-3 py-1.5 text-xs font-bold text-[#003087] dark:bg-white/8 dark:text-[#8fb8ff]">
              <CalendarCheck2 className="h-3.5 w-3.5" /> Portal estudiantil
            </span>
          </div>
          <p className="eyebrow lg:hidden">Portal estudiantil</p>
          <h2 className="mt-2 font-display text-[2.6rem] font-extrabold uppercase leading-[0.95] tracking-tight lg:text-5xl">
            Bienvenido
            <br />
            <span className="text-[#003087] dark:text-[#8fb8ff]">de vuelta</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Ingresa con tu correo institucional para continuar con tu inscripción.
          </p>

          <LoginForm callbackUrl={callbackUrl} />

          <p className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Universidad Metropolitana · Caracas, Venezuela
          </p>
        </div>
      </section>
    </main>
  )
}
