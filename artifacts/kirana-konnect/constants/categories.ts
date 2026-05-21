export const CATEGORY_ICONS: Record<string, string> = {
  Dairy: "droplet",
  Grocery: "package",
  Snacks: "star",
  Bakery: "coffee",
  Beverages: "coffee",
  Vegetables: "feather",
  Stationery: "edit",
  Fruits: "sun",
  Meat: "scissors",
  Frozen: "wind",
  Personal: "heart",
  Cleaning: "trash-2",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Dairy: "#4FC3F7",
  Grocery: "#A5D6A7",
  Snacks: "#FFCC80",
  Bakery: "#FFAB91",
  Beverages: "#CE93D8",
  Vegetables: "#81C784",
  Stationery: "#B0BEC5",
  Fruits: "#FFCC02",
  Meat: "#EF9A9A",
  Frozen: "#80DEEA",
  Personal: "#F48FB1",
  Cleaning: "#80CBC4",
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_ICONS);

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "package";
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#A5D6A7";
}
