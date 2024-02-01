// HACK: the error handling here isn't good. revisit
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';
import { LatestInvoice, Revenue } from './definitions';
import { formatCurrency } from './utils';

/**
 * @brief Function to get revenue records from the database
 * @returns revenue data: Revenue[] | undefined
 */
export async function getRevenue(): Promise<Revenue[] | undefined> {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('month, revenue');
    if (error) {
      console.log(error);

      throw error;
    }
    return data;
  } catch (error) {
    console.log(error);
  }
}

/**
 * @brief Function that returns the latest invoice data from the database
 * @returns latest invoice data: Invoice[] | undefined
 */
export async function getLatestInvoices(): Promise<
  LatestInvoice[] | undefined
> {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, customers (name, image_url, email), id');
    if (error) {
      console.log(error);

      throw error;
    }

    const latestInvoices: LatestInvoice[] = data.map((invoice) => ({
      id: invoice.id,
      name: invoice.customers!.name,
      image_url: invoice.customers!.image_url!,
      email: invoice.customers!.email,
      amount: formatCurrency(invoice.amount),
    }));

    return latestInvoices;
  } catch (error) {
    console.log(error);
  }
}
