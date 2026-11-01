import { env } from '../config/env.js';
import { ApiError } from '../common/errors/apiError.js';

function formatStepInstruction(step) {
  const type = step.maneuver?.type || 'turn';
  const modifier = step.maneuver?.modifier || '';
  const street = step.name ? `onto ${step.name}` : '';

  if (type === 'depart') {
    return step.name ? `Depart onto ${step.name}` : 'Depart from starting point';
  }
  if (type === 'arrive') {
    return 'Arrive at destination';
  }
  if (type === 'roundabout' || type === 'rotary') {
    return step.name ? `Enter roundabout and take exit ${street}` : 'Enter roundabout';
  }
  if (type === 'end of road') {
    return `Turn ${modifier || 'left'} at the end of the road ${street}`.trim();
  }
  if (type === 'fork') {
    return `Keep ${modifier || 'straight'} at the fork ${street}`.trim();
  }
  if (type === 'merge') {
    return `Merge ${modifier ? modifier + ' ' : ''}${street}`.trim();
  }
  if (type === 'on ramp') {
    return `Take ramp ${street}`.trim();
  }
  if (type === 'off ramp') {
    return `Take exit ${street}`.trim();
  }
  if (type === 'continue' || type === 'new name') {
    return `Continue ${modifier ? modifier + ' ' : ''}${street || 'straight'}`.trim();
  }
  if (modifier === 'uturn') {
    return `Make a U-turn ${street}`.trim();
  }
  if (modifier) {
    return `Turn ${modifier} ${street}`.trim();
  }
  return `Continue ${street || 'straight'}`.trim();
}

export class OsrmService {
  async optimizeTrip(coordinates) {
    const coordsString = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const url = `${env.OSRM_API_URL}/trip/v1/driving/${coordsString}?source=first&roundtrip=false&geometries=geojson&overview=full&steps=true`;

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

    const steps = (trip.legs || [])
      .flatMap((leg) => leg.steps || [])
      .map((step) => ({
        instruction: formatStepInstruction(step),
        streetName: step.name || 'Unnamed Road',
        distanceMeters: Math.round(step.distance || 0),
        type: step.maneuver?.type || 'turn',
        modifier: step.maneuver?.modifier || '',
        location: step.maneuver?.location || [0, 0],
      }));

    return {
      distanceKm: distance / 1000,
      durationMin: Math.round(duration / 60),
      geometry: JSON.stringify(geometry),
      steps,
      waypointsOrder: waypoints.map((w) => w.waypoint_index),
    };
  }
}

export const osrmService = new OsrmService();
