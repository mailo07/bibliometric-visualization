// src/components/SearchPage/LeftMenu.js
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './SearchPage.css';

const LeftMenu = ({ bibliometricCharts }) => {
  return (
    <aside className="left-column p-4 bg-white/90 shadow-md">
      <h3 className="font-semibold text-purple-800 mb-4">Bibliometric Insights</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-purple-600 mb-2">Citation Trends</h4>
          <LineChart width={250} height={150} data={bibliometricCharts.citationTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis domain={[0, 'auto']} allowDataOverflow={true} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="citations" stroke="#9370DB" />
          </LineChart>
        </div>

        <div>
          <h4 className="text-sm font-medium text-purple-600 mb-2">Top Authors by Citations</h4>
          <BarChart width={250} height={150} data={bibliometricCharts.topAuthors}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 'auto']} allowDataOverflow={true} />
            <Tooltip />
            <Bar dataKey="citations" fill="#9370DB" />
          </BarChart>
        </div>

        <div>
          <h4 className="text-sm font-medium text-purple-600 mb-2">Publication Distribution</h4>
          <PieChart width={250} height={200}>
            <Pie
              data={bibliometricCharts.publicationDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {bibliometricCharts.publicationDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>
    </aside>
  );
};

export default LeftMenu;