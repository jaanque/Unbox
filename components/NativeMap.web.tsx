import React from 'react';
import { View, Text } from 'react-native';

export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export const Marker = () => <View />;

export default function MapView(props: any) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
            <Text>El mapa no está disponible en la versión web.</Text>
        </View>
    );
}
