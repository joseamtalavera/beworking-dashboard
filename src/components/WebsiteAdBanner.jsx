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
      background: '#0a1f10',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '28px 20px' : '48px 44px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: isMobile ? '24px' : '0',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: -80, right: -30, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(40,136,70,0.5) 0%, transparent 70%)', pointerEvents: 'none', animation: 'bwOrb1 9s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: -100, right: 220, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,198,86,0.16) 0%, transparent 70%)', pointerEvents: 'none', animation: 'bwOrb2 11s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.011) 40px,rgba(255,255,255,0.011) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.011) 40px,rgba(255,255,255,0.011) 41px)', pointerEvents: 'none' }} />

      {/* Left: copy */}
      <div style={{ flex: 1, zIndex: 2, paddingRight: isMobile ? '0' : '24px', minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1px solid rgba(244,198,86,0.35)', borderRadius: '20px', padding: '5px 16px', marginBottom: '18px', animation: 'bwFadeUp 0.6s ease both' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4C656', animation: 'bwPulse 2.2s ease-in-out infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#F4C656', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Nuevo · Plan Pro</span>
        </div>

        <div style={{ animation: 'bwFadeUp 0.6s 0.1s ease both', opacity: 0, marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Tu web profesional</div>
          <div style={{ fontSize: isMobile ? '28px' : '42px', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-1.5px', color: '#fff' }}>
            Domina internet.<br />
            <span style={{ background: 'linear-gradient(90deg,#52c97a,#F4C656,#52c97a)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'bwShine 3s linear infinite' }}>
              Desde hoy.
            </span>
          </div>
        </div>

        <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'rgba(255,255,255,0.55)', margin: '14px 0 16px', lineHeight: 1.65, fontWeight: 400, maxWidth: '400px', animation: 'bwFadeUp 0.6s 0.2s ease both', opacity: 0 }}>
          Tu negocio online con diseño profesional.<br />Responsiva, optimizada y lista para captar clientes.
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', animation: 'bwFadeUp 0.6s 0.28s ease both', opacity: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '165px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4C656', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-6px)', transition: 'opacity 0.28s ease, transform 0.28s ease' }}>
              {DOMAINS[domainIdx]}
            </span>
          </div>
        </div>

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', animation: 'bwFadeUp 0.6s 0.3s ease both', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: 800, color: '#F4C656', lineHeight: 1, letterSpacing: '-1px', textShadow: '0 0 30px rgba(244,198,86,0.4)' }}>25€</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(244,198,86,0.6)' }}>/mes</span>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.12)' }} />
          <div>
            <button
              style={{ background: '#F4C656', color: '#0a1f10', border: 'none', borderRadius: '100px', padding: '13px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(244,198,86,0.35)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(244,198,86,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F4C656'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(244,198,86,0.35)'; }}
              onClick={() => onViewPlans?.()}
            >
              Activar ahora →
            </button>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', textAlign: 'center' }}>Sin permanencia · IVA no incluido</div>
          </div>
        </div>
      </div>

      {/* Right: 3 devices — hidden on mobile */}
      {!isMobile && (
        <div style={{ width: '440px', flexShrink: 0, position: 'relative', height: '360px', zIndex: 2 }}>
          {/* iMac desktop — back, largest */}
          <div style={{ position: 'absolute', left: 0, top: 0, animation: 'bwFloat2 6s ease-in-out infinite', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.45)) drop-shadow(0 0 1px rgba(255,255,255,0.12))' }}>
            <div style={{ background: '#e0e0e0', borderRadius: '10px 10px 0 0', padding: '4px', width: 260 }}>
              <div style={{ width: '100%', height: 155, borderRadius: '6px', overflow: 'hidden' }}>
                <img src="/assets/promo/web-desktop.png?v=2" alt="Web corporativa desktop" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', display: 'block' }} />
              </div>
            </div>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(180deg, #c0c0c0, #aaa)', margin: '0 auto', clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }} />
            <div style={{ width: 120, height: 5, background: '#aaa', borderRadius: '0 0 3px 3px', margin: '0 auto' }} />
          </div>

          {/* MacBook laptop — middle layer */}
          <div style={{ position: 'absolute', right: 30, top: 60, animation: 'bwFloat1 5s ease-in-out infinite', filter: 'drop-shadow(0 18px 36px rgba(0,0,0,0.5)) drop-shadow(0 0 1px rgba(255,255,255,0.15))' }}>
            <div style={{ background: '#e8e8e8', borderRadius: '6px 6px 0 0', padding: '5px 5px 0', width: 200 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 4, paddingLeft: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#28c840' }} />
              </div>
              <div style={{ width: '100%', height: 120, borderRadius: '2px', overflow: 'hidden' }}>
                <img src="/assets/promo/web-desktop.png?v=2" alt="Web corporativa laptop" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', display: 'block' }} />
              </div>
            </div>
            <div style={{ width: 216, height: 6, background: 'linear-gradient(180deg, #d0d0d0 0%, #bbb 100%)', borderRadius: '0 0 2px 2px', marginLeft: -8 }} />
            <div style={{ width: 236, height: 3, background: '#aaa', borderRadius: '0 0 4px 4px', marginLeft: -18 }} />
          </div>

          {/* Phone — front right */}
          <div style={{ position: 'absolute', right: 0, bottom: 10, animation: 'bwFloat3 4s ease-in-out infinite', filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.5)) drop-shadow(0 0 1px rgba(255,255,255,0.15))' }}>
            <div style={{ width: 80, background: '#e0e0e0', borderRadius: '14px', padding: '7px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 26, height: 5, borderRadius: '3px', background: '#bbb', marginBottom: 3 }} />
              <div style={{ width: '100%', height: 140, borderRadius: '7px', overflow: 'hidden' }}>
                <img src="/assets/promo/web-mobile.png?v=2" alt="Web corporativa móvil" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
              </div>
              <div style={{ width: 26, height: 3, borderRadius: '2px', background: '#bbb', marginTop: 3 }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bwOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-12px) scale(1.08)} 66%{transform:translate(-10px,16px) scale(0.95)} }
        @keyframes bwOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-20px,10px) scale(0.92)} 66%{transform:translate(14px,-18px) scale(1.1)} }
        @keyframes bwFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bwPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes bwShine { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes bwFloat1 { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(-2deg)} }
        @keyframes bwFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bwFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  );
}
