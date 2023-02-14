import * as React from 'react'
import styles from '../index.less'
import * as Spine from '@esotericsoftware/spine-webgl'
import { Demo1, Demo2, Demo3 } from './components'

const Roles: React.FC = () => {

  return (
    <div>
      <p>This is umi Role.</p>
      {/* <h2>demo1</h2> */}
      {/* <Demo1 /> */}
      {/* <h2>demo2</h2> */}
      {/* <Demo2 /> */}
      <h2>demo3</h2>
      <Demo3 />
    </div>
  );
};

export default Roles;
