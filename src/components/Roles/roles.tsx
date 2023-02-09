import React from 'react'
import styles from './index.less'

const Roles: React.FC = () => {
  const roles = React.useMemo(() => {
    return [
      {
        id: 1,
        name: 'Dress Up',
      },
      {
        id: 2,
        name: 'Skins',
      }
    ]
  }, [])

  return (
    <div>
      <h2>Roles</h2>
      <ul className={styles?.roles}>
        {roles?.map?.((role) => (
          <li key={role?.id}>
            <a>
              <div className={styles?.cover}></div>
              <div className={styles?.title}>{role?.name}</div>
            </a>
          </li>
        ))} 
      </ul>
    </div>
  );
};

export default Roles;
