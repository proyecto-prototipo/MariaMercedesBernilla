import { useEffect, useMemo, useState } from 'react'
import { safeGet, safeSet } from '../utils/storage'

export type Client = {
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

export default function Clients(){
  const [clients, setClients] = useState<Client[]>(safeGet('bp360_clients', [] as Client[]))
  const [open, setOpen] = useState<Client | null>(null)
  const [form, setForm] = useState<Client | null>(null)

  useEffect(()=>{ safeSet('bp360_clients', clients) }, [clients])

  const canSave = useMemo(()=>{
    if (!form) return false
    if (!form.firstName?.trim() || !form.lastName?.trim()) return false
    const hasPhone = !!form.phone?.trim()
    const hasEmail = !!form.email?.trim()
    return hasPhone || hasEmail
  }, [form])

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <button className="btn btn-primary" onClick={()=>{ setForm({ id: 'CL-'+Math.random().toString(36).slice(2,8).toUpperCase(), firstName:'', lastName:'' }); setOpen({ id:'', firstName:'', lastName:'' }) }}>Nuevo cliente</button>
      </div>
      <div className="card p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-600">
              <th className="py-2">Nombre</th>
              <th>DNI</th>
              <th>Celular</th>
              <th>Correo</th>
              <th>País</th>
              <th>Nacimiento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t">
                <td className="py-2"><span className="font-medium">{c.firstName} {c.lastName}</span>{c.address? <div className="text-xs text-stone-500">{c.address}</div>:null}</td>
                <td>{c.dni||'-'}</td>
                <td>{c.phone||'-'}</td>
                <td>{c.email||'-'}</td>
                <td>{c.country||'-'}</td>
                <td>{c.birthplace||'-'}</td>
                <td className="text-right">
                  <button className="btn btn-outline btn-sm" onClick={()=>{ setForm({...c}); setOpen(c) }}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-overlay bg-black/40 grid place-items-center" role="dialog" aria-modal="true" onClick={()=>{ setForm(null); setOpen(null) }}>
          <div className="card w-[92vw] max-w-xl p-4" onClick={(e)=>e.stopPropagation()}>
            <h2 className="font-semibold mb-3">{open?.id? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-600">Nombre</label>
                <input className="input input-bordered w-full" value={form.firstName||''} onChange={e=>setForm({...form, firstName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-stone-600">Apellido</label>
                <input className="input input-bordered w-full" value={form.lastName||''} onChange={e=>setForm({...form, lastName: e.target.value})} />
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
              <button className="btn btn-outline" onClick={()=>{ setForm(null); setOpen(null) }}>Cancelar</button>
              <button className="btn btn-primary" disabled={!canSave} onClick={()=>{
                // save
                if (open?.id){
                  setClients(prev => prev.map(c => c.id === form.id ? form : c))
                } else {
                  setClients(prev => [...prev, form])
                }
                setForm(null); setOpen(null)
              }}>Guardar</button>
            </div>
            {!canSave && (
              <p className="text-xs text-red-600 mt-2">Nombre y Apellido son obligatorios. Debe ingresar al menos uno: Celular o Correo.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
