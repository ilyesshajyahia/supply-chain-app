import 'package:flutter/material.dart';
import 'package:flutter_app/src/app.dart';
import 'package:flutter_app/src/models/domain_models.dart';
import 'package:flutter_app/src/screens/entry_choice_screen.dart';
import 'package:flutter_app/src/screens/scan_qr_screen.dart';
import 'package:flutter_app/src/screens/org_admin_screen.dart';
import 'package:flutter_app/src/services/location_service.dart';
import 'package:flutter_app/src/theme/app_theme.dart';
import 'package:flutter_app/src/widgets/modern_shell.dart';
import 'package:flutter_app/src/widgets/design_system_widgets.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class ActorDashboardScreen extends StatefulWidget {
  const ActorDashboardScreen({
    super.key,
    required this.deps,
    required this.user,
  });

  final AppDependencies deps;
  final UserAccount user;

  @override
  State<ActorDashboardScreen> createState() => _ActorDashboardScreenState();
}

class _ActorDashboardScreenState extends State<ActorDashboardScreen> {
  GeoPoint? _currentLocation;
  String _locationMessage = 'Fetching current location...';
  String _zoneMessage = 'Loading zone from backend...';
  String _actionResult = 'Ready to scan.';
  bool _processingAction = false;
  bool _finalizeSale = false;
  Geofence? _backendZone;
  final MapController _mapController = MapController();
  final TextEditingController _productName = TextEditingController();
  final TextEditingController _productIdOnChain = TextEditingController();

  Geofence get _effectiveZone => _backendZone ?? widget.user.allowedArea;

  bool get _inRange {
    final GeoPoint? point = _currentLocation;
    if (point == null) return false;
    return _effectiveZone.contains(point);
  }

  @override
  void initState() {
    super.initState();
    _loadBackendZone();
    _refreshLocation();
  }

  @override
  void dispose() {
    _productName.dispose();
    _productIdOnChain.dispose();
    super.dispose();
  }

  Future<void> _refreshLocation() async {
    setState(() => _locationMessage = 'Fetching current location...');
    final LocationResult result = await widget.deps.locationService
        .getCurrentLocation();
    if (!mounted) return;
    setState(() {
      _currentLocation = result.point;
      _locationMessage =
          result.error ??
          'Location updated (${result.point!.lat.toStringAsFixed(4)}, '
              '${result.point!.lng.toStringAsFixed(4)}).';
    });
    if (result.point != null) {
      _mapController.move(LatLng(result.point!.lat, result.point!.lng), 13);
    }
  }

  Future<void> _loadBackendZone() async {
    try {
      final Geofence? zone = await widget.deps.traceabilityService
          .fetchActiveZone(role: widget.user.role);
      if (!mounted) return;
      setState(() {
        _backendZone = zone;
        _zoneMessage = zone == null
            ? 'Using local fallback zone (backend zone not found).'
            : 'Backend zone loaded: ${zone.label}';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _zoneMessage = 'Using local fallback zone (backend unavailable).';
      });
    }
  }

  Future<void> _scanAndProcess() async {
    final String? productId = await Navigator.of(context).push<String>(
      MaterialPageRoute<String>(
        builder: (_) => const ScanQrScreen(title: 'Scan Product QR'),
      ),
    );
    if (!mounted || productId == null || productId.isEmpty) {
      return;
    }
    final GeoPoint? location = _currentLocation;
    if (location == null) {
      setState(
        () => _actionResult = 'Location unavailable. Refresh location first.',
      );
      return;
    }

    setState(() => _processingAction = true);
    final int? onChainId = _productIdOnChain.text.trim().isEmpty
        ? null
        : int.tryParse(_productIdOnChain.text.trim());
    final String result = await widget.deps.traceabilityService
        .processActorScan(
          account: widget.user,
          productId: productId,
          location: location,
          allowedAreaOverride: _effectiveZone,
          productIdOnChain: onChainId,
          productName: _productName.text.trim(),
          finalizeSale: _finalizeSale,
        );
    if (!mounted) return;
    setState(() {
      _processingAction = false;
      _actionResult = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    final Geofence fence = _effectiveZone;
    final LatLng fenceCenter = LatLng(fence.center.lat, fence.center.lng);
    final LatLng mapCenter = _currentLocation == null
        ? fenceCenter
        : LatLng(_currentLocation!.lat, _currentLocation!.lng);

    return Scaffold(
      body: GradientShell(
        title: '${roleLabel(widget.user.role)} Dashboard',
        subtitle:
            'Scan product QR to run your role action. Location must be within your allowed area.',
        child: ListView(
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: <Widget>[
                if (widget.user.role != ActorRole.customer)
                  FutureBuilder<Map<String, dynamic>?>(
                    future: widget.deps.traceabilityService.getProfile(),
                    builder: (context, snapshot) {
                      final bool isAdmin =
                          (snapshot.data?['isOrgAdmin'] == true);
                      if (!isAdmin) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) =>
                                    OrgAdminScreen(deps: widget.deps),
                              ),
                            );
                          },
                          icon: const Icon(Icons.admin_panel_settings_outlined),
                          label: const Text('Admin'),
                        ),
                      );
                    },
                  ),
                OutlinedButton.icon(
                  onPressed: () async {
                    await widget.deps.traceabilityService.logout();
                    if (!mounted) return;
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute<void>(
                        builder: (_) => EntryChoiceScreen(deps: widget.deps),
                      ),
                      (_) => false,
                    );
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Logout'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const ScreenSection(
              title: 'Location Eligibility',
              icon: Icons.location_on_outlined,
              child: SizedBox.shrink(),
            ),
            SoftCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          widget.user.name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      StatusBadge(
                        label: _inRange ? 'In Range' : 'Out of Range',
                        color: _inRange ? AppTheme.success : AppTheme.danger,
                        icon: _inRange
                            ? Icons.verified_outlined
                            : Icons.error_outline,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('Allowed area: ${fence.label}'),
                  const SizedBox(height: 6),
                  Text(_zoneMessage),
                  const SizedBox(height: 14),
                  Row(
                    children: <Widget>[
                      const Icon(Icons.gps_fixed, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_locationMessage)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _refreshLocation,
                    icon: const Icon(Icons.my_location),
                    label: const Text('Refresh Location'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const ScreenSection(
              title: 'Geofence Map',
              icon: Icons.map_outlined,
              child: SizedBox.shrink(),
            ),
            SizedBox(
              height: 260,
              child: SoftCard(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: mapCenter,
                      initialZoom: 13,
                    ),
                    children: <Widget>[
                      TileLayer(
                        urlTemplate:
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.example.flutter_app',
                      ),
                      CircleLayer(
                        circles: <CircleMarker>[
                          CircleMarker(
                            point: fenceCenter,
                            radius: fence.radiusKm * 1000,
                            useRadiusInMeter: true,
                            color: AppTheme.brand.withOpacity(0.2),
                            borderColor: AppTheme.brand,
                            borderStrokeWidth: 2,
                          ),
                        ],
                      ),
                      MarkerLayer(
                        markers: <Marker>[
                          Marker(
                            point: fenceCenter,
                            width: 140,
                            height: 40,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppTheme.brand),
                                boxShadow: AppTheme.softShadow,
                              ),
                              child: Text(
                                fence.label,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 13),
                              ),
                            ),
                          ),
                          if (_currentLocation != null)
                            Marker(
                              point: LatLng(
                                _currentLocation!.lat,
                                _currentLocation!.lng,
                              ),
                              width: 40,
                              height: 40,
                              child: Icon(
                                Icons.my_location,
                                color: _inRange
                                    ? AppTheme.success
                                    : AppTheme.danger,
                                size: 30,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            ScreenSection(
              title: 'Role Workflow',
              icon: Icons.rule_folder_outlined,
              child: SoftCard(child: Text(_workflowHint(widget.user.role))),
            ),
            if (widget.user.role == ActorRole.manufacturer) ...<Widget>[
              const SizedBox(height: 32),
              const SectionTitle(
                title: 'Product Setup',
                icon: Icons.inventory_2_outlined,
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _productName,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'Product name for first registration',
                  prefixIcon: Icon(Icons.sell_outlined),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _productIdOnChain,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'On-chain Product ID (optional)',
                  prefixIcon: Icon(Icons.numbers_outlined),
                ),
              ),
            ],
            if (widget.user.role == ActorRole.reseller) ...<Widget>[
              const SizedBox(height: 32),
              const ScreenSection(
                title: 'Sale Control',
                icon: Icons.local_grocery_store_outlined,
                child: SizedBox.shrink(),
              ),
              SoftCard(
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Finalize sale now'),
                  subtitle: const Text(
                    'OFF: receive from distributor, ON: mark sold (immutable)',
                  ),
                  value: _finalizeSale,
                  onChanged: (value) => setState(() => _finalizeSale = value),
                ),
              ),
            ],
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: _processingAction ? null : _scanAndProcess,
              icon: const Icon(Icons.qr_code_scanner, size: 24),
              label: Text(
                _processingAction
                    ? 'Processing...'
                    : 'Scan QR and Write Blockchain Event',
              ),
            ),
            const SizedBox(height: 32),
            SoftCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Icon(
                    _actionResult.startsWith('Denied')
                        ? Icons.error_outline
                        : Icons.check_circle_outline,
                    color: _actionResult.startsWith('Denied')
                        ? AppTheme.danger
                        : AppTheme.success,
                    size: 24,
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text('Result: $_actionResult')),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const SectionTitle(
              title: 'Current Product States',
              icon: Icons.inventory_2_outlined,
            ),
            const SizedBox(height: 14),
            ...widget.deps.traceabilityService.listProducts().map(
              (record) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: SoftCard(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${record.id} - ${record.name}'),
                    subtitle: Text('Owner: ${roleLabel(record.currentOwner)}'),
                    trailing: _statusBadgeForProduct(record.status),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadgeForProduct(ProductStatus status) {
    switch (status) {
      case ProductStatus.sold:
        return const StatusBadge(
          label: 'Sold',
          color: AppTheme.sold,
          icon: Icons.sell_outlined,
        );
      case ProductStatus.atManufacturer:
      case ProductStatus.atDistributor:
      case ProductStatus.atReseller:
        return const StatusBadge(
          label: 'Verified',
          color: AppTheme.success,
          icon: Icons.verified_outlined,
        );
    }
  }

  String _workflowHint(ActorRole role) {
    switch (role) {
      case ActorRole.manufacturer:
        return 'Your action: scan a new product QR to create the first on-chain event with timestamp.';
      case ActorRole.distributor:
        return 'Your action: scan product QR to register manufacturer -> distributor transfer.';
      case ActorRole.reseller:
        return 'Your action: scan product QR to receive from distributor, or enable finalize sale to close lifecycle.';
      case ActorRole.customer:
        return 'Customers use public verification mode.';
    }
  }
}
