import React, { useEffect, useState } from "react";

import PageTransition from "../animated_motion/PageTransition";

import { getMyActivity } from "../services/activityService";

function MyActivity() {
  const [activities, setActivities] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const loadActivity = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getMyActivity({
        limit: 100,
        offset: 0,
      });

      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[MyActivity] load:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to load your activity.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString();
  };

  const actionStyle = (action) => {
    if (action?.includes("REJECT")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }

    if (action?.includes("APPROV")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }

    if (action?.includes("ISSU")) {
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    }

    if (action?.includes("RETURN")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }

    if (action?.includes("REQUEST")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-5">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Activity</h1>

          <p className="mt-1 text-sm font-semibold text-primary">
            View the actions you have performed in the system.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border bg-white p-10 text-center text-sm text-slate-500">
            Loading your activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center text-sm text-slate-500">
            No activity records found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="bg-secondary-container text-left text-xs font-semibold uppercase tracking-wider text-primary">
                  <th className="p-3">Date</th>

                  <th className="p-3">Action</th>

                  <th className="p-3">Entity</th>

                  <th className="p-3">Reference</th>
                </tr>
              </thead>

              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap text-slate-600">
                      {formatDate(activity.created_at)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${actionStyle(
                          activity.action,
                        )}`}
                      >
                        {activity.action}
                      </span>
                    </td>

                    <td className="p-3 font-medium text-primary">
                      {activity.entity_name}
                    </td>

                    <td className="p-3 max-w-[400px] truncate font-mono text-xs text-slate-500">
                      {activity.entity_id || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default MyActivity;
