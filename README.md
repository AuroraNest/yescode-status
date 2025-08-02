# 🚀 yesCode 悬浮工具栏

基于 **Electron + Vue 3** 的桌面悬浮工具栏应用，用于实时监控 yesCode Claude API 使用情况。常驻屏幕顶部，支持鼠标悬停展开详细信息，轻量美观，操作便捷。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## ✨ 特性

- 🖥️ **桌面悬浮** - 无边框透明窗口，始终置顶显示
- 📊 **实时监控** - 自动获取 yesCode API 余额和使用情况
- 🎯 **鼠标悬停** - 智能展开/收起，显示详细统计信息
- 🖱️ **自由拖动** - 可移动到屏幕任意位置，记住位置设置
- ⚙️ **配置管理** - 简洁的设置界面，数据本地安全存储
- 🔄 **自动刷新** - 可配置的定时更新间隔
- 🎨 **美观界面** - 现代化设计，毛玻璃效果和平滑动画

## 📸 效果预览

### 收起状态
![收起状态](screenshots/compact.png)
*简洁的单行显示，显示总余额和使用百分比*

### 展开状态  
![展开状态](screenshots/expanded.png)
*详细的余额信息和进度条显示*

### 设置界面
![设置界面](screenshots/settings.png)
*简单易用的配置界面*

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **Windows 10+** / **macOS 10.13+** / **Linux**

### 安装使用

1. **克隆项目**
```bash
git clone https://github.com/yourusername/my-floating-bar.git
cd my-floating-bar
```

2. **安装依赖**
```bash
npm install
```

3. **开发模式运行**
```bash
npm run dev
```

4. **打包生成可执行文件**
```bash
npm run build
```

### 首次配置

1. 启动应用后，屏幕顶部会出现悬浮工具栏
2. 点击 "⚙️ 未配置 - 请设置 API Token" 文字
3. 在弹出的设置窗口中输入你的 yesCode API Token
4. 配置完成后即可开始监控

## ⚙️ 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| **API Token** | yesCode API 密钥 (格式: cr_xxxxxxxx) | - |
| **API 端点** | 数据接口地址 | https://co.yes.vg/api/v1/claude/balance |
| **刷新间隔** | 自动更新间隔 (10-3600秒) | 60秒 |
| **每日订阅额度** | 用于计算使用百分比 | $100 |

## 🎮 使用方法

### 基本操作
- **悬停展开** - 鼠标移到悬浮栏上自动展开详细信息
- **点击切换** - 点击状态文字手动控制展开/收起
- **拖动移位** - 按住文字区域拖动到任意位置
- **右键菜单** - 系统托盘图标提供显示/隐藏控制

### 功能按钮
- **🔄 刷新** - 立即获取最新数据
- **⚙️ 设置** - 打开配置界面
- **× 关闭** - 退出应用

### 显示信息
- **总余额** - 账户总余额
- **订阅余额** - 订阅计划余额
- **按需付费余额** - Pay-as-you-go 余额
- **使用进度** - 当日订阅使用百分比和进度条
- **更新时间** - 最后更新的时间

## 🛠️ 开发

### 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vue 3** - 响应式前端框架  
- **TypeScript** - 强类型支持
- **Vite** - 快速开发构建工具
- **CSS3** - 现代样式和动画

### 项目结构

```
my-floating-bar/
├── electron/           # Electron 主进程
│   ├── main.ts        # 主进程入口
│   └── preload.ts     # 预加载脚本
├── src/               # Vue 前端代码
│   ├── components/    # Vue 组件
│   ├── services/      # API 和配置服务
│   └── assets/        # 静态资源
├── public/            # 公共资源
└── dist/              # 构建输出
```

### 开发命令

```bash
# 开发模式
npm run dev

# 构建应用
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run type-check
```

## 🔧 配置文件

应用配置存储在本地 localStorage 中：
- **API 配置** - Token、端点、刷新间隔等
- **用户偏好** - 窗口位置、主题设置等
- **数据安全** - 所有敏感信息本地存储，不上传云端

## 🚨 常见问题

### Q: 为什么显示"获取数据失败"？
A: 请检查：
1. API Token 格式是否正确 (cr_xxxxxxxx)
2. 网络连接是否正常
3. API 端点地址是否可访问

### Q: 悬浮栏显示白色或空白？
A: 重启应用或按 Ctrl+R 刷新页面

### Q: 鼠标悬停不展开？
A: 确保鼠标完全移动到悬浮栏区域，或点击状态文字手动控制

### Q: 如何重置所有配置？
A: 展开悬浮栏 → 点击设置 → 点击"🗑️ 重置配置"

## 📝 更新日志

### v1.0.0 (2025-01-03)
- ✨ 初始版本发布
- 🎯 支持 yesCode API 监控
- 🖱️ 鼠标悬停展开功能
- 🎨 现代化 UI 设计
- ⚙️ 完整配置管理
- 🚀 跨平台支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [yesCode](https://co.yes.vg/register?ref=SYSAJQK0/) - 提供 Claude API 服务
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架

---

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**

## 📞 联系方式

- 提交 Issue: [GitHub Issues](https://github.com/Yangegea/my-floating-bar/issues)
- 邮箱: yangegehaoshuaia@gmail.com

---

<div align="center">
Made with ❤️ by [Aurora]
</div>