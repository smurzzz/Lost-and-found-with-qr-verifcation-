/**
 * Scan QR Tag (staff) — v3 port (Scanner): dark screen, success-colored
 * corner frame with animated scan line, and the Simulate scan button.
 * Phase 1 simulates the camera (expo-camera lands in Phase 6).
 */

import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { ScanLine } from 'lucide-react-native';

import { Colors, Fonts } from '@/constants/design';
import { Button3, Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';

export default function ScanScreen() {
  const [scanY] = useState(() => new Animated.Value(0));
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: 1,
          duration: 2300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 2300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanY]);

  const lineTranslate = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.dark}>
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
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: lineTranslate }] }]}
            />
          </View>
          <Text style={styles.help}>Scan the item&apos;s QR tag to release.</Text>
          {detected ? null : (
            <Button3
              label="Simulate scan"
              variant="success"
              height={48}
              style={styles.button}
              onPress={() => {
                setDetected(true);
                router.push('/(staff)/release');
              }}
            >
              <ScanLine size={20} color={Colors.successForeground} />
            </Button3>
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
  scanLine: {
    position: 'absolute',
    width: '88%',
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  help: {
    marginTop: 32,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.primaryForeground,
    textAlign: 'center',
  },
  button: { marginTop: 40, paddingHorizontal: 28 },
});
