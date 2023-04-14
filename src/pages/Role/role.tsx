import * as React from 'react'
import styles from '../index.less'
import { Demo1, Demo2, Demo3 } from './components'
import { useSearchParams } from 'umi'

const Roles: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const RoleDom = React.useMemo(() => {
    if (searchParams?.get('id') === '1') {
      return <Demo1 />
    } else if (searchParams?.get('id') === '2') {
      return <Demo2 />
    }
    return <Demo1 />
  }, [searchParams])

  return (
    <div>
      <p>This is Spin Role.</p>
      {RoleDom}
    </div>
  );
};

export default Roles;
