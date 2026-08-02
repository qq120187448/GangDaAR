import { Pressable, StyleSheet, Text, View } from "react-native";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GangdaARScene from "@/components/GangdaARScene";
import { MODEL_CATALOG } from "@/components/modelCatalog";
import { setModelState, useModelStore } from "@/stores/modelStore";

const ARHome = () => {
  const insets = useSafeAreaInsets();
  const { placed, modelIndex, yaw, flipX, depthReady } = useModelStore();

  const current = MODEL_CATALOG[modelIndex];

  const prevModel = () => {
    const next = modelIndex === 0 ? MODEL_CATALOG.length - 1 : modelIndex - 1;
    setModelState({ modelIndex: next });
  };

  const nextModel = () => {
    const next =
      modelIndex === MODEL_CATALOG.length - 1 ? 0 : modelIndex + 1;
    setModelState({ modelIndex: next });
  };

  const rotateModel = () => {
    setModelState({ yaw: yaw + Math.PI / 2 });
  };

  const flipModel = () => {
    setModelState({ flipX: !flipX });
  };

  const resetPlacement = () => {
    setModelState({ placed: false });
  };

  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        initialScene={{ scene: GangdaARScene }}
        style={styles.arNavigator}
        worldAlignment="Gravity"
        occlusionMode="depthBased"
        depthEnabled
        hdrEnabled
        pbrEnabled
        bloomEnabled
        shadowsEnabled
        multisamplingEnabled
      />

      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <Text style={styles.topTitle}>高达AR · 动漫模型</Text>
        <Text style={styles.topCount}>
          {modelIndex + 1} / {MODEL_CATALOG.length}
        </Text>
      </View>

      <View style={[styles.bottomBar, { bottom: insets.bottom + 14 }]}>
        <Pressable style={styles.roundButton} onPress={prevModel}>
          <Text style={styles.roundButtonText}>‹</Text>
        </Pressable>

        <View style={styles.modelInfo}>
          <Text style={styles.modelName} numberOfLines={1}>
            {current.name}
          </Text>
          <Text style={styles.modelHint}>
            {placed
              ? `拖动移动 · ${depthReady ? "LiDAR 遮挡就绪" : "深度数据初始化中"}`
              : "轻点地面或墙面放置"}
          </Text>
        </View>

        <Pressable style={styles.roundButton} onPress={nextModel}>
          <Text style={styles.roundButtonText}>›</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={rotateModel}>
          <Text style={styles.actionButtonText}>旋转</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={flipModel}>
          <Text style={styles.actionButtonText}>翻转</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={resetPlacement}>
          <Text style={styles.actionButtonText}>重放</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f14",
  },
  arNavigator: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(10, 14, 20, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  topCount: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(10, 14, 20, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonText: {
    color: "#ffffff",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "600",
  },
  modelInfo: {
    flex: 1,
    minWidth: 0,
  },
  modelName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  modelHint: {
    color: "rgba(255, 255, 255, 0.62)",
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0, 170, 255, 0.24)",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ARHome;
