import React from 'react';
import { DraggablePanel } from './DraggablePanel';

interface Stats {
  totalAgents: number;
  activeAgents: number;
  averageSpeed: number;
  congestionLevel: number;
}

interface StatsPanelProps {
  stats: Stats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <DraggablePanel
      title="📊 Statistics"
      defaultPosition={{ x: 20, y: 340 }}
      defaultSize={{ width: 280, height: 220 }}
      isCollapsible={true}
      initiallyCollapsed={false}
      storageKey="statistics"
      panelType="stats"
    >
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Agents</div>
          <div className="stat-value">{stats.totalAgents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">{stats.activeAgents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Speed</div>
          <div className="stat-value">{stats.averageSpeed.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Congestion</div>
          <div className="stat-value">{(stats.congestionLevel * 100).toFixed(0)}%</div>
        </div>
      </div>
    </DraggablePanel>
  );
}