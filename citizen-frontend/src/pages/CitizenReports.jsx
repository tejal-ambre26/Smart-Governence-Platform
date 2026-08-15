import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { StatCard } from '../components/StatCard.jsx';
import api from '../api.js';
import { Users, MapPin, TrendingUp } from 'lucide-react';

export default function CitizenReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/reports/citizens')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load citizen data'))
      .finally(() => setLoading(false));
  }, []);

  const isUnavailable = data?.status === 'unavailable';

  return (
    <AppShell title="Citizen Reports">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 0 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Citizen Reports</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            Registration statistics sourced from citizen-service
          </p>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 12, background: '#e2e8f0', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {isUnavailable && !loading && (
          <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <Users size={40} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>Citizen service temporarily unreachable</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Data will appear once citizen-service is back online</p>
          </div>
        )}

        {data && !isUnavailable && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            <StatCard
              icon={Users}
              title="Total Registered Citizens"
              value={data.totalCitizens?.toLocaleString() || '0'}
              subtitle="All-time registrations"
            />
            <StatCard
              icon={TrendingUp}
              title="Data Source"
              value="Live"
              subtitle="Direct from citizen-service"
            />
          </div>
        )}

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    </AppShell>
  );
}
