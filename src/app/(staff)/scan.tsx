/**
 * Scan QR Tag (staff) — v3 port (Scanner) wired to the real camera (Phase 9).
 *
 * Uses expo-camera's CameraView barcode scanner (QR only). Permission flows:
 * unrequested → ask; denied → recovery panel with a link to device settings.
 * On a successful decode the tag is resolved against the DB (items by
 * qr_code) — a tag that matches nothing is surfaced as an invalid-scan error
 * and never reaches the release sheet (CP-05). Valid tags route to the
 * Release bottom sheet with the item id + the scanned code, where the server
 * re-validates before any status change.
 *
 * Demo/web mode keeps the Phase 1 Simulate button.
 */

import { useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';

import { ScanLine } from 'lucide-react-native';

import { Colors, Fonts } from '@/constants/design';
import { Button3, Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { fetchItemByQrCode } from '@/lib/db';
import { useSession } from '@/lib/session';

export default function ScanScreen() {
  const { isDemo } = useSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [handling, setHandling] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const handledRef = useRef(false);

  // Camera scanning is a native-only flow; demo + web keep the Phase 1 button.
  const simulate = isDemo || Platform.OS === 'web';

  function rescan() {
    handledRef.current = false;
    setHandling(false);
    setScanError(null);
  }

  async function handleBarcode(event: BarcodeScanningResult) {
    if (handledRef.current) return;
    handledRef.current = true;
    setHandling(true);
    setScanError(null);

    const tag = (event.data ?? '').trim();
    try {
      // Resolve the opaque tag against the DB. The release endpoint will
      // re-validate it server-side; this lookup only decides whether the scan
      // is plausible enough to open the confirmation sheet.
      const item = await fetchItemByQrCode(tag);
      if (!item) {
        setScanError('That QR tag is not in the system. Check the tag and try again.');
        handledRef.current = false;
        setHandling(false);
        return;
      }
      router.push({
        pathname: '/(staff)/release',
        params: { itemId: item.id, qrCode: tag },
      });
    } catch {
      setScanError('Could not verify the tag. Check your connection and try again.');
      handledRef.current = false;
      setHandling(false);
    }
  }

  const cameraReady = !simulate && permission?.granted === true;

  return (
    <View style={styles.dark}>
      {cameraReady ? (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcode}
        />
      ) : null}

      <V3Screen
        scroll={false}
        nav={
          <BottomNav3
            role="staff"
            active="scan"
            onSelect={(tab) => router.push(tabRoute('staff', tab))}
          />
        }
      >
        <Header title="Scan QR Tag" onBack={() => router.push('/(staff)/dashboard')} />
        <View style={styles.body}>
          <View style={styles.frame}>
            <View style={styles.frameCornerTL} />
            <View style={styles.frameCornerTR} />
            <View style={styles.frameCornerBL} />
            <View style={styles.frameCornerBR} />
            {cameraReady ? <View style={styles.frameOverlay} /> : null}
          </View>

          {simulate ? (
            <>
              <Text style={styles.help}>Scan the item&apos;s QR tag to release.</Text>
              <Button3
                label="Simulate scan"
                variant="success"
                height={48}
                style={styles.button}
                onPress={() => router.push('/(staff)/release')}
              >
                <ScanLine size={20} color={Colors.successForeground} />
              </Button3>
            </>
          ) : handling ? (
            <Text style={styles.help}>Verifying tag…</Text>
          ) : scanError ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Invalid QR tag</Text>
              <Text style={styles.panelText}>{scanError}</Text>
              <Button3
                label="Scan again"
                variant="success"
                height={48}
                style={styles.button}
                onPress={rescan}
              >
                <ScanLine size={20} color={Colors.successForeground} />
              </Button3>
            </View>
          ) : !permission ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Camera access</Text>
              <Text style={styles.panelText}>ClaimIt needs the camera to scan QR tags.</Text>
              <Button3
                label="Enable Camera"
                height={48}
                style={styles.button}
                onPress={() => void requestPermission()}
              />
            </View>
          ) : !permission.granted ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Camera permission denied</Text>
              <Text style={styles.panelText}>
                Open your device settings to allow camera access, then scan the QR tag to release.
              </Text>
              <Button3
                label="Open Settings"
                height={48}
                style={styles.button}
                onPress={() => void Linking.openSettings()}
              />
            </View>
          ) : (
            <Text style={styles.help}>Scan the item&apos;s QR tag to release.</Text>
          )}
        </View>
      </V3Screen>
    </View>
  );
}

const FRAME = 288;
const CORNER = 54;
const STROKE = 4;

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: Colors.scan },
  camera: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 28,
  },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  frameCornerTL: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CORNER,
    height: CORNER,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
    borderTopLeftRadius: 12,
    borderColor: Colors.success,
  },
  frameCornerTR: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: CORNER,
    height: CORNER,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    borderTopRightRadius: 12,
    borderColor: Colors.success,
  },
  frameCornerBL: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    borderBottomLeftRadius: 12,
    borderColor: Colors.success,
  },
  frameCornerBR: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    borderBottomRightRadius: 12,
    borderColor: Colors.success,
  },
  help: {
    marginTop: 32,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.primaryForeground,
    textAlign: 'center',
  },
  panel: {
    marginTop: 32,
    borderRadius: 20,
    backgroundColor: 'rgba(5,14,26,0.75)',
    padding: 20,
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.primaryForeground,
  },
  panelText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(248,250,252,0.8)',
    textAlign: 'center',
  },
  button: { marginTop: 20, paddingHorizontal: 28 },
});
