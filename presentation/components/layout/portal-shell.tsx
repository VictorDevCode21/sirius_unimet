'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LayoutList,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'
import { UnimetLogo } from '@/presentation/components/brand/unimet-logo'
import { HelpPanel } from '@/presentation/components/shared/help-panel'
import { logout } from '@/control/controllers/authentication.controller'
import { cn } from '@/presentation/lib/utils'

export type Portal = 'student' | 'admin' | 'professor' | 'department-head'

const portals: Record<Portal, { home: string; roleLabel: string; navItems: { label: string; href: string; icon: typeof FileText }[] }> = {
  student: {
    home: '/student',
    roleLabel: 'Estudiante',
    navItems: [
      { label: 'Resumen', href: '/student', icon: LayoutDashboard },
      { label: 'Mi flujograma', href: '/student/flowchart', icon: BookOpen },
      { label: 'Pre-inscripción', href: '/student/pre-enrollment', icon: CalendarDays },
      { label: 'Inscripción', href: '/student/enrollment', icon: ListChecks },
      { label: 'Pagos', href: '/student/payments', icon: CreditCard },
      { label: 'Certificado', href: '/student/receipt', icon: FileText },
      { label: 'Histórico', href: '/student/history', icon: Clock3 },
    ],
  },
  admin: {
    home: '/admin',
    roleLabel: 'Administrador',
    navItems: [
      { label: 'Periodos', href: '/admin/terms', icon: CalendarDays },
      { label: 'Matrícula', href: '/admin/tuition', icon: Wallet },
      { label: 'Usuarios', href: '/admin/users', icon: UsersRound },
      { label: 'Departamentos', href: '/admin/departments', icon: Building2 },
      { label: 'Carreras', href: '/admin/careers', icon: GraduationCap },
      { label: 'Notas', href: '/admin/grades', icon: ClipboardCheck },
      { label: 'Pensum', href: '/admin/curriculum', icon: BookOpen },
    ],
  },
  professor: {
    home: '/professor',
    roleLabel: 'Profesor',
    navItems: [{ label: 'Mis secciones', href: '/professor/sections', icon: BookOpen }],
  },
  'department-head': {
    home: '/department-head',
    roleLabel: 'Jefe de departamento',
    navItems: [{ label: 'Secciones', href: '/department-head/sections', icon: LayoutList }],
  },
}

interface PortalShellProps {
  portal?: Portal
  user: { name: string; email: string }
  currentTermCode: string | null
  preEnrollmentTermCode: string | null
  cartCount: number
  children: React.ReactNode
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => setDark(document.documentElement.classList.contains('dark')), [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }

  return (
    <button type="button" className="icon-button" onClick={toggle} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  )
}

function ProfileMenu({ user, roleLabel, showSettings }: { user: PortalShellProps['user']; roleLabel: string; showSettings: boolean }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-2.5 rounded-full border border-border bg-card p-1 transition hover:shadow-[var(--shadow-soft)] sm:pr-3"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Menú de ${user.name}, ${roleLabel}`}
      >
        <span className="avatar h-9 w-9 text-[0.72rem]" aria-hidden="true">
          {initialsOf(user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <strong className="block text-[0.8rem] leading-tight">{user.name}</strong>
          <small className="block text-[0.68rem] text-muted-foreground">{roleLabel}</small>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition max-sm:hidden', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="profile-menu reveal" role="menu">
          <div className="flex items-center gap-3 border-b border-border p-3">
            <span className="avatar h-10 w-10" aria-hidden="true">
              {initialsOf(user.name)}
            </span>
            <div className="min-w-0">
              <strong className="block [overflow-wrap:anywhere] text-sm">{user.name}</strong>
              <small className="block [overflow-wrap:anywhere] text-xs text-muted-foreground">{user.email}</small>
            </div>
          </div>
          <div className="pt-1.5">
            <Link href="/microsoft-365" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <ExternalLink aria-hidden="true" /> Microsoft 365
            </Link>
            {showSettings && (
              <Link href="/student/settings" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
                <Settings aria-hidden="true" /> Ajustes
              </Link>
            )}
            <form action={logout}>
              <button type="submit" className="menu-item" role="menuitem">
                <LogOut aria-hidden="true" /> Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function PortalShell({ portal = 'student', user, currentTermCode, preEnrollmentTermCode, cartCount, children }: PortalShellProps) {
  const pathname = usePathname()
  const { home, roleLabel, navItems } = portals[portal]
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
    } catch {}
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('sidebar-collapsed', String(next))
    } catch {}
  }

  return (
    <div className="app-shell">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      {mobileOpen && <div className="mobile-backdrop lg:hidden" aria-hidden="true" onClick={() => setMobileOpen(false)} />}

      <aside className={cn('sidebar', collapsed && 'sidebar-collapsed', mobileOpen && 'sidebar-mobile-open')}>
        <div className="flex items-center justify-between px-5 pb-6 pt-6">
          <UnimetLogo compact={collapsed} className={cn(collapsed && 'lg:mx-auto')} />
          <button type="button" className="icon-button lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 px-3" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.href === home ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-item', active && 'nav-active')}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
                {item.href === '/student/pre-enrollment' && cartCount > 0 && (
                  <span
                    aria-label={`${cartCount} ${cartCount === 1 ? 'sección seleccionada' : 'secciones seleccionadas'}`}
                    className={cn(
                      'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f68629] px-1.5 text-[0.65rem] font-bold text-[var(--on-orange)]',
                      collapsed && 'lg:absolute lg:right-2.5 lg:top-1.5 lg:h-4 lg:min-w-4 lg:px-1 lg:text-[0.58rem]',
                    )}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="sidebar-toggle max-lg:hidden"
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
        </button>

        {portal === 'student' && !collapsed && preEnrollmentTermCode && pathname !== '/student' && (
          <div className="mt-auto p-4">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#003087] to-[#1859a9] p-5 text-white">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#f68629]/40 blur-2xl" aria-hidden="true" />
              <p className="relative text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#ffb36b]">Período {preEnrollmentTermCode}</p>
              <p className="relative mt-1.5 font-display text-xl font-extrabold uppercase leading-none">Pre-inscripciones abiertas</p>
              <Link
                href="/student/pre-enrollment"
                className="relative mt-4 inline-flex min-h-[max(1.5rem,var(--tap-min))] items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#003087] transition hover:bg-[#ffb36b]"
              >
                Pre-inscribir materias →
              </Link>
            </div>
          </div>
        )}
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button type="button" className="icon-button lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
              <Menu aria-hidden="true" />
            </button>
            <p className="flex min-w-0 flex-col text-xs leading-normal sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2 sm:text-sm">
              <span className="sm:whitespace-nowrap">
                <span className="text-muted-foreground">Período en curso: </span>
                <strong className="font-display text-sm font-extrabold sm:text-base">{currentTermCode ?? '—'}</strong>
              </span>
              {preEnrollmentTermCode && (
                <span className="sm:whitespace-nowrap">
                  <span className="hidden text-muted-foreground sm:inline">· </span>
                  <span className="text-muted-foreground">Pre-inscripción para: </span>
                  <strong className="font-display text-sm font-extrabold sm:text-base">{preEnrollmentTermCode}</strong>
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {portal === 'student' && <HelpPanel />}
            <ThemeToggle />
            <ProfileMenu user={user} roleLabel={roleLabel} showSettings={portal === 'student'} />
          </div>
        </header>
        <main id="contenido" tabIndex={-1} className="outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
