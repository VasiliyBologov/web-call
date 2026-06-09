import React, { useMemo, lazy, Suspense } from 'react'

const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })))
const Call = lazy(() => import('./pages/Call').then(m => ({ default: m.Call })))
const Meet = lazy(() => import('./pages/Meet').then(m => ({ default: m.Meet })))
const Room = lazy(() => import('./pages/Room').then(m => ({ default: m.Room })))
const MeetRoom = lazy(() => import('./pages/MeetRoom').then(m => ({ default: m.MeetRoom })))
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })))
const SeoLanding = lazy(() => import('./pages/SeoLanding').then(m => ({ default: m.SeoLanding })))
const BlogArticle = lazy(() => import('./pages/BlogArticle').then(m => ({ default: m.BlogArticle })))

function useRoute() {
  const path = window.location.pathname
  const roomMatch = path.match(/^\/r\/([^/]+)$/)
  const meetRoomMatch = path.match(/^\/m\/([^/]+)$/)
  const blogMatch = path.match(/^\/blog\/([^/]+)$/)
  
  const seoLandingPaths = ['/online-video-calls', '/web-calls', '/video-meetings', '/video-call-link']
  const isSeoLanding = seoLandingPaths.includes(path)
  
  const isAdmin = path === '/admin'
  const isCall = path === '/call'
  const isMeet = path === '/meet'
  const isBlog = path === '/blog'
  
  let route: 'room' | 'meet-room' | 'admin' | 'call' | 'meet' | 'landing' | 'seo-landing' | 'blog' | 'blog-article' = 'landing'
  let token: string | undefined = undefined
  let slug: string | undefined = undefined

  if (roomMatch) {
    route = 'room'
    token = decodeURIComponent(roomMatch[1])
  } else if (meetRoomMatch) {
    route = 'meet-room'
    token = decodeURIComponent(meetRoomMatch[1])
  } else if (blogMatch) {
    route = 'blog-article'
    slug = blogMatch[1]
  } else if (isSeoLanding) {
    route = 'seo-landing'
    slug = path.substring(1)
  } else if (isAdmin) {
    route = 'admin'
  } else if (isCall) {
    route = 'call'
  } else if (isMeet) {
    route = 'meet'
  } else if (isBlog) {
    route = 'blog'
  }

  return { route, token, slug } as const
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#020617] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export const App: React.FC = () => {
  const { route, token, slug } = useMemo(useRoute, [window.location.pathname])
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      {route === 'room' && token && <Room token={token} />}
      {route === 'meet-room' && token && <MeetRoom token={token} />}
      {route === 'admin' && <Admin />}
      {route === 'call' && <Call />}
      {route === 'meet' && <Meet />}
      {route === 'landing' && <Landing />}
      {route === 'seo-landing' && slug && <SeoLanding slug={slug} />}
      {route === 'blog' && <BlogArticle />}
      {route === 'blog-article' && <BlogArticle slug={slug} />}
    </Suspense>
  )
}
