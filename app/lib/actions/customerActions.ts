import { sql } from '@vercel/postgres';
import {
  CustomerMinified,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
} from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/database.types';

/**
 * function to get list of customers
 * @returns list of customers
 */
export async function fetchCustomers() {
  // specify that this function will not cache data
  noStore();

  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
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

// FIXME: complete this function (convert sql into supabase client call)
/**
 * function that returns customers based on the query param
 * @param query search query string
 * @returns list of customers based on search params: CustomerTableType[] | undefined
 */
export async function fetchFilteredCustomers(query: string) {
  // specify that this function will not cache data
  noStore();

  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  // fetch the list of customers from the database based on the query param
  const { data, error } = await supabase
    .from('customers')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true });

  try {
    const data = await sql<CustomersTableType>`
          SELECT
            customers.id,
            customers.name,
            customers.email,
            customers.image_url,
            COUNT(invoices.id) AS total_invoices,
            SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
            SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
          FROM customers
          LEFT JOIN invoices ON customers.id = invoices.customer_id
          WHERE
            customers.name ILIKE ${`%${query}%`} OR
          customers.email ILIKE ${`%${query}%`}
          GROUP BY customers.id, customers.name, customers.email, customers.image_url
          ORDER BY customers.name ASC
        `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
