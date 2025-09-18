export type Recipe = {
  title: string;
  ingredients: string[];
  instructions: string;
};

export function parseRecipes(text: string): Recipe[] {
  try {
    return JSON.parse(text);
  } catch {
    // 万一JSONでなければテキスト丸ごと1件にする
    return [{ title: "AIレシピ", ingredients: [], instructions: text }];
  }
}
