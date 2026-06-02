<script setup>
import { ref } from "vue";

const emit = defineEmits(["login-success"]);

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
    error.value = "";
    loading.value = true;
    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.value, password: password.value }),
        });
        if (!res.ok) {
            const data = await res.json();
            error.value = data.detail || "登入失敗";
            return;
        }
        const data = await res.json();
        localStorage.setItem("admin_token", data.access_token);
        emit("login-success", data.access_token, data.is_super, username.value);
    } catch {
        error.value = "無法連接後端，請確認服務是否啟動";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="login-wrap">
        <div class="login-card">
            <h2>儀表板管理後台</h2>
            <p class="login-subtitle">請輸入管理員帳號密碼</p>
            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label>帳號</label>
                    <input v-model="username" type="text" placeholder="admin" autocomplete="username" required />
                </div>
                <div class="form-group">
                    <label>密碼</label>
                    <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" required />
                </div>
                <p v-if="error" class="login-error">{{ error }}</p>
                <button type="submit" :disabled="loading">
                    {{ loading ? "登入中..." : "登入" }}
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped lang="scss">
.login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1c1e;
}

.login-card {
    background: #282a2c;
    border: 1px solid #3a3c3e;
    border-radius: 12px;
    padding: 2.5rem 3rem;
    width: 360px;

    h2 {
        color: #fff;
        font-size: 1.4rem;
        margin-bottom: 0.4rem;
    }
}

.login-subtitle {
    color: #888;
    font-size: 0.875rem;
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1.25rem;

    label {
        display: block;
        color: #aaa;
        font-size: 0.875rem;
        margin-bottom: 0.4rem;
    }

    input {
        width: 100%;
        background: #1a1c1e;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 0.6rem 0.8rem;
        color: #fff;
        font-size: 0.95rem;
        box-sizing: border-box;
        transition: border-color 0.15s;

        &:focus {
            outline: none;
            border-color: #5b8cfa;
        }
    }
}

.login-error {
    color: #f87171;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
}

button {
    width: 100%;
    padding: 0.65rem;
    background: #5b8cfa;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
