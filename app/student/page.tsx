import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, GraduationCap, Sparkles, Trophy } from 'lucide-react'
import { getAcademicRecord } from '@/control/controllers/academic-record.controller'
import { listOffer } from '@/control/controllers/enrollment.controller'
import { getFlowchart } from '@/control/controllers/flowchart.controller'
import { firstName, formatGrade, formatLongDate, toRoman } from '@/presentation/lib/format'

const courseColors = ['bg-[#003087]', 'bg-[#f68629]', 'bg-[#1859a9]', 'bg-[#0e9f6e]', 'bg-[#ff8200]', 'bg-[#5b4bd6]']

export default async function SummaryPage() {
  const [{ stats, career, subjects, currentTerm }, record, offer] = await Promise.all([getFlowchart(), getAcademicRecord(), listOffer()])
  const currentEnrollments = subjects.filter((subject) => subject.status === 'IN_PROGRESS')
  const availableCount = offer?.subjects.filter((subject) => subject.status === 'AVAILABLE' && subject.sections.length).length ?? 0
  const selectedCount = offer?.enrollment?.sections.length ?? 0
  const currentCredits = currentEnrollments.reduce((sum, course) => sum + course.credits, 0)

  return (
    <div className="content-container">
      <section className="hero-card reveal !py-6 sm:!py-7">
        <div className="login-orb login-orb-orange !h-64 !w-64 opacity-60" />
        <div className="login-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/65">{formatLongDate(new Date())}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-none sm:text-4xl">
              Hola, <span className="text-[#ffb36b]">{firstName(record.student.name)}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
              Tienes {availableCount} materias disponibles para pre-inscribir{' '}
              {offer ? `en el período ${offer.term.name}` : 'próximamente'}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/student/pre-enrollment"
                className="inline-flex items-center gap-2 rounded-full bg-[#f68629] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#ff8200]"
              >
                Pre-inscribir materias <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/student/flowchart"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Ver mi flujograma
              </Link>
            </div>
          </div>

          <div className="glass-card flex shrink-0 items-center gap-4 self-start p-4 sm:self-auto">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(255 255 255 / 15%)" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#f68629"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.progressPercent / 100) * 263.9} 263.9`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-extrabold">
                {stats.progressPercent.toFixed(0)}%
              </span>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                <Trophy className="h-3.5 w-3.5 text-[#ffb36b]" /> Avance
              </p>
              <p className="mt-1 text-sm font-semibold">
                {stats.passedCredits} de {stats.planCredits} créditos
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="reveal reveal-1 mb-5 mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Panel del estudiante</p>
          <h2 className="page-title mt-2 !text-[clamp(1.6rem,2.6vw,2.2rem)]">Tu resumen académico</h2>
        </div>
        <span className="pill self-start text-muted-foreground">
          <span className="pulse-dot" /> Estudiante activo
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card reveal reveal-1">
          <div className="stat-icon bg-[#003087]/10 text-[#003087] dark:bg-[#1859a9]/25 dark:text-[#8fb8ff]">
            <GraduationCap />
          </div>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">Carrera</p>
          <p className="mt-1 text-lg font-bold leading-tight">{career.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.planCredits} UC en el plan de estudios</p>
        </div>
        <div className="stat-card reveal reveal-2">
          <div className="stat-icon bg-[#f68629]/15 text-[#f68629]">
            <Sparkles />
          </div>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">Índice acumulado</p>
          <p className="mt-1 font-display text-4xl font-extrabold">{formatGrade(record.average)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Escala de 0 a 20 puntos</p>
        </div>
        <div className="stat-card reveal reveal-3">
          <div className="stat-icon bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <BookOpen />
          </div>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">Créditos aprobados</p>
          <p className="mt-1 font-display text-4xl font-extrabold">
            {stats.passedCredits}
            <span className="text-lg font-semibold text-muted-foreground"> / {stats.planCredits}</span>
          </p>
          <div className="progress-track mt-3">
            <span style={{ width: `${stats.progressPercent}%` }} />
          </div>
        </div>
        <div className="stat-card reveal reveal-4">
          <div className="stat-icon bg-violet-500/12 text-violet-600 dark:text-violet-400">
            <CalendarDays />
          </div>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">Trimestre de la carrera</p>
          <p className="mt-1 font-display text-4xl font-extrabold">{toRoman(stats.currentCurriculumTerm)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.passedSubjects} de {stats.totalSubjects} materias aprobadas
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="surface reveal reveal-3 p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{currentTerm?.name ?? 'Período actual'}</p>
              <h3 className="mt-1 text-xl font-bold">Materias en curso</h3>
            </div>
            <span className="pill">{currentCredits} UC</span>
          </div>
          {currentEnrollments.length ? (
            <div className="flex flex-col gap-3">
              {currentEnrollments.map((course, index) => (
                <div className="course-row" key={course.id}>
                  <div className={`course-mark ${courseColors[index % courseColors.length]}`}>{course.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{course.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {course.code} · {course.credits} UC
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">No tienes materias en curso este período.</p>
          )}
        </section>

        <section className="surface reveal reveal-4 flex flex-col p-5 sm:p-7">
          <p className="eyebrow">Pre-inscripción</p>
          <h3 className="mt-1 text-xl font-bold">{offer ? `Período ${offer.term.name}` : 'Sin período abierto'}</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f68629]/10 p-4">
              <p className="font-display text-3xl font-extrabold text-[#d9690b] dark:text-[#ffa45c]">{availableCount}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Disponibles</p>
            </div>
            <div className="rounded-2xl bg-[#003087]/8 p-4 dark:bg-white/5">
              <p className="font-display text-3xl font-extrabold text-[#003087] dark:text-[#8fb8ff]">{selectedCount}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Seleccionadas</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Solo podrás seleccionar secciones de materias cuyas prelaciones ya aprobaste.
          </p>
        </section>
      </div>
    </div>
  )
}
