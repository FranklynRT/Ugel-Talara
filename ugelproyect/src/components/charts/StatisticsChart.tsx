import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";

// Registrar los componentes de Chart.js
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface StatisticsChartProps {
  title: string;
  description?: string;
  chart: {
    data: ChartData<"line">;
    options?: ChartOptions<"line">;
  };
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  title,
  description,
  chart,
}) => {
  return (
    <Card className="border border-gray-200 shadow-sm rounded-xl">
      <CardHeader className="p-4">
        <h6 className="text-sm font-semibold text-gray-700">{title}</h6>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardBody className="px-2 pb-4">
        <Line data={chart.data} options={chart.options} />
      </CardBody>
    </Card>
  );
};
