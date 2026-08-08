// Winding Arrows - Standalone Game & Collision Solver

const SoundSystem = {
  ctx: null,

  init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (e) {
      console.warn("AudioContext initialization blocked or unsupported:", e);
    }
  },

  playSelect() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      console.warn("Audio playback select failed:", e);
    }
  },

  playWhoosh() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Audio playback whoosh failed:", e);
    }
  },

  playBuzzer() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio playback buzzer failed:", e);
    }
  },

  playWin() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch (e) {
      console.warn("Audio playback win failed:", e);
    }
  }
};

const ArrowGame = {
  canvas: null,
  ctx: null,
  active: false,
  level: null,

  arrows: [],
  particles: [],
  history: [],
  movesCount: 0,
  tokens: 0,

  generateSmoothPath(path) {
    if (path.length < 2) return path.map(p => ({ ...p }));
    const smooth = [];
    const R_MAX = 20; // Corner rounding pixel radius
    smooth.push({ ...path[0] });

    for (let i = 1; i < path.length - 1; i++) {
      const p1 = path[i - 1];
      const p2 = path[i];
      const p3 = path[i + 1];

      const len1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const len2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
      const R = Math.min(R_MAX, len1 * 0.45, len2 * 0.45);

      const pStart = {
        x: p2.x - (p2.x - p1.x) * (R / len1),
        y: p2.y - (p2.y - p1.y) * (R / len1)
      };
      const pEnd = {
        x: p2.x + (p3.x - p2.x) * (R / len2),
        y: p2.y + (p3.y - p2.y) * (R / len2)
      };

      smooth.push(pStart);

      const steps = 8;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const mt = 1 - t;
        smooth.push({
          x: mt * mt * pStart.x + 2 * mt * t * p2.x + t * t * pEnd.x,
          y: mt * mt * pStart.y + 2 * mt * t * p2.y + t * t * pEnd.y
        });
      }
      smooth.push(pEnd);
    }
    smooth.push({ ...path[path.length - 1] });

    return smooth.filter((p, idx, arr) => {
      if (idx === 0) return true;
      const prev = arr[idx - 1];
      return Math.hypot(p.x - prev.x, p.y - prev.y) > 0.1;
    });
  },

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.loadSaveData();
    this.setupInput();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.loop();
  },

  resizeCanvas() {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;
    const wrapperW = wrapper.clientWidth;
    const wrapperH = wrapper.clientHeight;
    // Logical canvas dimensions (game world always runs at these coords)
    const logicalW = 360;
    const logicalH = 460;
    const scale = Math.min(wrapperW / logicalW, wrapperH / logicalH, 1);
    // Apply CSS scaling to fit the wrapper without distortion
    this.canvas.style.width  = Math.floor(logicalW * scale) + 'px';
    this.canvas.style.height = Math.floor(logicalH * scale) + 'px';
  },

  loadSaveData() {
    this.tokens = parseInt(localStorage.getItem('winding_tokens')) || 0;
  },

  saveData() {
    localStorage.setItem('winding_tokens', this.tokens);
  },

  startLevel(lvlData) {
    this.level = lvlData;
    this.active = true;
    this.particles = [];
    this.history = [];
    this.movesCount = 0;
    this.hoveredArrowId = null;
    this.hearts = 3;
    this.shakeIntensity = 0;

    // Hide failure overlays
    document.getElementById('gameover-overlay').classList.remove('active');

    // Advanced puzzle elements initialization
    this.carts = lvlData.carts ? lvlData.carts.map(c => ({ ...c })) : [];
    this.reflectors = lvlData.reflectors ? lvlData.reflectors.map(r => ({ ...r })) : [];
    this.splitters = lvlData.splitters ? lvlData.splitters.map(s => ({ ...s })) : [];
    this.crumblingTiles = lvlData.crumblingTiles ? lvlData.crumblingTiles.map(ct => ({ ...ct, maxDurability: ct.durability })) : [];
    this.switches = lvlData.switches ? lvlData.switches.map(sw => ({ ...sw })) : [];
    this.laserBarriers = lvlData.laserBarriers ? lvlData.laserBarriers.map(lb => ({ ...lb })) : [];
    this.timedGates = lvlData.timedGates ? lvlData.timedGates.map(tg => ({ ...tg })) : [];
    this.portals = lvlData.portals ? lvlData.portals.map(p => ({ ...p })) : [];

    // Deep copy level arrows
    this.arrows = lvlData.arrows.map(a => {
      const path = a.path.map(p => ({ x: p.x, y: p.y }));
      const smoothPath = this.generateSmoothPath(path);
      return {
        id: a.id,
        color: a.color,
        strokeWidth: a.strokeWidth,
        speed: a.speed,
        path,
        smoothPath,
        status: 'IDLE',
        ghost: a.ghost || false,
        // Animation variables
        progress: 0,
        squeezeFactor: 1.0,
        bumpTime: 0
      };
    });

    this.trainPos = 0;
    this.trainSpeedMultiplier = 1.0;
    this.smokeParticles = [];

    // Setup speed control visibility
    this.trainSpeedMultiplier = 1.0;
    const speedRow = document.getElementById('train-speed-control-row');
    const hudSpeedText = document.getElementById('hud-train-speed');
    if (speedRow) {
      speedRow.style.display = (lvlData.id === 10 || lvlData.id === 20 || lvlData.id === 30 || lvlData.id === 16) ? 'flex' : 'none';
    }
    if (hudSpeedText) {
      hudSpeedText.textContent = '1.0x';
    }

    // Level 10 Train Walkthrough Tutorial triggering
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    if (lvlData.id === 10 && !localStorage.getItem('winding_arrows_train_tutorial_shown')) {
      if (tutorialOverlay) {
        tutorialOverlay.classList.add('active');
      }
      this.active = false; // Pause gameplay loops/input interaction
    } else {
      if (tutorialOverlay) {
        tutorialOverlay.classList.remove('active');
      }
    }

    this.updateHUD();
  },

  setupInput() {
    this.lastTapTime = 0;
    const handleTap = (e) => {
      if (!this.active) return;

      // Debounce rapid double taps to prevent multiple triggers in short intervals
      const now = Date.now();
      if (now - this.lastTapTime < 100) return;
      this.lastTapTime = now;

      SoundSystem.init();

      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const tx = ((clientX - rect.left) / rect.width) * this.canvas.width;
      const ty = ((clientY - rect.top) / rect.height) * this.canvas.height;

      // Find nearest arrow body
      const tapped = this.getArrowAtPosition(tx, ty);
      if (tapped && tapped.status === 'IDLE') {
        this.attemptEscape(tapped);
      }
    };

    const handleMove = (e) => {
      if (!this.active) return;
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const tx = ((clientX - rect.left) / rect.width) * this.canvas.width;
      const ty = ((clientY - rect.top) / rect.height) * this.canvas.height;

      const hovered = this.getArrowAtPosition(tx, ty);
      this.hoveredArrowId = hovered ? hovered.id : null;
    };

    this.canvas.addEventListener('click', handleTap);
    this.canvas.addEventListener('mousemove', handleMove);

    // Use active touch listeners to prevent default zooming/scrolling delays
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(e); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });

    // Speed controls listeners
    const btnDecrease = document.getElementById('btn-speed-decrease');
    const btnIncrease = document.getElementById('btn-speed-increase');
    const hudSpeedText = document.getElementById('hud-train-speed');

    if (btnDecrease) {
      btnDecrease.addEventListener('click', () => {
        SoundSystem.init();
        SoundSystem.playSelect();
        this.trainSpeedMultiplier = Math.max(0.5, this.trainSpeedMultiplier - 0.5);
        if (hudSpeedText) {
          hudSpeedText.textContent = `${this.trainSpeedMultiplier.toFixed(1)}x`;
        }
      });
    }

    if (btnIncrease) {
      btnIncrease.addEventListener('click', () => {
        SoundSystem.init();
        SoundSystem.playSelect();
        this.trainSpeedMultiplier = Math.min(3.0, this.trainSpeedMultiplier + 0.5);
        if (hudSpeedText) {
          hudSpeedText.textContent = `${this.trainSpeedMultiplier.toFixed(1)}x`;
        }
      });
    }

    // Tutorial close button listener
    const btnTutorialClose = document.getElementById('btn-tutorial-close');
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    if (btnTutorialClose) {
      btnTutorialClose.addEventListener('click', () => {
        SoundSystem.init();
        SoundSystem.playSelect();
        if (tutorialOverlay) {
          tutorialOverlay.classList.remove('active');
        }
        localStorage.setItem('winding_arrows_train_tutorial_shown', 'true');
        this.active = true; // resume loops and inputs
      });
    }
  },

  getArrowAtPosition(x, y) {
    let nearest = null;
    let minDist = 18; // Generous tap selection radius (18px)

    this.arrows.forEach(a => {
      if (a.status !== 'IDLE') return;

      // Check distance from point to all smooth path segments
      for (let i = 0; i < a.smoothPath.length - 1; i++) {
        const d = this.distToSegment({ x, y }, a.smoothPath[i], a.smoothPath[i + 1]);
        const hitWidth = 14 * a.strokeWidth; // Tap hitbox expanded to cover full visual width plus margins
        if (d < hitWidth && d < minDist) {
          minDist = d;
          nearest = a;
        }
      }
    });

    return nearest;
  },

  isBendingArrow(a) {
    if (!a || !a.path || a.path.length < 2) return false;
    const first = a.path[0];
    let hasXVariation = false;
    let hasYVariation = false;
    for (let i = 1; i < a.path.length; i++) {
      if (Math.abs(a.path[i].x - first.x) > 0.1) hasXVariation = true;
      if (Math.abs(a.path[i].y - first.y) > 0.1) hasYVariation = true;
    }
    return hasXVariation && hasYVariation;
  },

  getArrowLength(a) {
    let base = 38;
    if (this.isBendingArrow(a)) {
      base = 48;
    }
    let arrowLength = base * a.strokeWidth;
    if (this.level && this.level.isMaze) {
      if (!a.initialLength) {
        a.initialLength = this.getPathLength(this.generateSmoothPath(a.path));
      }
      arrowLength = a.initialLength;
    }
    return arrowLength;
  },

  getMovingArrowLength(a) {
    let base = 28;
    if (this.isBendingArrow(a)) {
      base = 38;
    }
    let movingArrowLength = base * a.strokeWidth;
    if (this.level && this.level.isMaze) {
      if (!a.initialLength) {
        a.initialLength = this.getPathLength(this.generateSmoothPath(a.path));
      }
      movingArrowLength = a.initialLength;
    }
    return movingArrowLength;
  },

  checkCollisionAtProgress(movingArrow, progress) {
    const pitch = GRID_COORDS.pitch;
    const offsetX = GRID_COORDS.offsetX;
    const offsetY = GRID_COORDS.offsetY;

    // Get the head point of the moving arrow at this progress
    const movingArrowLength = this.getMovingArrowLength(movingArrow);
    const headDist = progress + movingArrowLength;
    const pts = this.getPointsAlongPath(movingArrow.smoothPath, progress, headDist);
    if (pts.length === 0) return false;
    const headPt = pts[pts.length - 1];

    // Convert head point to grid coordinates
    const hCol = Math.round((headPt.x - offsetX) / pitch);
    const hRow = Math.round((headPt.y - offsetY) / pitch);

    const totalLen = this.getPathLength(movingArrow.smoothPath);

    // 0. Check boundary gate block when head is near exit boundary
    if (headDist >= totalLen - 5) {
      if (this.checkGateCollision(movingArrow)) return true;
    }

    // 1. Check collision with other active/idle arrows (using continuous collision sweep to prevent tunneling at high speeds)
    let hitArrow = false;
    const speedVal = movingArrow.currentSpeed || movingArrow.speed || 8;
    const prevProgress = Math.max(0, progress - speedVal);
    const prevHeadDist = prevProgress + movingArrowLength;
    const prevPts = this.getPointsAlongPath(movingArrow.smoothPath, prevProgress, prevHeadDist);
    const prevHeadPt = prevPts.length > 0 ? prevPts[prevPts.length - 1] : headPt;

    this.arrows.forEach(other => {
      let shouldCheck = false;
      if (other.id !== movingArrow.id && other.status !== 'ESCAPED') {
        if (other.status !== 'ESCAPING') {
          shouldCheck = true;
        }
      }

      if (shouldCheck) {
        if (movingArrow.ghost && other.color === "#3a69a4") return;
        if (other.ghost && movingArrow.color === "#3a69a4") return;

        if (other.status === 'IDLE') {
          // Blocker is stationary: check ONLY its physical visible body, not the entire invisible future path!
          // For idle arrows, their visible body is from distance 0 to 38 * strokeWidth (or initialLength if we made it long).
          const arrowLength = this.getArrowLength(other);
          const otherPts = this.getPointsAlongPath(other.smoothPath, 0, arrowLength);
          for (let i = 0; i < otherPts.length - 1; i++) {
            const d = this.getMinDistanceBetweenSegments(prevHeadPt, headPt, otherPts[i], otherPts[i + 1]);
            const threshold = 4.5 * (movingArrow.strokeWidth + other.strokeWidth);
            if (d < threshold) {
              hitArrow = true;
            }
          }
        } else {
          // Blocker is also moving: check its currently occupied path segment
          const otherTotalLen = this.getPathLength(other.smoothPath);
          if (other.progress >= otherTotalLen) {
            // Arrow has reached the exit and is sliding off screen.
            // Ignore collision to prevent bouncing off the "animation effect"
            return; // Acts as continue in forEach
          }

          const arrowLength = this.getArrowLength(other);
          const otherPts = this.getPointsAlongPath(other.smoothPath, other.progress, other.progress + arrowLength);
          for (let i = 0; i < otherPts.length - 1; i++) {
            const d = this.getMinDistanceBetweenSegments(prevHeadPt, headPt, otherPts[i], otherPts[i + 1]);
            const threshold = 4.5 * (movingArrow.strokeWidth + other.strokeWidth);
            if (d < threshold) {
              hitArrow = true;
            }
          }
        }
      }
    });
    if (hitArrow) return true;

    // 2. Check collision with Void tiles (crumbling tiles with 0 durability)
    const hitVoid = this.crumblingTiles.some(ct =>
      ct.col === hCol && ct.row === hRow && ct.durability <= 0
    );
    if (hitVoid) return true;

    // 3. Check collision with closed Timed Gates
    const hitTimedGate = this.timedGates.some(tg =>
      tg.col === hCol && tg.row === hRow && tg.timer > 0
    );
    if (hitTimedGate) return true;

    // 4. Check collision with active Lasers
    const hitLaser = this.laserBarriers.some(lb => {
      if (!lb.active) return false;
      const lx1 = offsetX + lb.col1 * pitch;
      const ly1 = offsetY + lb.row1 * pitch;
      const lx2 = offsetX + lb.col2 * pitch;
      const ly2 = offsetY + lb.row2 * pitch;

      const d = this.distToSegment(headPt, { x: lx1, y: ly1 }, { x: lx2, y: ly2 });
      return d < 8;
    });
    if (hitLaser) return true;

    return false;
  },

  canArrowEscape(movingArrow) {
    const totalLen = this.getPathLength(movingArrow.smoothPath);
    for (let progress = 0; progress < totalLen; progress += 4) {
      const headDist = progress + this.getMovingArrowLength(movingArrow);
      const pts = this.getPointsAlongPath(movingArrow.smoothPath, progress, headDist);
      if (pts.length === 0) continue;
      const headPt = pts[pts.length - 1];

      for (const other of this.arrows) {
        if (other.id !== movingArrow.id && other.status === 'IDLE') {
          const otherPts = this.getPointsAlongPath(other.smoothPath, 0, this.getMovingArrowLength(other));
          for (let i = 0; i < otherPts.length - 1; i++) {
            const d = this.distToSegment(headPt, otherPts[i], otherPts[i + 1]);
            const threshold = 4.5 * (movingArrow.strokeWidth + other.strokeWidth);
            if (d < threshold) {
              return false; // Collides!
            }
          }
        }
      }
    }
    return true; // Escapes safely!
  },

  attemptEscape(movingArrow) {
    const tracedPaths = this.traceArrowPaths(movingArrow);
    if (tracedPaths.length === 0) return;

    // Build the projected single trajectory coordinates
    const tpCoords = tracedPaths[0].map(p => getAbsCoords(p.col, p.row));
    const tpSmooth = this.generateSmoothPath(tpCoords);

    // Setup temporary clone to trace along smooth path
    const testArrow = {
      id: movingArrow.id,
      color: movingArrow.color,
      strokeWidth: movingArrow.strokeWidth,
      path: tpCoords,
      smoothPath: tpSmooth,
      ghost: movingArrow.ghost,
      speed: movingArrow.speed,
      currentSpeed: movingArrow.speed,
      initialLength: movingArrow.initialLength
    };

    // Trace path and step to find if there is a collision
    let willCollide = false;
    let collisionLimit = -1;
    const totalPathLen = this.getPathLength(tpSmooth);

    for (let p = 0; p < totalPathLen; p += 4) {
      if (this.checkCollisionAtProgress(testArrow, p)) {
        willCollide = true;
        collisionLimit = p;
        break;
      }
    }

    if (willCollide) {
      // It will collide! Launch it forward, but schedule it to halt at collisionLimit
      movingArrow.originalPath = movingArrow.path;
      movingArrow.originalSmoothPath = movingArrow.smoothPath;
      movingArrow.path = tpCoords;
      movingArrow.smoothPath = tpSmooth;
      movingArrow.status = 'ESCAPING';
      movingArrow.progress = 0;
      movingArrow.currentSpeed = movingArrow.speed;

      movingArrow.willCollide = true;
      movingArrow.collisionLimit = collisionLimit;

      SoundSystem.playWhoosh();
    } else {
      // Success: Save history state first
      this.saveStateToHistory();

      // Apply interactor side-effects (switch triggers, tile cracks, cart rotation)
      this.applyMoveSideEffects(movingArrow);

      if (tracedPaths.length === 1) {
        movingArrow.path = tracedPaths[0].map(p => getAbsCoords(p.col, p.row));
        movingArrow.smoothPath = this.generateSmoothPath(movingArrow.path);

        movingArrow.status = 'ESCAPING';
        movingArrow.progress = 0;
        movingArrow.currentSpeed = movingArrow.speed;

        movingArrow.willCollide = false;
        movingArrow.collisionLimit = -1;
      } else {
        // Multi path split: clear parent and launch dynamic clone children
        this.arrows = this.arrows.filter(a => a.id !== movingArrow.id);
        tracedPaths.forEach((tp, idx) => {
          const childPath = tp.map(p => getAbsCoords(p.col, p.row));
          const childSmooth = this.generateSmoothPath(childPath);

          const childArrow = {
            id: `${movingArrow.id}_child_${idx}_${Date.now()}`,
            color: movingArrow.color,
            strokeWidth: movingArrow.strokeWidth,
            speed: movingArrow.speed,
            path: childPath,
            smoothPath: childSmooth,
            status: 'ESCAPING',
            ghost: movingArrow.ghost,
            progress: 0,
            currentSpeed: movingArrow.speed,
            squeezeFactor: 1.0,
            bumpTime: 0,
            initialLength: movingArrow.initialLength
          };

          // Pre-calculate collision for child
          let childCollide = false;
          let childLimit = -1;
          const childLen = this.getPathLength(childSmooth);
          for (let p = 0; p < childLen; p += 4) {
            if (this.checkCollisionAtProgress(childArrow, p)) {
              childCollide = true;
              childLimit = p;
              break;
            }
          }

          childArrow.willCollide = childCollide;
          childArrow.collisionLimit = childLimit;
          this.arrows.push(childArrow);
        });
      }

      SoundSystem.playWhoosh();
      this.movesCount++;
      this.updateHUD();

      // Single arrow trigger only - auto color chain removed.
    }
  },

  triggerColorChain(colorTheme) {
    this.arrows.forEach(other => {
      if (other.status === 'IDLE' && other.color === colorTheme) {
        // Trigger if path is clear
        const collides = this.checkPolylineCollision(other, this.arrows);
        const gateBlocks = this.checkGateCollision(other);
        if (!collides && !gateBlocks) {
          other.status = 'ESCAPING';
          other.progress = 0;
          other.currentSpeed = other.speed;
          SoundSystem.playWhoosh();
        }
      }
    });
  },

  checkGateCollision(movingArrow) {
    if (!this.level.gates || this.level.gates.length === 0) return false;

    // Get final segment of arrow
    const head = movingArrow.path[movingArrow.path.length - 1];
    const prev = movingArrow.path[movingArrow.path.length - 2];

    // Find direction vector
    const dx = head.x - prev.x;
    const dy = head.y - prev.y;

    let targetEdge = null;
    let gateIndex = -1;

    // Identify which board boundary edge the head is exiting through
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal slide
      targetEdge = dx > 0 ? "R" : "L";
      // Find row index: (y - offsetY) / pitch
      gateIndex = Math.round((head.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch);
    } else {
      // Vertical slide
      targetEdge = dy > 0 ? "D" : "U";
      gateIndex = Math.round((head.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch);
    }

    // Check if there is a gate on this exit path
    const matchingGate = this.level.gates.find(g => g.edge === targetEdge && g.index === gateIndex);
    if (matchingGate) {
      // If colors mismatch, exit is blocked!
      return matchingGate.color !== movingArrow.color;
    }

    return false;
  },

  checkPolylineCollision(movingArrow, allArrows) {
    // 1. Project path: segments of path + extended ray to screen edge
    const head = movingArrow.path[movingArrow.path.length - 1];
    const prev = movingArrow.path[movingArrow.path.length - 2];

    // Create extended ray from head outwards to edge
    const dx = head.x - prev.x;
    const dy = head.y - prev.y;
    const len = Math.hypot(dx, dy);

    // Extend exit ray 500px off screen
    const exitRay = {
      start: head,
      end: {
        x: head.x + (dx / len) * 500,
        y: head.y + (dy / len) * 500
      }
    };

    // Combine smooth segments with extended exit segment
    const movingSegments = [];
    for (let i = 0; i < movingArrow.smoothPath.length - 1; i++) {
      movingSegments.push({ start: movingArrow.smoothPath[i], end: movingArrow.smoothPath[i + 1] });
    }
    movingSegments.push(exitRay);

    // 2. Check collision against all other static arrows
    for (const other of allArrows) {
      if (other.id === movingArrow.id || other.status === 'ESCAPING' || other.status === 'ESCAPED') continue;

      // Yellow Ghost Pass-through check: Yellow ignores Blue arrows
      if (movingArrow.ghost && other.color === "#3a69a4") continue;
      if (other.ghost && movingArrow.color === "#3a69a4") continue;

      // Extract static smooth segments of other arrow
      const otherSegments = [];
      for (let j = 0; j < other.smoothPath.length - 1; j++) {
        otherSegments.push({ start: other.smoothPath[j], end: other.smoothPath[j + 1] });
      }

      // Check distance between all moving segments vs all static segments
      for (const mSeg of movingSegments) {
        for (const oSeg of otherSegments) {
          const minDist = this.getMinDistanceBetweenSegments(mSeg.start, mSeg.end, oSeg.start, oSeg.end);
          const collisionThreshold = 4.5 * (movingArrow.strokeWidth + other.strokeWidth);

          if (minDist < collisionThreshold) {
            return true; // Collision hit detected!
          }
        }
      }
    }

    return false;
  },

  getMinDistanceBetweenSegments(p1, p2, p3, p4) {
    // Check minimum distance of line segments by checking point-to-segment distances
    return Math.min(
      this.distToSegment(p1, p3, p4),
      this.distToSegment(p2, p3, p4),
      this.distToSegment(p3, p1, p2),
      this.distToSegment(p4, p1, p2)
    );
  },

  distToSegment(p, s1, s2) {
    const l2 = Math.pow(s2.x - s1.x, 2) + Math.pow(s2.y - s1.y, 2);
    if (l2 === 0) return Math.hypot(p.x - s1.x, p.y - s1.y);

    let t = ((p.x - s1.x) * (s2.x - s1.x) + (p.y - s1.y) * (s2.y - s1.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const proj = {
      x: s1.x + t * (s2.x - s1.x),
      y: s1.y + t * (s2.y - s1.y)
    };
    return Math.hypot(p.x - proj.x, p.y - proj.y);
  },

  saveStateToHistory() {
    const state = this.arrows.map(a => {
      return {
        id: a.id,
        color: a.color,
        strokeWidth: a.strokeWidth,
        speed: a.speed,
        path: a.path.map(p => ({ ...p })),
        smoothPath: a.smoothPath.map(p => ({ ...p })),
        status: a.status,
        ghost: a.ghost,
        progress: a.progress,
        currentSpeed: a.currentSpeed
      };
    });
    const cartsState = this.carts.map(c => ({ ...c }));
    const crumblingState = this.crumblingTiles.map(ct => ({ ...ct }));
    const laserState = this.laserBarriers.map(lb => ({ ...lb }));
    const timedGateState = this.timedGates.map(tg => ({ ...tg }));

    const portalState = this.portals ? this.portals.map(p => ({ ...p })) : [];

    this.history.push({
      arrows: state,
      moves: this.movesCount,
      carts: cartsState,
      crumbling: crumblingState,
      lasers: laserState,
      timedGates: timedGateState,
      portals: portalState
    });
    if (this.history.length > 20) this.history.shift();
  },

  undoMove() {
    if (this.history.length === 0) return;
    SoundSystem.playSelect();
    const prevState = this.history.pop();
    this.movesCount = prevState.moves;
    this.arrows = prevState.arrows.map(pa => {
      return {
        ...pa,
        path: pa.path.map(p => ({ ...p })),
        smoothPath: pa.smoothPath.map(p => ({ ...p }))
      };
    });
    if (prevState.carts) this.carts = prevState.carts.map(c => ({ ...c }));
    if (prevState.crumbling) this.crumblingTiles = prevState.crumbling.map(ct => ({ ...ct }));
    if (prevState.lasers) this.laserBarriers = prevState.lasers.map(lb => ({ ...lb }));
    if (prevState.timedGates) this.timedGates = prevState.timedGates.map(tg => ({ ...tg }));
    if (prevState.portals) this.portals = prevState.portals.map(p => ({ ...p }));
    this.updateHUD();
  },

  triggerHint() {
    const free = this.arrows.find(a => a.status === 'IDLE' && !this.checkPolylineCollision(a, this.arrows) && !this.checkGateCollision(a));
    if (free) {
      SoundSystem.playSelect();
      this.spawnGlitch(free.path[0].x, free.path[0].y, free.color, 25);
    } else {
      alert("💡 No free moves remaining. Re-align with undo!");
    }
  },

  updateHUD() {
    if (document.getElementById('hud-level-num')) {
      document.getElementById('hud-level-num').textContent = this.level ? this.level.id : "1";
    }
    if (document.getElementById('hud-hearts')) {
      const hCount = Math.max(0, this.hearts !== undefined ? this.hearts : 3);
      document.getElementById('hud-hearts').innerHTML = '❤️️'.repeat(hCount);
    }

    // Calculate progress percentage
    if (this.arrows && this.arrows.length > 0 && document.getElementById('game-progress-fill')) {
      const total = this.arrows.length;
      const escaped = this.arrows.filter(a => a.status === 'ESCAPED').length;
      const pct = (escaped / total) * 100;
      document.getElementById('game-progress-fill').style.width = pct + '%';
    }
  },

  spawnGlitch(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 5.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2,
        color,
        alpha: 1.0,
        decay: 0.035 + Math.random() * 0.04
      });
    }
  },

  tick() {
    if (!this.active) return;

    // Decay camera screenshake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - 0.55);
    }

    // Update continuous perimeter cart glide positions
    if (this.carts) {
      if (this.level && (this.level.id === 10 || this.level.id === 20 || this.level.id === 30 || this.level.id === 16)) {
        this.trainPos = (this.trainPos + 0.035 * (this.trainSpeedMultiplier || 1.0)) % 48;

        // Spawn smoke particles at the locomotive chimney (approx 1.5 slots behind the head trainPos)
        if (this.smokeParticles && Math.random() < 0.35) {
          const chimneyP = (this.trainPos - 1.5 + 48) % 48;
          const chimneyCoords = this.getPerimeterCoords(chimneyP);

          const idx1 = Math.floor(chimneyP) % 48;
          const idx2 = (idx1 + 1) % 48;
          const p1 = this.getIntegerPerimeterCoords(idx1);
          const p2 = this.getIntegerPerimeterCoords(idx2);
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          this.smokeParticles.push({
            x: chimneyCoords.x,
            y: chimneyCoords.y,
            vx: -Math.cos(angle) * 0.45 + (Math.random() - 0.5) * 0.3,
            vy: -Math.sin(angle) * 0.45 - 0.55 - Math.random() * 0.4,
            size: 2.5 + Math.random() * 2.5,
            alpha: 0.75,
            decay: 0.012 + Math.random() * 0.012
          });
        }
      } else {
        this.carts.forEach(c => {
          c.pos = (c.pos + 0.035) % 48;
        });
      }
    }

    // Update smoke particles positions and decay
    if (this.smokeParticles) {
      this.smokeParticles.forEach(sp => {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.size += 0.15; // puff expansion
        sp.alpha -= sp.decay;
      });
      this.smokeParticles = this.smokeParticles.filter(sp => sp.alpha > 0);
    }

    // 1. Update Escaping, Rebounding, & Bump Physics
    this.arrows.forEach(a => {
      if (a.status === 'ESCAPING') {
        a.currentSpeed = (a.currentSpeed || a.speed) + 0.95;
        a.progress += a.currentSpeed;

        // Keep arrow size constant during escape
        a.squeezeFactor = 1.0;

        // Calculate total path length
        let totalPathLen = 0;
        for (let i = 0; i < a.path.length - 1; i++) {
          totalPathLen += Math.hypot(a.path[i + 1].x - a.path[i].x, a.path[i + 1].y - a.path[i].y);
        }

        // Check if the moving arrow has reached its collision limit
        if (a.willCollide && a.progress >= a.collisionLimit) {
          a.progress = a.collisionLimit;
          a.status = 'COLLIDED';
          a.bumpTime = 12;
          this.shakeIntensity = 9.0;
          SoundSystem.playBuzzer();

          // Decrement Hearts on collision
          this.hearts = Math.max(0, (this.hearts !== undefined ? this.hearts : 3) - 1);
          this.updateHUD();

          // Spawn collision contact particles at the head of the arrow
          const headDist = a.progress + this.getMovingArrowLength(a);
          const pts = this.getPointsAlongPath(a.smoothPath, a.progress, headDist);
          if (pts.length > 0) {
            const headPt = pts[pts.length - 1];
            this.spawnGlitch(headPt.x, headPt.y, a.color, 16);
          }

          if (this.hearts === 0) {
            this.active = false;
            setTimeout(() => {
              document.getElementById('gameover-overlay').classList.add('active');
              SoundSystem.playBuzzer();
            }, 300);
          }
          return;
        }

        // Perimeter Carts matching check when reaching grid boundary
        if (a.progress >= totalPathLen && (this.carts.length > 0 || (this.level && (this.level.id === 10 || this.level.id === 20 || this.level.id === 30 || this.level.id === 16))) && !a.checkedCart) {
          a.checkedCart = true;
          const lastPt = a.smoothPath[a.smoothPath.length - 1];
          const prevPt = a.smoothPath[a.smoothPath.length - 2] || a.smoothPath[0];
          const dx = lastPt.x - prevPt.x;
          const dy = lastPt.y - prevPt.y;
          const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U");

          const finalNode = a.path[a.path.length - 1];
          const finalCol = Math.round((finalNode.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch);
          const finalRow = Math.round((finalNode.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch);

          const exitPos = this.getPerimeterPosFromExit(dir, finalCol, finalRow);
          let match = false;
          if (this.level && (this.level.id === 10 || this.level.id === 20 || this.level.id === 30 || this.level.id === 16)) {
            const trainPos = this.trainPos;
            if (this.level.trainConfig) {
              let currentOffset = 0;
              for (let i = 0; i < this.level.trainConfig.length; i++) {
                const cart = this.level.trainConfig[i];
                const startOffset = currentOffset - cart.length;
                
                let start = (trainPos + startOffset + 48) % 48;
                let end = (trainPos + currentOffset + 48) % 48;
                
                let hitCart = ((exitPos - start + 48) % 48) <= ((end - start + 48) % 48);
                if (hitCart) {
                  if (a.color === cart.color) {
                    match = true;
                  }
                  break;
                }
                currentOffset = startOffset - cart.gap;
              }
            } else {
              let start = 0, end = 0;
              if (a.color === "#ab364f") { // Red
                start = trainPos - 15; end = trainPos - 6;
              } else if (a.color === "#3a69a4") { // Blue
                start = trainPos - 26; end = trainPos - 17;
              } else if (a.color === "#5e9554") { // Green
                start = trainPos - 37; end = trainPos - 28;
              } else if (a.color === "#1e1b18") { // Black
                start = trainPos - 4; end = trainPos;
              }
              start = (start + 48) % 48;
              end = (end + 48) % 48;
              match = ((exitPos - start + 48) % 48) <= ((end - start + 48) % 48);
            }
          } else {
            const cart = this.carts.find(c => {
              let diff = Math.abs(c.pos - exitPos);
              if (diff > 24) diff = 48 - diff;
              return diff < 0.9 && c.color === a.color;
            });
            match = !!cart;
          }

          if (!match) {
            // Mismatch or empty: trigger rebound!
            a.status = 'REBOUNDING';
            a.checkedCart = false;
            SoundSystem.playBuzzer();
            this.spawnGlitch(lastPt.x, lastPt.y, "#ab364f", 10);
            return;
          }
        }

        if (a.progress >= totalPathLen && a.status === 'MOVING') {
          a.status = 'ESCAPING';
        }

        // If it goes past total path length, it continues off-screen along final vector

        if (a.progress > totalPathLen + 150) {
          a.status = 'ESCAPED';
          const head = a.path[a.path.length - 1];
          this.spawnGlitch(head.x, head.y, a.color, 12);
          this.updateHUD();
        }
      } else if (a.status === 'REBOUNDING') {
        a.progress -= a.speed * 1.5; // recoil back fast
        if (a.progress <= 0) {
          a.progress = 0;
          a.status = 'IDLE';
          a.willCollide = false;
          a.collisionLimit = -1;
          if (a.originalPath) {
            a.path = a.originalPath;
            a.smoothPath = a.originalSmoothPath;
            delete a.originalPath;
            delete a.originalSmoothPath;
          }
        }
      } else if (a.status === 'COLLIDED') {
        a.bumpTime--;
        if (a.bumpTime <= 0) {
          a.status = 'REBOUNDING';
        }
      }
    });

    // Update Particles (Simulating gravity pull on sparks)
    this.particles.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.22; // gravity pull
      pt.alpha -= pt.decay;
    });
    this.particles = this.particles.filter(pt => pt.alpha > 0);

    // 2. Victory & Deadlock evaluation
    const allCleared = this.arrows.every(a => a.status === 'ESCAPED');
    if (allCleared && this.arrows.length > 0) {
      this.active = false;
      setTimeout(() => this.showVictoryScreen(), 500);
    } else {
      // If all active arrows are IDLE, check for deadlock
      const anyMoving = this.arrows.some(a => a.status === 'ESCAPING' || a.status === 'REBOUNDING' || a.status === 'COLLIDED');
      if (!anyMoving) {
        const idleArrows = this.arrows.filter(a => a.status === 'IDLE');
        if (idleArrows.length > 0) {
          let hasValidMove = false;
          for (const a of idleArrows) {
            if (!this.checkPolylineCollision(a, this.arrows)) {
              hasValidMove = true;
              break;
            }
          }
          if (!hasValidMove) {
            this.active = false;
            setTimeout(() => {
              document.getElementById('deadlock-overlay').classList.add('active');
              SoundSystem.playBuzzer();
            }, 600);
          }
        }
      }
    }
  },

  showVictoryScreen() {
    const reward = this.level.id * 10 + 20;
    this.tokens += reward;
    this.saveData();

    document.getElementById('victory-tokens-earned').textContent = reward;

    let cleared = JSON.parse(localStorage.getItem('winding_cleared_levels')) || [];
    if (!cleared.includes(this.level.id)) {
      cleared.push(this.level.id);
      localStorage.setItem('winding_cleared_levels', JSON.stringify(cleared));
    }

    SoundSystem.playWin();
    document.getElementById('victory-overlay').classList.add('active');
  },

  render() {
    // Warm clean cream background matching the screenshot
    this.ctx.fillStyle = '#fbfaf5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    if (this.shakeIntensity && this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // Plain background as requested by user.

    // Draw optional grid dots overlay
    if (this.showGrid) {
      const pitch = GRID_COORDS.pitch;
      const ox = GRID_COORDS.offsetX;
      const oy = GRID_COORDS.offsetY;
      this.ctx.save();
      for (let col = 0; col <= 12; col++) {
        for (let row = 0; row <= 12; row++) {
          const x = ox + col * pitch;
          const y = oy + row * pitch;
          this.ctx.beginPath();
          this.ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(104, 92, 76, 0.25)';
          this.ctx.fill();
        }
      }
      this.ctx.restore();
    }

    // Draw Pressure Switches
    if (this.switches) {
      this.switches.forEach(sw => {
        const px = GRID_COORDS.offsetX + sw.col * GRID_COORDS.pitch;
        const py = GRID_COORDS.offsetY + sw.row * GRID_COORDS.pitch;
        this.ctx.save();
        this.ctx.fillStyle = '#e7e3d4';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ab364f';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    // Draw Crumbling Tiles & Voids
    if (this.crumblingTiles) {
      this.crumblingTiles.forEach(ct => {
        const px = GRID_COORDS.offsetX + ct.col * GRID_COORDS.pitch;
        const py = GRID_COORDS.offsetY + ct.row * GRID_COORDS.pitch;
        this.ctx.save();
        if (ct.durability <= 0) {
          // Draw VOID hole
          this.ctx.fillStyle = '#e7e3d4';
          this.ctx.beginPath();
          this.ctx.arc(px, py, 11, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#685c4c';
          this.ctx.beginPath();
          this.ctx.arc(px, py, 8, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Draw subtle cracked lines
          this.ctx.strokeStyle = '#685c4c';
          this.ctx.globalAlpha = 0.45;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(px - 8, py - 6);
          this.ctx.lineTo(px + 7, py + 7);
          if (ct.durability === 1) {
            this.ctx.moveTo(px + 6, py - 8);
            this.ctx.lineTo(px - 7, py + 6);
          }
          this.ctx.stroke();
        }
        this.ctx.restore();
      });
    }

    // Draw Timed Gates
    if (this.timedGates) {
      this.timedGates.forEach(tg => {
        if (tg.timer <= 0) return;
        const px = GRID_COORDS.offsetX + tg.col * GRID_COORDS.pitch;
        const py = GRID_COORDS.offsetY + tg.row * GRID_COORDS.pitch;
        this.ctx.save();
        this.ctx.fillStyle = '#685c4c';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(px - 10, py - 10, 20, 20, 4);
        this.ctx.fill();
        this.ctx.fillStyle = '#fbfaf5';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tg.timer, px, py);
        this.ctx.restore();
      });
    }

    // Draw Reflectors
    if (this.reflectors) {
      this.reflectors.forEach(r => {
        const px = GRID_COORDS.offsetX + r.col * GRID_COORDS.pitch;
        const py = GRID_COORDS.offsetY + r.row * GRID_COORDS.pitch;
        this.ctx.save();
        this.ctx.fillStyle = '#e7e3d4';
        this.ctx.beginPath();
        this.ctx.roundRect(px - 16, py - 16, 32, 32, 6);
        this.ctx.fill();
        this.ctx.strokeStyle = '#685c4c';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        if (r.type === 'REFLECTOR_UR') {
          this.ctx.moveTo(px - 10, py + 10);
          this.ctx.lineTo(px + 10, py - 10);
        } else {
          this.ctx.moveTo(px - 10, py - 10);
          this.ctx.lineTo(px + 10, py + 10);
        }
        this.ctx.stroke();
        this.ctx.restore();
      });
    }

    // Draw Splitters
    if (this.splitters) {
      this.splitters.forEach(s => {
        const px = GRID_COORDS.offsetX + s.col * GRID_COORDS.pitch;
        const py = GRID_COORDS.offsetY + s.row * GRID_COORDS.pitch;
        this.ctx.save();
        this.ctx.fillStyle = '#e7e3d4';
        this.ctx.beginPath();
        this.ctx.roundRect(px - 16, py - 16, 32, 32, 6);
        this.ctx.fill();
        this.ctx.strokeStyle = '#6ab5b4';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        this.ctx.moveTo(px - 8, py);
        this.ctx.lineTo(px + 8, py);
        this.ctx.moveTo(px, py - 8);
        this.ctx.lineTo(px, py + 8);
        this.ctx.stroke();
        this.ctx.restore();
      });
    }

    // Draw Laser Barriers
    if (this.laserBarriers) {
      this.laserBarriers.forEach(lb => {
        if (!lb.active) return;
        const px1 = GRID_COORDS.offsetX + lb.col1 * GRID_COORDS.pitch;
        const py1 = GRID_COORDS.offsetY + lb.row1 * GRID_COORDS.pitch;
        const px2 = GRID_COORDS.offsetX + lb.col2 * GRID_COORDS.pitch;
        const py2 = GRID_COORDS.offsetY + lb.row2 * GRID_COORDS.pitch;
        const mx = (px1 + px2) / 2;
        const my = (py1 + py2) / 2;
        this.ctx.save();
        this.ctx.strokeStyle = '#ab364f';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#ab364f';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        if (lb.row1 === lb.row2) {
          this.ctx.moveTo(mx, my - 16);
          this.ctx.lineTo(mx, my + 16);
        } else {
          this.ctx.moveTo(mx - 16, my);
          this.ctx.lineTo(mx + 16, my);
        }
        this.ctx.stroke();
        this.ctx.restore();
      });
    }

    // Draw continuous perimeter guide track (if level has carts)
    if ((this.carts && this.carts.length > 0) || (this.level && (this.level.id === 10 || this.level.id === 20 || this.level.id === 30 || this.level.id === 16))) {
      this.ctx.save();
      this.ctx.strokeStyle = '#e5dfcf';
      this.ctx.lineWidth = 20;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      this.ctx.roundRect(
        GRID_COORDS.offsetX - 20,
        GRID_COORDS.offsetY - 20,
        12 * GRID_COORDS.pitch + 40,
        12 * GRID_COORDS.pitch + 40,
        18
      );
      this.ctx.stroke();

      // Thin inner guideline
      this.ctx.strokeStyle = '#fbfaf5';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw Teleport Portals (glowing entrance/exit rings)
    if (this.portals) {
      this.portals.forEach(p => {
        const px1 = GRID_COORDS.offsetX + p.col1 * GRID_COORDS.pitch;
        const py1 = GRID_COORDS.offsetY + p.row1 * GRID_COORDS.pitch;
        const px2 = GRID_COORDS.offsetX + p.col2 * GRID_COORDS.pitch;
        const py2 = GRID_COORDS.offsetY + p.row2 * GRID_COORDS.pitch;

        this.ctx.save();
        // Entrance: glowing green vortex
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#10b981';
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(px1, py1, 10, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner portal core
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        this.ctx.fill();

        // Exit: glowing blue vortex
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.shadowColor = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.arc(px2, py2, 10, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner exit core
        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    // Draw Perimeter Carts
    if (this.carts) {
      if (this.level && (this.level.id === 10 || this.level.id === 20 || this.level.id === 30 || this.level.id === 16)) {
        const trainPos = this.trainPos;

        if (this.level.trainConfig) {
          let currentOffset = 0;
          for (let i = 0; i < this.level.trainConfig.length - 1; i++) {
            const cart = this.level.trainConfig[i];
            const startOffset = currentOffset - cart.length;
            const linkStart = startOffset - cart.gap;
            const linkEnd = startOffset;
            if (cart.gap > 0) {
              this.drawLinkage(trainPos + linkStart, trainPos + linkEnd);
            }
            currentOffset = linkStart;
          }
          currentOffset = 0;
          for (let i = 0; i < this.level.trainConfig.length; i++) {
            const cart = this.level.trainConfig[i];
            const startOffset = currentOffset - cart.length;
            this.drawTrainSegment(cart.color, trainPos + startOffset, trainPos + currentOffset, cart.isEngine);
            currentOffset = startOffset - cart.gap;
          }
        } else {
          // Fallback legacy train
          this.drawLinkage(trainPos - 6, trainPos - 4);
          this.drawLinkage(trainPos - 17, trainPos - 15);
          this.drawLinkage(trainPos - 28, trainPos - 26);
          this.drawTrainSegment("#1e1b18", trainPos - 4, trainPos, true);
          this.drawTrainSegment("#ab364f", trainPos - 15, trainPos - 6, false);
          this.drawTrainSegment("#3a69a4", trainPos - 26, trainPos - 17, false);
          this.drawTrainSegment("#5e9554", trainPos - 37, trainPos - 28, false);
        }
      } else {
        this.carts.forEach(c => {
          for (let car = 0; car < 3; car++) {
            const carPos = (c.pos - car * 0.72 + 48) % 48;
            const coords = this.getPerimeterCoords(carPos);

            const coords1 = this.getPerimeterCoords((carPos - 0.15 + 48) % 48);
            const coords2 = this.getPerimeterCoords((carPos + 0.15 + 48) % 48);
            const angle = Math.atan2(coords2.y - coords1.y, coords2.x - coords1.x);

            this.ctx.save();
            this.ctx.translate(coords.x, coords.y);
            this.ctx.rotate(angle);

            // Draw coupled carriage connector line (if not the lead engine)
            if (car > 0) {
              this.ctx.strokeStyle = '#685c4c';
              this.ctx.lineWidth = 2.0;
              this.ctx.beginPath();
              this.ctx.moveTo(-16, 0);
              this.ctx.lineTo(-10, 0);
              this.ctx.stroke();
            }

            // Draw cart shadow
            this.ctx.shadowColor = 'rgba(104, 92, 76, 0.18)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetY = 1.5;

            // Draw wheels
            const wheelRadius = 3.0;
            const wheelOffsets = [
              { x: -7, y: -5 },
              { x: 7, y: -5 },
              { x: -7, y: 5 },
              { x: 7, y: 5 }
            ];

            wheelOffsets.forEach(wo => {
              this.ctx.save();
              this.ctx.translate(wo.x, wo.y);
              const spin = c.pos * Math.PI * 2.5;
              this.ctx.rotate(spin);

              this.ctx.fillStyle = '#4a3f35';
              this.ctx.beginPath();
              this.ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
              this.ctx.fill();

              this.ctx.strokeStyle = '#e7e3d4';
              this.ctx.lineWidth = 1.0;
              this.ctx.beginPath();
              this.ctx.moveTo(-wheelRadius + 0.5, 0);
              this.ctx.lineTo(wheelRadius - 0.5, 0);
              this.ctx.stroke();

              this.ctx.restore();
            });

            // Draw cart chassis card
            this.ctx.fillStyle = '#e7e3d4';
            this.ctx.strokeStyle = '#685c4c';
            this.ctx.lineWidth = 1.2;
            this.ctx.beginPath();
            if (car === 0) {
              // Engine features rounded cockpit front
              this.ctx.roundRect(-10, -6, 20, 12, [3, 6, 6, 3]);
            } else {
              this.ctx.roundRect(-10, -6, 20, 12, 3);
            }
            this.ctx.fill();
            this.ctx.stroke();

            // Draw color cargo box
            this.ctx.fillStyle = c.color;
            this.ctx.beginPath();
            this.ctx.roundRect(-7, -3, 14, 6, 1.5);
            this.ctx.fill();

            // Draw Color-blind label badge inside cargo
            if (this.colorBlindMode) {
              let letter = "C";
              if (c.color === "#ab364f") letter = "R";
              if (c.color === "#3a69a4") letter = "B";
              if (c.color === "#e59a3f") letter = "O";
              if (c.color === "#5e9554") letter = "G";
              if (c.color === "#22d3ee") letter = "C";

              // Rotate text to be drawn upright
              this.ctx.rotate(-angle);
              this.ctx.fillStyle = "#ffffff";
              this.ctx.font = "bold 7px sans-serif";
              this.ctx.textAlign = "center";
              this.ctx.textBaseline = "middle";
              this.ctx.fillText(letter, 0, 0);
            }

            this.ctx.restore();
          }
        });
      }
    }

    // Draw Train Smoke Particles
    if (this.smokeParticles) {
      this.smokeParticles.forEach(sp => {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(180, 180, 185, ${sp.alpha})`; // soft metallic grey smoke puff
        this.ctx.beginPath();
        this.ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    // 1. Exit portals (Color Gates)
    if (this.level && this.level.gates) {
      const gridPointsCount = 13;
      this.level.gates.forEach(g => {
        this.ctx.save();

        let gx = 0, gy = 0, gw = 6, gh = 6;
        const pitch = GRID_COORDS.pitch;

        if (g.edge === "L") {
          gx = GRID_COORDS.offsetX - 22;
          gy = GRID_COORDS.offsetY + g.index * pitch - 12;
          gw = 6; gh = 24;
        } else if (g.edge === "R") {
          gx = GRID_COORDS.offsetX + (gridPointsCount - 1) * pitch + 16;
          gy = GRID_COORDS.offsetY + g.index * pitch - 12;
          gw = 6; gh = 24;
        } else if (g.edge === "U") {
          gx = GRID_COORDS.offsetX + g.index * pitch - 12;
          gy = GRID_COORDS.offsetY - 22;
          gw = 24; gh = 6;
        } else if (g.edge === "D") {
          gx = GRID_COORDS.offsetX + g.index * pitch - 12;
          gy = GRID_COORDS.offsetY + (gridPointsCount - 1) * pitch + 16;
          gw = 24; gh = 6;
        }

        // Draw elegant gate frame
        this.ctx.fillStyle = g.color;
        this.ctx.beginPath();
        this.ctx.roundRect(gx, gy, gw, gh, 2);
        this.ctx.fill();

        this.ctx.restore();
      });
    }

    // 2. Draw Winding polylines
    this.arrows.forEach(a => {
      if (a.status === 'ESCAPED') return;

      this.ctx.save();

      // Render glowing halo if hovered
      if (this.hoveredArrowId === a.id) {
        this.ctx.save();
        this.ctx.strokeStyle = a.color;
        this.ctx.lineWidth = 12 * a.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 0.15;
        this.drawPolylinePath(a);
        this.ctx.stroke();
        this.ctx.restore();
      }

      this.ctx.shadowColor = 'rgba(104, 92, 76, 0.16)';
      this.ctx.shadowBlur = 6;
      this.ctx.shadowOffsetY = 3.5;

      // Draw starting tail chevron fletching indicator
      const totalLen = this.getPathLength(a.smoothPath);
      const startDist = (a.status === 'ESCAPING' || a.status === 'REBOUNDING' || a.status === 'COLLIDED') ? a.progress : 0;
      if (startDist < totalLen) {
        const pts = this.getPointsAlongPath(a.smoothPath, startDist, totalLen);
        if (pts.length >= 2) {
          const tailPt = pts[0];
          const nextPt = pts[1];
          const angle = Math.atan2(nextPt.y - tailPt.y, nextPt.x - tailPt.x);

          this.ctx.save();
          this.ctx.translate(tailPt.x, tailPt.y);
          this.ctx.rotate(angle);
          this.ctx.strokeStyle = a.color;
          this.ctx.lineWidth = 1.5 * a.strokeWidth;
          this.ctx.beginPath();
          this.ctx.moveTo(-4, -4);
          this.ctx.lineTo(0, 0);
          this.ctx.lineTo(-4, 4);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }

      // Draw thick polyline stroke body
      const isColliding = (a.status === 'COLLIDED' || a.status === 'REBOUNDING');
      const drawColor = isColliding ? ((Date.now() % 200 < 100) ? '#ffffff' : '#ff0000') : a.color;

      this.ctx.strokeStyle = drawColor;
      this.ctx.lineWidth = 4 * a.strokeWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Collision jiggle wiggle (simple position shift, no scaling offsets)
      if (a.status === 'COLLIDED') {
        const offset = Math.sin(a.bumpTime * 1.5) * 3;
        this.ctx.translate(offset, 0);
      }

      this.drawPolylinePath(a);
      this.ctx.stroke();

      // Disable shadow for inner highlight and arrow heads to keep them crisp
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetY = 0;

      // Draw inner core line only for regular short arrows
      if (!this.level || !this.level.isMaze) {
        this.ctx.strokeStyle = isColliding ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.22)';
        this.ctx.lineWidth = 1.0 * a.strokeWidth;
        this.drawPolylinePath(a);
        this.ctx.stroke();
      }

      // Draw arrow head at final direction segment
      this.drawArrowHead(a);

      // Draw Color-blind letter badge on start node of arrow
      if (this.colorBlindMode) {
        let letter = "C";
        if (a.color === "#ab364f") letter = "R";
        if (a.color === "#3a69a4") letter = "B";
        if (a.color === "#e59a3f") letter = "O";
        if (a.color === "#5e9554") letter = "G";
        if (a.color === "#22d3ee") letter = "C";

        const startPt = a.path[0];
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 9px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(letter, startPt.x, startPt.y);
      }

      this.ctx.restore();
    });

    // 3. Draw Particles (Directional Line Sparks)
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = p.radius * 0.8;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
      this.ctx.stroke();
      this.ctx.restore();
    });

    this.ctx.restore(); // Restore camera screenshake translation
  },

  getPathLength(path) {
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) {
      len += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
    }
    return len;
  },

  getPointsAlongPath(path, startDist, endDist) {
    // Clone and add a long exit extension along the final heading ray
    const extended = path.map(p => ({ ...p }));
    const head = path[path.length - 1];
    const prev = path[path.length - 2];
    const dx = head.x - prev.x;
    const dy = head.y - prev.y;
    const len = Math.hypot(dx, dy);
    extended.push({
      x: head.x + (dx / len) * 800,
      y: head.y + (dy / len) * 800
    });

    const points = [];
    let accum = 0;
    let started = false;

    for (let i = 0; i < extended.length - 1; i++) {
      const segLen = Math.hypot(extended[i + 1].x - extended[i].x, extended[i + 1].y - extended[i].y);

      // If startDist is within this segment
      if (!started && accum + segLen >= startDist) {
        const ratio = (startDist - accum) / segLen;
        points.push({
          x: extended[i].x + (extended[i + 1].x - extended[i].x) * ratio,
          y: extended[i].y + (extended[i + 1].y - extended[i].y) * ratio
        });
        started = true;
      }

      if (started) {
        if (accum + segLen >= endDist) {
          const ratio = (endDist - accum) / segLen;
          points.push({
            x: extended[i].x + (extended[i + 1].x - extended[i].x) * ratio,
            y: extended[i].y + (extended[i + 1].y - extended[i].y) * ratio
          });
          break;
        } else {
          points.push({ x: extended[i + 1].x, y: extended[i + 1].y });
        }
      }
      accum += segLen;
    }
    return points;
  },

  isPortalTransition(p1, p2) {
    if (!this.portals || this.portals.length === 0) return false;
    const c1 = Math.round((p1.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch);
    const r1 = Math.round((p1.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch);
    const c2 = Math.round((p2.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch);
    const r2 = Math.round((p2.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch);

    return this.portals.some(p =>
      (p.col1 === c1 && p.row1 === r1 && p.col2 === c2 && p.row2 === r2) ||
      (p.col2 === c1 && p.row2 === r1 && p.col1 === c2 && p.row1 === r2)
    );
  },

  drawPolylinePath(a) {
    const startDist = (a.status === 'ESCAPING' || a.status === 'REBOUNDING' || a.status === 'COLLIDED') ? a.progress : 0;
    const totalLen = this.getPathLength(a.smoothPath);
    const arrowLength = this.getArrowLength(a);
    const endDist = startDist + arrowLength;

    const pts = this.getPointsAlongPath(a.smoothPath, startDist, endDist);
    if (pts.length > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        if (this.isPortalTransition(prev, curr)) {
          this.ctx.moveTo(curr.x, curr.y);
        } else {
          this.ctx.lineTo(curr.x, curr.y);
        }
      }
    }
  },

  drawArrowHead(a) {
    const startDist = (a.status === 'ESCAPING' || a.status === 'REBOUNDING' || a.status === 'COLLIDED') ? a.progress : 0;
    const totalLen = this.getPathLength(a.smoothPath);
    const arrowLength = this.getArrowLength(a);
    const endDist = startDist + arrowLength;

    const pts = this.getPointsAlongPath(a.smoothPath, startDist, endDist);
    if (pts.length < 2) return;

    const head = pts[pts.length - 1];
    let prev = pts[pts.length - 2];
    if (this.isPortalTransition(prev, head)) {
      for (let j = pts.length - 3; j >= 0; j--) {
        if (!this.isPortalTransition(pts[j], head)) {
          prev = pts[j];
          break;
        }
      }
    }
    const dx = head.x - prev.x;
    const dy = head.y - prev.y;
    const angle = Math.atan2(dy, dx);

    this.ctx.save();
    this.ctx.translate(head.x, head.y);
    this.ctx.rotate(angle);

    // Draw sleek flat arrowhead
    const isColliding = (a.status === 'COLLIDED' || a.status === 'REBOUNDING');
    const drawColor = isColliding ? ((Date.now() % 200 < 100) ? '#ffffff' : '#ff0000') : a.color;
    
    this.ctx.fillStyle = drawColor;
    this.ctx.beginPath();
    const w = 5 * a.strokeWidth;
    const h = 6 * a.strokeWidth;
    this.ctx.moveTo(h, 0);
    this.ctx.lineTo(-h * 0.4, -w);
    this.ctx.lineTo(-h * 0.4, w);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  },
  getIntegerPerimeterCoords(pos) {
    const pitch = GRID_COORDS.pitch;
    const offsetX = GRID_COORDS.offsetX;
    const offsetY = GRID_COORDS.offsetY;
    const gap = 20;

    if (pos >= 0 && pos <= 12) {
      return { x: offsetX + pos * pitch, y: offsetY - gap };
    } else if (pos >= 13 && pos <= 24) {
      return { x: offsetX + 12 * pitch + gap, y: offsetY + (pos - 12) * pitch };
    } else if (pos >= 25 && pos <= 36) {
      return { x: offsetX + (36 - pos) * pitch, y: offsetY + 12 * pitch + gap };
    } else {
      return { x: offsetX - gap, y: offsetY + (48 - pos) * pitch };
    }
  },

  getPerimeterCoords(pos) {
    const p = ((pos % 48) + 48) % 48;

    const R = 18;
    const minX = GRID_COORDS.offsetX - 20; // 10
    const minY = GRID_COORDS.offsetY - 20; // 10
    const maxX = GRID_COORDS.offsetX + 12 * GRID_COORDS.pitch + 20; // 350
    const maxY = GRID_COORDS.offsetY + 12 * GRID_COORDS.pitch + 20; // 350

    const cxLeft = minX + R; // 28
    const cxRight = maxX - R; // 332
    const cyTop = minY + R; // 28
    const cyBottom = maxY - R; // 332

    if (p >= 0.8 && p < 11.2) {
      // Straight Top
      const t = (p - 0.8) / 10.4;
      return { x: cxLeft + t * (cxRight - cxLeft), y: minY };
    } else if (p >= 11.2 && p < 12.8) {
      // Corner Top-Right
      const t = (p - 11.2) / 1.6;
      const theta = -Math.PI / 2 + t * (Math.PI / 2);
      return { x: cxRight + R * Math.cos(theta), y: cyTop + R * Math.sin(theta) };
    } else if (p >= 12.8 && p < 23.2) {
      // Straight Right
      const t = (p - 12.8) / 10.4;
      return { x: maxX, y: cyTop + t * (cyBottom - cyTop) };
    } else if (p >= 23.2 && p < 24.8) {
      // Corner Bottom-Right
      const t = (p - 23.2) / 1.6;
      const theta = t * (Math.PI / 2);
      return { x: cxRight + R * Math.cos(theta), y: cyBottom + R * Math.sin(theta) };
    } else if (p >= 24.8 && p < 35.2) {
      // Straight Bottom
      const t = (p - 24.8) / 10.4;
      return { x: cxRight - t * (cxRight - cxLeft), y: maxY };
    } else if (p >= 35.2 && p < 36.8) {
      // Corner Bottom-Left
      const t = (p - 35.2) / 1.6;
      const theta = Math.PI / 2 + t * (Math.PI / 2);
      return { x: cxLeft + R * Math.cos(theta), y: cyBottom + R * Math.sin(theta) };
    } else if (p >= 36.8 && p < 47.2) {
      // Straight Left
      const t = (p - 36.8) / 10.4;
      return { x: minX, y: cyBottom - t * (cyBottom - cyTop) };
    } else {
      // Corner Top-Left (p >= 47.2 || p < 0.8)
      let t = 0;
      if (p >= 47.2) {
        t = (p - 47.2) / 1.6;
      } else {
        t = (p + 0.8) / 1.6;
      }
      const theta = Math.PI + t * (Math.PI / 2);
      return { x: cxLeft + R * Math.cos(theta), y: cyTop + R * Math.sin(theta) };
    }
  },

  getPerimeterPosFromExit(dir, col, row) {
    if (dir === "U") return col;
    if (dir === "R") return 12 + row;
    if (dir === "D") return 36 - col;
    if (dir === "L") {
      if (row === 0) return 0;
      if (row === 12) return 36;
      return 48 - row;
    }
    return 0;
  },

  drawLinkage(endPos, startPos) {
    this.ctx.save();
    this.ctx.strokeStyle = '#685c4c';
    this.ctx.lineWidth = 3.0;
    this.ctx.beginPath();
    const coords1 = this.getPerimeterCoords((endPos + 48) % 48);
    const coords2 = this.getPerimeterCoords((startPos + 48) % 48);
    this.ctx.moveTo(coords1.x, coords1.y);
    this.ctx.lineTo(coords2.x, coords2.y);
    this.ctx.stroke();
    this.ctx.restore();
  },

  drawTrainSegment(color, startPos, endPos, isEngine) {
    this.ctx.save();

    // 1. Draw background chassis outline
    this.ctx.strokeStyle = '#292524';
    this.ctx.lineWidth = 18;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const p = startPos + (i / steps) * (endPos - startPos);
      const coords = this.getPerimeterCoords((p + 48) % 48);
      if (i === 0) this.ctx.moveTo(coords.x, coords.y);
      else this.ctx.lineTo(coords.x, coords.y);
    }
    this.ctx.stroke();

    // 2. Draw main body
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 14;
    this.ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = startPos + (i / steps) * (endPos - startPos);
      const coords = this.getPerimeterCoords((p + 48) % 48);
      if (i === 0) this.ctx.moveTo(coords.x, coords.y);
      else this.ctx.lineTo(coords.x, coords.y);
    }
    this.ctx.stroke();

    // Glossy highlight
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    this.ctx.lineWidth = 3.0;
    this.ctx.stroke();

    // 3. Draw wheels with silver axles
    const wheelPositions = [0.15, 0.5, 0.85];
    wheelPositions.forEach(t => {
      const p = startPos + t * (endPos - startPos);
      const coords = this.getPerimeterCoords((p + 48) % 48);

      const coords1 = this.getPerimeterCoords((p - 0.15 + 48) % 48);
      const coords2 = this.getPerimeterCoords((p + 0.15 + 48) % 48);
      const angle = Math.atan2(coords2.y - coords1.y, coords2.x - coords1.x);

      this.ctx.save();
      this.ctx.translate(coords.x, coords.y);
      this.ctx.rotate(angle);

      this.ctx.fillStyle = '#1c1917';
      this.ctx.beginPath(); this.ctx.arc(0, -9.5, 4.0, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.beginPath(); this.ctx.arc(0, 9.5, 4.0, 0, Math.PI * 2); this.ctx.fill();

      this.ctx.fillStyle = '#d6d3d1';
      this.ctx.beginPath(); this.ctx.arc(0, -9.5, 1.5, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.beginPath(); this.ctx.arc(0, 9.5, 1.5, 0, Math.PI * 2); this.ctx.fill();

      this.ctx.restore();
    });

    // 4. Draw Locomotive Light Cone OR Passenger Coach Windows
    if (isEngine) {
      const noseP = endPos;
      const noseCoords = this.getPerimeterCoords((noseP + 48) % 48);

      const coords1 = this.getPerimeterCoords((noseP - 0.15 + 48) % 48);
      const coords2 = this.getPerimeterCoords((noseP + 0.15 + 48) % 48);
      const noseAngle = Math.atan2(coords2.y - coords1.y, coords2.x - coords1.x);

      this.ctx.save();
      this.ctx.translate(noseCoords.x, noseCoords.y);
      this.ctx.rotate(noseAngle);

      // Bright yellow headlight capsule
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.arc(5, 0, 4.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Light cone projection
      const grad = this.ctx.createRadialGradient(5, 0, 1, 20, 0, 30);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(5, 0);
      this.ctx.arc(5, 0, 35, -Math.PI / 5, Math.PI / 5);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    } else {
      // Passenger windows along the coach
      const windowPositions = [0.2, 0.4, 0.6, 0.8];
      windowPositions.forEach(t => {
        const p = startPos + t * (endPos - startPos);
        const coords = this.getPerimeterCoords((p + 48) % 48);

        const coords1 = this.getPerimeterCoords((p - 0.15 + 48) % 48);
        const coords2 = this.getPerimeterCoords((p + 0.15 + 48) % 48);
        const angle = Math.atan2(coords2.y - coords1.y, coords2.x - coords1.x);

        this.ctx.save();
        this.ctx.translate(coords.x, coords.y);
        this.ctx.rotate(angle);

        // Soft yellow glow
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.roundRect(-4, -2.5, 8, 5, 1.5);
        this.ctx.fill();

        this.ctx.restore();
      });
    }

    // 5. Draw Color-blind label badge in center
    if (this.colorBlindMode) {
      const centerP = (startPos + endPos) / 2;
      const coords = this.getPerimeterCoords((centerP + 48) % 48);

      let letter = "C";
      if (color === "#ab364f") letter = "R";
      if (color === "#3a69a4") letter = "B";
      if (color === "#5e9554") letter = "G";
      if (color === "#1e1b18") letter = "K";

      this.ctx.save();
      this.ctx.translate(coords.x, coords.y);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 9px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(letter, 0, 0);
      this.ctx.restore();
    }

    this.ctx.restore();
  },

  traceArrowPaths(movingArrow) {
    const gridNodes = movingArrow.path.map(pt => ({
      col: Math.round((pt.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch),
      row: Math.round((pt.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch)
    }));

    const resultPaths = [];
    const queue = [{ path: gridNodes }];

    while (queue.length > 0) {
      const current = queue.shift();
      const path = current.path;

      let head = path[path.length - 1];
      let prev = path[path.length - 2] || path[0];
      let dCol = head.col - prev.col;
      let dRow = head.row - prev.row;

      if (dCol !== 0) dCol = dCol > 0 ? 1 : -1;
      if (dRow !== 0) dRow = dRow > 0 ? 1 : -1;

      if (path.length < 2) {
        dCol = 1; dRow = 0;
      }

      let currCol = head.col;
      let currRow = head.row;
      let splitHit = false;

      while (true) {
        currCol += dCol;
        currRow += dRow;

        // Check Teleport Portals
        const portal = this.portals ? this.portals.find(p => p.col1 === currCol && p.row1 === currRow) : null;
        if (portal) {
          path.push({ col: currCol, row: currRow });
          currCol = portal.col2;
          currRow = portal.row2;
        }

        path.push({ col: currCol, row: currRow });

        if (currCol < 0 || currCol > 12 || currRow < 0 || currRow > 12) {
          break;
        }

        const refl = this.reflectors.find(r => r.col === currCol && r.row === currRow);
        const splitter = this.splitters.find(s => s.col === currCol && s.row === currRow);

        if (refl) {
          if (refl.type === "REFLECTOR_UR") {
            if (dCol === 1) { dCol = 0; dRow = -1; }
            else if (dCol === -1) { dCol = 0; dRow = 1; }
            else if (dRow === 1) { dCol = -1; dRow = 0; }
            else if (dRow === -1) { dCol = 1; dRow = 0; }
          } else {
            // REFLECTOR_UL
            if (dCol === 1) { dCol = 0; dRow = 1; }
            else if (dCol === -1) { dCol = 0; dRow = -1; }
            else if (dRow === 1) { dCol = 1; dRow = 0; }
            else if (dRow === -1) { dCol = -1; dRow = 0; }
          }
        } else if (splitter) {
          splitHit = true;
          let splitDirs = [];
          if (dCol !== 0) {
            splitDirs = [{ dc: 0, dr: -1 }, { dc: 0, dr: 1 }];
          } else {
            splitDirs = [{ dc: -1, dr: 0 }, { dc: 1, dr: 0 }];
          }

          splitDirs.forEach(dir => {
            const branchedPath = path.map(p => ({ ...p }));
            queue.push({ path: branchedPath });
          });
          break;
        }
      }

      if (!splitHit) {
        resultPaths.push(path);
      }
    }

    return resultPaths;
  },

  checkLaserCollision(arrow) {
    const gridNodes = arrow.path.map(pt => ({
      col: Math.round((pt.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch),
      row: Math.round((pt.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch)
    }));

    for (let i = 0; i < gridNodes.length - 1; i++) {
      const n1 = gridNodes[i];
      const n2 = gridNodes[i + 1];

      const activeLaser = this.laserBarriers.find(lb => {
        if (!lb.active) return false;
        const match1 = (lb.col1 === n1.col && lb.row1 === n1.row && lb.col2 === n2.col && lb.row2 === n2.row);
        const match2 = (lb.col2 === n1.col && lb.row2 === n1.row && lb.col1 === n2.col && lb.row1 === n2.row);
        return match1 || match2;
      });

      if (activeLaser) return true;
    }
    return false;
  },

  checkTimedGateCollision(arrow) {
    const gridNodes = arrow.path.map(pt => ({
      col: Math.round((pt.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch),
      row: Math.round((pt.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch)
    }));
    return gridNodes.some(n => {
      const gate = this.timedGates.find(tg => tg.col === n.col && tg.row === n.row);
      return gate && gate.timer > 0;
    });
  },

  checkVoidCollision(arrow) {
    const gridNodes = arrow.path.map(pt => ({
      col: Math.round((pt.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch),
      row: Math.round((pt.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch)
    }));
    return gridNodes.some(n => {
      const ct = this.crumblingTiles.find(t => t.col === n.col && t.row === n.row);
      return ct && ct.durability <= 0;
    });
  },

  applyMoveSideEffects(arrow) {
    const gridNodes = arrow.path.map(pt => ({
      col: Math.round((pt.x - GRID_COORDS.offsetX) / GRID_COORDS.pitch),
      row: Math.round((pt.y - GRID_COORDS.offsetY) / GRID_COORDS.pitch)
    }));

    // 1. Toggle Switches
    this.switches.forEach(sw => {
      const crossed = gridNodes.some(n => n.col === sw.col && n.row === sw.row);
      if (crossed) {
        const targetLaser = this.laserBarriers.find(lb => lb.id === sw.target);
        if (targetLaser) {
          targetLaser.active = !targetLaser.active;
          this.spawnGlitch(
            GRID_COORDS.offsetX + sw.col * GRID_COORDS.pitch,
            GRID_COORDS.offsetY + sw.row * GRID_COORDS.pitch,
            "#ab364f",
            6
          );
        }
      }
    });

    // 2. Decrement Crumbling Tiles
    this.crumblingTiles.forEach(ct => {
      const crossed = gridNodes.some(n => n.col === ct.col && n.row === ct.row);
      if (crossed && ct.durability > 0) {
        ct.durability--;
        this.spawnGlitch(
          GRID_COORDS.offsetX + ct.col * GRID_COORDS.pitch,
          GRID_COORDS.offsetY + ct.row * GRID_COORDS.pitch,
          "#e59a3f",
          10
        );
      }
    });

    // 3. Continuous carts are driven in the update loop, no discrete shift needed.

    // 4. Decrement Timed Gates
    this.timedGates.forEach(tg => {
      tg.timer = Math.max(0, tg.timer - 1);
    });
  },
  loop() {
    this.tick();
    this.render();
    requestAnimationFrame(() => this.loop());
  }
};
