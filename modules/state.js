import { SEARCH_FLOOR_ALL } from './searchController.js';

export function createInitialState(recentPoiIds) {
  return {
    navReady: false,
    floorMode: 'auto',
    activeFloor: 1,
    floorObjects: new Map(),
    pickableObjects: [],
    markerObjects: [],
    poiMarkers: new Map(),
    navPath: [],
    routePoints: [],
    routeLabel: '',
    pathObject: null,
    targetObject: null,
    pointerStart: null,
    hoveredPoiId: null,
    selectedPoiId: null,
    selectedStartId: 'current',
    startSearchResults: [],
    activeStartIndex: -1,
    startFloorFilter: SEARCH_FLOOR_ALL,
    selectedDestinationId: '',
    searchResults: [],
    activeSearchIndex: -1,
    destinationFloorFilter: SEARCH_FLOOR_ALL,
    recentPoiIds,
    panelCollapsed: false
  };
}
