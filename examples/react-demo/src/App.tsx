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

export const App = () => {
  // Viteのbase設定に合わせてbasenameを設定
  // 開発環境では"/"、本番環境では"/hyperbind-lib/"
  const baseUrl = import.meta.env.BASE_URL || "/";
  const basename = baseUrl === "/hyperbind-lib/" ? "/hyperbind-lib" : undefined;
  
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
      </Routes>
    </BrowserRouter>
  );
};
