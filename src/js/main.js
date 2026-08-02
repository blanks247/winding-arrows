// Winding Arrows - Standalone Main Controller

const App = {
  activeScreen: 'menu-screen',
  clearedLevels: [],

  init() {
    ArrowGame.init();
    this.loadProgress();
    this.bindEvents();
    this.renderLevelSelect();
    this.renderShop();
    this.updateGlobalHUD();

    // Intercept native Android device Back Key triggers
    window.onAndroidBack = () => {
      if (this.activeScreen === 'gameplay-screen') {
        this.showScreen('level-select-screen');
        this.renderLevelSelect();
        return "handled";
      } else if (this.activeScreen === 'level-select-screen' || this.activeScreen === 'shop-screen') {
        this.showScreen('menu-screen');
        return "handled";
      }
      return "exit";
    };
  },

  loadProgress() {
    this.clearedLevels = JSON.parse(localStorage.getItem('winding_cleared_levels')) || [];
  },

  showScreen(screenId) {
    SoundSystem.playSelect();
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.activeScreen = screenId;
    }

    if (screenId === 'menu-screen') {
      this.updateGlobalHUD();
    }
  },

  updateGlobalHUD() {
    document.getElementById('menu-tokens-count').textContent = ArrowGame.tokens;
    document.getElementById('shop-tokens-count').textContent = ArrowGame.tokens;
  },

  bindEvents() {
    document.getElementById('btn-play').addEventListener('click', () => this.showScreen('level-select-screen'));
    document.getElementById('btn-shop').addEventListener('click', () => {
      this.renderShop();
      this.showScreen('shop-screen');
    });

    document.getElementById('btn-level-back').addEventListener('click', () => this.showScreen('menu-screen'));
    document.getElementById('btn-shop-back').addEventListener('click', () => this.showScreen('menu-screen'));

    // Game Inputs
    document.getElementById('btn-undo').addEventListener('click', () => ArrowGame.undoMove());
    document.getElementById('btn-hint').addEventListener('click', () => ArrowGame.triggerHint());

    // Restart level direct button
    document.getElementById('btn-restart-game-direct').addEventListener('click', () => {
      SoundSystem.playSelect();
      ArrowGame.startLevel(ArrowGame.level);
    });

    // Colorblind toggle button
    document.getElementById('btn-colorblind').addEventListener('click', () => {
      SoundSystem.playSelect();
      ArrowGame.colorBlindMode = !ArrowGame.colorBlindMode;
      const btn = document.getElementById('btn-colorblind');
      if (ArrowGame.colorBlindMode) {
        btn.style.background = '#6ab5b4';
        btn.style.color = '#ffffff';
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    });

    // Pause button float
    document.getElementById('btn-game-pause').addEventListener('click', () => {
      SoundSystem.playSelect();
      ArrowGame.active = false;
      document.getElementById('pause-overlay').classList.add('active');
    });

    document.getElementById('btn-resume-game').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('pause-overlay').classList.remove('active');
      ArrowGame.active = true;
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('pause-overlay').classList.remove('active');
      ArrowGame.startLevel(ArrowGame.level);
    });

    document.getElementById('btn-exit-game').addEventListener('click', () => {
      this.showScreen('menu-screen');
    });

    // Victory overlays
    document.getElementById('btn-next-level').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('victory-overlay').classList.remove('active');
      
      const nextId = ArrowGame.level.id + 1;
      if (nextId <= 20) {
        const nextData = getLevel(nextId);
        ArrowGame.startLevel(nextData);
        this.updateGlobalHUD();
      } else {
        alert("🎉 INCREDIBLE! You have unlocked and escaped all 20 polyline sectors!");
        this.showScreen('level-select-screen');
        this.renderLevelSelect();
      }
    });

    document.getElementById('btn-victory-retry').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('victory-overlay').classList.remove('active');
      ArrowGame.startLevel(ArrowGame.level);
    });

    document.getElementById('btn-victory-menu').addEventListener('click', () => {
      document.getElementById('victory-overlay').classList.remove('active');
      this.showScreen('level-select-screen');
      this.renderLevelSelect();
    });

    // Game Over overlays
    document.getElementById('btn-retry-level').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('gameover-overlay').classList.remove('active');
      ArrowGame.startLevel(ArrowGame.level);
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      document.getElementById('gameover-overlay').classList.remove('active');
      this.showScreen('level-select-screen');
      this.renderLevelSelect();
    });

    // Deadlock overlays
    document.getElementById('btn-deadlock-retry').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('deadlock-overlay').classList.remove('active');
      ArrowGame.startLevel(ArrowGame.level);
    });

    document.getElementById('btn-deadlock-menu').addEventListener('click', () => {
      document.getElementById('deadlock-overlay').classList.remove('active');
      this.showScreen('level-select-screen');
      this.renderLevelSelect();
    });
  },

  renderLevelSelect() {
    this.loadProgress();
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';

    // Winding coordinates for Candy Crush Saga Map (connecting 20 levels)
    const coords = [
      { x: 180, y: 1400 }, // Level 1 (bottom center)
      { x: 90,  y: 1330 }, // Level 2
      { x: 126, y: 1260 }, // Level 3
      { x: 270, y: 1190 }, // Level 4
      { x: 180, y: 1120 }, // Level 5
      { x: 72,  y: 1050 }, // Level 6
      { x: 162, y: 980 },  // Level 7
      { x: 288, y: 910 },  // Level 8
      { x: 198, y: 840 },  // Level 9
      { x: 108, y: 770 },  // Level 10
      { x: 180, y: 700 },  // Level 11
      { x: 250, y: 630 },  // Level 12
      { x: 200, y: 560 },  // Level 13
      { x: 90,  y: 490 },  // Level 14
      { x: 180, y: 420 },  // Level 15
      { x: 270, y: 350 },  // Level 16
      { x: 150, y: 280 },  // Level 17
      { x: 80,  y: 210 },  // Level 18
      { x: 180, y: 140 },  // Level 19
      { x: 270, y: 70 }    // Level 20 (top)
    ];

    // Create SVG overlay to draw curvy path line
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "saga-path-svg");
    svg.setAttribute("viewBox", "0 0 360 1460");

    let dStr = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i-1];
      const curr = coords[i];
      const cy = (prev.y + curr.y) / 2;
      dStr += ` Q ${prev.x} ${cy}, ${curr.x} ${curr.y}`;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", dStr);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffd066");
    path.setAttribute("stroke-width", "6");
    path.setAttribute("stroke-dasharray", "8, 8");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
    grid.appendChild(svg);

    // Create level selector badges
    for (let id = 1; id <= 20; id++) {
      const coord = coords[id - 1];
      const card = document.createElement('div');
      card.className = 'level-card';
      card.style.left = `${coord.x}px`;
      card.style.top = `${coord.y}px`;

      const isFirst = id === 1;
      const isUnlocked = isFirst || this.clearedLevels.includes(id - 1);
      const isCleared = this.clearedLevels.includes(id);

      if (isCleared) {
        card.classList.add('cleared');
      } else if (isUnlocked) {
        card.classList.add('active-unlocked');
      } else {
        card.classList.add('locked');
      }

      if (!isUnlocked) {
        card.innerHTML = `
          <div class="level-num" style="opacity: 0.5;">${id}</div>
          <div class="level-stars">🔒</div>
        `;
      } else {
        card.innerHTML = `
          <div class="level-num">${id}</div>
          <div class="level-stars">${isCleared ? "★★★" : "☆☆☆"}</div>
        `;
        card.addEventListener('click', () => {
          const lvl = getLevel(id);
          this.showScreen('gameplay-screen');
          ArrowGame.startLevel(lvl);
        });
      }
      grid.appendChild(card);
    }

    // Scroll level selection grid to bottom to center Level 1 initially
    setTimeout(() => {
      grid.scrollTop = 760;
    }, 50);
  },

  renderShop() {
    const container = document.querySelector('.shop-items-container');
    container.innerHTML = '';

    const upgradeList = [
      {
        key: 'undo',
        name: 'Auto-Core Recharge',
        desc: 'Unlocks advanced energy-undo recovery pools.',
        cost: 150,
        purchased: localStorage.getItem('winding_upg_undo') === 'true'
      },
      {
        key: 'hints',
        name: 'Target Scan Decoders',
        desc: 'Unlocks instant flash scanning to identify free polylines.',
        cost: 200,
        purchased: localStorage.getItem('winding_upg_hints') === 'true'
      }
    ];

    upgradeList.forEach(upg => {
      const card = document.createElement('div');
      card.className = 'shop-item-card';

      const btnText = upg.purchased ? 'OWNED' : `🔋 ${upg.cost}`;

      card.innerHTML = `
        <div class="shop-item-info">
          <h3>${upg.name}</h3>
          <p>${upg.desc}</p>
        </div>
        <button class="btn btn-primary buy-btn" ${upg.purchased || ArrowGame.tokens < upg.cost ? 'disabled' : ''}>
          ${btnText}
        </button>
      `;

      const buyBtn = card.querySelector('.buy-btn');
      if (buyBtn && !upg.purchased) {
        buyBtn.addEventListener('click', () => {
          if (ArrowGame.tokens >= upg.cost) {
            ArrowGame.tokens -= upg.cost;
            localStorage.setItem(`winding_upg_${upg.key}`, 'true');
            ArrowGame.saveData();
            SoundSystem.playSelect();
            this.updateGlobalHUD();
            this.renderShop();
          }
        });
      }

      container.appendChild(card);
    });
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
