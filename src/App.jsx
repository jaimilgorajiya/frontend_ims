import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { Stars, OrbitControls, Environment, useGLTF, Bounds, Center } from '@react-three/drei'
import Shuffle from './Shuffle.js';
import StockInPage from './pages/StockIn.jsx';
import StockOutPage from './pages/StockOut.jsx';
import RecordsPage from './pages/Records.jsx';
import ReportsPage from './pages/Reports.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import ForgotPasswordPage from './pages/ForgotPassword.jsx';
import ResetPasswordPage from './pages/ResetPassword.jsx';
import VoiceAssistant from './components/VoiceAssistant.jsx';
import { Sun, Moon } from 'lucide-react';

import './App.css'

function Navbar({ theme, toggleTheme }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [reportsOpen, setReportsOpen] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('token') || sessionStorage.getItem('token')
    setToken(t)
    if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
    const onStorage = () => {
      const nt = localStorage.getItem('token') || sessionStorage.getItem('token')
      setToken(nt)
      if (nt) axios.defaults.headers.common['Authorization'] = `Bearer ${nt}`
      else delete axios.defaults.headers.common['Authorization']
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const onLogout = () => {
    try {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setToken(null)
      // Redirect to login page after logout
      navigate('/login', { replace: true })
    } catch (error) {
      // Ignore errors during logout cleanup
      console.error('Logout error:', error)
      // Still redirect to login even if there's an error
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">Inventory Manager</NavLink>
        <button className="nav-toggle" aria-label="Toggle Menu" onClick={() => setOpen(!open)}>
          <span />
          <span />
          <span />
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => { setOpen(false); setReportsOpen(false); }}>
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to="/stock-in" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Stock In</NavLink>
          <NavLink to="/stock-out" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Stock Out</NavLink>
          <NavLink to="/records" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>View Records</NavLink>
          <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="nav-link nav-drop-btn" onClick={() => setReportsOpen((v) => !v)}>
              Reports
              <span className={`chev ${reportsOpen ? 'up' : ''}`}>▾</span>
            </button>
            {reportsOpen && (
              <div className="nav-drop-menu">
                <NavLink
                  to="/reports/stock-in"
                  className={({ isActive }) => `nav-drop-item ${isActive ? 'active' : ''}`}
                  onClick={() => { setReportsOpen(false); setOpen(false); }}
                >
                  Stock In
                </NavLink>
                <NavLink
                  to="/reports/stock-out"
                  className={({ isActive }) => `nav-drop-item ${isActive ? 'active' : ''}`}
                  onClick={() => { setReportsOpen(false); setOpen(false); }}
                >
                  Stock Out
                </NavLink>
              </div>
            )}
          </div>
          <button
            type="button"
            className="nav-link"
            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {!token ? (
            <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Login</NavLink>
          ) : (
            <button type="button" className="nav-link" onClick={onLogout}>Logout</button>
          )}
        </nav>
      </div>
    </header>
  )
}

function Background3D({ theme }) {
  return (
    <div className="three-bg" aria-hidden>
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]} gl={{ antialias: true }}>
        <ambientLight intensity={theme === 'light' ? 0.9 : 0.6} />
        {theme !== 'light' && (
          <Stars radius={100} depth={50} count={4000} factor={3} saturation={0} fade speed={0.6} />
        )}
      </Canvas>
    </div>
  )
}

function BackgroundRipple() {
  const circles = [0, 1, 2, 3, 4]
  return (
    <div className="ripple-bg" aria-hidden>
      {circles.map((i) => (
        <motion.span
          key={i}
          className="ripple-circle"
          initial={{ opacity: 0.2, scale: 0.2 }}
          animate={{ opacity: [0.25, 0.12, 0.25], scale: [0.8 + i * 0.25, 1.4 + i * 0.25, 0.8 + i * 0.25] }}
          transition={{ duration: 8 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        />
      ))}
    </div>
  )
}

function Model({ color = '#7aa2ff', ...props }) {
  const { scene } = useGLTF('/models/a_windy_day.glb')
  const colored = React.useMemo(() => {
    const root = scene.clone(true)
    root.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mat = obj.material.clone()
        if (mat.color) mat.color.set(color)
        if (mat.emissive) {
          mat.emissive.set(color)
          if (typeof mat.emissiveIntensity === 'number') mat.emissiveIntensity = Math.max(0.1, mat.emissiveIntensity)
        }
        obj.material = mat
      }
      if (obj.isPoints && obj.material) {
        const pm = obj.material.clone()
        if (pm.color) pm.color.set(color)
        obj.material = pm
      }
    })
    return root
  }, [scene, color])
  return <primitive object={colored} {...props} />
}

function HeroModelCanvas({ theme }) {
  return (
    <div className="hero-model" aria-label="3D model">
      <Canvas camera={{ fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <React.Suspense fallback={null}>
          <Bounds fit clip observe margin={0.95}>
            <Center>
              <Model color={theme === 'light' ? '#4f46e5' : '#7aa2ff'} />
            </Center>
          </Bounds>
          <Environment preset="city" />
        </React.Suspense>
        <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} autoRotate autoRotateSpeed={5} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/a_windy_day.glb')

function Home({ theme }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
<Shuffle
  text="Inventory Management System"
  shuffleDirection="right"
  duration={0.5}
  animationMode="evenodd"
  shuffleTimes={1}
  ease="power3.out"
  stagger={0.03}
  threshold={0.1}
  triggerOnce={true}
  triggerOnHover={true}
  respectReducedMotion={true}
/>
          <span className="hero-title-addon">Smart • Fast • Reliable</span>
        </h1>
        <p className="hero-sub">Real-time control of stock in, stock out, and detailed records in a sleek dashboard.</p>
        <p className="hero-mini">Fast actions, clear insights, and reliable records for your daily operations.</p>
        <ul className="hero-points">
          <li>Low-stock alerts</li>
          <li>PDF Receipts</li>
          <li>Secure multi-user access</li>
        </ul>
        <div className="hero-cta">
          <NavLink to="/stock-in" className="btn primary wide">Stock In</NavLink>
          <NavLink to="/stock-out" className="btn wide">Stock Out</NavLink>
        </div>
      </div>
      <HeroModelCanvas theme={theme} />
    </section>
  )
}

function AppContent() {
  const location = useLocation()
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)
  
  const isAuthed = () => (typeof window !== 'undefined') && (localStorage.getItem('token') || sessionStorage.getItem('token'))

  const ProtectedRoute = ({ children }) => {
    const authed = isAuthed()
    if (!authed) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  // Setup axios interceptor for 401 errors
  React.useEffect(() => {
    const t = (typeof window !== 'undefined') && (localStorage.getItem('token') || sessionStorage.getItem('token'))
    if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear tokens and redirect to login on 401
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/forgot-password' && window.location.pathname !== '/reset-password') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  const [theme, setTheme] = React.useState(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    return prefersLight ? 'light' : 'dark'
  })

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  const toggleTheme = React.useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  // Sync theme when VoiceAssistant dispatches a theme change event
  React.useEffect(() => {
    const onThemeChange = (e) => {
      const next = e?.detail?.theme
      if (next === 'light' || next === 'dark') setTheme(next)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('app-theme-change', onThemeChange)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app-theme-change', onThemeChange)
      }
    }
  }, [])

  return (
    <>
      <Background3D theme={theme} />
      {!isAuthPage && <BackgroundRipple />}
      {!isAuthPage && <Navbar theme={theme} toggleTheme={toggleTheme} />}
      <main className={isAuthPage ? 'container auth-container' : 'container'}>
        <Routes>
          <Route path="/login" element={isAuthed() ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<ProtectedRoute><Home theme={theme} /></ProtectedRoute>} />
          <Route path="/stock-in" element={<ProtectedRoute><StockInPage /></ProtectedRoute>} />
          <Route path="/stock-out" element={<ProtectedRoute><StockOutPage /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
          <Route path="/reports/stock-in" element={<ProtectedRoute><ReportsPage filter="in" /></ProtectedRoute>} />
          <Route path="/reports/stock-out" element={<ProtectedRoute><ReportsPage filter="out" /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthed() ? "/" : "/login"} replace />} />
        </Routes>
      </main>
      {!isAuthPage && <VoiceAssistant />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
