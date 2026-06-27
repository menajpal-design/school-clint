const baseStudentPlans = [
  { code: "students_100_free", name: "100 Students (Free Lifetime)", studentLimit: 100, monthlyPrice: 0, yearlyPrice: 0, monthlySmsLimit: 0 },
];

const attendanceSmsAddons = [
  { suffix: "", nameSuffix: "", attendanceSmsMode: "none", attendanceSmsMonthlyRatePerStudent: 0 },
  { suffix: "_attendance_daily", nameSuffix: " + Daily Present SMS", attendanceSmsMode: "daily", attendanceSmsMonthlyRatePerStudent: 12 },
  { suffix: "_attendance_weekly", nameSuffix: " + Weekly Present SMS", attendanceSmsMode: "weekly", attendanceSmsMonthlyRatePerStudent: 5 },
] as const;

export const schoolPlans = baseStudentPlans.flatMap((base) => attendanceSmsAddons.map((addon) => {
  const monthlyAddon = base.code === "students_100_free" ? 0 : base.studentLimit * addon.attendanceSmsMonthlyRatePerStudent;
  return {
    ...base,
    code: `${base.code}${addon.suffix}`,
    name: `${base.name}${addon.nameSuffix}`,
    monthlyPrice: base.monthlyPrice + monthlyAddon,
    yearlyPrice: base.yearlyPrice + monthlyAddon * 12,
    attendanceSmsMode: addon.attendanceSmsMode,
    attendanceSmsMonthlyRatePerStudent: addon.attendanceSmsMonthlyRatePerStudent,
    attendanceSmsMonthlyAmount: monthlyAddon,
  };
})).map((plan) => ({
  ...plan,
  yearlyDiscountPercent: plan.monthlyPrice === 0 ? 0 : Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100),
}));

export const easySchoolStorageMonthlyPrice = 100;

export const getPlanByCode = (code?: string) => schoolPlans.find((plan) => plan.code === code) || schoolPlans[0];

export const calculatePlanDue = (code?: string, cycle: "monthly" | "yearly" = "monthly", useEasySchoolStorage = true, extraAmount = 0) => {
  const plan = getPlanByCode(code);
  const baseAmount = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const storageAmount = useEasySchoolStorage && plan.monthlyPrice > 0 ? easySchoolStorageMonthlyPrice * (cycle === "yearly" ? 12 : 1) : 0;
  const extra = Number(extraAmount || 0);
  return { plan, baseAmount, storageAmount, extraAmount: extra, total: baseAmount + storageAmount + extra };
};
