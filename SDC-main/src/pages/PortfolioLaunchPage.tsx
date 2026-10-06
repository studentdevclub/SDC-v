import { useState } from 'react'

export function PortfolioLaunchPage() {
  const [registered, setRegistered] = useState(false)

  return (
    <div style={{ width: '100%', maxWidth: 780, margin: '0 auto' }}>
      <div className="section-header">
        <div className="section-tag">Flagship Hands-On Workshop</div>
        <h1 className="section-title">Portfolio Launch</h1>
        <p className="section-desc">
          Build, customize, and deploy your developer portfolio live to Cloudflare Pages edge networks in one afternoon.
        </p>
      </div>

      <div
        style={{
          background: 'rgba(10,10,16,0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          marginBottom: 40,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--card-border)', paddingBottom: 24, marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              📅 Wednesday, Sept 24, 2026 · 4:00 PM – 7:30 PM
            </span>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              📍 Computer Systems Lab 402 & Live Stream
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => setRegistered(!registered)}
            style={{
              background: registered ? 'rgba(61,220,132,0.15)' : 'var(--accent)',
              color: registered ? 'var(--green)' : '#050508',
              border: registered ? '1px solid var(--green)' : 'none',
              padding: '10px 24px',
            }}
          >
            {registered ? '✓ You Are Registered' : 'Reserve Free Seat →'}
          </button>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          What You Will Build & Deploy
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15, marginBottom: 24 }}>
          This workshop is designed to turn your code into a live, globally edge-hosted portfolio that stands out to recruiters. You'll write performant markup, style with custom CSS animations, connect an edge contact form, and configure automatic CI/CD git deployments on Cloudflare Pages.
        </p>

        <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--accent)', marginBottom: 14 }}>
          Session Schedule (3.5 Hours)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {[
            { time: '4:00 PM', title: 'Environment Setup & Git Scaffolding', desc: 'Node runtime, VS Code extensions, and GitHub repository template.' },
            { time: '4:30 PM', title: 'Frontend Architecture & Dynamic Themes', desc: 'Semantic layout, responsive grid systems, and dark mode tokens.' },
            { time: '5:30 PM', title: 'Edge Functions & Contact API', desc: 'Writing a lightweight Cloudflare Worker backend for contact messages.' },
            { time: '6:15 PM', title: 'Production Deployment & Custom Domains', desc: 'Configuring DNS, instant global SSL, and preview branch builds.' },
            { time: '7:00 PM', title: 'Live Showcase & 100-Pt Judging', desc: 'Peer review, feedback from tech leads, and certificate distribution.' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 16,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px solid var(--card-border)',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, minWidth: 68 }}>{item.time}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--accent)', marginBottom: 14 }}>
          Judging Rubric (100 Points Total)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { criteria: 'Code Quality', pts: '25 pts', desc: 'Clean, structured TS/CSS' },
            { criteria: 'UI / UX Polish', pts: '20 pts', desc: 'Responsive & accessible' },
            { criteria: 'Functionality', pts: '25 pts', desc: 'Working edge backend' },
            { criteria: 'Live Deployment', pts: '20 pts', desc: 'Global SSL edge URL' },
            { criteria: 'Creativity', pts: '10 pts', desc: 'Unique theme & features' },
          ].map((r, i) => (
            <div key={i} style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{r.pts}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{r.criteria}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: 20 }}>
          <a href="#/events" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }}>
            ← Back to All Events
          </a>
          <a href="#/auth" className="btn-primary" style={{ padding: '8px 22px', fontSize: 13 }}>
            Sign In to Claim Certificate
          </a>
        </div>
      </div>
    </div>
  )
}
