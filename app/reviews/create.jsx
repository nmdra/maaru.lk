import { StyleSheet, Text, View } from 'react-native';
import { useAppI18n } from '../../utils/i18n';

export default function CreateReview() {
  const { t } = useAppI18n();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('reviews.create')}</Text>
      <Text style={styles.subtitle}>{t('reviews.underDevelopment')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});