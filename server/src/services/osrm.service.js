import { env } from '../config/env.js';
import { ApiError } from '../common/errors/apiError.js';

export class OsrmService {
  async optimizeTrip(coordinates) {
    const coordsString = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const url = `${env.OSRM_API_URL}/trip/v1/driving/${coordsString}?source=first&roundtrip=false&geometries=geojson&overview=full`;

    let response;
    try {
      response = await fetch(url);
    } catch {
      throw ApiError.badRequest('Failed to calculate route via OSRM service');
    }

    if (!response.ok) {
      throw ApiError.badRequest('Failed to calculate route via OSRM service');
    }

    let body;
    try {
      body = await response.json();
    } catch {
      throw ApiError.badRequest('Failed to calculate route via OSRM service');
    }

    if (body.code !== 'Ok' || !body.trips?.length) {
      throw ApiError.badRequest('Failed to calculate route via OSRM service');
    }

    const trip = body.trips[0];
    const { distance, duration, geometry } = trip;
    const { waypoints } = body;

    return {
      distanceKm: distance / 1000,
      durationMin: Math.round(duration / 60),
      geometry: JSON.stringify(geometry),
      waypointsOrder: waypoints.map((w) => w.waypoint_index),
    };
  }
}

export const osrmService = new OsrmService();
