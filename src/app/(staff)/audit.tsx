/**
 * Audit Log (staff) — v3 port (Audit) wired to real audit_log data (Phase 10).
 *
 * The real mode fetches the append-only audit feed via useAuditFeed (RLS lets
 * any authenticated user read audit_log), groups events per item, and renders
 * the same filter chips (All / Unclaimed / Pending Claim / Claimed) + quick
 * status pill as before, with an expandable chronological step timeline per
 * item (AL-01 / AL-02). Loading / error+retry / empty states are explicit.
 * Demo mode keeps the Phase 1 mock click-through.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PackageCheck } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { ChipButton, Header, StatusPill } from '@/components/v3/core';
import { itemStatusToPill } from '@/components/v3/feed';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { useAuditFeed, type AuditGroup } from '@/lib/hooks/use-items';
import { useSession } from '@/lib/session';
import { auditStepsStaff, auditStepsStudent, items, type MockItem } from '@/mocks/data';

import type { AuditEvent, ItemStatus, UserRole } from '@/lib/db';

const FILTERS = [
  { key: 'all', label: 'All', match: (_: ItemStatus | null) => true },
  {
    key: 'unclaimed',
    label: 'Unclaimed',
    match: (status: ItemStatus | null) => status === 'pending_dropoff' || status === 'available',
  },
  {
    key: 'pending',
    label: 'Pending Claim',
    match: (status: ItemStatus | null) => status === 'pending_claim',
  },
  { key: 'claimed', label: 'Claimed', match: (status: ItemStatus | null) => status === 'claimed' },
];

const EVENT_LABELS: Record<AuditEvent, string> = {
  reported: 'Reported by student',
  confirmed: 'Confirmed by Staff',
  found: 'Logged by Staff',
  matched: 'Matched',
  claim_requested: 'Claim Requested',
  released: 'Released to claimant',
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  staff: 'Staff',
  admin: 'Admin',
};

function formatEventTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function AuditScreen() {
  const { isDemo } = useSession();
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
      {isDemo ? <MockAuditList expanded={expanded} onToggle={setExpanded} /> : <RealAuditList />}
    </V3Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Real audit feed                                                      */
/* ------------------------------------------------------------------ */

function RealAuditList() {
  const { groups, isLoading, isError, error, refetch } = useAuditFeed(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>Loading audit trail…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>
          Could not load the audit trail.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => void refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const filtered = groups.filter((group) =>
    FILTERS.find((filter) => filter.key === activeFilter)?.match(group.item?.status ?? null),
  );

  if (filtered.length === 0) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>
          {groups.length === 0
            ? 'No audit entries yet — they are written automatically on every item transition.'
            : 'No items match this status.'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <ChipButton
            key={filter.key}
            label={filter.label}
            active={activeFilter === filter.key}
            onPress={() => setActiveFilter(filter.key)}
          />
        ))}
      </View>
      <View style={styles.list}>
        {filtered.map((group) => (
          <AuditCard
            key={group.item?.id ?? group.events[0]?.id}
            group={group}
            expanded={expandedId === (group.item?.id ?? null)}
            onToggle={() =>
              setExpandedId(expandedId === group.item?.id ? null : (group.item?.id ?? null))
            }
          />
        ))}
      </View>
    </>
  );
}

function AuditCard({
  group,
  expanded,
  onToggle,
}: {
  group: AuditGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  const item = group.item;
  if (!item) return null;
  return (
    <Pressable style={[styles.card, Shadows.card]} onPress={onToggle}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <PackageCheck size={20} color={Colors.primary} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardMeta}>
            {item.category} · {item.found_location}
          </Text>
        </View>
        <StatusPill status={itemStatusToPill[item.status]} />
      </View>
      {expanded ? (
        <View style={styles.timeline}>
          {group.events.map((event, index, all) => (
            <View key={event.id} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={styles.stepDot} />
                {index < all.length - 1 ? <View style={styles.stepLine} /> : null}
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepName}>{EVENT_LABELS[event.event_type]}</Text>
                <Text style={styles.stepMeta}>
                  {event.actor
                    ? `${event.actor.name} · ${ROLE_LABELS[event.actor.role]}`
                    : 'System'}{' '}
                  · {formatEventTime(event.created_at)}
                </Text>
                {event.note ? <Text style={styles.stepNote}>{event.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Demo (Phase 1) mock click-through                                    */
/* ------------------------------------------------------------------ */

function MockAuditList({
  expanded,
  onToggle,
}: {
  expanded: string;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      <View style={styles.filterRow}>
        {['All', 'Unclaimed', 'Pending Claim', 'Claimed'].map((name, index) => (
          <ChipButton key={name} label={name} active={index === 0} />
        ))}
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, Shadows.card]}
            onPress={() => onToggle(expanded === item.id ? '' : item.id)}
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
                    <View style={styles.stepBody}>
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
    </>
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
  stepBody: { flex: 1 },
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
  stepNote: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.mutedForeground,
  },
  stateBox: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: Radius.card,
    backgroundColor: Colors.muted,
    padding: 20,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.input,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.primaryForeground,
  },
});
