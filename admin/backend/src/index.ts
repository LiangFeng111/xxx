import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  GH_TOKEN: string
  GH_OWNER: string
  GH_REPO: string
  GH_BRANCH: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

const authMiddleware = async (c: any, next: any) => {
  // Paths that don't require authentication
  if (c.req.path === '/api/login' || (c.req.path === '/api/config' && c.req.method === 'GET')) {
    return await next()
  }

  try {
    const config = await getFileFromGitHub(c.env, 'admin_config.json')
    if (!config.content.password) {
      // If no password set, allow all requests
      return await next()
    }

    const token = c.req.header('Authorization')
    if (token === config.content.password) {
      return await next()
    }

    return c.json({ error: 'Unauthorized' }, 401)
  } catch (e) {
    // If config doesn't exist, allow all requests (initial setup)
    return await next()
  }
}

app.use('/api/*', authMiddleware)

const hashPassword = async (password: string) => {
  const msgUint8 = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

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
      // File doesn't exist yet for this month
    }

    logs.push({
      timestamp,
      action,
      details,
      ip: 'Cloudflare-Worker'
    })

    // Keep only last 1000 logs per month to avoid giant files
    if (logs.length > 1000) logs = logs.slice(-1000)

    await updateFileOnGitHub(env, fileName, logs, sha, `Log: ${action}`)
  } catch (e) {
    console.error('Logging failed:', e)
  }
}

app.get('/api/data', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'data.json')
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

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

app.get('/api/bookmarks', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'converted_bookmarks.json')
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

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

app.get('/api/hidedata', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'hide_data.json')
    return c.json(data)
  } catch (err: any) {
    // If file not exists, return empty structure
    return c.json({ sha: '', content: { links: [] } })
  }
})

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

// Public API for homepage to get hide data with password
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

// Config APIs
app.get('/api/config', async (c) => {
  try {
    const data = await getFileFromGitHub(c.env, 'admin_config.json')
    // Don't return the hashed password to the frontend
    const { password, ...safeConfig } = data.content
    return c.json({
      sha: data.sha,
      content: {
        ...safeConfig,
        hasPassword: !!password
      }
    })
  } catch (err: any) {
    // If config doesn't exist, return empty config
    return c.json({
      sha: '',
      content: { hasPassword: false }
    })
  }
})

app.put('/api/config', async (c) => {
  try {
    const { content, sha } = await c.req.json()
    const { password, ...otherContent } = content
    
    // Get existing config to preserve password if not changed
    let finalContent = { ...otherContent }
    let passwordChanged = false
    if (password) {
      finalContent.password = await hashPassword(password)
      passwordChanged = true
    } else {
      try {
        const existing = await getFileFromGitHub(c.env, 'admin_config.json')
        if (existing.content.password) {
          finalContent.password = existing.content.password
        }
      } catch (e) {
        // No existing config
      }
    }

    const result = await updateFileOnGitHub(c.env, 'admin_config.json', finalContent, sha, 'Update admin_config.json via Admin')
    await addLog(c.env, '修改管理员配置', passwordChanged ? '更新了管理员配置和密码' : '更新了管理员配置')
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post('/api/login', async (c) => {
  try {
    const { password } = await c.req.json()
    let config;
    try {
      config = await getFileFromGitHub(c.env, 'admin_config.json')
    } catch (e) {
      // If config doesn't exist, allow login to set initial password
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
      return c.json({ success: true, token: hashed }) // Simple token for now
    } else {
      await addLog(c.env, '登录失败', '管理员尝试登录，密码错误')
      return c.json({ success: false, error: 'Password incorrect' }, 401)
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

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
