# 喜淘网工具箱 - 后台管理系统

这是一个功能齐全的后台管理系统，用于管理首页 (`data.json`)、书签 (`converted_bookmarks.json`)、隐藏资源 (`hide_data.json`) 以及系统配置。

## 🌟 功能特点

- **密码安全**: 采用 SHA-256 加密存储，支持前端设置和修改管理员密码。
- **站点配置**: 动态修改网站标题、公告、常用工具链接。
- **书签管理**: 
    - 树形结构浏览，支持无限级文件夹。
    - 后台支持按文件夹筛选、关键词搜索、分页展示。
    - 支持单个及批量删除。
- **隐藏资源**: 
    - 独立的加密数据存储 (`hide_data.json`)。
    - 前端输入密码后方可解锁显示，确保私密性。
- **操作日志**: 
    - 自动记录登录（成功/失败）、数据修改（新增/编辑/删除）日志。
    - 日志按月存储 (`logs/YYYY-MM.json`)，支持后台按月查询。
- **自动化部署**: 集成 GitHub Actions，自动部署后端至 Cloudflare Workers，前端至 Cloudflare Pages。

## 🛠 技术栈

- **后端**: Cloudflare Workers + Hono 框架 (TypeScript)
- **前端**: Vite + React + Ant Design + Tailwind CSS
- **UI 组件**: Element Plus (首页使用)
- **存储**: GitHub API (通过后端代理实现读写)

## ⚙️ 配置说明

### 1. 本地开发配置

在 `admin/backend` 目录下，修改或创建 `.dev.vars` 文件：

```env
GH_TOKEN=你的GitHub个人访问令牌 (Personal Access Token)
GH_OWNER=你的GitHub用户名
GH_REPO=你的仓库名称
GH_BRANCH=master
```

### 2. 部署配置

请在 GitHub 仓库设置 (**Settings -> Secrets and variables -> Actions**) 中配置：

- **Secrets**:
    - `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌。
    - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID。
    - `GH_TOKEN`: 具有写权限的 GitHub Token。

> **提示**: GitHub Actions 现在会自动尝试在 Cloudflare Pages 中创建项目。如果部署仍提示“Project not found”，请检查您的 Cloudflare API Token 权限是否包含 `Cloudflare Pages: Edit`。

后端和前端的其它非敏感配置（如 `GH_OWNER`、`GH_REPO` 等）在项目wrangler配置文件中设置。

### 3. 统一配置说明

前端 API 地址现在统一通过根目录的 `config.js` 中的 `API_URL` 字段进行管理。修改该文件后重新部署即可生效。

## 🚀 快速开始

### 安装依赖

```bash
# 进入后台根目录
cd admin

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 启动开发环境

```bash
# 启动后端 (wrangler)
npm run dev:backend

# 启动前端 (vite)
npm run dev:frontend
```

## 📝 目录结构

- `admin/backend`: Cloudflare Worker 后端源码。
- `admin/frontend`: 基于 React 的后台管理面板。
- `logs/`: 操作日志存储目录（由后端自动生成）。
- `index.html`: 首页导航页面。
- `config.js`: 全局静态配置。
