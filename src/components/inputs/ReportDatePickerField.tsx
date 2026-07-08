import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  formatDateYmd,
  formatReportDateLabel,
  parseReportDate,
} from '@/utils/reportDateFilters';
import { colors, appInputPlaceholderColor, appInputStyle } from '@/theme';

type Props = {
  value: string;
  onChange: (date: string) => void;
  label: string;
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

const daysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

const firstWeekday = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1).getDay();

export const ReportDatePickerField: React.FC<Props> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  style,
}) => {
  const today = useMemo(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    return next;
  }, []);

  const initial = useMemo(() => parseReportDate(value) ?? today, [today, value]);

  const [showPicker, setShowPicker] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState<Date>(initial);

  const openPicker = () => {
    const parsed = parseReportDate(value) ?? today;
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
    setSelected(parsed);
    setShowPicker(true);
  };

  const confirm = () => {
    onChange(formatDateYmd(selected));
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
      <View style={style}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Pressable
          onPress={openPicker}
          style={styles.selectRow}
          accessibilityRole="button"
          accessibilityLabel={`${label} ${value ? formatReportDateLabel(value) : placeholder}`}>
          <Calendar size={16} color={colors.primary} />
          <Text
            style={[styles.selectText, !value && styles.placeholder]}
            numberOfLines={1}>
            {value ? formatReportDateLabel(value) : placeholder}
          </Text>
          <ChevronRight size={16} color={colors.primaryLight} />
        </Pressable>
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
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={confirm}>
                <Text style={[styles.modalAction, styles.modalDone]}>Done</Text>
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
                    onPress={() => setSelected(cell.date!)}>
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selectRow: {
    ...appInputStyle,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    paddingVertical: 8,
    marginBottom: 0,
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
});
