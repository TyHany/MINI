const SalesStats = {
    data() {
        return {
            loading: false,
            salesData: {
                today: 1250.80,
                week: 8765.40,
                month: 35420.50
            },
            salesTrend: [
                { date: '2024-05-14', amount: 1100 },
                { date: '2024-05-15', amount: 1300 },
                { date: '2024-05-16', amount: 950 },
                { date: '2024-05-17', amount: 1800 },
                { date: '2024-05-18', amount: 2200 },
                { date: '2024-05-19', amount: 2500 },
                { date: '2024-05-20', amount: 1250.80 }
            ],
            hotGoods: [
                { name: '华为 Mate 60 Pro', sales: 98, price: 6999, image_url: '/images/logo.png' },
                { name: '小米 14 Ultra', sales: 85, price: 6499, image_url: '/images/logo.png' },
                { name: 'iPhone 15 Pro Max', sales: 77, price: 9999, image_url: '/images/logo.png' },
                { name: 'OPPO Find X7', sales: 63, price: 4999, image_url: '/images/logo.png' },
                { name: 'Vivo X100', sales: 51, price: 3999, image_url: '/images/logo.png' },
                { name: 'Redmi K70 Pro', sales: 45, price: 3299, image_url: '/images/logo.png' },
                { name: 'OnePlus 12', sales: 42, price: 4299, image_url: '/images/logo.png' },
                { name: 'Samsung Galaxy S24 Ultra', sales: 38, price: 10199, image_url: '/images/logo.png' },
                { name: '荣耀 Magic 6', sales: 35, price: 4399, image_url: '/images/logo.png' },
                { name: 'iQOO 12 Pro', sales: 31, price: 4999, image_url: '/images/logo.png' }
            ],
            dateRange: 'week',
            dateOptions: [
                { label: '最近7天', value: 'week' },
                { label: '最近30天', value: 'month' },
                { label: '最近90天', value: 'quarter' }
            ]
        }
    },
    template: `
        <div class="sales-stats">
            <!-- 销售概览 -->
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div slot="header">今日销售额</div>
                        <div class="stats-card">
                            <div class="amount">¥ {{salesData.today}}</div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div slot="header">本周销售额</div>
                        <div class="stats-card">
                            <div class="amount">¥ {{salesData.week}}</div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <el-card shadow="hover">
                        <div slot="header">本月销售额</div>
                        <div class="stats-card">
                            <div class="amount">¥ {{salesData.month}}</div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <!-- 销售趋势图 -->
            <el-card style="margin-top: 20px">
                <div slot="header" class="clearfix">
                    <span>销售趋势</span>
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
                <div style="height: 400px" ref="trendChart"></div>
            </el-card>

            <!-- 热销商品 -->
            <el-card style="margin-top: 20px">
                <div slot="header">热销商品TOP10</div>
                <el-table
                    :data="hotGoods"
                    v-loading="loading"
                    border
                    style="width: 100%">
                    <el-table-column type="index" label="排名" width="80"></el-table-column>
                    <el-table-column label="商品图片" width="120">
                        <template slot-scope="scope">
                            <img :src="scope.row.image_url" style="height: 50px;">
                        </template>
                    </el-table-column>
                    <el-table-column prop="name" label="商品名称"></el-table-column>
                    <el-table-column prop="price" label="单价" width="120">
                        <template slot-scope="scope">
                            ¥ {{scope.row.price}}
                        </template>
                    </el-table-column>
                    <el-table-column prop="sales" label="销量" width="120"></el-table-column>
                    <el-table-column label="销售额" width="120">
                        <template slot-scope="scope">
                            ¥ {{scope.row.price * scope.row.sales}}
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>
        </div>
    `,
    methods: {
        // 渲染趋势图
        renderTrendChart() {
            const chart = echarts.init(this.$refs.trendChart);
            const option = {
                tooltip: {
                    trigger: 'axis'
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: this.salesTrend.map(item => item.date)
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        name: '销售额',
                        type: 'line',
                        smooth: true,
                        data: this.salesTrend.map(item => item.amount),
                        areaStyle: {
                            opacity: 0.1
                        }
                    }
                ]
            };
            chart.setOption(option);
        },

        // 日期范围变化
        handleDateRangeChange() {
            this.$message.info('静态数据演示，切换无效');
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.renderTrendChart();
        });
    }
}; 