import  React from 'react'
import styles from './index.less'

const Roles: React.FC = () => {
  return (
    <div>
      <p>This is umi Role.</p>
      <div className={styles?.container}>
        <aside className={styles?.preview}>preview</aside>
        <div className={styles?.skins}></div>
      </div>
    </div>
  );
};

export default Roles;
