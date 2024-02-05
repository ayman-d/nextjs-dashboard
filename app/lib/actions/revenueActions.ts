'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';
import { Revenue } from '@/app/lib/definitions';

/**
 * @brief function to get revenue records from the database
 * @returns revenue data: Revenue[] | undefined
 */
export async function getRevenue(): Promise<Revenue[] | undefined> {
  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  // get the revenue records from the database
  const { data, error } = await supabase
    .from('revenue')
    .select('month, revenue');

  // if the request fails, throw an error
  if (error) {
    throw Error('Failed to fetch revenue data');
  }

  // return the revenue data
  return data;
}
