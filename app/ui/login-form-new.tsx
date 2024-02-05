'use client';

import { login } from '@/app/lib/actions/authActions';
import { useFormState } from 'react-dom';

export default function LoginForm() {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(login, initialState);

  return (
    <div className="min-w-11 max-w-2xl">
      <form
        action={dispatch}
        className="m-3 rounded-md border border-blue-500 bg-gray-100 px-7 pb-10 pt-5"
      >
        <h3 className="mb-3 text-center text-lg text-blue-700">
          Please log in to continue
        </h3>
        <label htmlFor="email" className="text-s block">
          Email
        </label>
        <input name="email" className="relative block rounded-sm" />
        {state.errors?.email &&
          state.errors.email.map((error: string) => (
            <p className="text-xs text-red-500" key={error}>
              {error}
            </p>
          ))}
        <label htmlFor="password" className="mt-4 block">
          Password
        </label>
        <input
          type="password"
          name="password"
          className="relative mb-7 block rounded-sm"
        />
        {state.errors?.password &&
          state.errors.password.map((error: string) => (
            <p className="fixed -mt-6 text-xs text-red-500" key={error}>
              {error}
            </p>
          ))}

        <button className="mt-12 block rounded-sm border border-blue-600 bg-blue-300 px-5 py-1 text-blue-800 hover:bg-blue-100 hover:text-blue-400">
          Sign In
        </button>

        {state.message && (
          <p className="fixed mt-3 text-xs text-red-500" key={state.message}>
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
