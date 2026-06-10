import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReportStats from "../components/reports/ReportStats";
import ReportOverviewPanel from "../components/reports/ReportOverviewPanel";
import PageTransition from "../animated_motion/PageTransition";

export default function Reports() {
  const location = useLocation();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const state = location.state || {};
    if (state.downloaded) {
      setBanner("Report downloaded successfully.");
    } else if (state.viewed) {
      setBanner("Report opened in new tab.");
    }

    if (Object.keys(state).length) {
      const timer = setTimeout(() => {
        setBanner(null);
        // clear navigation state
        navigate(location.pathname, { replace: true, state: {} });
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);
  return (
    <PageTransition>
      <div className="flex flex-col gap-4 px-4 py-2">
        <h1 className="font-bold text-xl text-primary">
          Comprehensive system performance and inventory metrics
        </h1>
        {banner && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 shadow-sm">
            {banner}
          </div>
        )}
        <div className="flex flex-col gap-6">
          <ReportStats />

          <ReportOverviewPanel />
        </div>
      </div>
    </PageTransition>
  );
}
