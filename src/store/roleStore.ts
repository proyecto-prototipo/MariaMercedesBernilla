import { create } from 'zustand'

type Role = 'Agricultor' | 'Apicultor' | 'Admin' | 'Invitado' | null

type RoleState = {
  role: Role
  name: string
  setRole: (role: Exclude<Role, null>, name: string) => void
  reset: () => void
}

const KEY = 'bp360_role'

const persisted = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(KEY) || 'null') : null

export const useRoleStore = create<RoleState>((set) => ({
  role: persisted?.role ?? null,
  name: persisted?.name ?? '',
  setRole: (role, name) => {
    const data = { role, name }
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
    set(data)
  },
  reset: () => {
    try { localStorage.removeItem(KEY) } catch {}
    set({ role: null, name: '' })
  },
}))
