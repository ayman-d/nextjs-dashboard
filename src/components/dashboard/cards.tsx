'use client';

import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/src/components/common/fonts';

const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

interface CardWrapperProps {
  totalPaidInvoices: string;
  totalPendingInvoices: string;
  numberOfInvoices: number;
  numberOfCustomers: number;
}

export default async function CardWrapper({
  cardData,
}: {
  cardData: CardWrapperProps;
}) {
  return (
    <>
      {/* NOTE: comment in this code when you get to this point in the course */}

      <Card
        title="Collected"
        value={cardData.totalPaidInvoices}
        type="collected"
      />
      <Card
        title="Pending"
        value={cardData.totalPendingInvoices}
        type="pending"
      />
      <Card
        title="Total Invoices"
        value={cardData.numberOfInvoices}
        type="invoices"
      />
      <Card
        title="Total Customers"
        value={cardData.numberOfCustomers}
        type="customers"
      />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'customers' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}
