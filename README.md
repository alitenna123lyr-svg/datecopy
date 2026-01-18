# DateCopy

一个极简的 Windows 桌面小工具，用于快速复制当前日期和时间到剪贴板，并内置番茄钟功能。

![Tauri](https://img.shields.io/badge/Tauri-2.x-blue)
![Vue](https://img.shields.io/badge/Vue-3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 功能特性

### 日期时间复制
- **点击日期** → 一键复制日期到剪贴板
- **点击时间** → 一键复制时间到剪贴板
- **复制按钮** → 复制完整日期时间
- 支持多种格式（YYYY-MM-DD、YYYY年MM月DD日 等）
- 全局快捷键支持

### 番茄钟 / 定时提醒
- 预设时间：5、10、15、30、45、60 分钟
- 支持自定义任意时间（1-999 分钟）
- **间隔循环模式**：工作时间 + 休息时间交替循环
  - 例如：上课 45 分钟 → 休息 10 分钟 → 循环
- 声音提醒 + 系统通知 + 窗口弹出

### 其他特性
- 最小化到系统托盘，后台运行
- 支持开机自启动
- iOS 风格的精美 UI
- 深色模式支持
- 极小的资源占用

## 截图

```
┌─────────────────────────────┐
│  DateCopy                   │
├─────────────────────────────┤
│      2026-01-18             │  ← 点击复制日期
│        01:00:25             │  ← 点击复制时间
│                        [📋] │  ← 复制全部
├─────────────────────────────┤
│  定时提醒                    │
│      45 分钟                 │
│  [5] [10] [15] [30] [45] [60]│
│                             │
│  [○ 间隔循环]               │
│  工作: [-] 45 分钟 [+]      │
│  休息: [-] 10 分钟 [+]      │
│  每轮 55 分钟               │
│                             │
│        [开始]               │
└─────────────────────────────┘
```

## 技术栈

- **框架**: [Tauri 2.x](https://tauri.app/) (Rust + Web)
- **前端**: Vue 3 + TypeScript
- **构建**: Vite
- **UI**: 纯 CSS，iOS 风格设计

## 安装

### 下载安装包

前往 [Releases](../../releases) 页面下载最新版本的安装包。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/你的用户名/datecopy.git
cd datecopy

# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建生产版本
npm run tauri build
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+D` | 复制日期 |
| `Ctrl+Shift+T` | 复制时间 |
| `Ctrl+Shift+C` | 复制日期+时间 |

## 项目结构

```
datecopy/
├── src/                    # 前端源码 (Vue)
│   ├── components/         # Vue 组件
│   ├── stores/             # Pinia 状态管理
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── src-tauri/              # 后端源码 (Rust)
│   ├── src/
│   └── tauri.conf.json
└── package.json
```

## License

MIT
