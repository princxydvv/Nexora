'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, User, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/contexts/auth-context'

export default function Navbar() {
  const router = useRouter()
  const { user, userProfile, signOut, isAuthenticated, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = useMemo(() => {
    return userProfile?.full_name || user?.user_metadata?.full_name || user?.email || 'Account'
  }, [user, userProfile])

  const initials = useMemo(() => {
    const source = userProfile?.full_name || user?.user_metadata?.full_name || user?.email || 'N'
    return source
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user, userProfile])

  const handleSignOut = async () => {
    await signOut()
    setIsAccountOpen(false)
    router.push('/')
  }

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#showcase', label: 'Showcase' },
    { href: '#pricing', label: 'Pricing' },
  ]

  return (
    <>
      {/* Desktop & Tablet Navbar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'pt-4' : 'pt-4'
          }`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div
          className={`max-w-7xl mx-auto px-4 transition-all duration-300 ${isScrolled ? 'rounded-2xl mx-4' : 'rounded-full'
            }`}
          style={{
            background: isScrolled
              ? 'rgba(11, 11, 11, 0.8)'
              : 'rgba(11, 11, 11, 0.4)',
            backdropFilter: isScrolled ? 'blur(12px)' : 'blur(8px)',
            border: `1px solid ${isScrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: isScrolled
              ? '0 4px 30px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex items-center justify-between py-3 px-6">
            {/* Logo */}
            <Link
              href="/"
              className="font-display text-2xl font-semibold text-foreground tracking-tight hover:text-primary transition-colors"
            >
              Nexora
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {!isLoading && isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen((value) => !value)}
                    className="flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-3 py-2 text-left transition-colors hover:border-primary/60"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {initials}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-foreground leading-none">{displayName}</p>
                      <p className="text-xs text-muted-foreground leading-none mt-1">{userProfile?.subscription_plan || 'free'} plan</p>
                    </div>
                    <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
                  </button>

                  {isAccountOpen && (
                    <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                      <div className="px-3 py-3 border-b border-border/60">
                        <p className="text-sm font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                      </div>
                      <div className="py-2">
                        <button onClick={() => { router.push('/dashboard'); setIsAccountOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </button>
                        <button onClick={() => { router.push('/workspace'); setIsAccountOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <LayoutDashboard className="h-4 w-4" /> Workspace
                        </button>
                        <button onClick={() => { router.push('/profile'); setIsAccountOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <User className="h-4 w-4" /> Profile
                        </button>
                        <button onClick={() => { router.push('/settings'); setIsAccountOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <Settings className="h-4 w-4" /> Settings
                        </button>
                      </div>
                      <div className="border-t border-border/60 pt-2">
                        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="hidden sm:block px-4 py-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity hover:scale-105 transform"
                  >
                    Get Started
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 pt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background:
              'linear-gradient(180deg, rgba(5,5,5,0.95) 0%, rgba(11,11,11,0.9) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex flex-col gap-6 px-6 py-8">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                className="text-lg text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div
              className="pt-4 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: navLinks.length * 0.1 }}
            >
              {!isLoading && isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Signed in as {displayName}</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { router.push('/dashboard'); setIsOpen(false) }} className="rounded-xl border border-border px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors">Dashboard</button>
                    <button onClick={() => { router.push('/workspace'); setIsOpen(false) }} className="rounded-xl border border-border px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors">Workspace</button>
                    <button onClick={() => { router.push('/profile'); setIsOpen(false) }} className="rounded-xl border border-border px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors">Profile</button>
                    <button onClick={() => { router.push('/settings'); setIsOpen(false) }} className="rounded-xl border border-border px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors">Settings</button>
                    <button onClick={handleSignOut} className="rounded-xl border border-red-500/30 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors">Sign Out</button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="block text-lg text-muted-foreground hover:text-primary transition-colors mb-4"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  )
}
