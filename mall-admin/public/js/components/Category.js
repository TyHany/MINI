const Category = {
    data() {
        return {
            loading: false,
            categoryList: [],
            dialogVisible: false,
            dialogTitle: '',
            form: {
                id: null,
                name: '',
                image_url: '',
                sort: 0
            },
            rules: {
                name: [
                    { required: true, message: '请输入分类名称', trigger: 'blur' }
                ],
                image_url: [
                    { required: true, message: '请上传分类图片', trigger: 'blur' }
                ]
            },
            uploadUrl: '/api/admin/category/upload-image'
        }
    },
    template: `
        <div class="category">
            <!-- 工具栏 -->
            <div class="toolbar">
                <el-button type="primary" @click="handleAdd">
                    <i class="el-icon-plus"></i> 新增分类
                </el-button>
            </div>

            <!-- 数据表格 -->
            <el-table
                :data="categoryList"
                border
                style="width: 100%"
                v-loading="loading">
                <el-table-column
                    prop="id"
                    width="60"
                    label="ID">
                </el-table-column>
                <el-table-column
                    prop="name"
                    label="分类名称"
                    min-width="130">
                </el-table-column>
                <el-table-column
                    label="分类图片"
                    min-width="60">
                    <template slot-scope="scope">
                        <img :src="scope.row.image_url" style="height: 50px;">
                    </template>
                </el-table-column>
                <el-table-column
                    prop="sort"
                    label="排序"
                    min-width="180"
                    sortable>
                    <template slot-scope="scope">
                        <el-input-number 
                            v-model="scope.row.sort" 
                            :min="0" 
                            :max="999"
                            size="small"
                            controls-position="right"
                            @change="handleSortChange(scope.row)">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column
                    label="操作"
                    width="150"
                    fixed="right">
                    <template slot-scope="scope">
                        <el-button
                            size="small"
                            type="primary"
                            @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button
                            size="small"
                            type="danger"
                            @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 编辑对话框 -->
            <el-dialog
                :title="dialogTitle"
                :visible.sync="dialogVisible"
                width="500px">
                <el-form 
                    :model="form" 
                    :rules="rules" 
                    ref="form" 
                    label-width="100px">
                    <el-form-item label="分类名称" prop="name">
                        <el-input v-model="form.name"></el-input>
                    </el-form-item>
                    <el-form-item label="分类图片" prop="image_url">
                        <el-upload
                            class="category-uploader"
                            :action="uploadUrl"
                            :show-file-list="false"
                            :on-success="handleUploadSuccess"
                            :before-upload="beforeUpload">
                            <img v-if="form.image_url" :src="form.image_url" class="category-image">
                            <i v-else class="el-icon-plus category-uploader-icon"></i>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="排序">
                        <el-input-number v-model="form.sort" :min="0"></el-input-number>
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
        // 加载分类列表
        async loadCategoryList() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/category/list');
                if (res.data.code === 0) {
                    this.categoryList = res.data.data;
                }
            } catch (error) {
                this.$message.error('加载分类列表失败');
            }
            this.loading = false;
        },

        // 新增分类
        handleAdd() {
            this.dialogTitle = '新增分类';
            this.form = {
                id: null,
                name: '',
                image_url: '',
                sort: 0
            };
            this.dialogVisible = true;
        },

        // 编辑分类
        handleEdit(row) {
            this.dialogTitle = '编辑分类';
            this.form = {...row};
            this.dialogVisible = true;
        },

        // 删除分类
        handleDelete(row) {
            this.$confirm('确认删除该分类?', '提示', {
                type: 'warning'
            }).then(async () => {
                try {
                    const res = await axios.post('/api/admin/category/delete', {
                        id: row.id
                    });
                    if (res.data.code === 0) {
                        this.$message.success('删除成功');
                        this.loadCategoryList();
                    } else {
                        this.$message.error(res.data.message);
                    }
                } catch (error) {
                    this.$message.error('删除失败');
                }
            }).catch(() => {});
        },

        // 修改排序
        async handleSortChange(row) {
            try {
                const res = await axios.post('/api/admin/category/sort', {
                    id: row.id,
                    sort: row.sort
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

        // 提交表单
        handleSubmit() {
            this.$refs.form.validate(async valid => {
                if (valid) {
                    try {
                        const url = this.form.id ? 
                            '/api/admin/category/update' : 
                            '/api/admin/category/add';
                        const res = await axios.post(url, this.form);
                        if (res.data.code === 0) {
                            this.$message.success('保存成功');
                            this.dialogVisible = false;
                            this.loadCategoryList();
                        } else {
                            this.$message.error(res.data.message);
                        }
                    } catch (error) {
                        this.$message.error('保存失败');
                    }
                }
            });
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
        }
    },
    mounted() {
        this.loadCategoryList();
    }
}; 