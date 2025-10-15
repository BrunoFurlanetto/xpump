"use client";

import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const GroupsErrorRequest = ({ groupsPromise }: { groupsPromise: Promise<{ error?: string }> }) => {
  const groupsRequest = React.use(groupsPromise);
  if (!groupsRequest.error) return null;
  return (
    <Card className="border-red-500/20 bg-red-500/10">
      <CardContent className="p-4">
        <p className="text-red-400 text-sm">{groupsRequest.error}</p>
      </CardContent>
    </Card>
  );
};

export default GroupsErrorRequest;
