'use client';

import styles from './customer-header.module.scss';
import clsx from 'clsx';
import { useState } from 'react';
import { Button, NavBar, RedButton } from 'profire-react-lib';
import { fetchInvoicesPages } from '@/app/lib/actions/invoiceActions';

export default function CustomerHeader() {
  const [isPink, setIsPink] = useState(false);
  function changeBg() {
    setIsPink(!isPink);
  }

  return (
    <div
      className={clsx(
        isPink ? styles.customerBackgroundPink : styles.customerBackgroundBlue,
        styles.customerBackground,
      )}
    >
      <p>Customers Page</p>

      <button onClick={changeBg}>Change BG</button>

      <hr className={styles.mainHr} />

      <Button label="New Button" />
      <RedButton label="Red Button" />
      <NavBar />
      <button onClick={() => fetchInvoicesPages('del')}>JD</button>
    </div>
  );
}
