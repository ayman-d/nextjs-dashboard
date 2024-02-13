'use server';

import {
  Customer,
  CustomerSimple,
  CustomersTableType,
} from '@/src/lib/types/definitions';
import { formatCurrency } from '@/src/lib/utility/utils';
import { unstable_noStore as noStore } from 'next/cache';
import { Database } from '@/database.types';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * function to get list of customers
 * @returns list of customers: CustomerSimple[]
 */
export async function fetchCustomers(): Promise<CustomerSimple[]> {
  // specify that this function will not cache data
  noStore();

  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // fetch the list of customers from the database
  const { data, error } = await supabase
    .from('customers')
    .select('id, name')
    .order('name', { ascending: true });

  // if the request fails, throw an error
  if (error) {
    throw Error('Failed to fetch customers');
  }

  return data;
}

/**
 * function that returns customers based on the query param
 * @param query search query string
 * @returns list of customers based on search params: CustomerTableType[] | undefined
 */
export async function fetchFilteredCustomers(
  query: string,
): Promise<CustomersTableType> {
  // specify that this function will not cache data
  noStore();

  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // get the filtered customers based on the query param
  const { data, error } = await supabase.rpc('fetch_filtered_customers', {
    query,
  });

  // if the request fails, throw an error
  if (error) {
    throw Error('Failed to fetch filtered customers');
  }

  // format the total_pending and total_paid fields to currency
  try {
    var customers: CustomersTableType[] = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (error) {
    // otherwise throw error
    throw Error("Failed to fetch customers' data");
  }

  // return the first item in the array (should only be one item)
  return customers[0];
}
