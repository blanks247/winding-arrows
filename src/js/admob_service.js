// Winding Arrows - Google AdMob Service (Official Test Ad Units)

const AdMobService = {
  // Official Google AdMob Test Ad Unit IDs
  TEST_AD_UNITS: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    banner: 'ca-app-pub-3940256099942544/6300978111'
  },

  isInitialized: false,
  isAdPreloaded: false,

  async init() {
    if (this.isInitialized) return;
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;

    if (isNativeCapacitor && AdMob) {
      try {
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: true
        });
        this.isInitialized = true;
        this.preloadRewardedAd();
      } catch (e) {
        console.warn('AdMob initialization warning:', e);
      }
    }
  },

  async preloadRewardedAd() {
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    if (isNativeCapacitor && AdMob && !this.isAdPreloaded) {
      try {
        await AdMob.prepareRewardVideoAd({
          adId: this.TEST_AD_UNITS.rewarded,
          isTesting: true
        });
        this.isAdPreloaded = true;
      } catch (e) {
        console.warn('Preload ad warning:', e);
      }
    }
  },

  async showRewardedAd(onRewardCallback) {
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;

    const adLoadingOverlay = document.getElementById('ad-loading-overlay');
    if (adLoadingOverlay) adLoadingOverlay.classList.add('active');

    const hideSpinner = () => {
      if (adLoadingOverlay) adLoadingOverlay.classList.remove('active');
    };

    if (isNativeCapacitor && AdMob) {
      try {
        await this.init();

        let rewardedItem = false;
        
        // Listeners for rewarded video completion & dismissal
        const rewardListener = await AdMob.addListener('onRewardVideoAdReward', () => {
          rewardedItem = true;
        });

        const dismissListener = await AdMob.addListener('onRewardVideoAdDismissed', () => {
          hideSpinner();
          this.isAdPreloaded = false;
          if (rewardedItem && typeof onRewardCallback === 'function') {
            setTimeout(() => onRewardCallback(), 100);
          }
          if (rewardListener && rewardListener.remove) rewardListener.remove();
          if (dismissListener && dismissListener.remove) dismissListener.remove();

          // Immediately preload next ad in background!
          setTimeout(() => this.preloadRewardedAd(), 1000);
        });

        if (!this.isAdPreloaded) {
          await AdMob.prepareRewardVideoAd({
            adId: this.TEST_AD_UNITS.rewarded,
            isTesting: true
          });
        }

        hideSpinner();
        await AdMob.showRewardVideoAd();
      } catch (e) {
        console.warn('Native AdMob error:', e);
        hideSpinner();
        if (typeof onRewardCallback === 'function') {
          onRewardCallback();
        }
      }
    } else {
      // Web / Browser test notification
      setTimeout(() => {
        hideSpinner();
        alert('🎥 [Test Ad] Watching Rewarded Video Ad...\n\nReward Granted! 💡');
        if (typeof onRewardCallback === 'function') {
          onRewardCallback();
        }
      }, 800);
    }
  }
};
