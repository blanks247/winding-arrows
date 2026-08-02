// Winding Arrows - Levels Database & Seeded Procedural Level Generator

const GRID_COORDS = {
  offsetX: 30,
  offsetY: 100,
  pitch: 25
};

// Helper to convert grid row/col to absolute pixels
function getAbsCoords(col, row) {
  return {
    x: GRID_COORDS.offsetX + col * GRID_COORDS.pitch,
    y: GRID_COORDS.offsetY + row * GRID_COORDS.pitch
  };
}

// Deterministic Seeded Random Generator (LCG)
function SeededRandom(seed) {
  return function() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

// Handcrafted introductory levels 1-10
const HANDCRAFTED_LEVELS = [
  {
    id: 1,
    name: "Winding Clearance",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#22d3ee", // Cyan
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(1, 3),
          getAbsCoords(1, 1),
          getAbsCoords(4, 1)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#ab364f", // Crimson
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 3),
          getAbsCoords(2, 3)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 2,
    name: "Heavy Width blocks",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#e59a3f", // Orange
        strokeWidth: 1.0,
        speed: 6,
        path: [
          getAbsCoords(2, 3),
          getAbsCoords(2, 1)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#22d3ee",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(0, 2),
          getAbsCoords(1, 2)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 3,
    name: "Gate Alignment",
    gates: [
      { edge: "R", index: 1, color: "#ab364f" },
      { edge: "L", index: 3, color: "#22d3ee" }
    ],
    arrows: [
      {
        id: "a1",
        color: "#22d3ee",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(2, 3),
          getAbsCoords(0, 3)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#ab364f",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(2, 1),
          getAbsCoords(4, 1)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 4,
    name: "Linked Blue Chains",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#3a69a4", // Chain Blue
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(1, 2),
          getAbsCoords(1, 1),
          getAbsCoords(0, 1)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#3a69a4",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 2),
          getAbsCoords(3, 1),
          getAbsCoords(3, 0)
        ],
        status: "IDLE"
      },
      {
        id: "a3",
        color: "#ab364f",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 4),
          getAbsCoords(3, 3)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 5,
    name: "Ghost Phasing",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#eab308", // Ghost Yellow
        strokeWidth: 1.0,
        speed: 9,
        path: [
          getAbsCoords(2, 4),
          getAbsCoords(2, 0)
        ],
        status: "IDLE",
        ghost: true
      },
      {
        id: "a2",
        color: "#3a69a4",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(0, 2),
          getAbsCoords(1, 2)
        ],
        status: "IDLE"
      },
      {
        id: "a3",
        color: "#ab364f",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 1),
          getAbsCoords(4, 1)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 6,
    name: "Winding Intersection",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#ab364f",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 4),
          getAbsCoords(3, 3)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#22d3ee",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(0, 2),
          getAbsCoords(0, 3),
          getAbsCoords(2, 3)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 7,
    name: "Fat Blockades",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#e59a3f",
        strokeWidth: 1.0,
        speed: 6,
        path: [
          getAbsCoords(1, 3),
          getAbsCoords(4, 3)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#5e9554",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 4),
          getAbsCoords(3, 2)
        ],
        status: "IDLE"
      },
      {
        id: "a3",
        color: "#22d3ee",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 1),
          getAbsCoords(3, 0)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 8,
    name: "Color Gate Maze",
    gates: [
      { edge: "U", index: 1, color: "#ab364f" },
      { edge: "D", index: 3, color: "#3a69a4" }
    ],
    arrows: [
      {
        id: "a1",
        color: "#ab364f",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(1, 3),
          getAbsCoords(1, 0)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#3a69a4",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 1),
          getAbsCoords(3, 4)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 9,
    name: "Blue Chain Overload",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#3a69a4",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(0, 1),
          getAbsCoords(1, 1)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#3a69a4",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(2, 4),
          getAbsCoords(2, 3)
        ],
        status: "IDLE"
      },
      {
        id: "a3",
        color: "#3a69a4",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(4, 3),
          getAbsCoords(3, 3)
        ],
        status: "IDLE"
      }
    ]
  },
  {
    id: 10,
    name: "The Dual Corridor",
    gates: [],
    arrows: [
      {
        id: "a1",
        color: "#ab364f",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(1, 3),
          getAbsCoords(1, 2),
          getAbsCoords(2, 2)
        ],
        status: "IDLE"
      },
      {
        id: "a2",
        color: "#22d3ee",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(3, 1),
          getAbsCoords(3, 2)
        ],
        status: "IDLE"
      },
      {
        id: "a3",
        color: "#5e9554",
        strokeWidth: 1.0,
        speed: 8,
        path: [
          getAbsCoords(2, 3),
          getAbsCoords(3, 3)
        ],
        status: "IDLE"
      }
    ]
  }
,
  {
    id: 11,
    name: "Crossings",
    gates: [],
    arrows: [
      { id: "a1", color: "#ab364f", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(1, 3), getAbsCoords(1, 2)], status: "IDLE" },
      { id: "a2", color: "#3a69a4", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(3, 1), getAbsCoords(3, 2)], status: "IDLE" }
    ]
  },
  {
    id: 12,
    name: "Dual Split",
    gates: [
      { edge: "L", index: 2, color: "#e59a3f" },
      { edge: "R", index: 2, color: "#22d3ee" }
    ],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(2, 2), getAbsCoords(2, 1)], status: "IDLE" },
      { id: "a2", color: "#e59a3f", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(1, 2), getAbsCoords(2, 2)], status: "IDLE" },
      { id: "a3", color: "#22d3ee", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(3, 2), getAbsCoords(2, 2)], status: "IDLE" }
    ]
  },
  {
    id: 13,
    name: "Crossover",
    gates: [
      { edge: "U", index: 1, color: "#ab364f" },
      { edge: "D", index: 3, color: "#3a69a4" }
    ],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(1, 3), getAbsCoords(3, 3), getAbsCoords(3, 1)], status: "IDLE" },
      { id: "a2", color: "#ab364f", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(1, 1), getAbsCoords(1, 2)], status: "IDLE" },
      { id: "a3", color: "#3a69a4", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(3, 2), getAbsCoords(3, 2)], status: "IDLE" }
    ]
  },
  {
    id: 14,
    name: "Tight Corners",
    gates: [
      { edge: "R", index: 1, color: "#5e9554" },
      { edge: "L", index: 3, color: "#e59a3f" }
    ],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 9, path: [getAbsCoords(2, 2), getAbsCoords(3, 2), getAbsCoords(3, 3)], status: "IDLE" },
      { id: "a2", color: "#5e9554", strokeWidth: 1.0, speed: 9, path: [getAbsCoords(2, 1), getAbsCoords(3, 1)], status: "IDLE" },
      { id: "a3", color: "#e59a3f", strokeWidth: 1.0, speed: 9, path: [getAbsCoords(2, 3), getAbsCoords(1, 3)], status: "IDLE" }
    ]
  },
  {
    id: 15,
    name: "The Loop",
    gates: [],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 6, path: [getAbsCoords(1, 1), getAbsCoords(3, 1), getAbsCoords(3, 3), getAbsCoords(1, 3), getAbsCoords(1, 2)], status: "IDLE" },
      { id: "a2", color: "#ab364f", strokeWidth: 1.0, speed: 6, path: [getAbsCoords(2, 2), getAbsCoords(2, 1)], status: "IDLE" }
    ]
  },
  {
    id: 16,
    name: "Serpentine",
    gates: [
      { edge: "U", index: 2, color: "#22d3ee" },
      { edge: "D", index: 2, color: "#ab364f" }
    ],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(1, 1), getAbsCoords(3, 1), getAbsCoords(3, 3), getAbsCoords(1, 3)], status: "IDLE" },
      { id: "a2", color: "#22d3ee", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(2, 1), getAbsCoords(2, 2)], status: "IDLE" },
      { id: "a3", color: "#ab364f", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(2, 3), getAbsCoords(2, 2)], status: "IDLE" }
    ]
  },
  {
    id: 17,
    name: "Double Block",
    gates: [
      { edge: "L", index: 1, color: "#5e9554" },
      { edge: "L", index: 3, color: "#e59a3f" }
    ],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(3, 2), getAbsCoords(1, 2)], status: "IDLE" },
      { id: "a2", color: "#5e9554", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(1, 1), getAbsCoords(1, 2)], status: "IDLE" },
      { id: "a3", color: "#e59a3f", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(1, 3), getAbsCoords(1, 2)], status: "IDLE" }
    ]
  },
  {
    id: 18,
    name: "Push Cart",
    gates: [],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(2, 3), getAbsCoords(2, 2)], status: "IDLE" },
      { id: "a2", color: "#ab364f", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(1, 1), getAbsCoords(3, 1)], status: "IDLE" }
    ]
  },
  {
    id: 19,
    name: "Traffic Jam",
    gates: [
      { edge: "R", index: 1, color: "#ab364f" },
      { edge: "R", index: 2, color: "#3a69a4" },
      { edge: "R", index: 3, color: "#e59a3f" }
    ],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 6, path: [getAbsCoords(2, 1), getAbsCoords(2, 3)], status: "IDLE" },
      { id: "a2", color: "#ab364f", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(1, 1), getAbsCoords(3, 1)], status: "IDLE" },
      { id: "a3", color: "#3a69a4", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(1, 2), getAbsCoords(3, 2)], status: "IDLE" },
      { id: "a4", color: "#e59a3f", strokeWidth: 1.0, speed: 7, path: [getAbsCoords(1, 3), getAbsCoords(3, 3)], status: "IDLE" }
    ]
  },
  {
    id: 20,
    name: "The Train Express",
    gates: [
      { edge: "U", index: 2, color: "#5e9554" }
    ],
    arrows: [
      { id: "a1", color: "#1e1b18", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(1, 2), getAbsCoords(2, 2)], status: "IDLE" },
      { id: "a2", color: "#5e9554", strokeWidth: 1.0, speed: 8, path: [getAbsCoords(3, 2), getAbsCoords(3, 1), getAbsCoords(2, 1)], status: "IDLE" }
    ]
  }
];
// Seeded Level Generator
function generateProceduralLevel(levelId) {
  // Seeding derivate based on level ID
  const rand = SeededRandom(levelId * 45 + 9812);

  // Dynamic cyclic difficulty pacing (Tension & Release curve)
  // Intensity waves up and down in cycles of 8 levels to prevent fatigue
  const cycle = levelId % 8;
  let numArrows = 3;
  
  numArrows = 52 + (cycle % 4);

  const colorPool = ["#ab364f", "#3a69a4", "#5e9554", "#1e1b18"];
  const gates = [];
  const arrows = [];
  
  const theme = (levelId === 10 || levelId === 20 || levelId === 30) ? 1 : 0; // Train level starting at level 10
  const minBound = theme === 1 ? 1 : 0;
  const maxBound = theme === 1 ? 11 : 12;

  let attempts = 0;
  let success = false;
  
  let carts = [];
  let reflectors = [];
  let splitters = [];
  let crumblingTiles = [];
  let switches = [];
  let laserBarriers = [];
  let timedGates = [];
  let portals = [];

  let currentNumArrows = numArrows;

  while (!success && attempts < 300) {
    attempts++;
    if (attempts % 40 === 0) {
      currentNumArrows = Math.max(50, currentNumArrows - 1);
    }
    arrows.length = 0;
    gates.length = 0;
    
    carts.length = 0;
    reflectors.length = 0;
    splitters.length = 0;
    crumblingTiles.length = 0;
    switches.length = 0;
    laserBarriers.length = 0;
    timedGates.length = 0;
    portals.length = 0;
    
    const occupiedNodes = new Set();

    // Place arrows
    for (let i = 0; i < currentNumArrows; i++) {
      const color = colorPool[Math.floor(rand() * colorPool.length)];
      const strokeWidth = 1.0;
      
      let pathPlaced = false;
      let pathAttempts = 0;

      while (!pathPlaced && pathAttempts < 30) {
        pathAttempts++;
        const path = [];
        const isStraight = rand() > 0.35;
        
        if (isStraight) {
          const col = Math.floor(rand() * 13);
          const row = Math.floor(rand() * 13);
          const dir = ["U", "D", "L", "R"][Math.floor(rand() * 4)];
          const length = 2; // Keep short for ultra-dense 50+ packing

          let ok = true;
          for (let step = 0; step < length; step++) {
            let tc = col, tr = row;
            if (dir === "U") tr -= step;
            if (dir === "D") tr += step;
            if (dir === "L") tc -= step;
            if (dir === "R") tc += step;

            if (tc < minBound || tc > maxBound || tr < minBound || tr > maxBound || occupiedNodes.has(`${tc},${tr}`)) {
              ok = false;
              break;
            }
            path.push({ col: tc, row: tr });
          }

          if (ok && path.length >= 2) {
            path.reverse();
            const tempArrow = {
              id: `pro-a${i}`,
              color,
              strokeWidth,
              speed: strokeWidth > 1.5 ? 6 : 8,
              path: path.map(p => getAbsCoords(p.col, p.row)),
              status: "IDLE"
            };
            arrows.push(tempArrow);
            if (checkSeededLevelSolvability(arrows, gates)) {
              path.forEach(p => occupiedNodes.add(`${p.col},${p.row}`));
              pathPlaced = true;
            } else {
              arrows.pop();
            }
          }
        } else {
          // L-shaped Winding path
          const pivotC = 1 + Math.floor(rand() * 11);
          const pivotR = 1 + Math.floor(rand() * 11);
          const len1 = 1; // Keep short for ultra-dense 50+ packing
          const dir1 = rand() > 0.5 ? 1 : -1;
          const len2 = 1;
          const dir2 = rand() > 0.5 ? 1 : -1;

          let ok = true;
          const tempNodes = [];
          tempNodes.push({ col: pivotC, row: pivotR });

          for (let step = 1; step <= len1; step++) {
            tempNodes.unshift({ col: pivotC + step * dir1, row: pivotR });
          }
          for (let step = 1; step <= len2; step++) {
            tempNodes.push({ col: pivotC, row: pivotR + step * dir2 });
          }

          for (const node of tempNodes) {
            if (node.col < minBound || node.col > maxBound || node.row < minBound || node.row > maxBound || occupiedNodes.has(`${node.col},${node.row}`)) {
              ok = false;
              break;
            }
          }

          if (ok) {
            const tempArrow = {
              id: `pro-a${i}`,
              color,
              strokeWidth,
              speed: strokeWidth > 1.5 ? 6 : 8,
              path: tempNodes.map(p => getAbsCoords(p.col, p.row)),
              status: "IDLE"
            };
            arrows.push(tempArrow);
            if (checkSeededLevelSolvability(arrows, gates)) {
              tempNodes.forEach(node => occupiedNodes.add(`${node.col},${node.row}`));
              pathPlaced = true;
            } else {
              arrows.pop();
            }
          }
        }
      }
    }

    // Populate themed obstacles on unoccupied nodes
    if (arrows.length >= 50) {
      const freeNodes = [];
      for (let c = 0; c < 13; c++) {
        for (let r = 0; r < 13; r++) {
          if (!occupiedNodes.has(`${c},${r}`)) {
            freeNodes.push({ col: c, row: r });
          }
        }
      }

      if (theme === 1) {
        // Theme 1: Perimeter Carts
        const cartColors = ["#ab364f", "#3a69a4", "#5e9554", "#1e1b18"];
        const numCarts = 2 + Math.floor(rand() * 2);
        const usedPos = new Set();
        for (let c = 0; c < numCarts; c++) {
          let cp = Math.floor(rand() * 48);
          while (usedPos.has(cp)) { cp = Math.floor(rand() * 48); }
          usedPos.add(cp);
          carts.push({ pos: cp, color: cartColors[c % cartColors.length] });
        }
      } else if (theme === 2) {
        // Theme 2: Splitters & Reflectors
        if (freeNodes.length >= 2) {
          const n1 = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          const n2 = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          reflectors.push({ type: rand() > 0.5 ? "REFLECTOR_UR" : "REFLECTOR_UL", col: n1.col, row: n1.row });
          splitters.push({ col: n2.col, row: n2.row });
        }
      } else if (theme === 3) {
        // Theme 3: Crumbling Tiles
        const numCrumble = 1 + Math.floor(rand() * 3);
        for (let c = 0; c < numCrumble && freeNodes.length > 0; c++) {
          const fn = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          crumblingTiles.push({ col: fn.col, row: fn.row, durability: 2 });
        }
      } else if (theme === 4) {
        // Theme 4: Switches, Lasers & Timed Gates
        if (freeNodes.length >= 3) {
          const n1 = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          const n2 = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          const n3 = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          
          switches.push({ col: n1.col, row: n1.row, target: "laser_pro" });
          let col2 = n2.col === 9 ? 8 : n2.col + 1;
          laserBarriers.push({
            id: "laser_pro",
            col1: n2.col,
            row1: n2.row,
            col2: col2,
            row2: n2.row,
            active: true
          });
          
          timedGates.push({ col: n3.col, row: n3.row, timer: 2 });
        }
      } else if (theme === 5) {
        // Theme 5: Teleport Portals
        if (freeNodes.length >= 2) {
          const n1 = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          const n2 = freeNodes.splice(Math.floor(rand() * freeNodes.length), 1)[0];
          portals.push({ col1: n1.col, row1: n1.row, col2: n2.col, row2: n2.row });
        }
      }

      success = checkSeededLevelSolvability(arrows, gates);
    }
  }

  // Fallback template: if success check failed, return the generated 50+ arrow level anyway instead of reverting to 2 arrows
  if (!success) {
    return {
      id: levelId,
      name: `Sector Map ${levelId}`,
      gates,
      carts,
      reflectors,
      splitters,
      crumblingTiles,
      switches,
      laserBarriers,
      timedGates,
      portals,
      arrows
    };
  }

  return {
    id: levelId,
    name: `Sector Map ${levelId}`,
    gates,
    carts,
    reflectors,
    splitters,
    crumblingTiles,
    switches,
    laserBarriers,
    timedGates,
    portals,
    arrows
  };
}

// Headless Solver Simulator
function checkSeededLevelSolvability(arrows, gates) {
  let simArrows = arrows.map(a => {
    return {
      id: a.id,
      color: a.color,
      strokeWidth: a.strokeWidth,
      path: a.path.map(p => ({ ...p })),
      status: "IDLE"
    };
  });

  let progressMade = true;
  while (progressMade) {
    progressMade = false;

    for (let i = 0; i < simArrows.length; i++) {
      const a = simArrows[i];
      if (a.status === "ESCAPED") continue;

      const collides = checkSimCollision(a, simArrows);
      if (!collides) {
        a.status = "ESCAPED";
        progressMade = true;
        break; 
      }
    }
  }

  return simArrows.every(a => a.status === "ESCAPED");
}

function checkSimCollision(moving, all) {
  const head = moving.path[moving.path.length - 1];
  const prev = moving.path[moving.path.length - 2];
  
  const dx = head.x - prev.x;
  const dy = head.y - prev.y;
  const len = Math.hypot(dx, dy);

  const exitRay = {
    start: head,
    end: {
      x: head.x + (dx / len) * 500,
      y: head.y + (dy / len) * 500
    }
  };

  const movingSegments = [];
  for (let i = 0; i < moving.path.length - 1; i++) {
    movingSegments.push({ start: moving.path[i], end: moving.path[i+1] });
  }
  movingSegments.push(exitRay);

  for (const other of all) {
    if (other.id === moving.id || other.status === "ESCAPED") continue;

    const otherSegments = [];
    for (let j = 0; j < other.path.length - 1; j++) {
      otherSegments.push({ start: other.path[j], end: other.path[j+1] });
    }

    for (const mSeg of movingSegments) {
      for (const oSeg of otherSegments) {
        const d = getMinDistanceBetweenSegmentsSim(mSeg.start, mSeg.end, oSeg.start, oSeg.end);
        const threshold = 4.5 * (moving.strokeWidth + other.strokeWidth);
        if (d < threshold) return true; 
      }
    }
  }
  return false;
}

function getMinDistanceBetweenSegmentsSim(p1, p2, p3, p4) {
  return Math.min(
    distToSegmentSim(p1, p3, p4),
    distToSegmentSim(p2, p3, p4),
    distToSegmentSim(p3, p1, p2),
    distToSegmentSim(p4, p1, p2)
  );
}

function distToSegmentSim(p, s1, s2) {
  const l2 = Math.pow(s2.x - s1.x, 2) + Math.pow(s2.y - s1.y, 2);
  if (l2 === 0) return Math.hypot(p.x - s1.x, p.y - s1.y);
  let t = ((p.x - s1.x) * (s2.x - s1.x) + (p.y - s1.y) * (s2.y - s1.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (s1.x + t * (s2.x - s1.x)), p.y - (s1.y + t * (s2.y - s1.y)));
}




function generateMazeProceduralLevel(levelId) {
  const rand = SeededRandom(levelId * 45 + 9812);
  const colorPool = ["#ab364f", "#3a69a4", "#5e9554", "#1e1b18"];
  const gates = [];
  const arrows = [];
  
  const theme = levelId === 30 ? 1 : 0; // Train level
  const minBound = theme === 1 ? 1 : 0;
  const maxBound = theme === 1 ? 11 : 12;

  let attempts = 0;
  let success = false;
  
  const occupiedNodes = new Set();
  let targetNumArrows = 12; // Start with 12 arrows

  while (!success && attempts < 150) {
    attempts++;
    arrows.length = 0;
    occupiedNodes.clear();
    
    for (let i = 0; i < targetNumArrows; i++) {
      let pathPlaced = false;
      let pathAttempts = 0;
      
      while (!pathPlaced && pathAttempts < 100) { // Try 100 times to fit an arrow!
        pathAttempts++;
        const path = [];
        
        let c = Math.floor(rand() * (maxBound - minBound + 1)) + minBound;
        let r = Math.floor(rand() * (maxBound - minBound + 1)) + minBound;
        
        if (occupiedNodes.has(`${c},${r}`)) continue;
        
        path.push({ col: c, row: r });
        let currentDir = ["U", "D", "L", "R"][Math.floor(rand() * 4)];
        let pathDeadEnd = false;
        
        while (!pathDeadEnd && path.length < 15) { // Max length 15
          let head = path[path.length - 1];
          let possibleDirs = [];
          
          for (let dir of ["U", "D", "L", "R"]) {
            if (currentDir === "U" && dir === "D") continue;
            if (currentDir === "D" && dir === "U") continue;
            if (currentDir === "L" && dir === "R") continue;
            if (currentDir === "R" && dir === "L") continue;
            
            let tc = head.col;
            let tr = head.row;
            if (dir === "U") tr -= 1;
            if (dir === "D") tr += 1;
            if (dir === "L") tc -= 1;
            if (dir === "R") tc += 1;
            
            if (tc >= minBound && tc <= maxBound && tr >= minBound && tr <= maxBound && !occupiedNodes.has(`${tc},${tr}`)) {
              // The new node cannot be in the path already.
              // Additionally, to prevent the arrow from touching itself side-by-side,
              // the new node must NOT be adjacent to any existing node in the path (except the current head).
              let touchesSelf = false;
              for (let i = 0; i < path.length - 2; i++) { // Ignore head AND the node right before head
                const p = path[i];
                if (Math.abs(p.col - tc) <= 1 && Math.abs(p.row - tr) <= 1) {
                   touchesSelf = true;
                   break;
                }
              }
              if (!touchesSelf && !path.some(p => p.col === tc && p.row === tr)) {
                possibleDirs.push(dir);
              }
            }
          }
          
          if (possibleDirs.length === 0) {
            pathDeadEnd = true;
          } else {
            let nextDir = possibleDirs[0];
            // 70% chance to go straight to create long segments
            if (possibleDirs.includes(currentDir) && rand() > 0.3) {
              nextDir = currentDir;
            } else {
              nextDir = possibleDirs[Math.floor(rand() * possibleDirs.length)];
            }
            
            currentDir = nextDir;
            let tc = head.col;
            let tr = head.row;
            if (currentDir === "U") tr -= 1;
            if (currentDir === "D") tr += 1;
            if (currentDir === "L") tc -= 1;
            if (currentDir === "R") tc += 1;
            
            path.push({ col: tc, row: tr });
          }
        }
        
        // ACCEPT paths that are between 4 and 15 nodes long
        if (path.length >= 4) {
          // Do NOT reverse path, so the head is at the end of the random walk (usually pointing to open space/boundary)
          // This drastically reduces deadlocks!
          const color = colorPool[Math.floor(rand() * colorPool.length)];
          const tempArrow = {
            id: `maze-a${i}`,
            color,
            strokeWidth: 1.0,
            speed: 8,
            path: path.map(p => getAbsCoords(p.col, p.row)),
            status: "IDLE"
          };
          
          arrows.push(tempArrow);
          if (checkSeededLevelSolvability(arrows, gates)) {
            path.forEach(p => occupiedNodes.add(`${p.col},${p.row}`));
            pathPlaced = true;
          } else {
            arrows.pop();
          }
        }
      }
    }
    
    // Add theme obstacles
    let carts = [];
    if (theme === 1 && arrows.length > 2) {
      const cartColors = ["#ab364f", "#3a69a4", "#5e9554", "#1e1b18"];
      const numCarts = 2 + Math.floor(rand() * 2);
      const usedPos = new Set();
      for (let c = 0; c < numCarts; c++) {
        let cp = Math.floor(rand() * 48);
        while (usedPos.has(cp)) { cp = Math.floor(rand() * 48); }
        usedPos.add(cp);
        carts.push({ pos: cp, color: cartColors[c % cartColors.length] });
      }
    }

    if (arrows.length >= 6) { 
      success = checkSeededLevelSolvability(arrows, gates);
    }
    
    if (!success) {
      if (attempts % 10 === 0 && targetNumArrows > 6) targetNumArrows--;
    } else {
       return {
        id: levelId,
        name: `Maze Sector ${levelId}`,
        gates,
        carts,
        reflectors: [],
        splitters: [],
        crumblingTiles: [],
        switches: [],
        laserBarriers: [],
        timedGates: [],
        portals: [],
        arrows
      };
    }
  }
  
  return {
    id: levelId,
    name: `Maze Sector ${levelId}`,
    gates,
    carts: [],
    reflectors: [],
    splitters: [],
    crumblingTiles: [],
    switches: [],
    laserBarriers: [],
    timedGates: [],
    portals: [],
    arrows
  };
}



// Master Level Retriever
function getLevel(levelId) {
  if (levelId > 20 && levelId <= 30) {
    return generateMazeProceduralLevel(levelId);
  }
  return generateProceduralLevel(levelId);
}
