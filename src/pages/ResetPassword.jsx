import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (result) setResult(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setResult({ success: false, message: 'Invalid or missing reset token.' })
      return
    }
    if (!form.password || form.password.length < 6) {
      setResult({ success: false, message: 'Password must be at least 6 characters.' })
      return
    }
    if (form.password !== form.confirmPassword) {
      setResult({ success: false, message: 'Passwords do not match.' })
      return
    }

    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`, { password: form.password })
      setResult({ success: true, message: data?.message || 'Password reset successfully' })
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <h2>Reset Password</h2>
      </header>
      <form className="form" onSubmit={onSubmit}>
        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="password">New Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={onChange} placeholder="Create a password" required />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Confirm password" required />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn primary" disabled={submitting}>{submitting ? 'Resetting...' : 'Reset Password'}</button>
        </div>
        {result && (
          <div className={`alert ${result.success ? 'success' : 'error'}`}>
            <div>{result.message}</div>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <NavLink to="/login" className="nav-link">Back to Sign In</NavLink>
        </div>
      </form>
    </div>
  )
}
