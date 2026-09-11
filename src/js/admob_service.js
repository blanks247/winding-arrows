// Winding Arrows - Google AdMob Service

const AdMobService = {
  // Official Live Ad Unit IDs
  AD_UNITS: {
    rewarded: 'ca-app-pub-3273633685340729/6644140798',
    interstitial: 'ca-app-pub-3273633685340729/5524017277',
    banner: 'ca-app-pub-3273633685340729/8012073104'
  },

  isInitialized: false,
  isAdPreloaded: false,
  isInterstitialPreloaded: false,

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
        this.preloadInterstitialAd();
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
    document.body.classList.add('banner-active');

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
        const rewardListener = await AdMob.addListener('onRewardedVideoAdReward', () => {
          rewardedItem = true;
        });

        const dismissListener = await AdMob.addListener('onRewardedVideoAdDismissed', () => {
          hideSpinner();
          this.isAdPreloaded = false;
          
          // Wait 500ms before checking reward to guarantee the JS bridge has updated the rewardedItem flag
          setTimeout(() => {
            if (rewardedItem && typeof onRewardCallback === 'function') {
              onRewardCallback();
            } else if (!rewardedItem) {
              console.log('Ad closed early, no reward given.');
            }
          }, 500);

          // Delay removing listeners for 2 seconds just in case the JS bridge is heavily delayed
          setTimeout(() => {
            if (rewardListener && rewardListener.remove) rewardListener.remove();
            if (dismissListener && dismissListener.remove) dismissListener.remove();
          }, 2000);

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
  },

  async preloadInterstitialAd() {
    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    if (isNativeCapacitor && AdMob && !this.isInterstitialPreloaded) {
      try {
        await AdMob.prepareInterstitial({
          adId: this.AD_UNITS.interstitial,
          isTesting: false
        });
        this.isInterstitialPreloaded = true;
      } catch (e) {
        console.warn('Preload interstitial error:', e);
      }
    }
  },

  async showInterstitialAd(onCompleteCallback) {
    if (!navigator.onLine) {
      if (typeof onCompleteCallback === 'function') onCompleteCallback();
      return;
    }

    const isNativeCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;

    const proceed = () => {
      if (typeof onCompleteCallback === 'function') onCompleteCallback();
      this.preloadInterstitialAd();
    };

    if (isNativeCapacitor && AdMob) {
      try {
        await this.init();

        const dismissListener = await AdMob.addListener('interstitialAdDismissed', () => {
          proceed();
          if (dismissListener && dismissListener.remove) dismissListener.remove();
        });

        const failListener = await AdMob.addListener('interstitialAdFailedToShow', () => {
          proceed();
          if (failListener && failListener.remove) failListener.remove();
        });

        await AdMob.showInterstitial();
        this.isInterstitialPreloaded = false; // Need to reload after showing
      } catch (e) {
        console.warn('Show interstitial error:', e);
        proceed();
      }
    } else {
      proceed();
    }
  }
};
