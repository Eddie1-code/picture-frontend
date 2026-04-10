<template>
  <div class="center-container">
  <a-form layout="horizontal" class="wide-form" :model="form">
    <a-form-item label="用 户 ID ">
      <div class="user-id-row">
        <a-input :value="displayUserId" disabled class="user-id-input" />
        <a-button :disabled="!displayUserId" @click="copyUserId">复制</a-button>
      </div>
    </a-form-item>
    <a-form-item label="用户账号">
      <a-input v-model:value="form.userAccount" disabled />
    </a-form-item>
    <a-form-item label="用户昵称">
      <a-input v-model:value="form.userName" />
    </a-form-item>
    <a-form-item label="用户密码">
      <a-input 
        v-model:value="form.userPassword" 
        :type="passwordVisible ? 'text' : 'password'" 
        placeholder="不修改请留空"
      >
        <template #suffix>
          <EyeInvisibleOutlined v-if="passwordVisible" @click="passwordVisible = false" />
          <EyeOutlined v-else @click="passwordVisible = true" />
        </template>
      </a-input>
    </a-form-item>
    <a-form-item label="个人简介">
      <a-textarea v-model:value="form.userProfile" :rows="4" />
    </a-form-item>
    <a-form-item label="头像上传">
      <a-upload :show-upload-list="false" :before-upload="beforeUpload" :custom-request="customRequest">
        <img v-if="form.userAvatar" :src="form.userAvatar" alt="avatar" style="width: 80px; border-radius: 50%;" />
        <div v-else>
          <PlusOutlined />
          <div style="margin-top: 8px">上传头像</div>
        </div>
      </a-upload>
    </a-form-item>
    <div class="btn-center">
    <a-button type="primary" @click="doUpdate">提交修改</a-button>
    </div>
  </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue'
import { getLoginUserUsingGet, updateMyProfileUsingPost, uploadAvatarUsingPost } from '@/api/userController'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts' // 导入登录用户状态管理

const form = ref({
  id: '',
  userAccount: '',
  userName: '',
  userPassword: '',
  userProfile: '',
  userAvatar: ''
})

const passwordVisible = ref(false)
const loginUserStore = useLoginUserStore() // 初始化登录用户状态管理
const displayUserId = ref('')

onMounted(async () => {
  const res = await getLoginUserUsingGet()
  if (res.data?.data) {
    Object.assign(form.value, res.data.data)
    displayUserId.value = String(res.data.data.id ?? '')
    form.value.userPassword = ''
  }
})

const doUpdate = async () => {
  try {
    const updateData = { ...form.value };
    const res = await updateMyProfileUsingPost(updateData);
    if (res.data?.code === 0) {
      message.success('修改成功');
      // 修改成功后重新获取用户信息，更新页面显示
      const userRes = await getLoginUserUsingGet();
      if (userRes.data?.code === 0 && userRes.data?.data) {
        Object.assign(form.value, userRes.data.data);
        displayUserId.value = String(userRes.data.data.id ?? '')
        form.value.userPassword = '';
        // 更新全局状态，同步右上角用户信息
        loginUserStore.setLoginUser(userRes.data.data);
      }
    } else {
      message.error('修改失败：' + (res.data?.message || '未知错误'));
    }
  } catch (error) {
    message.error('修改失败：' + (error instanceof Error ? error.message : '网络错误'));
  }
};

// 头像上传相关
const beforeUpload = (file: File) => {
  const isImg = file.type.startsWith('image/')
  if (!isImg) message.error('只能上传图片')
  return isImg
}
const customRequest = async ({ file, onSuccess }: any) => {
  try {
    const res = await uploadAvatarUsingPost({}, file)
    // 添加类型断言，修复类型错误
    const response = res as any
    if (response.data?.code === 0 && response.data?.data) {
      form.value.userAvatar = response.data.data
      onSuccess()
    } else {
      message.error('上传失败：' + (response.data?.message || '未知错误'))
    }
  } catch (error) {
    message.error('上传失败：' + (error instanceof Error ? error.message : '网络错误'))
  }
}

const copyUserId = async () => {
  if (!displayUserId.value) {
    return
  }
  try {
    await navigator.clipboard.writeText(displayUserId.value)
    message.success('用户ID已复制')
  } catch (error) {
    // 兼容非安全上下文，降级复制
    const textArea = document.createElement('textarea')
    textArea.value = displayUserId.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    message.success('用户ID已复制')
  }
}
</script>

<style scoped>
.center-container {
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.wide-form {
  width: 1000px;
  max-width: 100%;
  background: #fff;
  padding: 40px 48px;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0001;
}

.wide-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.user-id-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-id-input {
  width: 240px;
}

.btn-center {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
