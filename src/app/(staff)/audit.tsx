/**
 * Audit Log (staff) — v3 port (Audit): filter chips, expandable per-item
 * cards with a step timeline (green dots, connecting line).
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PackageCheck } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { ChipButton, Header, StatusPill } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { auditStepsStaff, auditStepsStudent, items, type MockItem } from '@/mocks/data';

export default function AuditScreen() {
  const [expanded, setExpanded] = useState('CI-2476');

  return (
    <V3Screen
      nav={
        <BottomNav3
          role="staff"
          active="audit"
          onSelect={(tab) => router.push(tabRoute('staff', tab))}
        />
      }
    >
      <Header title="Audit Log" subtitle="Chronological item history" />
      <View>
        <View style={styles.filterRow}>
          {['All', 'Unclaimed', 'Pending Claim', 'Claimed'].map((name, index) => (
            <ChipButton key={name} label={name} active={index === 0} />
          ))}
        </View>
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, Shadows.card]}
            onPress={() => setExpanded(expanded === item.id ? '' : item.id)}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardIcon}>
                <PackageCheck size={20} color={Colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.date} · {item.id}
                </Text>
              </View>
              <StatusPill status={item.status} />
            </View>
            {expanded === item.id ? (
              <View style={styles.timeline}>
                {stepsFor(item).map((step, index, all) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepRail}>
                      <View style={styles.stepDot} />
                      {index < all.length - 1 ? <View style={styles.stepLine} /> : null}
                    </View>
                    <View>
                      <Text style={styles.stepName}>{step}</Text>
                      <Text style={styles.stepMeta}>
                        {index % 2 ? 'Jordan Smith · Staff' : 'System'} · Sep {20 + index}, 10:
                        {15 + index} AM
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    </V3Screen>
  );
}

function stepsFor(item: MockItem): string[] {
  return item.source === 'Reported by student' ? auditStepsStudent : auditStepsStaff;
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  list: { gap: 12, paddingHorizontal: 16, paddingTop: 20 },
  card: {
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, minWidth: 0 },
  cardName: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  timeline: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepRail: {
    width: 12,
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: Colors.successSoft,
    marginTop: 2,
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    bottom: -16,
    width: 1,
    backgroundColor: Colors.border,
  },
  stepName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  stepMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
});
