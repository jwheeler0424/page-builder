/**
 * Device Presets for VirtualWindow
 *
 * Accurate dimensions and specifications for common devices
 */

export interface DevicePreset {
  name: string;
  displayName: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  category: "mobile" | "tablet" | "desktop" | "watch";
  hasNotch?: boolean;
  chrome?: {
    top?: number;
    bottom?: number;
  };
}

export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  // iPhone Models
  "iphone-15-pro": {
    name: "iphone-15-pro",
    displayName: "iPhone 15 Pro",
    width: 393,
    height: 852,
    pixelRatio: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    category: "mobile",
    hasNotch: true,
    chrome: {
      top: 59,
      bottom: 34,
    },
  },

  "iphone-15-pro-max": {
    name: "iphone-15-pro-max",
    displayName: "iPhone 15 Pro Max",
    width: 430,
    height: 932,
    pixelRatio: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    category: "mobile",
    hasNotch: true,
    chrome: {
      top: 59,
      bottom: 34,
    },
  },

  "iphone-14": {
    name: "iphone-14",
    displayName: "iPhone 14",
    width: 390,
    height: 844,
    pixelRatio: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    category: "mobile",
    hasNotch: true,
    chrome: {
      top: 47,
      bottom: 34,
    },
  },

  "iphone-se": {
    name: "iphone-se",
    displayName: "iPhone SE",
    width: 375,
    height: 667,
    pixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    category: "mobile",
    chrome: {
      top: 20,
      bottom: 0,
    },
  },

  // iPad Models
  "ipad-pro-12.9": {
    name: "ipad-pro-12.9",
    displayName: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    category: "tablet",
    chrome: {
      top: 20,
      bottom: 0,
    },
  },

  "ipad-air": {
    name: "ipad-air",
    displayName: "iPad Air",
    width: 820,
    height: 1180,
    pixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    category: "tablet",
    chrome: {
      top: 20,
      bottom: 0,
    },
  },

  "ipad-mini": {
    name: "ipad-mini",
    displayName: "iPad Mini",
    width: 744,
    height: 1133,
    pixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    category: "tablet",
    chrome: {
      top: 20,
      bottom: 0,
    },
  },

  // Android Phones
  "pixel-7-pro": {
    name: "pixel-7-pro",
    displayName: "Google Pixel 7 Pro",
    width: 412,
    height: 915,
    pixelRatio: 3.5,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    category: "mobile",
    chrome: {
      top: 24,
      bottom: 0,
    },
  },

  "pixel-7": {
    name: "pixel-7",
    displayName: "Google Pixel 7",
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    category: "mobile",
    chrome: {
      top: 24,
      bottom: 0,
    },
  },

  "galaxy-s23-ultra": {
    name: "galaxy-s23-ultra",
    displayName: "Samsung Galaxy S23 Ultra",
    width: 412,
    height: 915,
    pixelRatio: 3.5,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-S918U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    category: "mobile",
    chrome: {
      top: 24,
      bottom: 0,
    },
  },

  "galaxy-s23": {
    name: "galaxy-s23",
    displayName: "Samsung Galaxy S23",
    width: 360,
    height: 780,
    pixelRatio: 3,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-S911U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    category: "mobile",
    chrome: {
      top: 24,
      bottom: 0,
    },
  },

  // Android Tablets
  "galaxy-tab-s8": {
    name: "galaxy-tab-s8",
    displayName: "Samsung Galaxy Tab S8",
    width: 753,
    height: 1037,
    pixelRatio: 2.125,
    userAgent:
      "Mozilla/5.0 (Linux; Android 12; SM-X706B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
    category: "tablet",
    chrome: {
      top: 24,
      bottom: 0,
    },
  },

  // Desktop/Laptop
  "macbook-pro-14": {
    name: "macbook-pro-14",
    displayName: 'MacBook Pro 14"',
    width: 1512,
    height: 982,
    pixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
    category: "desktop",
  },

  "macbook-air-13": {
    name: "macbook-air-13",
    displayName: 'MacBook Air 13"',
    width: 1280,
    height: 832,
    pixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
    category: "desktop",
  },

  // Smart Watch
  "apple-watch-series-9": {
    name: "apple-watch-series-9",
    displayName: "Apple Watch Series 9",
    width: 205,
    height: 251,
    pixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    category: "watch",
  },
};

export const DEVICE_CATEGORIES = {
  mobile: [
    "iphone-15-pro",
    "iphone-15-pro-max",
    "iphone-14",
    "iphone-se",
    "pixel-7-pro",
    "pixel-7",
    "galaxy-s23-ultra",
    "galaxy-s23",
  ],
  tablet: ["ipad-pro-12.9", "ipad-air", "ipad-mini", "galaxy-tab-s8"],
  desktop: ["macbook-pro-14", "macbook-air-13"],
  watch: ["apple-watch-series-9"],
} as const;

export function getDevicePreset(name: string): DevicePreset | undefined {
  return DEVICE_PRESETS[name];
}

export function getDevicesByCategory(
  category: DevicePreset["category"],
): DevicePreset[] {
  return Object.values(DEVICE_PRESETS).filter(
    (device) => device.category === category,
  );
}
