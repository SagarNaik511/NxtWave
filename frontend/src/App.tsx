import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

import { PublicLayout } from './layouts/PublicLayout'
import { HomePage } from './pages/HomePage'
import { RegisterPage } from './pages/RegisterPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))

function RouteLoading() {
  return <div className="route-loading" role="status" aria-live="polite">Loading page…</div>
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/dashboard" element={<Suspense fallback={<RouteLoading />}><DashboardPage /></Suspense>} />
    </Routes>
  )
}

export default App

