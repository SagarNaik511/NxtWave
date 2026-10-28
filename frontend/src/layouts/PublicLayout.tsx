import { ArrowUpRight, Menu, Sparkles, X } from 'lucide-react'
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
    <div className="app-shell sosc-app-shell">
      <header className="site-header">
        <Link className="brand sosc-brand" to="/" aria-label="AI Sprint home">
          <span className="brand-mark" aria-hidden="true"><Sparkles size={15} strokeWidth={2.2} /></span>
          <span>AI SPRINT<small>/ BUILD TOGETHER</small></span>
        </Link>
        <div className="header-label">PRACTICAL AI / COLLABORATION / BUILDING</div>
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
            <Link to={anchor('#about')} onClick={closeMenu}>01 HOME</Link>
            <Link to={anchor('#workshop')} onClick={closeMenu}>02 WORKSHOP</Link>
            <Link to={anchor('#build')} onClick={closeMenu}>03 BUILD</Link>
            <Link to={anchor('#faq')} onClick={closeMenu}>04 FAQ</Link>
          </nav>
          <Link className="header-admin-link" to="/dashboard" onClick={closeMenu}>
            OPS DASHBOARD
          </Link>
          <Link className="header-cta" to="/register" onClick={closeMenu}>
            START SPRINT <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-brand sosc-footer-brand">
          <span className="brand-mark" aria-hidden="true"><Sparkles size={14} /></span>
          <span>AI SPRINT.</span>
        </div>
        <span>Build your first practical step in AI.</span>
        <nav className="footer-navigation" aria-label="Footer navigation">
          <Link to={anchor('#about')}>About</Link>
          <Link to={anchor('#workshop')}>Workshop</Link>
          <Link to={anchor('#faq')}>FAQ</Link>
          <Link to="/register">Register</Link>
        </nav>
      </footer>
    </div>
  )
}

