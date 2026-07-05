import React from 'react';
import Link from 'next/link';
import VisitorManager from '@/components/admin/VisitorManager';
import { getVisitorDashboardData } from '@/actions/visitorActions';
import AdminClock from '../../../../components/admin/AdminClock';
import { logoutAction } from '@/actions/adminActions';
import BackButton from '@/components/admin/BackButton';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function VisitorManagementPage() {
  const { visitors, totalVisitors, todayVisitors, activeVisitors, blockRules, weeklyIncreaseRate, weeklyTrend, browserStats } = await getVisitorDashboardData();

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans">
      <AdminSidebar activePath="visitor" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="Visitors" />
          <div className="flex items-center gap-3">
            <BackButton />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100/80">
                Logout
              </button>
            </form>
          </div>
        </header>

        <div className="w-full md:w-11/12 lg:w-3/5" style={{ minWidth: '900px' }}>
          <VisitorManager 
            initialVisitors={visitors} 
            totalVisitors={totalVisitors} 
            todayVisitors={todayVisitors} 
            activeVisitors={activeVisitors} 
            initialBlockRules={blockRules}
            weeklyIncreaseRate={weeklyIncreaseRate}
            weeklyTrend={weeklyTrend}
            browserStats={browserStats}
          />
        </div>
      </main>
    </div>
  );
}
