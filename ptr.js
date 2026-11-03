// اوپر سے نیچے کھینچ کر صفحہ تازہ کریں — صرف Android ایپ (WebView) یا انسٹال شدہ ویب ایپ میں،
// کیونکہ عام براؤزر میں یہ سہولت پہلے سے ہوتی ہے
(function(){
  try{
    var inApp = /; wv\)/.test(navigator.userAgent) || matchMedia('(display-mode: standalone)').matches;
    if(!inApp || !('ontouchstart' in window)) return;
  }catch(e){ return; }

  var THRESHOLD = 75, MAX = 110;
  var bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = 'position:fixed;top:0;left:50%;z-index:9999;width:44px;height:44px;margin-left:-22px;border-radius:50%;' +
    'background:#141b2c;border:1px solid rgba(201,167,105,0.4);box-shadow:0 2px 10px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;' +
    'font-size:22px;color:#e8c887;transform:translateY(-60px);opacity:0;pointer-events:none;';
  bar.textContent = '↻';
  var label = document.createElement('div');
  label.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9998;text-align:center;font-size:.8rem;color:#e8c887;' +
    'transform:translateY(-120px);opacity:0;pointer-events:none;font-family:inherit;background:rgba(13,18,32,.92);';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(bar); document.body.appendChild(label); });

  var startY = null, dist = 0, busy = false;

  function scrolledParent(el){
    for(; el && el !== document.body && el !== document.documentElement; el = el.parentElement){
      if(el.scrollTop > 0) return true;
      var t = el.tagName;
      if(t === 'TEXTAREA' || t === 'SELECT' || (t === 'INPUT' && el.type === 'range')) return true;
    }
    return false;
  }

  function show(d){
    var y = Math.min(d, MAX) - 50;
    bar.style.transition = label.style.transition = 'none';
    bar.style.opacity = label.style.opacity = Math.min(1, d / THRESHOLD);
    bar.style.transform = 'translateY(' + y + 'px) rotate(' + (d * 3) + 'deg)';
    label.style.transform = 'translateY(' + (y + 50) + 'px)';
    label.textContent = d >= THRESHOLD ? 'چھوڑیں — صفحہ تازہ ہوگا' : 'نیچے کھینچیں';
  }
  function hide(){
    dist = 0;
    bar.style.transition = label.style.transition = 'transform .2s, opacity .2s';
    bar.style.transform = 'translateY(-60px)'; label.style.transform = 'translateY(-120px)';
    bar.style.opacity = label.style.opacity = 0;
  }

  window.addEventListener('touchstart', function(e){
    if(busy || e.touches.length !== 1 || (window.scrollY || document.documentElement.scrollTop) > 0 || scrolledParent(e.target)){ startY = null; return; }
    startY = e.touches[0].clientY; dist = 0;
  }, {passive:true});

  window.addEventListener('touchmove', function(e){
    if(startY === null) return;
    if((window.scrollY || document.documentElement.scrollTop) > 0 || e.touches.length !== 1){ startY = null; hide(); return; }
    dist = (e.touches[0].clientY - startY) * 0.6;
    if(dist > 5) show(dist); else hide();
  }, {passive:true});

  // فون اشارے کو اسکرول سمجھ لے تو touchend کی جگہ touchcancel آتا ہے — نشان چھپا دیں
  window.addEventListener('touchcancel', function(){ startY = null; hide(); }, {passive:true});
  window.addEventListener('scroll', function(){ if(!busy && (window.scrollY || document.documentElement.scrollTop) > 0){ startY = null; hide(); } }, {passive:true});

  window.addEventListener('touchend', function(){
    if(startY === null) return;
    startY = null;
    if(dist >= THRESHOLD){
      busy = true;
      bar.style.transition = 'transform .2s';
      bar.style.transform = 'translateY(20px)';
      bar.animate && bar.animate([{transform:'translateY(20px) rotate(0deg)'}, {transform:'translateY(20px) rotate(360deg)'}], {duration:700, iterations:Infinity});
      label.textContent = 'تازہ ہو رہا ہے...';
      location.reload();
    } else hide();
  }, {passive:true});
})();
