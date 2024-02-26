import { Metadata } from 'next';
import { fetchCustomersPages } from '@/src/lib/actions/customer-actions';
import CustomersTable from '@/src/components/customers/table';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/src/components/skeletons/skeletons';
import Pagination from '@/src/components/invoices/pagination';
import Search from '@/src/components/common/search';
import { lusitana } from '@/src/components/common/fonts';

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function CustomerPage({
  searchParams,
}: Readonly<{
  searchParams?: { query?: string; page?: string };
}>) {
  const query = searchParams?.query ?? '';
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages: number = await fetchCustomersPages(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search customers..." />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <CustomersTable query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
