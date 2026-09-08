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
        this.showBanner(); // <--- Requirement 2: Show banner ad at bottom globally
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

  async showBanner() {
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    
    if (isNativeCapacitor && AdMob) {
      try {
        await AdMob.showBanner({
          adId: this.TEST_AD_UNITS.banner,
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: true
        });
      } catch (e) {
        console.warn('Banner ad error:', e);
      }
    }
  },

  async showRewardedAd(onRewardCallback) {
    if (!navigator.onLine) {
      alert('⚠️ No internet connection.\nPlease turn on your Wi-Fi or mobile data to watch ads and earn rewards.');
      return;
    }

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
          // Requirement 3: Only give reward if 'onRewardVideoAdReward' fired (user watched whole ad)
          if (rewardedItem && typeof onRewardCallback === 'function') {
            setTimeout(() => onRewardCallback(), 100);
          } else if (!rewardedItem) {
            // User closed ad early!
            console.log('Ad closed early, no reward given.');
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
        alert('Failed to load video ad. Please check your internet connection and try again.');
        // DANGER REMOVED: We no longer grant a free reward here on failure!
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
