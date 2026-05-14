<script setup lang="ts">
const features = [
  {
    title: "快速启动",
    description: "基于 Vite 的开发体验，开箱即用，适合练手和小型项目。",
  },
  {
    title: "Vue 3 + TS",
    description: "使用组合式 API 和 TypeScript，让代码更清晰，也更易于维护。",
  },
  {
    title: "现代化模板",
    description: "补全了基础页面结构和样式，打开即可看到一个完整的首页。",
  },
];
</script>

<template>
  <main class="page">
    <section class="hero">
      <div class="hero__badge">Vue Starter</div>
      <h1>一个完整的 Vue 模板</h1>
      <p>
        这是一个补全后的基础项目模板，适合直接开始开发你的应用、页面或组件库示例。
      </p>

      <div class="hero__actions">
        <a href="https://vuejs.org/" target="_blank" rel="noreferrer" class="button button--primary">
          了解 Vue
        </a>
        <a href="https://vite.dev/" target="_blank" rel="noreferrer" class="button button--secondary">
          了解 Vite
        </a>
        <router-link to="/login" class="button button--secondary">登录</router-link>
      </div>
    </section>

    <section class="features">
      <article v-for="feature in features" :key="feature.title" class="feature-card">
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.description }}</p>
      </article>
    </section>
  </main>
</template>
