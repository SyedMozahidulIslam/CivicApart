import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Report } from '../types';
import { CATEGORIES } from '../utils/bangladeshData';

interface Props {
  reports?: Report[];
  selectedReportId?: string;
  onSelectReport?: (report: Report) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  isPickerMode?: boolean;
  pickerLocation?: { lat: number; lng: number } | null;
  onLocationPick?: (loc: { lat: number; lng: number }) => void;
  lang?: 'en' | 'bn';
}

function createCustomPin(color: string = '#0F2942', isSelected: boolean = false) {
  const size = isSelected ? 34 : 26;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="${size}" height="${size}">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="12" cy="11" r="4.5" fill="#ffffff" />
    </svg>
  `;
  return L.divIcon({
    className: 'custom-map-marker',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export const MapView: React.FC<Props> = ({
  reports = [],
  selectedReportId,
  onSelectReport,
  center = [23.8103, 90.4125],
  zoom = 12,
  height = '460px',
  isPickerMode = false,
  pickerLocation,
  onLocationPick,
  lang = 'en',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | CivicApart Bangladesh',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    if (isPickerMode && onLocationPick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationPick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isPickerMode) return;

    if (pickerLocation) {
      if (!pickerMarkerRef.current) {
        const pickerIcon = createCustomPin('#DC2626', true);
        pickerMarkerRef.current = L.marker([pickerLocation.lat, pickerLocation.lng], {
          icon: pickerIcon,
          draggable: true,
        }).addTo(mapInstanceRef.current);

        pickerMarkerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          if (onLocationPick) {
            onLocationPick({ lat: pos.lat, lng: pos.lng });
          }
        });
      } else {
        pickerMarkerRef.current.setLatLng([pickerLocation.lat, pickerLocation.lng]);
      }
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPickerMode, pickerLocation?.lat, pickerLocation?.lng]);

  useEffect(() => {
    if (!markersLayerRef.current || isPickerMode) return;

    markersLayerRef.current.clearLayers();

    reports.forEach(report => {
      if (!report.location?.latitude || !report.location?.longitude) return;

      const catMeta = CATEGORIES.find(c => c.key === report.category);
      const isSelected = report.id === selectedReportId;
      const markerColor = isSelected ? '#1E3A8A' : catMeta?.color || '#0F2942';

      const marker = L.marker([report.location.latitude, report.location.longitude], {
        icon: createCustomPin(markerColor, isSelected),
        title: report.title,
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; min-width: 200px; max-width: 280px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: #4B5563; background: #F3F4F6; padding: 2px 6px; border-radius: 3px;">
              ${report.publicId}
            </span>
            <span style="font-size: 10px; font-weight: 600; color: #0284C7;">
              ${report.location.locality}
            </span>
          </div>
          <h4 style="font-weight: 700; font-size: 13px; color: #111827; margin: 4px 0; line-height: 1.3;">
            ${report.title}
          </h4>
          <p style="font-size: 11px; color: #4B5563; margin: 4px 0 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${report.description}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E5E7EB; padding-top: 6px;">
            <span style="font-size: 11px; color: #059669; font-weight: 600;">
              ${report.confirmationsCount} ${lang === 'bn' ? 'অনুমোদন' : 'confirmations'}
            </span>
            <button id="btn-popup-${report.id}" style="background: #0F2942; color: #ffffff; border: none; padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer;">
              ${lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Report'}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${report.id}`);
        if (btn && onSelectReport) {
          btn.onclick = () => onSelectReport(report);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [reports, selectedReportId, lang]);

  return (
    <div className="relative w-full overflow-hidden rounded-md border border-gray-300 shadow-xs">
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="w-full z-0 bg-gray-100"
      />
      {isPickerMode && (
        <div className="absolute top-2 left-2 z-1000 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded shadow-sm text-xs font-medium text-gray-800 border border-gray-300">
          📍 {lang === 'bn' ? 'ম্যাপে ক্লিক করে পিন বসান' : 'Click on map to drop or move report location pin'}
        </div>
      )}
    </div>
  );
};
