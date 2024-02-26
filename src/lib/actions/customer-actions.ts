'use server';

import {
  CustomerSimple,
  CustomersTableType,
  CustomersTableTypeRaw,
} from '@/src/lib/types/customer-types';
import { formatCurrency } from '@/src/lib/utility/utils';
import { unstable_noStore as noStore } from 'next/cache';
import sql from '@/src/lib/actions/db';
import postgres from 'postgres';

// number of items per page when fetching invoices
const ITEMS_PER_PAGE = 6;

/**
 * function to get list of customers names
 * @returns list of customers: CustomerSimple[]
 */
export async function fetchCustomerNames(): Promise<CustomerSimple[]> {
  // specify that this function will not cache data
  noStore();

  let data: CustomerSimple[] = [];

  try {
    data = await sql`
      SELECT id, name
      FROM public.customers
      ORDER BY name ASC;
    `;
  } catch (error) {
    console.log(data);
    throw new Error('Failed to get customers names from DB.');
  }

  return data;
}

/**
 * function that returns the number of pages of customers after filtering based on the query param
 * @param query search query text
 * @returns pages of customer data after filtering based on the query param
 */
export async function fetchCustomersPages(query: string): Promise<number> {
  // specify that this function will not cache data
  noStore();

  let count: postgres.RowList<postgres.Row[]>;

  try {
    count = await sql`
      SELECT COUNT(*)
      FROM public.customers
      WHERE
        customers.name ilike ${`%${query}%`} or
        customers.email ilike ${`%${query}%`};
    `;
  } catch (error) {
    console.log(error);
    throw new Error(
      'Failed to get number of filtered customers pages from DB.',
    );
  }

  // calculate the number of pages from the total number of invoices returned
  try {
    return Math.ceil(count[0].count / ITEMS_PER_PAGE);
  } catch (error) {
    // otherwise throw error
    throw Error('Failed to calculate the number of pages');
  }
}

/**
 * function that returns customers based on the query param
 * @param query search query string
 * @returns list of customers based on search params: CustomerTableType[]
 */
export async function fetchFilteredCustomers(
  query: string,
  currentPage: number,
): Promise<CustomersTableType[]> {
  // specify that this function will not cache data
  noStore();

  // define the page offset (0 indexed)
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let data: CustomersTableTypeRaw[] = [];

  try {
    data = await sql`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id),
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) as total_paid
      FROM public.customers
      LEFT JOIN public.invoices ON public.customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY public.customers.name ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to get filtered customers from DB.');
  }

  let customers: CustomersTableType[] = [];

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
  return customers;
}
