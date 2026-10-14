import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB)
        console.log('DB connection succesed ' + conn.connection.host)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}