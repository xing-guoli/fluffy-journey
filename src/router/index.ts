import { createRouter, createWebHistory } from "vue-router";
import { authUser } from "../stores/authSession";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
    {
      path: "/home",
      name: "home",
      component: () => import("../pages/Home.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../pages/login/index.vue"),
    },
    {
      path: "/work-order",
      name: "workOrder",
      component: () => import("../pages/workOrder/index.vue"),
    },
  ],
});

router.beforeEach((to) => {
  if (to.name === "login") {
    return true;
  }

  if (!authUser.value) {
    return { name: "login", replace: true };
  }

  return true;
});

export default router;
