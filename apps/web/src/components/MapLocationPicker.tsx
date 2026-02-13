'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

interface MapLocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: { lat: number; lng: number };
}

export default function MapLocationPicker({
  onLocationSelect,
  initialLocation,
}: MapLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    if (window.google?.maps) {
      initializeMap();
      return;
    }

    window.initGoogleMaps = () => {
      initializeMap();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      scripts.forEach(s => s.remove());
    };
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = initialLocation || { lat: 19.076, lng: 72.8777 }; // Mumbai default

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    const markerInstance = new window.google.maps.Marker({
      position: defaultCenter,
      map: mapInstance,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    // Handle marker drag
    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      if (position) {
        reverseGeocode(position.lat(), position.lng());
      }
    });

    // Handle map click
    mapInstance.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      markerInstance.setPosition(e.latLng);
      reverseGeocode(lat, lng);
    });

    // Setup Places Autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'in' },
          fields: ['geometry', 'address_components', 'formatted_address'],
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          mapInstance.setCenter({ lat, lng });
          mapInstance.setZoom(17);
          markerInstance.setPosition({ lat, lng });

          processPlaceResult(place, lat, lng);
        }
      });
    }

    setMap(mapInstance);
    setMarker(markerInstance);
    setIsLoading(false);

    // Try to get user's current location
    if (navigator.geolocation && !initialLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.setCenter({ lat: latitude, lng: longitude });
          markerInstance.setPosition({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
        },
        () => {
          // Failed to get location, use default
          reverseGeocode(defaultCenter.lat, defaultCenter.lng);
        }
      );
    } else {
      reverseGeocode(defaultCenter.lat, defaultCenter.lng);
    }
  }, [initialLocation]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      setIsSearching(false);

      if (status === 'OK' && results[0]) {
        processPlaceResult(results[0], lat, lng);
      }
    });
  };

  const processPlaceResult = (place: any, lat: number, lng: number) => {
    const addressComponents = place.address_components || [];

    let city = '';
    let state = '';
    let pincode = '';
    let locality = '';
    let sublocality = '';

    addressComponents.forEach((component: any) => {
      const types = component.types;

      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (types.includes('postal_code')) {
        pincode = component.long_name;
      }
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        sublocality = component.long_name;
      }
      if (types.includes('neighborhood')) {
        locality = component.long_name;
      }
    });

    const locationData: LocationData = {
      latitude: lat,
      longitude: lng,
      address: locality || sublocality || '',
      city,
      state,
      pincode,
      formattedAddress: place.formatted_address || '',
    };

    setSelectedLocation(locationData);
    onLocationSelect(locationData);
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !window.google) return;

    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      { address: searchQuery + ', India' },
      (results: any[], status: string) => {
        setIsSearching(false);

        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          map?.setCenter({ lat, lng });
          map?.setZoom(17);
          marker?.setPosition({ lat, lng });

          processPlaceResult(results[0], lat, lng);
        }
      }
    );
  };

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <MapPin className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-yellow-800 font-medium mb-2">Map Not Available</p>
        <p className="text-yellow-600 text-sm">
          {error}. Please enter your location details manually below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for your locality, landmark, or address..."
          className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
        )}
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200">
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-64 md:h-80" />
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate">
                {selectedLocation.address || selectedLocation.city || 'Selected Location'}
              </p>
              <p className="text-sm text-neutral-500 truncate">
                {selectedLocation.formattedAddress}
              </p>
              {selectedLocation.pincode && (
                <p className="text-xs text-primary-600 mt-1">
                  Pincode: {selectedLocation.pincode}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-400 text-center">
        Drag the marker or tap on the map to adjust your neighborhood location
      </p>
    </div>
  );
}
