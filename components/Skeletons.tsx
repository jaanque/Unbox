import { Skeleton } from '@/components/ui/Skeleton';
import { StyleSheet, View } from 'react-native';

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={180} borderRadius={28} />
      <View style={styles.cardContent}>
        <View style={styles.headerContentRow}>
          <Skeleton width="60%" height={18} borderRadius={4} />
          <Skeleton width="20%" height={13} borderRadius={4} />
        </View>
        <View style={styles.footerRow}>
          <Skeleton width="40%" height={13} borderRadius={4} />
          <Skeleton width="25%" height={20} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonPartner() {
  return (
    <View style={styles.partnerCard}>
      <Skeleton width={75} height={75} borderRadius={28} style={{ marginBottom: 8 }} />
      <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width={40} height={10} borderRadius={4} />
    </View>
  );
}

export function SkeletonListTile() {
  return (
    <View style={styles.listTile}>
      <Skeleton width={100} height={100} borderRadius={24} />
      <View style={styles.listTileContent}>
        <Skeleton width="80%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
           <Skeleton width={60} height={20} borderRadius={4} />
           <Skeleton width={40} height={14} borderRadius={4} />
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
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Skeleton width="100%" height={300} borderRadius={0} />

      <View style={[styles.detailContentContainer, { backgroundColor: 'transparent' }]}>
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
    width: 315,
    backgroundColor: 'transparent',
  },
  cardContent: {
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  headerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 2,
  },
  // Partner Styles
  partnerCard: {
    width: 85,
    alignItems: 'center',
    gap: 0,
  },
  // ListTile Styles
  listTile: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    height: 100,
    marginBottom: 16,
  },
  listTileContent: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 4,
    justifyContent: 'flex-start',
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
