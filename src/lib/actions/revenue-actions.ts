'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';
import { Revenue } from '@/src/lib/types/revenue-types';
import postgres from 'postgres';

const sql = postgres({
  host: 'aws-0-ca-central-1.pooler.supabase.com',
  database: 'postgres',
  port: 5432,
  user: 'postgres.yhicazhgeuiszmdmcmoz',
  password: '3or#S!#UKGK74s',
});

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

  const stuff = await sql`
    SELECT id, amount FROM public.invoices limit 5;
  `;

  const stuff2 = await sql<Revenue[]>`
  SELECT id, revenue FROM public.revenue limit 5;
  `;

  stuff2.map((item) => (item.revenue = Number(item.revenue)));

  console.log(stuff);
  console.log('brr');
  console.log(stuff2);
  console.log('zrr');

  // return the revenue data
  return data;
}
