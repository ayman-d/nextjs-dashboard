'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/database.types';

// create a zod schema to represent the form data
const FormSchema = z.object({
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

// error state type to be used for form validation
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// exclude fields that are not provided by the form
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

/**
 * @brief Function to create a new invoice
 * @param prevState previous state of the form (not used here, but required by the action)
 * @param formData the form data submitted by the form
 * @returns null
 */
export async function createInvoice(prevState: State, formData: FormData) {
  // validate the provided form data
  // safeParse returns success or error
  const validatedFields = CreateInvoice.safeParse({
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

  // write sql command
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to create invoice.',
    };
  }

  // revalidate the path so the cache is refreshed after data is posted
  revalidatePath('/dashboard/invoices');

  // redirect the user to the invoices page to see the new data
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // validate the provided form data
  const validatedFields = UpdateInvoice.safeParse({
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

  // write sql command
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: `Database Error: Failed to update invoice ${id}`,
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

// function to authenticate users logging in
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const IdentityFormSchema = z.object({
  email: z
    .string({
      invalid_type_error: 'Please enter an email.',
    })
    .min(1, { message: 'Email is required.' })
    .email('Please enter a valid email.'),
  password: z
    .string({
      invalid_type_error: 'Please enter a password.',
    })
    .min(1, { message: 'Password is required.' }),
});

export type IdentityState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

// function that logs user in using supabase
export async function loginAction(
  prevState: IdentityState,
  formData: FormData,
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  const validatedFields = IdentityFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  // if form validation fails, return errors early. Otherwise, continue
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Incompleted Submission. Failed to login.',
    };
  }

  const { email, password } = validatedFields.data;

  try {
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // redirect the user to the main page after they login
    redirect('/dashboard');
  } catch (error) {
    return {
      message: 'Invalid credentials. Failed to login.',
    };
  }
}

// function that logs user out using supabase
export async function logoutAction() {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
  try {
    await supabase.auth.signOut();
  } catch (error) {
    throw error;
  }

  // redirect the user to the main page after they logout
  redirect('/');
}
