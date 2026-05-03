export const AppColors = {
  primary: "#38BDF8",
  primaryDark: "#0284C7",
  primarySoft: "#E0F2FE",
  danger: "#EF4444",
  muted: "#9AA0A6",
};

export const importanceLabel = (value: number) => {
  if (value === 3) return "高";
  if (value === 2) return "中";
  return "低";
};
