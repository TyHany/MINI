const app = new Vue({
    el: '#app',
    data: {
        isCollapse: false,
        activeMenu: '',
        menuList: [
            {
                icon: 'el-icon-s-home',
                title: '首页',
                path: '/dashboard'
            },
            {
                icon: 'el-icon-picture',
                title: '轮播图管理',
                path: '/banner'
            },
            {
                icon: 'el-icon-menu',
                title: '商品管理',
                children: [
                    {
                        title: '商品分类',
                        path: '/category'
                    },
                    {
                        title: '商品列表',
                        path: '/goods'
                    }
                ]
            },
            {
                icon: 'el-icon-s-order',
                title: '订单管理',
                path: '/order'
            },
            {
                icon: 'el-icon-data-line',
                title: '数据统计',
                children: [
                    {
                        title: '销售统计',
                        path: '/stats/sales'
                    },
                    {
                        title: '订单统计',
                        path: '/stats/orders'
                    }
                ]
            }
        ],
        user: null
    },
    template: `
        <el-container style="height: 100vh;">
            <!-- 侧边栏 -->
            <el-aside :width="isCollapse ? '64px' : '200px'">
                <div class="logo">
                    <img src="/images/logo.png" alt="Logo">
                    <span v-show="!isCollapse">商城管理系统</span>
                </div>
                <el-menu
                    :collapse="isCollapse"
                    :default-active="activeMenu"
                    background-color="#304156"
                    text-color="#fff"
                    active-text-color="#409EFF">
                    <template v-for="menu in menuList">
                        <!-- 有子菜单 -->
                        <el-submenu v-if="menu.children" :index="menu.path" :key="menu.path">
                            <template slot="title">
                                <i :class="menu.icon"></i>
                                <span>{{menu.title}}</span>
                            </template>
                            <el-menu-item 
                                v-for="sub in menu.children" 
                                :key="sub.path"
                                :index="sub.path"
                                @click="handleMenuClick(sub.path)">
                                {{sub.title}}
                            </el-menu-item>
                        </el-submenu>
                        <!-- 无子菜单 -->
                        <el-menu-item 
                            v-else 
                            :index="menu.path"
                            :key="menu.path"
                            @click="handleMenuClick(menu.path)">
                            <i :class="menu.icon"></i>
                            <span slot="title">{{menu.title}}</span>
                        </el-menu-item>
                    </template>
                </el-menu>
            </el-aside>

            <!-- 主体区域 -->
            <el-container>
                <!-- 头部 -->
                <el-header>
                    <div class="header-left">
                        <i 
                            :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"
                            @click="toggleCollapse">
                        </i>
                    </div>
                    <div class="header-right">
                        <el-dropdown @command="handleCommand">
                            <span class="el-dropdown-link">
                                {{user ? user.username : ''}}
                                <i class="el-icon-arrow-down"></i>
                            </span>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </el-header>

                <!-- 内容区域 -->
                <el-main>
                    <component :is="currentComponent"></component>
                </el-main>
            </el-container>
        </el-container>
    `,
    computed: {
        currentComponent() {
            // 根据路由返回对应的组件
            const path = this.activeMenu;
            switch(path) {
                case '/dashboard': return Dashboard;
                case '/banner': return Banner;
                case '/category': return Category;
                case '/goods': return Goods;
                case '/order': return Order;
                case '/stats/sales': return SalesStats;
                case '/stats/orders': return OrderStats;
                default: return Dashboard;
            }
        }
    },
    methods: {
        toggleCollapse() {
            this.isCollapse = !this.isCollapse;
        },
        handleMenuClick(path) {
            this.activeMenu = path;
        },
        handleCommand(command) {
            if (command === 'logout') {
                this.logout();
            }
        },
        async checkLogin() {
            console.log('前端开始检查登录状态');
            try {
                const res = await axios.get('/api/admin/check-login');
                console.log('检查登录状态响应:', res.data);
                
                if (res.data.code === 0) {
                    if (!res.data.data.isLoggedIn) {
                        console.log('未登录，跳转到登录页');
                        window.location.href = '/login.html';
                    } else {
                        console.log('已登录，更新用户信息');
                        this.user = {
                            id: res.data.data.adminId,
                            username: res.data.data.adminName
                        };
                    }
                }
            } catch (error) {
                console.error('检查登录状态失败:', error);
                window.location.href = '/login.html';
            }
        },
        async logout() {
            try {
                const res = await axios.post('/api/admin/logout');
                if (res.data.code === 0) {
                    location.href = '/login.html';
                }
            } catch (error) {
                this.$message.error('退出失败');
            }
        }
    },
    mounted() {
        this.checkLogin();
        // 定期检查登录状态
        setInterval(this.checkLogin, 60000); // 每分钟检查一次
    }
}); 