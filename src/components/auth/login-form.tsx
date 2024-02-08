'use client';

import { lusitana } from '@/src/components/common/fonts';
import { AtSymbolIcon, KeyIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '../common/button';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from '@/src/lib/actions/auth-actions';
import { useEffect, useState } from 'react';
import { LoginErrorState } from '@/src/lib/actions/auth-actions';

export default function LoginForm() {
  // set a local state to track the error state of the useFormState hook
  const [cachedErrorState, setCachedErrorState] = useState<LoginErrorState>({
    errors: {},
    message: null,
  });

  // use the useFormState hook to handle form state and errors
  const [formErrorState, dispatch] = useFormState(login, cachedErrorState);

  // update the local state when the formErrorState changes
  useEffect(() => {
    setCachedErrorState({
      errors: formErrorState.errors,
      message: formErrorState.message,
    });
  }, [formErrorState]);

  // clear the error state when the user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCachedErrorState({ errors: {}, message: null });
  };

  return (
    <form
      action={dispatch}
      className="flex items-center justify-center space-y-12"
    >
      <div className="max-w-2xl flex-1 rounded-lg bg-blue-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-center text-2xl`}>
          Please log in to continue.
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                name="email"
                placeholder="Enter your email address"
                onChange={handleInputChange}
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            {cachedErrorState.errors?.email &&
              cachedErrorState.errors.email.map((error: string) => (
                <p className="mt-1 text-xs text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                onChange={handleInputChange}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            {cachedErrorState.errors?.password &&
              cachedErrorState.errors.password.map((error: string) => (
                <p className="mt-1 text-xs text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        <LoginButton />
        {cachedErrorState.message && (
          <p
            className="fixed mt-3 text-xs text-red-500"
            key={cachedErrorState.message}
          >
            {cachedErrorState.message}
          </p>
        )}
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        ></div>
        <div className="flex h-8 items-end space-x-1"></div>
      </div>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="mt-4 w-full" aria-disabled={pending}>
      Log in <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
    </Button>
  );
}
