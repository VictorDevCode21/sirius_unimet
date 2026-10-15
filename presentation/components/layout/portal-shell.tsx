'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  X,
} from 'lucide-react'
import { UnimetLogo } from '@/presentation/components/brand/unimet-logo'
import { logout } from '@/control/controllers/authentication.controller'
import { cn } from '@/presentation/lib/utils'

const navItems = [
  { label: 'Resumen', href: '/student', icon: LayoutDashboard },
  { label: 'Mi flujograma', href: '/student/flowchart', icon: BookOpen },
  { label: 'Pre-inscripción', href: '/student/pre-enrollment', icon: CalendarDays },
  { label: 'Histórico', href: '/student/history', icon: Clock3 },
  { label: 'Comprobante', href: '/student/receipt', icon: FileText },
]

interface PortalShellProps {
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
      {dark ? <Sun /> : <Moon />}
    </button>
  )
}

function ProfileMenu({ user }: { user: PortalShellProps['user'] }) {
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
        className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition hover:shadow-[var(--shadow-soft)]"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="avatar h-9 w-9 text-[0.72rem]">{initialsOf(user.name)}</span>
        <span className="hidden text-left sm:block">
          <strong className="block text-[0.8rem] leading-tight">{user.name}</strong>
          <small className="block text-[0.68rem] text-muted-foreground">Estudiante</small>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="profile-menu reveal" role="menu">
          <div className="flex items-center gap-3 border-b border-border p-3">
            <span className="avatar h-10 w-10">{initialsOf(user.name)}</span>
            <div className="min-w-0">
              <strong className="block truncate text-sm">{user.name}</strong>
              <small className="block truncate text-xs text-muted-foreground">{user.email}</small>
            </div>
          </div>
          <div className="pt-1.5">
            <Link href="/microsoft-365" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <ExternalLink /> Microsoft 365
            </Link>
            <form action={logout}>
              <button type="submit" className="menu-item" role="menuitem">
                <LogOut /> Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function PortalShell({ user, currentTermCode, preEnrollmentTermCode, cartCount, children }: PortalShellProps) {
  const pathname = usePathname()
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
      {mobileOpen && <div className="mobile-backdrop lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={cn('sidebar', collapsed && 'sidebar-collapsed', mobileOpen && 'sidebar-mobile-open')}>
        <div className="flex items-center justify-between px-5 pb-6 pt-6">
          <UnimetLogo compact={collapsed} className={cn(collapsed && 'lg:mx-auto')} />
          <button type="button" className="icon-button lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
            <X />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 px-3" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.href === '/student' ? pathname === item.href : pathname.startsWith(item.href)
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
                    className={cn(
                      'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f68629] px-1.5 text-[0.65rem] font-bold text-white',
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
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>

        {!collapsed && preEnrollmentTermCode && (
          <div className="mt-auto p-4">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#003087] to-[#1859a9] p-5 text-white">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#f68629]/40 blur-2xl" />
              <p className="relative text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#ffb36b]">Trimestre {preEnrollmentTermCode}</p>
              <p className="relative mt-1.5 font-display text-xl font-extrabold uppercase leading-none">Pre-inscripciones abiertas</p>
              <Link
                href="/student/pre-enrollment"
                className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#003087] transition hover:bg-[#ffb36b]"
              >
                Inscribir materias →
              </Link>
            </div>
          </div>
        )}
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button type="button" className="icon-button lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
              <Menu />
            </button>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Período actual</p>
              <p className="font-display text-lg font-extrabold leading-tight">{currentTermCode ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <ProfileMenu user={user} />
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
