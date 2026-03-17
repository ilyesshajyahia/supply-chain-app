import 'package:flutter/material.dart';
import 'package:flutter_app/src/screens/customer_verify_screen.dart';
import 'package:flutter_app/src/screens/login_screen.dart';
import 'package:flutter_app/src/widgets/design_system_widgets.dart';
import 'package:flutter_app/src/widgets/modern_shell.dart';
import 'package:flutter_app/src/app.dart';

class EntryChoiceScreen extends StatelessWidget {
  const EntryChoiceScreen({super.key, required this.deps});

  final AppDependencies deps;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientShell(
        title: 'ChainTrace',
        subtitle:
            'Choose how you want to use the app. Internal actors login. Customers verify publicly.',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            SectionTitle(
              title: 'Start Here',
              icon: Icons.auto_awesome_outlined,
            ),
            const SizedBox(height: 14),
            ActionCard(
              title: 'Scan a Product',
              description:
                  'No login required. Camera opens immediately to verify product authenticity.',
              icon: Icons.qr_code_scanner,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => CustomerVerifyScreen(
                      deps: deps,
                      openScannerOnStart: true,
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),
            ActionCard(
              title: 'Login as Actor',
              description:
                  'Manufacturer, distributor, or reseller workflow with location validation.',
              icon: Icons.verified_user_outlined,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => LoginScreen(deps: deps),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
