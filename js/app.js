// ==========================================================================
// Gift Box Intro Screen
// ==========================================================================
(function initGiftIntro() {
  // Generate sparkle stars in background
  const starsContainer = document.getElementById('gift-bg-stars');
  if (starsContainer) {
    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'gift-star';
      const size = Math.random() * 3 + 1;
      star.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        --dur: ${(Math.random() * 3 + 2).toFixed(1)}s;
        --delay: ${(Math.random() * 4).toFixed(1)}s;
      `;
      starsContainer.appendChild(star);
    }
  }
})();

// Global function called by onclick in HTML
function openGift() {
  const giftScreen = document.getElementById('gift-intro-screen');
  const giftBox = document.getElementById('gift-box');
  const bloomContainer = document.getElementById('bloom-container');
  const fadeOverlay = document.getElementById('gift-fade-overlay');
  const giftContainer = document.getElementById('gift-container');
  const giftHint = giftContainer ? giftContainer.querySelector('.gift-hint') : null;

  if (!giftScreen || giftScreen.classList.contains('opening')) return;
  giftScreen.classList.add('opening');

  // Stop floating animation
  if (giftContainer) {
    giftContainer.style.animation = 'none';
    giftContainer.style.cursor = 'default';
    giftContainer.onclick = null;
  }

  // Hide hint text
  if (giftHint) {
    giftHint.style.transition = 'opacity 0.3s';
    giftHint.style.opacity = '0';
  }

  // 1. Open lid
  if (giftBox) giftBox.classList.add('opened');

  // 2. Shockwave ring
  const ring = document.createElement('div');
  ring.className = 'shockwave-ring';
  if (bloomContainer) bloomContainer.appendChild(ring);

  // 3. Bloom particle burst
  const colors = [
    '#f5c842', '#e8a820', '#ff85a1', '#ff4d6d',
    '#c77dff', '#7b2fff', '#fff', '#ffd6e0', '#ffb3c1'
  ];
  const particleCount = 55;

  setTimeout(() => {
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'bloom-particle';
      const angle = (i / particleCount) * 360;
      const distance = 80 + Math.random() * 140;
      const size = 4 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const dur = 600 + Math.random() * 500;

      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${color};
        left: -${size / 2}px;
        top: -${size / 2}px;
        opacity: 1;
        transition: transform ${dur}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
                    opacity ${dur * 0.8}ms ease-out ${dur * 0.2}ms;
      `;
      if (bloomContainer) bloomContainer.appendChild(p);

      // Trigger animation
      requestAnimationFrame(() => {
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * distance;
        const ty = Math.sin(rad) * distance;
        p.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        p.style.opacity = '0';
      });
    }
  }, 200);

  // 4. Fade to dark and reveal main site
  setTimeout(() => {
    if (fadeOverlay) fadeOverlay.classList.add('active');
  }, 600);

  setTimeout(() => {
    if (giftScreen) giftScreen.classList.add('hidden');
    // Clean up after transition
    setTimeout(() => {
      if (giftScreen) giftScreen.style.display = 'none';
    }, 900);
  }, 1200);
}

document.addEventListener("DOMContentLoaded", () => {

  // Select DOM Elements
  const overlay = document.getElementById("loading-overlay");
  const loadingFill = document.getElementById("loading-bar-fill");
  const loadingPct = document.getElementById("loading-percentage");
  
  const scenes = document.querySelectorAll(".scene");
  const dots = document.querySelectorAll(".dot");
  const dotsNav = document.getElementById("scene-dots");
  
  let currentScene = 0;
  let isAnimating = false;

  // ==========================================================
  // Preloader Logic — waits for gift intro to be dismissed
  // ==========================================================
  function startLoader() {
    let progress = 0;
    const fakeLoader = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) progress = 100;
      
      loadingFill.style.width = progress + "%";
      loadingPct.innerText = Math.floor(progress) + "%";

      if (progress === 100) {
        clearInterval(fakeLoader);
        setTimeout(() => {
          overlay.classList.add("hidden");
          dotsNav.classList.add("visible");
          initScene0();
        }, 500);
      }
    }, 300);
  }

  // Start loader after gift intro is dismissed (or immediately if no gift screen)
  const giftScreen = document.getElementById('gift-intro-screen');
  if (giftScreen && !giftScreen.classList.contains('hidden')) {
    // Watch for gift screen to be hidden
    const giftObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (giftScreen.classList.contains('hidden')) {
          giftObserver.disconnect();
          startLoader();
          break;
        }
      }
    });
    giftObserver.observe(giftScreen, { attributes: true, attributeFilter: ['class'] });
  } else {
    startLoader();
  }

  // ==========================================================
  // Scene Navigation
  // ==========================================================
  function goToScene(index) {
    if (isAnimating || index === currentScene || index < 0 || index >= scenes.length) return;
    isAnimating = true;

    const outgoing = scenes[currentScene];
    const incoming = scenes[index];

    // Update dots
    dots.forEach(d => d.classList.remove("active"));
    dots[index].classList.add("active");

    // Fade out outgoing
    gsap.to(outgoing, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        outgoing.classList.remove("active");
        
        // Prepare incoming
        incoming.classList.add("active");
        gsap.fromTo(incoming, { opacity: 0 }, {
          opacity: 1,
          duration: 0.8,
          onComplete: () => {
            currentScene = index;
            isAnimating = false;
            
            // Trigger specific scene animations
            if (index === 1) initScene1();
            if (index === 2) initScene2();
            if (index === 3) initScene3();
            if (index === 4) initScene4();
            if (index === 5) initScene5();
          }
        });
      }
    });
  }

  // Dots click event
  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => goToScene(idx));
  });

  // ==========================================================
  // Scene Specific Logic
  // ==========================================================

  // Scene 0: Intro
  function initScene0() {
    gsap.fromTo(".intro-title", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: "power3.out" });
    
    // Click anywhere to continue
    document.getElementById("scene-0").addEventListener("click", () => goToScene(1), { once: true });
  }

  // Scene 1: Countdown
  function initScene1() {
    const numEl = document.getElementById("countdown-num");
    const ringEl = document.getElementById("ring-progress-el");
    let count = 3;
    
    // Reset ring
    gsap.set(ringEl, { strokeDashoffset: 339.292 });

    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.innerText = count;
        gsap.to(ringEl, { strokeDashoffset: 339.292 - ((3 - count) / 3) * 339.292, duration: 1 });
      } else {
        clearInterval(countInterval);
        gsap.to(ringEl, { strokeDashoffset: 0, duration: 1 });
        setTimeout(() => goToScene(2), 1000);
      }
    }, 1000);
  }

  // Scene 2: Hero
  function initScene2() {
    gsap.fromTo(".hero-name", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 2, ease: "power2.out" });
    
    document.getElementById("hero-cta").addEventListener("click", () => goToScene(3), { once: true });
  }

  // Scene 3: Photo Grid
  function initScene3() {
    gsap.fromTo(".photo-frame", 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "back.out(1.7)", onComplete: () => {
        gsap.to("#photogrid-next", { opacity: 1, pointerEvents: "auto", y: -10, duration: 0.5 });
      }}
    );

    document.getElementById("photogrid-next").addEventListener("click", () => goToScene(4), { once: true });
  }

  // Scene 4: Message Slider
  let currentSlide = 0;
  function initScene4() {
    const track = document.getElementById("msgslider-track");
    const slides = document.querySelectorAll(".msg-slide");
    const prevBtn = document.getElementById("msgslider-prev");
    const nextBtn = document.getElementById("msgslider-next");
    const pips = document.querySelectorAll(".msgslider-pip");
    const continueBtn = document.getElementById("scene4-continue");

    function updateSlider() {
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      
      slides.forEach((s, i) => {
        if(i === currentSlide) s.classList.add("active");
        else s.classList.remove("active");
      });

      pips.forEach((p, i) => {
        if(i === currentSlide) p.classList.add("active");
        else p.classList.remove("active");
      });

      // Show continue button on last slide
      if (currentSlide === slides.length - 1) {
        gsap.to(continueBtn, { opacity: 1, pointerEvents: "auto", duration: 0.5 });
      }
    }

    nextBtn.onclick = () => {
      if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlider();
      }
    };

    prevBtn.onclick = () => {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlider();
      }
    };

    continueBtn.onclick = () => goToScene(5);
    updateSlider(); // Init
  }

  // Scene 5: Final
  function initScene5() {
    gsap.fromTo(".final-title", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 2, ease: "power3.out" });
    
    initFireworks();

    document.getElementById("replay-btn").addEventListener("click", () => {
      stopFireworks();
      goToScene(0);
    });
  }

  // ==========================================================
  // Fireworks Logic
  // ==========================================================
  const canvas = document.getElementById("fireworks-canvas");
  const ctx = canvas.getContext("2d");
  let fireworks = [];
  let particles = [];
  let animationFrameId;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  class Firework {
    constructor() {
      this.x = random(canvas.width * 0.1, canvas.width * 0.9);
      this.y = canvas.height;
      this.targetY = random(canvas.height * 0.1, canvas.height * 0.5);
      this.speed = random(8, 14);
      this.angle = Math.PI / 2 + random(-0.3, 0.3);
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = -Math.sin(this.angle) * this.speed;
      
      // Festive colors: Gold, Pink, Red, Purple, White
      const hues = [45, 330, 350, 280, 0];
      this.hue = hues[Math.floor(random(0, hues.length))]; 
      this.exploded = false;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.vy >= 0 || this.y <= this.targetY) {
        this.exploded = true;
        createParticles(this.x, this.y, this.hue);
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
      ctx.fill();
    }
  }

  class Particle {
    constructor(x, y, hue) {
      this.x = x;
      this.y = y;
      this.speed = random(1, 6);
      this.angle = random(0, Math.PI * 2);
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
      this.friction = 0.95;
      this.gravity = 0.1;
      this.hue = random(hue - 20, hue + 20);
      this.brightness = random(50, 80);
      this.alpha = 1;
      this.decay = random(0.015, 0.03);
    }
    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }
    draw() {
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function createParticles(x, y, hue) {
    let count = Math.floor(random(100, 200)); // Lebih banyak partikel per kembang api
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, hue));
    }
  }

  function loopFireworks() {
    // Fading trail effect agar kembang api terlihat bersinar
    ctx.fillStyle = 'rgba(4, 3, 10, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Frekuensi kembang api jauh lebih sering
    if (random(0, 100) < 20) {
      fireworks.push(new Firework());
      // Kadang-kadang muncul dua sekaligus
      if (random(0, 10) < 4) {
         fireworks.push(new Firework());
      }
    }

    fireworks = fireworks.filter(f => {
      f.update();
      if (!f.exploded) f.draw();
      return !f.exploded;
    });

    particles = particles.filter(p => {
      p.update();
      p.draw();
      return p.alpha > 0;
    });

    animationFrameId = requestAnimationFrame(loopFireworks);
  }

  function initFireworks() {
    resizeCanvas();
    fireworks = [];
    particles = [];
    loopFireworks();
  }

  function stopFireworks() {
    cancelAnimationFrame(animationFrameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fireworks = [];
    particles = [];
  }

});
