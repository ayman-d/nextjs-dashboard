'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';
import { Revenue } from '@/src/lib/types/definitions';

/**
 * @brief function to get revenue records from the database
 * @returns revenue data: Revenue[]
 */
export async function getRevenue(): Promise<Revenue[]> {
  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
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
