const Banner = {
    data() {
        return {
            loading: false,
            bannerList: [],
            dialogVisible: false,
            dialogTitle: '',
            form: {
                id: null,
                image_url: '',
                link_url: '',
                sort: 0,
                status: 1
            },
            rules: {
                image_url: [
                    { required: true, message: '请上传图片', trigger: 'blur' }
                ]
            },
            uploadUrl: '/api/admin/banner/upload-image',
            imageUrl: ''
        }
    },
    template: `
        <div class="banner">
            <!-- 工具栏 -->
            <div class="toolbar">
                <el-button type="primary" @click="handleAdd">
                    <i class="el-icon-plus"></i> 新增轮播图
                </el-button>
            </div>

            <!-- 数据表格 -->
            <el-table
                :data="bannerList"
                v-loading="loading"
                border
                style="width: 100%; margin-top: 20px;">
                <el-table-column
                    prop="id"
                    label="ID"
                    width="80">
                </el-table-column>
                <el-table-column
                    label="图片"
                    width="200">
                    <template slot-scope="scope">
                        <img :src="scope.row.image_url" style="height: 50px;">
                    </template>
                </el-table-column>
                <el-table-column
                    prop="link_url"
                    label="跳转链接">
                </el-table-column>
                <el-table-column
                    prop="sort"
                    label="排序"
                    width="100">
                </el-table-column>
                <el-table-column
                    label="状态"
                    width="100">
                    <template slot-scope="scope">
                        <el-switch
                            v-model="scope.row.status"
                            :active-value="1"
                            :inactive-value="0"
                            @change="handleStatusChange(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column
                    label="操作"
                    width="200">
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
                    <el-form-item label="轮播图" prop="image_url">
                        <el-upload
                            class="banner-uploader"
                            :action="uploadUrl"
                            :show-file-list="false"
                            :on-success="handleUploadSuccess"
                            :before-upload="beforeUpload">
                            <img v-if="form.image_url" :src="form.image_url" class="banner-image">
                            <i v-else class="el-icon-plus banner-uploader-icon"></i>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="跳转链接">
                        <el-input v-model="form.link_url"></el-input>
                    </el-form-item>
                    <el-form-item label="排序">
                        <el-input-number v-model="form.sort" :min="0"></el-input-number>
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-switch
                            v-model="form.status"
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
        // 加载轮播图列表
        async loadBannerList() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/banner/list');
                if (res.data.code === 0) {
                    this.bannerList = res.data.data;
                }
            } catch (error) {
                this.$message.error('加载轮播图列表失败');
            }
            this.loading = false;
        },

        // 新增轮播图
        handleAdd() {
            this.dialogTitle = '新增轮播图';
            this.form = {
                id: null,
                image_url: '',
                link_url: '',
                sort: 0,
                status: 1
            };
            this.dialogVisible = true;
        },

        // 编辑轮播图
        handleEdit(row) {
            this.dialogTitle = '编辑轮播图';
            this.form = {...row};
            this.dialogVisible = true;
        },

        // 删除轮播图
        handleDelete(row) {
            this.$confirm('确认删除该轮播图?', '提示', {
                type: 'warning'
            }).then(async () => {
                try {
                    const res = await axios.post('/api/admin/banner/delete', {
                        id: row.id
                    });
                    if (res.data.code === 0) {
                        this.$message.success('删除成功');
                        this.loadBannerList();
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
                const res = await axios.post('/api/admin/banner/status', {
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

        // 提交表单
        handleSubmit() {
            this.$refs.form.validate(async valid => {
                if (valid) {
                    try {
                        const url = this.form.id ? 
                            '/api/admin/banner/update' : 
                            '/api/admin/banner/add';
                        const res = await axios.post(url, this.form);
                        if (res.data.code === 0) {
                            this.$message.success('保存成功');
                            this.dialogVisible = false;
                            this.loadBannerList();
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
        this.loadBannerList();
    }
}; 