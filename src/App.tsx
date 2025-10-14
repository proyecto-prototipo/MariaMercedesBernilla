import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import OfferDetail from './pages/OfferDetail'
import Checkout from './pages/Checkout'
import BeeTrack from './pages/BeeTrack'
import Contracts from './pages/Contracts'
import ProfileBeekeeper from './pages/ProfileBeekeeper'
import ProfileFarmer from './pages/ProfileFarmer'
import Admin from './pages/Admin'
import FAQ from './pages/FAQ'
import NotFound from './pages/NotFound'
import Clients from './pages/Clients'
import ClientNew from './pages/ClientNew'
import Metrics from './pages/Metrics'
import Footer from './components/Footer'
import { useRoleStore } from './store/roleStore'

function RequirePublisher({ children }: { children: JSX.Element }){
  const { role } = useRoleStore()
  if (role !== 'Admin' && role !== 'Apicultor') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
  <Navbar />
  <main className="flex-1 pt-4 md:pt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Marketplace />} />
          <Route path="/offer/:id" element={<OfferDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/beetrack" element={<BeeTrack />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<ClientNew />} />
          <Route path="/beekeeper/:id" element={<ProfileBeekeeper />} />
          <Route path="/farmer" element={<ProfileFarmer />} />
          <Route path="/admin" element={<RequirePublisher><Admin /></RequirePublisher>} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="*" element={<NotFound />} />
          <Route path="" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
