'use client';

import styles from './customer-header.module.scss';
import clsx from 'clsx';
import { useState } from 'react';

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
    </div>
  );
}
