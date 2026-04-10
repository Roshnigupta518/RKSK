import { View, Image, Text } from 'react-native'
import React, { useMemo } from 'react'
import CustomHeader from '../../../../components/customHeader'
import { CustomContainer, CustomContent } from '../../../../components/container'
import PeerField from '../../../../components/peerField'
import st from '../../../../global/styles'
import { getLabelsFromValues } from '../../../../utils/helper'
import { activityDuration, genderData } from '../../../../utils/staticJson'
import { environment } from '../../../../utils/constant'
import Icon from 'react-native-vector-icons/Feather'

const formatDate = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB') // 21/01/2026
}


const PeerDetails = ({ navigation, route }) => {
    const { data = {} } = route?.params || {}
    console.log({ data })

    return (
        <CustomContainer>
            <CustomHeader
                title="Refferal Details"
                onBackPress={() => navigation.goBack()}
            />

            <CustomContent>
                <View style={st.card}> 
                       
                    <PeerField label={'रेफरल आई डी'} value={data.id} />
                    <PeerField label="जिला" value={data.districtName} />
                    <PeerField label="विकासखंड/ब्लॉक" value={data.blockName} />
                    <PeerField label="आशा सुपरवाइजर का नाम" value={
                        data?.ashA_Facilitator_Id == 0 ? 'Not available' :
                        data.supervisorNameText || data.ashaSahyogi_Name
                    } />
                    <PeerField label="आशा का नाम" value={data.ashaNameText || data.ashaName} />
                    <PeerField label="ग्राम का नाम" value={data.villageName} />
                    <PeerField label="साथिया का नाम" value={data.sathiyaNameText || data.sathiyaName} />
                    <PeerField label="लिंग" value={data.genderText || data.gender} />
                    <PeerField label="गतिविधि की तारीख" value={formatDate(data.activityDate)} />
                    {data.referrals?.length > 0 &&
                    data.referrals.map((ref, index) => (
                        <View key={index} style={[st.card, { marginTop: 10 }]}>
                            <PeerField label="किशोर/किशोरी का नाम" value={ref.name} />
                            <PeerField label="लिंग" value={getLabelsFromValues(ref.gender, genderData)}/>
                            <PeerField label="समस्या/विषय" value={ref.healthissue} />
                            {ref.referrals?.length > 0 && (
                                <PeerField label="किसको रेफर किया" value={ref.referrals.join(', ')}/>
                            )}
                        </View>
                    ))}
                </View>

              
            </CustomContent>
        </CustomContainer>
    )
}

export default PeerDetails
