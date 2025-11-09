    import React, { ReactNode } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ title, value, icon }) => {
  return (
    <Card className="border border-gray-200 shadow-sm rounded-xl">
      <CardHeader className="flex items-center justify-between p-4">
        <h6 className="text-sm font-semibold text-gray-600">{title}</h6>
        {icon}
      </CardHeader>
      <CardBody className="p-4 pt-0">
        <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
      </CardBody>
    </Card>
  );
};
