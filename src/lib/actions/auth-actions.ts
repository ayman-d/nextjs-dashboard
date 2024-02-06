'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';

// identity schema object used by zod to represent the identity form
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

// state representing the error states and messages relevant to the user's identity
export type IdentityState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

/**
 * @brief function to log the user in
 * @param prevState previous state of the form (not used here, but required by the action)
 * @param formData the form data submitted by the form
 * @returns state of the request which is used by the useFormState function
 */
export async function login(prevState: IdentityState, formData: FormData) {
  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  // validate the provided form data
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

  // destructure the email and password from the validated fields
  const { email, password } = validatedFields.data;

  try {
    // attempt to log the user in using supabase
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // upon successful login: redirect the user to the dashboard
    redirect('/dashboard');
  } catch (error) {
    // otherwise update the error message
    return {
      message: 'Invalid credentials. Failed to login.',
    };
  }
}

/**
 * @brief function to log the user out
 * @returns null
 */
export async function logout() {
  // initialize the cookie and supabase client objects
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    // attempt to log the user out using supabase
    await supabase.auth.signOut();
  } catch (error) {
    throw error;
  }

  // upon successful logout: redirect the user to the main page
  redirect('/');
}
