// 🌐 زبان کا انتخاب — 99 زبانوں کی فہرست۔ یہ سائٹ اردو میں ہے؛ دوسری زبان چننے پر
// Google کا خودکار ترجمہ پورا صفحہ ترجمہ کرتا ہے۔ (نوٹ: یہ صرف Articles/About/Contact/
// Privacy/Terms/Disclaimer جیسے عام صفحات کے لیے ہے — مرکزی ایپ (کف بینی/Aura Camera)
// کا اپنا AI سے چلنے والا 99-زبان نظام ہے جو ہر reading اسی زبان میں براہِ راست بناتا ہے۔)
(function(){
  var languageList = [
    { code: 'ur', name: '🇵🇰 اردو (Urdu)' },
    { code: 'en', name: '🇬🇧 English' },
    { code: 'ar', name: '🇸🇦 العربية (Arabic)' },
    { code: 'ar-ae', name: '🇦🇪 العربية (الإمارات)' },
    { code: 'ar-sa', name: '🇸🇦 العربية (السعودية)' },
    { code: 'ar-bh', name: '🇧🇭 العربية (البحرين)' },
    { code: 'ar-qa', name: '🇶🇦 العربية (قطر)' },
    { code: 'ar-kw', name: '🇰🇼 العربية (الكويت)' },
    { code: 'fa', name: '🇮🇷 فارسی (Persian)' },
    { code: 'hi', name: '🇮🇳 हिन्दी (Hindi)' },
    { code: 'bn', name: '🇧🇩 বাংলা (Bengali)' },
    { code: 'pa', name: '🇮🇳 ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'ps', name: '🇦🇫 پښتو (Pashto)' },
    { code: 'fr', name: '🇫🇷 Français (French)' },
    { code: 'es', name: '🇪🇸 Español (Spanish)' },
    { code: 'pt', name: '🇵🇹 Português (Portuguese)' },
    { code: 'it', name: '🇮🇹 Italiano (Italian)' },
    { code: 'de', name: '🇩🇪 Deutsch (German)' },
    { code: 'nl', name: '🇳🇱 Nederlands (Dutch)' },
    { code: 'ru', name: '🇷🇺 Русский (Russian)' },
    { code: 'uk', name: '🇺🇦 Українська (Ukrainian)' },
    { code: 'pl', name: '🇵🇱 Polski (Polish)' },
    { code: 'el', name: '🇬🇷 Ελληνικά (Greek)' },
    { code: 'tr', name: '🇹🇷 Türkçe (Turkish)' },
    { code: 'id', name: '🇮🇩 Bahasa Indonesia' },
    { code: 'th', name: '🇹🇭 ไทย (Thai)' },
    { code: 'vi', name: '🇻🇳 Tiếng Việt (Vietnamese)' },
    { code: 'ja', name: '🇯🇵 日本語 (Japanese)' },
    { code: 'ko', name: '🇰🇷 한국어 (Korean)' },
    { code: 'zh', name: '🇨🇳 中文 (Chinese)' },
    { code: 'sw', name: '🇰🇪 Kiswahili (Swahili)' },
    { code: 'he', name: '🇮🇱 עברית (Hebrew)' },
    { code: 'ro', name: '🇷🇴 Română (Romanian)' },
    { code: 'hu', name: '🇭🇺 Magyar (Hungarian)' },
    { code: 'cs', name: '🇨🇿 Čeština (Czech)' },
    { code: 'sv', name: '🇸🇪 Svenska (Swedish)' },
    { code: 'fi', name: '🇫🇮 Suomi (Finnish)' },
    { code: 'ms', name: '🇲🇾 Bahasa Melayu (Malay)' },
    { code: 'tl', name: '🇵🇭 Filipino (Tagalog)' },
    { code: 'af', name: '🇿🇦 Afrikaans' },
    { code: 'zu', name: '🇿🇦 isiZulu (Zulu)' },
    { code: 'ha', name: '🇳🇬 Hausa' },
    { code: 'am', name: '🇪🇹 አማርኛ (Amharic)' },
    { code: 'uz', name: '🇺🇿 Oʻzbekcha (Uzbek)' },
    { code: 'mn', name: '🇲🇳 Монгол (Mongolian)' },
    { code: 'da', name: '🇩🇰 Dansk (Danish)' },
    { code: 'no', name: '🇳🇴 Norsk (Norwegian)' },
    { code: 'bg', name: '🇧🇬 Български (Bulgarian)' },
    { code: 'hr', name: '🇭🇷 Hrvatski (Croatian)' },
    { code: 'sr', name: '🇷🇸 Српски (Serbian)' },
    { code: 'sk', name: '🇸🇰 Slovenčina (Slovak)' },
    { code: 'sl', name: '🇸🇮 Slovenščina (Slovenian)' },
    { code: 'lt', name: '🇱🇹 Lietuvių (Lithuanian)' },
    { code: 'lv', name: '🇱🇻 Latviešu (Latvian)' },
    { code: 'et', name: '🇪🇪 Eesti (Estonian)' },
    { code: 'ka', name: '🇬🇪 ქართული (Georgian)' },
    { code: 'hy', name: '🇦🇲 Հայերեն (Armenian)' },
    { code: 'az', name: '🇦🇿 Azərbaycan (Azerbaijani)' },
    { code: 'kk', name: '🇰🇿 Қазақша (Kazakh)' },
    { code: 'ne', name: '🇳🇵 नेपाली (Nepali)' },
    { code: 'si', name: '🇱🇰 සිංහල (Sinhala)' },
    { code: 'my', name: '🇲🇲 မြန်မာ (Burmese)' },
    { code: 'km', name: '🇰🇭 ខ្មែរ (Khmer)' },
    { code: 'lo', name: '🇱🇦 ລາວ (Lao)' },
    { code: 'ta', name: '🇮🇳 தமிழ் (Tamil)' },
    { code: 'te', name: '🇮🇳 తెలుగు (Telugu)' },
    { code: 'mr', name: '🇮🇳 मराठी (Marathi)' },
    { code: 'gu', name: '🇮🇳 ગુજરાતી (Gujarati)' },
    { code: 'kn', name: '🇮🇳 ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: '🇮🇳 മലയാളം (Malayalam)' },
    { code: 'or', name: '🇮🇳 ଓଡ଼ିଆ (Odia)' },
    { code: 'as', name: '🇮🇳 অসমীয়া (Assamese)' },
    { code: 'yo', name: '🇳🇬 Yorùbá (Yoruba)' },
    { code: 'ig', name: '🇳🇬 Igbo' },
    { code: 'om', name: '🇪🇹 Afaan Oromoo (Oromo)' },
    { code: 'ceb', name: '🇵🇭 Cebuano' },
    { code: 'ku', name: '🇮🇶 Kurdî (Kurdish)' },
    { code: 'so', name: '🇸🇴 Soomaali (Somali)' },
    { code: 'mg', name: '🇲🇬 Malagasy' },
    { code: 'xh', name: '🇿🇦 isiXhosa (Xhosa)' },
    { code: 'st', name: '🇱🇸 Sesotho' },
    { code: 'wo', name: '🇸🇳 Wolof' },
    { code: 'ln', name: '🇨🇩 Lingála (Lingala)' },
    { code: 'rw', name: '🇷🇼 Ikinyarwanda (Kinyarwanda)' },
    { code: 'sn', name: '🇿🇼 chiShona (Shona)' },
    { code: 'jv', name: '🇮🇩 Basa Jawa (Javanese)' },
    { code: 'su', name: '🇮🇩 Basa Sunda (Sundanese)' },
    { code: 'bho', name: '🇮🇳 भोजपुरी (Bhojpuri)' },
    { code: 'ff', name: '🇳🇬 Fulfulde (Fulani)' },
    { code: 'bm', name: '🇲🇱 Bamanankan (Bambara)' },
    { code: 'lg', name: '🇺🇬 Luganda' },
    { code: 'tg', name: '🇹🇯 Тоҷикӣ (Tajik)' },
    { code: 'ti', name: '🇪🇷 ትግርኛ (Tigrinya)' },
    { code: 'ky', name: '🇰🇬 Кыргызча (Kyrgyz)' },
    { code: 'tk', name: '🇹🇲 Türkmençe (Turkmen)' },
    { code: 'tn', name: '🇧🇼 Setswana (Tswana)' },
    { code: 'ny', name: '🇲🇼 Chichewa' },
    { code: 'bs', name: '🇧🇦 Bosanski (Bosnian)' },
    { code: 'sq', name: '🇦🇱 Shqip (Albanian)' },
  ];

  var RTL = ['ur', 'ar', 'fa', 'ps', 'he', 'ar-ae', 'ar-sa', 'ar-bh', 'ar-qa', 'ar-kw', 'ku'];
  // ہماری فہرست کے کوڈ → Google Translate کے کوڈ
  var GT = { 'ar-ae': 'ar', 'ar-sa': 'ar', 'ar-bh': 'ar', 'ar-qa': 'ar', 'ar-kw': 'ar', 'he': 'iw', 'jv': 'jw', 'zh': 'zh-CN' };
  var KEY = 'palmistryLang';
  var DEFAULT_LANG = 'en';

  function getLang(){
    try{ var l = localStorage.getItem(KEY); if(l) return l; }catch(e){}
    var m = document.cookie.match(/(?:^|;\s*)googtrans=\/ur\/([^;]+)/);
    if(m){ var g = decodeURIComponent(m[1]); for(var i=0;i<languageList.length;i++){ if((GT[languageList[i].code] || languageList[i].code) === g) return languageList[i].code; } }
    // پہلی بار آنے والوں کے لیے ڈیفالٹ English (سرچ انجن کے بوٹ کو اصل اردو صفحہ ہی دکھے)
    if(/bot|crawl|spider|slurp|Mediapartners|Google-InspectionTool|Lighthouse|Chrome-Lighthouse/i.test(navigator.userAgent)) return 'ur';
    return DEFAULT_LANG;
  }
  function setCookie(val){
    var host = location.hostname, parts = host.split('.');
    var base = parts.length > 1 ? '.' + parts.slice(-2).join('.') : host;
    var exp = val ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    var v = val ? 'googtrans=' + val : 'googtrans=';
    document.cookie = v + '; path=/' + exp;
    if(host.indexOf('.') > 0) document.cookie = v + '; path=/; domain=' + base + exp;
  }

  var cur = getLang();
  // ڈیفالٹ زبان کے لیے بھی Google Translate کی کوکی لگائیں تاکہ ترجمہ چلے
  if(cur !== 'ur' && !/(?:^|;\s*)googtrans=/.test(document.cookie)) setCookie('/ur/' + (GT[cur] || cur));

  var css = document.createElement('style');
  css.textContent =
    '.hl-lang{position:relative;display:flex;justify-content:flex-end;width:100%;box-sizing:border-box;padding:6px 10px 0;direction:ltr;z-index:70;}' +
    '.site-header .hl-lang{padding:0;width:auto;order:2;}' +
    '#hlLangBtn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:18px;border:1px solid rgba(201,167,105,0.4);background:#141b2c;color:#e8c887;' +
      'font:600 .85rem Inter,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);white-space:nowrap;}' +
    '#hlLangPanel{display:none;position:absolute;top:calc(100% + 6px);width:260px;max-width:calc(100vw - 20px);max-height:60vh;flex-direction:column;' +
      'background:#141b2c;border:1px solid rgba(201,167,105,0.3);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.5);overflow:hidden;z-index:9000;}' +
    '#hlLangPanel.open{display:flex;}' +
    '#hlLangSearch{margin:8px;padding:8px 10px;border:1px solid rgba(201,167,105,0.3);border-radius:8px;font:1rem Inter,sans-serif;background:#0d1220;color:#efe9da;}' +
    '#hlLangList{overflow-y:auto;}' +
    '.hl-item{padding:9px 14px;cursor:pointer;font:.95rem Inter,"Noto Nastaliq Urdu",sans-serif;color:#efe9da;line-height:1.6;}' +
    '.hl-item:hover,.hl-item:active{background:rgba(201,167,105,0.1);}' +
    '.hl-item.sel{color:#e8c887;font-weight:700;}' +
    '.hl-note{font:.75rem Inter,sans-serif;color:#8892a8;padding:6px 12px 8px;border-top:1px solid rgba(201,167,105,0.15);line-height:1.5;}' +
    // Google کی اپنی پٹی اور ٹول ٹپ چھپائیں
    '.goog-te-banner-frame,iframe.skiptranslate,#goog-gt-tt,.goog-te-balloon-frame{display:none!important;}body{top:0!important;}' +
    '.goog-text-highlight{background:none!important;box-shadow:none!important;}' +
    'html.hl-ltr body{font-family:Inter,Roboto,"Noto Sans",Arial,sans-serif!important;line-height:1.7;}';
  document.head.appendChild(css);

  if(cur !== 'ur'){
    document.documentElement.lang = cur;
    document.documentElement.dir = RTL.indexOf(cur) >= 0 ? 'rtl' : 'ltr';
    if(RTL.indexOf(cur) < 0) document.documentElement.classList.add('hl-ltr');
    // ترجمہ چلانے کے لیے Google Translate لوڈ کریں
    window.hlGoogleInit = function(){
      try{ new google.translate.TranslateElement({ pageLanguage: 'ur', autoDisplay: false }, 'hlGt'); }catch(e){}
    };
    var gs = document.createElement('script');
    gs.src = 'https://translate.google.com/translate_a/element.js?cb=hlGoogleInit';
    gs.async = true;
    document.head.appendChild(gs);
  }

  function choose(code){
    try{ localStorage.setItem(KEY, code); }catch(e){}
    if(code === 'ur') setCookie(''); else setCookie('/ur/' + (GT[code] || code));
    location.reload();
  }

  function build(){
    var wrap = document.createElement('div');
    wrap.className = 'hl-lang notranslate';
    wrap.setAttribute('translate', 'no');
    var entry = null;
    for(var i=0;i<languageList.length;i++) if(languageList[i].code === cur) entry = languageList[i];
    wrap.innerHTML = '<button type="button" id="hlLangBtn" aria-haspopup="listbox" aria-label="Language / زبان">🌐 <span>' +
      (cur === 'ur' ? 'Language' : (entry ? entry.name : cur)) + '</span></button>' +
      '<div id="hlLangPanel"><input type="search" id="hlLangSearch" placeholder="Search language... / زبان تلاش کریں" autocomplete="off">' +
      '<div id="hlLangList" role="listbox"></div>' +
      '<div class="hl-note">Translation by Google — ترجمہ خودکار ہے، اصل متن اردو میں ہے۔</div></div>' +
      '<div id="hlGt" style="display:none"></div>';
    var host = document.querySelector('.site-header .wrap') || document.querySelector('header');
    if(host) host.insertBefore(wrap, host.firstChild); else document.body.insertBefore(wrap, document.body.firstChild);

    var btn = wrap.querySelector('#hlLangBtn'), panel = wrap.querySelector('#hlLangPanel'),
        search = wrap.querySelector('#hlLangSearch'), list = wrap.querySelector('#hlLangList');
    // The language button ends up on whichever side is the "start" of the nav
    // row for the page's actual direction (right in RTL, left in LTR) once it
    // wraps onto its own line — anchor the dropdown to that same side so it
    // never overflows off the opposite edge of the screen.
    if(RTL.indexOf(cur) >= 0){ panel.style.right = '0'; panel.style.left = 'auto'; }
    else{ panel.style.left = '0'; panel.style.right = 'auto'; }
    function render(q){
      q = (q || '').trim().toLowerCase();
      var items = languageList.filter(function(l){ return !q || l.name.toLowerCase().indexOf(q) >= 0 || l.code.indexOf(q) >= 0; });
      list.innerHTML = items.length ? items.map(function(l){
        return '<div class="hl-item' + (l.code === cur ? ' sel' : '') + '" role="option" data-code="' + l.code + '">' + l.name + '</div>';
      }).join('') : '<div class="hl-item">No matching language</div>';
    }
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      if(panel.classList.toggle('open')){ search.value = ''; render(''); search.focus(); }
    });
    search.addEventListener('input', function(){ render(search.value); });
    list.addEventListener('click', function(e){
      var it = e.target.closest('.hl-item'); var c = it && it.getAttribute('data-code');
      if(c && c !== cur) choose(c); else panel.classList.remove('open');
    });
    panel.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('click', function(){ panel.classList.remove('open'); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
