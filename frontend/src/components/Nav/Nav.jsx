import React from 'react'
import './Nav.css'



function Nav({ setPageStatus, setIsNav, isNav }) {
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
                    <h4>Work in process</h4>
                    <p>Sign Out</p>
                </div>
            </div>
        </div>
    )
}

export default Nav