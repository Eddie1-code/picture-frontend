<template>
  <a-modal
    class="image-out-painting"
    v-model:visible="visible"
    title="AI 扩图"
    :footer="false"
    @cancel="closeModal"
  >
    <a-row gutter="16">
      <a-col span="12">
        <h4>原始图片</h4>
        <img :src="picture?.url" :alt="picture?.name" style="max-width: 100%" />
      </a-col>
      <a-col span="12">
        <h4>扩图结果</h4>
        <img
          v-if="resultImageUrl"
          :src="resultImageUrl"
          :alt="picture?.name"
          style="max-width: 100%"
        />
      </a-col>
    </a-row>
    <div style="margin: 16px 0">
      <h4>扩图预设</h4>
      <a-radio-group v-model:value="presetOption" @change="applyPreset">
        <a-radio-button value="custom">自定义</a-radio-button>
        <a-radio-button value="square">方形扩展</a-radio-button>
        <a-radio-button value="widescreen">宽屏扩展</a-radio-button>
        <a-radio-button value="portrait">竖屏扩展</a-radio-button>
      </a-radio-group>
    </div>
    <div style="margin: 16px 0">
      <h4>扩图参数</h4>
      <a-grid :cols="2" :colGap="16" :rowGap="16">
        <a-form-item label="上方扩展(像素)">
          <a-input-number v-model:value="outPaintingParams.topOffset" :min="0" :max="1000" />
        </a-form-item>
        <a-form-item label="下方扩展(像素)">
          <a-input-number v-model:value="outPaintingParams.bottomOffset" :min="0" :max="1000" />
        </a-form-item>
        <a-form-item label="左侧扩展(像素)">
          <a-input-number v-model:value="outPaintingParams.leftOffset" :min="0" :max="1000" />
        </a-form-item>
        <a-form-item label="右侧扩展(像素)">
          <a-input-number v-model:value="outPaintingParams.rightOffset" :min="0" :max="1000" />
        </a-form-item>
        <a-form-item label="水平扩展比例">
          <a-input-number v-model:value="outPaintingParams.xScale" :min="1.0" :max="3.0" :step="0.1" />
        </a-form-item>
        <a-form-item label="垂直扩展比例">
          <a-input-number v-model:value="outPaintingParams.yScale" :min="1.0" :max="3.0" :step="0.1" />
        </a-form-item>
      </a-grid>
    </div>
    <a-flex gap="16" justify="center">
      <a-button type="primary" :loading="loading" ghost @click="createTask"> 生成图片</a-button>
      <a-button type="primary" v-if="resultImageUrl" :loading="uploadLoading" @click="handleUpload">
        应用结果
      </a-button>
    </a-flex>
    <div v-if="loading" class="outpaint-progress">
      <a-progress :percent="outPaintingPercent" status="active" />
      <p class="outpaint-progress-hint">扩图任务处理中，请稍候…</p>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { createPictureOutPaintingTaskUsingPost, getPictureOutPaintingTaskUsingGet } from '@/api/pictureController.ts'

interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const visible = ref(false)
const loading = ref(false)
const uploadLoading = ref(false)
const taskId = ref('')
const resultImageUrl = ref('')
const pollingInterval = ref<number | null>(null)
const pollingCount = ref(0)
const MAX_POLLING_COUNT = 120 // 10分钟，每5秒轮询一次
const presetOption = ref('custom')
/** 轮询扩图任务时的进度（0–100，近似） */
const outPaintingPercent = ref(0)

// 扩图参数
const outPaintingParams = ref({
  topOffset: 100,
  bottomOffset: 100,
  leftOffset: 100,
  rightOffset: 100,
  xScale: 1.5,
  yScale: 1.5
})

// 应用预设
const applyPreset = (e: any) => {
  const value = e.target.value
  switch (value) {
    case 'square':
      outPaintingParams.value = {
        topOffset: 100,
        bottomOffset: 100,
        leftOffset: 100,
        rightOffset: 100,
        xScale: 1.5,
        yScale: 1.5
      }
      break
    case 'widescreen':
      outPaintingParams.value = {
        topOffset: 50,
        bottomOffset: 50,
        leftOffset: 200,
        rightOffset: 200,
        xScale: 2.0,
        yScale: 1.2
      }
      break
    case 'portrait':
      outPaintingParams.value = {
        topOffset: 200,
        bottomOffset: 200,
        leftOffset: 50,
        rightOffset: 50,
        xScale: 1.2,
        yScale: 2.0
      }
      break
  }
}

// 打开弹窗
const openModal = () => {
  visible.value = true
}

// 关闭弹窗
const closeModal = () => {
  visible.value = false
  resetState()
  emit('close')
}

// 重置状态
const resetState = () => {
  loading.value = false
  uploadLoading.value = false
  taskId.value = ''
  resultImageUrl.value = ''
  outPaintingPercent.value = 0
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
  pollingCount.value = 0
  presetOption.value = 'custom'
  // 重置扩图参数
  outPaintingParams.value = {
    topOffset: 100,
    bottomOffset: 100,
    leftOffset: 100,
    rightOffset: 100,
    xScale: 1.5,
    yScale: 1.5
  }
}

// 创建扩图任务
const createTask = async () => {
  if (!props.picture) return
  
  // 检查至少有一个方向的扩展像素大于0
  const hasExtension = outPaintingParams.value.topOffset > 0 || 
                     outPaintingParams.value.bottomOffset > 0 || 
                     outPaintingParams.value.leftOffset > 0 || 
                     outPaintingParams.value.rightOffset > 0
  if (!hasExtension) {
    message.error('至少需要设置一个方向的扩图像素数大于0')
    return
  }
  
  loading.value = true
  outPaintingPercent.value = 6
  try {
    const response = await createPictureOutPaintingTaskUsingPost({
      pictureId: props.picture.id,
      parameters: outPaintingParams.value
    })
    
    // 正确访问AxiosResponse对象的data属性
    const apiResponse = response.data
    if (apiResponse.code === 0 && apiResponse.data && apiResponse.data.output) {
      taskId.value = apiResponse.data.output.taskId || ''
      if (taskId.value) {
        startPolling()
      } else {
        message.error('创建扩图任务失败：未返回任务ID')
        loading.value = false
        outPaintingPercent.value = 0
      }
    } else {
      message.error(apiResponse.message || '创建扩图任务失败')
      loading.value = false
      outPaintingPercent.value = 0
    }
  } catch (error: any) {
    message.error(error.message || '创建扩图任务失败')
    loading.value = false
    outPaintingPercent.value = 0
  }
}

// 开始轮询任务状态
const startPolling = () => {
  if (!taskId.value) return
  
  pollingInterval.value = window.setInterval(async () => {
    pollingCount.value++
    outPaintingPercent.value = Math.min(92, 8 + Math.floor((pollingCount.value / MAX_POLLING_COUNT) * 84))

    // 检查是否超时
    if (pollingCount.value > MAX_POLLING_COUNT) {
      message.error('扩图任务超时，已自动终止')
      resetState()
      return
    }
    
    try {
      const response = await getPictureOutPaintingTaskUsingGet({ taskId: taskId.value })
      
      // 正确访问AxiosResponse对象的data属性
      const apiResponse = response.data
      if (apiResponse.code === 0 && apiResponse.data && apiResponse.data.output) {
        const taskOutput = apiResponse.data.output
        
        if (taskOutput.taskStatus === 'SUCCEEDED') {
          // 任务成功
          outPaintingPercent.value = 100
          message.success('扩图成功')
          resultImageUrl.value = taskOutput.outputImageUrl || ''
          // 只清除轮询定时器，不重置所有状态
          if (pollingInterval.value) {
            clearInterval(pollingInterval.value)
            pollingInterval.value = null
          }
          pollingCount.value = 0
          loading.value = false
        } else if (taskOutput.taskStatus === 'FAILED') {
          // 任务失败
          const errorCode = taskOutput.code || 'UNKNOWN_ERROR'
          const errorMessage = taskOutput.message || '扩图失败'
          message.error(`扩图失败：${errorMessage} (${errorCode})`)
          resetState()
        } else if (taskOutput.taskStatus === 'PENDING' || taskOutput.taskStatus === 'RUNNING') {
          // 任务进行中，继续轮询
        }
      }
    } catch (error: any) {
      message.error('获取任务状态失败')
      resetState()
    }
  }, 5000) // 每5秒轮询一次
}

// 处理上传
const handleUpload = async () => {
  if (!resultImageUrl.value) return
  
  uploadLoading.value = true
  try {
    // 这里可以添加上传逻辑，将扩图结果保存到系统中
    message.success('应用结果成功')
    closeModal()
  } catch (error: any) {
    message.error('应用结果失败')
  } finally {
    uploadLoading.value = false
  }
}

onUnmounted(() => {
  resetState()
})

// 暴露方法给父组件
defineExpose({
  openModal
})
</script>

<style scoped>
.image-out-painting {
  text-align: center;
}

.outpaint-progress {
  margin-top: 20px;
  text-align: left;
}

.outpaint-progress-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}
</style>
