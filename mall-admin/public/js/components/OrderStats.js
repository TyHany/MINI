const OrderStats = {
    data() {
        return {
            loading: false,
            orderStats: {
                total: 180,
                unpaid: 15,
                unshipped: 32,
                shipped: 5,
                completed: 128,
                cancelled: 10
            },
            conversionData: {
                pv: 2580,
                uv: 1350,
                orderCount: 180,
                conversionRate: '13.33%'
            },
            dateRange: 'today',
            dateOptions: [
                { label: '今日', value: 'today' },
                { label: '本周', value: 'week' },
                { label: '本月', value: 'month' }
            ]
        }
    },
    template: `
        <div class="order-stats">
            <!-- 订单概览 -->
            <el-card>
                <div slot="header" class="clearfix">
                    <span>订单概览</span>
                    <el-radio-group 
                        v-model="dateRange"
                        size="small"
                        style="float: right"
                        @change="handleDateRangeChange">
                        <el-radio-button 
                            v-for="item in dateOptions"
                            :key="item.value"
                            :label="item.value">
                            {{item.label}}
                        </el-radio-button>
                    </el-radio-group>
                </div>
                <el-row :gutter="20">
                    <el-col :span="4">
                        <div class="stats-item">
                            <div class="label">订单总数</div>
                            <div class="value">{{orderStats.total}}</div>
                        </div>
                    </el-col>
                    <el-col :span="4">
                        <div class="stats-item">
                            <div class="label">待付款</div>
                            <div class="value">{{orderStats.unpaid}}</div>
                        </div>
                    </el-col>
                    <el-col :span="4">
                        <div class="stats-item">
                            <div class="label">待发货</div>
                            <div class="value">{{orderStats.unshipped}}</div>
                        </div>
                    </el-col>
                    <el-col :span="4">
                        <div class="stats-item">
                            <div class="label">已发货</div>
                            <div class="value">{{orderStats.shipped}}</div>
                        </div>
                    </el-col>
                    <el-col :span="4">
                        <div class="stats-item">
                            <div class="label">已完成</div>
                            <div class="value">{{orderStats.completed}}</div>
                        </div>
                    </el-col>
                    <el-col :span="4">
                        <div class="stats-item">
                            <div class="label">已取消</div>
                            <div class="value">{{orderStats.cancelled}}</div>
                        </div>
                    </el-col>
                </el-row>
            </el-card>

            <!-- 转化率统计 -->
            <el-card style="margin-top: 20px">
                <div slot="header">转化率统计</div>
                <el-row :gutter="20">
                    <el-col :span="6">
                        <div class="conversion-item">
                            <div class="label">访问量(PV)</div>
                            <div class="value">{{conversionData.pv}}</div>
                        </div>
                    </el-col>
                    <el-col :span="6">
                        <div class="conversion-item">
                            <div class="label">访客数(UV)</div>
                            <div class="value">{{conversionData.uv}}</div>
                        </div>
                    </el-col>
                    <el-col :span="6">
                        <div class="conversion-item">
                            <div class="label">下单数</div>
                            <div class="value">{{conversionData.orderCount}}</div>
                        </div>
                    </el-col>
                    <el-col :span="6">
                        <div class="conversion-item">
                            <div class="label">转化率</div>
                            <div class="value highlight">{{conversionData.conversionRate}}</div>
                        </div>
                    </el-col>
                </el-row>
            </el-card>

            <!-- 订单状态分布 -->
            <el-card style="margin-top: 20px">
                <div slot="header">订单状态分布</div>
                <div style="height: 400px" ref="statusChart"></div>
            </el-card>
        </div>
    `,
    methods: {
        // 加载订单统计数据
        async loadOrderStats() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/stats/orders', {
                    params: { range: this.dateRange }
                });
                if (res.data.code === 0) {
                    this.orderStats = res.data.data;
                    this.renderStatusChart();
                }
            } catch (error) {
                this.$message.error('加载订单统计失败');
            }
            this.loading = false;
        },

        // 加载转化率数据
        async loadConversionStats() {
            try {
                const res = await axios.get('/api/admin/stats/conversion', {
                    params: { range: this.dateRange }
                });
                if (res.data.code === 0) {
                    this.conversionData = res.data.data;
                }
            } catch (error) {
                this.$message.error('加载转化率统计失败');
            }
        },

        // 渲染状态分布图
        renderStatusChart() {
            const chart = echarts.init(this.$refs.statusChart);
            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: ['待付款', '待发货', '已发货', '已完成', '已取消']
                },
                series: [
                    {
                        type: 'pie',
                        radius: '50%',
                        center: ['50%', '50%'],
                        data: [
                            { value: this.orderStats.unpaid, name: '待付款' },
                            { value: this.orderStats.unshipped, name: '待发货' },
                            { value: this.orderStats.shipped, name: '已发货' },
                            { value: this.orderStats.completed, name: '已完成' },
                            { value: this.orderStats.cancelled, name: '已取消' }
                        ],
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
            chart.setOption(option);
        },

        // 日期范围变化
        handleDateRangeChange() {
            // this.loadOrderStats();
            // this.loadConversionStats();
            this.$message.info('静态数据演示，切换无效');
        }
    },
    mounted() {
        // this.loadOrderStats();
        // this.loadConversionStats();
        this.$nextTick(() => {
            this.renderStatusChart();
        });
    }
}; 