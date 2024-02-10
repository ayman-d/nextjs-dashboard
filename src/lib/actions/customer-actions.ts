'use server';

import { CustomersTableType } from '@/src/lib/types/definitions';
import { formatCurrency } from '@/src/lib/utility/utils';
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

/**
 * function to get list of customers
 * @returns list of customers
 */
export async function fetchCustomers() {
  // specify that this function will not cache data
  noStore();

  // initialize the cookie and supabase client objects
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
): Promise<CustomersTableType | undefined> {
  // object to be returned once the request is done
  let customers: CustomersTableType[] = [];

  // specify that this function will not cache data
  noStore();

  // initialize the cookie and supabase client objects
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
    customers = data.map((customer) => ({
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
