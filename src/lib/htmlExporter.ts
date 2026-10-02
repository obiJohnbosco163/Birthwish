import { Birthwish } from '../types';
import { RAINBOW_COLORS } from './colors';

export function generateStandaloneBirthwishHtml(wish: Birthwish): string {
  const theme = RAINBOW_COLORS[wish.colorTheme] || RAINBOW_COLORS.pink;
  const jsonSafeWish = JSON.stringify(wish).replace(/<\/script>/g, '<\\/script>');
  const safeTitle = escapeHtml(wish.celebrantName);
  const safeNickname = escapeHtml(wish.celebrantNickname || wish.celebrantName);
  const safeMainImage = wish.mainImage || '';
  
  // Format date of birth if available
  let formattedDobHtml = '';
  if (wish.celebrantDateOfBirth) {
    try {
      const parts = wish.celebrantDateOfBirth.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const formatted = `${monthNames[monthIndex]} ${day}${year ? `, ${year}` : ''}`;
        formattedDobHtml = `<div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 50px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); font-size: 13px; font-weight: 600; color: #f1f5f9;"><span>🎂</span><span>${escapeHtml(formatted)}</span></div>`;
      }
    } catch {}
  }

  const hasPaymentStatus = Boolean(
    wish.giftStatus &&
    wish.giftStatus !== 'unfunded' &&
    (wish.hasGift || (wish.giftAmount && wish.giftAmount > 0) || Boolean(wish.koraPaymentReference))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A Special Birthwish for ${safeTitle} 🎂</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Orbitron:wght@700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    :root {
      --primary: ${theme.primary};
      --secondary: ${theme.secondary};
      --glow: ${theme.glow};
      --bg: #040714;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: #f1f5f9;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      position: relative;
    }
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-orbitron { font-family: 'Orbitron', sans-serif; }
    .font-mono-tech { font-family: 'Space Grotesk', sans-serif; }
    .font-editorial { font-family: 'Playfair Display', Georgia, serif; }

    /* Dynamic background mesh with primary color glow */
    .bg-mesh {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 50% 20%, var(--glow) 0%, rgba(4, 7, 20, 0.98) 75%);
      z-index: -1;
      pointer-events: none;
    }

    /* Fireworks Canvas Screen */
    #fireworksScreen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #040714;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.6s ease;
    }
    #fireworksCanvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .cyber-start-btn {
      position: relative;
      z-index: 10;
      margin-top: 220px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #fff;
      border: 2px solid var(--primary);
      cursor: pointer;
      background: rgba(4, 7, 20, 0.88);
      border-radius: 50px;
      padding: 16px 40px;
      font-family: 'Orbitron', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      transition: all 0.3s;
      box-shadow: 0 0 25px var(--glow), inset 0 0 15px rgba(255,255,255,0.1);
    }
    .cyber-start-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 0 35px var(--primary), inset 0 0 20px var(--primary);
    }

    /* Hero neon celebrate button */
    .neon-celebrate-btn {
      text-transform: uppercase;
      letter-spacing: 2px;
      cursor: pointer;
      color: #fff;
      text-shadow: 0 0 10px var(--primary), 0 0 20px var(--secondary);
      background: linear-gradient(135deg, rgba(14, 21, 44, 0.95), rgba(0,0,0,0.8));
      border: 3px solid var(--primary);
      border-radius: 50px;
      padding: 14px 44px;
      font-family: 'Orbitron', 'Cinzel', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      transition: all 0.3s;
      box-shadow: 0 0 25px var(--glow);
    }
    .neon-celebrate-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 0 40px var(--primary), 0 0 60px var(--secondary);
    }

    /* Typewriter Surprise Modal Overlay */
    .fancy-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(3, 7, 18, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s;
    }
    .fancy-overlay.show {
      opacity: 1;
      pointer-events: auto;
    }
    .fancy-modal {
      text-align: center;
      background: rgba(11, 18, 38, 0.95);
      border: 1.5px solid var(--primary);
      border-radius: 28px;
      width: 100%;
      max-width: 580px;
      padding: 36px 32px;
      position: relative;
      box-shadow: 0 0 50px var(--glow), 0 20px 40px rgba(0,0,0,0.8);
      transform: scale(0.92);
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .fancy-overlay.show .fancy-modal {
      transform: scale(1);
    }

    /* Last Page Overlay */
    .lastpage-screen {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: radial-gradient(circle at 50% 20%, var(--glow) 0%, #030712 85%);
      overflow-y: auto;
      padding: 30px 16px 80px;
      display: none;
      flex-direction: column;
      align-items: center;
    }
    .lastpage-screen.show {
      display: flex;
    }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>

  <!-- ================= 1. FIREWORKS INTRO CANVAS ================= -->
  <div id="fireworksScreen">
    <canvas id="fireworksCanvas"></canvas>
    <div id="enterBtnContainer" style="display: none; text-align: center; z-index: 10; max-width: 480px; width: 90%; margin: 0 auto; display: none; flex-direction: column; align-items: center;">
      ${safeMainImage ? `
        <div style="position: relative; width: 140px; height: 140px; border-radius: 50%; padding: 4px; background: linear-gradient(135deg, var(--primary), var(--secondary)); box-shadow: 0 0 35px var(--glow); margin-bottom: 16px;">
          <img src="${safeMainImage}" alt="${safeNickname}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />
          <div style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">👑</div>
        </div>
      ` : ''}
      <h1 class="font-orbitron" style="font-size: 26px; font-weight: 800; color: #fff; text-shadow: 0 0 20px var(--primary); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1.5px;">
        ${safeNickname}
      </h1>
      ${formattedDobHtml}
      <div style="margin-top: 24px; width: 100%;">
        <button class="cyber-start-btn" onclick="enterDreamWorld()" style="margin-top: 0; width: 100%; max-width: 320px;">
          <span>Enter Your Dream World ✨</span>
        </button>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 12px; font-family: 'Space Grotesk', sans-serif;">
          Click to enter ${safeNickname}'s bespoke celebration sanctuary
        </p>
      </div>
    </div>
  </div>

  <!-- ================= MAIN HERO CELEBRATION STAGE ================= -->
  <div style="width: 100%; max-width: 1000px; padding: 24px 16px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; min-height: 100vh; justify-content: space-between;">
    
    <!-- Top Bar -->
    <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 12px; height: 12px; border-radius: 50%; background-color: var(--primary); box-shadow: 0 0 10px var(--primary); display: inline-block;"></span>
        <span class="font-cinzel" style="font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 1px;">
          Happy Birthday ${safeNickname}
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button id="songToggleBtn" onclick="toggleSong()" style="padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(15,23,42,0.8); border: 1px solid var(--primary); color: #fff;">
          🎵 Play Song
        </button>
        <button onclick="fireBurst()" style="padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: 700; cursor: pointer; background: var(--secondary); color: #040714; border: none; font-family: 'Space Grotesk', sans-serif;">
          ✨ Confetti!
        </button>
      </div>
    </div>

    <!-- Typewriter Ticker -->
    <div style="text-align: center; padding: 12px 0; min-height: 40px;">
      <span id="tickerEl" class="font-orbitron" style="font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 2px; text-shadow: 0 0 12px var(--glow);">
      </span>
      <span style="color: var(--secondary); font-weight: 700; animation: pulse 1s infinite;">|</span>
    </div>

    <!-- Center Hero Card -->
    <div style="width: 100%; max-width: 760px; text-align: center; margin: auto 0; padding: 20px 0;">
      
      <!-- Cover Banner -->
      <div style="border-radius: 24px; overflow: hidden; max-height: 250px; border: 2px solid var(--primary); box-shadow: 0 0 35px var(--glow); position: relative;">
        <img src="${wish.coverImage}" alt="Cover" style="width: 100%; height: 250px; object-fit: cover;" />
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, #040714 0%, transparent 80%); opacity: 0.8;"></div>
      </div>

      <!-- Avatar Crowned -->
      <div style="position: relative; margin-top: -70px; display: inline-block;">
        <div style="width: 150px; height: 150px; border-radius: 50%; padding: 5px; background: linear-gradient(135deg, var(--primary), var(--secondary), #fff); box-shadow: 0 0 30px var(--glow); margin: 0 auto;">
          <img src="${wish.mainImage}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 3px solid #040714;" />
        </div>
        <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--secondary); color: #040714; padding: 4px 14px; border-radius: 50px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
          👑 ${wish.celebrantGender === 'female' ? 'Birthday Queen' : 'Birthday King'}
        </div>
      </div>

      <!-- Typography -->
      <div style="margin-top: 18px;">
        <h1 class="font-cinzel" style="font-size: 38px; font-weight: 900; color: #fff; text-shadow: 0 0 25px var(--glow); letter-spacing: -0.5px;">
          HAPPY BIRTHDAY ${safeTitle.toUpperCase()}
        </h1>
        <div class="font-cinzel" style="font-size: 20px; font-weight: 700; color: var(--secondary); margin-top: 4px;">
          &ldquo;${safeNickname}&rdquo;
        </div>
        <p style="font-size: 13px; color: var(--secondary); text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">
          Honoring ${escapeHtml(wish.category)} · Sent with love by ${escapeHtml(wish.senderName)}
        </p>
        <p style="font-size: 14px; color: #94a3b8; max-width: 500px; margin: 12px auto 0; font-style: italic; line-height: 1.6;">
          &ldquo;${escapeHtml(wish.shortMessage)}&rdquo;
        </p>
      </div>

      <!-- Neon Celebrate Button -->
      <div style="margin-top: 28px;">
        <button class="neon-celebrate-btn" onclick="openSurpriseModal()">
          Let&apos;s Celebrate
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div style="width: 100%; text-align: center; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b;">
      A birthday celebration tribute for ${safeTitle} · Created with love on Birthwish
    </div>
  </div>

  <!-- ================= 3. SURPRISE TYPEWRITER MODAL ================= -->
  <div id="surpriseModal" class="fancy-overlay">
    <div class="fancy-modal">
      <button onclick="closeSurpriseModal()" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: #1e293b; color: #cbd5e1; border: none; cursor: pointer; font-size: 16px;">
        ✕
      </button>

      <div style="width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 16px; padding: 2px; background: linear-gradient(135deg, var(--primary), var(--secondary)); box-shadow: 0 0 20px var(--glow);">
        <div style="width: 100%; height: 100%; border-radius: 14px; background: #040714; display: flex; align-items: center; justify-content: center; font-size: 24px;">
          🎁
        </div>
      </div>

      <h3 class="font-cinzel" style="font-size: 26px; font-weight: 800; color: #fff; text-shadow: 0 0 15px var(--glow);">
        A Little Surprise 🎁
      </h3>
      <p style="font-size: 11px; color: var(--secondary); text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">
        Made With Honor Just For You · ${safeNickname}
      </p>

      <div style="padding: 20px 10px; min-height: 90px; color: #e2e8f0; font-size: 15px; line-height: 1.7; font-style: italic;">
        <span id="modalTypewriter"></span>
        <span id="modalCursor" style="display: inline-block; width: 2px; height: 16px; background: var(--primary); animation: pulse 0.8s infinite; margin-left: 2px;"></span>
      </div>

      <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 20px;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 8px var(--primary);"></span>
        <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--secondary); box-shadow: 0 0 8px var(--secondary);"></span>
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 8px #ffffff;"></span>
      </div>

      <button onclick="goToFinalPage()" class="cyber-start-btn" style="margin-top: 0; padding: 12px 32px; font-size: 13px;">
        <span>Final Message 🎂</span>
      </button>
    </div>
  </div>

  <!-- ================= 4. LAST PAGE: CAKE & EPISTLE ================= -->
  <div id="lastPageScreen" class="lastpage-screen">
    <div style="width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
      <button onclick="closeFinalPage()" style="padding: 8px 16px; border-radius: 12px; background: rgba(15,23,42,0.8); border: 1px solid var(--primary); color: var(--secondary); font-size: 12px; cursor: pointer;">
        ← Back To Celebration
      </button>
      <button onclick="toggleSong()" style="padding: 8px 16px; border-radius: 12px; background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 12px; cursor: pointer;">
        🎵 Birthday Song
      </button>
    </div>

    <div style="width: 100%; max-width: 760px; text-align: center;">
      <!-- Cake Avatar -->
      <div style="width: 120px; height: 120px; border-radius: 50%; padding: 4px; background: linear-gradient(135deg, var(--primary), var(--secondary)); box-shadow: 0 0 25px var(--glow); margin: 0 auto;">
        <img src="${wish.mainImage}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 2px solid #040714;" />
      </div>

      <!-- 3D Realistic Interactive Cake in Celebrant's Rainbow Theme Color -->
      <div style="margin: 16px auto; display: flex; flex-direction: column; align-items: center; position: relative;">
        <div id="threeCakeContainer" style="width: 380px; height: 380px; max-width: 90vw; position: relative; cursor: pointer;" onclick="blowCandles()"></div>
        <div style="margin-top: 6px;">
          <button id="blowActionBtn" onclick="blowCandles()" style="padding: 12px 32px; border-radius: 50px; background: linear-gradient(90deg, #f43f5e, var(--primary)); color: #fff; border: none; font-weight: 700; font-size: 13px; cursor: pointer; text-transform: uppercase; font-family: 'Space Grotesk', sans-serif; box-shadow: 0 0 25px var(--glow);">
            Blow Out The Candle 💨
          </button>
          <div id="wishGrantedMsg" style="display: none; margin-top: 10px; font-size: 15px; font-weight: 700; color: var(--secondary);" class="font-cinzel">
            🎉 WISH GRANTED! MAY YOUR NEW AGE BE FILLED WITH BOUNDLESS FAVOR! 🎉
          </div>
        </div>
      </div>

      <!-- Epistle Panel -->
      <div style="background: rgba(11, 18, 38, 0.95); border: 1.5px solid var(--primary); border-radius: 24px; padding: 36px 28px; text-align: left; box-shadow: 0 0 40px var(--glow); margin-top: 32px;">
        <h2 class="font-cinzel" style="font-size: 26px; font-weight: 800; color: var(--secondary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 20px;">
          HAPPY BIRTHDAY, ${safeNickname} 🎉
        </h2>
        <div class="font-editorial" style="font-size: 17px; line-height: 1.85; color: #f8fafc; white-space: pre-line; margin-bottom: 24px;">
          ${escapeHtml(wish.finalEpistle)}
        </div>
        <div style="border-left: 3px solid var(--primary); background: rgba(255,255,255,0.03); padding: 12px 16px; font-style: italic; color: #e2e8f0; font-size: 14px; margin-bottom: 24px;">
          &ldquo;${escapeHtml(wish.shortMessage)}&rdquo;
        </div>
        <p class="font-cinzel" style="font-size: 20px; font-weight: 800; color: #fff; text-align: center; text-shadow: 0 0 15px var(--glow); margin: 24px 0 12px;">
          Your story is still being written.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="color: var(--secondary); font-weight: 700; font-size: 14px;">With highest honor, admiration and gratitude,</p>
          <p style="color: #fff; font-weight: 600; margin-top: 4px;">${escapeHtml(wish.senderName)} (${escapeHtml(wish.senderRelation)})</p>
        </div>
      </div>

      <div style="margin-top: 28px; padding-bottom: 40px;">
        <button onclick="fireBurst()" class="cyber-start-btn" style="margin-top: 0; padding: 14px 40px;">
          Celebrate Again 🎊
        </button>
      </div>
    </div>
  </div>

  <script>
    const wishData = ${jsonSafeWish};
    const primaryColor = '${theme.primary}';
    const secondaryColor = '${theme.secondary}';

    // 1. FIREWORKS CANVAS LOGIC
    (function initFireworks() {
      const canvas = document.getElementById('fireworksCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let w = canvas.width = window.innerWidth;
      let h = canvas.height = window.innerHeight;
      window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      });

      const rockets = [];
      const sparks = [];
      const colors = [primaryColor, secondaryColor, '#ffffff', '#fbbf24', '#38bdf8', '#f43f5e'];

      function launch() {
        rockets.push({
          x: Math.random() * (w - 200) + 100,
          y: h,
          targetY: h * 0.45 * Math.random() + h * 0.15,
          vy: -(Math.random() * 4 + 7),
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      function explode(x, y, color) {
        for (let i = 0; i < 60; i++) {
          const angle = (Math.PI * 2 / 60) * i + (Math.random() - 0.5) * 0.5;
          const speed = Math.random() * 5 + 1.5;
          sparks.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color,
            size: Math.random() * 2.5 + 1,
            decay: Math.random() * 0.015 + 0.015
          });
        }
      }

      let frame = 0;
      function loop() {
        ctx.fillStyle = 'rgba(4, 7, 20, 0.22)';
        ctx.fillRect(0, 0, w, h);
        frame++;
        if (frame % 25 === 0 && frame < 350) launch();

        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.y += r.vy;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.shadowColor = r.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
          if (r.y <= r.targetY) {
            explode(r.x, r.y, r.color);
            rockets.splice(i, 1);
          }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.05;
          s.alpha -= s.decay;
          if (s.alpha <= 0) {
            sparks.splice(i, 1);
          } else {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = Math.max(0, s.alpha);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        ctx.font = 'bold 24px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = primaryColor;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 15;
        if (w > 640) {
          ctx.fillText('✨ HAPPY BIRTHDAY ✨', w / 2, Math.max(50, h * 0.12));
        } else {
          ctx.fillText('HAPPY BIRTHDAY', w / 2, Math.max(45, h * 0.10));
        }
        ctx.shadowBlur = 0;

        requestAnimationFrame(loop);
      }
      loop();

      setTimeout(() => {
        const btn = document.getElementById('enterBtnContainer');
        if (btn) btn.style.display = 'flex';
      }, 1800);
    })();

    function enterDreamWorld() {
      const screen = document.getElementById('fireworksScreen');
      if (screen) {
        screen.style.opacity = '0';
        setTimeout(() => screen.style.display = 'none', 600);
      }
      fireBurst();
      playSong();
    }

    // 2. TICKER TYPEWRITER
    (function initTicker() {
      const teaser = '🎉 Happy Birthday ' + (wishData.celebrantNickname || wishData.celebrantName) + '! 🎂 Click Let\\'s Celebrate below! 💖';
      let idx = 0;
      let deleting = false;
      const el = document.getElementById('tickerEl');

      function tick() {
        if (!deleting && idx <= teaser.length) {
          el.textContent = teaser.slice(0, idx);
          idx++;
        } else if (deleting && idx >= 0) {
          el.textContent = teaser.slice(0, idx);
          idx--;
        }
        if (idx > teaser.length) deleting = true;
        if (idx < 0) { deleting = false; idx = 0; }
        setTimeout(tick, deleting ? 40 : 80);
      }
      tick();
    })();

    // 3. SURPRISE MODAL
    function openSurpriseModal() {
      const modal = document.getElementById('surpriseModal');
      modal.classList.add('show');
      fireBurst();

      const text = wishData.shortMessage || ('Happy Birthday, ' + (wishData.celebrantNickname || wishData.celebrantName) + '! Wishing you boundless favor and joy.');
      const el = document.getElementById('modalTypewriter');
      el.textContent = '';
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          el.textContent = text.slice(0, i + 1);
          i++;
        } else {
          clearInterval(timer);
        }
      }, 28);
    }
    function closeSurpriseModal() {
      document.getElementById('surpriseModal').classList.remove('show');
    }

    // 4. FINAL PAGE & 3D CAKE INITIALIZATION
    let threeCakeInitialized = false;
    let cakeFlameMesh = null;
    let cakeFlameLight = null;
    let cakeSmokePuffs = [];
    let isCakeBlown = false;

    function initThreeCake() {
      if (threeCakeInitialized || typeof THREE === 'undefined') return;
      const container = document.getElementById('threeCakeContainer');
      if (!container) return;
      threeCakeInitialized = true;

      const w = 380;
      const h = 380;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
      camera.position.set(0, 1.45, 4.4);
      camera.lookAt(0, 0.1, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const cakeGroup = new THREE.Group();
      cakeGroup.position.y = -0.35;
      scene.add(cakeGroup);

      // Cream texture
      const cCanvas = document.createElement('canvas');
      cCanvas.width = 512;
      cCanvas.height = 256;
      const cctx = cCanvas.getContext('2d');
      if (cctx) {
        cctx.fillStyle = '#ffffff';
        cctx.fillRect(0, 0, 512, 256);
        for (let y = 10; y < 256; y += 14) {
          cctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          cctx.lineWidth = 4;
          cctx.beginPath();
          cctx.moveTo(0, y + Math.sin(y) * 4);
          cctx.bezierCurveTo(128, y - 6, 256, y + 8, 512, y + Math.sin(y) * 4);
          cctx.stroke();
        }
      }
      const creamTex = new THREE.CanvasTexture(cCanvas);

      const colPri = new THREE.Color(primaryColor);
      const colSec = new THREE.Color(secondaryColor);
      const colGold = new THREE.Color('#e2bd77');

      const plateMat = new THREE.MeshStandardMaterial({ color: colGold, metalness: 0.85, roughness: 0.2 });
      const tier1Mat = new THREE.MeshStandardMaterial({ color: colPri, map: creamTex, roughness: 0.35 });
      const tier2Mat = new THREE.MeshStandardMaterial({ color: '#fffbf5', map: creamTex, roughness: 0.3 });
      const tier3Mat = new THREE.MeshStandardMaterial({ color: colSec, map: creamTex, roughness: 0.35 });
      const ribbonMat = new THREE.MeshStandardMaterial({ color: colGold, metalness: 0.8, roughness: 0.25 });
      const pearlMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });

      // Stand
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.6, 0.08, 64), plateMat);
      stand.position.y = -0.04;
      cakeGroup.add(stand);

      // Tier 1
      const t1H = 0.48;
      const t1R = 1.38;
      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(t1R, t1R, t1H, 64), tier1Mat);
      t1.position.y = t1H / 2;
      cakeGroup.add(t1);

      const r1 = new THREE.Mesh(new THREE.TorusGeometry(t1R + 0.015, 0.03, 16, 64), ribbonMat);
      r1.rotation.x = Math.PI / 2;
      r1.position.y = 0.02;
      cakeGroup.add(r1);

      // Tier 2
      const t2H = 0.42;
      const t2R = 1.02;
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(t2R, t2R, t2H, 64), tier2Mat);
      t2.position.y = t1H + t2H / 2;
      cakeGroup.add(t2);

      const r2 = new THREE.Mesh(new THREE.TorusGeometry(t2R + 0.015, 0.028, 16, 64), ribbonMat);
      r2.rotation.x = Math.PI / 2;
      r2.position.y = t1H + 0.02;
      cakeGroup.add(r2);

      // Tier 3
      const t3H = 0.40;
      const t3R = 0.65;
      const t3 = new THREE.Mesh(new THREE.CylinderGeometry(t3R, t3R, t3H, 64), tier3Mat);
      t3.position.y = t1H + t2H + t3H / 2;
      cakeGroup.add(t3);

      const r3 = new THREE.Mesh(new THREE.TorusGeometry(t3R + 0.012, 0.025, 16, 64), ribbonMat);
      r3.rotation.x = Math.PI / 2;
      r3.position.y = t1H + t2H + 0.02;
      cakeGroup.add(r3);

      // Pearls on top
      for (let i = 0; i < 18; i++) {
        const ang = (i / 18) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), pearlMat);
        p.position.set(Math.cos(ang) * (t3R - 0.02), t1H + t2H + t3H, Math.sin(ang) * (t3R - 0.02));
        cakeGroup.add(p);
      }

      // Macarons in primary color
      const macMat = new THREE.MeshStandardMaterial({ color: colPri, roughness: 0.4 });
      for (let m = 0; m < 5; m++) {
        const ang = (m / 5) * Math.PI * 2 + 0.3;
        const mac = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24), macMat);
        mac.position.set(Math.cos(ang) * 0.38, t1H + t2H + t3H + 0.04, Math.sin(ang) * 0.38);
        mac.rotation.x = 0.2;
        cakeGroup.add(mac);
      }

      // Candle
      const candleGroup = new THREE.Group();
      const baseY = t1H + t2H + t3H;
      candleGroup.position.set(0, baseY, 0);
      cakeGroup.add(candleGroup);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.42, 24), new THREE.MeshStandardMaterial({ color: '#ffffff' }));
      pillar.position.y = 0.23;
      candleGroup.add(pillar);

      const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8), new THREE.MeshBasicMaterial({ color: '#27272a' }));
      wick.position.y = 0.46;
      candleGroup.add(wick);

      const flGeo = new THREE.ConeGeometry(0.04, 0.16, 16);
      flGeo.translate(0, 0.08, 0);
      cakeFlameMesh = new THREE.Mesh(flGeo, new THREE.MeshStandardMaterial({ color: '#ffedd5', emissive: '#f59e0b', emissiveIntensity: 2.4 }));
      cakeFlameMesh.position.y = 0.48;
      candleGroup.add(cakeFlameMesh);

      cakeFlameLight = new THREE.PointLight('#fbbf24', 2.0, 4.5);
      cakeFlameLight.position.y = 0.55;
      candleGroup.add(cakeFlameLight);

      // Smoke puffs
      const smGeo = new THREE.SphereGeometry(0.024, 8, 8);
      const smMat = new THREE.MeshBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.45 });
      cakeSmokePuffs = [];
      for (let s = 0; s < 5; s++) {
        const sm = new THREE.Mesh(smGeo, smMat.clone());
        sm.visible = false;
        candleGroup.add(sm);
        cakeSmokePuffs.push({ mesh: sm, startY: 0.5, life: s * 0.2 });
      }

      // Lighting
      const ambLight = new THREE.AmbientLight('#ffffff', 1.0);
      scene.add(ambLight);
      const dirLight = new THREE.DirectionalLight('#ffffff', 1.8);
      dirLight.position.set(3, 6, 4);
      scene.add(dirLight);

      let mouseX = 0, mouseY = 0;
      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 0.5;
        mouseY = ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 0.3;
      });
      container.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });

      let clock = new THREE.Clock();
      function anim() {
        requestAnimationFrame(anim);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        cakeGroup.rotation.y += (mouseX - cakeGroup.rotation.y + 0.1) * 0.05;
        cakeGroup.rotation.x += (mouseY - cakeGroup.rotation.x) * 0.05;

        if (!isCakeBlown && cakeFlameMesh) {
          const s = 1 + Math.sin(time * 12) * 0.08;
          cakeFlameMesh.scale.set(s, s + Math.cos(time * 15) * 0.1, s);
          cakeFlameMesh.rotation.z = Math.sin(time * 8) * 0.06;
          cakeFlameLight.intensity = 2.0 + Math.sin(time * 14) * 0.4;
        } else {
          if (cakeFlameMesh) cakeFlameMesh.visible = false;
          if (cakeFlameLight) cakeFlameLight.intensity = 0;
          cakeSmokePuffs.forEach(sp => {
            sp.mesh.visible = true;
            sp.life += delta * 1.2;
            if (sp.life > 1) sp.life = 0;
            sp.mesh.position.y = sp.startY + sp.life * 0.32;
            sp.mesh.position.x = Math.sin(sp.life * 4) * 0.04;
            const sc = 0.6 + sp.life * 1.2;
            sp.mesh.scale.set(sc, sc, sc);
            sp.mesh.material.opacity = (1 - sp.life) * 0.45;
          });
        }

        renderer.render(scene, camera);
      }
      anim();
    }

    function goToFinalPage() {
      closeSurpriseModal();
      document.getElementById('lastPageScreen').classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      initThreeCake();
      fireBurst();
    }
    function closeFinalPage() {
      document.getElementById('lastPageScreen').classList.remove('show');
    }

    // 5. BLOW CANDLES
    function blowCandles() {
      isCakeBlown = true;
      document.getElementById('blowActionBtn').style.display = 'none';
      document.getElementById('wishGrantedMsg').style.display = 'block';
      fireBurst();
    }

    // 6. CONFETTI & AUDIO
    function fireBurst() {
      if (window.confetti) {
        window.confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.4 },
          colors: [primaryColor, secondaryColor, '#ffffff', '#fbbf24', '#f43f5e']
        });
      }
    }

    let audioCtx = null;
    let isPlaying = false;
    let audioTimer = null;
    const melody = [
      [261.63, 0.75], [261.63, 0.25], [293.66, 1.0], [261.63, 1.0], [349.23, 1.0], [329.63, 2.0],
      [261.63, 0.75], [261.63, 0.25], [293.66, 1.0], [261.63, 1.0], [392.00, 1.0], [349.23, 2.0],
      [261.63, 0.75], [261.63, 0.25], [523.25, 1.0], [440.00, 1.0], [349.23, 1.0], [329.63, 1.0], [293.66, 2.0],
      [466.16, 0.75], [466.16, 0.25], [440.00, 1.0], [349.23, 1.0], [392.00, 1.0], [349.23, 2.5]
    ];

    function initAudio() {
      if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playTone(freq, dur) {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur * 0.9);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    }

    function playSong() {
      initAudio();
      if (!audioCtx || isPlaying) return;
      isPlaying = true;
      let noteIdx = 0;
      function nextNote() {
        if (!isPlaying) return;
        const [freq, durBeats] = melody[noteIdx];
        const durSeconds = durBeats * 0.52;
        playTone(freq, durSeconds);
        noteIdx = (noteIdx + 1) % melody.length;
        audioTimer = setTimeout(nextNote, durSeconds * 1000);
      }
      nextNote();
      updateSongBtn(true);
    }

    function stopSong() {
      isPlaying = false;
      if (audioTimer) clearTimeout(audioTimer);
      updateSongBtn(false);
    }

    function toggleSong() {
      if (isPlaying) stopSong();
      else playSong();
    }

    function updateSongBtn(playing) {
      const btn = document.getElementById('songToggleBtn');
      if (btn) btn.textContent = playing ? '🎶 Playing...' : '🎵 Play Song';
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
