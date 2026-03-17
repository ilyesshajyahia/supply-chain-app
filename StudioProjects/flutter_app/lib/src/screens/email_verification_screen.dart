import 'package:flutter/material.dart';
import 'package:flutter_app/src/app.dart';
import 'package:flutter_app/src/widgets/modern_shell.dart';

class EmailVerificationScreen extends StatefulWidget {
  const EmailVerificationScreen({
    super.key,
    required this.deps,
    required this.token,
  });

  final AppDependencies deps;
  final String token;

  @override
  State<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  bool _loading = true;
  bool _success = false;
  String _message = 'Verifying your email...';

  @override
  void initState() {
    super.initState();
    _verify();
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _success = false;
      _message = 'Verifying your email...';
    });
    final String result = await widget.deps.traceabilityService
        .verifyEmailToken(token: widget.token);
    if (!mounted) return;
    final bool ok =
        result.toLowerCase().contains('success') ||
        result.toLowerCase().contains('active');
    setState(() {
      _loading = false;
      _success = ok;
      _message = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientShell(
        title: 'Email Verification',
        subtitle: 'Account activation status',
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              if (_loading) ...<Widget>[
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
              ] else ...<Widget>[
                Icon(
                  _success ? Icons.verified_outlined : Icons.error_outline,
                  color: _success ? Colors.green : Colors.red,
                  size: 44,
                ),
                const SizedBox(height: 12),
              ],
              Text(_message, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              if (!_loading)
                FilledButton.icon(
                  onPressed: _verify,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try Again'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
