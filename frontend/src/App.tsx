import React, { useMemo } from 'react'
import { Home } from './pages/Home'
import { Room } from './pages/Room'
import { Admin } from './pages/Admin'

function useRoute() {
  const path = window.location.pathname
  const roomMatch = path.match(/^\/r\/([^/]+)$/)
  const isAdmin = path === '/admin'
  return {
    route: roomMatch ? 'room' : (isAdmin ? 'admin' : 'home'),
    token: roomMatch ? decodeURIComponent(roomMatch[1]) : undefined,
  } as const
}

export const App: React.FC = () => {
  const { route, token } = useMemo(useRoute, [window.location.pathname])
  if (route === 'room' && token) {
    return <Room token={token} />
  }
  if (route === 'admin') {
    return <Admin />
  }
  return <Home />
}
