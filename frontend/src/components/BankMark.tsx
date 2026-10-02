import { API_URL, bankLogos, bankLogosByUrl, bankStyles } from "../lib/constants";

export default function BankMark({ name, logoUrl, size = "md" }: { name: string; logoUrl?: string | null; size?: "sm" | "md" }) {
  const normalizedName = name.toLowerCase();
  const isNibss = normalizedName.includes("nibss");
  const initials = isNibss
    ? "NS"
    : normalizedName.includes("united bank") || normalizedName.includes("uba")
    ? "UBA"
    : name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const generatedLogo = !isNibss && logoUrl?.startsWith("/bank-logos/generated/") ? `${API_URL}${logoUrl}` : undefined;
  const logo = (logoUrl && bankLogosByUrl[logoUrl])
    || generatedLogo
    || (logoUrl?.startsWith("https://") ? logoUrl : undefined)
    || bankLogos[name]
    || (normalizedName.includes("guaranty trust") ? bankLogos.GTBank : undefined)
    || (normalizedName.includes("opay") ? bankLogos.OPay : undefined)
    || (normalizedName.includes("moniepoint") ? bankLogos.Moniepoint : undefined)
    || (normalizedName.includes("united bank") || normalizedName.includes("uba") ? bankLogos.UBA : undefined)
    || (normalizedName.includes("zenith") ? bankLogos["Zenith Bank"] : undefined)
    || (normalizedName.includes("access bank") ? bankLogos["Access Bank"] : undefined);
  const dim = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs";
  if (logo) return <img src={logo} alt={name} className={`${dim} rounded-lg object-contain`} />;
  return <span className={`${dim} grid place-items-center rounded-lg font-bold ${bankStyles[name] || "bg-gray-200 text-gray-700"}`}>{initials}</span>;
}
