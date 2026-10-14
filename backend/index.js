import express from "express";
import 'dotenv/config'
import listRoutes from './routes/list.route.js'
import { connectDB } from './config/db.js'
import cors from 'cors'

const port = process.env.PORT

const app = express()

app.use(cors())

app.use(express.json())

app.use('/api/lists', listRoutes)


connectDB().then(()=>{
    app.listen(port, ()=>{
        console.log(`server runs on ${port}`)
    })
})