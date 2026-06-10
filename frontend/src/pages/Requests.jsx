import React from "react";
import RequestList from "../components/request/RequestList";
import PageTransition from "../animated_motion/PageTransition";

export default function Requests() {
  return (
    <PageTransition>
      <div>
        <RequestList />
      </div>
    </PageTransition>
  );
}
