import express from "express";
import 'dotenv/config'
import listRoutes from './routes/list.route.js'
import { connectDB } from './config/db.js'
import cors from 'cors'
import authRoutes from './routes/auth.route.js'
import session from "express-session";
import MongoStore from 'connect-mongo'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const port = Number(process.env.PORT || 3500)
const isProduction = process.env.NODE_ENV === 'production'
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend/dist')

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set in backend/.env')
}

const app = express()

if (isProduction && process.env.TRUST_PROXY === 'true') {
    // Set this only when the hosting platform puts one trusted proxy in front of Node.
    app.set('trust proxy', 1)
}

if (!isProduction) {
    app.use(cors({
        origin: clientOrigin,
        credentials: true
    }))
}

app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB,
    }),

    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}))

app.get('/api/health', (_req, res) => {
    const databaseReady = mongoose.connection.readyState === 1
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'ok' : 'database unavailable',
    })
})

app.use('/api/lists', listRoutes)
app.use('/api/auth', authRoutes)

if (isProduction) {
    app.use(express.static(frontendDist))
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
        return res.sendFile(path.join(frontendDist, 'index.html'))
    })
}

connectDB().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`server runs on ${port}`)
    })
})
