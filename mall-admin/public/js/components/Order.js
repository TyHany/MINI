const Order = {
    data() {
        return {
            loading: false,
            orderList: [
                {
                    id: 1,
                    order_no: '202405201001',
                    total_amount: '299.00',
                    status: 1, // 待发货
                    pay_status: 1, // 已支付
                    receiver_name: '张三',
                    receiver_phone: '13800138000',
                    create_time: '2024-05-20 10:00:00',
                    receiver_address: '广东省深圳市南山区XX街道XX大厦101',
                    goods: [
                        { goods_id: 101, goods_name: '高性能无线鼠标', goods_image: '/images/logo.png', goods_price: '299.00', quantity: 1 }
                    ]
                },
                {
                    id: 2,
                    order_no: '202405201002',
                    total_amount: '1299.00',
                    status: 2, // 已发货
                    pay_status: 1,
                    receiver_name: '李四',
                    receiver_phone: '13900139000',
                    create_time: '2024-05-20 11:30:00',
                    receiver_address: '北京市朝阳区XX路XX号',
                    goods: [
                        { goods_id: 102, goods_name: '机械键盘', goods_image: '/images/logo.png', goods_price: '799.00', quantity: 1 },
                        { goods_id: 103, goods_name: '电竞鼠标垫', goods_image: '/images/logo.png', goods_price: '500.00', quantity: 1 }
                    ]
                },
                {
                    id: 3,
                    order_no: '202405191505',
                    total_amount: '88.00',
                    status: 0, // 待付款
                    pay_status: 0, // 未支付
                    receiver_name: '王五',
                    receiver_phone: '13700137000',
                    create_time: '2024-05-19 15:05:00',
                    receiver_address: '上海市浦东新区XX大道XX弄',
                    goods: [
                        { goods_id: 104, goods_name: 'Type-C 数据线', goods_image: '/images/logo.png', goods_price: '88.00', quantity: 1 }
                    ]
                },
                {
                    id: 4,
                    order_no: '202405180940',
                    total_amount: '3200.00',
                    status: 3, // 已完成
                    pay_status: 1,
                    receiver_name: '赵六',
                    receiver_phone: '13600136000',
                    create_time: '2024-05-18 09:40:00',
                    receiver_address: '浙江省杭州市西湖区XX路XX号',
                    goods: [
                        { goods_id: 105, goods_name: '27英寸4K显示器', goods_image: '/images/logo.png', goods_price: '3200.00', quantity: 1 }
                    ]
                }
            ],
            total: 4,
            queryParams: {
                page: 1,
                pageSize: 10,
                orderNo: '',
                status: '',
                startTime: '',
                endTime: ''
            },
            statusOptions: [
                { label: '待付款', value: 0 },
                { label: '待发货', value: 1 },
                { label: '已发货', value: 2 },
                { label: '已完成', value: 3 },
                { label: '已取消', value: 4 }
            ],
            detailDialogVisible: false,
            currentOrder: null,
            shipDialogVisible: false,
            shipForm: {
                orderId: null,
                trackingNo: '',
                trackingCompany: ''
            },
            shipRules: {
                trackingNo: [
                    { required: true, message: '请输入快递单号', trigger: 'blur' }
                ],
                trackingCompany: [
                    { required: true, message: '请输入快递公司', trigger: 'blur' }
                ]
            }
        }
    },
    template: `
        <div class="order">
            <!-- 搜索工具栏 -->
            <el-card class="search-toolbar">
                <el-form :inline="true" :model="queryParams">
                    <el-form-item label="订单编号">
                        <el-input 
                            v-model="queryParams.orderNo"
                            placeholder="请输入订单编号"
                            clearable
                            @keyup.enter.native="handleSearch">
                        </el-input>
                    </el-form-item>
                    <el-form-item label="订单状态">
                        <el-select 
                            v-model="queryParams.status"
                            placeholder="请选择订单状态"
                            clearable>
                            <el-option
                                v-for="item in statusOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="下单时间">
                        <el-date-picker
                            v-model="queryParams.startTime"
                            type="datetime"
                            placeholder="开始时间">
                        </el-date-picker>
                        <span class="date-separator">-</span>
                        <el-date-picker
                            v-model="queryParams.endTime"
                            type="datetime"
                            placeholder="结束时间">
                        </el-date-picker>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">查询</el-button>
                        <el-button @click="handleReset">重置</el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <!-- 数据表格 -->
            <el-card>
                <el-table
                    :data="orderList"
                    v-loading="loading"
                    border>
                    <el-table-column prop="order_no" label="订单编号" width="180"></el-table-column>
                    <el-table-column label="订单金额" width="120">
                        <template slot-scope="scope">
                            ¥ {{scope.row.total_amount}}
                        </template>
                    </el-table-column>
                    <el-table-column label="订单状态" width="100">
                        <template slot-scope="scope">
                            <el-tag :type="getStatusType(scope.row.status)">
                                {{getStatusText(scope.row.status)}}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="支付状态" width="100">
                        <template slot-scope="scope">
                            <el-tag :type="scope.row.pay_status === 1 ? 'success' : 'info'">
                                {{scope.row.pay_status === 1 ? '已支付' : '未支付'}}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="receiver_name" label="收货人" width="100"></el-table-column>
                    <el-table-column prop="receiver_phone" label="联系电话" width="120"></el-table-column>
                    <el-table-column prop="create_time" label="下单时间" width="180"></el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template slot-scope="scope">
                            <el-button 
                                size="mini"
                                @click="handleDetail(scope.row)">详情</el-button>
                            <el-button
                                v-if="scope.row.status === 1"
                                size="mini"
                                type="success"
                                @click="handleShip(scope.row)">发货</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div class="pagination-container">
                    <el-pagination
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                        :current-page="queryParams.page"
                        :page-sizes="[10, 20, 50, 100]"
                        :page-size="queryParams.pageSize"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="total">
                    </el-pagination>
                </div>
            </el-card>

            <!-- 订单详情对话框 -->
            <el-dialog
                title="订单详情"
                :visible.sync="detailDialogVisible"
                width="800px">
                <template v-if="currentOrder">
                    <el-descriptions title="基本信息" :column="2" border>
                        <el-descriptions-item label="订单编号">{{currentOrder.order_no}}</el-descriptions-item>
                        <el-descriptions-item label="下单时间">{{currentOrder.create_time}}</el-descriptions-item>
                        <el-descriptions-item label="订单状态">
                            <el-tag :type="getStatusType(currentOrder.status)">
                                {{getStatusText(currentOrder.status)}}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="支付状态">
                            <el-tag :type="currentOrder.pay_status === 1 ? 'success' : 'info'">
                                {{currentOrder.pay_status === 1 ? '已支付' : '未支付'}}
                            </el-tag>
                        </el-descriptions-item>
                    </el-descriptions>

                    <el-descriptions title="收货信息" :column="1" border style="margin-top: 20px">
                        <el-descriptions-item label="收货人">{{currentOrder.receiver_name}}</el-descriptions-item>
                        <el-descriptions-item label="联系电话">{{currentOrder.receiver_phone}}</el-descriptions-item>
                        <el-descriptions-item label="收货地址">{{currentOrder.receiver_address}}</el-descriptions-item>
                    </el-descriptions>

                    <div class="order-goods" style="margin-top: 20px">
                        <div class="title">商品信息</div>
                        <el-table :data="currentOrder.goods" border>
                            <el-table-column label="商品图片" width="100">
                                <template slot-scope="scope">
                                    <img :src="scope.row.goods_image" style="height: 50px;">
                                </template>
                            </el-table-column>
                            <el-table-column prop="goods_name" label="商品名称"></el-table-column>
                            <el-table-column label="单价" width="120">
                                <template slot-scope="scope">
                                    ¥ {{scope.row.goods_price}}
                                </template>
                            </el-table-column>
                            <el-table-column prop="quantity" label="数量" width="100"></el-table-column>
                            <el-table-column label="小计" width="120">
                                <template slot-scope="scope">
                                    ¥ {{scope.row.goods_price * scope.row.quantity}}
                                </template>
                            </el-table-column>
                        </el-table>
                        <div class="order-total">
                            订单总额：<span class="price">¥ {{currentOrder.total_amount}}</span>
                        </div>
                    </div>
                </template>
            </el-dialog>

            <!-- 发货对话框 -->
            <el-dialog
                title="订单发货"
                :visible.sync="shipDialogVisible"
                width="500px">
                <el-form 
                    :model="shipForm"
                    :rules="shipRules"
                    ref="shipForm"
                    label-width="100px">
                    <el-form-item label="快递公司" prop="trackingCompany">
                        <el-input v-model="shipForm.trackingCompany"></el-input>
                    </el-form-item>
                    <el-form-item label="快递单号" prop="trackingNo">
                        <el-input v-model="shipForm.trackingNo"></el-input>
                    </el-form-item>
                </el-form>
                <div slot="footer">
                    <el-button @click="shipDialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleShipSubmit">确 定</el-button>
                </div>
            </el-dialog>
        </div>
    `,
    methods: {
        // 加载订单列表
        async loadOrderList() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/order/list', {
                    params: this.queryParams
                });
                if (res.data.code === 0) {
                    this.orderList = res.data.data.list;
                    this.total = res.data.data.total;
                }
            } catch (error) {
                this.$message.error('加载订单列表失败');
            }
            this.loading = false;
        },

        // 搜索
        handleSearch() {
            this.queryParams.page = 1;
            this.loadOrderList();
        },

        // 重置搜索
        handleReset() {
            this.queryParams = {
                page: 1,
                pageSize: 10,
                orderNo: '',
                status: '',
                startTime: '',
                endTime: ''
            };
            this.loadOrderList();
        },

        // 查看订单详情
        async handleDetail(row) {
            try {
                const res = await axios.get('/api/admin/order/detail', {
                    params: { id: row.id }
                });
                if (res.data.code === 0) {
                    this.currentOrder = res.data.data;
                    this.detailDialogVisible = true;
                }
            } catch (error) {
                this.$message.error('加载订单详情失败');
            }
        },

        // 订单发货
        handleShip(row) {
            this.shipForm = {
                orderId: row.id,
                trackingNo: '',
                trackingCompany: ''
            };
            this.shipDialogVisible = true;
        },

        // 提交发货
        handleShipSubmit() {
            this.$refs.shipForm.validate(async valid => {
                if (valid) {
                    try {
                        const res = await axios.post('/api/admin/order/ship', this.shipForm);
                        if (res.data.code === 0) {
                            this.$message.success('发货成功');
                            this.shipDialogVisible = false;
                            this.loadOrderList();
                        } else {
                            this.$message.error(res.data.message);
                        }
                    } catch (error) {
                        this.$message.error('发货失败');
                    }
                }
            });
        },

        // 分页大小变化
        handleSizeChange(val) {
            this.queryParams.pageSize = val;
            this.loadOrderList();
        },

        // 当前页变化
        handleCurrentChange(val) {
            this.queryParams.page = val;
            this.loadOrderList();
        },

        // 获取状态文本
        getStatusText(status) {
            const item = this.statusOptions.find(item => item.value === status);
            return item ? item.label : '';
        },

        // 获取状态类型
        getStatusType(status) {
            switch(status) {
                case 0: return 'warning';   // 待付款
                case 1: return 'primary';   // 待发货
                case 2: return 'success';   // 已发货
                case 3: return '';          // 已完成
                case 4: return 'info';      // 已取消
                default: return '';
            }
        }
    },
    mounted() {
        // this.loadOrderList();
    }
}; 