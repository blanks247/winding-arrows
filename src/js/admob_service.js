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
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;

    if (isNativeCapacitor && AdMob) {
      try {
        await this.init();

        let rewardedItem = false;
        
        // Add event listeners for rewarded video completion
        const rewardListener = await AdMob.addListener('onRewardVideoAdReward', () => {
          rewardedItem = true;
        });

        const dismissListener = await AdMob.addListener('onRewardVideoAdDismissed', () => {
          if (rewardedItem && typeof onRewardCallback === 'function') {
            onRewardCallback();
          }
          if (rewardListener && rewardListener.remove) rewardListener.remove();
          if (dismissListener && dismissListener.remove) dismissListener.remove();
        });

        await AdMob.prepareRewardVideoAd({
          adId: this.TEST_AD_UNITS.rewarded,
          isTesting: true
        });

        await AdMob.showRewardVideoAd();
      } catch (e) {
        console.warn('Native AdMob error:', e);
        if (typeof onRewardCallback === 'function') {
          onRewardCallback();
        }
      }
    } else {
      // Web / Browser test notification
      alert('🎥 [Test Ad] Watching Rewarded Video Ad...\n\nReward Granted: +1 Free Hint! 💡');
      if (typeof onRewardCallback === 'function') {
        onRewardCallback();
      }
    }
  }
};
