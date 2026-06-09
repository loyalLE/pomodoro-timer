# 🍅 番茄钟 Claude Code 帮助手册

## 📋 默认斜杠指令

| 指令 | 说明 |
|---|---|
| `/help` | 显示帮助信息 |
| `/clear` | 清除对话历史 |
| `/init` | 为当前项目生成 CLAUDE.md |
| `/compact` | 压缩上下文窗口，释放空间 |
| `/config` | 查看和修改配置（主题、模型等） |
| `/memory` | 编辑全局 CLAUDE.md（跨项目偏好） |
| `/statusline` | 配置终端状态栏显示内容 |
| `/tasks` | 查看后台任务列表 |
| `/workflows` | 查看多代理工作流进度 |
| `/doctor` | 诊断 Claude Code 运行问题 |
| `/upgrade` | 升级 Claude Code 到最新版 |
| `/review` | 代码审查当前分支改动 |
| `/security-review` | 安全审查当前分支改动 |
| `/simplify` | 简化当前改动代码 |
| `/verify` | 运行应用验证改动效果 |
| `/run` | 启动当前项目应用 |
| `/code-review` | 代码审查（支持多级深度） |
| `/loop` | 按间隔重复执行指令 |
| `/agents` | 查看和管理子代理 |
| `/mcp` | 配置 MCP 服务器 |
| `/hooks` | 管理 hooks 自动化 |
| `/add-dir` | 添加工作目录到信任列表 |
| `/ide` | IDE 集成设置 |
| `/terminal-setup` | 终端环境配置 |
| `/update-config` | 更新 settings.json 配置 |
| `/keybindings-help` | 键盘快捷键帮助 |
| `/deep-research` | 深度研究报告（多源搜索+交叉验证） |
| `/fewer-permission-prompts` | 智能减少权限弹窗 |

## 🧩 已安装 Skills

| Skill | 指令 | 功能 | 来源 |
|---|---|---|---|
| `find-skills` | `/find-skills` | 搜索和发现新的 agent skills | vercel-labs/skills |
| `skill-creator` | `/skill-creator` | 创建、修改、测试和优化自定义 skill | anthropics/skills (259K+) |

### Skill 使用示例

```bash
# 搜索 skill
npx skills find react testing

# 安装 skill
npx skills add <owner/repo@skill> -g -y

# 检查更新
npx skills check

# 更新所有 skill
npx skills update
```

## 🍅 项目专用命令

```bash
# 从工作区根目录运行
npm run pomodoro          # 启动番茄钟应用
npm run pomodoro:install  # 安装 pomodoro 依赖
npm run pomodoro:build    # 构建 Windows 便携版

# 在 pomodoro 目录中
cd pomodoro
npm start                 # 开发模式运行
npm run build             # 构建便携版 (electron-builder --win portable)
npm run build:installer   # 构建 NSIS 安装包
```

## ⌨️ 番茄钟快捷键

| 按键 | 说明 |
|---|---|
| `空格` | 开始 / 暂停计时 |
| `R` | 重置计时器 |

## 📂 项目结构

```
E:\CC\
├── HELP.md              # 本文件
├── CLAUDE.md            # 项目 AI 指导文件
├── package.json         # 工作区配置
├── pomodoro/            # 番茄钟 Electron 应用
│   ├── main.js          # Electron 主进程
│   ├── preload.js       # 安全预加载桥接
│   ├── renderer/        # 前端界面
│   │   ├── index.html
│   │   ├── app.js
│   │   └── style.css
│   └── assets/          # 图标等资源
└── .claude/             # Claude Code 项目配置
    └── settings.local.json
```

## 🛠 状态栏配置

当前状态栏显示：`📁目录 │ 🤖模型 │ 📊上下文剩余%`

配置文件：`~\.claude\statusline.js`

## 📝 更新日志

- **2026-06-09** — UI 全面升级（渐变背景、发光计时环、毛玻璃面板）
- **2026-06-09** — 安装 find-skills + skill-creator
- **2026-06-09** — 项目初始化，番茄钟 v1.0.0 构建完成
