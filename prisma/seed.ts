// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** 文字列スラグ化（シリーズ用の疑似バーコード生成） */
const slug = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[（）()[\]\s・、，,\/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/* ===============================
 * 1) 食材辞書（OK / CAUTION / NG）
 * =============================== */
type DictItem = { code: string; name: string };

const OK_ITEMS: DictItem[] = [
  { code: "INGR_OK_001", name: "鶏むね肉（加熱・無味）" },
  { code: "INGR_OK_002", name: "鶏ささみ（加熱・無味）" },
  { code: "INGR_OK_003", name: "七面鳥（加熱・無味）" },
  { code: "INGR_OK_004", name: "牛赤身（加熱・無味・少量）" },
  { code: "INGR_OK_005", name: "豚赤身（加熱・無味・少量）" },
  { code: "INGR_OK_006", name: "羊赤身（加熱・無味・少量）" },
  { code: "INGR_OK_007", name: "サーモン（加熱・骨なし・時々）" },
  { code: "INGR_OK_008", name: "白身魚（タラ等・加熱・骨なし）" },
  { code: "INGR_OK_009", name: "卵（加熱のみ・時々）" },
  { code: "INGR_OK_010", name: "プレーンヨーグルト（無糖・少量）" },
  { code: "INGR_OK_011", name: "チーズ（硬質・少量）" },
  { code: "INGR_OK_012", name: "白米（やわらかく炊く・少量）" },
  { code: "INGR_OK_013", name: "オートミール（柔らかく煮る・少量）" },
  { code: "INGR_OK_014", name: "にんじん（加熱・刻む・少量）" },
  { code: "INGR_OK_015", name: "ブロッコリー（加熱・少量）" },
  { code: "INGR_OK_016", name: "いんげん（加熱・少量）" },
  { code: "INGR_OK_017", name: "アスパラガス（加熱・少量）" },
  { code: "INGR_OK_018", name: "かぼちゃ（ピューレ・無糖）" },
  { code: "INGR_OK_019", name: "セロリ（加熱・微量）" },
  { code: "INGR_OK_020", name: "カリフラワー（加熱・少量）" },
  { code: "INGR_OK_021", name: "えんどう豆（加熱・少量）" },
  { code: "INGR_OK_022", name: "ブルーベリー（2〜3粒・時々）" },
  { code: "INGR_OK_023", name: "りんご（種・芯なし・少量）" },
  { code: "INGR_OK_024", name: "バナナ（少量）" },
  { code: "INGR_OK_025", name: "メロン（種皮除去・少量）" },
  { code: "INGR_OK_026", name: "スイカ（種皮除去・少量）" },
  { code: "INGR_OK_027", name: "いちご（少量）" },
  { code: "INGR_OK_028", name: "タウリン" },
  { code: "INGR_OK_029", name: "ビタミン類" },
  { code: "INGR_OK_030", name: "ミネラル類" },
  { code: "INGR_OK_031", name: "まぐろ" },
  { code: "INGR_OK_032", name: "かつお" },
  { code: "INGR_OK_033", name: "ほたてエキス" },
];

const CAUTION_ITEMS: DictItem[] = [
  { code: "INGR_C_001", name: "アボカド（脂質・種誤嚥リスク／少量でも基本は避ける）" },
  { code: "INGR_C_002", name: "レバー類（ビタミンA過剰に注意・ごく少量）" },
  { code: "INGR_C_003", name: "青魚の過剰給餌（長期は避ける）" },
  { code: "INGR_C_004", name: "穀類" },
  { code: "INGR_C_005", name: "トウモロコシ" },
  { code: "INGR_C_006", name: "小麦粉" },
  { code: "INGR_C_007", name: "米" },
  { code: "INGR_C_008", name: "コーングルテンミール" },
  { code: "INGR_C_009", name: "小麦グルテン" },
  { code: "INGR_C_010", name: "大豆タンパク" },
  { code: "INGR_C_011", name: "ビートパルプ" },
  { code: "INGR_C_012", name: "オリゴ糖" },
  { code: "INGR_C_013", name: "セルロース" },
  { code: "INGR_C_014", name: "セルロースパウダー" },
  { code: "INGR_C_015", name: "でん粉" },
  { code: "INGR_C_016", name: "動物性油脂" },
  { code: "INGR_C_017", name: "フィッシュオイル" },
  { code: "INGR_C_018", name: "チキンミール" },
  { code: "INGR_C_019", name: "ポークミール" },
  { code: "INGR_C_020", name: "フィッシュミール" },
  { code: "INGR_C_021", name: "魚粉" },
  { code: "INGR_C_022", name: "酵母" },
  { code: "INGR_C_023", name: "酵母エキス" },
  { code: "INGR_C_024", name: "調味料" },
  { code: "INGR_C_025", name: "増粘多糖類" },
  { code: "INGR_C_026", name: "魚介類（総称）" },
  { code: "INGR_C_027", name: "牛乳" },
];

const NG_ITEMS: DictItem[] = [
  { code: "INGR_NG_001", name: "玉ねぎ（ネギ類全般）" },
  { code: "INGR_NG_002", name: "にんにく（ネギ類）" },
  { code: "INGR_NG_003", name: "長ネギ・チャイブ・リーキ（ネギ類）" },
  { code: "INGR_NG_004", name: "チョコレート／ココア" },
  { code: "INGR_NG_005", name: "コーヒー・紅茶・緑茶（カフェイン）" },
  { code: "INGR_NG_006", name: "アルコール飲料" },
  { code: "INGR_NG_007", name: "酵母入り生地（発酵生地）" },
  { code: "INGR_NG_008", name: "ブドウ・レーズン" },
  { code: "INGR_NG_009", name: "キシリトール（人工甘味料）" },
  { code: "INGR_NG_010", name: "α-リポ酸（人用サプリ）" },
  { code: "INGR_NG_011", name: "生魚・生肉・生卵" },
  { code: "INGR_NG_012", name: "生骨（窒息・穿孔リスク）" },
  { code: "INGR_NG_013", name: "加工肉の常食（高塩分・香辛料）" },
  { code: "INGR_NG_014", name: "ユリ科植物（ゆり根等）" },
  { code: "INGR_NG_015", name: "マカダミアナッツ" },
  { code: "INGR_NG_016", name: "貝（生の貝）" },
  { code: "INGR_NG_017", name: "甲殻類（えび・かに等・生）" },
  { code: "INGR_NG_018", name: "プラム" },
  { code: "INGR_NG_019", name: "いちじく" },
  { code: "INGR_NG_020", name: "パパイヤ" },
  { code: "INGR_NG_021", name: "マンゴー" },
  { code: "INGR_NG_022", name: "青トマト" },
  { code: "INGR_NG_023", name: "生ジャガイモ" },
  { code: "INGR_NG_024", name: "トマトの葉・茎" },
];

/** upsert（辞書） */
async function upsertDict(item: DictItem, brand: "OK" | "CAUTION" | "NG") {
  await prisma.product.upsert({
    where: { barcode: item.code },
    update: {
      name: item.name,
      brand,
      ingredients_text: item.name.replace(/（.*?）/g, ""),
      image: "",
      source: "guideline",
    },
    create: {
      barcode: item.code,
      name: item.name,
      brand,
      ingredients_text: item.name.replace(/（.*?）/g, ""),
      image: "",
      source: "guideline",
    },
  });
}

/* ===================================
 * 2) 国産キャットフード（シリーズSKU）
 * =================================== */
type Variant = {
  form: "dry" | "pouch" | "can" | "treat";
  label: string;
  lifeStage?: string;
  flavor?: string;      // schema側は default ""（非NULL）
  features?: string;
  ingredients_text: string;
  proteinMin?: number;
  fatMin?: number;
  fiberMax?: number;
  ashMax?: number;
  moistureMax?: number;
  kcalPer100g?: number;
};

type Series = {
  brand: string;
  name: string;         // シリーズ名
  image?: string;
  source?: string;
  ingredients_text?: string; // 共通あれば
  variants: Variant[];
};

const SERIES: Series[] = [
  {
    brand: "ユニ・チャーム",
    name: "銀のスプーン",
    variants: [
      {
        form: "dry", label: "子猫用", lifeStage: "子猫",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、酵母、セルロース、ビタミン類、ミネラル類、タウリン",
        proteinMin: 30, fatMin: 20, fiberMax: 5, ashMax: 8, moistureMax: 10, kcalPer100g: 385,
      },
      {
        form: "dry", label: "成猫用", lifeStage: "成猫",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、酵母、セルロース、ビタミン類、ミネラル類、タウリン",
        proteinMin: 30, fatMin: 20, fiberMax: 4, ashMax: 7, moistureMax: 10, kcalPer100g: 385,
      },
      { form: "dry", label: "7歳〜", lifeStage: "シニア",
        ingredients_text:
          "穀類、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、酵母、セルロース、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 20, fiberMax: 5, ashMax: 8, moistureMax: 10, kcalPer100g: 385 },
      { form: "dry", label: "10歳〜", lifeStage: "シニア",
        ingredients_text:
          "穀類、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、酵母、セルロース、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 20, fiberMax: 5, ashMax: 8, moistureMax: 10, kcalPer100g: 385 },
      { form: "dry", label: "13歳〜", lifeStage: "シニア",
        ingredients_text:
          "穀類、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、酵母、セルロース、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 20, fiberMax: 5, ashMax: 8, moistureMax: 10, kcalPer100g: 385 },
      { form: "dry", label: "15歳〜", lifeStage: "シニア",
        ingredients_text:
          "穀類、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、酵母、セルロース、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 20, fiberMax: 5, ashMax: 8, moistureMax: 10, kcalPer100g: 385 },
      { form: "dry", label: "20歳まで", lifeStage: "シニア",
        ingredients_text:
          "穀類、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、酵母、セルロース、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 20, fiberMax: 5, ashMax: 8, moistureMax: 10, kcalPer100g: 385 },

      { form: "pouch", label: "一般", flavor: "まぐろ/かつお/ささみ",
        ingredients_text:
          "魚介類（まぐろ、かつお等）、チキン、小麦グルテン、動物性油脂、調味料、増粘多糖類、ビタミン、ミネラル、タウリン",
        proteinMin: 8, fatMin: 1, fiberMax: 0.5, ashMax: 3, moistureMax: 87 },
    ],
  },

  {
    brand: "ユニ・チャーム",
    name: "オールウェル（AllWell）",
    variants: [
      { form: "dry", label: "子猫", lifeStage: "子猫",
        ingredients_text:
          "トウモロコシ、チキンミール、フィッシュミール、セルロースパウダー、動物性油脂、オリゴ糖、酵母エキス、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 15, fiberMax: 6, ashMax: 7, moistureMax: 10, kcalPer100g: 360 },
      { form: "dry", label: "成猫", lifeStage: "成猫",
        ingredients_text:
          "トウモロコシ、チキンミール、フィッシュミール、セルロースパウダー、動物性油脂、オリゴ糖、酵母エキス、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 15, fiberMax: 6, ashMax: 7, moistureMax: 10, kcalPer100g: 360 },
      { form: "dry", label: "7歳以上", lifeStage: "シニア",
        ingredients_text:
          "トウモロコシ、チキンミール、フィッシュミール、セルロースパウダー、動物性油脂、オリゴ糖、酵母エキス、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 15, fiberMax: 6, ashMax: 7, moistureMax: 10, kcalPer100g: 360 },
      { form: "dry", label: "10歳以上", lifeStage: "シニア",
        ingredients_text:
          "トウモロコシ、チキンミール、フィッシュミール、セルロースパウダー、動物性油脂、オリゴ糖、酵母エキス、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 15, fiberMax: 6, ashMax: 7, moistureMax: 10, kcalPer100g: 360 },
      { form: "dry", label: "15歳以上", lifeStage: "シニア",
        ingredients_text:
          "トウモロコシ、チキンミール、フィッシュミール、セルロースパウダー、動物性油脂、オリゴ糖、酵母エキス、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 15, fiberMax: 6, ashMax: 7, moistureMax: 10, kcalPer100g: 360 },
    ],
  },

  {
    brand: "日本ペットフード",
    name: "ラシーネ",
    variants: [
      { form: "dry", label: "子猫", lifeStage: "子猫",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、魚粉、動物性油脂、ビートパルプ、酵母、ビタミン類、ミネラル類、タウリン",
        proteinMin: 28, fatMin: 9, fiberMax: 5, ashMax: 9, moistureMax: 10, kcalPer100g: 360 },
      { form: "dry", label: "成猫", lifeStage: "成猫",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、魚粉、動物性油脂、ビートパルプ、酵母、ビタミン類、ミネラル類、タウリン",
        proteinMin: 28, fatMin: 9, fiberMax: 5, ashMax: 9, moistureMax: 10, kcalPer100g: 360 },
      { form: "dry", label: "シニア（11歳以上）", lifeStage: "シニア",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、魚粉、動物性油脂、ビートパルプ、酵母、ビタミン類、ミネラル類、タウリン",
        proteinMin: 28, fatMin: 9, fiberMax: 5, ashMax: 9, moistureMax: 10, kcalPer100g: 360 },
    ],
  },

  {
    brand: "ペットライン",
    name: "プロフェッショナル・バランス",
    variants: [
      { form: "dry", label: "成猫用", lifeStage: "成猫",
        ingredients_text:
          "米、トウモロコシ、チキンミール、ポークミール、フィッシュミール、ビートパルプ、オリゴ糖、フィッシュオイル、動物性油脂、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10 },
      { form: "dry", label: "11歳以上用", lifeStage: "シニア",
        ingredients_text:
          "米、トウモロコシ、チキンミール、ポークミール、フィッシュミール、ビートパルプ、オリゴ糖、フィッシュオイル、動物性油脂、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10 },
      { form: "dry", label: "避妊去勢後ケア", lifeStage: "成猫",
        ingredients_text:
          "米、トウモロコシ、チキンミール、ポークミール、フィッシュミール、ビートパルプ、オリゴ糖、フィッシュオイル、動物性油脂、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10, features: "避妊去勢後ケア" },
      { form: "dry", label: "腎臓ケア", lifeStage: "成猫/シニア",
        ingredients_text:
          "米、トウモロコシ、チキンミール、ポークミール、フィッシュミール、ビートパルプ、オリゴ糖、フィッシュオイル、動物性油脂、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10, features: "腎臓ケア" },
      { form: "dry", label: "毛玉対応", lifeStage: "成猫",
        ingredients_text:
          "米、トウモロコシ、チキンミール、ポークミール、フィッシュミール、ビートパルプ、オリゴ糖、フィッシュオイル、動物性油脂、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10, features: "毛玉ケア" },
    ],
  },

  {
    brand: "日本ペットフード",
    name: "コンボ",
    variants: [
      { form: "dry", label: "成猫（毛玉ケア）", lifeStage: "成猫",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、魚粉、セルロースパウダー、動物性油脂、ビタミン、ミネラル、タウリン",
        proteinMin: 27, fatMin: 9, fiberMax: 6, ashMax: 8, moistureMax: 10, features: "毛玉ケア" },
      { form: "dry", label: "成猫（室内猫ケア）", lifeStage: "成猫",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、魚粉、セルロースパウダー、動物性油脂、ビタミン、ミネラル、タウリン",
        proteinMin: 27, fatMin: 9, fiberMax: 6, ashMax: 8, moistureMax: 10, features: "室内猫ケア" },
      { form: "dry", label: "シニア用", lifeStage: "シニア",
        ingredients_text:
          "穀類（トウモロコシ、小麦粉等）、チキンミール、魚粉、セルロースパウダー、動物性油脂、ビタミン、ミネラル、タウリン",
        proteinMin: 27, fatMin: 9, fiberMax: 6, ashMax: 8, moistureMax: 10 },
    ],
  },

  {
    brand: "デビフ（D.B.F）",
    name: "缶詰",
    variants: [
      { form: "can", label: "子猫用ミルクペースト", lifeStage: "子猫",
        ingredients_text:
          "鶏肉、まぐろ、かつお、レバー、米、にんじん、でん粉、増粘多糖類、ビタミン、ミネラル",
        proteinMin: 8, fatMin: 3, fiberMax: 1, ashMax: 2, moistureMax: 85 },
      { form: "can", label: "一般缶", lifeStage: "成猫",
        ingredients_text:
          "鶏肉、まぐろ、かつお、レバー、米、にんじん、でん粉、増粘多糖類、ビタミン、ミネラル" },
      { form: "can", label: "高齢猫流動食", lifeStage: "シニア",
        ingredients_text:
          "鶏肉、まぐろ、かつお、レバー、米、にんじん、でん粉、増粘多糖類、ビタミン、ミネラル" },
    ],
  },

  {
    brand: "日清ペット",
    name: "JPスタイル 和の究み",
    variants: [
      { form: "dry", label: "子猫", lifeStage: "子猫",
        ingredients_text:
          "米、コーングルテンミール、チキンミール、フィッシュミール、大豆タンパク、オリゴ糖、ビートパルプ、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10 },
      { form: "dry", label: "成猫", lifeStage: "成猫",
        ingredients_text:
          "米、コーングルテンミール、チキンミール、フィッシュミール、大豆タンパク、オリゴ糖、ビートパルプ、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10 },
      { form: "dry", label: "シニア", lifeStage: "シニア",
        ingredients_text:
          "米、コーングルテンミール、チキンミール、フィッシュミール、大豆タンパク、オリゴ糖、ビートパルプ、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 5, ashMax: 8, moistureMax: 10 },
    ],
  },

  {
    brand: "ペットライン",
    name: "メディファス（Medyfas）",
    variants: [
      { form: "dry", label: "子猫", lifeStage: "子猫",
        ingredients_text:
          "とうもろこし、小麦粉、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、オリゴ糖、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 9, fiberMax: 5, ashMax: 8, moistureMax: 10 },
      { form: "dry", label: "成猫", lifeStage: "成猫",
        ingredients_text:
          "とうもろこし、小麦粉、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、オリゴ糖、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 9, fiberMax: 5, ashMax: 8, moistureMax: 10 },
      { form: "dry", label: "7歳/11歳/15歳", lifeStage: "シニア",
        ingredients_text:
          "とうもろこし、小麦粉、チキンミール、フィッシュミール、動物性油脂、ビートパルプ、オリゴ糖、ミネラル、ビタミン、タウリン",
        proteinMin: 30, fatMin: 9, fiberMax: 5, ashMax: 8, moistureMax: 10 },
    ],
  },

  {
    brand: "アイシア",
    name: "ミャウミャウ",
    variants: [
      { form: "dry", label: "子猫/成猫/シニア", lifeStage: "子猫/成猫/シニア",
        ingredients_text:
          "とうもろこし、小麦粉、チキンミール、フィッシュミール、動物性油脂、オリゴ糖、酵母、ビタミン、ミネラル、タウリン",
        proteinMin: 27, fatMin: 9, fiberMax: 4, ashMax: 8, moistureMax: 10 },
    ],
  },

  {
    brand: "ユニ・チャーム",
    name: "AIM30",
    variants: [
      { form: "dry", label: "室内猫/毛玉ケア/腎臓ケア（成猫）", lifeStage: "成猫",
        ingredients_text:
          "穀類、チキンミール、フィッシュミール、動物性油脂、セルロース、オリゴ糖、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 9, fiberMax: 6, ashMax: 8, moistureMax: 10, features: "室内猫/毛玉ケア/腎臓ケア" },
    ],
  },

  {
    brand: "ユニ・チャーム",
    name: "Physicalife",
    variants: [
      { form: "dry", label: "成猫 室内飼い猫", lifeStage: "成猫",
        ingredients_text:
          "トウモロコシ、チキンミール、フィッシュミール、セルロース、動物性油脂、オリゴ糖、ビタミン、ミネラル、タウリン",
        proteinMin: 30, fatMin: 10, fiberMax: 6, ashMax: 8, moistureMax: 10 },
    ],
  },

  {
    brand: "いなば",
    name: "CIAO",
    variants: [
      { form: "treat", label: "ちゅ〜る まぐろ", lifeStage: "成猫/全齢", flavor: "まぐろ",
        ingredients_text:
          "まぐろ、ほたてエキス、増粘多糖類、ビタミン、ミネラル、タウリン",
        proteinMin: 7, fatMin: 0.2, fiberMax: 0.1, ashMax: 1.5, moistureMax: 91 },
      { form: "can", label: "CIAO缶", lifeStage: "成猫/全齢",
        ingredients_text:
          "（製品により異なる）まぐろ/かつお 等、増粘多糖類、ビタミン、ミネラル、タウリン" },
      { form: "pouch", label: "CIAOパウチ", lifeStage: "成猫/全齢",
        ingredients_text:
          "（製品により異なる）魚介類/鶏肉 等、増粘多糖類、ビタミン、ミネラル、タウリン" },
    ],
  },

  {
    brand: "ペティオ",
    name: "おやつ",
    variants: [
      { form: "treat", label: "乾しカツオ", lifeStage: "成猫/全齢",
        ingredients_text: "かつお100%",
        proteinMin: 60, fatMin: 2, fiberMax: 1, ashMax: 6, moistureMax: 20 },
      { form: "treat", label: "チキンジャーキー", lifeStage: "成猫/全齢",
        ingredients_text: "鶏肉（ジャーキー）" },
    ],
  },
];

/** シリーズ upsert（Product → ProductVariant） */
async function upsertSeries(series: Series) {
  const seriesKey = `JP-${slug(series.brand)}-${slug(series.name)}`;
  const product = await prisma.product.upsert({
    where: { barcode: seriesKey },
    update: {
      name: series.name,
      brand: series.brand,
      ingredients_text: series.ingredients_text ?? "",
      image: series.image ?? "",
      source: series.source ?? "jp_official",
    },
    create: {
      barcode: seriesKey,
      name: series.name,
      brand: series.brand,
      ingredients_text: series.ingredients_text ?? "",
      image: series.image ?? "",
      source: series.source ?? "jp_official",
    },
  });

  for (const v of series.variants) {
    await prisma.productVariant.upsert({
      // @@unique([productId, form, label, flavor]) に合わせた where
      where: {
        productId_form_label_flavor: {
          productId: product.id,
          form: v.form,
          label: v.label,
          flavor: v.flavor ?? "",
        },
      },
      update: {
        lifeStage: v.lifeStage ?? null,
        flavor: v.flavor ?? "",
        features: v.features ?? null,
        ingredients_text: v.ingredients_text,
        proteinMin: v.proteinMin ?? null,
        fatMin: v.fatMin ?? null,
        fiberMax: v.fiberMax ?? null,
        ashMax: v.ashMax ?? null,
        moistureMax: v.moistureMax ?? null,
        kcalPer100g: v.kcalPer100g ?? null,
      },
      create: {
        productId: product.id,
        form: v.form,
        label: v.label,
        lifeStage: v.lifeStage ?? null,
        flavor: v.flavor ?? "",
        features: v.features ?? null,
        ingredients_text: v.ingredients_text,
        proteinMin: v.proteinMin ?? null,
        fatMin: v.fatMin ?? null,
        fiberMax: v.fiberMax ?? null,
        ashMax: v.ashMax ?? null,
        moistureMax: v.moistureMax ?? null,
        kcalPer100g: v.kcalPer100g ?? null,
      },
    });
  }
}

/* =========
 * main()
 * ========= */
async function main() {
  console.log("🌱 Seeding: ingredient guideline (OK/CAUTION/NG)...");
  for (const i of OK_ITEMS) await upsertDict(i, "OK");
  for (const i of CAUTION_ITEMS) await upsertDict(i, "CAUTION");
  for (const i of NG_ITEMS) await upsertDict(i, "NG");

  console.log("🌱 Seeding: JP product series + variants...");
  for (const s of SERIES) await upsertSeries(s);

  console.log("✅ Seed completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
