/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-mixed-operators */

import Vue from 'vue'

export const isSSR = typeof window === 'undefined'
export let fromSSR = false
export let onSSR = isSSR

function getMatch (userAgent, platformMatch) {
  const match = /(edge|edga|edgios)\/([\w.]+)/.exec(userAgent) ||
    /(opr)[\/]([\w.]+)/.exec(userAgent) ||
    /(vivaldi)[\/]([\w.]+)/.exec(userAgent) ||
    /(chrome|crios)[\/]([\w.]+)/.exec(userAgent) ||
    /(iemobile)[\/]([\w.]+)/.exec(userAgent) ||
    /(version)(applewebkit)[\/]([\w.]+).*(safari)[\/]([\w.]+)/.exec(userAgent) ||
    /(webkit)[\/]([\w.]+).*(version)[\/]([\w.]+).*(safari)[\/]([\w.]+)/.exec(userAgent) ||
    /(firefox|fxios)[\/]([\w.]+)/.exec(userAgent) ||
    /(webkit)[\/]([\w.]+)/.exec(userAgent) ||
    /(opera)(?:.*version|)[\/]([\w.]+)/.exec(userAgent) ||
    /(msie) ([\w.]+)/.exec(userAgent) ||
    userAgent.indexOf('trident') >= 0 && /(rv)(?::| )([\w.]+)/.exec(userAgent) ||
    userAgent.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(userAgent) ||
    []

  return {
    browser: match[5] || match[3] || match[1] || '',
    version: match[2] || match[4] || '0',
    versionNumber: match[4] || match[2] || '0',
    platform: platformMatch[0] || ''
  }
}

function getClientUserAgent () {
  return (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
}

function getPlatformMatch (userAgent) {
  return /(ipad)/.exec(userAgent) ||
    /(ipod)/.exec(userAgent) ||
    /(windows phone)/.exec(userAgent) ||
    /(iphone)/.exec(userAgent) ||
    /(kindle)/.exec(userAgent) ||
    /(silk)/.exec(userAgent) ||
    /(android)/.exec(userAgent) ||
    /(win)/.exec(userAgent) ||
    /(mac)/.exec(userAgent) ||
    /(linux)/.exec(userAgent) ||
    /(cros)/.exec(userAgent) ||
    /(playbook)/.exec(userAgent) ||
    /(bb)/.exec(userAgent) ||
    /(blackberry)/.exec(userAgent) ||
    []
}

function getPlatform (userAgent) {
  const
    platformMatch = getPlatformMatch(userAgent),
    matched = getMatch(userAgent, platformMatch),
    browser = {}

  if (matched.browser) {
    browser[matched.browser] = true
    browser.version = matched.version
    browser.versionNumber = parseInt(matched.versionNumber, 10)
  }

  if (matched.platform) {
    browser[matched.platform] = true
  }

  const knownMobiles = browser.android ||
    browser.ios ||
    browser.bb ||
    browser.blackberry ||
    browser.ipad ||
    browser.iphone ||
    browser.ipod ||
    browser.kindle ||
    browser.playbook ||
    browser.silk ||
    browser['windows phone']

  // These are all considered mobile platforms, meaning they run a mobile browser
  if (knownMobiles === true || userAgent.indexOf('mobile') > -1) {
    browser.mobile = true

    if (browser.edga || browser.edgios) {
      browser.edge = true
      matched.browser = 'edge'
    }
    else if (browser.crios) {
      browser.chrome = true
      matched.browser = 'chrome'
    }
    else if (browser.fxios) {
      browser.firefox = true
      matched.browser = 'firefox'
    }
  }
  // If it's not mobile we should consider it's desktop platform, meaning it runs a desktop browser
  // It's a workaround for anonymized user agents
  // (browser.cros || browser.mac || browser.linux || browser.win)
  else {
    browser.desktop = true
  }

  // Set iOS if on iPod, iPad or iPhone
  if (browser.ipod || browser.ipad || browser.iphone) {
    browser.ios = true
  }

  if (browser['windows phone']) {
    browser.winphone = true
    delete browser['windows phone']
  }

  // Chrome, Opera 15+, Vivaldi and Safari are webkit based browsers
  if (
    browser.chrome ||
    browser.opr ||
    browser.safari ||
    browser.vivaldi ||
    // we expect unknown, non iOS mobile browsers to be webkit based
    (
      browser.mobile === true &&
      browser.ios !== true &&
      knownMobiles !== true
    )
  ) {
    browser.webkit = true
  }

  // IE11 has a new token so we will assign it msie to avoid breaking changes
  if (browser.rv || browser.iemobile) {
    matched.browser = 'ie'
    browser.ie = true
  }

  // Blackberry browsers are marked as Safari on BlackBerry
  if (browser.safari && browser.blackberry || browser.bb) {
    matched.browser = 'blackberry'
    browser.blackberry = true
  }

  // Playbook browsers are marked as Safari on Playbook
  if (browser.safari && browser.playbook) {
    matched.browser = 'playbook'
    browser.playbook = true
  }

  // Opera 15+ are identified as opr
  if (browser.opr) {
    matched.browser = 'opera'
    browser.opera = true
  }

  // Stock Android browsers are marked as Safari on Android.
  if (browser.safari && browser.android) {
    matched.browser = 'android'
    browser.android = true
  }

  // Kindle browsers are marked as Safari on Kindle
  if (browser.safari && browser.kindle) {
    matched.browser = 'kindle'
    browser.kindle = true
  }

  // Kindle Silk browsers are marked as Safari on Kindle
  if (browser.safari && browser.silk) {
    matched.browser = 'silk'
    browser.silk = true
  }

  if (browser.vivaldi) {
    matched.browser = 'vivaldi'
    browser.vivaldi = true
  }

  // Assign the name and platform variable
  browser.name = matched.browser
  browser.platform = matched.platform

  if (isSSR === false) {
    if (window.process && window.process.versions && window.process.versions.electron) {
      browser.electron = true
    }
    else if (document.location.href.indexOf('-extension://') > -1) {
      browser.bex = true
    }
    else if (window.Capacitor !== void 0) {
      browser.capacitor = true
      browser.nativeMobile = true
      browser.nativeMobileWrapper = 'capacitor'
    }
    else if (window._cordovaNative !== void 0 || window.cordova !== void 0) {
      browser.cordova = true
      browser.nativeMobile = true
      browser.nativeMobileWrapper = 'cordova'
    }

    fromSSR = browser.nativeMobile === void 0 &&
      browser.electron === void 0 &&
      !!document.querySelector('[data-server-rendered]')

    fromSSR === true && (onSSR = true)
  }

  return browser
}

let webStorage

export function hasWebStorage () {
  if (webStorage !== void 0) {
    return webStorage
  }

  try {
    if (window.localStorage) {
      webStorage = true
      return true
    }
  }
  catch (e) {}

  webStorage = false
  return false
}

function getClientProperties () {
  return {
    has: {
      touch: (() => 'ontouchstart' in window ||
        window.navigator.maxTouchPoints > 0
      )(),
      webStorage: hasWebStorage()
    },
    within: {
      iframe: window.self !== window.top
    }
  }
}

export default {
  has: {
    touch: false,
    webStorage: false
  },
  within: { iframe: false },

  parseSSR (/* ssrContext */ ssr) {
    if (ssr) {
      const userAgent = (ssr.req.headers['user-agent'] || ssr.req.headers['User-Agent'] || '').toLowerCase()
      return {
        userAgent,
        is: getPlatform(userAgent),
        has: this.has,
        within: this.within
      }
    }

    const userAgent = getClientUserAgent()
    return {
      userAgent,
      is: getPlatform(userAgent),
      ...getClientProperties()
    }
  },

  install ($q, queues) {
    if (isSSR === true) {
      queues.server.push((q, ctx) => {
        q.platform = this.parseSSR(ctx.ssr)
      })
      return
    }

    this.userAgent = getClientUserAgent()
    this.is = getPlatform(this.userAgent)

    if (fromSSR === true) {
      queues.takeover.push(q => {
        onSSR = fromSSR = false
        Object.assign(q.platform, getClientProperties())
      })
      Vue.util.defineReactive($q, 'platform', this)
    }
    else {
      Object.assign(this, getClientProperties())
      $q.platform = this
    }
  }
}
