import React, { useState, useEffect, useMemo } from 'react'
import {
  Layout,
  Menu,
  Table,
  Button,
  Input,
  Form,
  Modal,
  Space,
  Tag,
  Badge,
  Select,
  DatePicker,
  App as AntdApp,
  ConfigProvider,
  Typography,
  Empty,
  Card,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  theme
} from 'antd'
import {
  SettingOutlined,
  BookOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  LockOutlined,
  HistoryOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

// --- 类型定义 ---

/**
 * 首页链接数据结构
 */
type Link = {
  category: string // 分类名称
  title: string    // 链接标题
  url: string      // 链接地址
  icon: string     // 图标标识 (如 lucide 图标名)
}

/**
 * 站点基础设置
 */
type SettingsData = {
  site_title: string    // 站点标题
  site_subtitle: string // 站点副标题
  site_notice: string   // 站点公告
}

/**
 * data.json 的完整结构
 */
type DataFile = {
  settings: SettingsData
  links: Link[]
}

/**
 * 书签节点结构 (支持无限层级)
 */
type BookmarkNode = {
  type: 'folder' | 'link'
  name?: string       // 文件夹名称
  title?: string      // 书签标题
  url?: string        // 书签链接
  icon?: string       // 书签图标
  children?: BookmarkNode[] // 子节点 (仅文件夹有)
}

/**
 * 用于表格展示的扁平化书签结构
 */
type FlattenedBookmark = {
  id: string
  title: string
  url: string
  icon: string
  path: string // 层级路径，如 "工具 / 开发 / 前端"
}

// 基础 API 地址，优先使用 config.js 或环境变量
const API_BASE = window.CONFIG?.API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'

// --- 后台管理主组件 ---

const AdminApp: React.FC = () => {
  const [activeKey, setActiveKey] = useState('data') // 当前选中的菜单项
  const { message, modal, notification } = AntdApp.useApp()
  const { token } = theme.useToken()

  // --- Data.json (站点设置) 状态 ---
  const [data, setData] = useState<DataFile | null>(null)
  const [dataSha, setDataSha] = useState('') // GitHub 文件的 SHA 值
  const [isDataDirty, setIsDataDirty] = useState(false) // 是否有未保存的修改
  const [selectedDataLinks, setSelectedDataLinks] = useState<React.Key[]>([]) // 批量选择的链接
  const [isDataModalOpen, setIsDataModalOpen] = useState(false) // 编辑弹窗状态
  const [dataPageSize, setDataPageSize] = useState(10)
  const [dataLinkForm] = Form.useForm()
  const [editingDataLink, setEditingDataLink] = useState<Link | null>(null)
  const [editingDataIndex, setEditingDataIndex] = useState<number | -1>(-1)

  // --- Bookmarks (书签) 状态 ---
  const [bookmarks, setBookmarks] = useState<{ links: BookmarkNode[] } | null>(null)
  const [bookmarksSha, setBookmarksSha] = useState('')
  const [isBookmarksDirty, setIsBookmarksDirty] = useState(false)
  const [selectedBookmarks, setSelectedBookmarks] = useState<React.Key[]>([])
  const [bookmarkSearch, setBookmarkSearch] = useState('') // 书签搜索关键词
  const [bookmarkPageSize, setBookmarkPageSize] = useState(15)
  const [bookmarkFolderFilter, setBookmarkFolderFilter] = useState<string | null>(null) // 文件夹筛选

  // --- Hide Data (隐藏数据) 状态 ---
  const [hideData, setHideData] = useState<{ links: Link[] } | null>(null)
  const [hideDataSha, setHideDataSha] = useState('')
  const [isHideDataDirty, setIsHideDataDirty] = useState(false)
  const [selectedHideLinks, setSelectedHideLinks] = useState<React.Key[]>([])
  const [isHideModalOpen, setIsHideModalOpen] = useState(false)
  const [hidePageSize, setHidePageSize] = useState(10)
  const [hideForm] = Form.useForm()
  const [editingHideLink, setEditingHideLink] = useState<Link | null>(null)
  const [editingHideIndex, setEditingHideIndex] = useState<number | -1>(-1)

  // --- 日志状态 ---
  const [logs, setLogs] = useState<any[]>([])
  const [logMonth, setLogMonth] = useState(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`)
  const [logPageSize, setLogPageSize] = useState(20)

  // --- 配置与登录状态 ---
  const [config, setConfig] = useState<{ hasPassword: boolean } | null>(null)
  const [configSha, setConfigSha] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const [isSiderCollapsed, setIsSiderCollapsed] = useState(false) // 侧边栏折叠状态
  const [isModalOpen, setIsModalOpen] = useState(false) // 通用弹窗状态
  const [editingBookmark, setEditingBookmark] = useState<FlattenedBookmark | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false) // 加载状态

  useEffect(() => {
    fetchConfig()
  }, [])

  /**
   * 获取管理员配置，判断是否需要登录
   */
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config`)
      const json = await res.json()
      setConfig(json.content)
      setConfigSha(json.sha)
      
      if (json.content.hasPassword) {
        const token = localStorage.getItem('admin_token')
        if (!token) {
          setLoginModalOpen(true)
        } else {
          setIsLoggedIn(true)
          fetchData()
          fetchBookmarks()
          fetchHideData()
        }
      } else {
        setIsLoggedIn(true)
        fetchData()
        fetchBookmarks()
        fetchHideData()
      }
    } catch (err: any) {
      notification.error({ message: '配置加载失败', description: err.message })
    }
  }

  /**
   * 处理登录逻辑
   */
  const handleLogin = async (values: any) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: values.password })
      })
      const json = await res.json()
      if (json.success) {
        localStorage.setItem('admin_token', json.token)
        setIsLoggedIn(true)
        setLoginModalOpen(false)
        message.success('登录成功')
        fetchData()
        fetchBookmarks()
        fetchHideData()
      } else {
        message.error(json.error || '密码错误')
      }
    } catch (err: any) {
      message.error(`登录出错: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 设置/修改管理员密码
   */
  const handleSetPassword = async (values: any) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          content: { password: values.password },
          sha: configSha
        })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      
      setConfigSha(json.content.sha)
      setConfig({ hasPassword: true })
      if (!isLoggedIn) {
        handleLogin({ password: values.password })
      }
      passwordForm.resetFields()
      message.success('密码设置成功')
    } catch (err: any) {
      message.error(`设置失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsLoggedIn(false)
    setLoginModalOpen(true)
  }

  // 获取请求头 (包含身份验证 Token)
  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('admin_token')
    return token ? { 'Authorization': token } : {}
  }

  // --- 数据获取方法 ---

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/data`, { headers: getAuthHeader() })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.content)
      setDataSha(json.sha)
      setIsDataDirty(false)
    } catch (err: any) {
      notification.error({ message: '加载失败', description: `data.json: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const fetchBookmarks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/bookmarks`, { headers: getAuthHeader() })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setBookmarks(json.content)
      setBookmarksSha(json.sha)
      setIsBookmarksDirty(false)
    } catch (err: any) {
      notification.error({ message: '加载失败', description: `bookmarks: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const fetchHideData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/hidedata`, { headers: getAuthHeader() })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setHideData(json.content)
      setHideDataSha(json.sha)
      setIsHideDataDirty(false)
    } catch (err: any) {
      notification.error({ message: '加载失败', description: `hide_data.json: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleMenuClick = (e: any) => {
    setActiveKey(e.key)
    if (e.key === 'logs') fetchLogs()
  }

  const fetchLogs = async (month?: string) => {
    setLoading(true)
    try {
      const targetMonth = month || logMonth
      const res = await fetch(`${API_BASE}/logs?month=${targetMonth}`, { headers: getAuthHeader() })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setLogs(json.reverse()) // 最新日志排在前面
    } catch (err: any) {
      notification.error({ message: '日志加载失败', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  // --- 数据同步方法 (保存到 GitHub) ---

  const handleSaveData = async () => {
    if (!data) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() } as HeadersInit,
        body: JSON.stringify({ content: data, sha: dataSha })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setDataSha(json.content.sha)
      setIsDataDirty(false)
      message.success('data.json 已同步到 GitHub')
    } catch (err: any) {
      message.error(`保存失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBookmarks = async () => {
    if (!bookmarks) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/bookmarks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() } as HeadersInit,
        body: JSON.stringify({ content: bookmarks, sha: bookmarksSha })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setBookmarksSha(json.content.sha)
      setIsBookmarksDirty(false)
      message.success('书签已同步到 GitHub')
    } catch (err: any) {
      message.error(`保存失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveHideData = async () => {
    if (!hideData) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/hidedata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() } as HeadersInit,
        body: JSON.stringify({ content: hideData, sha: hideDataSha })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setHideDataSha(json.content.sha)
      setIsHideDataDirty(false)
      message.success('隐藏数据已同步到 GitHub')
    } catch (err: any) {
      message.error(`保存失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // --- 书签处理逻辑 ---

  /**
   * 将嵌套的书签树扁平化，方便在 Table 中展示和搜索
   */
  const flattenedBookmarks = useMemo(() => {
    if (!bookmarks) return []
    const result: FlattenedBookmark[] = []
    const traverse = (nodes: BookmarkNode[], path: string[] = []) => {
      nodes.forEach((node, index) => {
        if (node.type === 'folder' && node.children) {
          traverse(node.children, [...path, node.name || ''])
        } else if (node.type === 'link') {
          const id = `${path.join('>')}-${node.title}-${node.url}-${index}`
          result.push({
            id,
            title: node.title || '',
            url: node.url || '',
            icon: node.icon || 'link',
            path: path.join(' / ')
          })
        }
      })
    }
    traverse(bookmarks.links)
    return result
  }, [bookmarks])

  /**
   * 提取所有不重复的文件夹路径，用于下拉筛选
   */
  const uniqueFolders = useMemo(() => {
    const folders = new Set<string>()
    flattenedBookmarks.forEach(b => {
      if (b.path) folders.add(b.path)
    })
    return Array.from(folders).sort()
  }, [flattenedBookmarks])

  /**
   * 递归清理空的文件夹
   * @param nodes 书签节点数组
   */
  const pruneEmptyFolders = (nodes: BookmarkNode[]) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      if (node.type === 'folder' && node.children) {
        pruneEmptyFolders(node.children)
        if (node.children.length === 0) {
          nodes.splice(i, 1)
        }
      }
    }
  }

  /**
   * 根据搜索关键词和文件夹筛选书签
   */
  const filteredBookmarks = useMemo(() => {
    const search = bookmarkSearch.toLowerCase()
    return flattenedBookmarks.filter(b => {
      const matchSearch = b.title.toLowerCase().includes(search) ||
        b.url.toLowerCase().includes(search) ||
        b.path.toLowerCase().includes(search)
      const matchFolder = !bookmarkFolderFilter || b.path === bookmarkFolderFilter
      return matchSearch && matchFolder
    })
  }, [flattenedBookmarks, bookmarkSearch, bookmarkFolderFilter])

  // --- 操作处理器 ---

  const openDataModal = (link?: Link, index?: number) => {
    if (link !== undefined && index !== undefined) {
      setEditingDataLink(link)
      setEditingDataIndex(index)
      dataLinkForm.setFieldsValue(link)
    } else {
      setEditingDataLink(null)
      setEditingDataIndex(-1)
      dataLinkForm.setFieldsValue({ category: '常用工具', title: '', url: 'https://', icon: 'link' })
    }
    setIsDataModalOpen(true)
  }

  const handleDataModalSubmit = () => {
    dataLinkForm.validateFields().then(values => {
      if (!data) return
      const newLinks = [...data.links]
      if (editingDataIndex !== -1) {
        newLinks[editingDataIndex] = values
      } else {
        newLinks.unshift(values)
      }
      setData({ ...data, links: newLinks })
      setIsDataDirty(true)
      setIsDataModalOpen(false)
    })
  }

  const handleDeleteDataLink = (index: number) => {
    if (!data) return
    const newLinks = data.links.filter((_, i) => i !== index)
    setData({ ...data, links: newLinks })
    setIsDataDirty(true)
  }

  const openBookmarkModal = (bookmark?: FlattenedBookmark) => {
    if (bookmark) {
      setEditingBookmark(bookmark)
      form.setFieldsValue({ title: bookmark.title, url: bookmark.url, path: bookmark.path, icon: bookmark.icon })
    } else {
      setEditingBookmark(null)
      form.setFieldsValue({ title: '', url: '', path: '其他', icon: 'link' })
    }
    setIsModalOpen(true)
  }

  /**
   * 处理书签的新增或修改保存 (本地)
   */
  const handleBookmarkModalSubmit = () => {
    form.validateFields().then(values => {
      if (!bookmarks) return
      const newBookmarks = JSON.parse(JSON.stringify(bookmarks))
      const pathParts = values.path.split('/').map((p: string) => p.trim()).filter(Boolean)
      
      // 辅助函数：按路径查找或创建文件夹节点
      const getFolder = (nodes: BookmarkNode[], path: string[]) => {
        let currentNodes = nodes
        for (const part of path) {
          let folder = currentNodes.find(n => n.type === 'folder' && n.name === part)
          if (!folder) {
            folder = { type: 'folder', name: part, children: [] }
            currentNodes.push(folder)
          }
          currentNodes = folder.children!
        }
        return currentNodes
      }

      // 如果是编辑操作，先从原位置移除
      if (editingBookmark) {
        const removeFromTree = (nodes: BookmarkNode[]) => {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            if (node.type === 'folder' && node.children) {
              if (removeFromTree(node.children)) return true
            } else if (node.type === 'link' && node.title === editingBookmark.title && node.url === editingBookmark.url) {
              nodes.splice(i, 1)
              return true
            }
          }
          return false
        }
        removeFromTree(newBookmarks.links)
        pruneEmptyFolders(newBookmarks.links) // 清理可能产生的空文件夹
      }

      // 插入到新位置
      const targetFolder = getFolder(newBookmarks.links, pathParts)
      targetFolder.push({
        type: 'link',
        title: values.title,
        url: values.url,
        icon: values.icon
      })

      setBookmarks(newBookmarks)
      setIsModalOpen(false)
      setIsBookmarksDirty(true)
    })
  }

  /**
   * 删除单个书签
   */
  const handleDeleteBookmark = (record: FlattenedBookmark) => {
    if (!bookmarks) return
    const newBookmarks = JSON.parse(JSON.stringify(bookmarks))
    const removeFromTree = (nodes: BookmarkNode[]) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.type === 'folder' && node.children) {
          if (removeFromTree(node.children)) return true
        } else if (node.type === 'link' && node.title === record.title && node.url === record.url) {
          nodes.splice(i, 1)
          return true
        }
      }
      return false
    }
    removeFromTree(newBookmarks.links)
    pruneEmptyFolders(newBookmarks.links) // 删除后清理空文件夹
    setBookmarks(newBookmarks)
    setIsBookmarksDirty(true)
  }

  /**
   * 批量删除选中的书签
   */
  const handleBulkDeleteBookmarks = () => {
    if (!bookmarks || selectedBookmarks.length === 0) return
    modal.confirm({
      title: '批量删除确认',
      icon: <ExclamationCircleOutlined />,
      content: `确定删除选中的 ${selectedBookmarks.length} 个书签吗？`,
      onOk() {
        const newBookmarks = JSON.parse(JSON.stringify(bookmarks))
        const selectedItems = flattenedBookmarks.filter(b => selectedBookmarks.includes(b.id))
        const removeFromTree = (nodes: BookmarkNode[]) => {
          for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i]
            if (node.type === 'folder' && node.children) {
              removeFromTree(node.children)
            } else if (node.type === 'link') {
              if (selectedItems.some(s => s.title === node.title && s.url === node.url)) {
                nodes.splice(i, 1)
              }
            }
          }
        }
        removeFromTree(newBookmarks.links)
        pruneEmptyFolders(newBookmarks.links) // 清理空文件夹
        setBookmarks(newBookmarks)
        setSelectedBookmarks([])
        setIsBookmarksDirty(true)
      }
    })
  }

  // --- 界面渲染部分 ---

  // 1. 站点配置 (data.json)
  const renderDataSection = () => {
    if (!data) return <Empty description="加载中..." />
    const columns = [
      { title: '分类', dataIndex: 'category', key: 'category', render: (text: string) => <Tag color="blue">{text}</Tag> },
      { title: '标题', dataIndex: 'title', key: 'title', render: (text: string) => <Text strong>{text}</Text> },
      { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true, render: (text: string) => <Typography.Link href={text} target="_blank">{text}</Typography.Link> },
      { title: '图标', dataIndex: 'icon', key: 'icon', width: 100 },
      {
        title: '操作', key: 'action', width: 120,
        render: (_: any, record: any, index: number) => (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => openDataModal(record, index)} />
            <Popconfirm title="确定删除该链接吗？" onConfirm={() => handleDeleteDataLink(index)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ]
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={<span><SettingOutlined /> 站点设置 {isDataDirty && <Badge status="warning" text="未保存" />}</span>} 
              extra={<Button type="primary" icon={<SaveOutlined />} onClick={handleSaveData} loading={loading} disabled={!isDataDirty}>保存更改</Button>}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}><Text type="secondary">站点标题</Text><Input value={data.settings.site_title} onChange={e => { setData({ ...data, settings: { ...data.settings, site_title: e.target.value } }); setIsDataDirty(true) }} style={{ marginTop: 8 }}/></Col>
            <Col xs={24} md={8}><Text type="secondary">站点副标题</Text><Input value={data.settings.site_subtitle} onChange={e => { setData({ ...data, settings: { ...data.settings, site_subtitle: e.target.value } }); setIsDataDirty(true) }} style={{ marginTop: 8 }}/></Col>
            <Col xs={24} md={8}><Text type="secondary">站点公告</Text><Input value={data.settings.site_notice} onChange={e => { setData({ ...data, settings: { ...data.settings, site_notice: e.target.value } }); setIsDataDirty(true) }} style={{ marginTop: 8 }}/></Col>
          </Row>
        </Card>
        <Card title={<span><LinkOutlined /> 首页链接管理</span>} extra={<Button type="dashed" icon={<PlusOutlined />} onClick={() => openDataModal()}>添加链接</Button>}>
          <Table dataSource={data.links.map((l, i) => ({ ...l, key: i }))} columns={columns} pagination={{ pageSize: dataPageSize, showSizeChanger: true, onShowSizeChange: (_, size) => setDataPageSize(size) }} />
        </Card>
      </Space>
    )
  }

  // 2. 书签管理 (converted_bookmarks.json)
  const renderBookmarksSection = () => {
    const columns = [
      { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, render: (text: string) => <Text strong>{text}</Text> },
      {
        title: '所属文件夹', dataIndex: 'path', key: 'path',
        render: (text: string) => (
          <Space size={[0, 4]} wrap>
            {text.split(' / ').map((p, i) => (
              <React.Fragment key={i}><Tag color="blue">{p}</Tag>{i < text.split(' / ').length - 1 && <ArrowRightOutlined style={{ fontSize: 10, color: '#ccc' }} />}</React.Fragment>
            ))}
          </Space>
        )
      },
      { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true, render: (text: string) => <Typography.Link href={text} target="_blank">{text}</Typography.Link> },
      {
        title: '操作', key: 'action', width: 120,
        render: (_: any, record: FlattenedBookmark) => (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => openBookmarkModal(record)} />
            <Popconfirm title="确定删除该书签吗？" onConfirm={() => handleDeleteBookmark(record)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ]
    return (
      <Card title={<span><BookOutlined /> 书签数据管理 {isBookmarksDirty && <Badge status="warning" text="未保存" />}</span>}
            extra={<Space wrap>
              <Select placeholder="按文件夹筛选" style={{ width: 200 }} allowClear options={uniqueFolders.map(f => ({ label: f, value: f }))} onChange={value => setBookmarkFolderFilter(value)} value={bookmarkFolderFilter} />
              <Input placeholder="搜索书签内容..." prefix={<SearchOutlined />} value={bookmarkSearch} onChange={e => setBookmarkSearch(e.target.value)} style={{ width: 250 }} allowClear />
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveBookmarks} loading={loading} disabled={!isBookmarksDirty}>保存更改</Button>
              <Button icon={<PlusOutlined />} onClick={() => openBookmarkModal()}>添加书签</Button>
            </Space>}>
        <Table dataSource={filteredBookmarks.map(b => ({ ...b, key: b.id }))} columns={columns} pagination={{ pageSize: bookmarkPageSize, showSizeChanger: true, onShowSizeChange: (_, size) => setBookmarkPageSize(size) }}
               rowSelection={{ selectedRowKeys: selectedBookmarks, onChange: keys => setSelectedBookmarks(keys) }} />
      </Card>
    )
  }

  // 3. 隐藏数据管理 (hide_data.json)
  const renderHideDataSection = () => {
    if (!hideData) return <Empty description="加载中..." />
    const columns = [
      { title: '分类', dataIndex: 'category', key: 'category', render: (text: string) => <Tag color="purple">{text}</Tag> },
      { title: '标题', dataIndex: 'title', key: 'title', render: (text: string) => <Text strong>{text}</Text> },
      { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true, render: (text: string) => <Typography.Link href={text} target="_blank">{text}</Typography.Link> },
      { title: '图标', dataIndex: 'icon', key: 'icon', width: 100 },
      {
        title: '操作', key: 'action', width: 120,
        render: (_: any, record: any, index: number) => (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => { setEditingHideLink(record); setEditingHideIndex(index); hideForm.setFieldsValue(record); setIsHideModalOpen(true); }} />
            <Popconfirm title="确定删除该链接吗？" onConfirm={() => { const newLinks = [...hideData.links]; newLinks.splice(index, 1); setHideData({ ...hideData, links: newLinks }); setIsHideDataDirty(true); }}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ]
    return (
      <Card title={<span><LockOutlined /> 隐藏数据管理 {isHideDataDirty && <Badge status="warning" text="未保存" />}</span>}
            extra={<Space><Button type="primary" icon={<SaveOutlined />} onClick={handleSaveHideData} loading={loading} disabled={!isHideDataDirty}>保存更改</Button><Button type="dashed" icon={<PlusOutlined />} onClick={() => { setEditingHideLink(null); setEditingHideIndex(-1); hideForm.setFieldsValue({ category: '私密', title: '', url: 'https://', icon: 'link' }); setIsHideModalOpen(true); }}>添加隐藏链接</Button></Space>}>
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>提示：此处管理的数据存储在 `hide_data.json` 中，在首页输入管理员密码后可见。</Text>
        <Table dataSource={hideData.links.map((l, i) => ({ ...l, key: i }))} columns={columns} pagination={{ pageSize: hidePageSize, showSizeChanger: true }} />
      </Card>
    )
  }

  // 4. 日志展示
  const renderLogsSection = () => {
    const columns = [
      { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 200 },
      { title: '操作类型', dataIndex: 'action', key: 'action', width: 150, render: (text: string) => <Tag color={text.includes('失败') ? 'red' : text.includes('成功') ? 'green' : 'blue'}>{text}</Tag> },
      { title: '详情', dataIndex: 'details', key: 'details' },
      { title: '来源', dataIndex: 'ip', key: 'ip', width: 150 }
    ]
    return (
      <Card title={<span><HistoryOutlined /> 系统操作日志</span>} extra={<Space><DatePicker picker="month" placeholder="选择月份" format="YYYY-MM" onChange={(_, dateString) => { if (typeof dateString === 'string') { setLogMonth(dateString); fetchLogs(dateString); } }} /><Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>刷新</Button></Space>}>
        <Table dataSource={logs.map((l, i) => ({ ...l, key: i }))} columns={columns} pagination={{ pageSize: logPageSize }} loading={loading} />
      </Card>
    )
  }

  // 5. 安全设置 (修改密码)
  const renderSecuritySection = () => (
    <Card title="安全设置" extra={<Badge status={config?.hasPassword ? 'success' : 'warning'} text={config?.hasPassword ? '已设置访问密码' : '未设置访问密码'} />}>
      <Row gutter={24}>
        <Col span={12}>
          <Title level={5}>修改访问密码</Title>
          <Text type="secondary">设置或修改后台管理系统的访问密码。密码将 SHA-256 加密后存储在 GitHub 的 `admin_config.json` 中。</Text>
          <Form form={passwordForm} onFinish={handleSetPassword} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item name="password" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少 6 位' }]}><Input.Password placeholder="请输入新密码" /></Form.Item>
            <Form.Item name="confirm" label="确认新密码" dependencies={['password']} rules={[{ required: true, message: '请确认新密码' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) return Promise.resolve(); return Promise.reject(new Error('两次输入的密码不一致')); } })]}><Input.Password placeholder="请再次输入新密码" /></Form.Item>
            <Form.Item><Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>更新密码并同步</Button></Form.Item>
          </Form>
        </Col>
      </Row>
    </Card>
  )

  const menuItems = [
    { key: 'data', icon: <SettingOutlined />, label: '站点配置' },
    { key: 'bookmarks', icon: <BookOutlined />, label: '书签管理' },
    { key: 'hidedata', icon: <LockOutlined />, label: '隐藏数据' },
    { key: 'logs', icon: <HistoryOutlined />, label: '操作日志' },
    { key: 'security', icon: <SettingOutlined />, label: '安全设置' }
  ]

  // 未登录时的登录界面
  if (!isLoggedIn) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
        <Card title="管理员登录" style={{ width: 400 }}>
          <Form form={loginForm} onFinish={handleLogin} layout="vertical">
            <Form.Item name="password" label="访问密码" rules={[{ required: true, message: '请输入访问密码' }]}><Input.Password prefix={<SettingOutlined />} placeholder="请输入访问密码" /></Form.Item>
            <Form.Item><Button type="primary" htmlType="submit" block loading={loading}>登录</Button></Form.Item>
            {!config?.hasPassword && <Text type="secondary">初次使用？登录后请立即前往安全设置设定密码。</Text>}
          </Form>
        </Card>
      </div>
    )
  }

  // 已登录后的主布局
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" breakpoint="lg" collapsedWidth="0" onCollapse={(collapsed) => setIsSiderCollapsed(collapsed)} 
             style={{ boxShadow: '2px 0 8px 0 rgba(29,33,41,.05)', zIndex: 10, position: 'fixed', height: '100vh', left: 0 }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}><Title level={4} style={{ margin: 0, color: token.colorPrimary }}>Admin</Title></div>
        <Menu mode="inline" selectedKeys={[activeKey]} onClick={handleMenuClick} items={menuItems} style={{ borderRight: 0, marginTop: 16 }} />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}><Button danger block onClick={handleLogout}>退出登录</Button></div>
      </Sider>
      <Layout style={{ transition: 'all 0.2s', paddingLeft: isSiderCollapsed ? 0 : 200 }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 1 }}>
          <Space><GlobalOutlined /><Text strong>管理员系统</Text></Space>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          {activeKey === 'data' && renderDataSection()}
          {activeKey === 'bookmarks' && renderBookmarksSection()}
          {activeKey === 'hidedata' && renderHideDataSection()}
          {activeKey === 'logs' && renderLogsSection()}
          {activeKey === 'security' && renderSecuritySection()}
        </Content>
      </Layout>

      {/* 书签新增/编辑弹窗 */}
      <Modal title={editingBookmark ? '编辑书签' : '添加新书签'} open={isModalOpen} onOk={handleBookmarkModalSubmit} onCancel={() => setIsModalOpen(false)} okText="确认保存 (本地)" cancelText="取消" destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input placeholder="书签标题" /></Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入 URL' }, { type: 'url', message: '请输入合法的 URL' }]}><Input placeholder="https://..." /></Form.Item>
          <Form.Item name="path" label="文件夹路径 (使用 / 分隔)" rules={[{ required: true, message: '请输入路径' }]}><Input placeholder="例如: 常用 / 工具 / 开发" /></Form.Item>
          <Form.Item name="icon" label="图标标识"><Input placeholder="link" /></Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

const App: React.FC = () => (
  <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 8 } }}>
    <AntdApp><AdminApp /></AntdApp>
  </ConfigProvider>
)

export default App
