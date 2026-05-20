(async function initNativeApp() {
  if (!window.Capacitor) { console.log('[HuntSmart] Web mode'); return; }
  console.log('[HuntSmart] Native mode:', window.Capacitor.getPlatform());
  document.body.classList.add('is-native');
  document.body.classList.add('platform-' + window.Capacitor.getPlatform());
  const { StatusBar, Style } = await import('@capacitor/status-bar').catch(() => ({}));
  const { SplashScreen } = await import('@capacitor/splash-screen').catch(() => ({}));
  const { App } = await import('@capacitor/app').catch(() => ({}));
  const { Network } = await import('@capacitor/network').catch(() => ({}));
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics').catch(() => ({}));
  if (StatusBar) {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1a2e1a' });
      if (window.Capacitor.getPlatform() === 'android') await StatusBar.setOverlaysWebView({ overlay: false });
    } catch(e) {}
  }
  if (SplashScreen) { setTimeout(async () => { try { await SplashScreen.hide({ fadeOutDuration: 500 }); } catch(e) {} }, 500); }
  if (App) {
    App.addListener('backButton', () => {
      const homePage = document.getElementById('homePage');
      if (homePage && homePage.style.display !== 'none') { App.exitApp(); }
      else if (typeof showPage === 'function') { showPage('home'); }
    });
  }
  if (Network) {
    const status = await Network.getStatus();
    if (!status.connected) showOfflineBanner();
    Network.addListener('networkStatusChange', s => s.connected ? hideOfflineBanner() : showOfflineBanner());
  }
  if (Haptics) {
    window.hapticTap = async () => { try { await Haptics.impact({ style: ImpactStyle.Light }); } catch(e) {} };
    document.addEventListener('click', e => { if (e.target.closest('button.chip,button.sort-btn,button.fp-cta,button.province-card')) window.hapticTap && window.hapticTap(); }, { passive: true });
  }
})();
function showOfflineBanner() {
  let b = document.getElementById('offlineBanner');
  if (!b) { b = document.createElement('div'); b.id='offlineBanner'; b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#b91c1c;color:#fff;text-align:center;padding:10px 16px;font-size:13px;font-weight:600;'; b.textContent='⚠️ No internet connection — some data may be unavailable'; document.body.appendChild(b); }
  b.style.display='block';
}
function hideOfflineBanner() { const b=document.getElementById('offlineBanner'); if(b) b.style.display='none'; }
