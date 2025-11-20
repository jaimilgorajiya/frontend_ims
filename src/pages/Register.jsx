import React, { useState } from 'react'
import axios from 'axios'
import { NavLink, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (result) setResult(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/register`, form)
      if (!data) throw new Error('Registration failed')
      setResult({ success: true, message: data.message || 'Registered successfully' })
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <h2>Create Account</h2>
        <p className="muted">Start managing your inventory today</p>
      </header>
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input 
            id="username" 
            name="username" 
            value={form.username} 
            onChange={onChange} 
            placeholder="Enter your username" 
            required 
          />
        </div>
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
              placeholder="Create a password" 
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
        <div className="field">
          <label htmlFor="confirm_password">Confirm Password</label>
          <div className="password-input-wrapper">
            <input 
              id="confirm_password" 
              name="confirm_password" 
              type={showConfirm ? 'text' : 'password'} 
              value={form.confirm_password} 
              onChange={onChange} 
              placeholder="Confirm your password" 
              required 
            />
            <button 
              type="button" 
              className="btn btn-icon" 
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {result && (
          <div className={`alert ${result.success ? 'success' : 'error'}`}>
            <div>{result.message}</div>
          </div>
        )}
        <div className="form-actions">
          <button className="btn primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create account'}
          </button>
        </div>
        <div className="form-footer">
          <span>Already have an account? </span>
          <NavLink to="/login">Sign in</NavLink>
        </div>
      </form>
    </div>
  )
}
