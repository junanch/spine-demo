import React, { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle } from "react";
import styles from '../index.less'
import * as spine from "@esotericsoftware/spine-webgl"
import classNames from 'classnames'

type loadSkeletonChange = ({
  skeleton
}: {
  skeleton: spine.Skeleton | null
}) => void;

interface SpineAnimationProps {
  atlasPath: string;
  skelPath: string;
  animationName: string;
  spinRef?: React.MutableRefObject<SpinRef | undefined>
  loadSkeletonChange?: loadSkeletonChange;
}

export interface SpinRef {
  setSkin?: (name: string) => void
  setSkins?: () => void
  setAnimation?: (name: string) => void 
}

const SpineAnimation: React.FC<SpineAnimationProps> = ({
  atlasPath,
  skelPath,
  animationName,
  spinRef,
  loadSkeletonChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeKeeperRef = useRef(new spine.TimeKeeper());

  const [gl, setGl] = useState<WebGLRenderingContext | null>(null); 
  const [renderer, setRenderer] = useState<spine.SceneRenderer | null>(null);
  const [skeleton, setSkeleton] = useState<spine.Skeleton | null>(null);
  const [animationState, setAnimationState] = useState<spine.AnimationState | null>(null);

  // 渲染循环执行
  const render = useCallback(() => {
    if (!skeleton || !animationState || !gl || !renderer) return
    timeKeeperRef.current.update();
    const delta = timeKeeperRef.current.delta;

    if (!skeleton) return;
    gl?.clearColor(0.2, 0.2, 0.2, 1);
    gl?.clear(gl.COLOR_BUFFER_BIT);

    animationState?.update(delta);
    animationState?.apply(skeleton);
    skeleton?.updateWorldTransform();

    renderer?.resize(spine.ResizeMode.Fit);
    renderer?.begin();
    renderer?.drawSkeleton(skeleton, true);
    renderer?.end();

    requestAnimationFrame(() => render())
  }, [skeleton, animationState, gl, renderer]);
  // 加载资源完成后，生成 skeleton 和 animationState
  const load = useCallback((assetManager: spine.AssetManager) => {
    timeKeeperRef.current.update();
    if (!assetManager?.isLoadingComplete()) {
      requestAnimationFrame(() => load(assetManager));
      return;
    }

    const atlas = assetManager.get(atlasPath);
    const atlasLoader = new spine.AtlasAttachmentLoader(atlas);

    const skeletonBinary = new spine.SkeletonBinary(atlasLoader);
    skeletonBinary.scale = 0.4;

    const skeletonData = skeletonBinary.readSkeletonData(assetManager.get(skelPath));
    const skeleton = new spine.Skeleton(skeletonData);
    skeleton.setSkinByName("full-skins/girl-blue-cape");
    setSkeleton(skeleton);

    const stateData = new spine.AnimationStateData(skeleton.data);
    const animationState = new spine.AnimationState(stateData);
    stateData.defaultMix = 0;
    animationState.setAnimation(0, animationName, true);
    setAnimationState(animationState)
  }, [render]);

  // 挂载时，初始化 canvas，开始加载资源
  useEffect(() => {
    if (!canvasRef.current) return;
    let canvas = canvasRef.current;
    canvas.width = canvas?.clientWidth || 100;
    canvas.height = canvas?.clientHeight || 100;
    const context = new spine.ManagedWebGLRenderingContext(canvas, { alpha: false });
    setGl(context.gl)
    setRenderer(new spine.SceneRenderer(canvas, context))
    const assetManager = new spine.AssetManager(context);
    assetManager?.loadTextureAtlas?.(atlasPath);
    assetManager?.loadBinary?.(skelPath);
    timeKeeperRef.current = new spine.TimeKeeper();
    requestAnimationFrame(() => load(assetManager))
  }, []);
  // 参数变化时，重新渲染
  useEffect(() => {
    requestAnimationFrame(() => render());
    loadSkeletonChange?.({
      skeleton
    })
  }, [skeleton, animationState, gl, renderer])
  // 暴露给外部的方法
  useImperativeHandle(spinRef, () => ({
    setSkin: (name) => {
      // 1. 清除旧的皮肤，2. 添加新的皮肤
      if (skeleton?.data) {
        skeleton?.setSkinByName?.(name);
        skeleton.setSlotsToSetupPose();
        setSkeleton(skeleton);
      }
    },
    setSkins: () => {
      // remove old list
      // remove new list
    },
    setAnimation: (name) => {
      // 1. 清除旧的动画，2. 添加新的动画
      if (skeleton?.data) {
			  skeleton.setToSetupPose();
        animationState?.setAnimation?.(0, name, true);
        setAnimationState(animationState)
      }
    },
  }))

  return <canvas ref={canvasRef} className={styles?.canvas} />
}

const Demo3: React.FC = () => {
  const spineRef = useRef<SpinRef>()
  // 换装列表
  const [skins, setSkins] = useState<spine.Skin[]>()
  // 动画列表
  const [animations, setAnimations] = useState<spine.Animation[]>()
  const [activeSkin, setActiveSkin] = useState<spine.Skin>()
  const [activeAnimation, setActiveAnimation] = useState<spine.Animation>()
  useEffect(() => {
    if (activeSkin?.name) {
      spineRef.current?.setSkin?.(activeSkin?.name)
    }
  }, [activeSkin])
  useEffect(() => {
    if (activeAnimation?.name) {
      spineRef.current?.setAnimation?.(activeAnimation?.name)
    }
  }, [activeAnimation])

  return (
    <div>
      <h2>Role 3</h2>
      <div className={styles?.container}>
        <div className={styles?.left}>
          <SpineAnimation
            spinRef={spineRef}
            atlasPath="/assets/mix-and-match-pma.atlas"
            skelPath="/assets/mix-and-match-pro.skel"
            animationName="walk"
            loadSkeletonChange={({ skeleton }) => {
              const { skins, animations } = skeleton?.data || {}
              setSkins(skins)
              setAnimations(animations)
            }}
          />
        </div>
        <div className={styles?.right}>
          <h2>换装（{skins?.length || 0}）</h2>
          <ul className={styles?.skins}>
            {skins?.map?.((skin, index) => (
              <li
                key={skin?.name}
                className={classNames({ [styles?.active]: skin?.name === activeSkin?.name })}
                onClick={() => setActiveSkin(skin)}
              >
                {skin?.name}
              </li>
            ))}
          </ul>

          <h2>动画（{animations?.length || 0}）</h2>
          <ul className={styles?.animations}>
            {animations?.map?.((animation, index) => (
              <li
                key={animation?.name}
                className={classNames({ [styles?.active]: animation.name === activeAnimation?.name })}
                onClick={() => setActiveAnimation(animation)}
              >
                {animation?.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Demo3