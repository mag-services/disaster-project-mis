/**
 * Land cover change impacts: "Why it matters" storytelling content.
 */
import type { LandAccountCategory } from "@/data/landAccountsData";

export interface LandCoverImpact {
  category: LandAccountCategory;
  /** Short impact statement when this category decreases */
  lossImpact: string;
  /** Short impact statement when this category increases */
  gainImpact: string;
}

export const LAND_COVER_IMPACTS: LandCoverImpact[] = [
  {
    category: "Forest",
    lossImpact: "Reduces rainfall capture, increases erosion and landslide risk",
    gainImpact: "Improves carbon storage and cyclone buffering",
  },
  {
    category: "Grassland",
    lossImpact: "Reduces grazing capacity and soil stabilisation",
    gainImpact: "Supports grazing and soil retention",
  },
  {
    category: "Mangrove",
    lossImpact: "Weakens coastal protection and fishery habitat",
    gainImpact: "Strengthens coastal buffers and storm surge protection",
  },
  {
    category: "Built Up",
    lossImpact: "Less common",
    gainImpact: "Indicates urban expansion; can increase runoff and heat island effects",
  },
  {
    category: "Bareland",
    lossImpact: "Improves land usability",
    gainImpact: "Increases erosion risk and sediment runoff",
  },
  {
    category: "Water Bodies",
    lossImpact: "Reduces water supply and wetland habitat",
    gainImpact: "Improves water storage and ecosystem services",
  },
];
