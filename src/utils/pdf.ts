import jsPDF from 'jspdf'

export type OrderPDF = {
  ofertaId: string
  titulo: string
  apicultor: string
  fechas: { desde: string; hasta: string }
  region: string
  colmenas: number
  precioUnitario: number
  total: number
  comprador: string
  cultivo?: string
  superficieHa?: number
  recomendado?: number
}

export function generateOrderPDF(order: OrderPDF) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('BeePoliniza 360 – Orden de Servicio (Simulada)', 14, 18)
  doc.setFontSize(11)
  doc.text(`Oferta: ${order.titulo} (${order.ofertaId})`, 14, 30)
  doc.text(`Apicultor: ${order.apicultor}`, 14, 38)
  doc.text(`Comprador: ${order.comprador}`, 14, 46)
  doc.text(`Región: ${order.region}`, 14, 54)
  doc.text(`Fechas: ${order.fechas.desde} → ${order.fechas.hasta}`, 14, 62)
  if (order.cultivo) doc.text(`Cultivo: ${order.cultivo}`, 14, 70)
  if (order.superficieHa) doc.text(`Superficie: ${order.superficieHa} ha`, 14, 78)
  if (order.recomendado) doc.text(`Recomendado: ${order.recomendado} colmenas`, 14, 86)
  const baseY = order.recomendado || order.superficieHa || order.cultivo ? 94 : 70
  doc.text(`Colmenas: ${order.colmenas}`, 14, baseY)
  doc.text(`Precio unitario: S/ ${order.precioUnitario.toFixed(2)}`, 14, baseY + 8)
  doc.text(`Total estimado: S/ ${order.total.toFixed(2)}`, 14, baseY + 16)
  doc.setFontSize(9)
  doc.text('Demo/Simulación – sin validez contractual', 14, baseY + 32)
  doc.save(`orden-${order.ofertaId}.pdf`)
}
