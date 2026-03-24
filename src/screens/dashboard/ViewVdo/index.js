import { StyleSheet, Text, View, ScrollView } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';
import { colors } from '../../../global';
import CustomHeader from '../../../components/customHeader';
import st from '../../../global/styles';
import useNetworkStatus from '../../../hooks/networkStatus';

const ViewVdo = ({ navigation, route }) => {
  const [playing, setPlaying] = useState(true);
  const [vdoId, setVdoId] = useState();
  const data = route?.params?.item;

  const isConnected = useNetworkStatus();

  console.log({ data });

  const getVideoId = data => {
    const result = data?.youTube_Link?.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    const videoIdWithParams = result[2];

    if (videoIdWithParams !== undefined) {
      const cleanVideoId = videoIdWithParams.split(/[^0-9a-z_-]/i)[0];
      console.log({ cleanVideoId });
      setVdoId(cleanVideoId);
    }

    return null;
  };

  useEffect(() => {
    getVideoId(data);
  }, []);
  const onStateChange = useCallback(state => {
    if (state === 'ended') {
      setPlaying(false);
      // alert('video has finished playing!');
    }
  }, []);
  return (
    <View style={st.flex}>
      <CustomHeader title={''} onBackPress={() => navigation.goBack()} />
      {!isConnected ? (
        <View style={st.center}>
          <Text style={st.tx14}>No internet connection</Text>
          <Text style={st.tx12}>Please turn on internet to view this Video.</Text>
        </View>
      ) : (
        <ScrollView style={st.flex}>

          <YoutubePlayer
            height={250}
            play={playing}
            videoId={vdoId}
            onChangeState={onStateChange}
          />

          <View style={st.pd20}>

            <Text style={[st.tx14]}>
              {data?.subject}
            </Text>
          </View>

        </ScrollView>
      )}
    </View>
  );
};

export default ViewVdo;

const styles = StyleSheet.create({});
