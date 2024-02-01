// HACK: the error handling here isn't good. revisit
'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';
import { InvoicesTable, LatestInvoice, Revenue } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';

// invoice schema object used by zod to represent the invoice form
const InvoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

// state representing the error states and messages relevant to invoices
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// create schemas that exclude fields that are not used by the forms we are expecting
const CreateInvoiceSchema = InvoiceFormSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = InvoiceFormSchema.omit({ id: true, date: true });

// number of items per page when fetching invoices
const ITEMS_PER_PAGE = 6;

/**
 * @brief function to create a new invoice
 * @param prevState status state passed to the useFormState hook
 * @param formData the form data submitted by the form
 * @returns state of the request which is used by the useFormState function
 */
export async function createInvoice(prevState: State, formData: FormData) {
  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  // validate the provided form data
  const validatedFields = CreateInvoiceSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // if form validation fails, return errors early. Otherwise, continue
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create invoice.',
    };
  }

  // extract data from the validated fields object
  const { customerId, amount, status } = validatedFields.data;
  // store the monetary amount in cents (avoid floats)
  const amountInCents = amount * 100;
  // create a new data at the time of submission
  const date = new Date().toISOString().split('T')[0];

  try {
    // attempt to create a new invoice using supabase
    const { error } = await supabase.from('invoices').insert([
      {
        customer_id: customerId,
        amount: amountInCents,
        status,
        date,
      },
    ]);

    if (error) {
      throw error;
    }
  } catch (error) {
    // otherwise update the error messsage
    return {
      message: 'Database Error: Failed to create invoice.',
    };
  }

  // revalidate the path so the cache is refreshed after data is posted
  revalidatePath('/dashboard/invoices');

  // redirect the user to the invoices page to see the new data
  redirect('/dashboard/invoices');
}

/**
 *
 * @param id id of invoice to be updated
 * @param prevState status state passed to the useFormState hook
 * @param formData the form data submitted by the form
 * @returns state of the request which is used by the useFormState function
 */
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  // validate the provided form data
  const validatedFields = UpdateInvoiceSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // if form validation fails, return errors early. Otherwise, continue
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to update invoice.',
    };
  }

  // extract data from the validated fields object
  const { customerId, amount, status } = validatedFields.data;

  // store the monetary amount in cents (avoid floats)
  const amountInCents = amount * 100;

  try {
    // attempt to update the invoice on supabase
    const { error } = await supabase
      .from('invoices')
      .update({
        customer_id: customerId,
        amount: amountInCents,
        status,
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    // otherwise update the error messsage
    return {
      message: `Database Error: Failed to update invoice`,
    };
  }

  // revalidate the path so the cache is refreshed after data is posted
  revalidatePath('/dashboard/invoices');

  // redirect the user to the invoices page to see the new data
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // write sql command
  try {
    await sql`
      DELETE FROM invoices WHERE id = ${id};
    `;
  } catch (error) {
    return {
      message: `Database Error: Failed to delete invoice ${id}`,
    };
  }

  revalidatePath('/dashboard/invoices');
}

/**
 * @brief function that returns the latest 5 invoices from the database
 * @returns latest invoice data: Invoice[] | undefined
 */
export async function getLatestInvoices(): Promise<
  LatestInvoice[] | undefined
> {
  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    // attempt to get the latest 5 invoices from the database
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, customers (name, image_url, email), id')
      .order('date', { ascending: false })
      .limit(5);
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
    // otherwise log the error
    console.log(error);
  }
}

// FIXME: I cannot get this to work with supabase.
// Needs more investigation. It might be good to return  all invoices and filter them in the client onChange

/**
 * function that returns the number of pages of invoices after filtering based on the query param
 * @param query search query text
 * @returns pages of invoice data after filtering based on the query param
 */
export async function fetchInvoicesPages(query: string) {
  noStore();

  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}
