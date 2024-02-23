'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import type { Database } from '@/database.types';
import {
  createServerActionClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  CardData,
  InvoiceForm,
  InvoicesTable,
  LatestInvoice,
} from '@/src/lib/types/invoice-types';
import { formatCurrency } from '@/src/lib/utility/utils';
import sqlBuilder from './db';

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
export type InvoiceActionErrorState = {
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
export async function createInvoice(
  prevState: InvoiceActionErrorState,
  formData: FormData,
): Promise<InvoiceActionErrorState> {
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

  // create sql instance
  const sql = sqlBuilder();

  // create a new invoice in the DB
  try {
    await sql`
      INSERT into public.invoices(
        customer_id, 
        amount, 
        status, 
        date
      )
      VALUES (
        ${customerId}, 
        ${amountInCents}, 
        ${status}, 
        ${date}
      )
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to add new invoice to the DB.');
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
  prevState: InvoiceActionErrorState,
  formData: FormData,
): Promise<InvoiceActionErrorState> {
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

  // create sql instance
  const sql = sqlBuilder();

  // update the invoice on the DB
  try {
    await sql`
      UPDATE public.invoices
      SET
        customer_id = ${customerId},
        amount = ${amountInCents},
        status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to update invoice on the DB.');
  }

  // revalidate the path so the cache is refreshed after data is posted
  revalidatePath('/dashboard/invoices');

  // redirect the user to the invoices page to see the new data
  redirect('/dashboard/invoices');
}

/**
 * function that deletes an invoice based on the id
 * @param id id of invoice to be deleted
 * @returns void
 */
export async function deleteInvoice(id: string) {
  // initialize the supabase client
  const supabase = createServerActionClient<Database>({
    cookies,
  });

  // delete the invoice based on the id
  const { error } = await supabase.from('invoices').delete().eq('id', id);

  // if the request fails, throw an error
  if (error) {
    throw Error('Failed to delete invoice');
  }

  // redirect the user to the invoices page to see the new data
  revalidatePath('/dashboard/invoices');
}

/**
 * @brief function that returns the latest 5 invoices from the database
 * @returns latest invoice data: Invoice[]
 */
export async function getLatestInvoices(): Promise<LatestInvoice[]> {
  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // attempt to get the latest 5 invoices from the database
  const { data, error } = await supabase
    .from('invoices')
    .select('amount, customers (name, image_url, email), id')
    .order('date', { ascending: false })
    .limit(5);

  // if the request fails, throw an error
  if (error) {
    throw Error("Failed to fetch the latest invoices' data");
  }

  // Convert amount from cents to dollars. use .map because the data is an array
  try {
    var latestInvoices = data.map((invoice) => ({
      id: invoice.id,
      name: invoice.customers!.name,
      image_url: invoice.customers!.image_url!,
      email: invoice.customers!.email,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    // otherwise log the error
    throw Error("Failed to format the latest invoices' data");
  }

  // return the latest invoices
  return latestInvoices;
}

/**
 * function that returns the number of pages of invoices after filtering based on the query param
 * @param query search query text
 * @returns pages of invoice data after filtering based on the query param
 */
export async function fetchInvoicesPages(query: string): Promise<number> {
  // specify that this function will not cache data
  noStore();

  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // get the filtered invoices based on the query param
  const { data, error } = await supabase.rpc('fetch_filtered_invoices', {
    query: query,
  });

  // if the request fails, throw an error
  if (error) {
    throw Error('Failed to fetch the number of invoice pages');
  }

  // calculate the number of pages from the total number of invoices returned
  try {
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  } catch (error) {
    // otherwise throw error
    throw Error('Failed to calculate the number of pages');
  }
}

/**
 * @brief function that returns invoices based on the query param
 * @param query search query text
 * @param currentPage number of page of the retrieved invoices
 * @returns invoice data based on search params: InvoiceTable[]
 */
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
): Promise<InvoicesTable[]> {
  // specify that this function will not cache data
  noStore();

  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // define the page offset (0 indexed)
  const offsetStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const offsetEnd = offsetStart + ITEMS_PER_PAGE - 1;

  // get the invoices based on the query param
  const { data, error } = await supabase
    .rpc('fetch_filtered_invoices', {
      query: query,
    })
    .order('date', { ascending: false })
    .range(offsetStart, offsetEnd);

  // if the request fails, throw an error
  if (error) {
    throw Error('Failed to fetch invoices');
  }

  // return the invoices
  return data;
}

/**
 * function that returns a single invoice based on the id
 * @param id id of invoice to be fetched
 * @returns the invoice data based on the id: InvoiceForm
 */
export async function fetchInvoiceById(
  invoiceId: string,
): Promise<InvoiceForm> {
  // object to be returned once the request is done
  let invoices: InvoiceForm[] = [];

  // specify that this function will not cache data
  noStore();

  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // get the invoice based on the id
  const { data, error } = await supabase
    .from('invoices')
    .select('id, customer_id, amount, status')
    .eq('id', invoiceId)
    .returns<InvoiceForm[]>();

  // if the request fails, throw an error
  if (error) {
    throw Error('Failed to fetch the invoice data');
  }

  // Convert amount from cents to dollars. use .map because the data is an array
  try {
    invoices = data.map((invoice) => ({
      ...invoice,
      amount: invoice.amount / 100,
    }));
  } catch (error) {
    // otherwise throw error
    throw Error("Failed to format the invoice's data");
  }

  // return the first item in the array (should only be one item)
  return invoices[0];
}

export async function fetchCardData(): Promise<CardData> {
  // specify that this function will not cache data
  noStore();

  // initialize the supabase client
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // get card data from the database
  const { data, error } = await supabase.rpc('get_card_data', {});

  // if the request fails, throw an error
  if (error) {
    throw new Error('Failed to fetch card data.');
  }

  try {
    // populate the card data object with the correct data format for each field
    var cardData: CardData = {
      numberOfInvoices: data[0].invoices_count,
      numberOfCustomers: data[0].customers_count,
      totalPaidInvoices: formatCurrency(data[0].total_invoices_paid),
      totalPendingInvoices: formatCurrency(data[0].total_invoices_pending),
    };
  } catch (error) {
    // throw error if this fails
    throw Error('Failed to format card data');
  }

  // return the card data
  return cardData;
}
