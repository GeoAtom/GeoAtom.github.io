/* GeoAtom site script: language + theme switches, the interactive HomePod Cast demo,
   the room diagrams, and the latest-release label. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var ASSETS = new URL('.', document.currentScript.src).href;   // …/assets/
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  function lang() { return root.dataset.lang === 'en' ? 'en' : 'zh'; }
  function each(sel, fn, scope) { Array.prototype.forEach.call((scope || document).querySelectorAll(sel), fn); }

  /* ---- language and theme (the first paint is set by the inline script in <head>) ---- */
  function applyLang(l, save) {
    root.dataset.lang = l;
    root.lang = l === 'zh' ? 'zh-CN' : 'en';
    var title = root.getAttribute('data-title-' + l);
    if (title) document.title = title;
    if (save) store.set('ga-lang', l);
    document.dispatchEvent(new CustomEvent('ga:lang'));
  }
  function applyTheme(t, save) {
    root.dataset.theme = t;
    if (save) store.set('ga-theme', t);
  }
  each('[data-toggle="lang"]', function (b) {
    b.addEventListener('click', function () { applyLang(lang() === 'zh' ? 'en' : 'zh', true); });
  });
  each('[data-toggle="theme"]', function (b) {
    b.addEventListener('click', function () { applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true); });
  });
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  if (dark.addEventListener) dark.addEventListener('change', function (e) {
    if (!store.get('ga-theme')) applyTheme(e.matches ? 'dark' : 'light', false);
  });
  applyLang(lang(), false);

  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () { head.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Opened straight from disk there is no server to map "folder/" to "folder/index.html". */
  if (location.protocol === 'file:') each('a[href]', function (a) {
    var h = a.getAttribute('href');
    if (!/^[a-z]+:|^#|^\/\//i.test(h) && /(^|\/)(#.*)?$/.test(h)) a.setAttribute('href', h.replace(/(#.*)?$/, 'index.html$1'));
  });

  /* ---- interactive mock of the HomePod Cast window (strings are the app's own) ---- */
  var T = {
    zh: {
      modes: { mono: '单声道', stereo: '立体声', quad: '四声道' },
      roles: { mono: ['扬声器'], stereo: ['左', '右'], quad: ['左前', '右前', '左后', '右后'] },
      names: { mono: ['客厅 HomePod'], stereo: ['客厅 HomePod 左', '客厅 HomePod 右'],
               quad: ['客厅 HomePod 左', '客厅 HomePod 右', '沙发 HomePod 左', '沙发 HomePod 右'] },
      volume: '音量', start: '开始串流', stop: '停止', settings: '设置',
      found: '找到 4 台 AirPlay 音箱', connecting: '正在连接…',
      streaming: '串流中 · 延迟约 150 ms · 自动缓冲 40 ms',
      testing: function (n) { return '正在 ' + n + ' 上播放测试音…'; },
      test: '测试音'
    },
    en: {
      modes: { mono: 'Mono', stereo: 'Stereo', quad: 'Quad' },
      roles: { mono: ['Speaker'], stereo: ['Left', 'Right'], quad: ['Front L', 'Front R', 'Rear L', 'Rear R'] },
      names: { mono: ['Living Room'], stereo: ['Living Room L', 'Living Room R'],
               quad: ['Living Room L', 'Living Room R', 'Sofa L', 'Sofa R'] },
      volume: 'Volume', start: 'Start streaming', stop: 'Stop', settings: 'Settings',
      found: 'Found 4 AirPlay speaker(s)', connecting: 'Connecting…',
      streaming: 'Streaming · about 150 ms latency · auto buffer 40 ms',
      testing: function (n) { return 'Playing a test sound on ' + n + '…'; },
      test: 'Test sound'
    }
  };
  var ARCS = '<svg class="arcs" viewBox="0 0 200 100" aria-hidden="true">' +
    '<path class="a1" d="M150.8 14.4A62 62 0 0 1 150.8 85.6"/><path class="a1" d="M49.2 14.4A62 62 0 0 0 49.2 85.6"/>' +
    '<path class="a2" d="M167.2 3A82 82 0 0 1 167.2 97"/><path class="a2" d="M32.8 3A82 82 0 0 0 32.8 97"/></svg>';

  function Demo(el) {
    var s = { mode: el.dataset.mode || 'stereo', state: el.dataset.state || 'idle', vol: 30, note: null };
    var win = el.querySelector('.demo-slot'), pods = el.querySelector('.pods'), timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function render() {
      var t = T[lang()], roles = t.roles[s.mode], names = t.names[s.mode];
      var dot = s.state === 'streaming' ? ' green' : s.state === 'connecting' ? ' amber' : '';
      var status = s.note || (s.state === 'streaming' ? t.streaming : s.state === 'connecting' ? t.connecting : t.found);
      var focus = document.activeElement && el.contains(document.activeElement) ? document.activeElement.getAttribute('data-k') : null;

      win.innerHTML =
        '<div class="app"><div class="titlebar"><img src="' + ASSETS + 'img/homepod-cast.svg" alt="">HomePod Cast' +
        '<div class="ctl" aria-hidden="true"><span>—</span><span>☐</span><span>✕</span></div></div><div class="body">' +
        '<div class="top"><div class="seg">' + ['mono', 'stereo', 'quad'].map(function (m) {
          return '<button type="button" data-k="mode-' + m + '" data-mode="' + m + '" aria-pressed="' + (m === s.mode) + '">' + t.modes[m] + '</button>';
        }).join('') + '</div><div class="ibtn" aria-hidden="true">↻</div></div>' +
        '<div class="roles">' + roles.map(function (r, i) {
          return '<div class="row"><span class="lbl">' + r + '</span><div class="menu">' + names[i] + '<i>⌄</i></div>' +
            '<button type="button" class="ibtn" data-k="test-' + i + '" data-test="' + i + '" aria-label="' + t.test + ': ' + names[i] + '">♪</button>' +
            '<span class="dot' + dot + '">●</span></div>';
        }).join('') + '</div>' +
        '<div class="row vol"><span class="lbl">' + t.volume + '</span><input type="range" min="0" max="100" value="' + s.vol +
        '" data-k="vol" aria-label="' + t.volume + '" style="--v:' + s.vol + '%"><span class="val">' + s.vol + '</span></div>' +
        '<button type="button" class="start' + (s.state === 'idle' ? '' : ' stop') + '" data-k="start" data-start>' + (s.state === 'idle' ? t.start : t.stop) + '</button>' +
        '<div class="level"><b></b></div><div class="status" role="status">' + status + '</div>' +
        '<div class="settings">' + t.settings + ' ▾</div></div></div>';

      pods.innerHTML = roles.map(function (r) {
        return '<figure class="pod"><div class="pod-art">' + ARCS +
          '<img class="art-light" src="' + ASSETS + 'img/homepod-mini-white.svg" alt="">' +
          '<img class="art-dark" src="' + ASSETS + 'img/homepod-mini-midnight.svg" alt=""></div>' +
          '<figcaption>' + r + '</figcaption></figure>';
      }).join('');

      el.dataset.mode = s.mode;
      el.dataset.state = s.state;
      if (focus) { var f = el.querySelector('[data-k="' + focus + '"]'); if (f) f.focus({ preventScroll: true }); }
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !el.contains(b)) return;
      if (b.dataset.mode) {
        if (b.dataset.mode === s.mode) return;
        clearTimers(); s.mode = b.dataset.mode; s.note = null;
        if (s.state === 'connecting') s.state = 'streaming';
        render();
      } else if (b.hasAttribute('data-start')) {
        clearTimers(); s.note = null;
        if (s.state === 'idle') {
          s.state = 'connecting'; render();
          later(function () { s.state = 'streaming'; render(); }, 900);
        } else { s.state = 'idle'; render(); }
      } else if (b.dataset.test) {
        var i = +b.dataset.test;
        clearTimers();
        if (s.state === 'connecting') s.state = 'streaming';
        s.note = T[lang()].testing(T[lang()].names[s.mode][i]); render();
        var pod = pods.children[i];
        if (pod) pod.classList.add('ping');
        later(function () { s.note = null; render(); }, 1300);
      }
    });
    el.addEventListener('input', function (e) {
      if (e.target.type !== 'range') return;
      s.vol = +e.target.value;
      e.target.style.setProperty('--v', s.vol + '%');
      e.target.nextElementSibling.textContent = s.vol;
    });
    document.addEventListener('ga:lang', function () { if (s.note) { clearTimers(); s.note = null; } render(); });
    render();
  }
  each('.demo', Demo);

  /* ---- room diagrams: speakers seen from above, sound waves toward the listener ---- */
  var NS = 'http://www.w3.org/2000/svg', SP = 72;
  function add(parent, tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    parent.appendChild(e);
    return e;
  }
  function arc(cx, cy, r, a, span) {
    function p(t) { return (cx + r * Math.cos(t)).toFixed(2) + ' ' + (cy + r * Math.sin(t)).toFixed(2); }
    return 'M ' + p(a - span) + ' A ' + r + ' ' + r + ' 0 0 1 ' + p(a + span);
  }
  var ROOMS = {
    mono: { who: [220, 150], speakers: [{ x: 220, y: 54, zh: '左+右', en: 'L+R', side: 1 }] },
    stereo: { who: [220, 150], speakers: [{ x: 110, y: 54, zh: '左', en: 'L', side: -1 }, { x: 330, y: 54, zh: '右', en: 'R', side: 1 }] },
    quad: { who: [220, 100], speakers: [{ x: 118, y: 46, zh: '左前', en: 'FL', side: -1 }, { x: 322, y: 46, zh: '右前', en: 'FR', side: 1 },
                                        { x: 118, y: 154, zh: '左后', en: 'RL', side: -1 }, { x: 322, y: 154, zh: '右后', en: 'RR', side: 1 }] }
  };
  each('svg.room[data-room]', function (svg) {
    var room = ROOMS[svg.dataset.room], x = room.who[0], y = room.who[1];
    add(svg, 'rect', { x: 0, y: 0, width: 440, height: 200, rx: 22, 'class': 'floor' });
    room.speakers.forEach(function (s) {
      var a = Math.atan2(y - s.y, x - s.x);
      add(svg, 'path', { d: arc(s.x, s.y, 43, a, 0.36), stroke: '#ff9f0a', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' });
      add(svg, 'path', { d: arc(s.x, s.y, 57, a, 0.36), stroke: '#ffc233', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' });
      ['white', 'midnight'].forEach(function (c) {
        add(svg, 'image', { href: ASSETS + 'img/homepod-mini-top-' + c + '.svg', x: s.x - SP / 2, y: s.y - SP / 2, width: SP, height: SP,
                            'class': c === 'white' ? 'art-light' : 'art-dark' });
      });
      ['zh', 'en'].forEach(function (l) {
        add(svg, 'text', { x: s.x + s.side * 48, y: s.y + 9, 'text-anchor': s.side < 0 ? 'end' : 'start', lang: l }, s[l]);
      });
    });
    add(svg, 'circle', { cx: x, cy: y - 12, r: 13, 'class': 'who' });
    add(svg, 'path', { d: 'M ' + (x - 24) + ' ' + (y + 24) + ' Q ' + (x - 24) + ' ' + (y + 4) + ' ' + x + ' ' + (y + 4) +
                          ' Q ' + (x + 24) + ' ' + (y + 4) + ' ' + (x + 24) + ' ' + (y + 24) + ' Z', 'class': 'who' });
  });

  /* ---- latest release: the page ships with a fallback, GitHub fills in the current one ---- */
  var rel = document.querySelector('[data-release]');
  if (rel && window.fetch) {
    fetch('https://api.github.com/repos/' + rel.getAttribute('data-release') + '/releases/latest')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.tag_name) return;
        var exe = (d.assets || []).filter(function (a) { return /\.exe$/i.test(a.name); })[0];
        each('[data-release-version]', function (e) { e.textContent = d.tag_name; });
        if (exe) each('[data-release-size]', function (e) { e.textContent = Math.round(exe.size / 1048576) + ' MB'; });
      })
      .catch(function () { /* offline or rate-limited: keep the fallback */ });
  }
})();
