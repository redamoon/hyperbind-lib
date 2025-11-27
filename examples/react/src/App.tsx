import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { AccountingDashboard } from "./pages/AccountingDashboard";
import { Invoices } from "./pages/Invoices";
import { Expenses } from "./pages/Expenses";
import { SalesDashboard } from "./pages/SalesDashboard";
import { Orders } from "./pages/Orders";
import { Customers } from "./pages/Customers";
import { Products } from "./pages/Products";
import { PropertyRegister } from "./pages/PropertyRegister";
import { ContractManagement } from "./pages/ContractManagement";
import { DailyReport } from "./pages/DailyReport";

export const App = () => {
  // Viteのbase設定に合わせてbasenameを設定
  // 開発環境では"/"、本番環境では"/hyperbind-lib/react/"
  const baseUrl = import.meta.env.BASE_URL || "/";
  // baseUrlから末尾のスラッシュを除いてbasenameに設定
  const basename = baseUrl !== "/" ? baseUrl.replace(/\/$/, "") : undefined;
  
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/accounting/dashboard" element={<AccountingDashboard />} />
        <Route path="/accounting/invoices" element={<Invoices />} />
        <Route path="/accounting/expenses" element={<Expenses />} />
        <Route path="/sales/dashboard" element={<SalesDashboard />} />
        <Route path="/sales/orders" element={<Orders />} />
        <Route path="/sales/customers" element={<Customers />} />
        <Route path="/sales/products" element={<Products />} />
        <Route path="/sales/daily-report" element={<DailyReport />} />
        <Route path="/real-estate/properties" element={<PropertyRegister />} />
        <Route path="/real-estate/contracts" element={<ContractManagement />} />
      </Routes>
    </BrowserRouter>
  );
};
