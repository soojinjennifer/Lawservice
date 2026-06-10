// ui/Toast.js — 내편문서 공통 토스트 컴포넌트 (PRD v1.2)
// type: 'success' | 'info' | 'error'
// duration: 밀리초 (기본 2500ms), 0 = persistent
// usage: window.ToastManager.show({ type, message, duration })

// ── ToastManager: 전역 상태 관리 ─────────────────────────────
window.ToastManager = (() => {
  let _setToasts = null;

  return {
    _register(setter) { _setToasts = setter; },
    show({ type = "success", message, duration = 2500 }) {
      if (!_setToasts) return;
      const id = Date.now() + Math.random();
      _setToasts(prev => [...prev, { id, type, message }]);
      if (duration > 0) {
        setTimeout(() => {
          _setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }
    },
    dismiss(id) {
      if (_setToasts) _setToasts(prev => prev.filter(t => t.id !== id));
    },
  };
})();

// ── ToastContainer: 화면 우측 상단에 마운트 ──────────────────
window.ToastContainer = function ToastContainer() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    window.ToastManager._register(setToasts);
    return () => window.ToastManager._register(null);
  }, []);

  const iconMap = { success: "check", info: "shield", error: "dismiss" };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <Icon name={iconMap[t.type] || "check"} size={16} color="currentColor" filled />
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => window.ToastManager.dismiss(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.6 }}
            aria-label="닫기"
          >
            <Icon name="dismiss" size={14} color="currentColor" />
          </button>
        </div>
      ))}
    </div>
  );
};
