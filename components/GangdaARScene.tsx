import { useRef, useState } from "react";
import { StyleSheet } from "react-native";
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARPlaneSelector,
  ViroARScene,
  ViroDirectionalLight,
  ViroMaterials,
  ViroQuad,
  ViroText,
} from "@reactvision/react-viro";
import { MODEL_CATALOG } from "./modelCatalog";
import { setModelState, useModelStore } from "@/stores/modelStore";

ViroMaterials.createMaterials({
  shadowCatcher: {
    diffuseColor: "rgba(0, 0, 0, 0)",
    blendMode: "Alpha",
    cullMode: "None",
  },
});

const GangdaARScene = () => {
  const selectorRef = useRef<ViroARPlaneSelector>(null);
  const { modelIndex, placed, yaw, flipX } = useModelStore();
  const [ambientLight, setAmbientLight] = useState({
    color: "#ffffff",
    intensity: 300,
  });

  const current = MODEL_CATALOG[modelIndex];
  const unitScale = current.scale;

  const onAmbientLightUpdate = (update: {
    intensity: number;
    color: string;
  }) => {
    setAmbientLight({
      color: update.color || "#ffffff",
      intensity: Math.min(1000, Math.max(160, update.intensity)),
    });
  };

  return (
    <ViroARScene
      onAmbientLightUpdate={onAmbientLightUpdate}
      onAnchorFound={(anchor) => selectorRef.current?.handleAnchorFound(anchor)}
      onAnchorUpdated={(anchor) =>
        selectorRef.current?.handleAnchorUpdated(anchor)
      }
      onAnchorRemoved={(anchor) =>
        anchor && selectorRef.current?.handleAnchorRemoved(anchor)
      }
    >
      <ViroAmbientLight
        color={ambientLight.color}
        intensity={ambientLight.intensity}
      />
      <ViroDirectionalLight
        color={ambientLight.color}
        direction={[0.4, -1, -0.3]}
        intensity={1.6}
        castsShadow
        shadowMapSize={2048}
        shadowBias={0.002}
        shadowOpacity={0.55}
        shadowOrthographicSize={4}
      />

      {!placed && (
        <ViroText
          text="轻点地面或墙面，放置模型"
          scale={[0.5, 0.5, 0.5]}
          position={[0, 0.4, -2.2]}
          style={styles.instruction}
        />
      )}

      <ViroARPlaneSelector
        ref={selectorRef}
        minHeight={0.15}
        minWidth={0.15}
        alignment="Both"
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
          lightReceivingBitMask={3}
          shadowCastingBitMask={2}
        />
        <ViroQuad
          position={[0, 0.002, 0]}
          rotation={[-90, 0, 0]}
          width={3}
          height={3}
          materials={["shadowCatcher"]}
          lightReceivingBitMask={2}
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
