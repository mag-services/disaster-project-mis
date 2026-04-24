import { FeatureCollection, Geometry } from "geojson";

export type ProvinceFeature = {
  name: string;
  value?: number;
};

export type AreaCouncilFeature = {
  name: string;
  province: number;
  value?: number;
};

export type ProvincesGeoJSON = FeatureCollection<Geometry, ProvinceFeature>;

export type AreaCouncilGeoJSON = FeatureCollection<
  Geometry,
  AreaCouncilFeature
>;

export type BlobType = {
  blob: Blob;
  extension: string;
  mimeType: string;
};
