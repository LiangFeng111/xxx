# 喜淘网工具箱 - 后台管理系统

这是一个用于管理 `data.json` 和 `converted_bookmarks.json` 的后台管理系统。

## 技术栈

- **后端**: Cloudflare Workers + Hono 框架
- **前端**: Vite + React + Tailwind CSS
- **存储**: GitHub API (通过代理实现读写)

## 配置说明

### 1. 配置 GitHub 凭据

在 `admin/backend` 目录下，修改或创建 `.dev.vars` 文件：

```env
GITHUB_TOKEN=你的GitHub个人访问令牌 (Personal Access Token)
GITHUB_OWNER=你的GitHub用户名
GITHUB_REPO=你的仓库名称
GITHUB_BRANCH=main
```

对于部署到 Cloudflare Workers，请使用 `wrangler secret put` 命令或在 Cloudflare 控制面板中设置这些环境变量。

### 2. 安装依赖

```bash
# 进入 admin 目录
cd admin

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 本地开发

```bash
# 在 admin 目录下运行
# 启动后端
npm run dev:backend

# 启动前端 (另开一个终端)
npm run dev:frontend
```

## 功能特点

- **站点设置**: 修改网站标题、副标题和公告。
- **链接管理**: 添加、编辑、删除首页展示的工具链接。
- **书签管理**: 直接通过 JSON 编辑器修改 `converted_bookmarks.json`。
- **GitHub 代理**: 所有读写操作都通过 Cloudflare Workers 代理到 GitHub API。
