import React, { useEffect, useState } from 'react'
import './Add.css'

function Add(props) {
  const url = `${import.meta.env.VITE_API_URL}/api/lists`
  // const url = 'http://localhost:3500/api/lists'
  const [imgHolder, setImgHolder] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [buttonStatus, setButtonStatus] = useState('watching')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => () => {
    if (imgHolder) URL.revokeObjectURL(imgHolder)
  }, [imgHolder])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const form = e.currentTarget
    const formData = new FormData()
    formData.append('name', form.elements.name.value.trim())
    formData.append('pageStatus', buttonStatus)
    if (imgFile) formData.append('image', imgFile)

    setIsSubmitting(true)
    try {
      const response = await fetch(url, { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Upload failed')

      props.setInfo(prev => [...prev, result])
      props.setPanel(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not add card. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      e.target.value = ''
      return
    }
    setError('')
    setImgHolder(URL.createObjectURL(file))
    setImgFile(file)
  }

  return (
    <div className='add-add'>
      <section className='addPanel-add'>
        <div className='leftPart-add'>
          {imgHolder ? <img src={imgHolder} alt="Selected poster preview" /> : <label htmlFor="imageInsert-add">
            <span>+</span>
            <input type="file" id="imageInsert-add" name="image" accept="image/*" onChange={handleImageChange} />
          </label>}
        </div>

        <form onSubmit={handleSubmit} className='rightPart-add'>
          <input type="text" placeholder="Name" name="name" required />
          {error && <p role="alert">{error}</p>}
          <div>
            <button onClick={() => setButtonStatus('watching')} className={buttonStatus === 'watching' ? 'checked' : ''} type="button"><img src={props.watchlist} alt="" /></button>
            <button onClick={() => setButtonStatus('completed')} className={buttonStatus === 'completed' ? 'checked' : ''} type="button"><img src={props.completed} alt="" /></button>
            <button onClick={() => setButtonStatus('wishlist')} className={buttonStatus === 'wishlist' ? 'checked' : ''} type="button"><img src={props.wishlist} alt="" /></button>
            <button onClick={() => setButtonStatus('dropped')} className={buttonStatus === 'dropped' ? 'checked' : ''} type="button"><img src={props.dropped} alt="" /></button>
          </div>
          <div>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading…' : 'Add'}</button>
            <button type="button" onClick={() => props.setPanel(false)}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default Add
