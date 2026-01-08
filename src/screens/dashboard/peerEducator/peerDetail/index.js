import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CustomHeader from '../../../../components/customHeader'
import { CustomContainer, CustomContent } from '../../../../components/container'
import PeerField from '../../../../components/peerField'
import st from '../../../../global/styles'

const PeerDetails = ({ navigation }) => {
    return (
        <CustomContainer>
            <CustomHeader title="Reporting Data Details"
                onBackPress={() => navigation.goBack()}
            />
            <CustomContent>
                <View style={st.card}>
                    <PeerField label={'गतिविधि की तारीख'} value={''} />
                    <PeerField label={'ग्राम का नाम'} value={''} />
                    <PeerField label={'आशा का नाम'} value={''} />
                    <PeerField label={'साथिया का नाम'} value={''} />
                    <PeerField label={'जिला'} value={''} />
                    <PeerField label={'विकासखंड/ब्लॉक'} value={''} />
                    <PeerField label={'आशा सुपरवाइजर का नाम'} value={''} />
                    <PeerField label={'लिंग'} value={''} />
                    <PeerField label={'गतिविधि का स्थान'} value={''} />
                    <PeerField label={'गतिविधि का प्रकार'} value={''} />
                    <PeerField label={'गतिविधि कैसे की?'} value={''} />
                    <PeerField label={'प्रतिभागियों की संख्या'} value={''} />
                    <PeerField label={'गतिविधि की अवधि'} value={''} />
                    <PeerField label={'सामग्री उपयोग'} value={''} />
                    <PeerField label={'कौन-सा मॉड्यूल/विषय लिया गया?'} value={''} />
                    <PeerField label={'कौन-सी कॉमिक्स बुक का उपयोग किया गया?'} value={''} />
                    <PeerField label={'किशोर-किशोरियों द्वारा पूछे गए प्रमुख प्रश्न'} value={''} />
                    <PeerField label={'गतिविधि के दौरान आई चुनौतियां'} value={''} />
                    <PeerField label={'सफलता/अच्छा अनुभव'} value={''} />
                    <PeerField label={'फोटो'} value={''} />
                </View>

                <View style={st.card}>
                    <PeerField label={'किशोर/किशोरी का नाम'} value={''} />
                    <PeerField label={'लिंग'} value={''} />
                    <PeerField label={'साथिया का नाम'} value={''} />
                    <PeerField label={'समस्या/विषय'} value={''} />
                </View>

            </CustomContent>
        </CustomContainer>
    )
}

export default PeerDetails
