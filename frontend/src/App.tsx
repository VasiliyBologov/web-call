import React, { useMemo } from 'react'
import { Landing } from './pages/Landing'
import { Call } from './pages/Call'
import { Room } from './pages/Room'
import { Admin } from './pages/Admin'

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

export const App: React.FC = () => {
  const { route, token } = useMemo(useRoute, [window.location.pathname])
  if (route === 'room' && token) {
    return <Room token={token} />
  }
  if (route === 'admin') {
    return <Admin />
  }
  if (route === 'call') {
    return <Call />
  }
  return <Landing />
}
