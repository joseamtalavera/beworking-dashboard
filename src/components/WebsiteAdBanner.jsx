import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function WebsiteAdBanner({ onViewPlans }) {
  const [domainIdx, setDomainIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const isMobile = useMediaQuery('(max-width:900px)');
  const DOMAINS = ['tuempresa.com', 'mistudio.es', 'mimarca.eu', 'freelance.co'];

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
    <div style={{
      background: '#ffffff',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '28px 20px' : '56px 48px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: isMobile ? '24px' : '0',
      minHeight: isMobile ? undefined : '380px',
      border: '1px solid rgba(0,0,0,0.08)',
    }}>
      {/* Left: copy */}
      <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : '48%', zIndex: 2, paddingRight: isMobile ? '0' : '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1px solid rgba(0,150,36,0.25)', borderRadius: '20px', padding: '5px 16px', marginBottom: '20px', animation: 'bwFadeUp 0.6s ease both' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#009624', animation: 'bwPulse 2.2s ease-in-out infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#009624', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nuevo · Plan Pro</span>
        </div>

        <div style={{ animation: 'bwFadeUp 0.6s 0.1s ease both', opacity: 0, marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '9px' }}>Tu web profesional</div>
          <div style={{ fontSize: isMobile ? '28px' : '46px', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-2px', color: '#1a1a1a' }}>
            Domina internet.<br />
            <span style={{ color: '#009624' }}>Desde hoy.</span>
          </div>
        </div>

        <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'rgba(0,0,0,0.5)', margin: '0 0 20px', lineHeight: 1.65, fontWeight: 400, maxWidth: '400px', animation: 'bwFadeUp 0.6s 0.2s ease both', opacity: 0 }}>
          Web corporativa, dominio propio y SSL incluidos.<br />Visible en todos los dispositivos. Por 25€/mes.
        </p>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '8px' : '6px 20px', marginBottom: '18px', maxWidth: '420px', animation: 'bwFadeUp 0.6s 0.25s ease both', opacity: 0 }}>
          {[
            ['4 páginas', 'Hero, servicios, about, contacto'],
            ['Hosting incluido', 'Sin costes adicionales'],
            ['Certificado SSL', 'HTTPS seguro'],
            ['Diseño responsivo', 'Optimizado para móvil'],
            ['1 revisión/mes', 'Cambios de texto e imagen'],
            ['Analytics', 'Google Analytics integrado'],
          ].map(([title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                <path d="M2 6l3 3 5-5" stroke="#009624" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,0,0,0.8)', lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)', lineHeight: 1.3 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Domain pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px', animation: 'bwFadeUp 0.6s 0.28s ease both', opacity: 0 }}>
          <div style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '165px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#009624', flexShrink: 0 }} />
            <span style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-6px)', transition: 'opacity 0.28s ease, transform 0.28s ease' }}>
              {DOMAINS[domainIdx]}
            </span>
          </div>
        </div>

        {/* Stats + CTA row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', animation: 'bwFadeUp 0.6s 0.32s ease both', opacity: 0 }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px' }}>350+</div>
              <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>negocios activos</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'rgba(0,0,0,0.1)' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px' }}>4.9★</div>
              <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>valoración media</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#009624', lineHeight: 1, letterSpacing: '-1px' }}>25€</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(0,0,0,0.4)' }}>/mes</span>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'rgba(0,0,0,0.1)' }} />
          <button
            style={{ background: '#009624', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 30px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', transition: 'background 0.18s, transform 0.18s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#007a1d'; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#009624'; e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => onViewPlans?.()}
          >
            Activar ahora →
          </button>
          <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.3)' }}>Sin permanencia</span>
        </div>
      </div>

      {/* Right: device mockups image — hidden on mobile */}
      {!isMobile && (
        <div style={{ flex: 1, minWidth: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', alignSelf: 'stretch' }}>
          <img
            src="/laptopblanco.png"
            alt="BeWorking en iMac, MacBook y iPhone"
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </div>
      )}

      <style>{`
        @keyframes bwFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bwPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
