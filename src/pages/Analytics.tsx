import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '../lib/firebase';

interface AnalyticsData {
  totalImpressionsWeek: number;
  notificationsToday: number;
  uniquePages: number;
  dailyImpressions: { day: string; count: number }[];
  topPages: { url: string; impressions: number; lastSeen: string }[];
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        // In a real app, we'd query the 'impressions' table.
        // For now, we'll simulate the data fetching with a delay.
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock data based on user request
        const mockData: AnalyticsData = {
          totalImpressionsWeek: 12482,
          notificationsToday: 842,
          uniquePages: 14,
          dailyImpressions: [
            { day: 'Mon', count: 1200 },
            { day: 'Tue', count: 1500 },
            { day: 'Wed', count: 1100 },
            { day: 'Thu', count: 1800 },
            { day: 'Fri', count: 2200 },
            { day: 'Sat', count: 1400 },
            { day: 'Sun', count: 1600 },
          ],
          topPages: [
            { url: '/pricing', impressions: 4200, lastSeen: '2 mins ago' },
            { url: '/docs/setup', impressions: 3100, lastSeen: '15 mins ago' },
            { url: '/blog/social-proof', impressions: 2400, lastSeen: '1 hour ago' },
            { url: '/features', impressions: 1800, lastSeen: '3 hours ago' },
            { url: '/', impressions: 980, lastSeen: '5 hours ago' },
          ]
        };

        setData(mockData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] h-32">
              <div className="h-8 w-24 bg-[#EDE8DF] rounded-md mb-4"></div>
              <div className="h-4 w-32 bg-[#EDE8DF] rounded-md"></div>
            </div>
          ))}
        </div>

        {/* Panels Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] h-[400px]">
            <div className="h-6 w-48 bg-[#EDE8DF] rounded-md mb-8"></div>
            <div className="h-64 w-full bg-[#EDE8DF] rounded-md"></div>
          </div>
          <div className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] h-[400px]">
            <div className="h-6 w-48 bg-[#EDE8DF] rounded-md mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-full bg-[#EDE8DF] rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      {/* Top row — 3 stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] shadow-sm">
          <div className="font-syne font-extrabold text-3xl md:text-4xl text-terracotta mb-2">
            {data.totalImpressionsWeek.toLocaleString()}
          </div>
          <div className="text-muted text-sm font-medium">Total impressions this week</div>
        </div>
        <div className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] shadow-sm">
          <div className="font-syne font-extrabold text-3xl md:text-4xl text-terracotta mb-2">
            {data.notificationsToday.toLocaleString()}
          </div>
          <div className="text-muted text-sm font-medium">Notifications shown today</div>
        </div>
        <div className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] shadow-sm">
          <div className="font-syne font-extrabold text-3xl md:text-4xl text-terracotta mb-2">
            {data.uniquePages.toLocaleString()}
          </div>
          <div className="text-muted text-sm font-medium">Unique pages reached</div>
        </div>
      </div>

      {/* Two panels side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left panel: Bar chart */}
        <div className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] shadow-sm">
          <h3 className="font-syne font-bold text-lg md:text-xl text-charcoal mb-6 md:mb-8">Daily impressions</h3>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyImpressions} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#EDE8DF" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8E9299', fontSize: 12, fontFamily: 'DM Sans' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8E9299', fontSize: 12, fontFamily: 'DM Sans' }}
                />
                <Tooltip 
                  cursor={{ fill: '#FAF7F2' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #EDE8DF',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontFamily: 'DM Sans'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#C1572B" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right panel: Top pages table */}
        <div className="bg-white rounded-[20px] p-6 md:p-8 border border-[#EDE8DF] shadow-sm overflow-hidden flex flex-col">
          <h3 className="font-syne font-bold text-lg md:text-xl text-charcoal mb-6 md:mb-8">Top pages</h3>
          <div className="flex-1 overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr>
                  <th className="pb-4 font-sans font-medium text-xs text-muted uppercase tracking-wider border-b border-[#EDE8DF]">Page URL</th>
                  <th className="pb-4 font-sans font-medium text-xs text-muted uppercase tracking-wider border-b border-[#EDE8DF]">Impressions</th>
                  <th className="pb-4 font-sans font-medium text-xs text-muted uppercase tracking-wider border-b border-[#EDE8DF]">Last seen</th>
                </tr>
              </thead>
              <tbody className="font-sans text-[13px] text-charcoal">
                {data.topPages.map((page, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                    <td className="py-4 px-2 border-b border-[#EDE8DF]/50 truncate max-w-[150px] md:max-w-[200px]">{page.url}</td>
                    <td className="py-4 px-2 border-b border-[#EDE8DF]/50 font-medium">{page.impressions.toLocaleString()}</td>
                    <td className="py-4 px-2 border-b border-[#EDE8DF]/50 text-muted whitespace-nowrap">{page.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
