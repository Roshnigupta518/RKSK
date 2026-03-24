import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Platform,
    Dimensions, Alert
} from 'react-native';
import React from 'react';
import Pdf from 'react-native-pdf';
import CustomHeader from '../../../components/customHeader';
import { CustomContainer } from '../../../components/container';
import useNetworkStatus from '../../../hooks/networkStatus';
import st from '../../../global/styles';

const ViewPdf = ({ navigation, route }) => {
    const url = route?.params?.url;

    const source = {
        uri: url,
        cache: true,
    };

    const isConnected = useNetworkStatus();

    return (
        <CustomContainer>
            <CustomHeader title={''} onBackPress={() => navigation.goBack()} />
            {!isConnected ? (
                <View style={st.center}>
                    <Text style={st.tx14}>No internet connection</Text>
                    <Text style={st.tx12}>Please turn on internet to view this PDF.</Text>
                </View>
            ) : (
                <Pdf
                    source={source}
                    trustAllCerts={false}
                    onError={error => {
                        console.log({error})
                        Alert.alert('Error', 'Unable to load PDF. Please try again.');
                    }}
                    style={styles.pdf}
                />
            )}

        </CustomContainer>
    );
};

export default ViewPdf;

const styles = StyleSheet.create({
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});
