'use client';

type ToastType = 'success' | 'error' | 'info';

export function toast(message: string, type: ToastType = 'info') {
  const colors = {
    success: 'background: #16a34a; color: white;',
    error: 'background: #ef4444; color: white;',
    info: 'background: #6366f1; color: white;',
  };

  const el = document.createElement('div');
  el.textContent = message;
  el.setAttribute(
    'style',
    `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    z-index: 99999;
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ${colors[type]}
  `
  );

  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => {
      if (el.parentNode) document.body.removeChild(el);
    }, 300);
  }, 2000);
}
