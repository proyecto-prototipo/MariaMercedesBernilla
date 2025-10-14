import { useRoleStore } from '../store/roleStore'
import { useState } from 'react'

export default function RoleModal({ onClose }: { onClose: () => void }) {
  const { setRole } = useRoleStore()
  const [name, setName] = useState('')
  const [role, setRoleLocal] = useState<'Agricultor'|'Apicultor'|'Admin'|'Invitado'|''>('')

  const confirm = () => {
    if (!role) return
    setRole(role, name || (role === 'Invitado' ? 'Invitado' : role))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center" role="dialog" aria-modal="true">
      <div className="card w-[92vw] max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Selecciona tu rol</h2>
        <label className="block text-sm mb-1">Nombre</label>
        <input className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="Ej. Agro Norte" value={name} onChange={e=>setName(e.target.value)} />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(['Agricultor','Apicultor','Admin','Invitado'] as const).map(r => (
            <button key={r} className={`btn ${role===r? 'btn-primary' : 'btn-outline'}`} onClick={()=>setRoleLocal(r)}>{r}</button>
          ))}
        </div>
        <div className="mb-4">
          <p className="text-xs text-stone-600 mb-2">Usuarios de demo:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button className="btn btn-outline" onClick={()=>{ setName('Agro Norte'); setRoleLocal('Agricultor') }}>Agro Norte (Agricultor)</button>
            <button className="btn btn-outline" onClick={()=>{ setName('Apis Andinas'); setRoleLocal('Apicultor') }}>Apis Andinas (Apicultor)</button>
            <button className="btn btn-outline" onClick={()=>{ setName('Admin Demo'); setRoleLocal('Admin') }}>Admin Demo</button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={confirm} disabled={!role}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}
