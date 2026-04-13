import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { theme } from '../theme'

const navItems = [
  { path: '/viajes',   label: 'Viajes',   icon: '🚛' },
  { path: '/facturas', label: 'Facturas', icon: '🧾' },
  { path: '/clientes', label: 'Clientes', icon: '🏢' },
  { path: '/fleteros', label: 'Fleteros', icon: '👤' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: theme.font.family }}>

      <aside style={{
        width: theme.sidebar.width,
        minWidth: theme.sidebar.width,
        background: theme.colors.sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        borderRight: `1px solid ${theme.colors.sidebarBorder}`,
      }}>

        {/* Brand */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: `1px solid ${theme.colors.sidebarBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: theme.colors.sidebarAccent,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}>
              🚛
            </div>
            <div>
              <div style={{
                color: theme.colors.sidebarTextActive,
                fontSize: theme.font.size.sm,
                fontWeight: theme.font.weight.semibold,
                lineHeight: 1.2,
              }}>
                Logística Tute
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
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
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: theme.radius.md,
                  marginBottom: '2px',
                  textDecoration: 'none',
                  color: isActive ? theme.colors.sidebarTextActive : theme.colors.sidebarText,
                  background: isActive ? theme.colors.sidebarAccent : 'transparent',
                  fontSize: theme.font.size.sm,
                  fontWeight: isActive ? theme.font.weight.medium : theme.font.weight.regular,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span style={{
                    marginLeft: 'auto',
                    width: '6px', height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.6)',
                  }} />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${theme.colors.sidebarBorder}`,
        }}>
          <div style={{ fontSize: theme.font.size.xs, color: theme.colors.sidebarText, opacity: 0.4 }}>
            v1.0
          </div>
        </div>

      </aside>

      <main style={{
        marginLeft: theme.sidebar.width,
        flex: 1,
        background: theme.colors.pageBg,
        minHeight: '100vh',
      }}>
        {children}
      </main>

    </div>
  )
}