<template>
  <div class="goods-list">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="请输入商品名称"
        style="width: 200px"
      />
      <el-select v-model="searchForm.categoryId" placeholder="请选择分类">
        <el-option label="全部" :value="null" />
        <el-option
          v-for="item in categories"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button type="success" @click="handleAdd">添加商品</el-button>
    </div>

    <!-- 商品列表 -->
    <el-table :data="tableData" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column label="商品图片" width="100">
        <template #default="scope">
          <el-image
            style="width: 50px; height: 50px"
            :src="scope.row.image_url"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="100" />
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status ? 'success' : 'info'">
            {{ scope.row.status ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="推荐" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_recommend ? 'warning' : 'info'">
            {{ scope.row.is_recommend ? '推荐' : '普通' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        @current-change="loadData"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="商品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select v-model="form.categoryId">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品价格">
          <el-input-number v-model="form.price" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="商品库存">
          <el-input-number v-model="form.stock" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload
            class="avatar-uploader"
            :action="`${baseUrl}/api/upload`"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
          >
            <img v-if="form.imageUrl" :src="form.imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="商品状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="是否推荐">
          <el-switch
            v-model="form.isRecommend"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="商品详情">
          <el-input
            v-model="form.detail"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { request } from '@/utils/request';

const baseUrl = import.meta.env.VITE_API_URL;

// 数据
const tableData = ref([]);
const categories = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

// 搜索表单
const searchForm = ref({
  keyword: '',
  categoryId: null
});

// 编辑表单
const dialogVisible = ref(false);
const dialogTitle = ref('添加商品');
const form = ref({
  id: null,
  name: '',
  categoryId: '',
  price: 0,
  stock: 0,
  imageUrl: '',
  detail: '',
  status: 1,
  isRecommend: 0
});

// 加载数据
const loadData = async () => {
  try {
    const res = await request.get('/goods/list', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        ...searchForm.value
      }
    });
    if (res.code === 0) {
      tableData.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    console.error('加载商品列表失败:', error);
  }
};

// 加载分类
const loadCategories = async () => {
  try {
    const res = await request.get('/category/list');
    if (res.code === 0) {
      categories.value = res.data;
    }
  } catch (error) {
    console.error('加载分类列表失败:', error);
  }
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    keyword: '',
    categoryId: null
  };
  loadData();
};

// 处理添加
const handleAdd = () => {
  form.value = {
    id: null,
    name: '',
    categoryId: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    detail: '',
    status: 1,
    isRecommend: 0
  };
  dialogTitle.value = '添加商品';
  dialogVisible.value = true;
};

// 处理编辑
const handleEdit = (row) => {
  form.value = {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    detail: row.detail,
    status: row.status,
    isRecommend: row.is_recommend
  };
  dialogTitle.value = '编辑商品';
  dialogVisible.value = true;
};

// 处理删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.post('/goods/delete', { id: row.id });
      if (res.code === 0) {
        ElMessage.success('删除成功');
        loadData();
      }
    } catch (error) {
      console.error('删除商品失败:', error);
    }
  });
};

// 处理提交
const handleSubmit = async () => {
  try {
    const url = form.value.id ? `/goods/update/${form.value.id}` : '/goods/add';
    const res = await request.post(url, form.value);
    if (res.code === 0) {
      ElMessage.success(form.value.id ? '更新成功' : '添加成功');
      dialogVisible.value = false;
      loadData();
    }
  } catch (error) {
    console.error('提交商品失败:', error);
  }
};

// 处理上传成功
const handleUploadSuccess = (res) => {
  if (res.code === 0) {
    form.value.imageUrl = res.data.url;
  }
};

onMounted(() => {
  loadData();
  loadCategories();
});
</script>

<style scoped>
.goods-list {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar > * {
  margin-right: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.avatar-uploader {
  width: 178px;
  height: 178px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style> 