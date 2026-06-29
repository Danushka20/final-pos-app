import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import {
  formatDateYmd,
  formatExpiryDate,
  parseExpiryDateOnly,
} from '@/utils/batchUtils';
import { colors, appInputPlaceholderColor, appInputStyle } from '@/theme';

type Props = {
  value: string | null | undefined;
  onChange: (date: string | null) => void;
  placeholder?: string;
  style?: object;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const daysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

const firstWeekday = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1).getDay();

export const ExpiryDatePickerField: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Select expiry date',
  style,
}) => {
  const today = useMemo(() => startOfToday(), []);
  const initial = useMemo(() => {
    const parsed = value ? parseExpiryDateOnly(value) : null;
    return parsed ?? today;
  }, [today, value]);

  const [showPicker, setShowPicker] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState<Date | null>(
    value ? parseExpiryDateOnly(value) : null,
  );

  const openPicker = () => {
    const parsed = value ? parseExpiryDateOnly(value) : null;
    const base = parsed ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setSelected(parsed);
    setShowPicker(true);
  };

  const clearDate = () => {
    onChange(null);
    setSelected(null);
    setShowPicker(false);
  };

  const confirm = () => {
    if (selected) {
      onChange(formatDateYmd(selected));
    }
    setShowPicker(false);
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const calendarCells = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth);
    const leading = firstWeekday(viewYear, viewMonth);
    const cells: Array<{ day: number | null; date: Date | null }> = [];

    for (let i = 0; i < leading; i += 1) {
      cells.push({ day: null, date: null });
    }
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(viewYear, viewMonth, day);
      date.setHours(0, 0, 0, 0);
      cells.push({ day, date });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const isSameDay = (a: Date | null, b: Date | null) =>
    a != null &&
    b != null &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <>
      <View style={[styles.selectRow, style]}>
        <Pressable
          onPress={openPicker}
          style={styles.selectMain}
          accessibilityRole="button"
          accessibilityLabel={value ? `Expiry ${formatExpiryDate(value)}` : placeholder}>
          <Calendar size={16} color={colors.primary} />
          <Text
            style={[styles.selectText, !value && styles.placeholder]}
            numberOfLines={1}>
            {value ? formatExpiryDate(value) : placeholder}
          </Text>
        </Pressable>
        {value ? (
          <TouchableOpacity
            onPress={clearDate}
            hitSlop={8}
            style={styles.clearBtn}
            accessibilityLabel="Clear expiry date">
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <ChevronRight size={16} color={colors.primaryLight} />
        )}
      </View>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalAction}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Expiry date</Text>
              <TouchableOpacity onPress={confirm} disabled={!selected}>
                <Text
                  style={[
                    styles.modalAction,
                    styles.modalDone,
                    !selected && styles.modalDoneDisabled,
                  ]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
                <ChevronLeft size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn}>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map(day => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarCells.map((cell, index) => {
                if (cell.day == null || cell.date == null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const active = isSameDay(cell.date, selected);
                return (
                  <TouchableOpacity
                    key={`${viewYear}-${viewMonth}-${cell.day}`}
                    style={[styles.dayCell, active && styles.dayCellActive]}
                    onPress={() => setSelected(cell.date)}>
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {value ? (
              <TouchableOpacity onPress={clearDate} style={styles.clearRow}>
                <Text style={styles.modalClear}>Clear expiry date</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectRow: {
    ...appInputStyle,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    paddingVertical: 8,
    marginBottom: 0,
  },
  selectMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  placeholder: {
    color: appInputPlaceholderColor,
    fontWeight: '400',
  },
  clearBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalAction: {
    fontSize: 16,
    color: colors.textSecondary,
    minWidth: 56,
  },
  modalDone: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'right',
  },
  modalDoneDisabled: {
    opacity: 0.4,
  },
  modalClear: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  dayCellActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  clearRow: {
    marginTop: 12,
    paddingVertical: 10,
  },
});
