/**
 * Released (staff) — v3 port (Released): full green success screen.
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Check } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';
import { Button3 } from '@/components/v3/core';
import { V3Screen } from '@/components/v3/screen';

export default function ReleasedScreen() {
  return (
    <View style={styles.green}>
      <V3Screen scroll={false}>
        <View style={styles.wrap}>
          <View style={styles.checkCircle}>
            <Check size={48} color={Colors.primaryForeground} />
          </View>
          <Text style={styles.title}>Item Released</Text>
          <Text style={styles.text}>
            The release is verified and has been added to the audit log.
          </Text>
          <Button3
            label="Back to Dashboard"
            style={styles.button}
            textStyle={styles.buttonText}
            onPress={() => router.push('/(staff)/dashboard')}
          />
        </View>
      </V3Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  green: { flex: 1, backgroundColor: Colors.success },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 28,
    fontSize: 30,
    fontFamily: Fonts.bold,
    color: Colors.primaryForeground,
    textAlign: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(248,250,252,0.85)',
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 36,
    backgroundColor: Colors.card,
    borderRadius: Radius.input,
  },
  buttonText: { color: Colors.successForeground },
});
