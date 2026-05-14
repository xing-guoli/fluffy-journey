<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { md5 } from "js-md5";
import usersJson from "./default.json";
import type { UserRecord } from "../../types/user";
import { authUser, setAuthUser } from "../../stores/authSession";

const router = useRouter();
const username = ref("");
const password = ref("");
const errorMsg = ref("");
const loading = ref(false);

const users = usersJson as UserRecord[];

if (authUser.value) {
  void router.replace({ name: "workOrder" });
}

function toPublicUser(row: UserRecord) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    created_at: row.created_at,
  };
}

function onSubmit() {
  errorMsg.value = "";
  const u = username.value.trim();
  const p = password.value;
  if (!u || !p) {
    errorMsg.value = "请输入用户名和密码";
    return;
  }
  loading.value = true;
  try {
    const hash = md5(p).toLowerCase();
    const found = users.find((row) => row.username === u && row.password === hash);
    if (!found) {
      errorMsg.value = "用户名或密码错误";
      return;
    }
    setAuthUser(toPublicUser(found));
    void router.push({ name: "workOrder" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="page page--login">
    <section class="login-shell">
      <div class="login-shell__visual">
        <div class="login-shell__glow login-shell__glow--one"></div>
        <div class="login-shell__glow login-shell__glow--two"></div>
        <div class="login-shell__brand">工单系统</div>
        <h1>欢迎回来</h1>
        <p>登录后可查看工单处理进度、统计数据和任务分配情况。</p>
      </div>

      <div class="login-card">
        <h2>账号登录</h2>
        <p class="login-card__subtitle">请输入你的账号信息以继续访问系统。</p>

        <form class="login-form" @submit.prevent="onSubmit">
          <div class="field">
            <label for="login-username">用户名</label>
            <input
              id="login-username"
              v-model="username"
              type="text"
              name="username"
              autocomplete="username"
              placeholder="例如 admin"
            />
          </div>
          <div class="field">
            <label for="login-password">密码</label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              name="password"
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </div>
          <p v-if="errorMsg" class="login-form__error" role="alert">{{ errorMsg }}</p>
          <button type="submit" class="button button--primary login-form__submit" :disabled="loading">
            {{ loading ? "登录中…" : "登录" }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page--login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 28%),
    radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.24), transparent 26%),
    linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%);
}

.login-shell {
  position: relative;
  width: min(100%, 980px);
  min-height: 620px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 24px 80px rgba(2, 6, 23, 0.45);
  backdrop-filter: blur(18px);
}

.login-shell__visual {
  position: relative;
  padding: 56px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 18px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.8));
  color: #e2e8f0;
  overflow: hidden;
}

.login-shell__visual h1 {
  margin: 0;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.login-shell__visual p {
  margin: 0;
  max-width: 28rem;
  color: rgba(226, 232, 240, 0.78);
  font-size: 16px;
  line-height: 1.8;
}

.login-shell__brand {
  align-self: flex-start;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.28);
  color: #e0f2fe;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
}

.login-shell__glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
  pointer-events: none;
}

.login-shell__glow--one {
  width: 220px;
  height: 220px;
  top: 40px;
  right: 60px;
  background: rgba(56, 189, 248, 0.18);
}

.login-shell__glow--two {
  width: 280px;
  height: 280px;
  bottom: -40px;
  left: -20px;
  background: rgba(139, 92, 246, 0.18);
}

.login-card {
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(15, 23, 42, 0.92);
  border-left: 1px solid rgba(148, 163, 184, 0.12);
}

.login-card h2 {
  margin: 18px 0 8px;
  color: #f8fafc;
  font-size: 30px;
  line-height: 1.1;
}

.login-card__subtitle {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.login-form {
  display: grid;
  gap: 18px;
  margin-top: 28px;
  padding-top: 8px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 500;
}

.field input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(30, 41, 59, 0.72);
  color: #e5eefc;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.field input::placeholder {
  color: rgba(148, 163, 184, 0.55);
}

.field input:focus {
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.14);
  transform: translateY(-1px);
}

.login-form__error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 14px;
  color: #fecaca;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.22);
}

.login-form__submit {
  width: 100%;
  min-width: 0;
  margin-top: 65px;
  border: none;
  cursor: pointer;
  height: 46px;
  border-radius: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.login-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 900px) {
  .page--login {
    padding: 20px;
  }

  .login-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-shell__visual {
    padding: 36px 28px;
  }

  .login-card {
    padding: 36px 28px 40px;
    border-left: 0;
    border-top: 1px solid rgba(148, 163, 184, 0.12);
  }
}
</style>
