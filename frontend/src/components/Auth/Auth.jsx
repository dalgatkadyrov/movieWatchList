import React, { useState } from 'react'
import './Auth.css'
import { API_BASE } from '../../api'

function Auth({ onAuthSuccess }) {
  const [regState, setRegState] = useState('login')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const form = e.currentTarget
    const name = form.elements.name?.value.trim()
    const email = form.elements.email.value.trim()
    const password = form.elements.password.value
    const confirmPass = form.elements.confirmPass?.value
    const isRegister = regState === 'register'

    if (isRegister && password !== confirmPass) {
      setError('Passwords do not match')
      return
    }

    if (isRegister && !name) {
      setError('Enter your name')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/${regState}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(isRegister ? { name } : {}), email, password }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Authentication failed')

      onAuthSuccess(result.user)
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the server')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='auth-auth'>
      {regState === 'register' ? (
        <section className='formHold-auth'>
          <form onSubmit={handleSubmit} className='form-auth'>
            <label>Name
              <input type='text' name='name' autoComplete='name' maxLength={60} required />
            </label>
            <label>Email
              <input type='email' name='email' autoComplete='email' required />
            </label>
            <label>Password
              <input type='password' name='password' autoComplete='new-password' minLength={8} required />
            </label>
            <label>Confirm password
              <input type='password' name='confirmPass' autoComplete='new-password' minLength={8} required />
            </label>
            {error && <p role='alert'>{error}</p>}
            <button type='submit' disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Sign Up'}</button>
            <button type='button' onClick={() => { setError(''); setRegState('login') }}>Back</button>
          </form>
        </section>
      ) : (
        <section className='formHold-auth'>
          <form onSubmit={handleSubmit} className='form-auth'>
            <label>Email
              <input type='email' name='email' autoComplete='email' required />
            </label>
            <label>Password
              <input type='password' name='password' autoComplete='current-password' required />
            </label>
            {error && <p role='alert'>{error}</p>}
            <button type='submit' disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</button>
            <button type='button' onClick={() => { setError(''); setRegState('register') }}>Register</button>
          </form>
        </section>
      )}
    </div>
  )
}

export default Auth
