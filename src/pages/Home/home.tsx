import * as React from 'react';
import yayJpg from '@/assets/yay.jpg';
import { Roles } from '@/components'

export default function HomePage() {
  return (
    <div>
      <h2>Yay! Welcome!</h2>
      <p>
        <img src={yayJpg} width="388" />
      </p>
      <Roles />
    </div>
  );
}
