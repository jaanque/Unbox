import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SkeletonCard() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View style={[styles.card, { backgroundColor: Colors[theme].background, borderColor: theme === 'dark' ? '#333' : '#F3F4F6' }]}>
      <Skeleton width="100%" height={150} borderRadius={0} />
      <View style={styles.cardContent}>
        <View style={styles.headerContentRow}>
          <View style={styles.titleColumn}>
            <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={80} height={12} borderRadius={4} />
          </View>
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
        <View style={[styles.footerRow, { borderTopColor: theme === 'dark' ? '#333' : '#F3F4F6' }]}>
          <Skeleton width={60} height={16} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonPartner() {
  return (
    <View style={styles.partnerCard}>
      <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 6 }} />
      <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width={40} height={10} borderRadius={12} />
    </View>
  );
}

export function SkeletonListTile() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View style={[styles.listTile, { backgroundColor: Colors[theme].background, borderColor: theme === 'dark' ? '#333' : '#F3F4F6' }]}>
      <Skeleton width={100} height="100%" borderRadius={0} />
      <View style={styles.listTileContent}>
        <View style={styles.headerContentRow}>
          <View style={styles.titleColumn}>
            <Skeleton width={140} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={100} height={12} borderRadius={4} />
          </View>
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
        <View style={[styles.footerRow, { borderTopColor: 'transparent' }]}>
          <Skeleton width={70} height={16} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonProfile() {
    return (
        <View style={styles.profileContainer}>
             <View style={styles.profileSection}>
                <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 10 }} />
                <Skeleton width={200} height={20} borderRadius={4} style={{ marginBottom: 20 }} />
                <Skeleton width="100%" height={50} borderRadius={6} style={{ marginTop: 20 }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  // Card Styles
  card: {
    width: 300,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardContent: {
    padding: 10,
  },
  headerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  // Partner Styles
  partnerCard: {
    width: 100,
    alignItems: 'center',
    gap: 0,
  },
  // ListTile Styles
  listTile: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    height: 100,
    marginBottom: 16,
  },
  listTileContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  // Profile Styles
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
  }
});
