/**
 * Google Analytics (GA4) — loaded on every page from this single file so the
 * real Measurement ID only has to be set in ONE place once it's available.
 * Until GA_MEASUREMENT_ID below is replaced with a real "G-XXXXXXXXXX" id,
 * this file does nothing (no bogus/placeholder hits are ever sent).
 */
(function(){
  var GA_MEASUREMENT_ID = 'G-BRM101DP7C';
  if(!GA_MEASUREMENT_ID) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
})();
