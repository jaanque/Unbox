import * as Haptics from 'expo-haptics';
import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as Href}
      onPress={async (event) => {
        // Haptic feedback premium al tocar el enlace
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (Platform.OS !== 'web') {
          // Evitamos que el sistema abra el navegador por defecto
          event.preventDefault();
          
          // Abrimos el navegador in-app con estilo automático (el que mejor encaja en iOS/Android)
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
            toolbarColor: '#f8f6f6', // Color de fondo que ya usamos en la app
            controlsColor: '#333',   // Iconos oscuros para que respiren bien
          });
        }
      }}
    />
  );
}