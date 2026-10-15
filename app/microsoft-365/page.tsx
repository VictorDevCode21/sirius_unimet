'use client'

import { ArrowLeft, ExternalLink, FileSpreadsheet, Mail, Presentation, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

const apps = [
  { name: 'Outlook', detail: 'Correo institucional y calendario', icon: Mail, color: 'bg-[#0078d4]' },
  { name: 'Word', detail: 'Documentos y trabajos académicos', icon: FileSpreadsheet, color: 'bg-[#185abd]' },
  { name: 'PowerPoint', detail: 'Presentaciones para tus proyectos', icon: Presentation, color: 'bg-[#d24726]' },
]

export default function Microsoft365Page() {
  const router = useRouter()
  return <main className="office-page"><div className="office-shell"><button type="button" className="office-back" onClick={() => router.back()}><ArrowLeft /> Volver al portal</button><div className="office-brand"><div className="office-mark"><span /><span /><span /><span /></div><div><strong>Universidad Metropolitana</strong><small>Servicios institucionales</small></div></div><section className="office-hero"><div><p className="eyebrow">Acceso institucional</p><h1>Todo tu campus,<br /><span>en un solo lugar.</span></h1><p>Accede a Microsoft 365 con tu cuenta institucional y lleva tus clases, documentos y proyectos contigo.</p><a className="office-cta" href="https://www.office.com" target="_blank" rel="noreferrer"><ExternalLink /> Abrir Microsoft 365</a></div><div className="office-orb"><div className="office-window"><div /><div /><div /></div></div></section><section className="office-apps"><div className="office-section-heading"><div><p className="eyebrow">Tu suite académica</p><h2>Herramientas para avanzar</h2></div><span className="office-status"><ShieldCheck /> Acceso activo</span></div><div className="office-app-grid">{apps.map((app) => { const Icon = app.icon; return <a className="office-app-card" href="https://www.office.com" target="_blank" rel="noreferrer" key={app.name}><div className={`office-app-icon ${app.color}`}><Icon /></div><div><h3>{app.name}</h3><p>{app.detail}</p></div><ExternalLink className="office-card-arrow" /></a> })}</div></section><p className="office-note">Usa tu correo institucional <strong>r.victor@correo.unimet.edu.ve</strong> para iniciar sesión.</p></div></main>
}
