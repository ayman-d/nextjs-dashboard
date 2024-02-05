'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Button, NavBar, RedButton } from 'profire-react-lib';

export default function CustomerHeader() {
  const [isPink, setIsPink] = useState(false);
  function changeBg() {
    setIsPink(!isPink);
  }

  return (
    <div
      className={clsx(
        isPink ? 'bg-pink-200' : 'bg-blue-200',
        'block h-8 w-40 space-y-2 p-1 text-center align-middle',
      )}
    >
      <p>Customers Page</p>

      <button
        className="mt-2 rounded-md border border-gray-400 px-1 py-1 text-gray-800 hover:bg-gray-500 hover:text-gray-50 "
        onClick={changeBg}
      >
        Change BG
      </button>

      <hr />

      <Button label="New Button" />
      <RedButton label="Red Button" />
      <NavBar />
    </div>
  );
}
