import { Suspense } from 'react';
import CardWrapper from '@/src/components/dashboard/cards';
import { CardSkeleton } from '@/src/components/skeletons/skeletons';
import RevenueChart from '@/src/components/dashboard/revenue-chart';
import LatestInvoices from '@/src/components/dashboard/latest-invoices';
import { lusitana } from '@/src/components/common/fonts';
import { RevenueChartSkeleton } from '@/src/components/skeletons/skeletons';
import { LatestInvoicesSkeleton } from '@/src/components/skeletons/skeletons';
import { Metadata } from 'next';
import { fetchCardData } from '@/src/lib/actions/invoice-actions';
import { CardData } from '@/src/lib/types/invoice-types';

export const metadata: Metadata = {
  title: 'Overview',
};

export default async function Page() {
  const cardData: CardData = await fetchCardData();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardSkeleton />}>
          <CardWrapper cardData={cardData} />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </Suspense>

        <Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices />
        </Suspense>
      </div>
    </main>
  );
}
