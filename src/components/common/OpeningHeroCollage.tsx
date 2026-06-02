import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart3, ShoppingBag } from 'lucide-react-native';
import { Text } from 'react-native-paper';
import { colors, fontFamily, radius, shadows, typography } from '@/theme';

const BAR_HEIGHTS = [0.42, 0.68, 0.52, 0.92, 0.58];

export const OPENING_HERO_HEIGHT = 268;

const GaugeArc: React.FC = () => (
  <View style={styles.gaugeWrap}>
    <View style={styles.gaugeTrack} />
    <View style={styles.gaugeFill} />
    <Text style={styles.gaugeValue}>94%</Text>
  </View>
);

export const OpeningHeroCollage: React.FC = () => (
  <View style={styles.stage}>
    <View style={styles.backPlate} />
    <View style={styles.glowOrb} />

    <View style={styles.canvas}>
      <View style={styles.tasksCard}>
        <View style={styles.tasksTop}>
          <View style={styles.tasksIcon}>
            <ShoppingBag size={14} color={colors.text} strokeWidth={2.35} />
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live</Text>
          </View>
        </View>
        <Text style={styles.cardLabel}>Today&apos;s sales</Text>
        <Text style={styles.cardValue}>24</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '72%' }]} />
          </View>
          <Text style={styles.progressPct}>72%</Text>
        </View>
      </View>

      <View style={styles.centerCol}>
        <View style={styles.darkCard}>
          <GaugeArc />
          <Text style={styles.darkLabel}>Success rate</Text>
          <Text style={styles.darkHint}>This week</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <BarChart3 size={13} color={colors.text} strokeWidth={2.35} />
          <Text style={styles.chartTitle}>Weekly trend</Text>
        </View>
        <View style={styles.barsRow}>
          {BAR_HEIGHTS.map((ratio, index) => {
            const peak = index === 3;
            return (
              <View key={index} style={styles.barCol}>
                {peak ? <View style={styles.peakDot} /> : <View style={styles.peakSpacer} />}
                <View
                  style={[
                    styles.bar,
                    {
                      height: 38 * ratio,
                      backgroundColor: peak ? colors.text : colors.borderStrong,
                      opacity: peak ? 1 : 0.85,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    height: OPENING_HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlate: {
    position: 'absolute',
    width: '78%',
    maxWidth: 280,
    height: OPENING_HERO_HEIGHT - 48,
    borderRadius: radius.xxl,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    transform: [{ rotate: '6deg' }, { translateY: 10 }],
  },
  glowOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: 8,
  },
  canvas: {
    width: '94%',
    maxWidth: 332,
    height: OPENING_HERO_HEIGHT - 20,
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    transform: [{ rotate: '-5deg' }],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  tasksCard: {
    flex: 1.08,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  tasksTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tasksIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.pastelYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.statusDotGreen,
  },
  statusText: {
    fontFamily: fontFamily.semibold,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 10,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  cardValue: {
    fontFamily: fontFamily.extrabold,
    fontWeight: '800',
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    marginTop: 2,
    letterSpacing: -0.6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.text,
  },
  progressPct: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  centerCol: {
    flex: 0.92,
    justifyContent: 'center',
  },
  darkCard: {
    backgroundColor: colors.cardDark,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 128,
    ...shadows.md,
  },
  gaugeWrap: {
    width: 72,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  gaugeTrack: {
    position: 'absolute',
    top: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-135deg' }],
  },
  gaugeFill: {
    position: 'absolute',
    top: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: colors.white,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-42deg' }],
  },
  gaugeValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.textOnDark,
    letterSpacing: -0.5,
  },
  darkLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
  },
  darkHint: {
    fontFamily: fontFamily.regular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.48)',
    marginTop: 2,
  },
  chartCard: {
    flex: 1,
    backgroundColor: colors.pastelYellowSoft,
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.pastelYellow,
    justifyContent: 'space-between',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 3,
    flex: 1,
    marginTop: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 46,
  },
  peakDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text,
    marginBottom: 3,
  },
  peakSpacer: {
    height: 7,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    minHeight: 8,
  },
});
