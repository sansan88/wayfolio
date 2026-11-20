import type { CapacitorConfig } from '@capacitor/cli'

// iOS-App folgt in Phase 3 (`npx cap add ios`). appId vor dem ersten App-Store-Upload festlegen.
const config: CapacitorConfig = {
  appId: 'app.wayfolio',
  appName: 'Wayfolio',
  webDir: 'dist',
}

export default config
