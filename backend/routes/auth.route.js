import express from 'express'
import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import requireAuth from '../middleware/requireAuth.js'

const router = express.Router()

const publicUser = (user) => ({
  id: user._id,
  name: user.name || user.email.split('@')[0],
  email: user.email,
})

const startUserSession = (req, userId) => new Promise((resolve, reject) => {
  req.session.regenerate((regenerateError) => {
    if (regenerateError) return reject(regenerateError)

    req.session.userId = userId.toString()
    req.session.save((saveError) => {
      if (saveError) return reject(saveError)
      resolve()
    })
  })
})

router.post('/register', async (req, res) => {
  try {
    const name = req.body.name?.trim()
    const email = req.body.email?.trim().toLowerCase()
    const password = req.body.password

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (name.length > 60) {
      return res.status(400).json({ message: 'Name must be 60 characters or fewer' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, password: hashedPassword })

    // Sign the new user in immediately after registration.
    await startUserSession(req, user._id)

    return res.status(201).json({
      message: 'Account created',
      user: publicUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This email is already registered' })
    }

    console.error('Registration error:', error)
    return res.status(500).json({ message: 'Could not register account' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const password = req.body.password

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password' })
    }

    await startUserSession(req, user._id)

    return res.json({
      message: 'Login successful',
      user: publicUser(user),
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Could not log in' })
  }
})

router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not logged in' })
    }

    const user = await User.findById(req.session.userId).select('_id name email')
    if (!user) {
      req.session.destroy(() => {})
      return res.status(401).json({ message: 'User no longer exists' })
    }

    return res.json({ user: publicUser(user) })
  } catch (error) {
    console.error('Session lookup error:', error)
    return res.status(500).json({ message: 'Could not check session' })
  }
})

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    if (!name || name.length > 60) {
      return res.status(400).json({ message: 'Name must be between 1 and 60 characters' })
    }

    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { name },
      { new: true, runValidators: true },
    ).select('_id name email')
    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.json({ user: publicUser(user) })
  } catch (error) {
    console.error('Profile update error:', error)
    return res.status(500).json({ message: 'Could not update profile' })
  }
})

router.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: 'Could not log out' })
    }

    res.clearCookie('connect.sid', { path: '/' })
    return res.json({ message: 'Logged out' })
  })
})

export default router
