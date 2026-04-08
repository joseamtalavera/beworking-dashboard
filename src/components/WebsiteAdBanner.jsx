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
      background: '#071810',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '28px 20px' : '56px 48px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: isMobile ? '24px' : '0',
      minHeight: isMobile ? undefined : '380px',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: -100, right: -40, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(40,136,70,0.42) 0%, transparent 65%)', pointerEvents: 'none', animation: 'bwOrb1 10s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: -80, right: 260, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,198,86,0.13) 0%, transparent 70%)', pointerEvents: 'none', animation: 'bwOrb2 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 44px,rgba(255,255,255,0.008) 44px,rgba(255,255,255,0.008) 45px),repeating-linear-gradient(90deg,transparent,transparent 44px,rgba(255,255,255,0.008) 44px,rgba(255,255,255,0.008) 45px)', pointerEvents: 'none' }} />

      {/* Left: copy */}
      <div style={{ flex: 1, zIndex: 2, paddingRight: isMobile ? '0' : '28px', minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1px solid rgba(244,198,86,0.32)', borderRadius: '20px', padding: '5px 16px', marginBottom: '20px', animation: 'bwFadeUp 0.6s ease both' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4C656', animation: 'bwPulse 2.2s ease-in-out infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#F4C656', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nuevo · Plan Pro</span>
        </div>

        <div style={{ animation: 'bwFadeUp 0.6s 0.1s ease both', opacity: 0, marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '9px' }}>Tu web profesional</div>
          <div style={{ fontSize: isMobile ? '28px' : '46px', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-2px', color: '#fff' }}>
            Domina internet.<br />
            <span style={{ background: 'linear-gradient(90deg,#52c97a,#F4C656,#52c97a)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'bwShine 3s linear infinite' }}>
              Desde hoy.
            </span>
          </div>
        </div>

        <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'rgba(255,255,255,0.48)', margin: '0 0 20px', lineHeight: 1.65, fontWeight: 400, maxWidth: '400px', animation: 'bwFadeUp 0.6s 0.2s ease both', opacity: 0 }}>
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
                <path d="M2 6l3 3 5-5" stroke="#F4C656" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Domain pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px', animation: 'bwFadeUp 0.6s 0.28s ease both', opacity: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '165px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4C656', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-6px)', transition: 'opacity 0.28s ease, transform 0.28s ease' }}>
              {DOMAINS[domainIdx]}
            </span>
          </div>
        </div>

        {/* CTA + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', animation: 'bwFadeUp 0.6s 0.3s ease both', opacity: 0 }}>
          <button
            style={{ background: '#fff', color: '#071810', border: 'none', borderRadius: '100px', padding: '14px 30px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', transition: 'background 0.18s, transform 0.18s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F4C656'; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => onViewPlans?.()}
          >
            Activar ahora →
          </button>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>Sin permanencia</span>
        </div>

        <div style={{ display: 'flex', gap: '28px', animation: 'bwFadeUp 0.6s 0.36s ease both', opacity: 0 }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>350+</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>negocios activos</div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>4.9★</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>valoración media</div>
          </div>
        </div>
      </div>

      {/* Right: devices with real screenshots — hidden on mobile */}
      {!isMobile && (
        <div style={{ flex: 1, minWidth: 0, position: 'relative', alignSelf: 'stretch', zIndex: 2 }}>
          {/* iMac — back left, largest */}
          <div style={{ position: 'absolute', left: 0, top: -20, animation: 'bwFloat1 6s ease-in-out infinite', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.7)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
            <div style={{ background: '#2a2a2a', borderRadius: '10px 10px 0 0', padding: '4px', width: 340, border: '1px solid #3d3d3d' }}>
              <div style={{ width: '100%', height: 210, borderRadius: '6px', overflow: 'hidden' }}>
                <img src="/assets/promo/web-desktop.png?v=3" alt="BeWorking desktop" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', display: 'block' }} />
              </div>
            </div>
            {/* chin */}
            <div style={{ width: '100%', height: 20, background: '#3a3a3a', borderTop: '1px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#555', border: '2px solid #3a3a3a' }} />
            </div>
            {/* stand */}
            <div style={{ width: 36, height: 32, background: 'linear-gradient(180deg, #404040, #383838)', margin: '0 auto', clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }} />
            <div style={{ width: 100, height: 6, background: '#424242', borderRadius: '0 0 4px 4px', margin: '-2px auto 0', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
          </div>

          {/* MacBook — mid right, overlapping */}
          <div style={{ position: 'absolute', right: -20, top: 100, animation: 'bwFloat2 7s ease-in-out infinite', filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.65)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
            <div style={{ background: '#2a2a2a', borderRadius: '8px 8px 0 0', padding: '4px 4px 0', width: 280, border: '1px solid #3a3a3a', borderBottom: 'none' }}>
              {/* notch */}
              <div style={{ width: 24, height: 4, borderRadius: '0 0 4px 4px', background: '#1e1e1e', margin: '-4px auto 3px' }} />
              <div style={{ width: '100%', height: 165, borderRadius: '4px', overflow: 'hidden' }}>
                <img src="/assets/promo/web-desktop.png?v=3" alt="BeWorking laptop" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', display: 'block' }} />
              </div>
            </div>
            {/* base */}
            <div style={{ width: 296, height: 8, background: 'linear-gradient(180deg, #484848, #363636)', borderRadius: '0 0 2px 2px', marginLeft: -8 }} />
            <div style={{ width: 314, height: 5, background: '#2e2e2e', borderRadius: '0 0 4px 4px', marginLeft: -17 }} />
          </div>

          {/* iPhone — front right */}
          <div style={{ position: 'absolute', right: 10, bottom: -30, animation: 'bwFloat3 5s ease-in-out infinite', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.75)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
            <div style={{ width: 86, background: '#3a3a3a', borderRadius: '18px', padding: '4px', border: '1px solid #4a4a4a' }}>
              <div style={{ background: '#1a1a1a', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                {/* Dynamic Island */}
                <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 28, height: 8, borderRadius: '4px', background: '#0a0a0a', zIndex: 1 }} />
                <div style={{ width: '100%', height: 170, overflow: 'hidden' }}>
                  <img src="/assets/promo/web-mobile.png?v=3" alt="BeWorking móvil" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                </div>
                {/* home indicator */}
                <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1f10' }}>
                  <div style={{ width: 24, height: 4, borderRadius: '2px', background: 'rgba(255,255,255,0.25)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bwOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-12px) scale(1.08)} 66%{transform:translate(-10px,16px) scale(0.95)} }
        @keyframes bwOrb2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-16px,10px)} 66%{transform:translate(12px,-14px)} }
        @keyframes bwFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bwPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bwShine { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes bwFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bwFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bwFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  );
}
