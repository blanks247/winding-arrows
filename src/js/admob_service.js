// Winding Arrows - Google AdMob Service

const AdMobService = {
  // Official Live Ad Unit IDs
  AD_UNITS: {
    rewarded: 'ca-app-pub-3273633685340729/6644140798',
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Fallback test ID
    banner: 'ca-app-pub-3273633685340729/8012073104'
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
          initializeForTesting: false
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
          adId: this.AD_UNITS.rewarded,
          isTesting: false
        });
        this.isAdPreloaded = true;
      } catch (e) {
        console.warn('Preload ad warning:', e);
      }
    }
  },

  async showBanner() {
    if (!navigator.onLine) return;
    
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    
    if (isNativeCapacitor && AdMob) {
      try {
        await AdMob.showBanner({
          adId: this.AD_UNITS.banner,
          adSize: 'BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: false
        });
        document.body.classList.add('banner-active');
      } catch (e) {
        console.warn('Banner ad error:', e);
        document.body.classList.remove('banner-active');
      }
    }
  },

  async hideBanner() {
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    
    if (isNativeCapacitor && AdMob) {
      try {
        if (AdMob.removeBanner) {
          await AdMob.removeBanner();
        } else {
          await AdMob.hideBanner();
        }
        document.body.classList.remove('banner-active');
      } catch (e) {
        console.warn('Hide banner error:', e);
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
          // Grant reward instantly, but use a small timeout to allow the WebView to unfreeze after the native ad finishes
          if (typeof onRewardCallback === 'function') {
            setTimeout(() => {
              if (typeof onRewardCallback === 'function') {
                onRewardCallback();
                onRewardCallback = null; // Prevent double firing
              }
            }, 300);
          }
        });

        const dismissListener = await AdMob.addListener('onRewardVideoAdDismissed', () => {
          hideSpinner();
          this.isAdPreloaded = false;
          
          if (!rewardedItem) {
            console.log('Ad closed early, no reward given.');
          }

          if (rewardListener && rewardListener.remove) rewardListener.remove();
          if (dismissListener && dismissListener.remove) dismissListener.remove();

          // Immediately preload next ad in background!
          setTimeout(() => this.preloadRewardedAd(), 1000);
        });

        if (!this.isAdPreloaded) {
          await AdMob.prepareRewardVideoAd({
            adId: this.AD_UNITS.rewarded,
            isTesting: false
          });
        }

        hideSpinner();
        await AdMob.showRewardVideoAd();
      } catch (e) {
        console.warn('Native AdMob error:', e);
        hideSpinner();
        alert('No ad available right now. Please try again later.');
      }
    } else {
      // Web / Browser test notification
      setTimeout(() => {
        hideSpinner();
        alert('🎥 [Test Ad] Watching Rewarded Video Ad...\n\nReward Granted! 🎁');
        if (typeof onRewardCallback === 'function') {
          onRewardCallback();
        }
      }, 800);
    }
  }
};
