import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { safeGet, safeSet } from '../utils/storage'

type Client = {
  id: string
  firstName: string
  lastName: string
  dni?: string
  phone?: string
  email?: string
  country?: string
  birthplace?: string
  address?: string
  notes?: string
}

export default function ClientNew(){
  const navigate = useNavigate()
  const [form, setForm] = useState<Client>({ id: genId(), firstName: '', lastName: '' })
  const canSave = useMemo(()=>{
    if (!form.firstName.trim() || !form.lastName.trim()) return false
    const hasPhone = !!form.phone?.trim()
    const hasEmail = !!form.email?.trim()
    return hasPhone || hasEmail
  }, [form])

  function save(){
    if (!canSave) return
    const list = safeGet('bp360_clients', [] as Client[])
    safeSet('bp360_clients', [...list, form])
    navigate('/clients')
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Registrar cliente</h1>
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs text-stone-600">Nombre</label>
            <input className="input input-bordered w-full" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Apellido</label>
            <input className="input input-bordered w-full" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">DNI</label>
            <input className="input input-bordered w-full" value={form.dni||''} onChange={e=>setForm({...form, dni: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Celular</label>
            <input className="input input-bordered w-full" value={form.phone||''} onChange={e=>setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Correo</label>
            <input className="input input-bordered w-full" value={form.email||''} onChange={e=>setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">País</label>
            <input className="input input-bordered w-full" value={form.country||''} onChange={e=>setForm({...form, country: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Lugar de nacimiento</label>
            <input className="input input-bordered w-full" value={form.birthplace||''} onChange={e=>setForm({...form, birthplace: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-stone-600">Dirección</label>
            <input className="input input-bordered w-full" value={form.address||''} onChange={e=>setForm({...form, address: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-stone-600">Notas</label>
            <textarea className="input input-bordered w-full h-24" value={form.notes||''} onChange={e=>setForm({...form, notes: e.target.value})} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-outline" onClick={()=>navigate('/clients')}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={save}>Guardar</button>
        </div>
        {!canSave && (
          <p className="text-xs text-red-600 mt-2">Nombre y Apellido son obligatorios. Debe ingresar al menos uno: Celular o Correo.</p>
        )}
      </div>
    </section>
  )
}

function genId(){
  return 'CL-'+Math.random().toString(36).slice(2,8).toUpperCase()
}
