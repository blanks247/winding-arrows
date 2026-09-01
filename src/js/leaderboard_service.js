// Winding Arrows - Real Live Leaderboard & Cloud Sync Service

const LeaderboardService = {
  // Public Firebase Realtime Database / REST endpoint for live global leaderboard
  API_URL: 'https://winding-arrows-default-rtdb.firebaseio.com/leaderboard',

  getPlayerProfile() {
    let playerId = localStorage.getItem('winding_player_uuid');
    if (!playerId) {
      playerId = 'player_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('winding_player_uuid', playerId);
    }
    let playerName = localStorage.getItem('winding_player_name');
    if (!playerName) {
      playerName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('winding_player_name', playerName);
    }
    let avatar = localStorage.getItem('winding_player_avatar') || '🦊';
    return { playerId, playerName, avatar };
  },

  setPlayerProfile(newName, newAvatar) {
    const trimmedName = (newName || '').trim().substring(0, 16);
    if (trimmedName) {
      localStorage.setItem('winding_player_name', trimmedName);
    }
    if (newAvatar) {
      localStorage.setItem('winding_player_avatar', newAvatar);
    }
    this.syncProgress();
  },

  async syncProgress(clearedLevelId) {
    const { playerId, playerName, avatar } = this.getPlayerProfile();
    const clearedLevels = JSON.parse(localStorage.getItem('winding_cleared_levels')) || [];
    const maxLevel = clearedLevels.length > 0 ? Math.max(...clearedLevels) : 0;
    
    if (clearedLevelId && clearedLevelId > maxLevel) {
      clearedLevels.push(clearedLevelId);
      localStorage.setItem('winding_cleared_levels', JSON.stringify(clearedLevels));
    }

    const currentMax = clearedLevels.length > 0 ? Math.max(...clearedLevels) : 0;

    const payload = {
      name: playerName,
      avatar: avatar,
      maxLevel: currentMax,
      totalCleared: clearedLevels.length,
      lastUpdated: Date.now()
    };

    // Save locally
    const localDb = JSON.parse(localStorage.getItem('winding_global_leaderboard')) || {};
    localDb[playerId] = payload;
    localStorage.setItem('winding_global_leaderboard', JSON.stringify(localDb));

    // Async Cloud Push to Live Backend
    try {
      await fetch(`${this.API_URL}/${playerId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Graceful offline fallback
    }
  },

  async fetchGlobalLeaderboard() {
    let playersMap = {};

    try {
      const res = await fetch(`${this.API_URL}.json?orderBy="maxLevel"&limitToLast=50`);
      if (res.ok) {
        playersMap = (await res.json()) || {};
      }
    } catch (e) {
      // Fallback to local cached data
      playersMap = JSON.parse(localStorage.getItem('winding_global_leaderboard')) || {};
    }

    // Include current player profile if offline or missing
    const { playerId, playerName, avatar } = this.getPlayerProfile();
    const clearedLevels = JSON.parse(localStorage.getItem('winding_cleared_levels')) || [];
    const currentMax = clearedLevels.length > 0 ? Math.max(...clearedLevels) : 0;
    
    if (!playersMap[playerId]) {
      playersMap[playerId] = {
        name: playerName,
        avatar: avatar,
        maxLevel: currentMax,
        totalCleared: clearedLevels.length,
        lastUpdated: Date.now()
      };
    }

    // Convert map to sorted array
    const sorted = Object.keys(playersMap).map(id => ({
      id,
      name: playersMap[id].name || 'Anonymous',
      avatar: playersMap[id].avatar || '🦊',
      maxLevel: playersMap[id].maxLevel || 0,
      totalCleared: playersMap[id].totalCleared || 0,
      lastUpdated: playersMap[id].lastUpdated || 0
    })).sort((a, b) => {
      if (b.maxLevel !== a.maxLevel) return b.maxLevel - a.maxLevel;
      return a.lastUpdated - b.lastUpdated; // Earlier level 100 solver wins rank 1!
    });

    // Determine Hall of Fame winner (First player to clear Level 100)
    const level100Winner = sorted.find(p => p.maxLevel >= 100);

    return {
      players: sorted,
      level100Winner,
      currentPlayerId: playerId
    };
  }
};
