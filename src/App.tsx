import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import ApplicationsList from '@/pages/ApplicationsList'
import ApplicationDetail from '@/pages/ApplicationDetail'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ApplicationsList />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
