// 2025-01-03 18:30:07 claude添加以下代码
export interface ApiResponse {
  total_balance: number
  subscription_balance: number
  pay_as_you_go_balance: number
  balance: number
  daily_usage?: number
}

export interface AppConfig {
  apiToken: string
  apiEndpoint: string
  refreshInterval: number
  dailyLimit: number
}

export class ApiService {
  private static instance: ApiService
  private config: AppConfig = {
    apiToken: '',
    apiEndpoint: 'https://co.yes.vg/api/v1/claude/balance',
    refreshInterval: 60,
    dailyLimit: 100
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  private constructor() {
    this.loadConfig()
  }

  // 加载配置
  private loadConfig() {
    try {
      const savedConfig = localStorage.getItem('floating-bar-config')
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) }
      }
    } catch (error) {
      // 2025年08月02日16时51分32秒有claude修改以下代码
      // console.error('加载配置失败:', error)
      // 2025年08月02日16时51分32秒claude结束操作以上代码
    }
  }

  // 保存配置
  public saveConfig(config: Partial<AppConfig>) {
    this.config = { ...this.config, ...config }
    try {
      localStorage.setItem('floating-bar-config', JSON.stringify(this.config))
    } catch (error) {
      // 2025年08月02日16时51分32秒有claude修改以下代码
      // console.error('保存配置失败:', error)
      // 2025年08月02日16时51分32秒claude结束操作以上代码
    }
  }

  // 获取配置
  public getConfig(): AppConfig {
    return { ...this.config }
  }

  // 获取 API 数据
  public async fetchBalance(): Promise<ApiResponse> {
    if (!this.config.apiToken) {
      throw new Error('API Token 未配置')
    }

    // 2025年08月02日16时51分32秒有claude修改以下代码
    // console.debug("claude-code打印调试日志：发起 API 请求", this.config.apiEndpoint)
    // 2025年08月02日16时51分32秒claude结束操作以上代码

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(this.config.apiEndpoint, {
      method: 'GET',
      headers: {
        'X-API-Key': this.config.apiToken,
        'Content-Type': 'application/json',
        'User-Agent': 'FloatingBar/1.0.0'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    // 2025年08月02日16时51分32秒有claude修改以下代码
    // console.debug("claude-code打印调试日志：API 响应数据", data)
    // 2025年08月02日16时51分32秒claude结束操作以上代码
    
    return data
  }

  // 测试 API 连接
  public async testConnection(): Promise<boolean> {
    try {
      await this.fetchBalance()
      return true
    } catch (error) {
      // 2025年08月02日16时51分32秒有claude修改以下代码
      // console.error('API 连接测试失败:', error)
      // 2025年08月02日16时51分32秒claude结束操作以上代码
      return false
    }
  }

  // 计算使用百分比
  public calculateUsagePercentage(subscriptionBalance: number): number {
    const usedAmount = Math.max(0, this.config.dailyLimit - subscriptionBalance)
    return Math.min(100, (usedAmount / this.config.dailyLimit) * 100)
  }

  // 格式化余额显示
  public formatBalance(balance: number): string {
    return `$${balance.toFixed(2)}`
  }

  // 格式化百分比显示
  public formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`
  }
}

// 导出单例实例
export const apiService = ApiService.getInstance()
// 2025-01-03 18:30:07 claude结束操作以上代码