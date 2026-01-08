import React, { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { db } from '../services/mockDb';
import { useAuth } from '../contexts/AuthContext';

export default function ObsidianNetworkGraph() {
  const { session } = useAuth();
  const [graphData, setGraphData] = React.useState({ nodes: [], links: [] });
 const graphRef = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [customers, employees] = await Promise.all([
        db.getCustomers(),
        db.getEmployees()
      ]);

      const nodes: any[] = [];
      const links: any[] = [];

      // 1. Central Hub (You)
      nodes.push({ 
        id: 'owner', 
        name: 'STUDIO ROOT', 
        val: 20, 
        color: '#60a5fa', 
        level: 0 
      });

      // 2. Staff Nodes
      employees.forEach(emp => {
        nodes.push({ 
          id: emp.id, 
          name: emp.name, 
          val: 12, 
          color: '#818cf8', 
          level: 1 
        });
        links.push({ source: 'owner', target: emp.id });
      });

      // 3. Customer Nodes
      customers.forEach(cust => {
        nodes.push({ 
          id: cust.id, 
          name: cust.name, 
          val: 8, 
          color: '#10b981', 
          level: 2 
        });

        // Determine Connection
        if (cust.referringEmployeeId) {
          links.push({ source: cust.referringEmployeeId, target: cust.id });
        } else if (cust.referredByCustomerId) {
          links.push({ source: cust.referredByCustomerId, target: cust.id });
        } else {
          links.push({ source: 'owner', target: cust.id });
        }
      });

      setGraphData({ nodes, links });
    };

    loadData();
  }, []);

  return (
    <div className="h-[90vh] w-full bg-[#020617] rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden relative">
      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <h2 className="text-2xl font-black text-white tracking-tighter">NETWORK GRAPH</h2>
        <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> Owner
            </span>
            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Staff
            </span>
            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Customer
            </span>
        </div>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        backgroundColor="#020617"
        nodeRelSize={6}
        nodeVal={d => d.val}
        nodeLabel="name"
        linkColor={() => '#1e293b'}
        linkWidth={1.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        d3VelocityDecay={0.3}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Node Glow
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Label
          if (globalScale > 2) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillText(label, node.x, node.y + (node.val / 2) + 5);
          }
        }}
      />
    </div>
  );
}