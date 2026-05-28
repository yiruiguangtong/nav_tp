const RECENT_POIS_STORAGE_KEY = 'telecom-recent-pois-v1';
const SEARCH_RESULT_LIMIT = 10;
export const SEARCH_FLOOR_ALL = 'all';

export function readRecentPoiIds(pointsOfInterest) {
  try {
    const records = JSON.parse(localStorage.getItem(RECENT_POIS_STORAGE_KEY) || '[]');
    return records.filter((id) => pointsOfInterest.some((poi) => poi.id === id)).slice(0, 6);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function createSearchController({
  ui,
  state,
  pointsOfInterest,
  floorDefinitions,
  floorLabel,
  floorShortLabel,
  getPoi,
  setAgentPosition,
  clearRoute,
  setStatus,
  routeToPoi,
  routeFromControls,
  setHoveredPoi,
  updatePoiMarkerStates,
  expandPanel
}) {
  function populateControls() {
    ui.startInput.value = 'Current position';
    renderStartResults(searchStartEntries(''));
    renderDestinationResults(searchPois(''));
  }

  function rememberRecentPoi(poiId) {
    if (!poiId || poiId === 'current' || !pointsOfInterest.some((poi) => poi.id === poiId)) {
      return;
    }

    state.recentPoiIds = [poiId, ...state.recentPoiIds.filter((id) => id !== poiId)].slice(0, 6);
    localStorage.setItem(RECENT_POIS_STORAGE_KEY, JSON.stringify(state.recentPoiIds));
  }

  function applyStartSelection() {
    const selectedEntry = state.selectedStartId
      ? getStartEntries().find((entry) => entry.id === state.selectedStartId)
      : findStartEntryByInput(ui.startInput.value);

    if (!selectedEntry) {
      return;
    }

    state.selectedStartId = selectedEntry.id;
    ui.startInput.value = selectedEntry.label;

    if (selectedEntry.id === 'current' || !selectedEntry.position) {
      return;
    }

    setAgentPosition(selectedEntry.position);
    clearRoute({ keepDestination: true });
    setStatus(`Start: ${selectedEntry.label}`, state.navReady ? 'ready' : 'loading');
  }

  function refreshDestinationResults() {
    renderDestinationResults(searchPois(ui.destinationInput.value));
  }

  function createSearchToolbar(kind) {
    const toolbar = document.createElement('div');
    toolbar.className = 'search-toolbar';

    const label = document.createElement('span');
    label.className = 'search-filter-label';
    label.textContent = 'Floor';
    toolbar.append(label);

    const activeFilter = kind === 'start' ? state.startFloorFilter : state.destinationFloorFilter;
    const filterItems = [
      { id: SEARCH_FLOOR_ALL, label: 'All' },
      ...floorDefinitions.map((floor) => ({ id: String(floor.id), label: floor.shortLabel }))
    ];

    filterItems.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-filter-chip';
      button.textContent = item.label;
      button.setAttribute('aria-pressed', String(String(activeFilter) === item.id));
      button.addEventListener('click', () => setSearchFloorFilter(kind, item.id));
      toolbar.append(button);
    });

    return toolbar;
  }

  function setSearchFloorFilter(kind, floorId) {
    if (kind === 'start') {
      state.startFloorFilter = floorId;
      renderStartResults(searchStartEntries(getStartSearchValue()));
      showStartResults();
      return;
    }

    state.destinationFloorFilter = floorId;
    renderDestinationResults(searchPois(ui.destinationInput.value));
    showDestinationResults();
  }

  function handleStartInput() {
    expandPanel();
    state.selectedStartId = '';
    state.activeStartIndex = -1;
    const results = searchStartEntries(ui.startInput.value);
    renderStartResults(results);
    showStartResults();
  }

  function clearStartInput() {
    expandPanel();
    ui.startInput.value = 'Current position';
    state.selectedStartId = 'current';
    renderStartResults(searchStartEntries(''));
    showStartResults();
    setStatus('Start: Current position', state.navReady ? 'ready' : 'loading');
    ui.startInput.focus();
  }

  function handleClearStartPointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    clearStartInput();
  }

  function handleStartFocus() {
    expandPanel();
    const results = searchStartEntries(getStartSearchValue());
    renderStartResults(results);
    showStartResults();
  }

  function showStartResults() {
    ui.startResults.hidden = false;
    ui.startInput.setAttribute('aria-expanded', 'true');
  }

  function hideStartResults() {
    ui.startResults.hidden = true;
    ui.startInput.setAttribute('aria-expanded', 'false');
    state.activeStartIndex = -1;
    updateStartSelection();
  }

  function renderStartResults(results) {
    state.startSearchResults = results.slice(0, SEARCH_RESULT_LIMIT);
    state.activeStartIndex = state.startSearchResults.length ? 0 : -1;
    const toolbar = createSearchToolbar('start');

    if (!state.startSearchResults.length) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = 'No matching start point';
      ui.startResults.replaceChildren(toolbar, empty);
      return;
    }

    ui.startResults.replaceChildren(
      toolbar,
      ...state.startSearchResults.map((entry, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'search-option';
        option.id = `start-option-${entry.id}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === state.activeStartIndex));
        if (entry.position) {
          option.addEventListener('mouseenter', () => setHoveredPoi(entry.id));
          option.addEventListener('mouseleave', () => setHoveredPoi(null));
        }
        option.addEventListener('click', () => selectStartEntry(entry));

        const label = document.createElement('strong');
        label.textContent = entry.label;

        const detail = document.createElement('small');
        detail.textContent = getSearchDetail(entry);

        const floor = document.createElement('span');
        floor.textContent = entry.floor ? floorShortLabel(entry.floor) : 'Now';

        option.append(label, detail, floor);
        return option;
      })
    );
  }

  function updateStartSelection() {
    const options = Array.from(ui.startResults.querySelectorAll('.search-option'));
    options.forEach((option, index) => {
      const selected = index === state.activeStartIndex;
      option.setAttribute('aria-selected', String(selected));
      if (selected) {
        ui.startInput.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      }
    });

    if (state.activeStartIndex < 0) {
      ui.startInput.removeAttribute('aria-activedescendant');
    }
  }

  function selectStartEntry(entry) {
    ui.startInput.value = entry.label;
    state.selectedStartId = entry.id;
    rememberRecentPoi(entry.id);
    hideStartResults();
    setHoveredPoi(null);

    if (entry.position) {
      setAgentPosition(entry.position);
      clearRoute({ keepDestination: true });
    }

    setStatus(`Start: ${entry.label}`, state.navReady ? 'ready' : 'loading');
  }

  function handleStartKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (ui.startResults.hidden) {
        showStartResults();
      }
      state.activeStartIndex = Math.min(state.startSearchResults.length - 1, state.activeStartIndex + 1);
      updateStartSelection();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      state.activeStartIndex = Math.max(0, state.activeStartIndex - 1);
      updateStartSelection();
      return;
    }

    if (event.key === 'Escape') {
      hideStartResults();
      return;
    }

    if (event.key === 'Enter') {
      const selectedEntry = state.startSearchResults[state.activeStartIndex] || findStartEntryByInput(ui.startInput.value);
      if (selectedEntry) {
        event.preventDefault();
        selectStartEntry(selectedEntry);
      }
    }
  }

  function searchStartEntries(value) {
    const query = normalizeSearch(value);
    const entries = filterEntriesByFloor(getStartEntries(), state.startFloorFilter);

    if (!query) {
      return orderEntriesByRecent(entries, { includeCurrent: true });
    }

    return entries
      .map((entry) => ({
        entry,
        score: getEntrySearchScore(entry, query)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || compareStartEntries(a.entry, b.entry))
      .map((item) => item.entry);
  }

  function findStartEntryByInput(value) {
    const normalized = normalizeSearch(value);
    const exactMatch = getStartEntries().find((entry) => {
      const labels = [entry.id, entry.label, entry.category, ...entry.aliases].map(normalizeSearch);
      return labels.includes(normalized);
    });

    return exactMatch || searchStartEntries(value)[0] || null;
  }

  function getStartSearchValue() {
    const normalized = normalizeSearch(ui.startInput.value);
    return state.selectedStartId === 'current' && normalized === 'current position' ? '' : ui.startInput.value;
  }

  function getStartEntries() {
    return [
      {
        id: 'current',
        label: 'Current position',
        category: 'Live position',
        floor: null,
        aliases: ['current', 'here', 'my position']
      },
      ...pointsOfInterest
    ];
  }

  function compareStartEntries(a, b) {
    if (!a.floor && b.floor) {
      return -1;
    }
    if (a.floor && !b.floor) {
      return 1;
    }
    return (a.floor || 0) - (b.floor || 0) || a.label.localeCompare(b.label);
  }

  function filterEntriesByFloor(entries, floorFilter) {
    if (floorFilter === SEARCH_FLOOR_ALL) {
      return entries;
    }

    const floor = Number(floorFilter);
    return entries.filter((entry) => entry.floor === floor);
  }

  function orderEntriesByRecent(entries, options = {}) {
    const currentEntry = options.includeCurrent ? entries.find((entry) => entry.id === 'current') : null;
    const poiEntries = entries.filter((entry) => entry.id !== 'current');
    const recentEntries = state.recentPoiIds
      .map((id) => poiEntries.find((entry) => entry.id === id))
      .filter(Boolean);
    const recentIds = new Set(recentEntries.map((entry) => entry.id));
    const otherEntries = poiEntries
      .filter((entry) => !recentIds.has(entry.id))
      .sort(compareStartEntries);

    return currentEntry ? [currentEntry, ...recentEntries, ...otherEntries] : [...recentEntries, ...otherEntries];
  }

  function getSearchDetail(entry) {
    const detailParts = [];

    if (isRecentPoi(entry)) {
      detailParts.push('Recent');
    }

    detailParts.push(entry.category);

    if (entry.floor) {
      detailParts.push(floorLabel(entry.floor));
    }

    return detailParts.join(' - ');
  }

  function isRecentPoi(entry) {
    return entry.id !== 'current' && state.recentPoiIds.includes(entry.id);
  }

  function handleDestinationInput() {
    expandPanel();
    state.selectedDestinationId = '';
    state.activeSearchIndex = -1;
    const results = searchPois(ui.destinationInput.value);
    renderDestinationResults(results);
    showDestinationResults();
  }

  function clearDestinationInput() {
    expandPanel();
    clearRoute({ clearDestination: true });
    renderDestinationResults(searchPois(''));
    showDestinationResults();
    setStatus('Destination cleared', state.navReady ? 'ready' : 'loading');
    ui.destinationInput.focus();
  }

  function handleClearDestinationPointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    clearDestinationInput();
  }

  function handleDestinationFocus() {
    expandPanel();
    const results = searchPois(ui.destinationInput.value);
    renderDestinationResults(results);
    showDestinationResults();
  }

  function handleDocumentPointerDown(event) {
    const inStartSearch =
      event.target === ui.startInput ||
      event.target === ui.clearStartButton ||
      ui.startResults.contains(event.target);
    const inDestinationSearch =
      event.target === ui.destinationInput ||
      event.target === ui.clearDestinationButton ||
      ui.destinationResults.contains(event.target);

    if (!inStartSearch) {
      hideStartResults();
    }

    if (!inDestinationSearch) {
      hideDestinationResults();
    }
  }

  function showDestinationResults() {
    ui.destinationResults.hidden = false;
    ui.destinationInput.setAttribute('aria-expanded', 'true');
  }

  function hideDestinationResults() {
    ui.destinationResults.hidden = true;
    ui.destinationInput.setAttribute('aria-expanded', 'false');
    state.activeSearchIndex = -1;
    updateSearchSelection();
  }

  function renderDestinationResults(results) {
    state.searchResults = results.slice(0, SEARCH_RESULT_LIMIT);
    state.activeSearchIndex = state.searchResults.length ? 0 : -1;
    const toolbar = createSearchToolbar('destination');

    if (!state.searchResults.length) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = 'No matching destination';
      ui.destinationResults.replaceChildren(toolbar, empty);
      return;
    }

    ui.destinationResults.replaceChildren(
      toolbar,
      ...state.searchResults.map((poi, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'search-option';
        option.id = `destination-option-${poi.id}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === state.activeSearchIndex));
        option.addEventListener('mouseenter', () => setHoveredPoi(poi.id));
        option.addEventListener('mouseleave', () => setHoveredPoi(null));
        option.addEventListener('click', () => selectDestinationPoi(poi, { route: true }));

        const label = document.createElement('strong');
        label.textContent = poi.label;

        const detail = document.createElement('small');
        detail.textContent = getSearchDetail(poi);

        const floor = document.createElement('span');
        floor.textContent = floorShortLabel(poi.floor);

        option.append(label, detail, floor);
        return option;
      })
    );
  }

  function updateSearchSelection() {
    const options = Array.from(ui.destinationResults.querySelectorAll('.search-option'));
    options.forEach((option, index) => {
      const selected = index === state.activeSearchIndex;
      option.setAttribute('aria-selected', String(selected));
      if (selected) {
        ui.destinationInput.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      }
    });

    if (state.activeSearchIndex < 0) {
      ui.destinationInput.removeAttribute('aria-activedescendant');
    }
  }

  function selectDestinationPoi(poi, options = {}) {
    ui.destinationInput.value = poi.label;
    state.selectedDestinationId = poi.id;
    state.selectedPoiId = poi.id;
    hideDestinationResults();
    setHoveredPoi(null);
    updatePoiMarkerStates();

    if (options.route) {
      routeToPoi(poi);
    } else {
      setStatus(`Destination: ${poi.label}`, state.navReady ? 'ready' : 'loading');
    }
  }

  function searchPois(value) {
    const query = normalizeSearch(value);
    const pois = filterEntriesByFloor(pointsOfInterest, state.destinationFloorFilter);

    if (!query) {
      return orderEntriesByRecent(pois);
    }

    return pois
      .map((poi) => ({
        poi,
        score: getEntrySearchScore(poi, query)
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || comparePoisByFloor(a.poi, b.poi))
      .map((entry) => entry.poi);
  }

  function getEntrySearchScore(entry, query) {
    const labels = [entry.label, entry.category, entry.id, ...entry.aliases].map(normalizeSearch);
    const queryParts = query.split(' ');
    let score = 0;

    labels.forEach((label, index) => {
      if (label === query) {
        score = Math.max(score, index === 0 ? 100 : 92);
      } else if (label.startsWith(query)) {
        score = Math.max(score, index === 0 ? 82 : 72);
      } else if (label.includes(query)) {
        score = Math.max(score, index === 0 ? 58 : 48);
      } else if (queryParts.every((part) => label.includes(part))) {
        score = Math.max(score, 38);
      } else {
        score = Math.max(score, getFuzzySearchScore(label, query, queryParts, index === 0));
      }
    });

    return score;
  }

  function getFuzzySearchScore(label, query, queryParts, isPrimaryLabel) {
    if (query.length < 3) {
      return 0;
    }

    const labelWords = label.split(/[\s-]+/).filter(Boolean);
    const wholeDistance = getEditDistance(label, query);
    const wholeLimit = getFuzzyLimit(query);

    if (wholeDistance <= wholeLimit) {
      return isPrimaryLabel ? 54 : 44;
    }

    const partsMatch = queryParts.every((part) => {
      if (part.length < 3) {
        return label.includes(part);
      }

      return labelWords.some((word) => getEditDistance(word, part) <= getFuzzyLimit(part));
    });

    return partsMatch ? (isPrimaryLabel ? 42 : 34) : 0;
  }

  function getFuzzyLimit(value) {
    if (value.length <= 4) {
      return 1;
    }

    return value.length <= 8 ? 2 : 3;
  }

  function getEditDistance(a, b) {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = new Array(b.length + 1);

    for (let aIndex = 1; aIndex <= a.length; aIndex += 1) {
      current[0] = aIndex;

      for (let bIndex = 1; bIndex <= b.length; bIndex += 1) {
        const substitutionCost = a[aIndex - 1] === b[bIndex - 1] ? 0 : 1;
        current[bIndex] = Math.min(
          previous[bIndex] + 1,
          current[bIndex - 1] + 1,
          previous[bIndex - 1] + substitutionCost
        );
      }

      previous.splice(0, previous.length, ...current);
    }

    return previous[b.length];
  }

  function normalizeSearch(value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function comparePoisByFloor(a, b) {
    return a.floor - b.floor || a.label.localeCompare(b.label);
  }

  function handleDestinationKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (ui.destinationResults.hidden) {
        showDestinationResults();
      }
      state.activeSearchIndex = Math.min(state.searchResults.length - 1, state.activeSearchIndex + 1);
      updateSearchSelection();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      state.activeSearchIndex = Math.max(0, state.activeSearchIndex - 1);
      updateSearchSelection();
      return;
    }

    if (event.key === 'Escape') {
      hideDestinationResults();
      return;
    }

    if (event.key === 'Enter') {
      const selectedPoi = state.searchResults[state.activeSearchIndex] || findPoiByInput(ui.destinationInput.value);
      if (selectedPoi) {
        event.preventDefault();
        selectDestinationPoi(selectedPoi, { route: true });
        return;
      }

      routeFromControls();
    }
  }

  function findPoiByInput(value) {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    const selectedPoi = getPoi(state.selectedDestinationId);
    if (selectedPoi && normalizeSearch(selectedPoi.label) === normalizeSearch(value)) {
      return selectedPoi;
    }

    const exactMatch = pointsOfInterest.find((poi) => {
      const labels = [poi.id, poi.label, poi.category, ...poi.aliases].map((item) => item.toLowerCase());
      return labels.includes(normalized);
    });

    if (exactMatch) {
      return exactMatch;
    }

    return searchPois(value)[0] || null;
  }

  return {
    populateControls,
    rememberRecentPoi,
    applyStartSelection,
    refreshDestinationResults,
    handleStartInput,
    handleStartFocus,
    handleStartKeydown,
    handleClearStartPointerDown,
    handleDestinationInput,
    handleDestinationFocus,
    handleDestinationKeydown,
    handleClearDestinationPointerDown,
    handleDocumentPointerDown,
    hideDestinationResults,
    showDestinationResults,
    findPoiByInput
  };
}
