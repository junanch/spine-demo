import React from 'react'
import styles from './index.less'
import classNames from 'classnames';
import { history } from 'umi'

const Roles: React.FC = () => {
  const roles = React.useMemo(() => {
    return [
      {
        id: 1,
        name: 'Demo1',
        disable: false
      },
      {
        id: 2,
        name: 'Demo2',
        disable: false
      },
      {
        id: 3,
        name: 'Demo3',
        disable: false
      },
    ]
  }, [])

  return (
    <div>
      <h2>Roles</h2>
      <ul className={styles?.roles}>
        {roles?.map?.((role) => (
          <li
            key={role?.id}
            className={classNames({ [styles?.disabled]: role?.disable })}
            onClick={() => {
              history.push({
                pathname: '/role',
                search: new URLSearchParams({
                  id: role?.id.toString()
                }).toString(),
              })
            }}
          >
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
