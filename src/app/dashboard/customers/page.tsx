import { Metadata } from 'next';
import { fetchCustomersPages } from '@/src/lib/actions/customer-actions';
import CustomersTable from '@/src/components/customers/table';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/src/components/skeletons/skeletons';
import Pagination from '@/src/components/invoices/pagination';

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
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <CustomersTable query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
