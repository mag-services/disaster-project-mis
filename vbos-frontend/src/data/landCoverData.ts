/**
 * Land cover dataset for dashboard - from Land cover dataset for dashboard.xlsx
 * Province, Year, Land cover type, Land area (km²)
 */
export const PROVINCES = ["Torba", "Sanma", "Penama", "Malampa", "Shefa", "Tafea"] as const;
export const LAND_COVER_TYPES = [
  "Water bodies",
  "Coconut plantations",
  "Grassland",
  "Mangrove",
  "Agriculture",
  "Barelands",
  "Builtup Infrastructure",
  "Dense Forest",
  "Open Forest",
] as const;

export interface LandCoverEntry {
  province: string;
  year: string;
  land_cover_type: string;
  land_area: number;
}

export const landCoverData: LandCoverEntry[] = [
  // 2020 - Torba (4)
  { province: "Torba", year: "2020", land_cover_type: "Water bodies", land_area: 76.54 },
  { province: "Torba", year: "2020", land_cover_type: "Coconut plantations", land_area: 56.15 },
  { province: "Torba", year: "2020", land_cover_type: "Grassland", land_area: 61.94 },
  { province: "Torba", year: "2020", land_cover_type: "Mangrove", land_area: 4.71 },
  { province: "Torba", year: "2020", land_cover_type: "Agriculture", land_area: 285.55 },
  { province: "Torba", year: "2020", land_cover_type: "Barelands", land_area: 29.83 },
  { province: "Torba", year: "2020", land_cover_type: "Builtup Infrastructure", land_area: 51.8 },
  { province: "Torba", year: "2020", land_cover_type: "Dense Forest", land_area: 119.31 },
  { province: "Torba", year: "2020", land_cover_type: "Open Forest", land_area: 173.44 },
  // 2020 - Sanma (14)
  { province: "Sanma", year: "2020", land_cover_type: "Water bodies", land_area: 61.48 },
  { province: "Sanma", year: "2020", land_cover_type: "Coconut plantations", land_area: 510.87 },
  { province: "Sanma", year: "2020", land_cover_type: "Grassland", land_area: 495.7 },
  { province: "Sanma", year: "2020", land_cover_type: "Mangrove", land_area: 22.87 },
  { province: "Sanma", year: "2020", land_cover_type: "Agriculture", land_area: 1896.18 },
  { province: "Sanma", year: "2020", land_cover_type: "Barelands", land_area: 44.55 },
  { province: "Sanma", year: "2020", land_cover_type: "Builtup Infrastructure", land_area: 58.84 },
  { province: "Sanma", year: "2020", land_cover_type: "Dense Forest", land_area: 441.27 },
  { province: "Sanma", year: "2020", land_cover_type: "Open Forest", land_area: 683.18 },
  // 2020 - Penama (15)
  { province: "Penama", year: "2020", land_cover_type: "Water bodies", land_area: 87.36 },
  { province: "Penama", year: "2020", land_cover_type: "Coconut plantations", land_area: 111.43 },
  { province: "Penama", year: "2020", land_cover_type: "Grassland", land_area: 104.29 },
  { province: "Penama", year: "2020", land_cover_type: "Mangrove", land_area: 18.8 },
  { province: "Penama", year: "2020", land_cover_type: "Agriculture", land_area: 398.57 },
  { province: "Penama", year: "2020", land_cover_type: "Barelands", land_area: 57.93 },
  { province: "Penama", year: "2020", land_cover_type: "Builtup Infrastructure", land_area: 88.97 },
  { province: "Penama", year: "2020", land_cover_type: "Dense Forest", land_area: 154.04 },
  { province: "Penama", year: "2020", land_cover_type: "Open Forest", land_area: 176.29 },
  // 2020 - Malampa (16)
  { province: "Malampa", year: "2020", land_cover_type: "Water bodies", land_area: 74.0 },
  { province: "Malampa", year: "2020", land_cover_type: "Coconut plantations", land_area: 325.63 },
  { province: "Malampa", year: "2020", land_cover_type: "Grassland", land_area: 165.51 },
  { province: "Malampa", year: "2020", land_cover_type: "Mangrove", land_area: 42.54 },
  { province: "Malampa", year: "2020", land_cover_type: "Agriculture", land_area: 1146.39 },
  { province: "Malampa", year: "2020", land_cover_type: "Barelands", land_area: 111.08 },
  { province: "Malampa", year: "2020", land_cover_type: "Builtup Infrastructure", land_area: 76.46 },
  { province: "Malampa", year: "2020", land_cover_type: "Dense Forest", land_area: 530.96 },
  { province: "Malampa", year: "2020", land_cover_type: "Open Forest", land_area: 317.34 },
  // 2020 - Shefa (17)
  { province: "Shefa", year: "2020", land_cover_type: "Water bodies", land_area: 14.93 },
  { province: "Shefa", year: "2020", land_cover_type: "Coconut plantations", land_area: 140.75 },
  { province: "Shefa", year: "2020", land_cover_type: "Grassland", land_area: 149.34 },
  { province: "Shefa", year: "2020", land_cover_type: "Mangrove", land_area: 8.95 },
  { province: "Shefa", year: "2020", land_cover_type: "Agriculture", land_area: 689.63 },
  { province: "Shefa", year: "2020", land_cover_type: "Barelands", land_area: 11.29 },
  { province: "Shefa", year: "2020", land_cover_type: "Builtup Infrastructure", land_area: 15.36 },
  { province: "Shefa", year: "2020", land_cover_type: "Dense Forest", land_area: 223.05 },
  { province: "Shefa", year: "2020", land_cover_type: "Open Forest", land_area: 244.96 },
  // 2020 - Tafea (18)
  { province: "Tafea", year: "2020", land_cover_type: "Water bodies", land_area: 50.88 },
  { province: "Tafea", year: "2020", land_cover_type: "Coconut plantations", land_area: 224.36 },
  { province: "Tafea", year: "2020", land_cover_type: "Grassland", land_area: 67.53 },
  { province: "Tafea", year: "2020", land_cover_type: "Mangrove", land_area: 53.76 },
  { province: "Tafea", year: "2020", land_cover_type: "Agriculture", land_area: 630.55 },
  { province: "Tafea", year: "2020", land_cover_type: "Barelands", land_area: 20.58 },
  { province: "Tafea", year: "2020", land_cover_type: "Builtup Infrastructure", land_area: 24.36 },
  { province: "Tafea", year: "2020", land_cover_type: "Dense Forest", land_area: 327.86 },
  { province: "Tafea", year: "2020", land_cover_type: "Open Forest", land_area: 226.24 },
  // 2023 - Torba
  { province: "Torba", year: "2023", land_cover_type: "Water bodies", land_area: 64.89 },
  { province: "Torba", year: "2023", land_cover_type: "Coconut plantations", land_area: 88.4 },
  { province: "Torba", year: "2023", land_cover_type: "Grassland", land_area: 32.81 },
  { province: "Torba", year: "2023", land_cover_type: "Mangrove", land_area: 2.89 },
  { province: "Torba", year: "2023", land_cover_type: "Agriculture", land_area: 314.78 },
  { province: "Torba", year: "2023", land_cover_type: "Barelands", land_area: 59.17 },
  { province: "Torba", year: "2023", land_cover_type: "Builtup Infrastructure", land_area: 8.0 },
  { province: "Torba", year: "2023", land_cover_type: "Dense Forest", land_area: 156.63 },
  { province: "Torba", year: "2023", land_cover_type: "Open Forest", land_area: 131.7 },
  // 2023 - Sanma
  { province: "Sanma", year: "2023", land_cover_type: "Water bodies", land_area: 5.59 },
  { province: "Sanma", year: "2023", land_cover_type: "Coconut plantations", land_area: 178.74 },
  { province: "Sanma", year: "2023", land_cover_type: "Grassland", land_area: 120.66 },
  { province: "Sanma", year: "2023", land_cover_type: "Mangrove", land_area: 19.69 },
  { province: "Sanma", year: "2023", land_cover_type: "Agriculture", land_area: 2066.36 },
  { province: "Sanma", year: "2023", land_cover_type: "Barelands", land_area: 123.44 },
  { province: "Sanma", year: "2023", land_cover_type: "Builtup Infrastructure", land_area: 48.4 },
  { province: "Sanma", year: "2023", land_cover_type: "Dense Forest", land_area: 756.43 },
  { province: "Sanma", year: "2023", land_cover_type: "Open Forest", land_area: 895.62 },
  // 2023 - Penama
  { province: "Penama", year: "2023", land_cover_type: "Water bodies", land_area: 54.0 },
  { province: "Penama", year: "2023", land_cover_type: "Coconut plantations", land_area: 88.05 },
  { province: "Penama", year: "2023", land_cover_type: "Grassland", land_area: 14.24 },
  { province: "Penama", year: "2023", land_cover_type: "Mangrove", land_area: 13.64 },
  { province: "Penama", year: "2023", land_cover_type: "Agriculture", land_area: 528.39 },
  { province: "Penama", year: "2023", land_cover_type: "Barelands", land_area: 94.17 },
  { province: "Penama", year: "2023", land_cover_type: "Builtup Infrastructure", land_area: 9.46 },
  { province: "Penama", year: "2023", land_cover_type: "Dense Forest", land_area: 264.85 },
  { province: "Penama", year: "2023", land_cover_type: "Open Forest", land_area: 130.89 },
  // 2023 - Malampa
  { province: "Malampa", year: "2023", land_cover_type: "Water bodies", land_area: 59.6 },
  { province: "Malampa", year: "2023", land_cover_type: "Coconut plantations", land_area: 203.17 },
  { province: "Malampa", year: "2023", land_cover_type: "Grassland", land_area: 78.39 },
  { province: "Malampa", year: "2023", land_cover_type: "Mangrove", land_area: 58.11 },
  { province: "Malampa", year: "2023", land_cover_type: "Agriculture", land_area: 399.81 },
  { province: "Malampa", year: "2023", land_cover_type: "Barelands", land_area: 81.54 },
  { province: "Malampa", year: "2023", land_cover_type: "Builtup Infrastructure", land_area: 14.72 },
  { province: "Malampa", year: "2023", land_cover_type: "Dense Forest", land_area: 1276.3 },
  { province: "Malampa", year: "2023", land_cover_type: "Open Forest", land_area: 618.27 },
  // 2023 - Shefa
  { province: "Shefa", year: "2023", land_cover_type: "Water bodies", land_area: 6.1 },
  { province: "Shefa", year: "2023", land_cover_type: "Coconut plantations", land_area: 83.09 },
  { province: "Shefa", year: "2023", land_cover_type: "Grassland", land_area: 116.07 },
  { province: "Shefa", year: "2023", land_cover_type: "Mangrove", land_area: 7.22 },
  { province: "Shefa", year: "2023", land_cover_type: "Agriculture", land_area: 738.44 },
  { province: "Shefa", year: "2023", land_cover_type: "Barelands", land_area: 32.78 },
  { province: "Shefa", year: "2023", land_cover_type: "Builtup Infrastructure", land_area: 14.66 },
  { province: "Shefa", year: "2023", land_cover_type: "Dense Forest", land_area: 282.28 },
  { province: "Shefa", year: "2023", land_cover_type: "Open Forest", land_area: 217.62 },
  // 2023 - Tafea
  { province: "Tafea", year: "2023", land_cover_type: "Water bodies", land_area: 5.75 },
  { province: "Tafea", year: "2023", land_cover_type: "Coconut plantations", land_area: 251.23 },
  { province: "Tafea", year: "2023", land_cover_type: "Grassland", land_area: 29.59 },
  { province: "Tafea", year: "2023", land_cover_type: "Mangrove", land_area: 65.38 },
  { province: "Tafea", year: "2023", land_cover_type: "Agriculture", land_area: 656.89 },
  { province: "Tafea", year: "2023", land_cover_type: "Barelands", land_area: 65.01 },
  { province: "Tafea", year: "2023", land_cover_type: "Builtup Infrastructure", land_area: 4.3 },
  { province: "Tafea", year: "2023", land_cover_type: "Dense Forest", land_area: 417.54 },
  { province: "Tafea", year: "2023", land_cover_type: "Open Forest", land_area: 130.43 },
];
