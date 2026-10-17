import express from 'express'
import List from '../models/list.model.js'
import multer from 'multer'
import cloudinary from '../config/cloudinary.js'
import requireAuth from '../middleware/requireAuth.js'

const router = express.Router()
const validStatuses = ['completed', 'watching', 'wishlist', 'dropped']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith('image/')) return callback(null, true)
    callback(new Error('Only image files are allowed'))
  },
})

// All list operations require a session. Ownership is always taken from that session.
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const lists = await List.find({ user: req.session.userId })
    return res.json(lists)
  } catch (error) {
    console.error('List fetch error:', error)
    return res.status(500).json({ message: 'Could not load list' })
  }
})

router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message })
    next()
  })
}, async (req, res) => {
  let imagePublicId = ''

  try {
    const name = req.body.name?.trim()
    const { pageStatus } = req.body

    if (!name || !validStatuses.includes(pageStatus)) {
      return res.status(400).json({ message: 'A name and valid page status are required' })
    }

    let imageUrl = ''
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => error ? reject(error) : resolve(result),
        )
        stream.end(req.file.buffer)
      })
      imageUrl = uploadResult.secure_url
      imagePublicId = uploadResult.public_id
    }

    const list = await List.create({
      name,
      pageStatus,
      image: imageUrl,
      imagePublicId,
      user: req.session.userId,
    })

    return res.status(201).json(list)
  } catch (error) {
    if (imagePublicId) {
      try {
        await cloudinary.uploader.destroy(imagePublicId)
      } catch (cleanupError) {
        console.error('Cloudinary cleanup error:', cleanupError)
      }
    }

    console.error('List create error:', error)
    return res.status(500).json({ message: 'Could not create card' })
  }
})

router.patch('/:id', async (req, res) => {
  const { pageStatus } = req.body
  if (!validStatuses.includes(pageStatus)) {
    return res.status(400).json({ message: 'Invalid page status' })
  }

  try {
    const list = await List.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { pageStatus },
      { new: true, runValidators: true },
    )

    if (!list) return res.status(404).json({ message: 'Card not found' })
    return res.json(list)
  } catch (error) {
    console.error('List update error:', error)
    return res.status(400).json({ message: 'Could not update card' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const list = await List.findOneAndDelete({
      _id: req.params.id,
      user: req.session.userId,
    })

    if (!list) return res.status(404).json({ message: 'Card not found' })

    if (list.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(list.imagePublicId)
      } catch (error) {
        // The database record is already removed; report cleanup failure to server logs.
        console.error('Cloudinary image cleanup error:', error)
      }
    }

    return res.json({ message: 'Card deleted' })
  } catch (error) {
    console.error('List delete error:', error)
    return res.status(500).json({ message: 'Could not delete card' })
  }
})

export default router
