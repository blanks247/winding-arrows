// Winding Arrows - Google AdMob Service (Official Test Ad Units)

const AdMobService = {
  // Official Google AdMob Test Ad Unit IDs
  TEST_AD_UNITS: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    banner: 'ca-app-pub-3940256099942544/6300978111'
  },

  isInitialized: false,

  async init() {
    if (this.isInitialized) return;
    if (window.Capacitor && window.Capacitor.isPluginAvailable('AdMob')) {
      try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: true
        });
        this.isInitialized = true;
      } catch (e) {
        console.warn('AdMob initialization warning:', e);
      }
    }
  },

  async showRewardedAd(onRewardCallback) {
    if (window.Capacitor && window.Capacitor.isPluginAvailable('AdMob')) {
      const { AdMob, RewardAdPluginEvents } = window.Capacitor.Plugins;
      try {
        await this.init();

        let rewardedItem = false;
        const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
          rewardedItem = true;
        });

        const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          if (rewardedItem && typeof onRewardCallback === 'function') {
            onRewardCallback();
          }
          rewardListener.remove();
          dismissListener.remove();
        });

        await AdMob.prepareRewardVideoAd({
          adId: this.TEST_AD_UNITS.rewarded,
          isTesting: true
        });

        await AdMob.showRewardVideoAd();
      } catch (e) {
        console.warn('Error displaying Rewarded Ad, granting fallback reward:', e);
        // Fallback for web / local testing
        if (typeof onRewardCallback === 'function') {
          onRewardCallback();
        }
      }
    } else {
      // Local dev server fallback test notification
      alert('🎥 [Test Ad] Watching Rewarded Video Ad...\n\nReward Granted: +1 Free Hint! 💡');
      if (typeof onRewardCallback === 'function') {
        onRewardCallback();
      }
    }
  }
};
