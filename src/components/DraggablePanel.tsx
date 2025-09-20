import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface DraggablePanelProps {
  title: string;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  isCollapsible?: boolean;
  initiallyCollapsed?: boolean;
  zIndex?: number;
  storageKey?: string; // For persisting position/size
}

export function DraggablePanel({
  title,
  children,
  defaultPosition = { x: 20, y: 20 },
  defaultSize = { width: 320, height: 400 },
  isCollapsible = true,
  initiallyCollapsed = false,
  zIndex = 1000,
  storageKey
}: DraggablePanelProps) {
  // Load saved position/size from localStorage if storageKey provided
  const loadSavedState = () => {
    if (!storageKey) return { position: defaultPosition, size: defaultSize, collapsed: initiallyCollapsed };

    try {
      const saved = localStorage.getItem(`draggable-panel-${storageKey}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved panel state:', e);
    }

    return { position: defaultPosition, size: defaultSize, collapsed: initiallyCollapsed };
  };

  const savedState = loadSavedState();
  const [position, setPosition] = useState(savedState.position);
  const [size, setSize] = useState(savedState.size);
  const [isCollapsed, setIsCollapsed] = useState(savedState.collapsed);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const panelRef = useRef<HTMLDivElement>(null);

  // Save state to localStorage
  const saveState = (newPosition?: { x: number; y: number }, newSize?: { width: number; height: number }, newCollapsed?: boolean) => {
    if (!storageKey) return;

    try {
      const state = {
        position: newPosition || position,
        size: newSize || size,
        collapsed: newCollapsed !== undefined ? newCollapsed : isCollapsed
      };
      localStorage.setItem(`draggable-panel-${storageKey}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save panel state:', e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only drag if clicking on header or title
    if (target.classList.contains('panel-header') || target.classList.contains('panel-title')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    saveState(undefined, undefined, newCollapsed);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x)),
          y: Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragStart.y)) // Ensure title bar stays visible
        };
        setPosition(newPosition);
      } else if (isResizing) {
        const newSize = {
          width: Math.max(250, resizeStart.width + (e.clientX - resizeStart.x)),
          height: Math.max(200, resizeStart.height + (e.clientY - resizeStart.y))
        };
        setSize(newSize);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        saveState(position, undefined, undefined);
      }
      if (isResizing) {
        setIsResizing(false);
        saveState(undefined, size, undefined);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, dragStart, resizeStart, position, size]);

  return (
    <div
      ref={panelRef}
      className="floating-panel"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: isCollapsed ? 'auto' : size.height,
        zIndex,
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--shadow-lg)',
        userSelect: 'none',
        fontFamily: 'inherit'
      }}
    >
      <div
        className="panel-header"
        style={{
          padding: '0.75rem 1rem',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
          background: 'var(--background-color)',
          borderRadius: 'var(--border-radius) var(--border-radius) 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'var(--text-primary)'
        }}
        onMouseDown={handleMouseDown}
      >
        <span className="panel-title" style={{ pointerEvents: 'none' }}>
          {title}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isCollapsible && (
            <button
              onClick={toggleCollapse}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.25rem',
                color: 'var(--text-secondary)',
                borderRadius: '2px'
              }}
              onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking collapse
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div
            className="panel-content"
            style={{
              padding: '1rem',
              overflow: 'auto',
              height: size.height - 60, // Account for header height
              cursor: 'default'
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when interacting with content
          >
            {children}
          </div>

          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              cursor: 'se-resize',
              background: `
                linear-gradient(-45deg,
                  transparent 0%,
                  transparent 30%,
                  var(--border-color) 30%,
                  var(--border-color) 35%,
                  transparent 35%,
                  transparent 45%,
                  var(--border-color) 45%,
                  var(--border-color) 50%,
                  transparent 50%,
                  transparent 60%,
                  var(--border-color) 60%,
                  var(--border-color) 65%,
                  transparent 65%,
                  transparent 100%
                )
              `,
              opacity: 0.5
            }}
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}
    </div>
  );
}