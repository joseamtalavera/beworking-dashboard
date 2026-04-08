import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

function IMaxSVG() {
  return (
    <svg viewBox="0 0 230 190" width="215">
      <rect x="1" y="1" width="228" height="155" rx="10" fill="#2a2a2a" stroke="#3d3d3d" strokeWidth="0.8"/>
      <rect x="5" y="5" width="220" height="142" rx="7" fill="#1a1a1a"/>
      <rect x="7" y="7" width="216" height="138" rx="5" fill="#0d1f10"/>
      {/* navbar */}
      <rect x="7" y="7" width="216" height="18" rx="5" fill="#1d7a3a"/>
      <rect x="12" y="11" width="32" height="4" rx="2" fill="rgba(255,255,255,0.9)"/>
      <circle cx="40" cy="13" r="2" fill="#F4C656"/>
      <rect x="52" y="12" width="18" height="2.5" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="74" y="12" width="18" height="2.5" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="96" y="12" width="22" height="2.5" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="186" y="10" width="30" height="6" rx="3" fill="#F4C656"/>
      {/* hero */}
      <rect x="55" y="32" width="106" height="6" rx="3" fill="rgba(255,255,255,0.8)"/>
      <rect x="68" y="41" width="80" height="6" rx="3" fill="rgba(255,255,255,0.8)"/>
      <rect x="45" y="51" width="48" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
      <rect x="97" y="51" width="12" height="3" rx="1.5" fill="#52c97a"/>
      <rect x="113" y="51" width="46" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
      {/* filter tabs */}
      <rect x="14" y="62" width="60" height="7" rx="3.5" fill="#288846" opacity="0.8"/>
      <rect x="78" y="62" width="45" height="7" rx="3.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <rect x="127" y="62" width="45" height="7" rx="3.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      {/* card grid row 1 */}
      <rect x="14" y="75" width="46" height="35" rx="3" fill="#1a3020"/>
      <rect x="14" y="75" width="46" height="18" rx="3" fill="#2d5a38" opacity="0.7"/>
      <rect x="16" y="96" width="22" height="3" rx="1" fill="rgba(255,255,255,0.45)"/>
      <rect x="64" y="75" width="46" height="35" rx="3" fill="#1a3020"/>
      <rect x="64" y="75" width="46" height="18" rx="3" fill="#3a6b45" opacity="0.6"/>
      <rect x="66" y="96" width="22" height="3" rx="1" fill="rgba(255,255,255,0.45)"/>
      <rect x="114" y="75" width="46" height="35" rx="3" fill="#1a3020"/>
      <rect x="114" y="75" width="46" height="18" rx="3" fill="#2a5035" opacity="0.7"/>
      <rect x="116" y="96" width="22" height="3" rx="1" fill="rgba(255,255,255,0.45)"/>
      <rect x="164" y="75" width="45" height="35" rx="3" fill="#1a3020"/>
      <rect x="164" y="75" width="45" height="18" rx="3" fill="#355e41" opacity="0.65"/>
      <rect x="166" y="96" width="22" height="3" rx="1" fill="rgba(255,255,255,0.45)"/>
      {/* card grid row 2 */}
      <rect x="14" y="114" width="46" height="28" rx="3" fill="#162a1c"/>
      <rect x="14" y="114" width="46" height="14" rx="3" fill="#244a2e" opacity="0.7"/>
      <rect x="64" y="114" width="46" height="28" rx="3" fill="#162a1c"/>
      <rect x="64" y="114" width="46" height="14" rx="3" fill="#2e5638" opacity="0.6"/>
      <rect x="114" y="114" width="46" height="28" rx="3" fill="#162a1c"/>
      <rect x="114" y="114" width="46" height="14" rx="3" fill="#223d2b" opacity="0.7"/>
      <rect x="164" y="114" width="45" height="28" rx="3" fill="#162a1c"/>
      <rect x="164" y="114" width="45" height="14" rx="3" fill="#294f33" opacity="0.65"/>
      {/* iMac chin */}
      <rect x="1" y="155" width="228" height="22" rx="0" fill="#3a3a3a"/>
      <rect x="1" y="155" width="228" height="1" fill="#555"/>
      <circle cx="114" cy="166" r="4" fill="#555"/>
      <circle cx="114" cy="166" r="2.5" fill="#3a3a3a"/>
      {/* stand */}
      <rect x="100" y="177" width="30" height="5" rx="2" fill="#404040"/>
      <ellipse cx="115" cy="185" rx="38" ry="5" fill="#383838"/>
      <ellipse cx="115" cy="184" rx="36" ry="3" fill="#424242"/>
    </svg>
  );
}

function MacBookSVG() {
  return (
    <svg viewBox="0 0 200 130" width="185">
      {/* lid */}
      <rect x="1" y="1" width="198" height="116" rx="8" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="0.8"/>
      <rect x="5" y="4" width="190" height="109" rx="5" fill="#141414"/>
      <rect x="7" y="6" width="186" height="105" rx="4" fill="#0d1f10"/>
      {/* camera notch */}
      <rect x="88" y="4" width="24" height="4" rx="2" fill="#1e1e1e"/>
      {/* navbar */}
      <rect x="7" y="6" width="186" height="16" rx="4" fill="#1d7a3a"/>
      <rect x="11" y="10" width="26" height="3.5" rx="1.5" fill="rgba(255,255,255,0.9)"/>
      <circle cx="35" cy="11.5" r="1.5" fill="#F4C656"/>
      <rect x="44" y="10.5" width="15" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
      <rect x="63" y="10.5" width="15" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
      <rect x="155" y="9" width="28" height="6" rx="3" fill="#F4C656"/>
      {/* hero */}
      <rect x="48" y="28" width="104" height="5" rx="2.5" fill="rgba(255,255,255,0.75)"/>
      <rect x="58" y="36" width="84" height="5" rx="2.5" fill="rgba(255,255,255,0.75)"/>
      <rect x="62" y="44" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.28)"/>
      <rect x="101" y="44" width="10" height="3" rx="1.5" fill="#52c97a"/>
      <rect x="115" y="44" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.28)"/>
      {/* filter tabs */}
      <rect x="11" y="54" width="42" height="6" rx="3" fill="#288846" opacity="0.85"/>
      <rect x="57" y="54" width="36" height="6" rx="3" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
      <rect x="97" y="54" width="36" height="6" rx="3" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
      {/* cards */}
      <rect x="11" y="65" width="40" height="30" rx="3" fill="#162a1c"/>
      <rect x="11" y="65" width="40" height="15" rx="3" fill="#2d5a38" opacity="0.7"/>
      <rect x="13" y="83" width="20" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="55" y="65" width="40" height="30" rx="3" fill="#162a1c"/>
      <rect x="55" y="65" width="40" height="15" rx="3" fill="#3a6245" opacity="0.65"/>
      <rect x="57" y="83" width="20" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="99" y="65" width="40" height="30" rx="3" fill="#162a1c"/>
      <rect x="99" y="65" width="40" height="15" rx="3" fill="#254f32" opacity="0.7"/>
      <rect x="101" y="83" width="20" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="143" y="65" width="50" height="30" rx="3" fill="#162a1c"/>
      <rect x="143" y="65" width="50" height="15" rx="3" fill="#2e5a3b" opacity="0.65"/>
      <rect x="145" y="83" width="20" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      {/* MacBook base */}
      <rect x="0" y="117" width="200" height="10" rx="3" fill="#363636"/>
      <rect x="0" y="117" width="200" height="1.5" fill="#484848"/>
      <rect x="74" y="120" width="52" height="5" rx="2.5" fill="#3a3a3a" stroke="#444" strokeWidth="0.5"/>
      <rect x="0" y="124" width="200" height="6" rx="2" fill="#2e2e2e"/>
    </svg>
  );
}

function IPhoneSVG() {
  return (
    <svg viewBox="0 0 66 130" width="58">
      {/* titanium frame */}
      <rect x="1" y="1" width="64" height="128" rx="14" fill="#3a3a3a" stroke="#4a4a4a" strokeWidth="0.8"/>
      <rect x="3" y="3" width="60" height="124" rx="12" fill="#1a1a1a"/>
      <rect x="3.5" y="3.5" width="59" height="123" rx="12" fill="#0d1f10"/>
      {/* Dynamic Island */}
      <rect x="22" y="8" width="22" height="7" rx="3.5" fill="#0a0a0a"/>
      <circle cx="39" cy="11.5" r="1.5" fill="#1a1a1a"/>
      {/* side buttons */}
      <rect x="65" y="28" width="2" height="12" rx="1" fill="#4a4a4a"/>
      <rect x="-1" y="24" width="2" height="8" rx="1" fill="#4a4a4a"/>
      <rect x="-1" y="36" width="2" height="14" rx="1" fill="#4a4a4a"/>
      <rect x="-1" y="54" width="2" height="14" rx="1" fill="#4a4a4a"/>
      {/* navbar */}
      <rect x="3.5" y="18" width="59" height="16" rx="3" fill="#1d7a3a"/>
      <rect x="7" y="22" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.9)"/>
      <circle cx="25" cy="23.5" r="1.2" fill="#F4C656"/>
      <rect x="44" y="21.5" width="14" height="5" rx="2.5" fill="#F4C656"/>
      {/* hero */}
      <rect x="12" y="40" width="42" height="4" rx="2" fill="rgba(255,255,255,0.7)"/>
      <rect x="16" y="47" width="34" height="4" rx="2" fill="rgba(255,255,255,0.7)"/>
      <rect x="18" y="54" width="14" height="2.5" rx="1" fill="rgba(255,255,255,0.25)"/>
      <rect x="34" y="54" width="6" height="2.5" rx="1" fill="#52c97a"/>
      <rect x="42" y="54" width="8" height="2.5" rx="1" fill="rgba(255,255,255,0.25)"/>
      {/* tabs */}
      <rect x="5" y="61" width="26" height="5" rx="2.5" fill="#288846" opacity="0.85"/>
      <rect x="34" y="61" width="19" height="5" rx="2.5" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
      {/* cards 2x2 */}
      <rect x="5" y="71" width="26" height="22" rx="3" fill="#162a1c"/>
      <rect x="5" y="71" width="26" height="12" rx="3" fill="#2d5a38" opacity="0.7"/>
      <rect x="7" y="87" width="14" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="35" y="71" width="26" height="22" rx="3" fill="#162a1c"/>
      <rect x="35" y="71" width="26" height="12" rx="3" fill="#3a6245" opacity="0.65"/>
      <rect x="37" y="87" width="14" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="5" y="97" width="26" height="22" rx="3" fill="#162a1c"/>
      <rect x="5" y="97" width="26" height="12" rx="3" fill="#264e32" opacity="0.7"/>
      <rect x="7" y="113" width="14" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="35" y="97" width="26" height="22" rx="3" fill="#162a1c"/>
      <rect x="35" y="97" width="26" height="12" rx="3" fill="#2e5838" opacity="0.65"/>
      <rect x="37" y="113" width="14" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
      {/* home indicator */}
      <rect x="24" y="123" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
    </svg>
  );
}

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

      {/* Right: Apple SVG devices — hidden on mobile */}
      {!isMobile && (
        <div style={{ width: '380px', flexShrink: 0, position: 'relative', height: '380px', zIndex: 2 }}>
          {/* iMac — back left */}
          <div style={{ position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.7)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
            <IMaxSVG />
          </div>
          {/* MacBook Pro — mid right */}
          <div style={{ position: 'absolute', right: 0, top: 90, filter: 'drop-shadow(0 20px 44px rgba(0,0,0,0.65)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
            <MacBookSVG />
          </div>
          {/* iPhone 15 — front right */}
          <div style={{ position: 'absolute', right: 15, top: 210, filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.75)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
            <IPhoneSVG />
          </div>
        </div>
      )}

      <style>{`
        @keyframes bwOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-12px) scale(1.08)} 66%{transform:translate(-10px,16px) scale(0.95)} }
        @keyframes bwOrb2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-16px,10px)} 66%{transform:translate(12px,-14px)} }
        @keyframes bwFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bwPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bwShine { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>
    </div>
  );
}
