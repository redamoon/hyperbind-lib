import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import AccountingDashboard from "../pages/AccountingDashboard.vue";
import Invoices from "../pages/Invoices.vue";
import Expenses from "../pages/Expenses.vue";
import SalesDashboard from "../pages/SalesDashboard.vue";
import Orders from "../pages/Orders.vue";
import Customers from "../pages/Customers.vue";
import Products from "../pages/Products.vue";
import DailyReport from "../pages/DailyReport.vue";
import PropertyRegister from "../pages/PropertyRegister.vue";
import ContractManagement from "../pages/ContractManagement.vue";

// Viteのbase設定に合わせてbaseパスを設定
// 開発環境では"/"、本番環境では"/hyperbind-lib/vue/"
const baseUrl = import.meta.env.BASE_URL || "/";
const historyBase = baseUrl === "/hyperbind-lib/vue/" ? "/hyperbind-lib/vue" : "/";

export const router = createRouter({
  history: createWebHistory(historyBase),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    },
    {
      path: "/accounting/dashboard",
      name: "AccountingDashboard",
      component: AccountingDashboard,
    },
    {
      path: "/accounting/invoices",
      name: "Invoices",
      component: Invoices,
    },
    {
      path: "/accounting/expenses",
      name: "Expenses",
      component: Expenses,
    },
    {
      path: "/sales/dashboard",
      name: "SalesDashboard",
      component: SalesDashboard,
    },
    {
      path: "/sales/orders",
      name: "Orders",
      component: Orders,
    },
    {
      path: "/sales/customers",
      name: "Customers",
      component: Customers,
    },
    {
      path: "/sales/products",
      name: "Products",
      component: Products,
    },
    {
      path: "/sales/daily-report",
      name: "DailyReport",
      component: DailyReport,
    },
    {
      path: "/real-estate/properties",
      name: "PropertyRegister",
      component: PropertyRegister,
    },
    {
      path: "/real-estate/contracts",
      name: "ContractManagement",
      component: ContractManagement,
    },
  ],
});

