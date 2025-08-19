"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { StarIcon, MapPinIcon, EuroIcon, BedIcon, RulerIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Property {
  id: number;
  title: string;
  price: number;
  rooms: number;
  sqr_meters: number;
  area_name: string;
  subarea_name: string;
  category_name: string;
  subcategory_name: string;
  primary_image?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  golden_visa_eligible?: boolean;
}

interface PropertyMapProps {
  properties: Property[];
}

// Default center of Athens
const ATHENS_CENTER = {
  lat: 37.9755,
  lng: 23.7348
};

export default function PropertyMap({ properties }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Check if Google Maps is available
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps script is loaded
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
    } else {
      // Load Google Maps script if not available
      loadGoogleMapsScript();
    }
  }, []);

  const loadGoogleMapsScript = () => {
    if (document.getElementById('google-maps-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setIsGoogleMapsLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      // Fallback to OpenStreetMap or show error message
    };
    document.head.appendChild(script);
  };

  // Initialize map
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: ATHENS_CENTER,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(newMap);
  }, [isGoogleMapsLoaded, map]);

  // Update markers when properties change
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Add new markers
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    properties.forEach(property => {
      if (property.latitude && property.longitude) {
        const position = { 
          lat: property.latitude, 
          lng: property.longitude 
        };

        const marker = new google.maps.Marker({
          position,
          map,
          title: property.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: property.golden_visa_eligible ? '#EAB308' : '#3B82F6',
            fillOpacity: 0.8,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          }
        });

        marker.addListener('click', () => {
          setSelectedProperty(property);
        });

        newMarkers.push(marker);
        bounds.extend(position);
      }
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
      
      // Don't zoom in too much for single properties
      const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom()! > 16) map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, properties, isGoogleMapsLoaded]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!isGoogleMapsLoaded) {
    return (
      <div className="h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading map...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure Google Maps API key is configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Regular Property</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Golden Visa Eligible</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {properties.length} properties shown
        </div>
      </div>

      {/* Property Info Panel */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80">
          <Card className="bg-background/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {selectedProperty.title}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    {selectedProperty.subarea_name}, {selectedProperty.area_name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-muted-foreground hover:text-foreground text-lg"
                >
                  ×
                </button>
              </div>

              {selectedProperty.primary_image && (
                <div className="relative h-32 rounded-md overflow-hidden mb-3">
                  <Image
                    src={selectedProperty.primary_image}
                    alt={selectedProperty.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold text-primary">
                  {formatPrice(selectedProperty.price)}
                </div>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {selectedProperty.category_name}
                  </Badge>
                  {selectedProperty.golden_visa_eligible && (
                    <Badge variant="default" className="text-xs bg-yellow-600">
                      <StarIcon className="w-3 h-3 mr-1" />
                      Golden Visa
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center">
                  <BedIcon className="w-3 h-3 mr-1" />
                  {selectedProperty.rooms}
                </div>
                <div className="flex items-center">
                  <RulerIcon className="w-3 h-3 mr-1" />
                  {selectedProperty.sqr_meters} m²
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {selectedProperty.description}
              </p>

              <Link href={`/properties/${selectedProperty.id}`}>
                <Button size="sm" className="w-full">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      {!selectedProperty && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground">
            Click on markers to view property details
          </p>
        </div>
      )}
    </div>
  );
}