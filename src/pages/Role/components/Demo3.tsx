import React, { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle } from "react";
import styles from '../index.less'
import * as spine from "@esotericsoftware/spine-webgl"
import classNames from 'classnames'
import { Role } from '@/constants'

type loadSkeletonChange = ({
  skeleton
}: {
  skeleton: spine.Skeleton | null
}) => void;

interface SpineAnimationProps {
  atlasPath: string;
  skelPath: string;
  skinName?: string;
  animationName?: string;
  spinRef?: React.MutableRefObject<SpinRef | undefined>
  loadSkeletonChange?: loadSkeletonChange;
}

export interface SpinRef {
  setSkin?: (skin: string) => void
  setSkins?: (skins: string[]) => void
  setAnimation?: (animation: string) => void 
}

const SpineAnimation: React.FC<SpineAnimationProps> = ({
  atlasPath,
  skelPath,
  skinName,
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
    skeletonBinary.scale = 0.3;

    const skeletonData = skeletonBinary.readSkeletonData(assetManager.get(skelPath));
    const skeleton = new spine.Skeleton(skeletonData);
    const [firstSkin] = skeleton?.data?.skins || []
    skeleton.setSkinByName(skinName || firstSkin?.name);
    setSkeleton(skeleton);

    const stateData = new spine.AnimationStateData(skeleton.data);
    const animationState = new spine.AnimationState(stateData);
    stateData.defaultMix = 0;
    const [firstAnimation] = skeleton?.data?.animations || []
    animationState.setAnimation(0, animationName || firstAnimation?.name, true);
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
    setSkin: (skin) => {
      // 1. 清除旧的皮肤，2. 添加新的皮肤
      if (skeleton?.data) {
        skeleton?.setSkinByName?.(skin);
        skeleton.setSlotsToSetupPose();
        setSkeleton(skeleton);
      }
    },
    setSkins: (skins) => {
      if (skeleton?.data) {
        let newSkin = new spine.Skin("custom-skin");
        for (let skinName of skins) {
          // @ts-ignore
					newSkin.addSkin(skeleton.data.findSkin(skinName));
				}
        skeleton.setSkin(newSkin);
        skeleton.setToSetupPose();
        skeleton.updateWorldTransform()
        setSkeleton(skeleton);
      }
    },
    setAnimation: (animation) => {
      // 1. 清除旧的动画，2. 添加新的动画
      if (skeleton?.data) {
			  skeleton.setToSetupPose();
        animationState?.setAnimation?.(0, animation, true);
        setAnimationState(animationState)
      }
    },
  }))

  return <canvas ref={canvasRef} className={styles?.canvas} />
}

interface SkinsType {
  [Role.身体]: spine.Skin[],
  [Role.脸部]: spine.Skin[],
  [Role.头发]: spine.Skin[],
  [Role.衣着]: spine.Skin[],
}

const Demo3: React.FC = () => {
  const spineRef = useRef<SpinRef>()
  // 换装列表
  const [skins, setSkins] = useState<SkinsType>({
    [Role.身体]: [],
    [Role.脸部]: [],
    [Role.头发]: [],
    [Role.衣着]: [],
  })
  // 动画列表
  const [animations, setAnimations] = useState<spine.Animation[]>()
  const [activeSkinNames, setActiveSkinNames] = useState<string[]>([])
  const [activeAnimationName, setActiveAnimationName] = useState('')
  const onUpdateActiveSkinNames = useCallback(({ name, fieldName }: { name: string, fieldName: string }) => {
    const list = activeSkinNames.filter((name) => !name.includes(fieldName))
    const newList = [ ...list, name ]
    setActiveSkinNames(newList)
  }, [activeSkinNames])
  useEffect(() => {
    if (activeSkinNames?.length > 0) {
      spineRef.current?.setSkins?.(activeSkinNames)
    }
  }, [activeSkinNames])
  useEffect(() => {
    if (activeAnimationName) {
      spineRef.current?.setAnimation?.(activeAnimationName)
    }
  }, [activeAnimationName])

  return (
    <div>
      <h2>Role 3</h2>
      <div className={styles?.container}>
        <div className={styles?.left}>
          <SpineAnimation
            spinRef={spineRef}
            atlasPath="/assets/woman+换装/woman_B.atlas"
            skelPath="/assets/woman+换装/woman_B.skel"
            // skinName={activeSkinName}
            animationName={activeAnimationName}
            loadSkeletonChange={({ skeleton }) => {
              const { skins = [], animations = [] } = skeleton?.data || {}
              let newSkins: SkinsType = {
                [Role.身体]: [],
                [Role.脸部]: [],
                [Role.头发]: [],
                [Role.衣着]: [],
              }
              for (let skin of skins) {
                if (skin?.name?.includes(Role.身体)) {
                  newSkins[Role.身体].push(skin)
                }
                if (skin?.name?.includes(Role.脸部)) {
                  newSkins[Role.脸部].push(skin)
                }
                if (skin?.name?.includes(Role.头发)) {
                  newSkins[Role.头发].push(skin)
                }
                if (skin?.name?.includes(Role.衣着)) {
                  newSkins[Role.衣着].push(skin)
                }
              }
              setSkins(newSkins)
              const [body] = newSkins[Role.身体]
              const [face] = newSkins[Role.脸部]
              const [hair] = newSkins[Role.头发]
              const [cloth] = newSkins[Role.衣着]
              setActiveSkinNames([body?.name, face?.name, hair?.name, cloth?.name])

              setAnimations(animations)
              const [firstAnimation] = animations || []
              if (!activeAnimationName) {
                setActiveAnimationName(firstAnimation?.name)
              }
            }}
          />
        </div>
        <div className={styles?.right}>
          <h2>身体（{skins[Role.身体]?.length || 0}）</h2>
          <ul className={styles?.skins}>
            {skins?.[Role.身体]?.map?.((skin, index) => (
              <li
                key={skin?.name}
                className={classNames({ [styles?.active]: activeSkinNames.includes(skin?.name) })}
                onClick={() => {
                  onUpdateActiveSkinNames({ name: skin?.name, fieldName: Role.身体  })
                }}
              >
                {skin?.name}
              </li>
            ))}
          </ul>

          <h2>脸部（{skins[Role.脸部]?.length || 0}）</h2>
          <ul className={styles?.skins}>
            {skins?.[Role.脸部]?.map?.((skin, index) => (
              <li
                key={skin?.name}
                className={classNames({ [styles?.active]: activeSkinNames.includes(skin?.name) })}
                onClick={() => onUpdateActiveSkinNames({ name: skin?.name, fieldName: Role.脸部})}
              >
                {skin?.name}
              </li>
            ))}
          </ul>

          <h2>衣着（{skins[Role.衣着]?.length || 0}）</h2>
          <ul className={styles?.skins}>
            {skins?.[Role.衣着]?.map?.((skin, index) => (
              <li
                key={skin?.name}
                className={classNames({ [styles?.active]: activeSkinNames.includes(skin?.name) })}
                onClick={() => onUpdateActiveSkinNames({ name: skin?.name, fieldName: Role.衣着 })}
              >
                {skin?.name}
              </li>
            ))}
          </ul>

          <h2>头发（{skins[Role.头发]?.length || 0}）</h2>
          <ul className={styles?.skins}>
            {skins?.[Role.头发]?.map?.((skin, index) => (
              <li
                key={skin?.name}
                className={classNames({ [styles?.active]: activeSkinNames.includes(skin?.name) })}
                onClick={() => onUpdateActiveSkinNames({ name: skin?.name, fieldName: Role.头发 })}
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
                className={classNames({ [styles?.active]: animation.name === activeAnimationName })}
                onClick={() => setActiveAnimationName(animation?.name)}
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