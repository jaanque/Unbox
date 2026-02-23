import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function ExploreScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Explorar
        </ThemedText>
      </ThemedView>
      <ThemedText>Esta aplicación incluye código de ejemplo para ayudarte a empezar.</ThemedText>
      <Collapsible title="Enrutamiento basado en archivos">
        <ThemedText>
          Esta aplicación tiene una pantalla:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          El archivo de diseño en <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          configura el navegador de pestañas.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Aprender más</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Soporte para Android, iOS y web">
        <ThemedText>
          Puedes abrir este proyecto en Android, iOS y la web. Para abrir la versión web, presiona{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> en la terminal que ejecuta este proyecto.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Imágenes">
        <ThemedText>
          Para imágenes estáticas, puedes usar los sufijos <ThemedText type="defaultSemiBold">@2x</ThemedText> y{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> para proporcionar archivos para
          diferentes densidades de pantalla.
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Aprender más</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Componentes de modo claro y oscuro">
        <ThemedText>
          Esta plantilla tiene soporte para modo claro y oscuro. El hook{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> te permite inspeccionar
          cuál es el esquema de color actual del usuario, y así puedes ajustar los colores de la UI en consecuencia.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Aprender más</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animaciones">
        <ThemedText>
          Esta plantilla incluye un ejemplo de un componente animado. El componente{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> usa
          la potente librería{' '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>{' '}
          para crear una animación de mano saludando.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              El componente <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              proporciona un efecto de paralaje para la imagen de cabecera.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
