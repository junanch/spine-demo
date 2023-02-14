import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import styles from '../index.less'
import * as spine from "@esotericsoftware/spine-webgl";

interface SpineAnimation3Props {
  assetPath: string;
  fileName: string;
  animationName: string;
  scale: number;
}

const SpineAnimation3: React.FC<SpineAnimation3Props> = ({
  assetPath,
  fileName,
  animationName,
  scale,
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
    animationState?.update(delta);
    animationState?.apply(skeleton);
    skeleton?.updateWorldTransform();

    gl?.clearColor(0.2, 0.2, 0.2, 1);
    gl?.clear(gl.COLOR_BUFFER_BIT);

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

    const atlas = assetManager.get(
      fileName.replace("-pro", "").replace("-ess", "") + "-pma.atlas"
    );
    const atlasLoader = new spine.AtlasAttachmentLoader(atlas);

    const skeletonBinary = new spine.SkeletonBinary(atlasLoader);
    skeletonBinary.scale = scale;

    const skeletonData = skeletonBinary.readSkeletonData(
      assetManager.get(fileName + ".skel")
    );
    const skeleton = new spine.Skeleton(skeletonData);
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
    const assetManager = new spine.AssetManager(context, assetPath);
    assetManager?.loadTextureAtlas?.(
      fileName.replace("-pro", "").replace("-ess", "") + "-pma.atlas"
    );
    assetManager?.loadBinary?.(fileName + ".skel");
    timeKeeperRef.current = new spine.TimeKeeper();
    // requestAnimationFrame 函数调用完后会自动销毁
    requestAnimationFrame(() => load(assetManager))
  }, []);
  // 参数变化时，重新渲染
  useEffect(() => {
    requestAnimationFrame(() => render());
  }, [skeleton, animationState, gl, renderer])

  return <canvas ref={canvasRef} className={styles?.canvas} />
}


const Demo3: React.FC = () => {
  return (
    <div className={styles?.container}>
      <SpineAnimation3
        assetPath="/assets/"
        fileName="spineboy-pro"
        animationName="walk"
        scale={0.3}
      />
      <div className={styles?.skins}>skins</div>
    </div>
    // <SpineAnimation
    //   imageUrl='/assets/mix-and-match-pma.png'
    //   atlasUrl='/assets/mix-and-match-pma.atlas'
    //   jsonUrl='/assets/mix-and-match-pro.json'
    //   animationName=""
    // />
  )
}

export default Demo3