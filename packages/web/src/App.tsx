import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Agents from './pages/Agents'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Settings from './pages/Settings'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
