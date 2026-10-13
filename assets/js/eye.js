/*
 * eye.js — code-wall eye for the top-left avatar slot, plus a square
 * cursor marker that follows the pointer across the whole site.
 * No dependencies. Add one <script defer> tag to your layout.
 */
(function () {
  'use strict';

  var CFG = {
    // img to replace (the broken avatar). Falls back to a fixed top-left slot.
    selector: 'img[alt="Charlie Kruger"]',
    fallbackLeft: 35,
    fallbackTop: 29,
    size: 216,           // square size in px
    background: '#000',
    readout: false,      // optional ['pupil:u'] debug block
    cursorBox: true,     // square marker that follows the cursor sitewide
    code:
      'const eye=(s)=>s.open?look(s):shut(s);fn main(){let w=Wall::new();loop{w.feel();w.render();}}' +
      'impl Eye{pub fn blink(&mut self){self.t=0.0;}}if(!x){return;}for(i=0;i<n;i++){buf[i]^=key[i%k];}' +
      '#include<stdio.h>int main(){puts("hello");}while(1){sleep(1);}match v{Some(x)=>x,None=>0}'
  };

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touchOnly = window.matchMedia && matchMedia('(hover: none)').matches;

  var canvas, ctx, W, H, dpr, rgb = [230, 230, 230];
  var mx = null, my = null;
  var ox = 0, oy = 0, open = 1, userOpen = true;
  var nextBlink = 0, blinkUntil = 0;
  var box, bx = -100, by = -100, bs = 1, bts = 1, bTx = -100, bTy = -100, boxShown = false;
  var mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  function col(a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }

  function readBodyColor() {
    var m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(getComputedStyle(document.body).color);
    if (m) rgb = [+m[1], +m[2], +m[3]];
  }

  function fit() {
    dpr = window.devicePixelRatio || 1;
    var r = canvas.getBoundingClientRect();
    W = Math.max(40, r.width);
    H = Math.max(40, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function mount() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Eye that follows the cursor. Click to close or open.');
    canvas.style.display = 'block';
    canvas.style.cursor = 'pointer';
    if (CFG.background) canvas.style.background = CFG.background;
    var img = document.querySelector(CFG.selector);
    if (img) {
      canvas.className = img.className;
      canvas.style.width = CFG.size + 'px';
      canvas.style.height = CFG.size + 'px';
      canvas.style.maxWidth = 'none';
      canvas.style.flex = 'none';
      img.parentNode.replaceChild(canvas, img);
    } else {
      canvas.style.cssText +=
        ';position:fixed;z-index:50;left:' + CFG.fallbackLeft + 'px;top:' + CFG.fallbackTop +
        'px;width:' + CFG.size + 'px;height:' + CFG.size + 'px';
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext('2d');
    fit();
    window.addEventListener('resize', fit);
    canvas.addEventListener('click', function () {
      userOpen = !userOpen;
      canvas.setAttribute('aria-pressed', String(!userOpen));
    });
  }

  function mountBox() {
    if (!CFG.cursorBox || touchOnly) return;
    box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText =
      'position:fixed;left:0;top:0;width:18px;height:18px;box-sizing:border-box;' +
      'border:1px solid ' + col(0.7) + ';pointer-events:none;z-index:2147483000;opacity:0;' +
      'transition:opacity .2s;will-change:transform';
    document.body.appendChild(box);
    document.addEventListener('mouseleave', function () { box.style.opacity = '0'; boxShown = false; });
    document.addEventListener('mouseenter', function () { if (bTx > -50) { box.style.opacity = '1'; boxShown = true; } });
    document.addEventListener('mousedown', function () { bts = 0.7; });
    document.addEventListener('mouseup', function () { bts = 1; });
  }

  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    if (box) {
      bTx = mx;
      bTy = my;
      if (!boxShown) {
        bx = mx; by = my;
        box.style.opacity = '1';
        boxShown = true;
      }
      var t = e.target;
      bts = t && t.closest && t.closest('a,button,[role="button"],input,select,textarea,summary,label') ? 1.7 : 1;
    }
  }

  function draw(t) {
    if (!reduce && t > nextBlink) {
      blinkUntil = t + 140;
      nextBlink = t + 3000 + Math.random() * 3500;
    }
    var target = userOpen ? (t < blinkUntil ? 0 : 1) : 0;
    open += (target - open) * (reduce ? 1 : 0.25);
    open = Math.max(0, Math.min(1, open));

    var r = canvas.getBoundingClientRect();
    var ecx = r.left + r.width / 2, ecy = r.top + r.height / 2;
    var tmx = mx === null ? window.innerWidth * 0.7 : mx;
    var tmy = my === null ? window.innerHeight * 0.5 : my;
    var dx = tmx - ecx, dy = tmy - ecy, dist = Math.hypot(dx, dy) || 1;
    var k = Math.min(1, dist / 320);
    var lerp = reduce ? 1 : 0.12;
    ox += (dx / dist * k - ox) * lerp;
    oy += (dy / dist * k - oy) * lerp;

    var cw = 6, chh = 9, aspect = cw / chh;
    var cols = Math.floor(W / cw), rows = Math.floor(H / chh);
    var cx = cols / 2, cy = rows / 2, rx = cols * 0.44, ry = rows * 0.3;
    var irisR = ry * 0.62, pupR = irisR * 0.42;
    var ix = cx + ox * rx * 0.32, iy = cy + oy * ry * 0.28 * open;
    var code = CFG.code, clen = code.length;

    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'top';
    ctx.font = '8px ' + mono;

    var i, j, nx, ny, lid, d, dd, c, a, style;
    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        c = code.charAt((i + j * 7) % clen);
        a = 0.17;
        nx = (i - cx) / rx;
        ny = (j - cy) / ry;
        if (Math.abs(nx) < 1.04) {
          lid = open * (1 - nx * nx);
          d = Math.abs(Math.abs(ny) - lid);
          if (d < 0.14 || (open < 0.08 && Math.abs(ny) < 0.1)) {
            a = 1;
          } else if (Math.abs(ny) < lid) {
            dd = Math.hypot((i - ix) * aspect, j - iy);
            if (dd < pupR * 0.9) { c = (i + j) % 2 ? '#' : '@'; a = 1; }
            else if (dd < irisR * 0.9) { a = 0.65; }
            else { c = ' '; }
          }
        }
        if (c !== ' ') {
          ctx.fillStyle = col(a);
          ctx.fillText(c, i * cw, j * chh);
        }
      }
    }

    if (CFG.readout) {
      ctx.font = '8px ' + mono;
      ctx.fillStyle = col(0.75);
      ctx.fillText("['pupil:u'] " + k.toFixed(4), 2, H - 34);
      ctx.fillText((0.5 + ox * 0.1).toFixed(4), 2, H - 25);
      ctx.fillText((Math.abs(oy) * 0.05).toFixed(6), 2, H - 16);
      ctx.fillText('None', 2, H - 7);
    }

    if (box && boxShown) {
      var bl = reduce ? 1 : 0.35;
      bx += (bTx - bx) * bl;
      by += (bTy - by) * bl;
      bs += (bts - bs) * 0.2;
      box.style.transform = 'translate3d(' + (bx - 9) + 'px,' + (by - 9) + 'px,0) scale(' + bs.toFixed(3) + ')';
    }

    requestAnimationFrame(draw);
  }

  function init() {
    readBodyColor();
    mount();
    mountBox();
    window.addEventListener('pointermove', onMove, { passive: true });
    requestAnimationFrame(draw);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
