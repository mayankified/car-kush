import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { db } from '../services/mockDb';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export default function ObsidianNetworkGraph() {
  const { session, userRole } = useAuth();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [customers, employees] = await Promise.all([
        db.getCustomers(),
        db.getEmployees()
      ]);

      const nodes: any[] = [];
      const links: any[] = [];

      // =========================
      // ADMIN → FULL TREE
      // =========================
      if (userRole === UserRole.ADMIN) {
        nodes.push({
          id: 'owner',
          name: 'STUDIO ROOT',
          val: 20,
          color: '#60a5fa',
          level: 0,
        });

        employees.forEach(emp => {
          nodes.push({
            id: emp.id,
            name: emp.name,
            val: 12,
            color: '#818cf8',
            level: 1,
          });
          links.push({ source: 'owner', target: emp.id });
        });

        customers.forEach(cust => {
          nodes.push({
            id: cust.id,
            name: cust.name,
            val: 8,
            color: '#10b981',
            level: 2,
          });

          if (cust.referringEmployeeId) {
            links.push({ source: cust.referringEmployeeId, target: cust.id });
          } else if (cust.referredByCustomerId) {
            links.push({ source: cust.referredByCustomerId, target: cust.id });
          } else {
            links.push({ source: 'owner', target: cust.id });
          }
        });

        setGraphData({ nodes, links });
        return;
      }

      // =========================
      // STAFF → OWN TREE ONLY
      // =========================
      const staffId = session?.user?.id;
      const staff = employees.find(e => e.id === staffId);
      if (!staff) return;

      // Root = staff
      nodes.push({
        id: staff.id,
        name: staff.name,
        val: 18,
        color: '#818cf8',
        level: 0,
      });

      // Customers directly referred by staff
      const level1 = customers.filter(
        c => c.referringEmployeeId === staff.id
      );

      level1.forEach(c1 => {
        nodes.push({
          id: c1.id,
          name: c1.name,
          val: 10,
          color: '#10b981',
          level: 1,
        });
        links.push({ source: staff.id, target: c1.id });

        // Customers referred by this customer (level 2)
        const level2 = customers.filter(
          c => c.referredByCustomerId === c1.id
        );

        level2.forEach(c2 => {
          nodes.push({
            id: c2.id,
            name: c2.name,
            val: 8,
            color: '#22c55e',
            level: 2,
          });
          links.push({ source: c1.id, target: c2.id });
        });
      });

      setGraphData({ nodes, links });
    };

    loadData();
  }, [session, userRole]);

  return (
    <div className="h-[90vh] w-full bg-[#020617] rounded-3xl border border-slate-800 overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        backgroundColor="#020617"
        nodeRelSize={6}
        nodeVal={(d: any) => d.val}
        nodeLabel="name"
        linkColor={() => '#1e293b'}
        linkWidth={1.5}
        d3VelocityDecay={0.3}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI);
          ctx.fill();

          if (globalScale > 2) {
            ctx.fillStyle = '#e5e7eb';
            ctx.fillText(node.name, node.x, node.y + node.val);
          }
        }}
      />
    </div>
  );
}
