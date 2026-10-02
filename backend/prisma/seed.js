"use strict";

var _client = require("@prisma/client");
const prisma = new _client.PrismaClient();
const NIBSS_BANK_CODE = "NIBSS";
const featuredBanks = {
  "058": { logoUrl: "/bank-logos/gtbank.svg", displayOrder: 1 },
  "044": { logoUrl: "/bank-logos/access-bank.png", displayOrder: 2 },
  "999992": { logoUrl: "/bank-logos/opay.png", displayOrder: 3 },
  "50515": { logoUrl: "/bank-logos/moniepoint.svg", displayOrder: 4 },
  "057": { logoUrl: "/bank-logos/zenith-bank.svg", displayOrder: 5 },
  "033": { logoUrl: "/bank-logos/uba.png", displayOrder: 6 },
  "011": { logoUrl: "/bank-logos/first-bank.svg", displayOrder: 7 },
  "070": { logoUrl: "/bank-logos/fidelity-bank.svg", displayOrder: 8 },
  "214": { logoUrl: "/bank-logos/fcmb.svg", displayOrder: 9 },
  "035": { logoUrl: "/bank-logos/wema-bank.svg", displayOrder: 10 },
  "032": { logoUrl: "/bank-logos/union-bank.svg", displayOrder: 11 },
  "221": { logoUrl: "/bank-logos/stanbic-ibtc.svg", displayOrder: 12 },
  "232": { logoUrl: "/bank-logos/sterling-bank.svg", displayOrder: 13 },
  "076": { logoUrl: "/bank-logos/polaris-bank.svg", displayOrder: 14 },
  "050": { logoUrl: "/bank-logos/ecobank.svg", displayOrder: 15 },
  "082": { logoUrl: "/bank-logos/keystone-bank.svg", displayOrder: 16 },
  "00103": { logoUrl: "/bank-logos/globus-bank.svg", displayOrder: 17 },
  "50211": { logoUrl: "/bank-logos/kuda-bank.svg", displayOrder: 18 }
};

const logoOverrides = {
  "063": "/bank-logos/access-bank.png",
  "502": "/bank-logos/rand-merchant-bank.svg",
  "559": "/bank-logos/coronation-merchant-bank.svg",
  "561": "/bank-logos/nova-bank.png",
  "562": "/bank-logos/greenwich-merchant-bank.png",
  "565": "/bank-logos/carbon.svg",
  "566": "/bank-logos/vfd-microfinance-bank.jpg",
  "594": "/bank-logos/yes-mfb.png",
  "602": "/bank-logos/accion-microfinance-bank.png",
  "650": "/bank-logos/bosak-microfinance-bank.png",
  "677": "/bank-logos/think-finance-mfb.jpeg",
  "812": "/bank-logos/gateway-mortgage-bank.png",
  "832": "/bank-logos/futminna-microfinance-bank.jpg",
  "865": "/bank-logos/cashconnect-mfb.png",
  "899": "/bank-logos/kolomoni-mfb.webp",
  "946": "/bank-logos/money-master-psb.png",
  "5129": "/bank-logos/kayvee-mfb.png",
  "11072": "/bank-logos/bank78-mfb.png",
  "40119": "/bank-logos/credit-direct.svg",
  "40165": "/bank-logos/sage-grey-finance.png",
  "40195": "/bank-logos/78-finance-company.png",
  "50036": "/bank-logos/abu-microfinance-bank.png",
  "50055": "/bank-logos/al-barakah-mfb.jpg",
  "50059": "/bank-logos/allworkers-mfb.jpg",
  "50083": "/bank-logos/aramoko-mfb.jpg",
  "50092": "/bank-logos/assets-mfb.png",
  "50117": "/bank-logos/banc-corp-mfb.svg",
  "50122": "/bank-logos/berachah-mfb.jpg",
  "50123": "/bank-logos/beststar-mfb.svg",
  "50126": "/bank-logos/eyowo.png",
  "50130": "/bank-logos/rank-mfb.png",
  "50162": "/bank-logos/dot-mfb.svg",
  "50171": "/bank-logos/chanelle-mfb.svg",
  "50200": "/bank-logos/kredi-money-mfb.png",
  "50204": "/bank-logos/corestep-mfb.jpg",
  "50216": "/bank-logos/crutech-mfb.png",
  "50263": "/bank-logos/ekimogun-mfb.png",
  "50280": "/bank-logos/esoe-mfb.png",
  "50298": "/bank-logos/clearpay-mfb.png",
  "50304": "/bank-logos/mint-mfb.svg",
  "50315": "/bank-logos/aella-mfb.svg",
  "50368": "/bank-logos/gti-mfb.png",
  "50383": "/bank-logos/hasal-mfb.jpg",
  "50439": "/bank-logos/ikoyi-osun-mfb.svg",
  "50442": "/bank-logos/ilaro-poly-mfb.png",
  "50453": "/bank-logos/imowo-mfb.png",
  "50457": "/bank-logos/infinity-mfb.svg",
  "50491": "/bank-logos/loma-mfb.svg",
  "50549": "/bank-logos/links-mfb.png",
  "50563": "/bank-logos/mayfair-mfb.png",
  "50570": "/bank-logos/mega-mfb.svg",
  "50572": "/bank-logos/bankit-mfb.png",
  "50582": "/bank-logos/shield-mfb.svg",
  "50629": "/bank-logos/npf-mfb.png",
  "50645": "/bank-logos/buypower-mfb.svg",
  "50689": "/bank-logos/olabisi-onabanjo-university-mfb.png",
  "50697": "/bank-logos/oluchukwu-mfb.png",
  "50725": "/bank-logos/bold-mfb.svg",
  "50739": "/bank-logos/prospa-capital-mfb.png",
  "50743": "/bank-logos/peace-mfb.png",
  "50746": "/bank-logos/petra-mfb.webp",
  "50756": "/bank-logos/spectrum-mfb.png",
  "50761": "/bank-logos/rehoboth-mfb.svg",
  "50767": "/bank-logos/rockshield-mfb.svg",
  "50800": "/bank-logos/solid-rock-mfb.png",
  "50809": "/bank-logos/stateside-mfb.png",
  "50823": "/bank-logos/cemcs-mfb.png",
  "50840": "/bank-logos/u-and-c-mfb.jpg",
  "50864": "/bank-logos/polyunwana-mfb.png",
  "50870": "/bank-logos/unaab-mfb.jpg",
  "50871": "/bank-logos/unical-mfb.png",
  "50875": "/bank-logos/unimaid-mfb.png",
  "50880": "/bank-logos/uniuyo-mfb.png",
  "50894": "/bank-logos/uzondu-mfb.svg",
  "50910": "/bank-logos/consumer-mfb.png",
  "50922": "/bank-logos/ebsu-mfb.jpg",
  "50926": "/bank-logos/amju-unique-mfb.png",
  "50931": "/bank-logos/bowen-mfb.png",
  "50934": "/bank-logos/first-option-mfb.svg",
  "090759": "/bank-logos/advancly-mfb.svg",
  "090561": "/bank-logos/akuchukwu-mfb.png",
  "035A": "/bank-logos/alat-wema.svg",
  "000304": "/bank-logos/alternative-bank.svg",
  "50094": "/bank-logos/astrapolaris-mfb.png",
  "MFB50094": "/bank-logos/astrapolaris-mfb.png",
  "090478": "/bank-logos/avuenegbe-mfb.png",
  "MFB50992": "/bank-logos/baobab-mfb.svg",
  "FC40163": "/bank-logos/branch.svg",
  "050032": "/bank-logos/centrum-finance.svg",
  "023": "/bank-logos/citibank.svg",
  "070027": "/bank-logos/citycode-mortgage.png",
  "FC40128": "/bank-logos/county-finance.png",
  "090560": "/bank-logos/crust-mfb.svg",
  "098": "/bank-logos/ekondo-mfb.png",
  "090678": "/bank-logos/excel-finance.svg",
  "050002": "/bank-logos/fewchore-finance.png",
  "090164": "/bank-logos/first-royal-mfb.png",
  "090567": "/bank-logos/flutterwave-mfb.svg",
  "D53": "/bank-logos/fortress-mfb.png",
  "MFB51093": "/bank-logos/garun-mallam-mfb.svg",
  "090574": "/bank-logos/goldman-mfb.svg",
  "090664": "/bank-logos/good-shepherd-mfb.png",
  "070016": "/bank-logos/infinity-trust-mortgage.png",
  "090701": "/bank-logos/isua-mfb.svg",
  "091003": "/bank-logos/lemmy-mfb.svg",
  "090420": "/bank-logos/letshego-mfb.png",
  "031": "/bank-logos/livingtrust-mortgage.png",
  "090171": "/bank-logos/mainstreet-mfb.png",
  "09": "/bank-logos/mint-finex-mfb.svg",
  "090190": "/bank-logos/mutual-benefits-mfb.png",
  "090679": "/bank-logos/ndcc-mfb.svg",
  "090680": "/bank-logos/pathfinder-mfb.svg",
  "MFB51452": "/bank-logos/pettysave-mfb.svg",
  "050021": "/bank-logos/pfi-finance.svg",
  "050023": "/bank-logos/prosperis-finance.png",
  "090496": "/bank-logos/randalpha-mfb.svg",
  "50968": "/bank-logos/supreme-mfb.png",
  "50994": "/bank-logos/rephidim-mfb.svg",
  "050020": "/bank-logos/vale-finance.svg",
  "068": "/bank-logos/standard-chartered.svg",
  "090162": "/bank-logos/stanford-mfb.png",
  "070022": "/bank-logos/stb-mortgage.jpg",
  "00305": "/bank-logos/summit-bank.svg",
  "090708": "/bank-logos/transpay-mfb.png",
  "090706": "/bank-logos/ucee-mfb.png",
  "00zap": "/bank-logos/zap.svg",
  "51056": "/bank-logos/sycamore-mfb.svg",
  "51062": "/bank-logos/solid-allianze-mfb.svg",
  "51074": "/bank-logos/alert-mfb.png",
  "51080": "/bank-logos/ultraviolet-mfb.png",
  "51085": "/bank-logos/victory-mfb.svg",
  "51100": "/bank-logos/bellbank-mfb.svg",
  "51108": "/bank-logos/rex-mfb.png",
  "51110": "/bank-logos/ffs-mfb.svg",
  "51113": "/bank-logos/safe-haven-mfb.svg",
  "51118": "/bank-logos/trustbanc-j6-mfb.svg",
  "51142": "/bank-logos/nigerian-navy-mfb.png",
  "51146": "/bank-logos/personal-trust-mfb.svg",
  "51204": "/bank-logos/above-only-mfb.png",
  "51211": "/bank-logos/ibank-mfb.png",
  "51226": "/bank-logos/pecantrust-mfb.png",
  "51229": "/bank-logos/bainescredit-mfb.png",
  "51241": "/bank-logos/fcmb-mfb.png",
  "51244": "/bank-logos/ibile-mfb.png",
  "51251": "/bank-logos/hackman-mfb.svg",
  "51253": "/bank-logos/yct-mfb.png",
  "51261": "/bank-logos/nsuk-mfb.png",
  "51267": "/bank-logos/benysta-mfb.svg",
  "51269": "/bank-logos/tangerine-money.svg",
  "51276": "/bank-logos/grooming-mfb.svg",
  "51279": "/bank-logos/ibbu-mfb.png",
  "51286": "/bank-logos/rigo-mfb.png",
  "51293": "/bank-logos/quickfund-mfb.png",
  "51297": "/bank-logos/crescent-mfb.svg",
  "51304": "/bank-logos/nirsal-mfb.png",
  "51308": "/bank-logos/kanopoly-mfb.svg",
  "51310": "/bank-logos/sparkle-mfb.png",
  "51312": "/bank-logos/abulesoro-mfb.svg",
  "51314": "/bank-logos/firmus-mfb.png",
  "51316": "/bank-logos/unilag-mfb.png",
  "51318": "/bank-logos/fairmoney-mfb.svg",
  "51322": "/bank-logos/uhuru-mfb.svg",
  "51333": "/bank-logos/firstmidas-mfb.svg",
  "51334": "/bank-logos/davenport-mfb.svg",
  "51336": "/bank-logos/aku-mfb.svg",
  "51337": "/bank-logos/aztec-mfb.png",
  "51341": "/bank-logos/bankly-mfb.svg",
  "51351": "/bank-logos/awacash-mfb.svg",
  "51353": "/bank-logos/cashbridge-mfb.png",
  "51355": "/bank-logos/waya-mfb.svg",
  "51361": "/bank-logos/net-mfb.png",
  "51364": "/bank-logos/hayat-trust-mfb.png",
  "51368": "/bank-logos/dash-mfb.svg",
  "51371": "/bank-logos/novus-mfb.svg",
  "51373": "/bank-logos/zitra-mfb.svg",
  "51375": "/bank-logos/retrust-mfb.jpeg",
  "51386": "/bank-logos/weston-charis-mfb.png",
  "51392": "/bank-logos/nuvion-mfb.svg",
  "51396": "/bank-logos/ubj-mfb.svg",
  "51403": "/bank-logos/tenn-mfb.png",
  "51429": "/bank-logos/springfield-mfb.svg",
  "51437": "/bank-logos/cedrus-mfb.svg",
  "51444": "/bank-logos/maal-mfb.svg",
  "51447": "/bank-logos/uniabuja-mfb.png",
  "51449": "/bank-logos/boost-mfb.png",
  "51450": "/bank-logos/dillon-mfb.png",
  "51455": "/bank-logos/5tt-mfb.png",
  "51458": "/bank-logos/cool-mfb.svg",
  "51462": "/bank-logos/ineba-gogo-mfb.svg",
  "51475": "/bank-logos/ethica-mfb.png",
  "51477": "/bank-logos/pact-mfb.webp",
  "90003": "/bank-logos/mayfresh-mortgage.png",
  "90012": "/bank-logos/ibom-mortgage.png",
  "90028": "/bank-logos/kebbi-homes.png",
  "90052": "/bank-logos/lbic.png",
  "90065": "/bank-logos/haggai-mortgage.png",
  "90067": "/bank-logos/refuge-mortgage.png",
  "90070": "/bank-logos/brent-mortgage.png",
  "90077": "/bank-logos/ag-mortgage.jpg",
  "90089": "/bank-logos/cooperative-mortgage.png",
  "90102": "/bank-logos/adamawa-mortgage.png",
  "90278": "/bank-logos/glory-mfb.png",
  "90287": "/bank-logos/asset-matrix-mfb.png",
  "90317": "/bank-logos/patrickgold-mfb.svg",
  "90335": "/bank-logos/grants-mfb.svg",
  "90367": "/bank-logos/bank-of-agriculture.png",
  "90451": "/bank-logos/atbu-mfb.png",
  "90586": "/bank-logos/gombe-mfb.svg",
  "90641": "/bank-logos/source-mfb.svg",
  "90667": "/bank-logos/kayi-mfb.svg",
  "90774": "/bank-logos/bway-mfb.png",
  "90787": "/bank-logos/vista-mfb.png",
  "90801": "/bank-logos/toprate-mfb.svg",
  "90825": "/bank-logos/mahfuz-mfb.svg",
  "90979": "/bank-logos/movasco-mfb.svg",
  "100022": "/bank-logos/gomoney.svg",
  "100025": "/bank-logos/kongapay.svg",
  "100036": "/bank-logos/chams-mobile.png",
  "100040": "/bank-logos/xpress-wallet.png",
  "120001": "/bank-logos/9psb.png",
  "120002": "/bank-logos/hope-psb.svg",
  "120003": "/bank-logos/momo-psb.png",
  "120004": "/bank-logos/smartcash-psb.svg",
  "402001": "/bank-logos/whitecrust.png",
  "090629": "/bank-logos/9japay.svg",
  "100": "/bank-logos/suntrust-bank.png",
  "102": "/bank-logos/titan-bank.png",
  "105": "/bank-logos/premiumtrust-bank.webp",
  "106": "/bank-logos/signature-bank.png",
  "107": "/bank-logos/optimus-bank.svg",
  "108": "/bank-logos/alpha-morgan.png",
  "109": "/bank-logos/tatum-bank.png",
  "215": "/bank-logos/unity-bank.png",
  "268": "/bank-logos/platinum-mortgage-bank.png",
  "302": "/bank-logos/taj-bank.png",
  "311": "/bank-logos/parkway-readycash.png",
  "312": "/bank-logos/chikum-mfb.png",
  "401": "/bank-logos/aso-savings-loans.png",
  "402": "/bank-logos/jubilee-life.png",
  "404": "/bank-logos/abbey-mortgage-bank.png",
  "413": "/bank-logos/firsttrust-mortgage-bank.svg",
  "415": "/bank-logos/imperial-homes.png",
  "501": "/bank-logos/fsdh.svg",
  "301": "/bank-logos/jaiz-bank.jpg",
  "50502": "/bank-logos/kadpoly.png",
  "303": "/bank-logos/lotus-bank.png",
  "MFB51116M": "/bank-logos/michael-okpara.png",
  "50072": "/bank-logos/nomba.png",
  "100002": "/bank-logos/paga.svg",
  "999991": "/bank-logos/palmpay.png",
  "104": "/bank-logos/parallex-bank.png",
  "51457": "/bank-logos/paystack.svg",
  "100039": "/bank-logos/paystack.svg",
  "00716": "/bank-logos/pocketapp.png",
  "101": "/bank-logos/providus-bank.png",
  "125": "/bank-logos/rubies.png"
};

function generatedLogoUrl(bankCode) {
  return `/bank-logos/generated/${encodeURIComponent(bankCode)}.svg`;
}

function optionalCatalogValue(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return !normalized || normalized.toLowerCase() === "null" ? null : normalized;
}

function catalogRank(bank) {
  return [
    bank.nip_sort_code ? 4 : 0,
    optionalCatalogValue(bank.longcode) ? 2 : 0,
    bank.supports_transfer ? 1 : 0,
    Date.parse(bank.updatedAt || "") || 0
  ];
}

function isHigherRank(candidate, current) {
  const candidateRank = catalogRank(candidate);
  const currentRank = catalogRank(current);
  return candidateRank.some((value, index) => value > currentRank[index] && candidateRank.slice(0, index).every((part, i) => part === currentRank[i]));
}

async function main() {
  // Paystack's NGN catalog is the source of truth for transfer bank_code values.
  // include_nip_sort_code also gives us the NIP institution code without conflating it with bank_code.
  const resp = await fetch('https://api.paystack.co/bank?currency=NGN&perPage=100&include_nip_sort_code=true');
  const data = await resp.json();
  if (!data.status || !Array.isArray(data.data)) throw new Error(data.message || "Paystack bank catalog could not be loaded.");

  const catalogByCode = new Map();
  for (const bank of data.data) {
    if (bank.country !== "Nigeria" || bank.currency !== "NGN" || !bank.active || bank.is_deleted || !bank.code || !bank.name) continue;
    const current = catalogByCode.get(bank.code);
    if (!current || isHigherRank(bank, current)) catalogByCode.set(bank.code, bank);
  }

  const codes = [...catalogByCode.keys(), NIBSS_BANK_CODE];
  if (codes.length) {
    await prisma.bank.updateMany({
      where: { active: true, bankCode: { notIn: codes } },
      data: { active: false }
    });
  }

  let count = 0;
  for (const bank of catalogByCode.values()) {
    const catalog = featuredBanks[bank.code];
    const logoUrl = catalog?.logoUrl || logoOverrides[bank.code] || bank.logo || generatedLogoUrl(bank.code);
    const slug = bank.slug || bank.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await prisma.bank.upsert({
      where: { bankCode: bank.code },
      update: {
        name: bank.name,
        slug,
        longCode: optionalCatalogValue(bank.longcode),
        nipInstitutionCode: optionalCatalogValue(bank.nip_sort_code),
        supportsTransfer: bank.supports_transfer !== false,
        country: bank.country,
        currency: bank.currency,
        bankType: optionalCatalogValue(bank.type),
        active: true,
        logoUrl,
        featured: Boolean(catalog),
        displayOrder: catalog?.displayOrder || 0,
        trustScore: 100
      },
      create: {
        name: bank.name,
        slug,
        bankCode: bank.code,
        longCode: optionalCatalogValue(bank.longcode),
        nipInstitutionCode: optionalCatalogValue(bank.nip_sort_code),
        supportsTransfer: bank.supports_transfer !== false,
        country: bank.country,
        currency: bank.currency,
        bankType: optionalCatalogValue(bank.type),
        status: "normal",
        logoUrl,
        featured: Boolean(catalog),
        displayOrder: catalog?.displayOrder || 0,
        trustScore: 100
      }
    });
    count++;
  }
  await prisma.bank.upsert({
    where: { bankCode: NIBSS_BANK_CODE },
    update: {
      name: "Nigeria Inter-Bank Settlement System (NIBSS)",
      slug: "nibss",
      supportsTransfer: false,
      country: "Nigeria",
      currency: "NGN",
      bankType: "network-switch",
      active: true,
      logoUrl: generatedLogoUrl(NIBSS_BANK_CODE),
      featured: true,
      displayOrder: 0
    },
    create: {
      name: "Nigeria Inter-Bank Settlement System (NIBSS)",
      slug: "nibss",
      bankCode: NIBSS_BANK_CODE,
      supportsTransfer: false,
      country: "Nigeria",
      currency: "NGN",
      bankType: "network-switch",
      status: "healthy",
      logoUrl: generatedLogoUrl(NIBSS_BANK_CODE),
      featured: true,
      displayOrder: 0,
      trustScore: 100,
      statusSource: "aggregate-monitor"
    }
  });
  console.log(`Synced ${count} unique active NGN banks from Paystack.`);
}
main().finally(async () => {
  await prisma.$disconnect();
}).catch(async error => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
