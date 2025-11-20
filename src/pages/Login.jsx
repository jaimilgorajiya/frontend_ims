import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, NavLink } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('rememberedEmail') || ''
      const savedPassword = localStorage.getItem('rememberedPassword') || ''
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      if (savedEmail && savedPassword && rememberMe) {
        setForm({ email: savedEmail, password: savedPassword, rememberMe })
      }
    } catch {}
  }, [])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    if (result) setResult(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, { email: form.email, password: form.password })
      if (!data?.token) throw new Error(data?.message || 'Login failed')
      try {
        if (form.rememberMe) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('rememberedEmail', form.email)
          localStorage.setItem('rememberedPassword', form.password)
          localStorage.setItem('rememberMe', 'true')
        } else {
          sessionStorage.setItem('token', data.token)
          localStorage.removeItem('rememberedEmail')
          localStorage.removeItem('rememberedPassword')
          localStorage.removeItem('rememberMe')
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      } catch {}
      navigate('/')
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <h2>Welcome Back</h2>
        <p className="muted">Sign in to access your inventory</p>
      </header>
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={onChange} 
            placeholder="you@example.com" 
            required 
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input 
              id="password" 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              value={form.password} 
              onChange={onChange} 
              placeholder="Enter your password" 
              required 
            />
            <button 
              type="button" 
              className="btn btn-icon" 
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-8px' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              name="rememberMe" 
              checked={form.rememberMe} 
              onChange={onChange} 
            />
            <span style={{ color: '#aeb9da', fontSize: '0.9rem' }}>Remember me</span>
          </label>
          <NavLink to="/forgot-password" className="nav-link" style={{ fontSize: '0.9rem', color: '#6b7bff' }}>
            Forgot password?
          </NavLink>
        </div>
        {result && (
          <div className={`alert ${result.success ? 'success' : 'error'}`}>
            <div>{result.message}</div>
          </div>
        )}
        <div className="form-actions">
          <button className="btn primary" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
        <div className="form-footer">
          <span>New here? </span>
          <NavLink to="/register">Create an account</NavLink>
        </div>
      </form>
    </div>
  )
}
