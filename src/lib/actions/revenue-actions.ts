'use server';

import { Revenue } from '@/src/lib/types/revenue-types';
import { unstable_noStore as noStore } from 'next/cache';
import sqlBuilder from '@/src/lib/actions/db';

/**
 * @brief function to get revenue records from the database
 * @returns revenue data: Revenue[]
 */
export async function getRevenue(): Promise<Revenue[]> {
  // specify that this function will not cache data
  noStore();

  // initialize item to hold the data returned from the DB
  let revenues: Revenue[];

  // create sql instance
  const sql = sqlBuilder();

  // get revenue records from the DB
  try {
    revenues = await sql<Revenue[]>`
      SELECT id, revenue FROM public.revenue
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to fetch revenues from DB.');
  }

  // convert revenue column (string) to numbers
  revenues.forEach((revenue) => {
    revenue.revenue = Number(revenue.revenue);
  });

  // return the revenue data
  return revenues;
}
