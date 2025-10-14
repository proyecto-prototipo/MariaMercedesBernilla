import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { safeGet, safeSet } from '../utils/storage'
import { Client } from '../types/client'
import { Order, ORDER_STATUS_META } from '../types/order'
import { ensureSampleData } from '../data/sampleData'

export default function Clients() {
  ensureSampleData()
  const [clients, setClients] = useState<Client[]>(safeGet('bp360_clients', [] as Client[]));
  const [open, setOpen] = useState<Client | null>(null);
  const [form, setForm] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(safeGet('bp360_orders', [] as Order[]));
  const [servicesClientId, setServicesClientId] = useState<string | null>(null);

  useEffect(() => { safeSet('bp360_clients', clients); }, [clients]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'bp360_orders') {
        setOrders(safeGet('bp360_orders', [] as Order[]));
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Filtro de búsqueda
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      (c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.dni?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q))
    );
  }, [clients, search]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const ordersByClient = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    orders.forEach(order => {
      (groups[order.clientId] ||= []).push(order);
    });
    return groups;
  }, [orders]);

  const servicesClient = useMemo(() => {
    if (!servicesClientId) return null;
    return clients.find(c => c.id === servicesClientId) ?? null;
  }, [servicesClientId, clients]);

  const servicesOrders = useMemo(() => {
    if (!servicesClientId) return [] as Order[];
    const grouped = ordersByClient[servicesClientId] ?? [];
    return [...grouped].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [servicesClientId, ordersByClient]);

  const handleCreateSale = (clientId: string) => {
    sessionStorage.setItem('bp360_new_order_client', clientId);
    navigate('/beetrack');
  };

  const handleViewServices = (clientId: string) => {
    setServicesClientId(clientId);
  };

  const handleOpenOrderOnMap = (order: Order) => {
    if (order.siteId) {
      sessionStorage.setItem('bp360_open_site', order.siteId);
    }
    setServicesClientId(null);
    navigate('/beetrack');
  };

  const closeServicesModal = () => setServicesClientId(null);

  const canSave = useMemo(() => {
    if (!form) return false;
    if (!form.firstName?.trim() || !form.lastName?.trim()) return false;
    const hasPhone = !!form.phone?.trim();
    const hasEmail = !!form.email?.trim();
    return hasPhone || hasEmail;
  }, [form]);

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <input
            className="input input-bordered w-64"
            type="search"
            placeholder="Buscar por nombre, DNI, email, celular..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button className="btn btn-primary" onClick={() => {
            setForm({ id: 'CL-' + Math.random().toString(36).slice(2, 8).toUpperCase(), firstName: '', lastName: '' });
            setOpen({ id: '', firstName: '', lastName: '' });
          }}>Nuevo cliente</button>
        </div>
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
              <th>Órdenes</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(c => {
              const clientOrders = ordersByClient[c.id] ?? [];
              let activeCount = 0;
              let pendingCount = 0;
              let latest: Order | null = null;
              clientOrders.forEach(order => {
                if (order.status === 'active') activeCount += 1;
                if (order.status === 'pending-location') pendingCount += 1;
                if (!latest) {
                  latest = order;
                  return;
                }
                if (new Date(order.createdAt).getTime() > new Date(latest.createdAt).getTime()) {
                  latest = order;
                }
              });
              return (
                <tr key={c.id} className="border-t align-top">
                  <td className="py-2"><span className="font-medium">{c.firstName} {c.lastName}</span>{c.address ? <div className="text-xs text-stone-500">{c.address}</div> : null}</td>
                  <td>{c.dni || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.country || '-'}</td>
                  <td>{c.birthplace || '-'}</td>
                  <td>
                    {clientOrders.length > 0 ? (
                      <div className="flex flex-col items-start gap-1 text-xs">
                        <span className="text-sm font-medium">{clientOrders.length} {clientOrders.length === 1 ? 'orden' : 'órdenes'}</span>
                        <span className="text-stone-500">{activeCount} activas · {pendingCount} pendientes</span>
                        {latest ? (
                          <span className="text-stone-500">Última {formatRelative(latest.createdAt)}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-sm text-stone-400">Sin órdenes</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      <button className="btn btn-primary btn-xs" onClick={() => handleCreateSale(c.id)}>Crear venta</button>
                      <button className="btn btn-outline btn-xs" disabled={clientOrders.length === 0} onClick={() => handleViewServices(c.id)}>Ver servicios</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => { setForm({ ...c }); setOpen(c); }}>Editar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-stone-400">No se encontraron clientes.</td></tr>
            )}
          </tbody>
        </table>
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button className="btn btn-outline btn-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>&lt;</button>
            <span className="text-sm">Página {page} de {totalPages}</span>
            <button className="btn btn-outline btn-xs" disabled={page === totalPages} onClick={() => setPage(page + 1)}>&gt;</button>
          </div>
        )}
      </div>

      {servicesClient && (
        <div className="modal-overlay bg-black/40 grid place-items-center" role="dialog" aria-modal="true" onClick={closeServicesModal}>
          <div className="card w-[95vw] max-w-3xl p-6 shadow-2xl border-2 border-stone-300 bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold text-xl text-stone-700">Servicios de {servicesClient.firstName} {servicesClient.lastName}</h2>
                <div className="text-sm text-stone-500 space-y-1 mt-1">
                  {servicesClient.phone ? <div>📞 {servicesClient.phone}</div> : null}
                  {servicesClient.email ? <div>✉️ {servicesClient.email}</div> : null}
                  {servicesClient.address ? <div>{servicesClient.address}</div> : null}
                </div>
              </div>
              <button className="btn btn-outline" onClick={closeServicesModal}>Cerrar</button>
            </div>
            {servicesOrders.length > 0 ? (
              <ul className="divide-y">
                {servicesOrders.map(order => {
                  const status = ORDER_STATUS_META[order.status];
                  const confirmed = order.status === 'active' && order.locationConfirmedAt;
                  return (
                    <li key={order.id} className="py-4 space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate" title={order.siteName}>{order.siteName}</p>
                          <p className="text-xs text-stone-500 truncate">{order.quantity} panales · {order.contractMonths} meses</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                      </div>
                      <div className="text-xs text-stone-500">Creada {formatRelative(order.createdAt)}{confirmed ? ` · Ubicación confirmada ${formatRelative(order.locationConfirmedAt!)}` : ''}</div>
                      {order.notes ? <div className="text-xs text-stone-600">Notas: {order.notes}</div> : null}
                      <div className="flex justify-end">
                        <button className="btn btn-outline btn-xs" onClick={() => handleOpenOrderOnMap(order)}>Ver en BeeTrack</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-stone-500 text-center py-6">Aún no hay servicios registrados para este cliente.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal mejorado */}
      {form && (
        <div className="modal-overlay bg-black/40 grid place-items-center" role="dialog" aria-modal="true" onClick={() => { setForm(null); setOpen(null); }}>
          <div className="card w-[95vw] max-w-2xl p-6 shadow-2xl border-2 border-stone-300 bg-white" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl mb-4 text-stone-700 text-center">{open?.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-1">Nombre</label>
                <input className="w-full text-lg font-medium rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.firstName || ''} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-1">Apellido</label>
                <input className="w-full text-lg font-medium rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-1">DNI</label>
                <input className="w-full text-lg rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.dni || ''} onChange={e => setForm({ ...form, dni: e.target.value })} />
              </div>
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-1">Celular</label>
                <input className="w-full text-lg rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-1">Correo</label>
                <input className="w-full text-lg rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-1">País</label>
                <input className="w-full text-lg rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-1">Lugar de nacimiento</label>
                <input className="w-full text-lg rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.birthplace || ''} onChange={e => setForm({ ...form, birthplace: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-base font-semibold text-stone-700 mb-1">Dirección</label>
                <input className="w-full text-lg rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-base font-semibold text-stone-700 mb-1">Notas</label>
                <textarea className="w-full text-lg rounded-lg transition-all duration-200 shadow focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border border-stone-300 bg-stone-50 hover:bg-stone-100 focus:bg-white px-4 py-2 outline-none h-24" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button className="btn btn-outline btn-lg" onClick={() => { setForm(null); setOpen(null); }}>Cancelar</button>
              <button className="btn btn-primary btn-lg" disabled={!canSave} onClick={() => {
                // save
                if (open?.id) {
                  setClients(prev => prev.map(c => c.id === form.id ? form : c));
                } else {
                  setClients(prev => [...prev, form]);
                }
                setForm(null); setOpen(null);
              }}>Guardar</button>
            </div>
            {!canSave && (
              <p className="text-base text-red-600 mt-4 text-center">Nombre y Apellido son obligatorios. Debe ingresar al menos uno: Celular o Correo.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatRelative(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const diffMs = dt.getTime() - Date.now();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);
  const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (absMinutes < 60) return formatter.format(Math.round(diffMs / 60000), 'minute');
  const absHours = Math.round(Math.abs(diffMs) / 3600000);
  if (absHours < 24) return formatter.format(Math.round(diffMs / 3600000), 'hour');
  const days = Math.round(diffMs / 86400000);
  return formatter.format(days, 'day');
}
