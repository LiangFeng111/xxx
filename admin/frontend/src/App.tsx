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

// --- Types ---

type Link = {
  category: string
  title: string
  url: string
  icon: string
}

type SettingsData = {
  site_title: string
  site_subtitle: string
  site_notice: string
}

type DataFile = {
  settings: SettingsData
  links: Link[]
}

type BookmarkNode = {
  type: 'folder' | 'link'
  name?: string
  title?: string
  url?: string
  icon?: string
  children?: BookmarkNode[]
}

type FlattenedBookmark = {
  id: string
  title: string
  url: string
  icon: string
  path: string
}

const API_BASE = window.CONFIG?.API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'

// --- Main App Component ---

const AdminApp: React.FC = () => {
  const [activeKey, setActiveKey] = useState('data')
  const { message, modal, notification } = AntdApp.useApp()
  const { token } = theme.useToken()

  // Data.json states
  const [data, setData] = useState<DataFile | null>(null)
  const [dataSha, setDataSha] = useState('')
  const [isDataDirty, setIsDataDirty] = useState(false)
  const [selectedDataLinks, setSelectedDataLinks] = useState<React.Key[]>([])
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [dataPageSize, setDataPageSize] = useState(10)
  const [dataLinkForm] = Form.useForm()
  const [editingDataLink, setEditingDataLink] = useState<Link | null>(null)
  const [editingDataIndex, setEditingDataIndex] = useState<number | -1>(-1)

  // Bookmarks states
  const [bookmarks, setBookmarks] = useState<{ links: BookmarkNode[] } | null>(null)
  const [bookmarksSha, setBookmarksSha] = useState('')
  const [isBookmarksDirty, setIsBookmarksDirty] = useState(false)
  const [selectedBookmarks, setSelectedBookmarks] = useState<React.Key[]>([])
  const [bookmarkSearch, setBookmarkSearch] = useState('')
  const [bookmarkPageSize, setBookmarkPageSize] = useState(15)
  const [bookmarkFolderFilter, setBookmarkFolderFilter] = useState<string | null>(null)

  // Hide Data states
  const [hideData, setHideData] = useState<{ links: Link[] } | null>(null)
  const [hideDataSha, setHideDataSha] = useState('')
  const [isHideDataDirty, setIsHideDataDirty] = useState(false)
  const [selectedHideLinks, setSelectedHideLinks] = useState<React.Key[]>([])
  const [isHideModalOpen, setIsHideModalOpen] = useState(false)
  const [hidePageSize, setHidePageSize] = useState(10)
  const [hideForm] = Form.useForm()
  const [editingHideLink, setEditingHideLink] = useState<Link | null>(null)
  const [editingHideIndex, setEditingHideIndex] = useState<number | -1>(-1)

  // Logs states
  const [logs, setLogs] = useState<any[]>([])
  const [logMonth, setLogMonth] = useState(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`)
  const [logPageSize, setLogPageSize] = useState(20)

  // Config states
  const [config, setConfig] = useState<{ hasPassword: boolean } | null>(null)
  const [configSha, setConfigSha] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const [isSiderCollapsed, setIsSiderCollapsed] = useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<FlattenedBookmark | null>(null)
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

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
      // If we're setting the password for the first time, we should log in with it
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

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('admin_token')
    return token ? { 'Authorization': token } : {}
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/data`, {
        headers: getAuthHeader()
      })
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
      const res = await fetch(`${API_BASE}/bookmarks`, {
        headers: getAuthHeader()
      })
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
      const res = await fetch(`${API_BASE}/hidedata`, {
        headers: getAuthHeader()
      })
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
    if (e.key === 'logs') {
      fetchLogs()
    }
  }

  const fetchLogs = async (month?: string) => {
    setLoading(true)
    try {
      const targetMonth = month || logMonth
      const res = await fetch(`${API_BASE}/logs?month=${targetMonth}`, {
        headers: getAuthHeader()
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setLogs(json.reverse()) // Show latest first
    } catch (err: any) {
      notification.error({ message: '日志加载失败', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const openHideModal = (link?: Link, index?: number) => {
    if (link !== undefined && index !== undefined) {
      setEditingHideLink(link)
      setEditingHideIndex(index)
      hideForm.setFieldsValue(link)
    } else {
      setEditingHideLink(null)
      setEditingHideIndex(-1)
      hideForm.setFieldsValue({ category: '隐藏分类', title: '', url: 'https://', icon: 'link' })
    }
    setIsHideModalOpen(true)
  }

  const handleHideModalSubmit = () => {
    hideForm.validateFields().then(values => {
      if (!hideData) return
      const newLinks = [...hideData.links]
      if (editingHideIndex !== -1) {
        newLinks[editingHideIndex] = values
      } else {
        newLinks.unshift(values)
      }
      setHideData({ ...hideData, links: newLinks })
      setIsHideDataDirty(true)
      setIsHideModalOpen(false)
    })
  }

  const handleSaveData = async () => {
    if (!data) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        } as HeadersInit,
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        } as HeadersInit,
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        } as HeadersInit,
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

  // Flattened bookmarks for Table
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

  const uniqueFolders = useMemo(() => {
    const folders = new Set<string>()
    flattenedBookmarks.forEach(b => {
      if (b.path) folders.add(b.path)
    })
    return Array.from(folders).sort()
  }, [flattenedBookmarks])

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

  // --- Actions ---

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

  const handleBulkDeleteDataLinks = () => {
    if (!data || selectedDataLinks.length === 0) return
    modal.confirm({
      title: '批量删除确认',
      icon: <ExclamationCircleOutlined />,
      content: `确定删除选中的 ${selectedDataLinks.length} 个链接吗？此操作仅在本地生效，需点击保存同步。`,
      onOk() {
        const newLinks = data.links.filter((_, i) => !selectedDataLinks.includes(i))
        setData({ ...data, links: newLinks })
        setSelectedDataLinks([])
        setIsDataDirty(true)
      }
    })
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

  const handleBookmarkModalSubmit = () => {
    form.validateFields().then(values => {
      if (!bookmarks) return
      const newBookmarks = JSON.parse(JSON.stringify(bookmarks))
      const pathParts = values.path.split('/').map((p: string) => p.trim()).filter(Boolean)
      
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
      }

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
    setBookmarks(newBookmarks)
    setIsBookmarksDirty(true)
  }

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
        setBookmarks(newBookmarks)
        setSelectedBookmarks([])
        setIsBookmarksDirty(true)
      }
    })
  }

  // --- Render Sections ---

  const renderDataSection = () => {
    if (!data) return <Empty description="加载中..." />

    const columns = [
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        render: (text: string) => <Tag color="blue">{text}</Tag>
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        render: (text: string) => <Text strong>{text}</Text>
      },
      {
        title: 'URL',
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        render: (text: string) => <Typography.Link href={text} target="_blank">{text}</Typography.Link>
      },
      {
        title: '图标',
        dataIndex: 'icon',
        key: 'icon',
        width: 100
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_: any, record: any, index: number) => (
          <Space>
            <Tooltip title="编辑">
              <Button type="text" icon={<EditOutlined />} onClick={() => openDataModal(record, index)} />
            </Tooltip>
            <Popconfirm title="确定删除该链接吗？" onConfirm={() => handleDeleteDataLink(index)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ]

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={
          <Space>
            <SettingOutlined />
            <span>站点设置</span>
            {isDataDirty && <Badge status="warning" text="未保存" />}
          </Space>
        } extra={
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveData} 
            loading={loading}
            disabled={!isDataDirty}
          >
            保存更改
          </Button>
        }>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Text type="secondary">站点标题</Text>
              <Input 
                value={data.settings.site_title} 
                onChange={e => {
                  setData({ ...data, settings: { ...data.settings, site_title: e.target.value } })
                  setIsDataDirty(true)
                }}
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text type="secondary">站点副标题</Text>
              <Input 
                value={data.settings.site_subtitle} 
                onChange={e => {
                  setData({ ...data, settings: { ...data.settings, site_subtitle: e.target.value } })
                  setIsDataDirty(true)
                }}
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text type="secondary">站点公告</Text>
              <Input 
                value={data.settings.site_notice} 
                onChange={e => {
                  setData({ ...data, settings: { ...data.settings, site_notice: e.target.value } })
                  setIsDataDirty(true)
                }}
                style={{ marginTop: 8 }}
              />
            </Col>
          </Row>
        </Card>

        <Card title={
          <Space>
            <LinkOutlined />
            <span>首页链接管理</span>
            {selectedDataLinks.length > 0 && (
              <Button danger size="small" icon={<DeleteOutlined />} onClick={handleBulkDeleteDataLinks}>
                批量删除 ({selectedDataLinks.length})
              </Button>
            )}
          </Space>
        } extra={
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => openDataModal()}>
            添加链接
          </Button>
        }>
          <Table 
            dataSource={data.links.map((l, i) => ({ ...l, key: i }))} 
            columns={columns} 
            pagination={{ 
              pageSize: dataPageSize,
              showSizeChanger: true,
              onShowSizeChange: (_, size) => setDataPageSize(size)
            }}
            rowSelection={{
              selectedRowKeys: selectedDataLinks,
              onChange: keys => setSelectedDataLinks(keys)
            }}
          />
        </Card>

        <Modal
          title={editingDataLink ? '编辑链接' : '添加新链接'}
          open={isDataModalOpen}
          onOk={handleDataModalSubmit}
          onCancel={() => setIsDataModalOpen(false)}
          okText="确定"
          cancelText="取消"
          destroyOnClose
        >
          <Form form={dataLinkForm} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item name="category" label="分类" rules={[{ required: true, message: '请输入分类' }]}>
              <Input placeholder="常用工具 / 开发 / 娱乐" />
            </Form.Item>
            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="链接标题" />
            </Form.Item>
            <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入 URL' }, { type: 'url', message: '请输入合法的 URL' }]}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="icon" label="图标标识">
              <Input placeholder="link" />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    )
  }

  const renderBookmarksSection = () => {
    const columns = [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text: string) => <Text strong>{text}</Text>
      },
      {
        title: '所属文件夹',
        dataIndex: 'path',
        key: 'path',
        render: (text: string) => (
          <Space size={[0, 4]} wrap>
            {text.split(' / ').map((p, i) => (
              <React.Fragment key={i}>
                <Tag color="blue">{p}</Tag>
                {i < text.split(' / ').length - 1 && <ArrowRightOutlined style={{ fontSize: 10, color: '#ccc' }} />}
              </React.Fragment>
            ))}
          </Space>
        )
      },
      {
        title: 'URL',
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        render: (text: string) => <Typography.Link href={text} target="_blank">{text}</Typography.Link>
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_: any, record: FlattenedBookmark) => (
          <Space>
            <Tooltip title="编辑">
              <Button type="text" icon={<EditOutlined />} onClick={() => openBookmarkModal(record)} />
            </Tooltip>
            <Popconfirm title="确定删除该书签吗？" onConfirm={() => handleDeleteBookmark(record)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ]

    return (
      <Card title={
        <Space size="middle">
          <BookOutlined />
          <span>书签数据管理</span>
          {isBookmarksDirty && <Badge status="warning" text="未保存" />}
          {selectedBookmarks.length > 0 && (
            <Button danger size="small" icon={<DeleteOutlined />} onClick={handleBulkDeleteBookmarks}>
              批量删除 ({selectedBookmarks.length})
            </Button>
          )}
        </Space>
      } extra={
        <Space wrap>
          <Select
            placeholder="按文件夹筛选"
            style={{ width: 200 }}
            allowClear
            options={uniqueFolders.map(f => ({ label: f, value: f }))}
            onChange={value => setBookmarkFolderFilter(value)}
            value={bookmarkFolderFilter}
          />
          <Input 
            placeholder="搜索书签内容..." 
            prefix={<SearchOutlined />} 
            value={bookmarkSearch} 
            onChange={e => setBookmarkSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveBookmarks} 
            loading={loading}
            disabled={!isBookmarksDirty}
          >
            保存更改
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => openBookmarkModal()}>
            添加书签
          </Button>
        </Space>
      }>
        <Table 
          dataSource={filteredBookmarks.map(b => ({ ...b, key: b.id }))} 
          columns={columns} 
          pagination={{ 
            pageSize: bookmarkPageSize, 
            showSizeChanger: true,
            onShowSizeChange: (_, size) => setBookmarkPageSize(size),
            onChange: (page, size) => setBookmarkPageSize(size)
          }}
          rowSelection={{
            selectedRowKeys: selectedBookmarks,
            onChange: keys => setSelectedBookmarks(keys)
          }}
        />
      </Card>
    )
  }

  const renderHideDataSection = () => {
    if (!hideData) return <Empty description="加载中..." />

    const columns = [
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        render: (text: string) => <Tag color="purple">{text}</Tag>
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        render: (text: string) => <Text strong>{text}</Text>
      },
      {
        title: 'URL',
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        render: (text: string) => <Typography.Link href={text} target="_blank">{text}</Typography.Link>
      },
      {
        title: '图标',
        dataIndex: 'icon',
        key: 'icon',
        width: 100
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_: any, record: any, index: number) => (
          <Space>
            <Tooltip title="编辑">
              <Button type="text" icon={<EditOutlined />} onClick={() => openHideModal(record, index)} />
            </Tooltip>
            <Popconfirm title="确定删除该链接吗？" onConfirm={() => {
              const newLinks = [...hideData.links]
              newLinks.splice(index, 1)
              setHideData({ ...hideData, links: newLinks })
              setIsHideDataDirty(true)
            }}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ]

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={
          <Space>
            <LockOutlined />
            <span>隐藏数据管理</span>
            {isHideDataDirty && <Badge status="warning" text="未保存" />}
          </Space>
        } extra={
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSaveHideData} 
              loading={loading}
              disabled={!isHideDataDirty}
            >
              保存更改
            </Button>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => openHideModal()}>
              添加隐藏链接
            </Button>
          </Space>
        }>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            提示：此处管理的数据将存储在 `hide_data.json` 中。在首页输入管理员密码后即可加载显示。
          </Text>
          <Table 
            dataSource={hideData.links.map((l, i) => ({ ...l, key: i }))} 
            columns={columns} 
            pagination={{ 
              pageSize: hidePageSize,
              showSizeChanger: true,
              onShowSizeChange: (_, size) => setHidePageSize(size)
            }}
            rowSelection={{
              selectedRowKeys: selectedHideLinks,
              onChange: keys => setSelectedHideLinks(keys)
            }}
          />
        </Card>

        <Modal
          title={editingHideLink ? '编辑隐藏链接' : '添加新隐藏链接'}
          open={isHideModalOpen}
          onOk={handleHideModalSubmit}
          onCancel={() => setIsHideModalOpen(false)}
          okText="确定"
          cancelText="取消"
          destroyOnClose
        >
          <Form form={hideForm} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item name="category" label="分类" rules={[{ required: true, message: '请输入分类' }]}>
              <Input placeholder="私密 / 常用 / 其他" />
            </Form.Item>
            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="链接标题" />
            </Form.Item>
            <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入 URL' }, { type: 'url', message: '请输入合法的 URL' }]}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="icon" label="图标标识">
              <Input placeholder="link" />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    )
  }

  const renderLogsSection = () => {
    const columns = [
      {
        title: '时间',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: 200,
        sorter: (a: any, b: any) => a.timestamp.localeCompare(b.timestamp)
      },
      {
        title: '操作类型',
        dataIndex: 'action',
        key: 'action',
        width: 150,
        render: (text: string) => {
          let color = 'blue'
          if (text.includes('失败')) color = 'red'
          if (text.includes('成功')) color = 'green'
          if (text.includes('修改')) color = 'orange'
          return <Tag color={color}>{text}</Tag>
        }
      },
      {
        title: '详情',
        dataIndex: 'details',
        key: 'details'
      },
      {
        title: '来源',
        dataIndex: 'ip',
        key: 'ip',
        width: 150
      }
    ]

    return (
      <Card title={
        <Space>
          <HistoryOutlined />
          <span>系统操作日志</span>
        </Space>
      } extra={
        <Space>
          <DatePicker 
            picker="month" 
            placeholder="选择月份" 
            format="YYYY-MM"
            onChange={(_, dateString) => {
              if (typeof dateString === 'string') {
                setLogMonth(dateString)
                fetchLogs(dateString)
              }
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>刷新</Button>
        </Space>
      }>
        <Table 
          dataSource={logs.map((l, i) => ({ ...l, key: i }))} 
          columns={columns} 
          pagination={{ 
            pageSize: logPageSize,
            showSizeChanger: true,
            onShowSizeChange: (_, size) => setLogPageSize(size)
          }}
          loading={loading}
        />
      </Card>
    )
  }

  const renderSecuritySection = () => {
    return (
      <Card title="安全设置" extra={<Badge status={config?.hasPassword ? 'success' : 'warning'} text={config?.hasPassword ? '已设置访问密码' : '未设置访问密码'} />}>
        <Row gutter={24}>
          <Col span={12}>
            <Title level={5}>修改访问密码</Title>
            <Text type="secondary">设置或修改后台管理系统的访问密码。密码将加密存储在 GitHub 配置文件中。</Text>
            <Form form={passwordForm} onFinish={handleSetPassword} layout="vertical" style={{ marginTop: 24 }}>
              <Form.Item name="password" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少 6 位' }]}>
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item name="confirm" label="确认新密码" dependencies={['password']} rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}>
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  更新密码
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
    )
  }

  const items = [
    { key: 'data', icon: <SettingOutlined />, label: '站点配置' },
    { key: 'bookmarks', icon: <BookOutlined />, label: '书签管理' },
    { key: 'hidedata', icon: <LockOutlined />, label: '隐藏数据' },
    { key: 'logs', icon: <HistoryOutlined />, label: '操作日志' },
    { key: 'security', icon: <SettingOutlined />, label: '安全设置' }
  ]

  if (!isLoggedIn) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
        <Card title="管理员登录" style={{ width: 400 }}>
          <Form form={loginForm} onFinish={handleLogin} layout="vertical">
            <Form.Item name="password" label="访问密码" rules={[{ required: true, message: '请输入访问密码' }]}>
              <Input.Password prefix={<SettingOutlined />} placeholder="请输入访问密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
            {!config?.hasPassword && (
              <Text type="secondary">初次使用？请在登录后设置密码。</Text>
            )}
          </Form>
        </Card>
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        breakpoint="lg"
        collapsedWidth="0"
        onCollapse={(collapsed) => setIsSiderCollapsed(collapsed)}
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,33,41,.05)',
          zIndex: 10,
          position: 'fixed',
          height: '100vh',
          left: 0
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>Admin</Title>
        </div>
        <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              onClick={handleMenuClick}
              items={items}
              style={{ borderRight: 0, marginTop: 16 }}
            />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
          <Button danger block onClick={handleLogout}>退出登录</Button>
        </div>
      </Sider>
      <Layout style={{ transition: 'all 0.2s', paddingLeft: isSiderCollapsed ? 0 : 200 }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 1 }}>
          <Space>
            <GlobalOutlined />
            <Text strong>管理员</Text>
          </Space>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          {activeKey === 'data' && renderDataSection()}
          {activeKey === 'bookmarks' && renderBookmarksSection()}
          {activeKey === 'hidedata' && renderHideDataSection()}
          {activeKey === 'logs' && renderLogsSection()}
          {activeKey === 'security' && renderSecuritySection()}
        </Content>
      </Layout>

      <Modal
        title={editingBookmark ? '编辑书签' : '添加新书签'}
        open={isModalOpen}
        onOk={handleBookmarkModalSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="确认保存 (本地)"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="书签标题" />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入 URL' }, { type: 'url', message: '请输入合法的 URL' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="path" label="文件夹路径 (使用 / 分隔)" rules={[{ required: true, message: '请输入路径' }]}>
            <Input placeholder="例如: 常用 / 工具 / 开发" />
          </Form.Item>
          <Form.Item name="icon" label="图标标识">
            <Input placeholder="link" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

const App: React.FC = () => (
  <ConfigProvider locale={zhCN} theme={{
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 8,
    },
  }}>
    <AntdApp>
      <AdminApp />
    </AntdApp>
  </ConfigProvider>
)

export default App
