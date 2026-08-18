// Winding Arrows - Standalone Main Controller

const App = {
  activeScreen: 'menu-screen',
  clearedLevels: [],
  sfxEnabled: true,
  musicEnabled: true,

  init() {
    this.sfxEnabled = localStorage.getItem('winding_arrows_sfx') !== 'false';
    this.musicEnabled = localStorage.getItem('winding_arrows_music') !== 'false';
    this.updateSettingsUI();

    ArrowGame.init();
    this.loadProgress();
    this.bindEvents();
    this.renderLevelSelect();

    // Auto-transition from Splash Screen to Main Menu after 1.6s
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      const menu = document.getElementById('menu-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.classList.remove('active');
          splash.style.display = 'none';
          if (menu) menu.classList.add('active');
        }, 500);
      }
    }, 1600);

    // Start background music continuously from game opening onwards on first user interaction
    const startAppBGM = () => {
      if (this.musicEnabled && typeof SoundSystem !== 'undefined') {
        SoundSystem.playTrainMusic();
      }
    };
    window.addEventListener('pointerdown', startAppBGM, { once: true });
    window.addEventListener('touchstart', startAppBGM, { once: true });
    window.addEventListener('click', startAppBGM, { once: true });

    // Pause background audio & auto-open Pause popover when app goes to background / power button pressed
    const handleVisibilityOrPause = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        if (typeof SoundSystem !== 'undefined' && SoundSystem.stopTrainMusic) {
          SoundSystem.stopTrainMusic();
        }
        if (typeof SoundSystem !== 'undefined' && SoundSystem.ctx && SoundSystem.ctx.state === 'running') {
          SoundSystem.ctx.suspend();
        }
        // Auto-open Pause Popover if in active gameplay
        if (this.activeScreen === 'gameplay-screen') {
          const pauseOverlay = document.getElementById('pause-overlay');
          if (pauseOverlay) pauseOverlay.classList.add('active');
        }
      } else {
        if (typeof SoundSystem !== 'undefined' && SoundSystem.ctx && SoundSystem.ctx.state === 'suspended') {
          SoundSystem.ctx.resume();
        }
        if (this.musicEnabled && typeof SoundSystem !== 'undefined' && SoundSystem.playTrainMusic) {
          SoundSystem.playTrainMusic();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrPause);
    window.addEventListener('pagehide', handleVisibilityOrPause);
    window.addEventListener('blur', handleVisibilityOrPause);
    window.addEventListener('focus', handleVisibilityOrPause);

    // Intercept native Android device Back Key & Gesture Navigation triggers
    const handleBackButton = () => {
      const activeScreen = this.activeScreen;
      const pauseOverlay = document.getElementById('pause-overlay');
      const settingsOverlay = document.getElementById('settings-overlay');
      const levelCompleteOverlay = document.getElementById('level-complete-overlay');

      // 1. If any overlay is active, close overlay first
      if (settingsOverlay && settingsOverlay.classList.contains('active')) {
        settingsOverlay.classList.remove('active');
        return "handled";
      }
      if (pauseOverlay && pauseOverlay.classList.contains('active')) {
        pauseOverlay.classList.remove('active');
        return "handled";
      }
      if (levelCompleteOverlay && levelCompleteOverlay.classList.contains('active')) {
        levelCompleteOverlay.classList.remove('active');
        this.showScreen('level-select-screen');
        this.renderLevelSelect();
        return "handled";
      }

      // 2. Screen navigation hierarchy: Gameplay -> Level Select -> Main Menu -> Exit
      if (activeScreen === 'gameplay-screen') {
        this.showScreen('level-select-screen');
        this.renderLevelSelect();
        return "handled";
      } else if (activeScreen === 'level-select-screen' || activeScreen === 'shop-screen') {
        this.showScreen('menu-screen');
        return "handled";
      } else if (activeScreen === 'menu-screen') {
        return "exit";
      }

      return "handled";
    };

    window.onAndroidBack = handleBackButton;

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const { App: CapApp } = window.Capacitor.Plugins;
      CapApp.addListener('appStateChange', () => {
        handleVisibilityOrPause();
      });
      CapApp.addListener('backButton', () => {
        const res = handleBackButton();
        if (res === 'exit') {
          CapApp.exitApp();
        }
      });
    }
  },

  loadProgress() {
    this.clearedLevels = JSON.parse(localStorage.getItem('winding_cleared_levels')) || [];
  },

  getCurrentUnlockedLevelId() {
    this.loadProgress();
    if (!this.clearedLevels || this.clearedLevels.length === 0) return 1;
    const maxCleared = Math.max(...this.clearedLevels);
    return Math.min(500, maxCleared + 1);
  },

  scrollToCurrentLevel(smooth = true) {
    const scrollArea = document.querySelector('.levels-scroll-area');
    const grid = document.getElementById('levels-grid');
    if (!scrollArea || !grid) return;

    const activeCard = grid.querySelector('.level-card.active-unlocked') || grid.querySelector('.level-card');
    if (activeCard) {
      const cardTop = activeCard.offsetTop;
      const containerHeight = scrollArea.clientHeight;
      const targetScroll = Math.max(0, cardTop - containerHeight / 2 + activeCard.offsetHeight / 2);

      scrollArea.scrollTo({
        top: targetScroll,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
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
    } else if (screenId === 'level-select-screen') {
      this.renderLevelSelect();
      // Ensure view lands dynamically at current level area under any scenario
      requestAnimationFrame(() => {
        this.scrollToCurrentLevel(false);
        setTimeout(() => this.scrollToCurrentLevel(true), 80);
      });
    }
  },

  updateGlobalHUD() {
  },

  updateSettingsUI() {
    const btnToggleSfx = document.getElementById('btn-toggle-sfx');
    const btnToggleMusic = document.getElementById('btn-toggle-music');
    const btnToggleSfxPause = document.getElementById('btn-toggle-sfx-pause');
    const btnToggleMusicPause = document.getElementById('btn-toggle-music-pause');

    const updateBtn = (btn, enabled) => {
      if (!btn) return;
      btn.textContent = enabled ? "ON" : "OFF";
      btn.style.backgroundColor = enabled ? "#b9fbc0" : "#e5e5e5";
      btn.style.color = enabled ? "#276749" : "#666";
      btn.style.border = "none";
      btn.style.borderRadius = "20px";
      btn.style.padding = "6px 16px";
      btn.style.fontWeight = "bold";
      btn.style.boxShadow = "inset 0 -2px 0 rgba(0,0,0,0.1)";
      btn.style.cursor = "pointer";
      btn.style.transition = "all 0.2s ease";
    };

    updateBtn(btnToggleSfx, this.sfxEnabled);
    updateBtn(btnToggleSfxPause, this.sfxEnabled);
    updateBtn(btnToggleMusic, this.musicEnabled);
    updateBtn(btnToggleMusicPause, this.musicEnabled);
    if (typeof SoundSystem !== 'undefined') {
      SoundSystem.sfxEnabled = this.sfxEnabled;
      SoundSystem.musicEnabled = this.musicEnabled;
      if (!this.musicEnabled && SoundSystem.stopTrainMusic) {
        SoundSystem.stopTrainMusic();
      } else if (this.musicEnabled && SoundSystem.playTrainMusic) {
        SoundSystem.playTrainMusic();
      }
    }
  },

  bindEvents() {
    document.getElementById('btn-play').addEventListener('click', () => this.showScreen('level-select-screen'));
    document.getElementById('btn-level-back').addEventListener('click', () => this.showScreen('menu-screen'));

    // Floating Action Button (FAB) listener
    const fabBtn = document.getElementById('fab-current-level');
    if (fabBtn) {
      fabBtn.addEventListener('click', () => {
        SoundSystem.playSelect();
        const curId = this.getCurrentUnlockedLevelId();
        this.scrollToCurrentLevel(true);
        setTimeout(() => {
          const lvl = getLevel(curId);
          this.showScreen('gameplay-screen');
          ArrowGame.startLevel(lvl);
        }, 150);
      });
    }

    // Train Speed & Horn Control Pill Listeners
    const speedToggleBtn = document.getElementById('btn-train-speed-toggle');
    if (speedToggleBtn) {
      speedToggleBtn.addEventListener('click', () => {
        SoundSystem.playSelect();
        const speeds = [1.0, 1.5, 2.0, 0.5];
        const curSpd = ArrowGame.trainSpeedMultiplier || 1.0;
        let nextIdx = (speeds.indexOf(curSpd) + 1) % speeds.length;
        if (nextIdx === -1) nextIdx = 0;
        
        const newSpd = speeds[nextIdx];
        ArrowGame.trainSpeedMultiplier = newSpd;
        
        const valEl = document.getElementById('train-speed-val');
        const iconEl = speedToggleBtn.querySelector('.pill-icon');
        if (valEl) valEl.textContent = `${newSpd.toFixed(1)}x`;
        if (iconEl) iconEl.textContent = newSpd === 0.5 ? '🐢' : '⚡';
      });
    }

    const btnHorn = document.getElementById('btn-train-horn');
    if (btnHorn) {
      btnHorn.addEventListener('click', () => {
        SoundSystem.playTrainHorn();
        ArrowGame.shakeIntensity = 3.5;
      });
    }

    // Train Walkthrough Navigation Listeners
    const btnWtNext1 = document.getElementById('btn-wt-next-1');
    if (btnWtNext1) {
      btnWtNext1.addEventListener('click', () => {
        SoundSystem.playSelect();
        document.getElementById('wt-step-1').classList.remove('active');
        document.getElementById('wt-step-2').classList.add('active');
        document.getElementById('wt-dot-1').classList.remove('active');
        document.getElementById('wt-dot-2').classList.add('active');
      });
    }

    const btnWtDemoTap = document.getElementById('btn-wt-demo-tap');
    if (btnWtDemoTap) {
      btnWtDemoTap.addEventListener('click', () => {
        SoundSystem.playSelect();
        const carriage = document.getElementById('demo-carriage');
        const arrow = document.getElementById('demo-arrow');
        const next2Btn = document.getElementById('btn-wt-next-2');

        if (carriage) carriage.style.left = '100px';
        setTimeout(() => {
          if (arrow) arrow.style.bottom = '52px';
          SoundSystem.playWin();
          setTimeout(() => {
            if (arrow) arrow.style.opacity = '0';
            if (btnWtDemoTap) btnWtDemoTap.style.display = 'none';
            if (next2Btn) next2Btn.style.display = 'block';
          }, 400);
        }, 300);
      });
    }

    const btnWtNext2 = document.getElementById('btn-wt-next-2');
    if (btnWtNext2) {
      btnWtNext2.addEventListener('click', () => {
        SoundSystem.playSelect();
        document.getElementById('wt-step-2').classList.remove('active');
        document.getElementById('wt-step-3').classList.add('active');
        document.getElementById('wt-dot-2').classList.remove('active');
        document.getElementById('wt-dot-3').classList.add('active');
      });
    }

    const btnWtStartGame = document.getElementById('btn-wt-start-game');
    if (btnWtStartGame) {
      btnWtStartGame.addEventListener('click', () => {
        SoundSystem.playSelect();
        document.getElementById('train-walkthrough-overlay').classList.remove('active');
        localStorage.setItem('winding_arrows_train_walkthrough_completed', 'true');
        ArrowGame.active = true;
      });
    }

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('settings-overlay').classList.add('active');
    });
    
    document.getElementById('btn-settings-close').addEventListener('click', () => {
      SoundSystem.playSelect();
      document.getElementById('settings-overlay').classList.remove('active');
    });
    
    // Close overlays when clicking outside the card
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          if (overlay.id === 'settings-overlay') {
            SoundSystem.playSelect();
            overlay.classList.remove('active');
          } else if (overlay.id === 'pause-overlay') {
            SoundSystem.playSelect();
            overlay.classList.remove('active');
            ArrowGame.active = true;
          }
        }
      });
    });

    const toggleSfx = () => {
      this.sfxEnabled = !this.sfxEnabled;
      localStorage.setItem('winding_arrows_sfx', this.sfxEnabled);
      this.updateSettingsUI();
      SoundSystem.playSelect();
    };

    const toggleMusic = () => {
      this.musicEnabled = !this.musicEnabled;
      localStorage.setItem('winding_arrows_music', this.musicEnabled);
      this.updateSettingsUI();
      SoundSystem.playSelect();
    };

    document.getElementById('btn-toggle-sfx').addEventListener('click', toggleSfx);
    document.getElementById('btn-toggle-music').addEventListener('click', toggleMusic);
    
    const pauseToggleSfx = document.getElementById('btn-toggle-sfx-pause');
    if (pauseToggleSfx) pauseToggleSfx.addEventListener('click', toggleSfx);
    
    const pauseToggleMusic = document.getElementById('btn-toggle-music-pause');
    if (pauseToggleMusic) pauseToggleMusic.addEventListener('click', toggleMusic);

// Google AdMob Rewarded Ads Manager (Ready for Future Activation)
const AdMobManager = {
  adMobEnabled: false, // Change to true when ready to show AdMob ads!
  rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded Ad Unit ID

  async showRewardedAdForHint(onRewardCallback) {
    if (this.adMobEnabled && window.Capacitor && window.Capacitor.isPluginAvailable('AdMob')) {
      try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.prepareRewardVideoAd({ adId: this.rewardedAdUnitId });
        await AdMob.showRewardVideoAd();
        if (onRewardCallback) onRewardCallback();
      } catch (err) {
        console.log('AdMob ad fallback:', err);
        if (onRewardCallback) onRewardCallback();
      }
    } else {
      if (onRewardCallback) onRewardCallback();
    }
  }
};

    // Game Inputs
    document.getElementById('btn-undo').addEventListener('click', () => ArrowGame.undoMove());
    document.getElementById('btn-hint').addEventListener('click', () => {
      AdMobManager.showRewardedAdForHint(() => {
        ArrowGame.triggerHint();
      });
    });

    // Restart level direct button
    document.getElementById('btn-restart-game-direct').addEventListener('click', () => {
      SoundSystem.playSelect();
      ArrowGame.startLevel(ArrowGame.level);
    });

    // Grid toggle button
    document.getElementById('btn-grid-toggle').addEventListener('click', () => {
      SoundSystem.playSelect();
      ArrowGame.toggleGrid();
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
      SoundSystem.playSelect();
      document.getElementById('pause-overlay').classList.remove('active');
      this.showScreen('level-select-screen');
      this.renderLevelSelect();
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

    // Update Floating Action Button text with current unlocked level number
    const currentId = this.getCurrentUnlockedLevelId();
    const fabNum = document.getElementById('fab-level-num');
    if (fabNum) {
      fabNum.textContent = currentId;
    }

    // Auto-scroll to center on the current active level card
    requestAnimationFrame(() => {
      this.scrollToCurrentLevel(false);
      setTimeout(() => this.scrollToCurrentLevel(true), 80);
    });
  }
};

window.resetTrainTutorial = function() {
  localStorage.removeItem('winding_arrows_realtime_tutorial_done');
  localStorage.removeItem('winding_arrows_ingame_tutorial_done');
  localStorage.removeItem('winding_arrows_train_walkthrough_completed');
  alert('✨ Train Walkthrough reset for Level 4!');
};

window.addEventListener('DOMContentLoaded', () => App.init());
