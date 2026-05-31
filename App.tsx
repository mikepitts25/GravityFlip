import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { initAds } from './src/services/ads';
import { initAnalytics, track } from './src/services/analytics';
import { initAudio } from './src/services/audio';
import { initIAP } from './src/services/iap';
import { useMetaStore } from './src/state/metaStore';

type Route = 'home' | 'game' | 'shop' | 'settings';

export default function App() {
  const [route, setRoute] = useState<Route>('home');
  const hydrate = useMetaStore((s) => s.hydrate);
  const hydrated = useMetaStore((s) => s.hydrated);

  // One-time boot: load saved data and initialize optional services.
  useEffect(() => {
    void hydrate();
    void initAnalytics().then(() => track('session_start'));
    void initAudio();
    void initAds();
    void initIAP();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {!hydrated ? null : route === 'home' ? (
          <HomeScreen
            onPlay={() => setRoute('game')}
            onShop={() => setRoute('shop')}
            onSettings={() => setRoute('settings')}
          />
        ) : route === 'game' ? (
          <GameScreen onExit={() => setRoute('home')} />
        ) : route === 'shop' ? (
          <ShopScreen onBack={() => setRoute('home')} />
        ) : (
          <SettingsScreen onBack={() => setRoute('home')} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
