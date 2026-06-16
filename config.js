/**
 * 站点全局前端配置文件
 * 这些配置将在浏览器环境中作为 window.CONFIG 全局对象访问
 */
window.CONFIG = {
  // 1. 主工具数据源 (手动维护的 data.json 路径)
  DATA_URL: 'data.json',

  // 默认图片 (当没有图片时显示的图片)
  DEFAULT_IMAGE : 'resource/icon/default-icon.jpeg',

  // 是否使用 Google favicon 服务自动获取外站图标。无 VPN 环境建议保持 false。
  ENABLE_REMOTE_FAVICON: false,
  
  // 2. 书签数据源 (由浏览器书签转换工具生成的 JSON 文件路径)
  BOOKMARKS_URL: 'converted_bookmarks.json',

  // 3. 后台管理系统的访问地址 (用于在首页等地方跳转)
  ADMIN_URL: 'https://xxx-admin.liangfeng111.top',

  // 4. 后端 API 接口基础地址 (Cloudflare Workers 的访问地址)
  // 后台管理系统和首页验证隐藏数据时会调用此地址
  API_URL: 'https://xxx-admin-api.liangfeng111.top/api'
};
