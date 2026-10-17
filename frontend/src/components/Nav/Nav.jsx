import React, { useState } from 'react'
import './Nav.css'
import { API_BASE } from '../../api'


function Nav({ setPageStatus, setIsNav, isNav, onLogout, user, onUserUpdated }) {
    const [isEditingName, setIsEditingName] = useState(false)
    const [nameDraft, setNameDraft] = useState(user?.name || '')
    const [nameError, setNameError] = useState('')

    const saveName = async (event) => {
        event.preventDefault()
        setNameError('')

        try {
            const response = await fetch(`${API_BASE}/api/auth/profile`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameDraft }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || 'Could not update name')

            onUserUpdated(result.user)
            setIsEditingName(false)
        } catch (error) {
            setNameError(error.message)
        }
    }

    return (
        <div className={isNav ? 'navMobile' : 'nav'}>
            <button onClick={() => setIsNav(false) }>X</button>
            <div className='linksHolder-nav'>
                <button onClick={() => setPageStatus('completed')}>Completed</button>
                <button onClick={() => setPageStatus('watching')}>Watching</button>
                <button onClick={() => setPageStatus('wishlist')}>Wishlist</button>
                <button onClick={() => setPageStatus('dropped')}>Dropped</button>
            </div>

            <div className='userHolder-nav'>
                <div></div>
                <div>
                    {isEditingName ? (
                        <form className='nameEdit-nav' onSubmit={saveName}>
                            <input
                                aria-label='Profile name'
                                value={nameDraft}
                                onChange={(event) => setNameDraft(event.target.value)}
                                maxLength={60}
                                required
                                autoFocus
                            />
                            <button type='submit'>Save</button>
                            <button type='button' onClick={() => { setNameDraft(user?.name || ''); setIsEditingName(false); setNameError('') }}>Cancel</button>
                            {nameError && <small role='alert'>{nameError}</small>}
                        </form>
                    ) : (
                        <>
                            <h4>{user?.name || user?.email?.split('@')[0] || 'Profile'}</h4>
                            <button type='button' onClick={() => { setNameDraft(user?.name || ''); setIsEditingName(true) }}>Edit name</button>
                        </>
                    )}
                    <button type='button' onClick={onLogout}>Sign Out</button>
                </div>
            </div>
        </div>
    )
}

export default Nav
