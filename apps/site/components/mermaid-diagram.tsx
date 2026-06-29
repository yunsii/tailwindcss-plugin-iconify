'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

import type { PointerEvent } from 'react'

interface MermaidDiagramProps {
  chart: string
}

interface Point {
  x: number
  y: number
}

type MermaidMode = 'dark' | 'light'

let renderQueue = Promise.resolve()

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100))
}

function getMermaidMode(): MermaidMode {
  if (typeof document === 'undefined') {
    return 'light'
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function getMermaidThemeVariables(mode: MermaidMode) {
  if (mode === 'dark') {
    return {
      background: 'transparent',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      primaryColor: '#10322f',
      primaryTextColor: '#d9fff7',
      primaryBorderColor: '#5eead4',
      lineColor: '#5eead4',
      secondaryColor: '#132f3a',
      secondaryTextColor: '#d9fff7',
      secondaryBorderColor: '#38bdf8',
      tertiaryColor: '#17212a',
      tertiaryTextColor: '#d9fff7',
      noteBkgColor: '#16332e',
      noteTextColor: '#d9fff7',
      noteBorderColor: '#5eead4',
      clusterBkg: '#101f25',
      clusterBorder: '#2dd4bf',
      edgeLabelBackground: '#0b171b',
    }
  }

  return {
    background: 'transparent',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    primaryColor: '#ecfdf5',
    primaryTextColor: '#0f2926',
    primaryBorderColor: '#0f766e',
    lineColor: '#0f766e',
    secondaryColor: '#f0fdfa',
    secondaryTextColor: '#0f2926',
    secondaryBorderColor: '#0ea5e9',
    tertiaryColor: '#f8fafc',
    tertiaryTextColor: '#0f2926',
    noteBkgColor: '#f0fdfa',
    noteTextColor: '#0f2926',
    noteBorderColor: '#0f766e',
    clusterBkg: '#f8fafc',
    clusterBorder: '#0f766e',
    edgeLabelBackground: '#ffffff',
  }
}

async function renderMermaid(id: string, chart: string, mode: MermaidMode) {
  const mermaid = (await import('mermaid')).default

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: getMermaidThemeVariables(mode),
  })

  return mermaid.render(id, chart)
}

function enqueueRender(id: string, chart: string, mode: MermaidMode) {
  const result = renderQueue.then(() => renderMermaid(id, chart, mode))
  renderQueue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replaceAll(':', '')
  const lastPointRef = useRef<Point | undefined>(undefined)
  const [svg, setSvg] = useState<string>()
  const [error, setError] = useState<string>()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [mode, setMode] = useState<MermaidMode>(() => getMermaidMode())

  useEffect(() => {
    setMode(getMermaidMode())

    const observer = new MutationObserver(() => {
      setMode(getMermaidMode())
    })

    observer.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setSvg(undefined)

    void enqueueRender(`mermaid-${id}-${mode}`, chart, mode).then(
      ({ svg }) => {
        if (!cancelled) {
          setSvg(svg)
          setError(undefined)
        }
      },
      (cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to render diagram.')
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [chart, id, mode])

  useEffect(() => {
    if (!isExpanded) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    document.body.classList.add('mermaid-preview-open')
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('mermaid-preview-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const zoomBy = useCallback((delta: number) => {
    setZoom((current) => clampZoom(current + delta))
  }, [])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!svg || event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    lastPointRef.current = { x: event.clientX, y: event.clientY }
    setIsDragging(true)
  }, [svg])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const lastPoint = lastPointRef.current

    if (!isDragging || !lastPoint) {
      return
    }

    event.preventDefault()
    const nextPoint = { x: event.clientX, y: event.clientY }
    const deltaX = nextPoint.x - lastPoint.x
    const deltaY = nextPoint.y - lastPoint.y

    lastPointRef.current = nextPoint
    setPan((current) => ({
      x: current.x + deltaX,
      y: current.y + deltaY,
    }))
  }, [isDragging])

  const endDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    lastPointRef.current = undefined
    setIsDragging(false)
  }, [])

  const diagramContent = (
    <>
      <div className='mermaid-toolbar' aria-label='Diagram controls'>
        <button
          aria-label='Zoom out'
          className='mermaid-action'
          disabled={zoom <= MIN_ZOOM}
          title='Zoom out'
          type='button'
          onClick={() => zoomBy(-0.2)}
        >
          <span aria-hidden='true' className='icon-[mdi-light--minus]' />
        </button>
        <button
          aria-label='Reset view'
          className='mermaid-action mermaid-action-wide'
          title='Reset view'
          type='button'
          onClick={resetView}
        >
          {Math.round(zoom * 100)}
          %
        </button>
        <button
          aria-label='Zoom in'
          className='mermaid-action'
          disabled={zoom >= MAX_ZOOM}
          title='Zoom in'
          type='button'
          onClick={() => zoomBy(0.2)}
        >
          <span aria-hidden='true' className='icon-[mdi-light--plus]' />
        </button>
        <button
          aria-label={isExpanded ? 'Close full screen preview' : 'Open full screen preview'}
          className='mermaid-action'
          title={isExpanded ? 'Close full screen preview' : 'Open full screen preview'}
          type='button'
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded
            ? <span aria-hidden='true' className='icon-[mdi-light--fullscreen-exit]' />
            : <span aria-hidden='true' className='icon-[mdi-light--fullscreen]' />}
        </button>
      </div>
      <div
        className='mermaid-viewport'
        data-dragging={isDragging}
        onDragStart={(event) => event.preventDefault()}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
      >
        <div
          className='mermaid-canvas'
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          dangerouslySetInnerHTML={{ __html: svg ?? '' }}
        />
      </div>
    </>
  )

  return (
    <figure className='mermaid-diagram'>
      {svg
        ? (
            <>
              {!isExpanded ? diagramContent : null}
              {isExpanded
                ? (
                    <div
                      aria-label='Diagram full screen preview'
                      aria-modal='true'
                      className='mermaid-preview'
                      role='dialog'
                    >
                      {diagramContent}
                    </div>
                  )
                : null}
            </>
          )
        : (
            <pre aria-hidden={!error} className='mermaid-source'>
              <code>{error ? chart : ''}</code>
            </pre>
          )}
    </figure>
  )
}
