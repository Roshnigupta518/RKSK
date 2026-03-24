import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import st from '../../global/styles';
import { Thumbnail } from 'react-native-thumbnail-video';
import { colors } from '../../global';

const VideoItem = ({ item, index, onPress }) => {
    // console.log({VideoItem:item})

    return (
        <View style={[styles.cardMags]} key={index} >
            <View style={[st.row]}>
                <View style={st.wdh30}>


                    {item?.youTube_Link && (
                        <Thumbnail
                            url={item.youTube_Link}
                            imageWidth={100}
                            imageHeight={100}
                            containerStyle={{
                                backgroundColor: '#000',
                                width: 100,
                                height: 100,
                            }}
                            iconStyle={{
                                width: 20,
                                height: 24,
                                tintColor: colors.blue,
                            }}
                            onError={e => console.log(e)}
                            onPress={onPress}
                        />
                    )}

                </View>
                <View style={st.wdh70}>
                    <View>
                        <Text style={[st.tx14]}>
                            {item.subject}
                        </Text>
                      
                    </View>
                    <View></View>
                </View>
            </View>
        </View>
    );
};

export default VideoItem;

const styles = StyleSheet.create({
    cardMags: {
        padding: 10,
        borderColor: colors.lightGrey,
        borderWidth: 1,
        borderRadius: 15,
        margin: 10,
        backgroundColor:colors.white
      },
});
