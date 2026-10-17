import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import Nav from './components/Nav/Nav'
import Add from './components/Add/Add'
import Auth from './components/Auth/Auth'
import { API_BASE } from './api'
const completed = 'https://res.cloudinary.com/goaevwsc/image/upload/v1792023899/completed.png'
const dropped = 'https://res.cloudinary.com/goaevwsc/image/upload/v1792023899/dropped.png'
const watchlist = 'https://res.cloudinary.com/goaevwsc/image/upload/v1792023899/watchlist.png'
const wishlist = 'https://res.cloudinary.com/goaevwsc/image/upload/v1792023899/wishlist.png'
const cancel = 'https://res.cloudinary.com/goaevwsc/image/upload/v1792023899/cancel.png'

const url = `${API_BASE}/api/lists`
const authUrl = `${API_BASE}/api/auth`

function App() {
  const [info, setInfo] = useState([])
  const [panel, setPanel] = useState(false)
  const [pageStatus, setPageStatus] = useState('completed')
  const [isNav, setIsNav] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)


  const getData = useCallback(async () => {
    try {
      const response = await fetch(url, { credentials: 'include' })

      if (!response.ok) { throw new Error(`Request failed (${response.status})`) }
      const result = await response.json()

      setInfo(result)



    } catch (error) {
      console.error(error.message)
    }


  }, [])

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        const response = await fetch(`${authUrl}/me`, { credentials: 'include' })
        if (!response.ok) return
        const result = await response.json()
        if (!active) return
        setCurrentUser(result.user)
        setAuthed(true)
        await getData()
      } catch (error) {
        console.error('Could not restore session:', error.message)
      } finally {
        if (active) setAuthLoading(false)
      }
    }

    restoreSession()
    return () => { active = false }
  }, [getData])

  const handleAuthSuccess = async (user) => {
    setCurrentUser(user)
    setAuthed(true)
    await getData()
  }

  const handleUserUpdated = (user) => setCurrentUser(user)

  const handleLogout = async () => {
    try {
      const response = await fetch(`${authUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Could not log out')
      setInfo([])
      setCurrentUser(null)
      setAuthed(false)
    } catch (error) {
      console.error(error)
    }
  }

  const currentlyWatching = () => {
    return info.filter(i => i.pageStatus === pageStatus)
  }

  const handleDeleted = async (item) => {
    if (!window.confirm(`Delete «${item.name}»?`)) return

    try {
      const response = await fetch(url + '/' + item._id, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Could not delete card')
      }
      setInfo(current => current.filter(card => card._id !== item._id))
    } catch (error) {
      console.error(error)
    }

  }

  const cardTransfer = async (item, status) => {

    try {
      const response = await fetch(url + '/' + item._id, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageStatus: status
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Could not update card')
      }
      setInfo(current => current.map(card => card._id === item._id ? { ...card, pageStatus: status } : card))

    } catch (error) {
      console.log(error)
    }

  }


  return (
    authLoading ? <div className='auth-loading'>Loading…</div> : authed ? (<div className='app'>
      <Nav setPageStatus={setPageStatus} setIsNav={setIsNav} isNav={isNav} onLogout={handleLogout} user={currentUser} onUserUpdated={handleUserUpdated} />
      {panel && <Add completed={completed} dropped={dropped} wishlist={wishlist} watchlist={watchlist} setPanel={setPanel} setInfo={setInfo} info={info} />}

      <section className='contentHolder-app'>
        <header className='header-app'>
          <button onClick={() => setIsNav(true)} className='burger-nav'>☰</button>
          <h1>{pageStatus.charAt(0).toUpperCase() + pageStatus.slice(1)}</h1>
          <button onClick={() => setPanel(true)}>+</button>
        </header>

        <main className="main-app">
          {info.map((item) => (
            pageStatus === item.pageStatus &&
            <div className='card-app' key={item._id}>
              {item.image && <img src={item.image} alt={`${item.name} poster`} />}
              <button onClick={() => handleDeleted(item)}><img src={cancel} alt="" /></button>
              <div className='cardAction-app'>
                <h2>{item.name}</h2>
                <button onClick={() => cardTransfer(item, 'completed')}><img src={completed} alt="" /></button>
                <button onClick={() => cardTransfer(item, 'watching')}><img src={watchlist} alt="" /></button>
                <button onClick={() => cardTransfer(item, 'wishlist')}><img src={wishlist} alt="" /></button>
                <button onClick={() => cardTransfer(item, 'dropped')}><img src={dropped} alt="" /></button>
              </div>
            </div>

          ))}
        </main>

      </section>

      <footer className='app-footer'>
        <h3>{`Currently ${pageStatus}: ${currentlyWatching().length}`}</h3>
      </footer>
    </div >) : (<Auth onAuthSuccess={handleAuthSuccess} />)

  )
}

export default App
