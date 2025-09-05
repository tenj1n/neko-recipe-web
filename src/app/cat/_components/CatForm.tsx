"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  catCreateSchema,
  activityEnum,
  sexEnum,
  hairAmountEnum,
  sizeEnum,
} from "@/lib/catSchema";

type CatCreate = z.infer<typeof catCreateSchema>;

type Props = {
  title: string;
  submitLabel?: string;
  initial?: Partial<CatCreate>; // edit時に初期値を入れる
  confirmOnSubmit?: boolean;
  onSubmit: (data: CatCreate) => Promise<void> | void;
  onCancel?: () => void;
};

type UIForm = {
  name: string;
  weightKg: string;
  ageYears: string;
  activity: "" | z.infer<typeof activityEnum>;
  sex: "" | z.infer<typeof sexEnum>;
  hairAmount: "" | z.infer<typeof hairAmountEnum>;
  size: "" | z.infer<typeof sizeEnum>;
  neutered: boolean;
  allergies: string;
};

type FieldErrors = Partial<Record<keyof UIForm, string>>;

const ACTIVITY_LABEL: Record<z.infer<typeof activityEnum>, string> = {
  LOW: "低い",
  NORMAL: "普通",
  HIGH: "高い",
};

export default function CatForm({
  title,
  submitLabel = "保存",
  initial,
  confirmOnSubmit = true,
  onSubmit,
  onCancel,
}: Props) {
  // 初期化（new のときは未選択 "" で強制選択させる）
  const uiInitial: UIForm = useMemo(
    () => ({
      name: initial?.name ?? "",
      weightKg:
        typeof initial?.weightKg === "number"
          ? String(initial!.weightKg)
          : "",
      ageYears:
        typeof initial?.ageYears === "number"
          ? String(initial!.ageYears)
          : "",
      activity: (initial?.activity as UIForm["activity"]) ?? "",
      sex: (initial?.sex as UIForm["sex"]) ?? "",
      hairAmount: (initial?.hairAmount as UIForm["hairAmount"]) ?? "",
      size: (initial?.size as UIForm["size"]) ?? "",
      neutered: !!initial?.neutered,
      allergies: initial?.allergies ?? "",
    }),
    [initial]
  );

  const [form, setForm] = useState<UIForm>(uiInitial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 初期値が変わるケース（編集画面のid切替など）に備えて同期
  useEffect(() => {
    setForm(uiInitial);
    setErrors({});
    setMsg(null);
  }, [uiInitial]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const el = e.target;
    const name = el.name as keyof UIForm;
    const value =
      el instanceof HTMLInputElement && el.type === "checkbox"
        ? el.checked
        : el.value;
    setForm((prev) => ({ ...prev, [name]: value as any }));
    // 入力したら当該項目のエラーは消す
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit() {
    setMsg(null);

    // ① プレースホルダー未選択チェック
    const nextErrors: FieldErrors = {};
    if (!form.activity) nextErrors.activity = "活動量を選択してください";
    if (!form.sex) nextErrors.sex = "性別を選択してください";
    if (!form.hairAmount) nextErrors.hairAmount = "毛の量を選択してください";
    if (!form.size) nextErrors.size = "大きさを選択してください";

    // ② Zodバリデーション
    const parsed = catCreateSchema.safeParse({
      name: form.name,
      weightKg: Number(form.weightKg),
      ageYears: Number(form.ageYears),
      activity: form.activity || undefined, // "" は弾く
      sex: form.sex || undefined,
      hairAmount: form.hairAmount || undefined,
      size: form.size || undefined,
      neutered: !!form.neutered,
      allergies: form.allergies ?? "",
    });

    if (!parsed.success) {
      // 最初のメッセージを上部に、フィールド別は可能な範囲で詰める
      setMsg(parsed.error.issues[0]?.message ?? "入力内容を確認してください。");
      for (const issue of parsed.error.issues) {
        const key = issue.path?.[0] as keyof UIForm | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
    }

    if (Object.keys(nextErrors).length > 0 || !parsed.success) {
      setErrors(nextErrors);
      return;
    }

    if (confirmOnSubmit && !window.confirm("この内容で保存します。よろしいですか？"))
      return;

    try {
      setLoading(true);
      await onSubmit(parsed.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>

      {msg && <Alert text={msg} />}

      <div className="space-y-3">
        <L label="名前" error={errors.name}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={inputClass(errors.name)}
          />
        </L>

        <L label="体重 (kg)" error={errors.weightKg}>
          <input
            name="weightKg"
            type="number"
            value={form.weightKg}
            onChange={handleChange}
            className={inputClass(errors.weightKg)}
          />
        </L>

        <L label="年齢 (年)" error={errors.ageYears}>
          <input
            name="ageYears"
            type="number"
            value={form.ageYears}
            onChange={handleChange}
            className={inputClass(errors.ageYears)}
          />
        </L>

        <L label="活動量" error={errors.activity}>
          <select
            name="activity"
            value={form.activity}
            onChange={handleChange}
            className={inputClass(errors.activity)}
          >
            <option value="">選択してください</option>
            {activityEnum.options.map((v) => (
              <option key={v} value={v}>
                {ACTIVITY_LABEL[v]}
              </option>
            ))}
          </select>
        </L>

        <L label="性別" error={errors.sex}>
          <select
            name="sex"
            value={form.sex}
            onChange={handleChange}
            className={inputClass(errors.sex)}
          >
            <option value="">選択してください</option>
            {sexEnum.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </L>

        <L label="毛の量" error={errors.hairAmount}>
          <select
            name="hairAmount"
            value={form.hairAmount}
            onChange={handleChange}
            className={inputClass(errors.hairAmount)}
          >
            <option value="">選択してください</option>
            {hairAmountEnum.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </L>

        <L label="大きさ" error={errors.size}>
          <select
            name="size"
            value={form.size}
            onChange={handleChange}
            className={inputClass(errors.size)}
          >
            <option value="">選択してください</option>
            {sizeEnum.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </L>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="neutered"
            checked={form.neutered}
            onChange={handleChange}
          />
          繁殖防止済み（去勢・避妊）
        </label>

        <L label="アレルギー" error={errors.allergies}>
          <input
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            className={inputClass(errors.allergies)}
            placeholder="例: 鶏, 小麦"
          />
        </L>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="border px-4 py-2 rounded font-semibold bg-blue-500 text-white disabled:opacity-60"
          >
            {loading ? "送信中…" : submitLabel}
          </button>
          <button
            type="button"
            className="border px-4 py-2 rounded"
            onClick={onCancel}
          >
            キャンセル
          </button>
        </div>
      </div>
    </main>
  );
}

function inputClass(err?: string) {
  return `border p-2 rounded w-full ${err ? "border-red-500" : ""}`;
}

function L(props: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-medium">{props.label}</span>
      {props.children}
      {props.error && <p className="text-red-500 text-sm mt-1">{props.error}</p>}
    </label>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 p-2 rounded">
      <p className="font-semibold">入力内容を確認してください。</p>
      <p>{text}</p>
    </div>
  );
}
