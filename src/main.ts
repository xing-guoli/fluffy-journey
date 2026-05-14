import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { initAuthSession } from "./stores/authSession";

initAuthSession();
createApp(App).use(router).mount("#app");
