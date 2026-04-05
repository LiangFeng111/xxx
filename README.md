# xxx
订阅链接：https://feiniaoyun.life/api/v1/client/subscribe?token=1b7e9b8eb7252e5043ce8e4953d3d089

## 🚀 自动部署配置指南

本仓库已配置 GitHub Actions 自动部署到 Cloudflare Workers (后端) 和 Cloudflare Pages (前端)。

### 1. 配置 GitHub Secrets (仓库设置 -> Secrets and variables -> Actions -> Secrets)

请在 GitHub 仓库中添加以下 **Secrets**:

- `CLOUDFLARE_API_TOKEN`: 您的 Cloudflare API 令牌 (具有 Workers 和 Pages 权限)。
- `CLOUDFLARE_ACCOUNT_ID`: 您的 Cloudflare 账户 ID。
- `GH_TOKEN`: 具有写权限的 GitHub Personal Access Token (用于后端修改文件)。

### 2. 部署流程

- 推送代码到 `master` 分支后，GitHub Actions 会自动触发部署：
    - 后端更改触发 `Deploy to Cloudflare Workers`。
    - 前端更改触发 `Deploy Frontend to Cloudflare Pages`。

首次部署后，请在 Cloudflare Pages 控制台确认 `admin-frontend-pages` 项目已正确关联到您的域名。
