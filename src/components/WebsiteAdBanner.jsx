export default function WebsiteAdBanner({ onViewPlans }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden',
      cursor: 'pointer',
    }} onClick={() => onViewPlans?.()}>
      <img
        src="/assets/promo/web-banner.png"
        alt="Plan Pro — Tu web profesional"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <button
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '48px',
          background: '#fff',
          color: '#071810',
          border: 'none',
          borderRadius: '100px',
          padding: '14px 30px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '-0.2px',
          transition: 'background 0.18s, transform 0.18s',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F4C656'; e.currentTarget.style.transform = 'scale(1.03)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
        onClick={(e) => { e.stopPropagation(); onViewPlans?.(); }}
      >
        Activar ahora →
      </button>
    </div>
  );
}
