'use client'

import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Menu,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import { systemsEngineeringCurriculum, mockStudent } from '@/lib/mock-data'
import type { SubjectStatus, UserRole } from '@/lib/types'

const roleLabels: Record<UserRole, string> = {
  student: 'Estudiante',
  professor: 'Profesor',
  admin: 'Administrador',
}

const navItems = [
  { label: 'Resumen', icon: LayoutDashboard },
  { label: 'Mi flujograma', icon: BookOpen },
  { label: 'Pre-inscripción', icon: CalendarDays },
  { label: 'Histórico', icon: Clock3 },
  { label: 'Certificado', icon: FileText },
]

const branchLabels = ['Fundamentales', 'Profesionales', 'Sistemas', 'Complementarias', 'Formación general']

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="Universidad Metropolitana">
      <div className="relative h-10 w-10 shrink-0" aria-hidden="true">
        <span className="absolute left-0 top-0 h-6 w-2.5 rounded-sm bg-[#f68629]" />
        <span className="absolute left-4 top-0 h-5 w-2.5 rounded-sm bg-[#f68629]" />
        <span className="absolute left-0 top-7 h-4 w-2.5 rounded-sm bg-[#f68629]" />
        <span className="absolute left-4 top-6 h-5 w-2.5 rounded-sm bg-[#f68629]" />
        <span className="absolute right-0 top-5 h-5 w-2.5 rounded-sm bg-[#f68629]" />
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="text-[0.9rem] font-black tracking-[-0.04em] text-[#003087] dark:text-white">Universidad</p>
          <p className="text-[0.9rem] font-black tracking-[-0.04em] text-[#003087] dark:text-white">Metropolitana</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: SubjectStatus }) {
  const config = {
    completed: { label: 'Aprobada', cls: 'status-completed', icon: Check },
    available: { label: 'Disponible', cls: 'status-available', icon: Sparkles },
    blocked: { label: 'Bloqueada', cls: 'status-blocked', icon: LockKeyhole },
    enrolled: { label: 'Inscrita', cls: 'status-enrolled', icon: Check },
    current: { label: 'En curso', cls: 'status-current', icon: Clock3 },
  }[status]
  const Icon = config.icon
  return <span className={`status-badge ${config.cls}`}><Icon aria-hidden="true" />{config.label}</span>
}

function SubjectCard({ subject, onSelect }: { subject: (typeof systemsEngineeringCurriculum.subjects)[number]; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`subject-card subject-${subject.status}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="subject-code">{subject.code}</span>
        {subject.status === 'blocked' ? <LockKeyhole className="h-3.5 w-3.5 opacity-50" aria-label="Materia bloqueada" /> : <MoreHorizontal className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />}
      </div>
      <p className="mt-2 line-clamp-2 text-left text-[0.78rem] font-semibold leading-tight">{subject.name}</p>
      <div className="mt-3 flex items-center justify-between text-[0.68rem] opacity-70">
        <span>{subject.credits} créditos</span>
        <span>{subject.hours.A}A · {subject.hours.L}L</span>
      </div>
    </button>
  )
}

function Flowchart({ onSelect }: { onSelect: (subject: (typeof systemsEngineeringCurriculum.subjects)[number]) => void }) {
  const semesters = Array.from({ length: 12 }, (_, i) => i + 1)
  return (
    <section className="surface overflow-hidden" aria-labelledby="flowchart-title">
      <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f68629]"><Sparkles className="h-3.5 w-3.5" /> Tu ruta académica</div>
          <h2 id="flowchart-title" className="text-xl font-black tracking-tight text-foreground sm:text-2xl">Flujograma de componentes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Haz clic en una materia para ver sus requisitos y lo que desbloquea.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="legend-dot"><i className="bg-emerald-500" />Aprobada</span>
          <span className="legend-dot"><i className="bg-[#f68629]" />Disponible</span>
          <span className="legend-dot"><i className="bg-[#1859a9]" />En curso</span>
          <span className="legend-dot"><i className="bg-muted-foreground/40" />Bloqueada</span>
        </div>
      </div>
      <div className="overflow-x-auto p-4 sm:p-6">
        <div className="min-w-[72rem]">
          <div className="flow-grid-header">
            <span className="text-left">Rama / período</span>
            {semesters.map((semester) => <span key={semester}>{['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][semester - 1]}</span>)}
          </div>
          <div className="flow-grid">
            {branchLabels.map((branch, branchIndex) => (
              <div className="contents" key={branch}>
                <div className="branch-label"><span>0{branchIndex + 1}</span><strong>{branch}</strong></div>
                {semesters.map((semester) => {
                  const subject = systemsEngineeringCurriculum.subjects.find((item) => item.semester === semester && item.branch === branchIndex + 1)
                  return <div className="flow-cell" key={`${branch}-${semester}`}>{subject ? <SubjectCard subject={subject} onSelect={() => onSelect(subject)} /> : <span className="empty-cell">—</span>}</div>
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function UploadPanel() {
  const [files, setFiles] = useState<File[]>([])
  const onDrop = useCallback((acceptedFiles: File[]) => setFiles(acceptedFiles), [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }, maxFiles: 1 })
  return (
    <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'upload-active' : ''}`}>
      <input {...getInputProps()} />
      {files.length ? <><Check className="mx-auto mb-2 h-7 w-7 text-emerald-500" /><p className="text-sm font-bold">{files[0].name}</p><p className="mt-1 text-xs text-muted-foreground">Listo para procesar</p></> : <><UploadCloud className="mx-auto mb-2 h-7 w-7 text-[#f68629]" /><p className="text-sm font-bold">{isDragActive ? 'Suelta el archivo aquí' : 'Carga tu flujograma'}</p><p className="mt-1 text-xs text-muted-foreground">PDF, JPG o PNG · hasta 10 MB</p></>}
    </div>
  )
}

export default function Page() {
  const [role, setRole] = useState<UserRole>('student')
  const [activeNav, setActiveNav] = useState('Resumen')
  const [dark, setDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<(typeof systemsEngineeringCurriculum.subjects)[number] | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [search, setSearch] = useState('')
  const { register, handleSubmit } = useForm<{ identifier: string; password: string }>()
  const available = useMemo(() => systemsEngineeringCurriculum.subjects.filter((subject) => subject.status === 'available'), [])
  const visibleSubjects = useMemo(() => available.filter((subject) => subject.name.toLowerCase().includes(search.toLowerCase()) || subject.code.toLowerCase().includes(search.toLowerCase())), [available, search])

  const signInDemo = (nextRole: UserRole) => { setRole(nextRole); setShowLogin(false); setActiveNav('Resumen') }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="app-shell">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="flex items-center px-5 py-6"><Logo compact={!sidebarOpen} /></div>
          <nav className="flex flex-col gap-1 px-3" aria-label="Navegación principal">{navItems.map((item) => { const Icon = item.icon; const active = activeNav === item.label; return <button type="button" key={item.label} onClick={() => setActiveNav(item.label)} className={`nav-item ${active ? 'nav-active' : ''}`} title={!sidebarOpen ? item.label : undefined} aria-label={item.label}><Icon aria-hidden="true" /><span className={sidebarOpen ? '' : 'lg:hidden'}>{item.label}</span>{active && sidebarOpen && <ChevronRight className="ml-auto h-4 w-4" />}</button> })}          </nav>
          <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle" aria-label={sidebarOpen ? 'Contraer menú' : 'Expandir menú'} title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}>{sidebarOpen ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}</button>
          {sidebarOpen && <div className="mt-auto p-5"><div className="mb-5 rounded-2xl border border-[#f68629]/20 bg-[#f68629]/10 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#f68629]"><CircleHelp className="h-4 w-4" /> ¿Necesitas ayuda?</div><p className="text-xs leading-relaxed text-muted-foreground">Estamos aquí para acompañarte en tu proceso.</p><button type="button" className="mt-3 text-xs font-bold text-[#003087] dark:text-[#f68629]">Ver centro de ayuda →</button></div><button type="button" className="nav-item w-full"><Settings2 /><span>Configuración</span></button></div>}
        </aside>

        <main className="main-content">
          <header className="topbar"><div className="flex items-center gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Período académico</p><button type="button" className="mt-1 flex items-center gap-2 text-sm font-bold">2026-2 <ChevronDown className="h-4 w-4 text-[#f68629]" /></button></div></div><div className="flex items-center gap-2 sm:gap-4"><button type="button" className="icon-button" onClick={() => setDark(!dark)} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>{dark ? <Sun /> : <Moon />}</button><button type="button" className="icon-button relative" aria-label="Notificaciones"><Bell /><span className="notification-dot" /></button><div className="profile-wrap"><button type="button" className="profile-trigger" onClick={() => setShowProfile(!showProfile)} aria-expanded={showProfile}><div className="avatar avatar-small bg-[#f68629] text-white">CM</div><span className="hidden text-left sm:block"><strong>Carlos Mendoza</strong><small>{roleLabels[role]}</small></span><ChevronDown className="h-4 w-4 text-muted-foreground" /></button>{showProfile && <div className="profile-menu"><div className="profile-menu-head"><div className="avatar avatar-small bg-[#f68629] text-white">CM</div><div><strong>Carlos Mendoza</strong><small>student@unimet.edu.ve</small></div></div><button type="button" onClick={() => setShowProfile(false)}><UserRound /> Mi perfil</button><button type="button" onClick={() => window.location.assign('/microsoft-365')}><ExternalLink /> Microsoft 365 <span>↗</span></button><button type="button" onClick={() => setShowLogin(true)}><LogIn /> Cerrar sesión</button></div>}</div></div></header>

          {activeNav === 'Resumen' && <div className="content-container">
            <section className="hero-card"><div className="relative z-10"><p className="mb-3 text-sm font-semibold text-white/70">Lunes, 22 de septiembre de 2026</p><h1 className="max-w-2xl text-[clamp(2rem,4vw,3.6rem)] font-black leading-[0.98] tracking-[-0.06em] text-white">Tu camino académico,<br /><span className="text-[#ffb56a]">a tu ritmo.</span></h1><p className="mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">Hola, Carlos. Ya estás más cerca de tu meta. Revisa tu progreso y descubre qué materias puedes inscribir este período.</p><button type="button" onClick={() => setActiveNav('Mi flujograma')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f68629] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/20 transition hover:bg-[#ff9b3f]">Ver mi flujograma <ChevronRight className="h-4 w-4" /></button></div><div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-grid" /></section>
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Panel del estudiante</p><h2 className="mt-1 text-2xl font-black tracking-tight">Tu resumen académico</h2></div><div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground"><span className="status-pulse" /> Estado activo</div></div>
            <div className="stats-grid"><div className="stat-card"><div className="stat-icon bg-[#003087]/10 text-[#003087] dark:bg-[#1859a9]/25 dark:text-[#7db4ff]"><GraduationCap /></div><p className="stat-label">Carrera actual</p><p className="mt-2 text-lg font-black">Ingeniería de Sistemas</p><p className="mt-1 text-xs text-muted-foreground">Plan 2023 · 156 créditos</p></div><div className="stat-card"><div className="stat-icon bg-[#f68629]/15 text-[#f68629]"><Sparkles /></div><p className="stat-label">Índice acumulado</p><p className="mt-2 text-3xl font-black">{mockStudent.gpa.toFixed(2)}</p><p className="mt-1 text-xs font-semibold text-emerald-600">+0.18 este período</p></div><div className="stat-card"><div className="stat-icon bg-emerald-500/12 text-emerald-600"><BookOpen /></div><p className="stat-label">Créditos aprobados</p><p className="mt-2 text-3xl font-black">{mockStudent.completedCredits}<span className="text-base font-semibold text-muted-foreground"> / {mockStudent.totalCredits}</span></p><div className="progress-track mt-3"><span style={{ width: `${(mockStudent.completedCredits / mockStudent.totalCredits) * 100}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">12.8% de la carrera</p></div><div className="stat-card"><div className="stat-icon bg-violet-500/12 text-violet-600"><CalendarDays /></div><p className="stat-label">Período actual</p><p className="mt-2 text-3xl font-black">II</p><p className="mt-1 text-xs text-muted-foreground">Segundo trimestre</p></div></div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><div className="surface p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><p className="eyebrow">Tu selección</p><h3 className="mt-1 text-xl font-black">Materias del período</h3></div><button type="button" onClick={() => setActiveNav('Pre-inscripción')} className="text-xs font-bold text-[#f68629]">Ver catálogo →</button></div><div className="flex flex-col gap-3"><div className="course-row"><div className="course-mark bg-[#003087]">M</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Matemáticas I</p><p className="mt-1 text-xs text-muted-foreground">BPTMI01 · 4 créditos</p></div><span className="course-time">Mar · 8:00 AM</span></div><div className="course-row"><div className="course-mark bg-[#f68629]">P</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Algoritmos y Programación</p><p className="mt-1 text-xs text-muted-foreground">BPTSP05 · 4 créditos</p></div><span className="course-time">Jue · 10:00 AM</span></div></div></div><div className="surface overflow-hidden p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Avisos</p><h3 className="mt-1 text-xl font-black">Para ti</h3></div><button type="button" className="icon-button" aria-label="Más avisos"><MoreHorizontal /></button></div><div className="mt-5 flex flex-col gap-4"><div className="notice-item"><span className="notice-icon bg-[#f68629]/15 text-[#f68629]"><WalletCards /></span><div><p className="text-sm font-bold">Estado de cuenta al día</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">No tienes pagos pendientes.</p></div></div><div className="notice-item"><span className="notice-icon bg-[#003087]/10 text-[#003087] dark:bg-[#1859a9]/25 dark:text-[#7db4ff]"><Bell /></span><div><p className="text-sm font-bold">Pre-inscripciones abiertas</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Hasta el 28 de septiembre.</p></div></div></div></div></div>
          </div>}

          {activeNav === 'Mi flujograma' && <div className="content-container"><div className="page-heading"><div><p className="eyebrow">Ingeniería de Sistemas · Plan 2023</p><h1 className="mt-1 text-[clamp(1.8rem,3vw,2.8rem)] font-black tracking-[-0.04em]">Mi flujograma académico</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Visualiza tu avance por períodos y planifica tu próximo paso con claridad.</p></div><button type="button" className="secondary-button"><Download /> Descargar PDF</button></div><div className="mb-6 flex flex-wrap gap-3"><div className="mini-progress"><span>Avance de carrera</span><strong>12.8%</strong><div className="progress-track"><span style={{ width: '12.8%' }} /></div></div><div className="mini-progress"><span>Materias aprobadas</span><strong>5 de 42</strong><div className="progress-track orange"><span style={{ width: '18%' }} /></div></div></div><Flowchart onSelect={setSelectedSubject} /></div>}

          {activeNav === 'Pre-inscripción' && <div className="content-container"><div className="page-heading"><div><p className="eyebrow">Período 2026-2</p><h1 className="mt-1 text-[clamp(1.8rem,3vw,2.8rem)] font-black tracking-[-0.04em]">Pre-inscripción</h1><p className="mt-2 text-sm text-muted-foreground">Elige las materias que quieres cursar. Te mostraremos qué está disponible para ti.</p></div><div className="cart-pill"><BookOpen /> <strong>{visibleSubjects.length}</strong> sugerencias</div></div><div className="mb-6 flex items-center gap-3"><div className="search-box"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código o nombre..." aria-label="Buscar materias" /></div><button type="button" className="secondary-button hidden sm:flex"><ChevronDown /> Filtrar</button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleSubjects.map((subject) => <button type="button" key={`${subject.code}-${subject.semester}-${subject.branch}`} onClick={() => setSelectedSubject(subject)} className="catalog-card"><div className="flex items-center justify-between"><span className="subject-code text-[#f68629]">{subject.code}</span><span className="rounded-full bg-[#f68629]/10 px-2 py-1 text-[0.65rem] font-bold text-[#f68629]">{subject.credits} créditos</span></div><h3 className="mt-4 text-left text-lg font-black">{subject.name}</h3><p className="mt-2 text-left text-xs text-muted-foreground">Período sugerido {subject.semester} · Oferta {subject.offerings}</p><div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4"><StatusBadge status={subject.status} /><span className="text-xs font-bold text-[#003087] dark:text-[#7db4ff]">Ver detalles <ChevronRight className="inline h-3.5 w-3.5" /></span></div></button>)}</div><div className="mt-8 grid gap-4 lg:grid-cols-2"><UploadPanel /><div className="surface flex items-center gap-4 p-5"><div className="stat-icon bg-[#003087]/10 text-[#003087] dark:bg-[#1859a9]/25 dark:text-[#7db4ff]"><FileUp /></div><div><h3 className="font-bold">¿Tienes un flujograma anterior?</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Cárgalo para que podamos ayudarte a comparar tu avance.</p></div></div></div></div>}

          {activeNav === 'Histórico' && <div className="content-container"><div className="page-heading"><div><p className="eyebrow">Tu trayectoria</p><h1 className="mt-1 text-[clamp(1.8rem,3vw,2.8rem)] font-black tracking-[-0.04em]">Histórico académico</h1><p className="mt-2 text-sm text-muted-foreground">Consulta tus calificaciones y el avance de cada período.</p></div></div><div className="surface p-5 sm:p-7"><div className="flex flex-col items-start gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">Índice acumulado</p><p className="mt-1 text-4xl font-black">3.45</p></div><div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600">Excelente progreso</div></div><div className="mt-6 flex flex-col gap-4"><div className="history-row"><div><p className="font-bold">Período II · 2026</p><p className="mt-1 text-xs text-muted-foreground">4 materias · 16 créditos</p></div><div className="flex items-center gap-4"><span className="hidden text-sm text-muted-foreground sm:inline">En curso</span><strong className="text-lg text-[#f68629]">—</strong></div></div><div className="history-row"><div><p className="font-bold">Período I · 2026</p><p className="mt-1 text-xs text-muted-foreground">5 materias · 20 créditos</p></div><div className="flex items-center gap-4"><span className="hidden text-sm text-muted-foreground sm:inline">Completado</span><strong className="text-lg text-emerald-600">3.45</strong></div></div></div></div></div>}

          {activeNav === 'Certificado' && <div className="content-container"><div className="page-heading"><div><p className="eyebrow">Constancia oficial</p><h1 className="mt-1 text-[clamp(1.8rem,3vw,2.8rem)] font-black tracking-[-0.04em]">Certificado de inscripción</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Descarga una constancia con tus materias inscritas, período académico y datos institucionales.</p></div><button type="button" className="primary-button"><Download /> Descargar certificado</button></div><div className="certificate-layout"><div className="certificate-preview"><div className="certificate-watermark">UM</div><div className="certificate-top"><Logo /><span>PERÍODO 2026-2</span></div><div className="certificate-kicker">Universidad Metropolitana</div><h2>Certificado de inscripción</h2><p className="certificate-copy">Se certifica que <strong>Carlos Mendoza</strong>, titular de la cédula <strong>28.456.789</strong>, se encuentra inscrito como estudiante activo de Ingeniería de Sistemas.</p><div className="certificate-table"><div><span>Materia</span><span>Código</span><span>Créditos</span></div><div><strong>Matemáticas I</strong><span>BPTMI01</span><span>4</span></div><div><strong>Algoritmos y Programación</strong><span>BPTSP05</span><span>4</span></div></div><div className="certificate-footer"><span>Emitido el 14 de octubre de 2026</span><strong>Registro académico</strong></div></div><div className="certificate-aside surface"><div className="stat-icon bg-[#f68629]/15 text-[#f68629]"><ShieldCheck /></div><h3 className="mt-4 text-xl font-black">Documento listo</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Tu certificado refleja tu inscripción vigente y puede ser presentado ante cualquier dependencia institucional.</p><div className="mt-6 flex flex-col gap-3"><button type="button" className="primary-button w-full"><Download /> Descargar PDF</button><button type="button" className="secondary-button w-full"><FileText /> Ver vista previa</button></div><p className="mt-5 text-xs leading-relaxed text-muted-foreground">La constancia se actualiza automáticamente al confirmar cambios en tu pre-inscripción.</p></div></div></div>}
        </main>

        {selectedSubject && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedSubject(null)}><aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="subject-detail-title" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><StatusBadge status={selectedSubject.status} /><h2 id="subject-detail-title" className="mt-4 text-2xl font-black tracking-tight">{selectedSubject.name}</h2><p className="mt-1 font-mono text-xs font-bold text-muted-foreground">{selectedSubject.code}</p></div><button type="button" className="icon-button" onClick={() => setSelectedSubject(null)} aria-label="Cerrar detalle"><X /></button></div><div className="mt-7 grid grid-cols-2 gap-3"><div className="detail-stat"><span>Créditos</span><strong>{selectedSubject.credits}</strong></div><div className="detail-stat"><span>Período</span><strong>{selectedSubject.semester}</strong></div><div className="detail-stat"><span>Aula</span><strong>{selectedSubject.hours.A}h</strong></div><div className="detail-stat"><span>Laboratorio</span><strong>{selectedSubject.hours.L}h</strong></div></div><div className="mt-8"><h3 className="text-sm font-black">Prelaciones</h3>{selectedSubject.prerequisites.length ? <div className="mt-3 flex flex-col gap-2">{selectedSubject.prerequisites.map((prerequisite) => <div className="prerequisite" key={prerequisite}><Check className="h-4 w-4 text-emerald-500" />{prerequisite} aprobada</div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No tiene prelaciones. Puedes cursarla desde el inicio.</p>}</div><div className="mt-8 rounded-2xl bg-[#f68629]/10 p-4"><p className="text-sm font-bold text-[#a84c00] dark:text-[#ffb56a]">Siguiente paso</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Esta materia se ofrece en los períodos {selectedSubject.offerings}. Revisa tu horario antes de agregarla.</p></div><button type="button" className="primary-button mt-6 w-full" onClick={() => setSelectedSubject(null)}>{selectedSubject.status === 'available' ? 'Agregar a pre-inscripción' : 'Entendido'}</button></aside></div>}

        {showLogin && <div className="modal-backdrop" role="presentation" onClick={() => setShowLogin(false)}><div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onClick={(event) => event.stopPropagation()}><button type="button" className="icon-button absolute right-5 top-5" onClick={() => setShowLogin(false)} aria-label="Cerrar"><X /></button><Logo /><p className="eyebrow mt-10">Acceso rápido</p><h2 id="login-title" className="mt-1 text-2xl font-black">Entra a tu espacio</h2><p className="mt-2 text-sm text-muted-foreground">Prototipo navegable · selecciona un perfil para explorar.</p><form onSubmit={handleSubmit(() => signInDemo('student'))} className="mt-6 flex flex-col gap-4"><label className="field-label">Usuario o cédula<input className="text-input" {...register('identifier')} defaultValue="student@unimet.edu.ve" /></label><label className="field-label">Contraseña<input className="text-input" type="password" {...register('password')} defaultValue="password" /></label><button className="primary-button mt-2" type="submit"><LogIn /> Ingresar como estudiante</button></form><div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> o prueba otro perfil <span className="h-px flex-1 bg-border" /></div><div className="grid grid-cols-2 gap-3"><button type="button" className="quick-role" onClick={() => signInDemo('professor')}><UsersRound /> Profesor</button><button type="button" className="quick-role" onClick={() => signInDemo('admin')}><Settings2 /> Admin</button></div></div></div>}
      </div>
    </div>
  )
}

export { Logo }

