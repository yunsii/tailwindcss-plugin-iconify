'use client'

import { useEffect } from 'react'

const SOLID_SCROLL_Y = 140
const LIGHT_THEME = {
  background: '248, 252, 251',
  border: '200, 224, 221',
}
const DARK_THEME = {
  background: '11, 23, 26',
  border: '72, 127, 121',
}

export function HomeNavState() {
  useEffect(() => {
    const nav = document.getElementById('nd-nav')
    if (!nav) {
      return
    }

    const navElement = nav
    let previousProgress = -1

    function updateProgress(force = false) {
      const isDark = document.documentElement.classList.contains('dark')
      const theme = isDark ? DARK_THEME : LIGHT_THEME
      const progress = Math.min(window.scrollY / SOLID_SCROLL_Y, 1)
      if (force || progress !== previousProgress) {
        previousProgress = progress
        navElement.style.backgroundColor = `rgba(${theme.background}, ${progress.toFixed(3)})`
        navElement.style.borderBottomColor = `rgba(${theme.border}, ${(progress * 0.82).toFixed(3)})`
        navElement.style.boxShadow = `0 8px 28px rgba(0, 0, 0, ${(progress * 0.05).toFixed(3)})`
      }
    }

    function onScroll() {
      updateProgress()
    }

    function updateFromEvent() {
      updateProgress()
    }

    updateProgress()
    const themeObserver = new MutationObserver(() => updateProgress(true))
    themeObserver.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true,
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateFromEvent)
    window.addEventListener('pageshow', updateFromEvent)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateFromEvent)
      window.removeEventListener('pageshow', updateFromEvent)
      themeObserver.disconnect()
      navElement.style.removeProperty('background-color')
      navElement.style.removeProperty('border-bottom-color')
      navElement.style.removeProperty('box-shadow')
    }
  }, [])

  return null
}
