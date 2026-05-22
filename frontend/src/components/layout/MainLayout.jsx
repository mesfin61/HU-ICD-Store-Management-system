import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
import HeaderBar from "./HeaderBar";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <SideBar />
      <div className="flex-1 ml-64">
        <HeaderBar />
        <main className="p-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
