import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/home", component: "Home" },
    { path: "/docs", component: "Docs" },
    { path: "/role", component: "Role" },
    { path: "/", redirect: "/role" },
  ],
  npmClient: 'yarn',
});
