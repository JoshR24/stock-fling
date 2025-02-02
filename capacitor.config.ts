import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rdykatenugsicxcvyqwe.app',
  appName: 'Trading App',
  webDir: 'dist',
  server: {
    url: 'https://rdykatenugsicxcvyqwe.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;