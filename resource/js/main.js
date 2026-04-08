const {createApp, ref, onMounted, computed, watch, nextTick} = Vue;

const DEFAULT_ICON = window.CONFIG.DEFAULT_IMAGE

const app = createApp({
    setup() {
        // 状态定义
        const settings = ref({});        // 站点设置
        const toolLinks = ref([]);      // data.json 中的普通链接
        const bookmarkTree = ref([]);    // 书签树
        const hideData = ref(null);      // 解锁后的隐藏数据
        const searchQuery = ref('');     // 搜索关键词
        const activeMenu = ref('');      // 当前选中的侧边栏 ID
        const isSidebarOpen = ref(false);// 移动端侧边栏是否开启
        const showNotice = ref(true);    // 是否显示公告
        const isModalOpen = ref(false);  // 书签浏览器弹窗是否开启
        const selectedFolder = ref(null);// 书签弹窗中当前选中的根文件夹
        const navigationStack = ref([]); // 书签导航栈
        const isAppLoading = ref(true);  // 全局加载状态
        const recentTools = ref([]);     // 最近使用的工具
        const expandedSections = ref(['recent']); // 默认展开最近使用
        const currentCategory = ref('');  // 当前选中的主分类（面包屑导航用）

        // 加载最近使用工具
        const loadRecentTools = () => {
            const saved = localStorage.getItem('recent_tools');
            if (saved) {
                try {
                    recentTools.value = JSON.parse(saved);
                } catch (e) {
                    recentTools.value = [];
                }
            }
        };

        // 记录点击
        const trackClick = (tool) => {
            const list = [...recentTools.value];
            const index = list.findIndex(t => t.url === tool.url);
            if (index > -1) list.splice(index, 1);
            list.unshift(tool);
            recentTools.value = list.slice(0, 12); // 最多保留12个
            localStorage.setItem('recent_tools', JSON.stringify(recentTools.value));
        };

        const toggleSection = (id) => {
            const index = expandedSections.value.indexOf(id);
            if (index > -1) {
                expandedSections.value.splice(index, 1);
            } else {
                expandedSections.value.push(id);
            }
        };

        // 获取当前显示的项 (Computed)
        const currentFolderItems = computed(() => {
            if (navigationStack.value.length > 0) {
                return navigationStack.value[navigationStack.value.length - 1].children || [];
            }
            return selectedFolder.value?.children || [];
        });

        const currentFolderName = computed(() => {
            if (navigationStack.value.length > 0) {
                return navigationStack.value[navigationStack.value.length - 1].name;
            }
            return selectedFolder.value?.name || '书签浏览';
        });

        const enterFolder = (folder) => {
            navigationStack.value.push(folder);
        };

        const jumpToFolder = (index) => {
            navigationStack.value = navigationStack.value.slice(0, index + 1);
        };

        const resetNavigation = () => {
            navigationStack.value = [];
        };

        const openBookmarkModal = (folder) => {
            selectedFolder.value = folder;
            navigationStack.value = [];
            isModalOpen.value = true;
        };

        // 监听侧边栏状态，开启时利用 el-drawer 自动处理 body 锁定
        // 我们只需要保留基本的状态控制，el-drawer 会处理 z-index 和遮罩层点击
        watch(isSidebarOpen, (val) => {
            // el-drawer 默认会处理 body 滚动锁定
        });

        const treeProps = {
            label: (data) => data.name || data.title,
            children: 'children'
        };

        onMounted(async () => {
            loadRecentTools();
            try {
                // 并行加载数据以优化速度
                await Promise.all([fetchData(), fetchBookmarks()]);
            } finally {
                // 无论成功失败，加载完成后移除加载动画
                setTimeout(() => {
                    isAppLoading.value = false;
                }, 300);
            }

            // 初始化 Scroll Spy (滚动自动切换侧边栏选中)
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        activeMenu.value = entry.target.id;
                    }
                });
            }, {rootMargin: '-10% 0px -80% 0px'});

            nextTick(() => {
                toolGroups.value.forEach(g => {
                    const el = document.getElementById('cat-' + g.name);
                    if (el) observer.observe(el);
                });
                const bookmarkEl = document.getElementById('bookmarks');
                if (bookmarkEl) observer.observe(bookmarkEl);
            });
        });

        // 获取 data.json 数据
        const fetchData = async () => {
            try {
                const res = await fetch(window.CONFIG.DATA_URL);
                const data = await res.json();
                settings.value = data.settings;
                toolLinks.value = data.links;
                // 默认选中第一个分类的名称（去掉 cat- 前缀）
                if (toolLinks.value.length > 0 && !currentCategory.value) {
                    currentCategory.value = toolLinks.value[0].category;
                }
            } catch (e) {
                console.error('Data error:', e);
            }
        };

        // 获取书签数据
        const fetchBookmarks = async () => {
            try {
                const res = await fetch(window.CONFIG.BOOKMARKS_URL);
                const data = await res.json();
                bookmarkTree.value = data.links;
            } catch (e) {
                console.error('Bookmarks error:', e);
            }
        };

        // 将工具链接按分类分组 (Computed)
        const toolGroups = computed(() => {
            const groups = {};
            toolLinks.value.forEach(link => {
                if (!groups[link.category]) groups[link.category] = [];
                groups[link.category].push(link);
            });
            return Object.keys(groups).map(name => ({name, items: groups[name]}));
        });

        // 将隐藏链接按分类分组 (Computed)
        const hideGroups = computed(() => {
            if (!hideData.value) return [];
            const groups = {};
            // 兼容性处理：如果 hideData 是数组则直接使用，如果是对象则尝试取 links
            const links = Array.isArray(hideData.value) ? hideData.value : (hideData.value.links || []);
            links.forEach(link => {
                if (!groups[link.category]) groups[link.category] = [];
                groups[link.category].push(link);
            });
            return Object.keys(groups).map(name => ({name, items: groups[name]}));
        });

        // 处理菜单项点击，滚动到对应锚点
        const handleMenuSelect = (index) => {
            if (index === 'unlock-hide') {
                unlockHideData();
                return;
            }
            
            // 统一导航状态：设置当前显示的分类 ID
            let targetId = index;
            if (index.startsWith('cat-')) {
                targetId = index.replace('cat-', '');
            } else if (index.startsWith('hide-')) {
                targetId = index; // 保持 hide- 前缀
            } else if (index === 'bookmarks') {
                targetId = 'bookmarks';
            }
            
            currentCategory.value = targetId;
            activeMenu.value = index;
            
            // 确保在单页显示模式下，展开状态也是正确的
            const sectionId = index === 'bookmarks' ? 'bookmarks-section' : index;
            if (!expandedSections.value.includes(sectionId)) {
                expandedSections.value.push(sectionId);
            }

            if (window.innerWidth < 768) isSidebarOpen.value = false;
        };

        const openLink = (url, tool = null) => {
            if (tool) trackClick(tool);
            window.open(url, '_blank');
        };

        const openAdmin = () => {
            window.open(window.CONFIG.ADMIN_URL, '_blank');
        };

        const formatUrl = (url) => {
            try {
                const u = new URL(url);
                return u.hostname;
            } catch (e) {
                return url;
            }
        };

        const isImageUrl = (url) => {
            return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url) || url.startsWith('http');
        };

        // 获取 Favicon 图标，使用 Google 的 Favicon 服务
        const getFavicon = (url) => {
            if (!url || url.includes('工具/') || url.includes('游戏/') || url.includes('vip/')) return null;
            try {
                const domain = new URL(url).hostname;
                // 使用 Google 的 Favicon 服务作为首选，通常更稳定
                return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch (e) {
                return null;
            }
        };

        const handleIconError = (e) => {
            const target = e.target;
            // 防止死循环：如果已经是默认图标且加载失败，则不再尝试
            if (target.src === DEFAULT_ICON) {
                // 如果默认图标也加载失败，可以显示一个本地备用图标或 placeholder
                console.error('Default icon failed to load');
                return;
            }
            target.src = DEFAULT_ICON;
        };

        // 解锁隐藏资源逻辑
        const unlockHideData = () => {
            ElementPlus.ElMessageBox.prompt('请输入解锁密码', '私密资源', {
                confirmButtonText: '解锁',
                cancelButtonText: '取消',
                inputType: 'password',
            }).then(({value}) => {
                const API_BASE = window.CONFIG.API_URL
                // 处理相对路径或绝对路径
                const absoluteApiBase = API_BASE.startsWith('http') ? API_BASE : window.location.origin + '/' + API_BASE;

                fetch(`${absoluteApiBase}/public/hidedata`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({password: value})
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) {
                            ElementPlus.ElMessage.error(data.error);
                        } else {
                            hideData.value = data;
                            ElementPlus.ElMessage.success('解锁成功');
                            nextTick(() => {
                                // 动态添加对隐藏分类的滚动观察
                                const observer = new IntersectionObserver((entries) => {
                                    entries.forEach(entry => {
                                        if (entry.isIntersecting) {
                                            activeMenu.value = entry.target.id;
                                        }
                                    });
                                }, {rootMargin: '-10% 0px -80% 0px'});
                                hideGroups.value.forEach(g => {
                                    const el = document.getElementById('hide-' + g.name);
                                    if (el) observer.observe(el);
                                });
                            });
                        }
                    })
                    .catch(err => {
                        ElementPlus.ElMessage.error('解锁失败，请检查网络或配置');
                    });
            });
        };

        // 搜索逻辑 (使用 Fuse.js 进行模糊匹配)
        const searchResults = ref([]);
        let fuseTools = null;
        let fuseBookmarks = null;

        const handleSearch = () => {
            if (!searchQuery.value) {
                searchResults.value = [];
                return;
            }

            // 初始化 Fuse 实例 (仅在第一次搜索时)
            if (!fuseTools) {
                fuseTools = new Fuse(toolLinks.value, {keys: ['title', 'category', 'url'], threshold: 0.3});

                // 扁平化书签用于搜索
                const flatBookmarks = [];
                const flatten = (nodes, path = []) => {
                    nodes.forEach(n => {
                        if (n.type === 'link') flatBookmarks.push({...n, category: '书签', path: path.join('/')});
                        else if (n.children) flatten(n.children, [...path, n.name]);
                    });
                };
                flatten(bookmarkTree.value);
                fuseBookmarks = new Fuse(flatBookmarks, {keys: ['title', 'url', 'path'], threshold: 0.3});
            }

            const tools = fuseTools.search(searchQuery.value).map(r => r.item);
            const bookmarks = fuseBookmarks.search(searchQuery.value).map(r => r.item);
            searchResults.value = [...tools, ...bookmarks];
        };

        return {
            settings, toolGroups, bookmarkTree, hideData, hideGroups, searchQuery, searchResults,
            activeMenu, isSidebarOpen, showNotice, isModalOpen, selectedFolder,
            navigationStack, currentFolderItems, currentFolderName,
            enterFolder, jumpToFolder, resetNavigation,
            recentTools, expandedSections, toggleSection, currentCategory,
            handleMenuSelect, openLink, openAdmin, formatUrl,
            isImageUrl, getFavicon, handleIconError, openBookmarkModal,
            handleSearch, unlockHideData,
            isAppLoading, DEFAULT_ICON
        };
    }
});

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.use(ElementPlus);
app.mount('#app');
