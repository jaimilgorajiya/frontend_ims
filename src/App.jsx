import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import Shuffle from './Shuffle.js';
import StockInPage from './pages/StockIn.jsx';
import StockOutPage from './pages/StockOut.jsx';
import RecordsPage from './pages/Records.jsx';
import ReportsPage from './pages/Reports.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import ForgotPasswordPage from './pages/ForgotPassword.jsx';
import ResetPasswordPage from './pages/ResetPassword.jsx';
import AvailableProductsPage from './pages/AvailableProducts.jsx';
import VoiceAssistant from './components/VoiceAssistant.jsx';
import { Sun, Moon, Package, TrendingUp, TriangleAlert, Activity, CircleCheck } from 'lucide-react';

import './App.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
          <NavLink to="/available-products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Available Products</NavLink>
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

function HeroVisual() {
  const [stats, setStats] = useState({ totalValue: 0, lowStock: 0, distinctItems: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get(`${BASE_URL}/api/stock/summary`)
        if (res.data.success) {
          const items = res.data.data || []
          const totalValue = items.reduce((acc, item) => acc + (item.inventoryValue || 0), 0)
          const lowStock = items.filter(item => item.availableQuantity < 10).length
          setStats({ totalValue, lowStock, distinctItems: items.length })
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="hero-visual">
      <div className="visual-glow" />
      <motion.div 
        className="visual-card main-card"
        initial={{ opacity: 0, y: 30, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="card-header">
          <div className="card-icon-box"><Package size={22} color="#fff" /></div>
          <div className="card-title">Total Inventory Value</div>
        </div>
        <div className="card-value">
          {loading ? "..." : formatCurrency(stats.totalValue)}
        </div>
        <div className="card-stat positive">
          <TrendingUp size={16} />
          <span>Live Updates</span>
        </div>
        <div className="card-progress">
          <div className="progress-bar" style={{ width: '100%' }} />
        </div>
      </motion.div>

      <motion.div 
        className="visual-card float-card card-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0, y: [0, -12, 0] }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.3 },
          x: { duration: 0.5, delay: 0.3 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 } 
        }}
      >
        <div className={`float-icon ${stats.lowStock > 0 ? 'warning' : 'success'}`}>
          {stats.lowStock > 0 ? <TriangleAlert size={18} /> : <CircleCheck size={18} />}
        </div>
        <div>
          <div className="label">Low Stock</div>
          <div className="value">{loading ? "..." : `${stats.lowStock} Items`}</div>
        </div>
      </motion.div>

    
      <motion.div 
        className="visual-card float-card card-3"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.7 },
          scale: { duration: 0.5, delay: 0.7 },
          y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.7 } 
        }}
      >
        <div className="float-icon info"><Activity size={18} /></div>
        <div>
          <div className="label">Unique Products</div>
          <div className="value">{loading ? "..." : stats.distinctItems}</div>
        </div>
      </motion.div>
    </div>
  )
}

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
      <HeroVisual />
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
          <Route path="/available-products" element={<ProtectedRoute><AvailableProductsPage /></ProtectedRoute>} />
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
