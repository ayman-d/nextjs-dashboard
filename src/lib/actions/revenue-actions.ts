'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';
import { Revenue } from '@/src/lib/types/definitions';

/**
 * @brief function to get revenue records from the database
 * @returns revenue data: Revenue[] | undefined
 */
export async function getRevenue(): Promise<Revenue[] | undefined> {
  // initialize the cookie and supabase client objects
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
