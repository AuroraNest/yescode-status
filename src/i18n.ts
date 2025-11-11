import { computed } from 'vue'
import { configService } from './services/configService'

const messages = {
  zh: {
    brand: 'yesCode 状态',
    status: {
      waiting: '等待配置 API Token',
      connecting: '正在连接 yesCode...',
      error: '连接失败',
      updated: '最后更新'
    },
    panel: {
      total: '总余额',
      subscription: '订阅',
      payg: '按量',
      weekSpent: '本周花费',
      dailyUsage: '订阅使用',
      weeklyUsage: '周使用',
      dailyHint: '已用当日额度',
      weeklyHint: '本周支出',
      hintWaiting: '点击下方配置 API Token 以开始同步',
      hintReady: '点击刷新',
      cta: '配置 / 管理',
      usage: '订阅已用',
      preference: {
        title: '扣费模式',
        subscription_first: '订阅优先',
        payg_only: '仅按量'
      }
    },
    taskbar: {
      subscriptionUsed: '订阅已用',
      total: '总余额',
      subscription: '订阅',
      payg: '按量',
      updated: '更新',
      open: '打开主面板',
      enlarge: '放大',
      settings: '设置',
      hide: '隐藏',
      unavailable: '暂不可用',
      notConfigured: '尚未配置 API Token',
      preference: {
        subscription_first: '订阅优先',
        payg_only: '仅按量'
      }
    },
    settings: {
      title: '配置 yesCode',
      desc: '只需填入 API Token，其他信息将自动同步',
      token: 'API Token',
      tokenPlaceholder: 'cr_xxxxxxxxxxxxx',
      toggle: { show: '显示', hide: '隐藏' },
      showTaskbar: '登录后自动显示任务栏面板',
      showFloating: '启用悬浮状态条',
      compact: '使用紧凑模式（悬浮条更窄更贴边）',
      preference: '扣费模式',
      preferenceOptions: {
        subscription_first: '订阅优先',
        payg_only: '仅按量'
      },
      plan: '订阅计划',
      daily: '每日额度',
      refresh: '刷新频率',
      test: '测试连接',
      testing: '测试中...',
      reset: '重置',
      cancel: '取消',
      save: '保存',
      language: '语言',
      langs: { zh: '中文', en: 'English' },
      hotkey: '全局快捷键',
      hotkeyPlaceholder: 'Ctrl+Y+E+S',
      hotkeyReset: '恢复默认',
      hotkeyPreview: '当前识别：'
    }
  },
  en: {
    brand: 'yesCode Status',
    status: {
      waiting: 'Configure API Token to begin',
      connecting: 'Connecting to yesCode...',
      error: 'Connection failed',
      updated: 'Updated'
    },
    panel: {
      total: 'Total Balance',
      subscription: 'Subscription',
      payg: 'Pay-as-you-go',
      weekSpent: 'Spent this week',
      dailyUsage: 'Daily usage',
      weeklyUsage: 'Weekly usage',
      dailyHint: 'of daily quota',
      weeklyHint: 'spent this week',
      hintWaiting: 'Paste your API Token below to start syncing',
      hintReady: 'Use refresh or settings to stay in control',
      cta: 'Configure / Manage',
      usage: 'Used',
      preference: {
        title: 'Billing preference',
        subscription_first: 'Subscription first',
        payg_only: 'Pay-as-you-go only'
      }
    },
    taskbar: {
      subscriptionUsed: 'Used',
      total: 'Total',
      subscription: 'Sub',
      payg: 'Pay-as-you-go',
      updated: 'Updated',
      open: 'Open panel',
      enlarge: 'Expand',
      settings: 'Settings',
      hide: 'Hide',
      unavailable: 'Unavailable',
      notConfigured: 'API Token required',
      preference: {
        subscription_first: 'Sub first',
        payg_only: 'Payg only'
      }
    },
    settings: {
      title: 'Configure yesCode',
      desc: 'Just enter your API Token, everything else syncs automatically',
      token: 'API Token',
      tokenPlaceholder: 'cr_xxxxxxxxxxxxx',
      toggle: { show: 'Show', hide: 'Hide' },
      showTaskbar: 'Show taskbar capsule after login',
      showFloating: 'Enable floating status bar',
      compact: 'Compact floating mode',
      preference: 'Billing preference',
      preferenceOptions: {
        subscription_first: 'Subscription first',
        payg_only: 'Pay-as-you-go only'
      },
      plan: 'Plan',
      daily: 'Daily quota',
      refresh: 'Refresh cadence',
      test: 'Test connection',
      testing: 'Testing...',
      reset: 'Reset',
      cancel: 'Cancel',
      save: 'Save',
      language: 'Language',
      langs: { zh: '中文', en: 'English' },
      hotkey: 'Global hotkey',
      hotkeyPlaceholder: 'Ctrl+Y+E+S',
      hotkeyReset: 'Reset default',
      hotkeyPreview: 'Detected as'
    }
  }
} as const

type Locale = keyof typeof messages

export function useI18n() {
  const locale = computed<Locale>(() => configService.preferences.language || 'zh')

  const t = (path: string): string => {
    const parts = path.split('.')
    let target: any = messages[locale.value]
    for (const part of parts) {
      target = target?.[part]
      if (target === undefined) break
    }
    return typeof target === 'string' ? target : path
  }

  return { t, locale }
}
