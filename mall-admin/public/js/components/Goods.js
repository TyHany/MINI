const Goods = {
    data() {
        return {
            loading: false,
            goodsList: [],
            categoryList: [],
            total: 0,
            queryParams: {
                page: 1,
                pageSize: 10,
                name: '',
                categoryId: ''
            },
            dialogVisible: false,
            dialogTitle: '',
            form: {
                id: null,
                category_id: '',
                name: '',
                price: 0,
                stock: 0,
                image_url: '',
                detail: '',
                status: 1,
                is_recommend: 0
            },
            rules: {
                category_id: [
                    { required: true, message: '请选择商品分类', trigger: 'change' }
                ],
                name: [
                    { required: true, message: '请输入商品名称', trigger: 'blur' }
                ],
                price: [
                    { required: true, message: '请输入商品价格', trigger: 'blur' }
                ],
                stock: [
                    { required: true, message: '请输入商品库存', trigger: 'blur' }
                ],
                image_url: [
                    { required: true, message: '请上传商品主图', trigger: 'blur' }
                ],
                detail: [
                    { required: true, message: '请输入商品详情', trigger: 'blur' }
                ]
            },
            uploadUrl: '/api/admin/goods/upload-image',
            multipleSelection: [],
            editor: null
        }
    },
    template: `
        <div class="goods">
            <!-- 搜索工具栏 -->
            <el-card class="search-toolbar">
                <el-form :inline="true" :model="queryParams">
                    <el-form-item label="商品名称">
                        <el-input 
                            v-model="queryParams.name"
                            placeholder="请输入商品名称"
                            clearable
                            @keyup.enter.native="handleSearch">
                        </el-input>
                    </el-form-item>
                    <el-form-item label="商品分类">
                        <el-select 
                            v-model="queryParams.categoryId"
                            placeholder="请选择商品分类"
                            clearable>
                            <el-option
                                v-for="item in categoryList"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">查询</el-button>
                        <el-button @click="handleReset">重置</el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <!-- 操作工具栏 -->
            <el-card class="operation-toolbar">
                <el-button type="primary" @click="handleAdd">
                    <i class="el-icon-plus"></i> 新增商品
                </el-button>
                <el-button 
                    type="success" 
                    :disabled="multipleSelection.length === 0"
                    @click="handleBatchStatus(1)">
                    批量上架
                </el-button>
                <el-button 
                    type="warning"
                    :disabled="multipleSelection.length === 0"
                    @click="handleBatchStatus(0)">
                    批量下架
                </el-button>
            </el-card>

            <!-- 数据表格 -->
            <el-card>
                <el-table
                    :data="goodsList"
                    v-loading="loading"
                    @selection-change="handleSelectionChange"
                    border>
                    <el-table-column type="selection" width="55"></el-table-column>
                    <el-table-column prop="id" label="ID" width="80"></el-table-column>
                    <el-table-column label="商品图片" width="120">
                        <template slot-scope="scope">
                            <img :src="scope.row.image_url" style="height: 50px;">
                        </template>
                    </el-table-column>
                    <el-table-column prop="name" label="商品名称"></el-table-column>
                    <el-table-column prop="category_name" label="商品分类"></el-table-column>
                    <el-table-column prop="price" label="价格" width="100">
                        <template slot-scope="scope">
                            ¥ {{scope.row.price}}
                        </template>
                    </el-table-column>
                    <el-table-column prop="stock" label="库存" width="100"></el-table-column>
                    <el-table-column label="状态" width="100">
                        <template slot-scope="scope">
                            <el-switch
                                v-model="scope.row.status"
                                :active-value="1"
                                :inactive-value="0"
                                @change="handleStatusChange(scope.row)">
                            </el-switch>
                        </template>
                    </el-table-column>
                    <el-table-column label="推荐" width="100">
                        <template slot-scope="scope">
                            <el-switch
                                v-model="scope.row.is_recommend"
                                :active-value="1"
                                :inactive-value="0"
                                @change="handleRecommendChange(scope.row)">
                            </el-switch>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200">
                        <template slot-scope="scope">
                            <el-button 
                                size="mini"
                                @click="handleEdit(scope.row)">编辑</el-button>
                            <el-button
                                size="mini"
                                type="danger"
                                @click="handleDelete(scope.row)">删除</el-button>
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

            <!-- 编辑对话框 -->
            <el-dialog
                :title="dialogTitle"
                :visible.sync="dialogVisible"
                width="800px"
                :close-on-click-modal="false"
                :append-to-body="true">
                <el-form 
                    :model="form" 
                    :rules="rules" 
                    ref="form" 
                    label-width="100px">
                    <el-form-item label="商品分类" prop="category_id">
                        <el-select v-model="form.category_id" placeholder="请选择商品分类">
                            <el-option
                                v-for="item in categoryList"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="商品名称" prop="name">
                        <el-input v-model="form.name"></el-input>
                    </el-form-item>
                    <el-form-item label="商品价格" prop="price">
                        <el-input-number 
                            v-model="form.price"
                            :precision="2"
                            :step="0.1"
                            :min="0">
                        </el-input-number>
                    </el-form-item>
                    <el-form-item label="商品库存" prop="stock">
                        <el-input-number 
                            v-model="form.stock"
                            :min="0">
                        </el-input-number>
                    </el-form-item>
                    <el-form-item label="商品主图" prop="image_url">
                        <el-upload
                            class="goods-uploader"
                            :action="uploadUrl"
                            :show-file-list="false"
                            :on-success="handleUploadSuccess"
                            :before-upload="beforeUpload">
                            <img v-if="form.image_url" :src="form.image_url" class="goods-image">
                            <i v-else class="el-icon-plus goods-uploader-icon"></i>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="商品详情" prop="detail">
                        <div id="editor-container"></div>
                    </el-form-item>
                    <el-form-item label="上架状态">
                        <el-switch
                            v-model="form.status"
                            :active-value="1"
                            :inactive-value="0">
                        </el-switch>
                    </el-form-item>
                    <el-form-item label="推荐商品">
                        <el-switch
                            v-model="form.is_recommend"
                            :active-value="1"
                            :inactive-value="0">
                        </el-switch>
                    </el-form-item>
                </el-form>
                <div slot="footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                </div>
            </el-dialog>
        </div>
    `,
    methods: {
        // 加载商品列表
        async loadGoodsList() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/goods/list', {
                    params: this.queryParams
                });
                if (res.data.code === 0) {
                    this.goodsList = res.data.data.list;
                    this.total = res.data.data.total;
                }
            } catch (error) {
                this.$message.error('加载商品列表失败');
            }
            this.loading = false;
        },

        // 加载分类列表
        async loadCategoryList() {
            try {
                const res = await axios.get('/api/admin/category/list');
                if (res.data.code === 0) {
                    this.categoryList = res.data.data;
                }
            } catch (error) {
                this.$message.error('加载分类列表失败');
            }
        },

        // 搜索
        handleSearch() {
            this.queryParams.page = 1;
            this.loadGoodsList();
        },

        // 重置搜索
        handleReset() {
            this.queryParams = {
                page: 1,
                pageSize: 10,
                name: '',
                categoryId: ''
            };
            this.loadGoodsList();
        },

        // 新增商品
        handleAdd() {
            this.dialogTitle = '新增商品';
            this.form = {
                id: null,
                category_id: '',
                name: '',
                price: 0,
                stock: 0,
                image_url: '',
                detail: '',
                status: 1,
                is_recommend: 0
            };
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.initEditor();
            });
        },

        // 编辑商品
        handleEdit(row) {
            this.dialogTitle = '编辑商品';
            this.form = {...row};
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.initEditor();
            });
        },

        // 删除商品
        handleDelete(row) {
            this.$confirm('确认删除该商品?', '提示', {
                type: 'warning'
            }).then(async () => {
                try {
                    const res = await axios.post('/api/admin/goods/delete', {
                        id: row.id
                    });
                    if (res.data.code === 0) {
                        this.$message.success('删除成功');
                        this.loadGoodsList();
                    } else {
                        this.$message.error(res.data.message);
                    }
                } catch (error) {
                    this.$message.error('删除失败');
                }
            }).catch(() => {});
        },

        // 修改状态
        async handleStatusChange(row) {
            try {
                const res = await axios.post('/api/admin/goods/status', {
                    id: row.id,
                    status: row.status
                });
                if (res.data.code === 0) {
                    this.$message.success('修改成功');
                } else {
                    this.$message.error(res.data.message);
                }
            } catch (error) {
                this.$message.error('修改失败');
            }
        },

        // 批量修改状态
        async handleBatchStatus(status) {
            const ids = this.multipleSelection.map(item => item.id);
            try {
                const res = await axios.post('/api/admin/goods/batch-status', {
                    ids,
                    status
                });
                if (res.data.code === 0) {
                    this.$message.success('操作成功');
                    this.loadGoodsList();
                } else {
                    this.$message.error(res.data.message);
                }
            } catch (error) {
                this.$message.error('操作失败');
            }
        },

        // 提交表单
        handleSubmit() {
            this.$refs.form.validate(async valid => {
                if (valid) {
                    try {
                        const url = this.form.id ? 
                            '/api/admin/goods/update' : 
                            '/api/admin/goods/add';
                        const res = await axios.post(url, this.form);
                        if (res.data.code === 0) {
                            this.$message.success('保存成功');
                            this.dialogVisible = false;
                            this.loadGoodsList();
                        } else {
                            this.$message.error(res.data.message);
                        }
                    } catch (error) {
                        this.$message.error('保存失败');
                    }
                }
            });
        },

        // 表格选择项变化
        handleSelectionChange(val) {
            this.multipleSelection = val;
        },

        // 分页大小变化
        handleSizeChange(val) {
            this.queryParams.pageSize = val;
            this.loadGoodsList();
        },

        // 当前页变化
        handleCurrentChange(val) {
            this.queryParams.page = val;
            this.loadGoodsList();
        },

        // 上传图片前的处理
        beforeUpload(file) {
            const isImage = file.type.startsWith('image/');
            const isLt2M = file.size / 1024 / 1024 < 2;

            if (!isImage) {
                this.$message.error('只能上传图片文件!');
                return false;
            }
            if (!isLt2M) {
                this.$message.error('图片大小不能超过 2MB!');
                return false;
            }
            return true;
        },

        // 图片上传成功的处理
        handleUploadSuccess(res) {
            if (res.code === 0) {
                this.form.image_url = res.data.url;
            } else {
                this.$message.error('上传失败');
            }
        },

        // 初始化编辑器
        initEditor() {
            const E = window.wangEditor;
            const editor = new E('#editor-container');

            // 配置编辑器
            editor.config.height = 450;
            editor.config.placeholder = '请输入商品详情';
            editor.config.zIndex = 100;

            // 自定义字号
            editor.config.fontSizes = {
                'x-small': { name: '12px', value: '1' },
                'small': { name: '14px', value: '2' },
                'normal': { name: '16px', value: '3' },
                'large': { name: '18px', value: '4' },
                'x-large': { name: '20px', value: '5' },
                'xx-large': { name: '24px', value: '6' },
                'xxx-large': { name: '32px', value: '7' }
            };

            // 自定义颜色
            editor.config.colors = [
                '#000000', '#666666', '#999999', '#CCCCCC',
                '#61a951', '#16baaa', '#4395ff', '#8044f9',
                '#ff2c54', '#ff6927', '#ffb700', '#90b44b'
            ];

            // 设置编辑区域的z-index
            editor.config.zIndexFullScreen = 10000;

            // 设置编辑器样式
            editor.config.emotions = [];  // 禁用表情
            editor.config.showFullScreen = true;  // 显示全屏按钮

            // 配置图片上传
            editor.config.uploadImgMaxSize = 2 * 1024 * 1024; // 2MB
            editor.config.uploadImgAccept = ['jpg', 'jpeg', 'png', 'gif'];
            editor.config.uploadImgMaxLength = 5; // 一次最多上传5张
            editor.config.showLinkImg = false; // 隐藏插入网络图片

            // 配置工具栏
            editor.config.menus = [
                'head',  // 标题
                'bold',  // 粗体
                'fontSize',  // 字号
                'italic',  // 斜体
                'underline',  // 下划线
                'strikeThrough',  // 删除线
                'foreColor',  // 文字颜色
                'backColor',  // 背景颜色
                '|',  // 分割线
                'justify',  // 对齐方式
                'list',  // 列表
                '|',  // 分割线
                'image',  // 图片
                'undo',  // 撤销
                'redo'  // 重做
            ];

            // 配置图片上传
            editor.config.uploadImgServer = '/api/admin/goods/upload-image';
            editor.config.uploadFileName = 'file';
            editor.config.uploadImgHooks = {
                customInsert: (insertImg, result) => {
                    if (result.code === 0) {
                        insertImg(result.data.url);
                    } else {
                        this.$message.error('上传失败');
                    }
                }
            };

            // 创建编辑器
            editor.create();

            // 设置内容
            editor.txt.html(this.form.detail);

            // 监听内容变化
            editor.config.onchange = (html) => {
                this.form.detail = html;
            };

            this.editor = editor;
        },

        // 销毁编辑器
        destroyEditor() {
            if (this.editor) {
                this.editor.destroy();
                this.editor = null;
            }
        },

        // 对话框关闭前
        handleDialogClose() {
            this.destroyEditor();
        },

        // 修改推荐状态
        async handleRecommendChange(row) {
            try {
                const res = await axios.post('/api/admin/goods/recommend', {
                    id: row.id,
                    is_recommend: row.is_recommend
                });
                if (res.data.code === 0) {
                    this.$message.success('修改成功');
                } else {
                    this.$message.error(res.data.message);
                }
            } catch (error) {
                this.$message.error('修改失败');
            }
        }
    },
    mounted() {
        this.loadCategoryList();
        this.loadGoodsList();
    },
    watch: {
        dialogVisible(val) {
            if (!val) {
                this.destroyEditor();
            }
        }
    }
}; 