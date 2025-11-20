import React, { useState } from 'react'
import axios from 'axios'
import { NavLink } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/forget-password`, { email })
      setResult({ success: true, message: data?.message || 'Reset link sent to your email' })
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <h2>Forgot Password</h2>
      </header>
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="form-actions">
          <button className="btn primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send reset link'}</button>
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
