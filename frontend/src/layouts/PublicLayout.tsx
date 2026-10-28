import { ArrowUpRight, Menu, Sprout, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const closeMenu = () => setIsMenuOpen(false)
  const anchor = (hash: string) => (isHome ? hash : `/${hash}`)

  return (
    <div className="app-shell quiet-app-shell">
      <header className="site-header">
        <Link className="brand quiet-brand" to="/" aria-label="AI Sprint home">
          <span className="brand-mark" aria-hidden="true">
            <Sprout size={16} strokeWidth={2.5} />
          </span>
          <span>AI Sprint <small>/ QUIET BUILD CLUB</small></span>
        </Link>
        <div className="header-label">A FREE LIVE WORKSHOP</div>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <div className={`header-navigation ${isMenuOpen ? 'is-open' : ''}`}>
          <nav id="primary-navigation" className="primary-navigation" aria-label="Primary navigation">
            <Link to={anchor('#features')} onClick={closeMenu}>Features</Link>
            <Link to={anchor('#workshop')} onClick={closeMenu}>Workshop</Link>
            <Link to={anchor('#faq')} onClick={closeMenu}>FAQ</Link>
          </nav>
          <Link className="header-admin-link" to="/dashboard" onClick={closeMenu}>
            Admin Dashboard
          </Link>
          <Link className="header-cta" to="/register" onClick={closeMenu}>
            Register free <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true"><Sprout size={15} /></span>
          <span>AI Sprint</span>
        </div>
        <span>Make a little space for your first practical step in AI.</span>
        <nav className="footer-navigation" aria-label="Footer navigation">
          <Link to={anchor('#features')}>Features</Link>
          <Link to={anchor('#faq')}>FAQ</Link>
          <Link to="/register">Register</Link>
        </nav>
      </footer>
    </div>
  )
}

