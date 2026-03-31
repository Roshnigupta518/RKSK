import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import ReusableBottomSheet from '../../../components/filterSheet';
import { environment } from '../../../utils/constant';
import { CustomContainer } from '../../../components/container'
import CustomHeader from '../../../components/customHeader';
import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import st from '../../../global/styles';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GOOGLE_API_KEY = environment.GOOGLE_API_KEY

const locations = [
  { lat: 23.2599, lng: 77.4126, place: 'International public school', time: 'Left at 9:41 am', address: 'Misrod RD, Misrod, Bhopal, madhaya pradesh' },
  { lat: 23.2700, lng: 77.4200, place: 'Drving', time: '9:41 am - 10:03 am', duration: '6.8 km - 22 min' },
  { lat: 23.2800, lng: 77.4300, place: 'Visited Netlink Software Private Limited', time: '10:03 am - 3:0 pm', address: 'D-6 Industrial Area, Mandideep, Bhopal, Madhaya Pradesh' },
];

export default function ActivityTracking({ navigation }) {
  const mapRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');


  useEffect(() => {
    getDirections();
  }, []);

  const getDirections = async () => {
    try {
      const origin = `${locations[0].lat},${locations[0].lng}`;
      const destination = `${locations[locations.length - 1].lat},${locations[locations.length - 1].lng}`;

      const waypoints = locations
        .slice(1, -1)
        .map(loc => `${loc.lat},${loc.lng}`)
        .join('|');

      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask":
              "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: locations[0].lat,
                  longitude: locations[0].lng,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: locations[locations.length - 1].lat,
                  longitude: locations[locations.length - 1].lng,
                },
              },
            },
            intermediates: locations.slice(1, -1).map(loc => ({
              location: {
                latLng: {
                  latitude: loc.lat,
                  longitude: loc.lng,
                },
              },
            })),
            travelMode: "DRIVE",
          }),
        }
      );

      const data = await response.json();

      console.log("API RESPONSE:", data);

      const route = data?.routes?.[0];

      if (!route) {
        console.log("No route found");
        return;
      }

      const encoded = route.polyline?.encodedPolyline;

      if (!encoded) {
        console.log("No polyline");
        return;
      }

      const points = polyline.decode(encoded);

      const coords = points.map(p => ({
        latitude: p[0],
        longitude: p[1],
      }));

      setRouteCoords(coords);
      setDistance((route.distanceMeters / 1000).toFixed(1) + " km");
      setDuration(route.duration);

    } catch (err) {
      console.log(err);
    }
  };

  

  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title={'Activity Tracking'}
        onBackPress={() => navigation.goBack()} />
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: locations[0].lat,
          longitude: locations[0].lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {locations.map((loc, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            title={loc.place}
            description={loc.time}
          />
        ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="orange"
          />
        )}
      </MapView>

      {/* Bottom Sheet */}
      <BottomSheet
        index={0}
        snapPoints={['20%', '40%']}
        backgroundStyle={{ backgroundColor: '#fff' }}
      >
        <View style={{ flex: 1, padding: 15 }}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Text style={st.tx12}><Icon name="directions-car" size={18} color="black" /> {`7 km \n 22 min`}</Text>
            <Text style={st.tx12}><Icon name="location-on" size={18} color="green" /> {`2 visits`}</Text>
          </View>

          <BottomSheetFlatList
            data={locations}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={{ flexDirection: 'row' }}>
                
                {/* LEFT TIMELINE */}
                <View style={styles.timelineContainer}>
                  
                  {/* Top line */}
                  {index !== 0 && <View style={styles.line} />}
            
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    {/* {item.place === 'Drving' ? (
                      <Text style={{ fontSize: 16 }}>🚗</Text>
                    ) : (
                      <View style={styles.dot} />
                    )} */}
                    {item.place === 'Drving' ? (
  <Icon name="directions-car" size={18} color="black" />
) : (
  <Icon name="location-on" size={18} color="green" />
)}
                  </View>
            
                  {/* Bottom line */}
                  {index !== locations.length - 1 && <View style={styles.line} />}
                </View>
            
                {/* RIGHT CONTENT */}
                <View style={styles.content}>
                  <Text style={st.tx12}>{item.place}</Text>
                  {item.address && <Text style={st.tx12}>{item.address}</Text>}
                  {item.duration && <Text style={st.tx12}>{item.duration}</Text>}
                  <Text style={st.tx12}>{item.time}</Text>
                </View>
            
              </View>
            )}
          />

        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  place: {
    fontSize: 15,
    fontWeight: '500',
  },
  time: {
    fontSize: 13,
    color: 'gray',
  },
  timelineContainer: {
    width: 30,
    alignItems: 'center',
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#ccc',
  },

  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32', // green dot
  },

  content: {
    flex: 1,
    paddingBottom: 15,
    paddingLeft: 10,
  },

});