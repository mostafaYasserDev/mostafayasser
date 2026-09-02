'use strict';
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (shouldBeDark) {
      document.body.classList.add('dark-mode');
      setIsDark(true);
    } else {
      document.body.classList.remove('dark-mode');
      setIsDark(false);
    }
  }, []);

  // Handle Theme Toggle
  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
    // Dispatch custom event for any listening widgets/embeds
    document.dispatchEvent(
      new CustomEvent('jidhe:themechange', {
        detail: { theme: nextDark ? 'dark' : 'light' },
      })
    );
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(e.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/services', label: 'الخدمات' },
    { href: '/projects', label: 'المشاريع' },
    { href: '/articles', label: 'المقالات' },
    { href: '/contact', label: 'تواصل معي' },
  ];

  return (
    <header>
      <Link href="/" className="logo logo-link">
        <img
          src="/assets/logo.png"
          alt="جذع"
          width={48}
          height={48}
          loading="eager"
        />
        <div className="logo-text">
          جذع <span>.</span>
        </div>
      </Link>

      <div className="header-right">
        <nav
          id="main-nav"
          ref={navRef}
          className={`main-nav ${isMenuOpen ? 'open' : ''}`}
        >
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? 'active' : ''}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <button
            id="theme-toggle"
            className="btn"
            aria-label="تبديل الوضع الليلي"
            onClick={toggleTheme}
            type="button"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} />
          </button>

          <button
            id="menu-toggle"
            ref={menuBtnRef}
            className="menu-toggle"
            aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
