import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeftRight,
  ClipboardList,
  Layers,
  MapPin,
  PackagePlus,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react-native';
import { Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import type { ProductsStackParamList } from '@/navigation/types';
import { colors, TAB_BAR_SCROLL_PADDING } from '@/theme';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'InventoryActivity'>;

const ACTIONS = [
  {
    id: 'add',
    title: 'Add item',
    subtitle: 'Create a new product in inventory',
    icon: PackagePlus,
    color: colors.primary,
    bg: colors.primarySoft,
  },
  {
    id: 'modify',
    title: 'Modify item',
    subtitle: 'Update price, description, or stock settings',
    icon: Pencil,
    color: colors.text,
    bg: colors.pastelBlue,
  },
  {
    id: 'batches',
    title: 'Stock & batches',
    subtitle: 'View unbatched stock, batch qty, and expiry',
    icon: Layers,
    color: colors.primary,
    bg: colors.primarySoft,
  },
  {
    id: 'adjust',
    title: 'Stock adjustment',
    subtitle: 'Correct on-hand quantity',
    icon: SlidersHorizontal,
    color: colors.warning,
    bg: colors.warningSoft,
  },
  {
    id: 'tog',
    title: 'TOG transfer',
    subtitle: 'Transfer goods between locations',
    icon: ArrowLeftRight,
    color: colors.text,
    bg: colors.pastelGreen,
  },
  {
    id: 'history',
    title: 'Item activity',
    subtitle: 'View stock movement history',
    icon: ClipboardList,
    color: colors.text,
    bg: colors.pastelYellow,
  },
  {
    id: 'location',
    title: 'Add location',
    subtitle: 'Create a new branch or storage area',
    icon: MapPin,
    color: colors.text,
    bg: colors.pastelPink,
  },
];

export const InventoryActivityScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <ScreenContainer>
      <AppHeader
        title="Inventory activity"
        subtitle="Update stock and items from mobile"
        showBack
      />

      <SmoothScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundAlt }}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}>
        <VStack px="$5" py="$4" space="md">
          <Text fontSize="$sm" color={colors.textSecondary} px="$1">
            These actions update your live inventory on the server — they are not
            printable reports.
          </Text>

          <VStack
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            overflow="hidden">
            {ACTIONS.map(action => (
              <SettingsRow
                key={action.id}
                icon={action.icon}
                iconColor={action.color}
                iconBg={action.bg}
                title={action.title}
                subtitle={action.subtitle}
                onPress={() => {
                  switch (action.id) {
                    case 'add':
                      navigation.navigate('ItemForm', {});
                      break;
                    case 'modify':
                      navigation.navigate('ItemSelect', { action: 'modify' });
                      break;
                    case 'batches':
                      navigation.navigate('ItemSelect', { action: 'batches' });
                      break;
                    case 'adjust':
                      navigation.navigate('ItemSelect', { action: 'adjust' });
                      break;
                    case 'history':
                      navigation.navigate('ItemSelect', { action: 'history' });
                      break;
                    case 'tog':
                      navigation.navigate('TogTransfer');
                      break;
                    case 'location':
                      navigation.navigate('AddLocation');
                      break;
                    default:
                      break;
                  }
                }}
              />
            ))}
          </VStack>
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
