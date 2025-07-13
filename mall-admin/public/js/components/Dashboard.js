const Dashboard = {
    data() {
        return {
            loading: false,
            statsData: {
                todaySales: 1250.80,
                weekSales: 8765.40,
                monthSales: 35420.50,
                orderCount: {
                    unpaid: 15,
                    unshipped: 32,
                    shipped: 5,
                    completed: 128
                }
            },
            salesTrend: [
                { date: '周一', amount: 1200 },
                { date: '周二', amount: 1500 },
                { date: '周三', amount: 1100 },
                { date: '周四', amount: 1800 },
                { date: '周五', amount: 2100 },
                { date: '周六', amount: 2800 },
                { date: '周日', amount: 3200 }
            ],
            hotGoods: [
                { name: '华为 Mate 60 Pro', sales: 98 },
                { name: '小米 14 Ultra', sales: 85 },
                { name: 'iPhone 15 Pro Max', sales: 77 },
                { name: 'OPPO Find X7', sales: 63 },
                { name: 'Vivo X100', sales: 51 }
            ]
        }
    },
    template: `
        <div class="dashboard">
            <el-row :gutter="20">
                <!-- 销售额卡片 -->
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div slot="header">
                            <span>今日销售额</span>
                        </div>
                        <div class="card-body">
                            <h2>¥ {{statsData.todaySales}}</h2>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div slot="header">
                            <span>本周销售额</span>
                        </div>
                        <div class="card-body">
                            <h2>¥ {{statsData.weekSales}}</h2>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div slot="header">
                            <span>本月销售额</span>
                        </div>
                        <div class="card-body">
                            <h2>¥ {{statsData.monthSales}}</h2>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px">
                <!-- 订单统计 -->
                <el-col :span="12">
                    <el-card shadow="hover">
                        <div slot="header">
                            <span>订单统计</span>
                        </div>
                        <div class="card-body">
                            <el-row :gutter="20">
                                <el-col :span="6">
                                    <div class="order-stat">
                                        <div class="num">{{statsData.orderCount.unpaid}}</div>
                                        <div class="text">待付款</div>
                                    </div>
                                </el-col>
                                <el-col :span="6">
                                    <div class="order-stat">
                                        <div class="num">{{statsData.orderCount.unshipped}}</div>
                                        <div class="text">待发货</div>
                                    </div>
                                </el-col>
                                <el-col :span="6">
                                    <div class="order-stat">
                                        <div class="num">{{statsData.orderCount.shipped}}</div>
                                        <div class="text">已发货</div>
                                    </div>
                                </el-col>
                                <el-col :span="6">
                                    <div class="order-stat">
                                        <div class="num">{{statsData.orderCount.completed}}</div>
                                        <div class="text">已完成</div>
                                    </div>
                                </el-col>
                            </el-row>
                        </div>
                    </el-card>
                </el-col>

                <!-- 热销商品 -->
                <el-col :span="12">
                    <el-card shadow="hover">
                        <div slot="header">
                            <span>热销商品TOP5</span>
                        </div>
                        <div class="card-body">
                            <el-table
                                :data="hotGoods"
                                style="width: 100%"
                                size="small">
                                <el-table-column
                                    prop="name"
                                    label="商品名称">
                                </el-table-column>
                                <el-table-column
                                    prop="sales"
                                    label="销量"
                                    width="100">
                                </el-table-column>
                            </el-table>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <!-- 销售趋势图 -->
            <el-row style="margin-top: 20px">
                <el-col :span="24">
                    <el-card shadow="hover">
                        <div slot="header">
                            <span>销售趋势</span>
                        </div>
                        <div class="card-body" style="height: 300px">
                            <div id="salesChart" style="width: 100%; height: 100%"></div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    `,
    methods: {
        async loadStats() {
            this.loading = true;
            try {
                // 获取销售统计
                const salesRes = await axios.get('/api/admin/stats/sales');
                if (salesRes.data.code === 0) {
                    this.statsData.todaySales = salesRes.data.data.today;
                    this.statsData.weekSales = salesRes.data.data.week;
                    this.statsData.monthSales = salesRes.data.data.month;
                }

                // 获取订单统计
                const orderRes = await axios.get('/api/admin/stats/orders');
                if (orderRes.data.code === 0) {
                    this.statsData.orderCount = orderRes.data.data;
                }

                // 获取热销商品
                const hotRes = await axios.get('/api/admin/stats/hot-goods');
                if (hotRes.data.code === 0) {
                    this.hotGoods = hotRes.data.data;
                }

                // 获取销售趋势
                const trendRes = await axios.get('/api/admin/stats/sales-trend');
                if (trendRes.data.code === 0) {
                    this.salesTrend = trendRes.data.data;
                    this.renderChart();
                }
            } catch (error) {
                this.$message.error('加载统计数据失败');
            }
            this.loading = false;
        },
        renderChart() {
            // 使用echarts绘制销售趋势图
            const chart = echarts.init(document.getElementById('salesChart'));
            const option = {
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    data: this.salesTrend.map(item => item.date)
                },
                yAxis: {
                    type: 'value'
                },
                series: [{
                    data: this.salesTrend.map(item => item.amount),
                    type: 'line',
                    smooth: true
                }]
            };
            chart.setOption(option);
        }
    },
    mounted() {
        // this.loadStats();
        // 直接渲染图表
        this.$nextTick(() => {
            if (this.salesTrend.length > 0) {
                this.renderChart();
            }
        });
    }
}; 