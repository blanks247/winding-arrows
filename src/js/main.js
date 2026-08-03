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
      if (nextId <= 500) {
        console.time(`LoadLevel-${nextId}`);
        const nextData = getLevel(nextId);
        ArrowGame.startLevel(nextData);
        console.timeEnd(`LoadLevel-${nextId}`);
        this.updateGlobalHUD();
      } else {
        alert("🎉 INCREDIBLE! You have unlocked and escaped all 500 polyline sectors!");
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

    // Scale to 500 levels
    const TOTAL_LEVELS = 500;
    const SPACING_Y = 70;
    const TOTAL_HEIGHT = TOTAL_LEVELS * SPACING_Y + 200; // Extra padding at top/bottom

    // Set the dynamic height of the map container
    grid.style.height = `${TOTAL_HEIGHT}px`;

    // Algorithmically generate the winding coordinates for 500 levels
    const coords = [];
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      // Sine wave pattern: centers around x=180, swings left and right with amplitude 90
      // We vary the frequency slightly to make it look organic
      const organicFrequency = 0.4 + Math.sin(i * 0.1) * 0.1;
      const x = 180 + Math.sin(i * organicFrequency) * 110; 
      
      // Bottom to top
      const y = TOTAL_HEIGHT - 100 - (i * SPACING_Y);
      
      coords.push({ id: i + 1, x, y });
    }

    // Create SVG overlay to draw curvy path line
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "saga-path-svg");
    svg.setAttribute("viewBox", `0 0 360 ${TOTAL_HEIGHT}`);
    svg.setAttribute("preserveAspectRatio", "none"); // Force path to stretch with screen width

    let dStr = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i-1];
      const curr = coords[i];
      const cy = (prev.y + curr.y) / 2;
      dStr += ` Q ${prev.x} ${cy}, ${curr.x} ${curr.y}`;
    }

    const pathBase = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathBase.setAttribute("d", dStr);
    pathBase.setAttribute("fill", "none");
    svg.appendChild(pathBase);

    const pathDash = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathDash.setAttribute("d", dStr);
    pathDash.setAttribute("fill", "none");
    pathDash.setAttribute("class", "path-dash");
    svg.appendChild(pathDash);

    grid.appendChild(svg);

    // Scale cute nature birds proportionally to map height
    const numBirds = Math.floor(TOTAL_HEIGHT / 250); // More birds!
    for (let i = 0; i < numBirds; i++) {
      const birdContainer = document.createElement('div');
      birdContainer.className = 'nature-bird';
      birdContainer.style.top = `${Math.random() * TOTAL_HEIGHT}px`;
      
      // Negative delay means they are already in motion when screen loads
      birdContainer.style.animationDelay = `-${Math.random() * 20}s`;
      birdContainer.style.animationDuration = `${12 + (Math.random() * 12)}s`;
      
      const isReverse = Math.random() > 0.5;
      if (isReverse) {
        birdContainer.style.animationDirection = 'reverse';
      }

      // We use an inline SVG so we can animate ONLY the wings using SVG <animate>
      // The path forms a classic 'V' bird. We animate the outer wing tips and control points.
      // Wings UP: M2 4 Q 7 10 12 12 Q 17 10 22 4
      // Wings DOWN: M2 16 Q 7 14 12 12 Q 17 14 22 16
      const flapSpeed = 0.4 + Math.random() * 0.4;
      const svgHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.75; transform: ${isReverse ? 'scaleX(-1)' : 'none'}">
          <path d="M2 4 Q 7 10 12 12 Q 17 10 22 4">
            <animate 
              attributeName="d" 
              values="M2 4 Q 7 10 12 12 Q 17 10 22 4; M2 16 Q 7 14 12 12 Q 17 14 22 16; M2 4 Q 7 10 12 12 Q 17 10 22 4" 
              dur="${flapSpeed}s" 
              repeatCount="indefinite" 
            />
          </path>
        </svg>
      `;
      
      birdContainer.innerHTML = svgHTML;
      grid.appendChild(birdContainer);
    }

    // Scale dreamy clouds proportionally to map height
    const numClouds = Math.floor(TOTAL_HEIGHT / 300);
    for (let i = 0; i < numClouds; i++) {
      const cloud = document.createElement('div');
      cloud.className = `nature-cloud ${i % 2 === 0 ? 'large' : 'small'}`;
      cloud.style.top = `${50 + (i * 300)}px`;
      cloud.style.animationDelay = `${i * 4}s`;
      cloud.style.animationDuration = `${40 + (Math.random() * 20)}s`;
      grid.appendChild(cloud);
    }

    // Create level selector badges
    for (let id = 1; id <= TOTAL_LEVELS; id++) {
      const coord = coords[id - 1];
      const card = document.createElement('div');
      card.className = 'level-card';
      // Use percentages so cards precisely follow the scaled SVG path on any screen width
      card.style.left = `${(coord.x / 360) * 100}%`;
      card.style.top = `${(coord.y / TOTAL_HEIGHT) * 100}%`;

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
          <div class="level-num" style="opacity: 0.5; font-size: 1.1rem;">${id}</div>
          <div class="level-stars">🔒</div>
        `;
      } else if (isCleared) {
        card.innerHTML = `
          <div class="level-num">${id}</div>
        `;
      } else {
        // active-unlocked
        card.innerHTML = `
          <div class="level-num" style="font-size: 1.6rem; margin-top: 4px;">${id}</div>
          <div class="level-stars" style="color: #ffffff; font-weight: bold; font-size: 0.8rem; letter-spacing: 1px;">PLAY</div>
        `;
      }

      if (isUnlocked) {
        card.addEventListener('click', () => {
          console.time(`LoadLevel-${id}`);
          const lvl = getLevel(id);
          this.showScreen('gameplay-screen');
          ArrowGame.startLevel(lvl);
          console.timeEnd(`LoadLevel-${id}`);
        });
      }
      grid.appendChild(card);
    }

    // Auto-scroll to the current active level
    setTimeout(() => {
      const activeCard = grid.querySelector('.level-card.active-unlocked');
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback to bottom if no active level found
        const scrollArea = document.querySelector('.levels-scroll-area');
        if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
      }
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
