import { Link, NavLink } from 'react-router-dom'
import { useRoleStore } from '../store/roleStore'
import RoleModal from './RoleModal'
import { useState } from 'react'
import beeLogo from '/assets/bee.svg'

export default function Navbar() {
  const { role, name } = useRoleStore()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-[2000] bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src={beeLogo} alt="Bee" className="w-6 h-6" />
          <span>BeePoliniza 360</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <NavLink to="/market" className={({isActive}) => isActive? 'text-bee-green' : ''}>Marketplace</NavLink>
          <NavLink to="/beetrack" className={({isActive}) => isActive? 'text-bee-green' : ''}>BeeTrack 360</NavLink>
          <NavLink to="/contracts" className={({isActive}) => isActive? 'text-bee-green' : ''}>Contratos demo</NavLink>
          <NavLink to="/clients" className={({isActive}) => isActive? 'text-bee-green' : ''}>Clientes</NavLink>
          <NavLink to="/metrics" className={({isActive}) => isActive? 'text-bee-green' : ''}>Métricas</NavLink>
          <NavLink to="/faq" className={({isActive}) => isActive? 'text-bee-green' : ''}>Ayuda/FAQ</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline" onClick={() => setOpen(true)} aria-haspopup="dialog">
            {role ? `${role} · ${name}` : 'Elegir rol'}
          </button>
          {role === 'Apicultor' && (
            <NavLink to="/admin" className="btn btn-primary">Publicar oferta</NavLink>
          )}
          {role === 'Admin' && (
            <NavLink to="/admin" className="btn btn-primary">Panel Admin</NavLink>
          )}
        </div>
      </div>
      {open && <RoleModal onClose={() => setOpen(false)} />}
    </header>
  )
}
