'use client';

import styles from './customer-header.module.scss';
import clsx from 'clsx';
import { useState } from 'react';
import { Button } from '@ayman-d/npm-lib-test';

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
    </div>
  );
}
