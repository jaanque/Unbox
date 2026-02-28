import { Skeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, View } from 'react-native';

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

export function SkeletonOfferDetail() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <Skeleton width="100%" height={300} borderRadius={0} />

      <View style={[styles.detailContentContainer, { backgroundColor: Colors[theme].background }]}>
        {/* Title & Partner */}
        <View style={{ marginBottom: 20 }}>
          <Skeleton width="70%" height={32} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View>
               <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
               <Skeleton width={60} height={12} borderRadius={4} />
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Price & Stock */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
           <View>
              <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Skeleton width={80} height={32} borderRadius={4} />
                  <Skeleton width={50} height={16} borderRadius={4} />
              </View>
           </View>
           <Skeleton width={100} height={24} borderRadius={16} />
        </View>

        <View style={styles.separator} />

        {/* Description */}
        <View style={{ marginBottom: 20 }}>
           <Skeleton width={120} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
           <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
           <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
           <Skeleton width="80%" height={16} borderRadius={4} />
        </View>

        <View style={styles.separator} />

        {/* Map */}
        <View>
           <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
           <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 12 }} />
           <Skeleton width="60%" height={16} borderRadius={4} />
        </View>

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
  },
  // Detail Skeleton Styles
  detailContentContainer: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
});
