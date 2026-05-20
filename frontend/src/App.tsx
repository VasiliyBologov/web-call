import React, { useMemo, lazy, Suspense } from 'react'

const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })))
const Call = lazy(() => import('./pages/Call').then(m => ({ default: m.Call })))
const Room = lazy(() => import('./pages/Room').then(m => ({ default: m.Room })))
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })))

function useRoute() {
  const path = window.location.pathname
  const roomMatch = path.match(/^\/r\/([^/]+)$/)
  const isAdmin = path === '/admin'
  const isCall = path === '/call'
  
  let route: 'room' | 'admin' | 'call' | 'landing' = 'landing'
  if (roomMatch) route = 'room'
  else if (isAdmin) route = 'admin'
  else if (isCall) route = 'call'

  return {
    route,
    token: roomMatch ? decodeURIComponent(roomMatch[1]) : undefined,
  } as const
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#020617] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export const App: React.FC = () => {
  const { route, token } = useMemo(useRoute, [window.location.pathname])
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      {route === 'room' && token && <Room token={token} />}
      {route === 'admin' && <Admin />}
      {route === 'call' && <Call />}
      {route === 'landing' && <Landing />}
    </Suspense>
  )
}
