const fs = require('fs');
let code = fs.readFileSync('src/js/game.js', 'utf8');

// 1. Frame Capping
const oldLoop = `  loop(timestamp) {
    if (!this.lastFrameTime) this.lastFrameTime = timestamp || performance.now();
    const now = timestamp || performance.now();
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;
    this.dtMultiplier = Math.max(0.8, Math.min(2.5, dt / 0.0166));

    this.tick();
    this.render();
    requestAnimationFrame((ts) => this.loop(ts));
  }`;

const newLoop = `  loop(timestamp) {
    if (!this.lastFrameTime) this.lastFrameTime = timestamp || performance.now();
    const now = timestamp || performance.now();
    
    // FPS Capping (~60fps) to prevent excessive battery drain & heating on 120Hz+ displays
    const elapsed = now - this.lastFrameTime;
    if (elapsed < 16) {
      requestAnimationFrame((ts) => this.loop(ts));
      return;
    }
    
    const dt = Math.min(0.05, elapsed / 1000);
    this.lastFrameTime = now - (elapsed % 16); // Avoid frame pacing drift
    this.dtMultiplier = Math.max(0.8, Math.min(2.5, dt / 0.0166));

    this.tick();
    this.render();
    requestAnimationFrame((ts) => this.loop(ts));
  }`;

code = code.replace(oldLoop, newLoop);

// 2. Fix massive overdraw and cache the background gradient
const oldRender = `  render() {
    // Warm soft spotlight background matching the ambient level backdrop
    const canvasGrad = this.ctx.createRadialGradient(180, 230, 20, 180, 230, 250);
    canvasGrad.addColorStop(0, '#ffffff');
    canvasGrad.addColorStop(0.7, '#fdfbf7');
    canvasGrad.addColorStop(1, '#f6f0e2');
    this.ctx.fillStyle = canvasGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);`;

const newRender = `  render() {
    // Cache the gradient to save GPU/CPU cycles
    if (!this.cachedBgGradient) {
      this.cachedBgGradient = this.ctx.createRadialGradient(180, 230, 20, 180, 230, 250);
      this.cachedBgGradient.addColorStop(0, '#ffffff');
      this.cachedBgGradient.addColorStop(0.7, '#fdfbf7');
      this.cachedBgGradient.addColorStop(1, '#f6f0e2');
    }
    this.ctx.fillStyle = this.cachedBgGradient;
    
    // Fill ONLY the logical 360x460 bounds. Previously it filled to this.canvas.width which caused enormous fill-rate overdraw!
    this.ctx.fillRect(0, 0, 360, 460);`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/js/game.js', code, 'utf8');
console.log("Optimizations applied successfully!");
