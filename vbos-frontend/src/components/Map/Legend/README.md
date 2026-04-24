# Map Legend Component

A comprehensive legend system for displaying active map layers with metadata, visualization details, and interactive controls.

## Overview

The Legend component automatically displays information about all active layers on the map, including tabular (choropleth), vector (geometry), and raster (imagery) layers. It provides a clean, consistent UI for understanding what data is currently visualized.

## Architecture

The Legend component consists of:
- types.ts - TypeScript type definitions
- Legend.tsx - Main container component
- LayerEntry.tsx - Individual layer entry renderer
- OpacityControl.tsx - Opacity adjustment slider
- LayerInfoModal.tsx - Dataset metadata modal
- index.ts - Barrel exports

Supporting files:
- /hooks/useLegendLayers.ts - Hook that prepares legend data from store and API

## Usage

The Legend is automatically integrated into the Map component. It will automatically show when layers are active, hide when no layers are active, display layer metadata (name, type, unit, visualization style), and provide controls for opacity adjustment, layer info, and removal.

## Data Flow

URL parameters flow through the Layer Store to the useLegendLayers hook, which fetches dataset metadata via the getLayerMetadata API function. The hook enriches the data with visualization info and returns an array of LegendLayer objects that the Legend component renders.

## Layer Types

### Tabular Layers

Tabular layers represent statistical data visualized as choropleth maps on administrative boundaries. They show data range (min/max values from useAdminAreaStats), display unit of measurement, show a sequential color gradient visualization, and support opacity control. Only one tabular layer can be active at a time.

### Vector Layers

Vector layers display geometric features (points, lines, polygons) from GeoJSON data. They show geometry type (Point, LineString, Polygon, etc.) detected from actual data, display color coding (orange for lines, blue for points), support opacity control, and multiple vector layers can be active simultaneously.

### Raster Layers

Raster layers display continuous imagery or grid data (satellite imagery, elevation, etc.). They show opacity level and display color scheme description. Only one raster layer can be active at a time.

## Features

### Interactive Controls

Each layer entry provides:
- **Info button** - Opens a modal with detailed dataset metadata (name, type, unit, source, data range for tabular layers, geometry type for vector layers)
- **Opacity slider** - Adjusts layer transparency from 0-100% using a popover control
- **Remove button** - Toggles the layer off

### Styling

The Legend uses Chakra UI's theme system with semantic tokens for background, border, and text colors. The legend is positioned at the bottom-left of the map with a fixed width and uses layered z-index for proper stacking.

## Implementation Details

### Data Fetching

The useLegendLayers hook uses React Query to cache dataset metadata via the shared getLayerMetadata API function. This prevents duplicate requests and ensures metadata is shared across components. The hook also calls useAdminAreaStats to get accurate min/max values for tabular layers that match what's rendered on the map.

### Geometry Detection

For vector layers, the hook examines cached GeoJSON data from the query client to determine the actual geometry type (Point vs LineString) and applies the appropriate color scheme.

### Opacity Management

Layer opacity is managed through a Zustand store and applied to both vector layers and tabular layers using MapLibre expressions. The opacity control uses a Chakra UI popover with a slider component.

## Performance

- React Query caches dataset metadata with a 5-minute stale time
- Legend only re-renders when active layers change
- Metadata requests are shared across components
- The legend stays mounted when switching layers to avoid unnecessary unmounting
