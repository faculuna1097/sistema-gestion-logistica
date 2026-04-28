// frontend/src/layout/AppLayout.tsx 

import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { theme } from '../theme'

const navItems = [
  { path: '/viajes',       label: 'Viajes',       icon: '🚛' },
  { path: '/informes',     label: 'Informes',     icon: '📄' },
  { path: '/facturas',     label: 'Facturas',     icon: '🧾' },
  { path: '/vencimientos', label: 'Vencimientos', icon: '📅' },
  { path: '/clientes',     label: 'Clientes',     icon: '🏢' },
  { path: '/fleteros',     label: 'Fleteros',     icon: '👤' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? theme.sidebar.widthCollapsed : theme.sidebar.width

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: theme.font.family }}>

      <aside style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        background: theme.colors.sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        borderRight: `1px solid ${theme.colors.sidebarBorder}`,
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Brand */}
        <div style={{
          padding: collapsed ? '24px 0 20px' : '24px 20px 20px',
          borderBottom: `1px solid ${theme.colors.sidebarBorder}`,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: theme.colors.sidebarAccent,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              🚛
            </div>
            {!collapsed && (
              <div>
                <div style={{
                  color: theme.colors.sidebarTextActive,
                  fontSize: theme.font.size.sm,
                  fontWeight: theme.font.weight.semibold,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}>
                  Logística Cigaina
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {!collapsed && (
            <div style={{
              fontSize: theme.font.size.xs,
              color: theme.colors.sidebarText,
              opacity: 0.5,
              fontWeight: theme.font.weight.semibold,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '8px 10px 6px',
            }}>
              Gestión
            </div>
          )}
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: '10px',
                  padding: collapsed ? '10px 0' : '9px 10px',
                  borderRadius: theme.radius.md,
                  marginBottom: '2px',
                  textDecoration: 'none',
                  color: isActive ? theme.colors.sidebarTextActive : theme.colors.sidebarText,
                  background: isActive ? theme.colors.sidebarAccent : 'transparent',
                  fontSize: theme.font.size.sm,
                  fontWeight: isActive ? theme.font.weight.medium : theme.font.weight.regular,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
                {!collapsed && isActive && (
                  <span style={{
                    marginLeft: 'auto',
                    width: '6px', height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.6)',
                    flexShrink: 0,
                  }} />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 20px',
          borderTop: `1px solid ${theme.colors.sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '10px',
        }}>
          {!collapsed && (
            <div style={{ fontSize: theme.font.size.xs, color: theme.colors.sidebarText, opacity: 0.4 }}>
              v1.0
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.sidebarBorder}`,
              color: theme.colors.sidebarText,
              borderRadius: theme.radius.sm,
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              padding: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = theme.colors.sidebarHover
              e.currentTarget.style.color = theme.colors.sidebarTextActive
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = theme.colors.sidebarText
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

      </aside>

      <main style={{
        marginLeft: sidebarWidth,
        flex: 1,
        background: theme.colors.pageBg,
        minHeight: '100vh',
        transition: 'margin-left 0.2s ease',
      }}>
        {children}
      </main>

    </div>
  )
}