import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/src/data/mock_user_repository.dart';
import 'package:flutter_app/src/screens/startup_gate_screen.dart';
import 'package:flutter_app/src/services/location_service.dart';
import 'package:flutter_app/src/services/traceability_service.dart';
import 'package:flutter_app/src/theme/app_theme.dart';

class AppDependencies {
  AppDependencies({
    required this.userRepository,
    required this.traceabilityService,
    required this.locationService,
  });

  final MockUserRepository userRepository;
  final TraceabilityService traceabilityService;
  final LocationService locationService;
}

class TraceabilityApp extends StatelessWidget {
  const TraceabilityApp({super.key});

  String _backendBaseUrl() {
    return 'https://supply-chain-backend-iokg.onrender.com/api/v1';
  }

  @override
  Widget build(BuildContext context) {
    final AppDependencies deps = AppDependencies(
      userRepository: const MockUserRepository(),
      traceabilityService: TraceabilityService(
        backendBaseUrl: _backendBaseUrl(),
      ),
      locationService: const LocationService(),
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ChainTrace',
      theme: AppTheme.light(),
      home: StartupGateScreen(deps: deps),
    );
  }
}
