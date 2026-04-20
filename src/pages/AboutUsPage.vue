<template>
  <div class="about-page ds-page ds-page--wide">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          About · 栖图 Nestpic
        </div>
        <h1 class="hero-title">
          <span>让每一张作品</span>
          <span class="hero-title-accent">找到栖息之地</span>
        </h1>
        <p class="hero-desc">
          栖图（Nestpic）是一款集
          <em>个人创作</em>、<em>团队协作</em>、<em>社交互动</em>
          于一体的云端图片平台。
          我们相信好作品值得被沉淀，也值得被连接。
        </p>
        <div class="hero-actions">
          <a-button type="primary" size="large" @click="goHome">进入首页</a-button>
          <a
            class="hero-ghost-btn"
            href="https://github.com/Eddie1-code"
            target="_blank"
            rel="noreferrer"
          >
            <GithubOutlined />
            <span>访问 GitHub</span>
          </a>
        </div>

        <div class="hero-metrics">
          <div class="metric">
            <div class="metric-num">6+</div>
            <div class="metric-label">核心功能模块</div>
          </div>
          <div class="metric">
            <div class="metric-num">3</div>
            <div class="metric-label">空间形态</div>
          </div>
          <div class="metric">
            <div class="metric-num">5</div>
            <div class="metric-label">消息中心类别</div>
          </div>
          <div class="metric">
            <div class="metric-num">∞</div>
            <div class="metric-label">创作的可能</div>
          </div>
        </div>
      </div>
      <div class="hero-deco" aria-hidden="true"></div>

      <!-- 悬挂小票（物理纸张模拟，可拖拽） -->
      <div class="hero-receipt" aria-label="栖图购物清单">
        <ReceiptBoard
          title="NESTPIC · LIST"
          subtitle="The Poet's Shopping"
          :items="receiptItems"
          footer-text="MADE WITH WARM PIXELS"
          barcode="*NESTPIC-WELCOME*"
          :width="280"
          :height="460"
        />
      </div>
    </section>

    <!-- 核心功能 -->
    <section class="section">
      <div class="section-head">
        <div class="section-eyebrow">FEATURES</div>
        <h2 class="section-title">我们提供什么</h2>
        <p class="section-sub">围绕"创作 → 沉淀 → 分享 → 互动"的完整链路，构建稳定可扩展的云端体验。</p>
      </div>

      <div class="feature-grid">
        <div v-for="f in features" :key="f.title" class="feature-card">
          <div class="feature-icon" :style="{ background: f.bg }">
            <component :is="f.icon" />
          </div>
          <h3 class="feature-title">{{ f.title }}</h3>
          <p class="feature-desc">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 技术栈 -->
    <section class="section">
      <div class="section-head">
        <div class="section-eyebrow">TECH STACK</div>
        <h2 class="section-title">技术是我们的底色</h2>
        <p class="section-sub">采用工程化最佳实践，兼顾性能、可维护与开发幸福感。</p>
      </div>

      <div class="stack-split">
        <div class="stack-col">
          <div class="stack-col-title">
            <ThunderboltOutlined />
            服务端
          </div>
          <div class="chip-row">
            <span v-for="c in backendStack" :key="c" class="chip">{{ c }}</span>
          </div>
        </div>
        <div class="stack-col">
          <div class="stack-col-title">
            <LayoutOutlined />
            前端
          </div>
          <div class="chip-row">
            <span v-for="c in frontendStack" :key="c" class="chip chip--cool">{{ c }}</span>
          </div>
        </div>
        <div class="stack-col">
          <div class="stack-col-title">
            <DatabaseOutlined />
            存储 · 基础设施
          </div>
          <div class="chip-row">
            <span v-for="c in infraStack" :key="c" class="chip chip--warm">{{ c }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 愿景 -->
    <section class="section vision">
      <div class="vision-card ds-texture-panel">
        <div class="vision-quote">“</div>
        <h2 class="vision-title">做一款<em>克制而温暖</em>的图片平台</h2>
        <p class="vision-text">
          我们拒绝信息过载、拒绝拥挤的瀑布流。
          每一个卡片、每一次点赞，都被认真地设计。
          我们希望栖图不仅是工具，更是一种表达方式——
          让你的审美有处安放，让你的作品被尊重地看见。
        </p>
      </div>
    </section>

    <!-- 作者 -->
    <section class="section">
      <div class="section-head">
        <div class="section-eyebrow">TEAM</div>
        <h2 class="section-title">关于作者</h2>
      </div>

      <div class="author-card">
        <div class="author-avatar">
          <UserOutlined />
        </div>
        <div class="author-body">
          <div class="author-name-row">
            <span class="author-name">Eddie</span>
            <span class="author-role">Founder · Full-Stack Engineer</span>
          </div>
          <p class="author-intro">
            独立开发者，热爱将对产品的理解沉淀为代码，
            追求工程的严谨与体验的细腻的平衡。
            欢迎通过以下方式交流与反馈。
          </p>
          <div class="author-links">
            <a
              class="author-link"
              href="https://github.com/Eddie1-code"
              target="_blank"
              rel="noreferrer"
            >
              <GithubOutlined />
              GitHub · Eddie1-code
            </a>
            <a class="author-link" href="mailto:15012798480@163.com">
              <MailOutlined />
              15012798480@163.com
            </a>
          </div>
        </div>
      </div>
    </section>

    <div class="footer-note">© {{ year }} 栖图 · Nestpic · Where pictures rest</div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import {
  CloudUploadOutlined,
  DatabaseOutlined,
  GithubOutlined,
  HeartOutlined,
  LayoutOutlined,
  MailOutlined,
  MessageOutlined,
  PictureOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'

const ReceiptBoard = defineAsyncComponent(() => import('@/components/ReceiptBoard.vue'))

const router = useRouter()
const year = computed(() => new Date().getFullYear())

// AboutUs 版小票：玩味 3D 图形术语"购物清单"（路线 2）
const receiptItems = [
  { text: '1 只 Bezier 停枝的鸟' },
  { text: '2 片 Subdivision 落叶' },
  { text: '3 朵 Raymarch 软云' },
  { text: '一段 Chromatic 夕光' },
  { text: '一份 Bloom 的黄昏' },
  { text: '半个 Fresnel 月亮' },
  { text: '一把 Displacement 的雨' },
  { checked: true, text: '一次安静的凝视' },
]

function goHome() {
  router.push('/')
}

const features = [
  {
    title: '云端图片库',
    desc: '上传、整理、搜索与浏览，一站式承载你的每一次创作灵感。',
    icon: PictureOutlined,
    bg: 'linear-gradient(135deg, #e4cfa8, #d0a67a)',
  },
  {
    title: '多形态空间',
    desc: '个人空间、团队空间、旗舰空间三种形态，满足不同协作场景。',
    icon: CloudUploadOutlined,
    bg: 'linear-gradient(135deg, #cfc0a3, #a88d6a)',
  },
  {
    title: '团队协作',
    desc: '邀请成员、角色分配、细粒度权限控制，让协作自然而有序。',
    icon: TeamOutlined,
    bg: 'linear-gradient(135deg, #d6b88f, #b58863)',
  },
  {
    title: '社交互动',
    desc: '点赞、评论、收藏、关注、私信，让好作品遇见懂它的人。',
    icon: HeartOutlined,
    bg: 'linear-gradient(135deg, #e6b3a5, #c47f6b)',
  },
  {
    title: '消息中心',
    desc: '统一聚合 5 类通知，重要的事情一目了然，不再遗漏。',
    icon: MessageOutlined,
    bg: 'linear-gradient(135deg, #c8b7a0, #97825f)',
  },
  {
    title: '稳定与性能',
    desc: 'Redis 缓存、分布式锁、乐观幂等、异步处理，撑起百万级数据。',
    icon: ThunderboltOutlined,
    bg: 'linear-gradient(135deg, #d2a679, #a17548)',
  },
]

const backendStack = [
  'Java 17',
  'Spring Boot',
  'MyBatis-Plus',
  'Sa-Token',
  'WebSocket',
  'Caffeine',
  'JWT',
]
const frontendStack = [
  'Vue 3',
  'TypeScript',
  'Ant Design Vue',
  'Pinia',
  'Vue Router',
  'Vite',
  'Axios',
]
const infraStack = ['MySQL', 'Redis', 'COS 对象存储', 'Docker', 'Nginx']
</script>

<style scoped>
.about-page {
  padding: 0 0 40px;
  max-width: var(--ds-content-max);
}

/* ==================== Hero ==================== */
.hero {
  position: relative;
  padding: 64px 48px 72px;
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  background:
    radial-gradient(900px 460px at 85% -10%, rgba(208, 166, 122, 0.28), transparent 55%),
    radial-gradient(700px 420px at 0% 100%, rgba(139, 115, 85, 0.16), transparent 55%),
    linear-gradient(160deg, #fbf5ea 0%, #f4ead9 70%, #eddec5 100%);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-sm);
  margin-top: 20px;
}

.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 760px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid var(--ds-border-subtle);
  color: var(--ds-text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  backdrop-filter: blur(6px);
}

.hero-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ds-accent-deep);
  animation: heroPulse 2s ease-in-out infinite;
}

@keyframes heroPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.5); }
}

.hero-title {
  margin-top: 22px;
  font-size: 48px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ds-text-primary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-title-accent {
  background: linear-gradient(120deg, #8b7355, #c89860 50%, #8b5a33);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-desc {
  margin-top: 20px;
  font-size: 16px;
  line-height: 1.75;
  color: var(--ds-text-secondary);
  max-width: 640px;
}

.hero-desc em {
  font-style: normal;
  color: var(--ds-accent-deep);
  font-weight: 600;
  padding: 0 2px;
}

.hero-actions {
  margin-top: 28px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.hero-ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  height: 40px;
  border-radius: var(--ds-radius-md);
  border: 1px solid var(--ds-border-subtle);
  background: rgba(255, 255, 255, 0.6);
  color: var(--ds-text-primary);
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  backdrop-filter: blur(6px);
}

.hero-ghost-btn:hover {
  color: var(--ds-accent-deep);
  border-color: var(--ds-accent);
  background: #fff;
  transform: translateY(-1px);
}

.hero-metrics {
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  max-width: 640px;
}

.metric-num {
  font-size: 30px;
  font-weight: 800;
  color: var(--ds-text-primary);
  letter-spacing: -0.02em;
}

.metric-label {
  font-size: 12px;
  color: var(--ds-text-muted);
  margin-top: 4px;
}

.hero-deco {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(218, 176, 132, 0.45),
    rgba(218, 176, 132, 0) 60%
  );
  pointer-events: none;
}

/* 物理悬挂小票 */
.hero-receipt {
  position: absolute;
  top: 0;
  right: 56px;
  z-index: 3;
  /* 挂在 hero 顶部边缘，留一点从外面延伸下来的感觉 */
}

@media (max-width: 1080px) {
  .hero-receipt {
    right: 24px;
    transform: scale(0.9);
    transform-origin: top right;
  }
}

@media (max-width: 880px) {
  .hero-receipt {
    display: none;
  }
}

/* ==================== Section 通用 ==================== */
.section {
  margin-top: 72px;
}

.section-head {
  margin-bottom: 28px;
}

.section-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--ds-accent-deep);
  margin-bottom: 8px;
}

.section-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--ds-text-primary);
  letter-spacing: -0.01em;
  margin: 0;
}

.section-sub {
  margin-top: 8px;
  color: var(--ds-text-muted);
  font-size: 14px;
}

/* ==================== 功能卡片 ==================== */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 24px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-bg-elevated);
  transition: all 0.24s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, var(--ds-accent-deep), transparent);
  transition: height 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(45, 33, 20, 0.08);
  border-color: transparent;
}

.feature-card:hover::before {
  height: 100%;
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  margin-bottom: 16px;
  box-shadow: 0 10px 24px rgba(139, 115, 85, 0.2);
}

.feature-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ds-text-primary);
  margin: 0 0 6px;
}

.feature-desc {
  font-size: 13.5px;
  color: var(--ds-text-secondary);
  line-height: 1.65;
  margin: 0;
}

/* ==================== 技术栈 ==================== */
.stack-split {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stack-col {
  padding: 22px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-bg-elevated);
}

.stack-col-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ds-text-primary);
  margin-bottom: 14px;
}

.stack-col-title .anticon {
  color: var(--ds-accent-deep);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 999px;
  background: rgba(139, 115, 85, 0.08);
  color: var(--ds-text-primary);
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid rgba(139, 115, 85, 0.12);
}

.chip.chip--cool {
  background: rgba(60, 90, 120, 0.06);
  border-color: rgba(60, 90, 120, 0.12);
}

.chip.chip--warm {
  background: rgba(180, 100, 60, 0.08);
  border-color: rgba(180, 100, 60, 0.15);
}

/* ==================== 愿景 ==================== */
.vision {
  margin-top: 80px;
}

.vision-card {
  padding: 52px 56px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  position: relative;
  overflow: hidden;
  text-align: center;
}

.vision-quote {
  position: absolute;
  top: 8px;
  left: 28px;
  font-size: 140px;
  line-height: 1;
  color: rgba(139, 115, 85, 0.12);
  font-family: 'Georgia', serif;
  user-select: none;
  pointer-events: none;
}

.vision-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--ds-text-primary);
  margin: 0 0 16px;
  position: relative;
  z-index: 1;
}

.vision-title em {
  font-style: normal;
  color: var(--ds-accent-deep);
}

.vision-text {
  font-size: 15px;
  color: var(--ds-text-secondary);
  line-height: 1.9;
  max-width: 680px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ==================== 作者 ==================== */
.author-card {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 28px 32px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-bg-elevated);
}

.author-avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0c39a, #a17548);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36px;
  flex-shrink: 0;
  box-shadow: 0 14px 32px rgba(139, 115, 85, 0.28);
}

.author-body {
  flex: 1;
  min-width: 0;
}

.author-name-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}

.author-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--ds-text-primary);
}

.author-role {
  font-size: 12px;
  color: var(--ds-accent-deep);
  background: var(--ds-accent-soft, rgba(139, 115, 85, 0.1));
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.author-intro {
  margin: 10px 0 14px;
  color: var(--ds-text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.author-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.author-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-text-primary);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--ds-radius-sm);
  border: 1px solid var(--ds-border-subtle);
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.5);
}

.author-link:hover {
  color: var(--ds-accent-deep);
  border-color: var(--ds-accent);
  background: #fff;
}

.footer-note {
  text-align: center;
  margin-top: 56px;
  color: var(--ds-text-muted);
  font-size: 12px;
  letter-spacing: 0.02em;
}

/* ==================== 响应式 ==================== */
@media (max-width: 960px) {
  .hero {
    padding: 48px 28px 56px;
  }
  .hero-title {
    font-size: 36px;
  }
  .hero-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }
  .feature-grid,
  .stack-split {
    grid-template-columns: 1fr;
  }
  .vision-card {
    padding: 40px 24px;
  }
  .author-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
