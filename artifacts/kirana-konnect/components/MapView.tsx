import { Feather } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Shop, SHOPS } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface MapViewComponentProps {
  onShopPress: (shop: Shop) => void;
  selectedShop: Shop | null;
}

export default function MapViewComponent({ onShopPress, selectedShop }: MapViewComponentProps) {
  const colors = useColors();

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 28.6139,
        longitude: 77.209,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {SHOPS.map((shop) => (
        <Marker
          key={shop.id}
          coordinate={{ latitude: shop.lat, longitude: shop.lng }}
          onPress={() => onShopPress(shop)}
        >
          <View
            style={[
              styles.pin,
              {
                backgroundColor: selectedShop?.id === shop.id ? colors.accent : colors.primary,
                borderColor: "#fff",
              },
            ]}
          >
            <Feather name="shopping-bag" size={12} color="#fff" />
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
