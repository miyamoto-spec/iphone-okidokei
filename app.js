/* ============================================================
   iPhone 置時計 PWA
   - 時計（HH:MM / コロン点滅）
   - 天気（Open-Meteo : 6時間 + 7日）
   - ニュース（NHK RSS → rss2json）
   - 夜間減光 / 加速度センサーによる180°回転
============================================================ */

(() => {
  'use strict';

  // ===== Config =====
  const LAT = 35.6812;   // 東京駅（位置取得失敗時のフォールバック）
  const LON = 139.7671;
  const WEATHER_REFRESH_MS = 30 * 60 * 1000;   // 30分
  const NEWS_REFRESH_MS    = 10 * 60 * 1000;   // 10分
  const NIGHT_START = 22;  // 22:00
  const NIGHT_END   = 6;   // 6:00
  const NIGHT_DIM_OPACITY = 0.55; // 夜間オーバーレイ透過度

  // NHK主要ニュース RSS
  const NHK_RSS = 'https://www.nhk.or.jp/rss/news/cat0.xml';
  const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(NHK_RSS);

  // ===== DOM =====
  const $date    = document.getElementById('date');
  const $hours   = document.getElementById('hours');
  const $minutes = document.getElementById('minutes');
  const $hourly  = document.getElementById('hourly');
  const $daily   = document.getElementById('daily');
  const $news    = document.getElementById('news-track');
  const $rotator = document.getElementById('rotator');
  const $dim     = document.getElementById('dim');
  const $gate    = document.getElementById('gate');
  const $gateBtn = document.getElementById('gate-btn');
  const $gateText = document.getElementById('gate-text');

  // ===== Clock =====
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const pad2 = (n) => String(n).padStart(2, '0');

  function updateClock() {
    const now = new Date();
    $hours.textContent   = pad2(now.getHours());
    $minutes.textContent = pad2(now.getMinutes());
    $date.textContent    = `${now.getMonth() + 1}月${now.getDate()}日(${WD[now.getDay()]})`;
    updateNightDim(now);
  }

  function startClock() {
    updateClock();
    // 次の分の頭まで待ってから毎分更新
    const ms = 60000 - (Date.now() % 60000);
    setTimeout(() => {
      updateClock();
      setInterval(updateClock, 60 * 1000);
    }, ms);
  }

  // ===== Night dimming =====
  function updateNightDim(now) {
    const h = now.getHours();
    const isNight = h >= NIGHT_START || h < NIGHT_END;
    $dim.style.opacity = isNight ? String(NIGHT_DIM_OPACITY) : '0';
  }

  // ===== Weather =====
  // Open-Meteo weather code → emoji
  function weatherEmoji(code) {
    if (code === 0) return '☀️';                      // 快晴
    if ([1, 2].includes(code)) return '🌤';            // 晴れ時々曇り
    if (code === 3) return '☁️';                       // 曇り
    if ([45, 48].includes(code)) return '🌫';          // 霧
    if ([51, 53, 55, 56, 57].includes(code)) return '🌦'; // 霧雨
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧'; // 雨
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️'; // 雪
    if ([95, 96, 99].includes(code)) return '⛈';      // 雷雨
    return '–';
  }

  async function getLocation() {
    if (!('geolocation' in navigator)) return { lat: LAT, lon: LON };
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        ()    => resolve({ lat: LAT, lon: LON }),
        { timeout: 5000, maximumAge: 30 * 60 * 1000 }
      );
    });
  }

  async function fetchWeather() {
    try {
      const { lat, lon } = await getLocation();
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&forecast_days=8&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('weather fetch failed');
      const data = await res.json();
      renderHourly(data.hourly);
      renderDaily(data.daily);
    } catch (e) {
      console.error('[weather]', e);
    }
  }

  function renderHourly(hourly) {
    if (!hourly || !hourly.time) return;

    // 次の1時間ブロック以降から6つ取得
    const now = new Date();
    const nowIdx = hourly.time.findIndex((t) => new Date(t) >= now);
    const startIdx = nowIdx === -1 ? 0 : nowIdx;

    const cells = [];
    for (let i = 0; i < 6; i++) {
      const idx = startIdx + i;
      if (idx >= hourly.time.length) break;
      const t    = new Date(hourly.time[idx]);
      const code = hourly.weather_code[idx];
      const temp = Math.round(hourly.temperature_2m[idx]);
      const pop  = hourly.precipitation_probability?.[idx] ?? null;

      cells.push(`
        <div class="cell">
          <div class="label">${t.getHours()}時</div>
          <div class="icon">${weatherEmoji(code)}</div>
          <div class="temp">${temp}°</div>
          <div class="pop">${pop != null ? pop + '%' : ''}</div>
        </div>
      `);
    }
    $hourly.innerHTML = cells.join('');
  }

  function renderDaily(daily) {
    if (!daily || !daily.time) return;
    const cells = daily.time.slice(0, 8).map((t, i) => {
      const d    = new Date(t);
      const code = daily.weather_code[i];
      const max  = Math.round(daily.temperature_2m_max[i]);
      const min  = Math.round(daily.temperature_2m_min[i]);
      const label = i === 0 ? '今日' : WD[d.getDay()];
      return `
        <div class="cell">
          <div class="label">${label}</div>
          <div class="icon">${weatherEmoji(code)}</div>
          <div class="temp-range">${max}°/${min}°</div>
        </div>
      `;
    });
    $daily.innerHTML = cells.join('');
  }

  // ===== News =====
  async function fetchNews() {
    try {
      const res = await fetch(RSS_API);
      if (!res.ok) throw new Error('news fetch failed');
      const data = await res.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('rss2json bad payload');

      // 上位15件をテロップに
      const items = data.items.slice(0, 15).map(
        (it) => `<span class="item">${escapeHTML(it.title)}</span>`
      );
      if (items.length) {
        $news.innerHTML = items.join('');
      } else {
        $news.textContent = 'ニュースを取得できませんでした';
      }
    } catch (e) {
      console.error('[news]', e);
      $news.textContent = 'ニュースを取得できませんでした';
    }
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ===== Orientation: 加速度センサーで180°回転 =====
  let lastFlipState = false; // 現在180°回転中か
  let flipStableFrames = 0;

  function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.y == null) return;
    // iOS の縦持ち基準: ホームボタン側を下にしたとき acc.y は -9.8 程度（重力が下向き）。
    // 上下反対（充電端子を上）にしたときに acc.y が +5 を超える → そのときだけ 180° 回転。
    const wantsFlip = acc.y > 5;
    if (wantsFlip === lastFlipState) {
      flipStableFrames = 0;
      return;
    }
    flipStableFrames++;
    if (flipStableFrames >= 6) {
      lastFlipState = wantsFlip;
      flipStableFrames = 0;
      $rotator.classList.toggle('upside-down', wantsFlip);
    }
  }

  function startOrientation() {
    if (typeof DeviceMotionEvent === 'undefined') return;

    const attach = () => window.addEventListener('devicemotion', handleMotion);

    // iOS 13+ は明示的な許可が必要
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      $gateText.textContent = '画面回転を有効化するには下のボタンをタップしてください。';
      $gate.classList.remove('hidden');
      $gateBtn.addEventListener('click', async () => {
        try {
          const result = await DeviceMotionEvent.requestPermission();
          if (result === 'granted') attach();
        } catch (_) { /* 拒否されても続行 */ }
        $gate.classList.add('hidden');
      }, { once: true });
    } else {
      attach();
    }
  }

  // ===== Service Worker =====
  function registerSW() {
    // ローカル開発時は SW を無効化（CSS/JSのキャッシュ起因のずれを避けるため）
    const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    if (isLocal) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      }
      return;
    }
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('[sw]', e));
      });
    }
  }

  // ===== Wake Lock（スリープ抑制） =====
  let wakeLock = null;
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) {
      console.warn('[wakelock]', e);
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
  });

  // ===== Boot =====
  function boot() {
    startClock();
    fetchWeather();
    fetchNews();
    setInterval(fetchWeather, WEATHER_REFRESH_MS);
    setInterval(fetchNews,    NEWS_REFRESH_MS);

    startOrientation();
    registerSW();
    requestWakeLock();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
