import { Metadata } from 'next';
import CustomerHeader from '@/app/ui/customers/customer-header';

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function CustomerPage() {
  return <CustomerHeader />;
}
