import React, { useMemo } from 'react'
import { Home } from './pages/Home'
import { Room } from './pages/Room'

function useRoute() {
  const path = window.location.pathname
  const match = path.match(/^\/r\/([^/]+)$/)
  return {
    route: match ? 'room' : 'home',
    token: match ? decodeURIComponent(match[1]) : undefined,
  } as const
}

export const App: React.FC = () => {
  const { route, token } = useMemo(useRoute, [window.location.pathname])
  if (route === 'room' && token) {
    return <Room token={token} />
  }
  return <Home />
}
