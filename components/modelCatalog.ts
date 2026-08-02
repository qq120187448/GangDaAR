export type ModelEntry = {
  id: string;
  name: string;
  file: number;
  scale: number;
};

export const MODEL_CATALOG: ModelEntry[] = [
  {
    id: "rx78",
    name: "RX-78-2 高达",
    file: require("@/assets/models/rx78.glb"),
    scale: 2,
  },
  {
    id: "zaku2",
    name: "夏亚专用扎古 II",
    file: require("@/assets/models/zaku2.glb"),
    scale: 2,
  },
  {
    id: "littlest_tokyo",
    name: "小东京",
    file: require("@/assets/models/littlest_tokyo.glb"),
    scale: 2,
  },
  {
    id: "kira",
    name: "基拉",
    file: require("@/assets/models/kira.glb"),
    scale: 2.1155,
  },
  {
    id: "bath_day",
    name: "浴衣少女",
    file: require("@/assets/models/bath_day.glb"),
    scale: 2,
  },
  {
    id: "miku",
    name: "初音未来",
    file: require("@/assets/models/miku.glb"),
    scale: 2,
  },
  {
    id: "doraemon",
    name: "哆啦A梦",
    file: require("@/assets/models/doraemon.glb"),
    scale: 2,
  },
  {
    id: "princess",
    name: "和风公主",
    file: require("@/assets/models/princess.glb"),
    scale: 2,
  },
  {
    id: "omega_sisters",
    name: "Ω姐妹",
    file: require("@/assets/models/omega_sisters.glb"),
    scale: 2,
  },
  {
    id: "saber",
    name: "Saber",
    file: require("@/assets/models/saber.glb"),
    scale: 2,
  },
  {
    id: "kakashi",
    name: "卡卡西",
    file: require("@/assets/models/kakashi.glb"),
    scale: 2,
  },
  {
    id: "raideen",
    name: "勇者莱丁",
    file: require("@/assets/models/raideen.glb"),
    scale: 2,
  },
];
