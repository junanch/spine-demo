import React, { useEffect, useRef, useState } from "react";
import styles from '../index.less'
import * as spine from "@esotericsoftware/spine-webgl";

const THUMBNAIL_SIZE = 100;

interface AppProps {}

const Demo: React.FC<AppProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [atlas, setAtlas] = useState<spine.TextureAtlas>();
  const [skeletonData, setSkeletonData] = useState<spine.SkeletonData>();
  const [skeleton, setSkeleton] = useState<spine.Skeleton>();
  const [state, setState] = useState<spine.AnimationState>();
  const [selectedSkins, setSelectedSkins] = useState<string[]>([]);
  const [skinThumbnails, setSkinThumbnails] = useState<{[key: string]: HTMLImageElement}>({});
  const [lastBounds, setLastBounds] = useState<{
    offset: spine.Vector2;
    size: spine.Vector2;
  }>({ offset: new spine.Vector2(), size: new spine.Vector2() });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new spine.SpineCanvas(canvasRef.current, {
      pathPrefix: 'assets/',
      app: {
        loadAssets: (canvas: spine.SpineCanvas) => {
          canvas.assetManager.loadTextureAtlas("mix-and-match-pma.atlas");
          canvas.assetManager.loadBinary("mix-and-match-pro.skel");
        },
        initialize: (canvas: spine.SpineCanvas) => {
          let assetManager = canvas.assetManager;
          let atlas = canvas.assetManager.require("mix-and-match-pma.atlas");
          let atlasLoader = new spine.AtlasAttachmentLoader(atlas);

          let skeletonBinary = new spine.SkeletonBinary(atlasLoader);
          let skeletonData = skeletonBinary.readSkeletonData(assetManager.require("mix-and-match-pro.skel"));
          let skeleton = new spine.Skeleton(skeletonData);

          let stateData = new spine.AnimationStateData(skeletonData);
          let state = new spine.AnimationState(stateData);
          state?.setAnimation?.(0, "dance", true);

          let renderer = canvas.renderer;         
				  let images = [];
          let skinThumbnails: Record<string, any> = {};
          let lastBounds: Record<string, any> = {}
          for (var skin of skeletonData.skins) {
            if (skin.name === "default") continue;

            let image: HTMLImageElement  = new Image();
            image.src = canvas.htmlCanvas.toDataURL();
            // @ts-ignore
            image.skinName = skin.name;
            // @ts-ignore
            image.isSet = false;
            image.style.filter = "grayscale(1)";
            images.push(image);
            // @ts-ignore
            skinThumbnails[image.skinName] = image;
          }

          const updateSkin = () => {
            let newSkin = new spine.Skin("custom-skin");
            for (var skinName of selectedSkins) {
              const skinData = skeletonData?.findSkin?.(skinName)
              if (skinData) {
                newSkin.addSkin(skinData);
              }
            }
            skeleton.setSkin(newSkin);
            skeleton.setToSetupPose();
            skeleton.updateWorldTransform();

            let offset = new spine.Vector2(), size = new spine.Vector2();
            skeleton.getBounds(offset, size);
            lastBounds = { offset: offset, size: size };
          }

          const addSkin = (skinName: string) => {
            if (selectedSkins.indexOf(skinName) != -1) return;
            selectedSkins.push(skinName);
            // let thumbnail = skinThumbnails[skinName];
            // thumbnail.isSet = true;
            // thumbnail.style.filter = "none";
            updateSkin();
          }

          addSkin("skin-base");
          addSkin("nose/short");
          addSkin("eyelids/girly");
          addSkin("eyes/violet");
          addSkin("hair/brown");
          addSkin("clothes/hoodie-orange");
          addSkin("legs/pants-jeans");
          addSkin("accessories/bag");
          addSkin("accessories/hat-red-yellow");
          setSkeleton(skeleton)
          setState(state)
          setSkeletonData(skeletonData)
          setSelectedSkins(selectedSkins)
        },
        update: (canvas: spine.SpineCanvas, delta: number) => {
          state?.update?.(delta);
          if (skeleton) {
            state?.apply?.(skeleton);
            skeleton?.updateWorldTransform?.();
          }
        },
        render: (canvas: spine.SpineCanvas) => {
          let renderer = canvas.renderer;
          // let camera = renderer.camera;
          renderer.resize(spine.ResizeMode.Expand);
          // let offset = this.lastBounds.offset, size = this.lastBounds.size;
          // camera.position.x = offset.x + size.x / 2;
          // camera.position.y = offset.y + size.y / 2;
          // camera.zoom = size.x > size.y ? size.x / this.canvas.htmlCanvas.width * 1.1 : size.y / this.canvas.htmlCanvas.height * 1.1;
          // camera.update();
  
          canvas.clear(0.2, 0.2, 0.2, 1);
          renderer.begin();
          if (skeleton) {
            renderer.drawSkeleton(skeleton, true);
          }
          renderer.end();
        }
      }
    });
  }, []);

  useEffect(() => {
    // if (!skeletonData) return;

    // setSkeleton(new spine.Skeleton(skeletonData));

    // const stateData = new spine.AnimationStateData(skeletonData);
    // setState(new spine.AnimationState(stateData));
    // state?.setAnimation?.(0, "dance", true);

    // Create a default skin.
    // addSkin("skin-base");
    // addSkin("nose/short");
    // addSkin("eyelids/girly");
    // addSkin("eyes/violet");
    // addSkin("hair/brown");
    // addSkin("clothes/hoodie-orange");
    // addSkin("legs/pants-jeans");
    // addSkin("accessories/bag");
    // addSkin("accessories/hat-red-yellow");

    // Generate skin thumbnails
    // let thumbnails: { [key: string]: HTMLImageElement } = {};
    // for (const skin of skeletonData.skins) {
    //   if (skin.name === "default") continue;

    //   const thumbnail = document.createElement("img");
    //   thumbnail.width = thumbnail.height = THUMBNAIL_SIZE;
    //   thumbnail.style.filter = "grayscale(1)";
    //   thumbnail.onclick = () => {
    //     if (selectedSkins.indexOf(skin.name) !== -1) {
    //       // removeSkin(skin.name);
    //     } else {
    //       // addSkin(skin.name);
    //     }
    //   };

      // const renderer = canvasRef.current?.renderer;
      // const camera = renderer?.camera;
      // const oldWidth = canvasRef.current?.width;
      // const oldHeight = canvasRef.current?.height;
      // canvasRef.current.width = canvasRef.current.height = THUMBNAIL_SIZE;
      // renderer?.gl.viewport(0,)
    // }
  }, [skeletonData]);

  return (
    <div className={styles?.container}>
      <div className={styles?.left}>
        <canvas ref={canvasRef} className={styles?.canvas} />
      </div>
      <div className={styles?.right}>
        <div className={styles?.skins}>skins</div>
        <div className={styles?.animations}>animations</div>
      </div>
    </div>
  )
}
export default Demo;