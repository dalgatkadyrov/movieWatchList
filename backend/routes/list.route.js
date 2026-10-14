import express from 'express'
import List from '../models/list.model.js';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype.startsWith('image/')) return callback(null, true)
        callback(new Error('Only image files are allowed'))
    }
})

router.get('/', async (req, res) => {
    try {
        const lists = await List.find()
        res.json(lists)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (error) {
            return res.status(400).json({ message: error.message })
        }
        next()
    })
}, async (req, res) => {
    try {
        const { name, pageStatus } = req.body
        if (!name?.trim() || !pageStatus) {
            return res.status(400).json({ message: 'Name and page status are required' })
        }

        let imageUrl = ''
        let imagePublicId = ''

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                )
                stream.end(req.file.buffer)
            })
            imageUrl = result.secure_url
            imagePublicId = result.public_id
        }

        let list
        try {
            list = await List.create({ name: name.trim(), pageStatus, image: imageUrl, imagePublicId })
        } catch (error) {
            if (imagePublicId) await cloudinary.uploader.destroy(imagePublicId)
            throw error
        }

        res.status(201).json(list)
    } catch (error) {
        console.error('post reply error', error)
        res.status(500).json({ message: error.message })
    }
})

router.patch('/:id', async (req, res) => {
    const { id } = req.params

    try {
        const message = await List.findByIdAndUpdate(id,
            {
                pageStatus: req.body.pageStatus
            }
        )

        if (!message)
            return res.status(404).json({ error: 'No message found' })

        res.status(200).json(message)

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const list = await List.findById(req.params.id)

        if (!list) {
            return res.status(404).json({
                message: 'Card not found'
            })
        }

        if (list.imagePublicId) {
            await cloudinary.uploader.destroy(list.imagePublicId)
        }

        await List.findByIdAndDelete(req.params.id)

        res.status(200).json({
            message: 'Card and image delete'
        })
    } catch (error) {
        console.error('Delete error:', error)

        res.status(500).json({
            message: error.message
        })
    }
})

export default router
