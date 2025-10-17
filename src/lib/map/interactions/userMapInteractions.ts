import type maplibreglType from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import { closeAllPopups } from '@/lib/map';
import { getUsageLabel } from '@/lib/constants';

interface EditingFeature {
  track_id: string;
  name: string;
  description: string;
  usage_types: string;
  date: string | null;
  note: string | null;
  partial: boolean | null;
}

interface UserMapInteractionCallbacks {
  onRouteClick: (feature: EditingFeature) => void;
}

/**
 * Setup all map interactions for user map
 */
export function setupUserMapInteractions(
  mapInstance: maplibreglType.Map,
  callbacks: UserMapInteractionCallbacks
) {
  const { onRouteClick } = callbacks;
  let currentPopup: maplibregl.Popup | null = null;

  // Click handler for editing routes
  const handleClick = (e: maplibreglType.MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const properties = feature.properties;

    if (!properties) return;

    // Close any open popups
    closeAllPopups();
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }

    onRouteClick({
      track_id: properties.track_id,
      name: properties.name,
      description: properties.description,
      usage_types: properties.usage_types,
      date: properties.date,
      note: properties.note,
      partial: properties.partial
    });
  };

  // Hover handler for route popups
  const handleRouteMouseMove = (e: maplibreglType.MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) {
      if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
      }
      return;
    }

    const feature = e.features[0];
    const properties = feature.properties;

    if (!properties) return;

    let popupContent = `<div class="railway-popup" style="color: black;">`;

    if (properties.name) {
      popupContent += `<h3 class="font-bold text-lg mb-2" style="color: black;">${properties.name}</h3>`;
    }

    let formattedDescription = "";
    if (properties.description) {
      formattedDescription += `<i style="color: black;">${properties.description}</i><br />`;
    }
    formattedDescription += `Usage: ${getUsageLabel(properties.usage_type)}`;

    if (properties.date || properties.note) {
      formattedDescription += `<hr class="my-2" />`;
    }
    if (properties.date) {
      formattedDescription += `<span style="color: black;">Date: ${new Intl.DateTimeFormat("cs-CZ").format(new Date(properties.date))}</span>`;
    }
    if (properties.note) {
      formattedDescription += `<br /><span style="color: black;">${properties.note}</span>`;
    }

    popupContent += `<div class="mb-2">${formattedDescription}</div>`;
    popupContent += `</div>`;

    // Remove old popup if exists
    if (currentPopup) {
      currentPopup.remove();
    }

    // Create new popup
    currentPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
      .setLngLat(e.lngLat)
      .setHTML(popupContent)
      .addTo(mapInstance);
  };

  // Hover handler for station popups (takes precedence)
  const handleStationMouseMove = (e: maplibreglType.MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) {
      return;
    }

    const feature = e.features[0];
    const properties = feature.properties;

    if (!properties) return;

    let popupContent = `<div class="station-popup" style="color: black;">`;

    if (properties.name) {
      popupContent += `<h3 class="font-bold text-base mb-1" style="color: black;">${properties.name}</h3>`;
      popupContent += `<div class="text-xs text-gray-600">Station</div>`;
    }

    popupContent += `</div>`;

    // Remove old popup if exists
    if (currentPopup) {
      currentPopup.remove();
    }

    // Create new popup for station
    currentPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
      .setLngLat(e.lngLat)
      .setHTML(popupContent)
      .addTo(mapInstance);
  };

  // Cursor handlers for routes
  const handleRouteMouseEnter = () => {
    mapInstance.getCanvas().style.cursor = 'pointer';
  };

  const handleRouteMouseLeave = () => {
    mapInstance.getCanvas().style.cursor = '';
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  };

  // Cursor handlers for stations
  const handleStationMouseEnter = () => {
    mapInstance.getCanvas().style.cursor = 'pointer';
  };

  const handleStationMouseLeave = () => {
    mapInstance.getCanvas().style.cursor = '';
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  };

  // Attach route handlers
  mapInstance.on('click', 'railway_routes', handleClick);
  mapInstance.on('mousemove', 'railway_routes', handleRouteMouseMove);
  mapInstance.on('mouseenter', 'railway_routes', handleRouteMouseEnter);
  mapInstance.on('mouseleave', 'railway_routes', handleRouteMouseLeave);

  // Attach station handlers (added after routes, so they take precedence due to layer order)
  mapInstance.on('mousemove', 'stations', handleStationMouseMove);
  mapInstance.on('mouseenter', 'stations', handleStationMouseEnter);
  mapInstance.on('mouseleave', 'stations', handleStationMouseLeave);

  // Cleanup function
  return () => {
    if (currentPopup) {
      currentPopup.remove();
    }
    // Remove route handlers
    mapInstance.off('click', 'railway_routes', handleClick);
    mapInstance.off('mousemove', 'railway_routes', handleRouteMouseMove);
    mapInstance.off('mouseenter', 'railway_routes', handleRouteMouseEnter);
    mapInstance.off('mouseleave', 'railway_routes', handleRouteMouseLeave);
    // Remove station handlers
    mapInstance.off('mousemove', 'stations', handleStationMouseMove);
    mapInstance.off('mouseenter', 'stations', handleStationMouseEnter);
    mapInstance.off('mouseleave', 'stations', handleStationMouseLeave);
  };
}
