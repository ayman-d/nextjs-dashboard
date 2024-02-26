'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import {
  CardData,
  Invoice,
  InvoiceForm,
  InvoicesTable,
  LatestInvoice,
  LatestInvoiceRaw,
} from '@/src/lib/types/invoice-types';
import { formatCurrency } from '@/src/lib/utility/utils';
import sql from './db';
import postgres from 'postgres';

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
  try {
    await sql`
      DELETE public.invoices
      WHERE id = ${id}
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to delete invoice from DB.');
  }

  // redirect the user to the invoices page to see the new data
  revalidatePath('/dashboard/invoices');
}

/**
 * @brief function that returns the latest 5 invoices from the database
 * @returns latest invoice data: Invoice[]
 */
export async function getLatestInvoices(): Promise<LatestInvoice[]> {
  // specify that this function will not cache data
  noStore();

  let data: LatestInvoiceRaw[] = [];

  try {
    data = await sql`
    SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    ORDER BY invoices.date DESC
    LIMIT 5;
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to fetch latest invoices from DB.');
  }

  // Convert amount from cents to dollars. use .map because the data is an array
  const latestInvoices: LatestInvoice[] = data.map((invoice) => ({
    id: invoice.id,
    name: invoice.name,
    image_url: invoice.image_url,
    email: invoice.email,
    amount: formatCurrency(invoice.amount),
  }));

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

  let count: postgres.RowList<postgres.Row[]>;

  try {
    count = await sql`
    SELECT COUNT(*)
    FROM public.invoices JOIN public.customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ilike ${`%${query}%`} or
      customers.email ilike ${`%${query}%`} or
      invoices.amount::text ilike ${`%${query}%`} or
      invoices.date::text ilike ${`%${query}%`} or
      invoices.status ilike ${`%${query}%`};
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to get number of filtered invoices pages from DB.');
  }

  try {
    // calculate the number of pages from the total number of invoices returned
    return Math.ceil(count[0].count / ITEMS_PER_PAGE);
  } catch (error) {
    console.log(error);
    throw new Error('Failed to count number of invoice pages.');
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

  // define the page offset (0 indexed)
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let data: InvoicesTable[] = [];

  try {
    data = await sql`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM public.invoices
      JOIN public.customers ON public.invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY public.invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to get filtered invoices from DB.');
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
  // specify that this function will not cache data
  noStore();

  let data: Invoice[] = [];

  try {
    data = await sql`
      SELECT id, customer_id, amount, status
      FROM public.invoices
      WHERE id = ${invoiceId}
    `;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to get invoice by id from DB.');
  }

  // object to be returned once the request is done
  let invoices: InvoiceForm[] = [];

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

  let invoiceCountPromise = sql`SELECT * FROM public.invoices`;
  let customerCountPromise = sql`SELECT * FROM public.customers`;
  let invoiceStatusPromise = sql`
    SELECT 
      SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) as "paid", 
      SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) as "pending"
      FROM public.invoices;
    `;

  try {
    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const cardData: CardData = {
      numberOfInvoices: data[0].count,
      numberOfCustomers: data[1].count,
      totalPaidInvoices: formatCurrency(data[2][0].paid),
      totalPendingInvoices: formatCurrency(data[2][0].pending),
    };

    return cardData;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to get raw card data from DB.');
  }
}
