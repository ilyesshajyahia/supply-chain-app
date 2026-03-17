import 'package:geolocator/geolocator.dart';
import 'package:flutter_app/src/models/domain_models.dart';

class LocationResult {
  const LocationResult({this.point, this.error});
  final GeoPoint? point;
  final String? error;
}

class LocationService {
  const LocationService();

  Future<LocationResult> getCurrentLocation() async {
    final bool enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      return const LocationResult(
        error: 'Location service is disabled on the device.',
      );
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      return const LocationResult(error: 'Location permission denied.');
    }
    if (permission == LocationPermission.deniedForever) {
      return const LocationResult(
        error: 'Location permission denied forever. Enable it in settings.',
      );
    }

    final Position pos = await Geolocator.getCurrentPosition();
    return LocationResult(point: GeoPoint(pos.latitude, pos.longitude));
  }
}
