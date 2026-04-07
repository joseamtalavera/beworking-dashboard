import { useEffect, useState } from 'react';

const DOMAINS = ['tuempresa.com', 'mistudio.es', 'mimarca.eu', 'freelance.co'];

export default function WebsiteAdBanner({ onViewPlans }) {
  const [domainIdx, setDomainIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setDomainIdx((i) => (i + 1) % DOMAINS.length);
        setVisible(true);
      }, 280);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a5c30 0%, #288846 55%, #2ea84f 100%)',
        borderRadius: '18px',
        padding: '32px',
        display: 'flex',
        alignItems: 'stretch',
        minHeight: '320px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(40,136,70,0.28)',
      }}
    >
      <div style={{ position: 'absolute', top: -60, right: 250, width: 200, height: 200, borderRadius: '50%', background: 'rgba(244,198,86,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, left: 200, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      {/* Left: copy */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2, paddingRight: '20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F4C656', borderRadius: '20px', padding: '3px 12px', width: 'fit-content', marginBottom: '12px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a5c30' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#1a5c30', letterSpacing: '0.1em', textTransform: 'uppercase' }}>PRO</span>
        </div>

        <h3 style={{ color: '#fff', fontSize: '19px', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
          Tu presencia online,<br />en todos los dispositivos
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '12.5px', margin: '0 0 14px', lineHeight: 1.5 }}>
          Web corporativa responsiva incluida<br />en tu plan Pro de be-working.
        </p>

        {/* Animated domain pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', height: '30px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '165px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4C656', flexShrink: 0 }} />
            <span
              style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'monospace',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 0.28s ease, transform 0.28s ease',
                display: 'block',
              }}
            >
              {DOMAINS[domainIdx]}
            </span>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {['Diseño responsivo', 'Dominio propio', 'SSL incluido'].map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.78)', fontSize: '12px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#F4C656" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            style={{ background: '#F4C656', color: '#1a5c30', border: 'none', borderRadius: '9px', padding: '10px 22px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(244,198,86,0.45)', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(244,198,86,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(244,198,86,0.45)'; }}
            onClick={() => onViewPlans?.()}
          >
            Ver planes →
          </button>
          <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px' }}>desde 25€/mes</span>
        </div>
      </div>

      {/* Right: Apple-style device mockups */}
      <div style={{ flex: '0 0 420px', position: 'relative', height: '300px', zIndex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>

        {/* MacBook mockup */}
        <div style={{ position: 'absolute', left: 0, top: 0, animation: 'bwFloat1 4s ease-in-out infinite', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.35))' }}>
          {/* Screen bezel */}
          <div style={{ width: 320, background: '#e2e2e2', borderRadius: '12px 12px 0 0', padding: '8px 8px 0 8px' }}>
            {/* Camera dot */}
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#555', margin: '0 auto 6px' }} />
            {/* Screen */}
            <div style={{ width: '100%', height: 195, borderRadius: '2px', overflow: 'hidden', background: '#0f172a' }}>
              <img src="/assets/promo/web-desktop.png" alt="Web corporativa" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
          </div>
          {/* Hinge */}
          <div style={{ width: 340, height: 8, background: 'linear-gradient(180deg, #d4d4d4 0%, #b0b0b0 100%)', borderRadius: '0 0 2px 2px', marginLeft: -10 }} />
          {/* Base */}
          <div style={{ width: 380, height: 5, background: 'linear-gradient(180deg, #c0c0c0 0%, #a8a8a8 100%)', borderRadius: '0 0 8px 8px', marginLeft: -30 }} />
        </div>

        {/* iPhone mockup */}
        <div style={{ position: 'absolute', right: 10, bottom: 0, animation: 'bwFloat3 3.5s ease-in-out infinite', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}>
          {/* Phone body */}
          <div style={{ width: 82, height: 168, borderRadius: '18px', background: '#1a1a1a', padding: '10px 4px 10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Dynamic island */}
            <div style={{ width: 28, height: 8, borderRadius: '4px', background: '#000', marginBottom: 4 }} />
            {/* Screen */}
            <div style={{ width: '100%', flex: 1, borderRadius: '10px', overflow: 'hidden', background: '#0f172a' }}>
              <img src="/assets/promo/web-mobile.png" alt="Web móvil" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            {/* Home indicator */}
            <div style={{ width: 32, height: 4, borderRadius: '2px', background: '#333', marginTop: 4 }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bwFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bwFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @media (max-width: 900px) {
          .bw-devices { display: none !important; }
        }
      `}</style>
    </div>
  );
}
