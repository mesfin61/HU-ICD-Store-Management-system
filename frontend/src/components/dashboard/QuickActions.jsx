import React from "react";
import { Link } from "react-router-dom";

function QuickActions() {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-3 mt-1 shadow-lg w-full">
      <Link
        className="w-full text-center bg-white text-blue-800 py-2 px-4 rounded-lg border border-blue-800 hover:bg-blue-800 hover:text-white transition-colors duration-300 ease-in-out"
        to="/stock"
      >
        New Stock-in
      </Link>

      <Link
        className="w-full text-center bg-white text-blue-800 py-2 px-4 rounded-lg border border-blue-800 hover:bg-blue-800 hover:text-white transition-colors duration-300 ease-in-out"
        to="/requests"
      >
        Create Request
      </Link>

      <Link
        className="w-full text-center bg-white text-blue-800 py-2 px-4 rounded-lg border border-blue-800 hover:bg-blue-800 hover:text-white transition-colors duration-300 ease-in-out"
        to="/reports"
      >
        Generate Report
      </Link>
    </div>
  );
}

export default QuickActions;
