import { Hono } from 'hono'
import { cors } from 'hono/cors'

/**
 * 环境变量定义
 * 存储在 Cloudflare Workers 的 Variables 或 Secrets 中
 */
type Bindings = {
  GH_TOKEN: string    // GitHub Personal Access Token (需具备 repo 权限)
  GH_OWNER: string    // GitHub 用户名或组织名
  GH_REPO: string     // 仓库名称
  GH_BRANCH: string   // 分支名称，默认为 main
}

const app = new Hono<{ Bindings: Bindings }>()

// 允许跨域请求
app.use('/api/*', cors())

/**
 * 身份验证中间件
 * 检查请求头中的 Authorization 是否与管理员密码匹配
 */
const authMiddleware = async (c: any, next: any) => {
  // 无需验证的白名单路径
  if (c.req.path === '/api/login' ||
      c.req.path === '/api/public/hidedata' || 
      (c.req.path === '/api/config' && c.req.method === 'GET')) {
    return await next()
  }

  try {
    // 从 GitHub 获取管理员配置
    const config = await getFileFromGitHub(c.env, 'admin_config.json')
    
    // 如果未设置密码，允许所有请求（通常用于初次设置）
    if (!config.content.password) {
      return await next()
    }

    // 校验 Token
    const token = c.req.header('Authorization')
    if (token === config.content.password) {
      return await next()
    }

    return c.json({ error: 'Unauthorized' }, 401)
  } catch (e) {
    // 如果配置文件不存在，视为初次运行，允许请求
    return await next()
  }
}

app.use('/api/*', authMiddleware)

/**
 * 密码哈希函数 (SHA-256)
 * @param password 明文密码
 * @returns 哈希后的十六进制字符串
 */
const hashPassword = async (password: string) => {
  const msgUint8 = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 从 GitHub 读取 JSON 文件
 * @param env 环境变量
 * @param path 文件在仓库中的路径
 * @returns 包含文件 sha 和解析后的 JSON 内容的对象
 */
const getFileFromGitHub = async (env: Bindings, path: string) => {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path}?ref=${env.GH_BRANCH || 'main'}`
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${env.GH_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Cloudflare-Worker'
    }
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`)
  }
  
  const data = await response.json() as any
  // GitHub 返回的内容是 Base64 编码的，需要解码
  const binaryString = atob(data.content.replace(/\n/g, ''))
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const content = new TextDecoder().decode(bytes)
  return {
    sha: data.sha,
    content: JSON.parse(content)
  }
}

/**
 * 更新 GitHub 仓库中的文件
 * @param env 环境变量
 * @param path 文件路径
 * @param content 要写入的对象内容
 * @param sha 文件的旧 SHA 值（用于并发控制）
 * @param message Git 提交信息
 */
const updateFileOnGitHub = async (env: Bindings, path: string, content: any, sha: string, message: string) => {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path}`
  
  const jsonStr = JSON.stringify(content, null, 2)
  const bytes = new TextEncoder().encode(jsonStr)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64Content = btoa(binary)

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${env.GH_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Cloudflare-Worker',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      sha: sha || undefined,
      branch: env.GH_BRANCH || 'main'
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GitHub API update error: ${response.statusText} - ${errorText}`)
  }
  
  return await response.json()
}

/**
 * 记录操作日志到 GitHub
 * 日志按月存储在 logs/YYYY-MM.json 中
 */
const addLog = async (env: Bindings, action: string, details: string) => {
  try {
    const now = new Date()
    const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const fileName = `logs/${month}.json`
    const timestamp = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    
    let logs = []
    let sha = ''
    try {
      const data = await getFileFromGitHub(env, fileName)
      logs = data.content
      sha = data.sha
    } catch (e) {
      // 本月日志文件尚不存在
    }

    logs.push({
      timestamp,
      action,
      details,
      ip: 'Cloudflare-Worker'
    })

    // 每个月只保留最近 1000 条日志，防止文件过大
    if (logs.length > 1000) logs = logs.slice(-1000)

    await updateFileOnGitHub(env, fileName, logs, sha, `Log: ${action}`)
  } catch (e) {
    console.error('Logging failed:', e)
  }
}

// --- API 路由定义 ---

// 获取 data.json (首页配置)
app.get('/api/data', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'data.json')
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 更新 data.json
app.put('/api/data', async (c) => {
  try {
    const { content, sha } = await c.req.json()
    const result = await updateFileOnGitHub(c.env, 'data.json', content, sha, 'Update data.json via Admin')
    await addLog(c.env, '修改配置', '更新了 data.json 站点设置')
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 获取书签数据
app.get('/api/bookmarks', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'converted_bookmarks.json')
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 更新书签数据
app.put('/api/bookmarks', async (c) => {
  try {
    const { content, sha } = await c.req.json()
    const result = await updateFileOnGitHub(c.env, 'converted_bookmarks.json', content, sha, 'Update converted_bookmarks.json via Admin')
    await addLog(c.env, '修改书签', '更新了书签列表')
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 获取隐藏数据
app.get('/api/hidedata', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'hide_data.json')
    return c.json(data)
  } catch (err: any) {
    // 文件不存在则返回空结构
    return c.json({ sha: '', content: { links: [] } })
  }
})

// 更新隐藏数据
app.put('/api/hidedata', async (c) => {
  try {
    const { content, sha } = await c.req.json()
    const result = await updateFileOnGitHub(c.env, 'hide_data.json', content, sha, 'Update hide_data.json via Admin')
    await addLog(c.env, '修改隐藏数据', '更新了隐藏数据列表')
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

/**
 * 公开接口：验证密码并获取隐藏数据
 * 供首页调用，无需 Authorization 头，但在 Body 中传递密码
 */
app.post('/api/public/hidedata', async (c) => {
  try {
    const { password } = await c.req.json()
    const config = await getFileFromGitHub(c.env, 'admin_config.json')
    
    if (!config.content.password) {
      return c.json({ error: 'Admin password not set' }, 403)
    }

    const hashed = await hashPassword(password)
    if (hashed === config.content.password) {
      const data = await getFileFromGitHub(c.env, 'hide_data.json')
      return c.json(data.content)
    } else {
      return c.json({ error: 'Incorrect password' }, 401)
    }
  } catch (err: any) {
    return c.json({ error: 'No hidden data found' }, 404)
  }
})

// 获取管理员配置 (不包含密码哈希)
app.get('/api/config', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'admin_config.json')
    const { password, ...safeConfig } = data.content
    return c.json({
      sha: data.sha,
      content: {
        ...safeConfig,
        hasPassword: !!password
      }
    })
  } catch (err: any) {
    return c.json({
      sha: '',
      content: { hasPassword: false }
    })
  }
})

// 更新管理员配置或重置密码
app.put('/api/config', async (c) => {
  try {
    const { content, sha } = await c.req.json()
    const { password, ...otherContent } = content
    
    let finalContent = { ...otherContent }
    let passwordChanged = false
    
    if (password) {
      // 如果提供了新密码，进行哈希处理
      finalContent.password = await hashPassword(password)
      passwordChanged = true
    } else {
      // 如果未提供新密码，保留原有密码
      try {
        const existing = await getFileFromGitHub(c.env, 'admin_config.json')
        if (existing.content.password) {
          finalContent.password = existing.content.password
        }
      } catch (e) {}
    }

    const result = await updateFileOnGitHub(c.env, 'admin_config.json', finalContent, sha, 'Update admin_config.json via Admin')
    await addLog(c.env, '修改管理员配置', passwordChanged ? '更新了管理员配置和密码' : '更新了管理员配置')
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 管理员登录
app.post('/api/login', async (c) => {
  try {
    const { password } = await c.req.json()
    let config;
    try {
      config = await getFileFromGitHub(c.env, 'admin_config.json')
    } catch (e) {
      // 首次使用未设置密码时允许登录
      await addLog(c.env, '初始登录', '系统初次使用，未设置密码登录')
      return c.json({ success: true, message: 'No password set' })
    }
    
    if (!config.content.password) {
      await addLog(c.env, '登录', '未设置密码登录')
      return c.json({ success: true, message: 'No password set' })
    }

    const hashed = await hashPassword(password)
    if (hashed === config.content.password) {
      await addLog(c.env, '登录成功', '管理员登录成功')
      // 简单起见，使用哈希后的密码作为 Token
      return c.json({ success: true, token: hashed }) 
    } else {
      await addLog(c.env, '登录失败', '管理员尝试登录，密码错误')
      return c.json({ success: false, error: 'Password incorrect' }, 401)
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 获取操作日志
app.get('/api/logs', async (c) => {
  try {
    const month = c.req.query('month') || `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
    const fileName = `logs/${month}.json`
    try {
      const data = await getFileFromGitHub(c.env, fileName)
      return c.json(data.content)
    } catch (e) {
      return c.json([])
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
