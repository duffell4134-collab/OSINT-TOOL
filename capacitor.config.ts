import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.osintnexus.app',
  appName: 'OSINT Nexus',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
