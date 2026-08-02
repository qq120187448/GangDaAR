import { useRef } from "react";
import { StyleSheet } from "react-native";
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARPlaneSelector,
  ViroARScene,
  ViroDirectionalLight,
  ViroText,
} from "@reactvision/react-viro";
import { MODEL_CATALOG } from "./modelCatalog";
import { setModelState, useModelStore } from "@/stores/modelStore";

const GangdaARScene = () => {
  const selectorRef = useRef<ViroARPlaneSelector>(null);
  const { modelIndex, placed, yaw, flipX } = useModelStore();

  const current = MODEL_CATALOG[modelIndex];
  const unitScale = current.scale;

  return (
    <ViroARScene
      onAnchorFound={(anchor) => selectorRef.current?.handleAnchorFound(anchor)}
      onAnchorUpdated={(anchor) =>
        selectorRef.current?.handleAnchorUpdated(anchor)
      }
      onAnchorRemoved={(anchor) =>
        anchor && selectorRef.current?.handleAnchorRemoved(anchor)
      }
    >
      <ViroAmbientLight color="#ffffff" intensity={260} />
      <ViroDirectionalLight
        color="#ffffff"
        direction={[0.4, -1, -0.3]}
        intensity={1.6}
      />

      {!placed && (
        <ViroText
          text="轻点地面，放置 2 米高模型"
          scale={[0.5, 0.5, 0.5]}
          position={[0, 0.4, -2.2]}
          style={styles.instruction}
        />
      )}

      <ViroARPlaneSelector
        ref={selectorRef}
        minHeight={0.15}
        minWidth={0.15}
        onPlaneSelected={() => setModelState({ placed: true })}
      >
        <Viro3DObject
          key={current.id}
          source={current.file}
          position={[0, 0, 0]}
          scale={[unitScale, unitScale, unitScale]}
          rotation={[flipX ? Math.PI : 0, yaw, 0]}
          type="GLB"
          dragType="FixedToPlane"
          dragPlane={{
            planePoint: [0, 0, 0],
            planeNormal: [0, 1, 0],
            maxDistance: 8,
          }}
        />
      </ViroARPlaneSelector>
    </ViroARScene>
  );
};

const styles = StyleSheet.create({
  instruction: {
    fontFamily: "Arial",
    fontSize: 28,
    color: "#ffffff",
    textAlignVertical: "center",
    textAlign: "center",
  },
});

export default GangdaARScene;
