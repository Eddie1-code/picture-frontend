<template>
  <div id="vipExchangePage" class="ds-page ds-page--narrow">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">会员权益</p>
      <h1 class="ds-page-title">会员码兑换</h1>
      <p class="ds-page-lead">
        输入有效兑换码即可开通会员，享受更高配额与专属标识。兑换成功后权益立即生效。
      </p>
    </header>

    <div class="vip-layout">
      <section class="vip-form-wrap">
        <div class="vip-form-card ds-texture-panel">
          <h2 class="card-heading">输入兑换码</h2>
          <p class="card-sub">请区分大小写，确认无误后再提交。</p>
          <a-form name="formData" layout="vertical" :model="formData" @finish="handleSubmit">
            <a-form-item name="vipCode" label="兑换码" class="vip-input-item">
              <a-input
                v-model:value="formData.vipCode"
                placeholder="粘贴或输入会员兑换码"
                allow-clear
                size="large"
                class="vip-input"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="submit-btn" :loading="loading">
                立即兑换
              </a-button>
            </a-form-item>
          </a-form>
        </div>

        <p class="fine-print">
          兑换即表示您已阅读并同意平台对会员服务的使用说明。如遇问题请联系管理员或查看
          <a href="https://github.com/Eddie1-code/picture-backend#readme" target="_blank" rel="noreferrer">项目说明</a>。
        </p>
      </section>

      <aside class="vip-aside" aria-label="会员权益说明">
        <div class="privilege-card ds-inner-card">
          <h3 class="aside-title">会员可享</h3>
          <ul class="privilege-list">
            <li>
              <span class="dot" aria-hidden="true" />
              <span>更高存储与上传配额，从容管理作品集。</span>
            </li>
            <li>
              <span class="dot" aria-hidden="true" />
              <span>专属身份标识，在个人中心与图库中展示。</span>
            </li>
            <li>
              <span class="dot" aria-hidden="true" />
              <span>优先体验后续 AI 与协作能力扩展。</span>
            </li>
          </ul>
        </div>

        <div class="tip-card ds-inner-card">
          <h3 class="aside-title">温馨提示</h3>
          <ul class="tip-list">
            <li>每个兑换码通常仅可使用一次。</li>
            <li>成功后将跳转首页；若未登录请先登录再兑换。</li>
            <li>请勿在公共设备上保存兑换码截图。</li>
          </ul>
        </div>

        <div class="vip-quote">
          <span class="quote-mark" aria-hidden="true">"</span>
          <p>好的工具，值得被郑重对待。</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { exchangeVipUsingPost } from '@/api/userController.ts'
import { useRouter } from 'vue-router'

const formData = reactive<API.VipExchangeRequest>({
  vipCode: '',
})

const loading = ref(false)
const router = useRouter()

const handleSubmit = async () => {
  if (!formData.vipCode) {
    message.error('请输入兑换码')
    return
  }

  loading.value = true
  try {
    const res = await exchangeVipUsingPost({
      vipCode: formData.vipCode,
    })
    if (res.data.code === 0 && res.data.data) {
      message.success('兑换成功！')
      router.push({ path: `/` })
    } else {
      message.error('兑换失败：' + res.data.message)
    }
  } catch {
    message.error('兑换失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#vipExchangePage {
  padding-bottom: 48px;
}

.vip-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 28px;
  align-items: start;
}

@media (max-width: 900px) {
  .vip-layout {
    grid-template-columns: 1fr;
  }
}

.vip-form-wrap {
  min-width: 0;
}

.vip-form-card {
  position: relative;
  padding: 28px 26px 26px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
}

.vip-form-card > * {
  position: relative;
  z-index: 1;
}

.card-heading {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ds-text-primary);
}

.card-sub {
  margin: 0 0 22px;
  font-size: 13px;
  color: var(--ds-text-muted);
}

:deep(.vip-input-item .ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.vip-input.ant-input-lg) {
  border-radius: var(--ds-radius-md);
  padding: 10px 14px;
  font-size: 15px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  font-weight: 600;
  font-size: 15px;
  border-radius: var(--ds-radius-md);
}

.fine-print {
  margin: 20px 4px 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ds-text-muted);
}

.fine-print a {
  color: var(--ds-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.vip-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aside-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ds-text-primary);
}

.privilege-list,
.tip-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-secondary);
}

.privilege-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.privilege-list li:last-child {
  margin-bottom: 0;
}

.dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-top: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ds-accent), var(--ds-accent-deep));
  opacity: 0.85;
}

.tip-list li {
  position: relative;
  padding-left: 14px;
  margin-bottom: 8px;
}

.tip-list li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: var(--ds-accent);
  font-weight: 700;
}

.tip-list li:last-child {
  margin-bottom: 0;
}

.vip-quote {
  position: relative;
  padding: 20px 18px 18px;
  border-radius: var(--ds-radius-md);
  border: 1px dashed var(--ds-border-strong);
  background: rgba(255, 255, 255, 0.25);
}

.quote-mark {
  position: absolute;
  top: 8px;
  left: 12px;
  font-family: var(--ds-font-display);
  font-size: 2rem;
  line-height: 1;
  color: var(--ds-accent);
  opacity: 0.35;
}

.vip-quote p {
  margin: 0;
  padding-left: 8px;
  font-family: var(--ds-font-display);
  font-size: 1.05rem;
  font-style: italic;
  line-height: 1.45;
  color: var(--ds-text-secondary);
}
</style>
