import { useState, useEffect } from 'react';

function MonitorSVG() {
  return (
    <svg viewBox="0 0 200 140" width="216">
      <rect x="2" y="2" width="196" height="118" rx="8" fill="#111827" stroke="#1f2937" strokeWidth="1.5"/>
      <rect x="6" y="6" width="188" height="110" rx="5" fill="#0d1117"/>
      <rect x="6" y="6" width="188" height="24" rx="5" fill="#288846"/>
      <rect x="12" y="12" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.9)"/>
      <rect x="12" y="20" width="32" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
      <rect x="148" y="12" width="38" height="9" rx="4" fill="#F4C656"/>
      <rect x="12" y="36" width="80" height="48" rx="4" fill="#1a2e1a"/>
      <rect x="16" y="41" width="45" height="5" rx="2.5" fill="rgba(82,201,122,0.7)"/>
      <rect x="16" y="50" width="60" height="3.5" rx="1.5" fill="rgba(255,255,255,0.25)"/>
      <rect x="16" y="57" width="40" height="3.5" rx="1.5" fill="rgba(255,255,255,0.18)"/>
      <rect x="16" y="66" width="32" height="10" rx="4" fill="#288846"/>
      <rect x="98" y="36" width="46" height="22" rx="4" fill="#1a2e1a"/>
      <rect x="102" y="40" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
      <rect x="102" y="46" width="16" height="5" rx="2" fill="#F4C656" opacity="0.7"/>
      <rect x="148" y="36" width="42" height="22" rx="4" fill="#1a2e1a"/>
      <rect x="152" y="40" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
      <rect x="152" y="46" width="14" height="5" rx="2" fill="rgba(82,201,122,0.6)"/>
      <rect x="98" y="62" width="92" height="22" rx="4" fill="#1a2e1a"/>
      <rect x="102" y="67" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="102" y="73" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.12)"/>
      <rect x="88" y="118" width="24" height="10" rx="0" fill="#0d1117"/>
      <rect x="72" y="126" width="56" height="8" rx="3" fill="#1f2937"/>
    </svg>
  );
}

function LaptopSVG() {
  return (
    <svg viewBox="0 0 160 115" width="168">
      <rect x="2" y="2" width="156" height="90" rx="6" fill="#111827" stroke="#1f2937" strokeWidth="1.5"/>
      <rect x="6" y="6" width="148" height="82" rx="4" fill="#0d1117"/>
      <rect x="6" y="6" width="148" height="20" rx="4" fill="#288846"/>
      <rect x="11" y="11" width="38" height="4" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="11" y="18" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
      <rect x="115" y="11" width="32" height="8" rx="3" fill="#F4C656"/>
      <rect x="11" y="32" width="55" height="38" rx="3" fill="#1a2e1a"/>
      <rect x="15" y="36" width="35" height="4" rx="2" fill="rgba(82,201,122,0.7)"/>
      <rect x="15" y="44" width="44" height="3" rx="1.5" fill="rgba(255,255,255,0.22)"/>
      <rect x="15" y="50" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="15" y="57" width="26" height="9" rx="4" fill="#288846"/>
      <rect x="71" y="32" width="77" height="38" rx="3" fill="#1a2e1a"/>
      <rect x="75" y="36" width="44" height="16" rx="2" fill="rgba(40,136,70,0.4)"/>
      <rect x="75" y="56" width="32" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="75" y="62" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.12)"/>
      <rect x="2" y="92" width="156" height="15" rx="4" fill="#0f172a"/>
      <rect x="60" y="96" width="40" height="7" rx="3" fill="#1f2937"/>
      <rect x="0" y="105" width="160" height="10" rx="3" fill="#1f2937"/>
    </svg>
  );
}

function MobileSVG() {
  return (
    <svg viewBox="0 0 58 106" width="60">
      <rect x="1" y="1" width="56" height="104" rx="10" fill="#111827" stroke="#1f2937" strokeWidth="1.5"/>
      <rect x="4" y="10" width="50" height="86" rx="3" fill="#0d1117"/>
      <rect x="22" y="3.5" width="14" height="4" rx="2" fill="#1f2937"/>
      <rect x="4" y="10" width="50" height="22" rx="3" fill="#288846"/>
      <rect x="8" y="15" width="28" height="4" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="8" y="22" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
      <rect x="38" y="15" width="13" height="8" rx="3" fill="#F4C656"/>
      <rect x="8" y="38" width="42" height="22" rx="3" fill="#1a2e1a"/>
      <rect x="11" y="42" width="26" height="4" rx="2" fill="rgba(82,201,122,0.65)"/>
      <rect x="11" y="49" width="34" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="11" y="55" width="20" height="8" rx="3" fill="#288846"/>
      <rect x="8" y="66" width="20" height="18" rx="3" fill="#1a2e1a"/>
      <rect x="11" y="70" width="14" height="8" rx="2" fill="rgba(244,198,86,0.25)"/>
      <rect x="32" y="66" width="18" height="18" rx="3" fill="#1a2e1a"/>
      <rect x="35" y="70" width="12" height="8" rx="2" fill="rgba(40,136,70,0.4)"/>
      <rect x="8" y="90" width="42" height="3" rx="1.5" fill="#1a2e1a"/>
      <rect x="22" y="97" width="14" height="5" rx="2.5" fill="#1f2937"/>
    </svg>
  );
}

export default function WebsiteAdBanner({ onViewPlans }) {
  const [domainIdx, setDomainIdx] = useState(0);
  const [visible, setVisible] = useState(true);
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
      borderRadius: '24px',
      padding: '48px 44px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '380px',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: -80, right: -30, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(40,136,70,0.5) 0%, transparent 70%)', pointerEvents: 'none', animation: 'bwOrb1 9s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: -100, right: 220, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,198,86,0.16) 0%, transparent 70%)', pointerEvents: 'none', animation: 'bwOrb2 11s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.011) 40px,rgba(255,255,255,0.011) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.011) 40px,rgba(255,255,255,0.011) 41px)', pointerEvents: 'none' }} />

      {/* Left: copy */}
      <div style={{ flex: 1, zIndex: 2, paddingRight: '24px', minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1px solid rgba(244,198,86,0.35)', borderRadius: '20px', padding: '5px 16px', marginBottom: '22px', animation: 'bwFadeUp 0.6s ease both' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4C656', animation: 'bwPulse 2.2s ease-in-out infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#F4C656', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Nuevo · Plan Pro</span>
        </div>

        <div style={{ animation: 'bwFadeUp 0.6s 0.1s ease both', opacity: 0, marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Tu web profesional</div>
          <div style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-2px', color: '#fff' }}>
            Domina internet.<br />
            <span style={{ background: 'linear-gradient(90deg,#52c97a,#F4C656,#52c97a)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'bwShine 3s linear infinite' }}>
              Desde hoy.
            </span>
          </div>
        </div>

        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', margin: '16px 0 14px', lineHeight: 1.65, fontWeight: 400, maxWidth: '400px', animation: 'bwFadeUp 0.6s 0.2s ease both', opacity: 0 }}>
          Tu negocio online con diseño profesional.<br />Responsiva, optimizada y lista para captar clientes.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: '20px', maxWidth: '420px', animation: 'bwFadeUp 0.6s 0.25s ease both', opacity: 0 }}>
          {[
            ['4 páginas', 'Hero, servicios, about, contacto'],
            ['Hosting incluido', 'Sin costes adicionales'],
            ['Certificado SSL', 'HTTPS seguro'],
            ['Diseño responsivo', 'Optimizado para móvil'],
            ['1 revisión/mes', 'Cambios de texto e imagen'],
            ['Analytics', 'Google Analytics integrado'],
          ].map(([title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                <path d="M2 6l3 3 5-5" stroke="#F4C656" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Domain pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', animation: 'bwFadeUp 0.6s 0.25s ease both', opacity: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '165px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4C656', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-6px)', transition: 'opacity 0.28s ease, transform 0.28s ease' }}>
              {DOMAINS[domainIdx]}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', animation: 'bwFadeUp 0.6s 0.3s ease both', opacity: 0 }}>
          <button
            style={{ background: '#fff', color: '#0a1f10', border: 'none', borderRadius: '100px', padding: '13px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s, transform 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F4C656'; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => onViewPlans?.()}
          >
            Activar ahora →
          </button>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Sin permanencia</span>
        </div>
      </div>

      {/* Right: devices with real screenshots */}
      <div style={{ width: '380px', flexShrink: 0, position: 'relative', height: '340px', zIndex: 2 }}>

        {/* Laptop / Desktop */}
        <div style={{ position: 'absolute', left: 0, top: 10, animation: 'bwFloat1 5s ease-in-out infinite', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.5)) drop-shadow(0 0 1px rgba(255,255,255,0.15))' }}>
          <div style={{ background: '#e8e8e8', borderRadius: '8px 8px 0 0', padding: '6px 6px 0', width: 280 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 5, paddingLeft: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <div style={{ width: '100%', height: 170, borderRadius: '2px', overflow: 'hidden' }}>
              <img src="/assets/promo/web-desktop.png" alt="Web corporativa desktop" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', display: 'block', imageRendering: 'auto' }} />
            </div>
          </div>
          <div style={{ width: 300, height: 8, background: 'linear-gradient(180deg, #d0d0d0 0%, #bbb 100%)', borderRadius: '0 0 2px 2px', marginLeft: -10 }} />
          <div style={{ width: 330, height: 4, background: '#aaa', borderRadius: '0 0 6px 6px', marginLeft: -25 }} />
        </div>

        {/* Phone */}
        <div style={{ position: 'absolute', right: 10, bottom: 0, animation: 'bwFloat3 4s ease-in-out infinite', filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.5)) drop-shadow(0 0 1px rgba(255,255,255,0.15))' }}>
          <div style={{ width: 90, background: '#e0e0e0', borderRadius: '16px', padding: '8px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 30, height: 6, borderRadius: '3px', background: '#bbb', marginBottom: 4 }} />
            <div style={{ width: '100%', height: 160, borderRadius: '8px', overflow: 'hidden' }}>
              <img src="/assets/promo/web-mobile.png" alt="Web corporativa móvil" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', imageRendering: 'auto' }} />
            </div>
            <div style={{ width: 30, height: 4, borderRadius: '2px', background: '#bbb', marginTop: 4 }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bwOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-12px) scale(1.08)} 66%{transform:translate(-10px,16px) scale(0.95)} }
        @keyframes bwOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-20px,10px) scale(0.92)} 66%{transform:translate(14px,-18px) scale(1.1)} }
        @keyframes bwFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bwPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes bwShine { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes bwFloat1 { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-8px) rotate(-4deg)} }
        @keyframes bwFloat2 { 0%,100%{transform:translateY(0) rotate(3deg)} 50%{transform:translateY(-6px) rotate(3deg)} }
        @keyframes bwFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  );
}
