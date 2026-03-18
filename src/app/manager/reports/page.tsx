"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ManagerReportsPage() {
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: team, error: teamError } = await supabase
        .from('users')
        .select('id, name')
        .eq('reporting_officer', user.id);

      if (teamError) {
        console.error(teamError);
        setLoading(false);
        return;
      }

      const performanceData = await Promise.all(
        team.map(async (member) => {
          const { count: completedTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_employee', member.id)
            .eq('status', 'Done');

          const { count: pendingTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_employee', member.id)
            .in('status', ['Pending', 'In Progress']);

          return {
            name: member.name,
            completed: completedTasks || 0,
            pending: pendingTasks || 0,
          };
        })
      );

      setTeamPerformance(performanceData);
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Reports</h2>
        <p className="text-gray-500">Analyze your team's performance and task distribution.</p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="text-lg font-bold">Task Completion Status</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#82ca9d" />
                <Bar dataKey="pending" stackId="a" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
