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

const joinArray = (arr) => {
    if (!arr || !arr.length) return '-'
    return arr.join(', ')
}

const PeerDetails = ({ navigation, route }) => {
    const { data = {} } = route?.params || {}
    console.log({ data })
    const participantsText = useMemo(() => {
        if (!data.participants) return '-'
        return `
            किशोर: ${data.participants.boys || 0},
            किशोरी: ${data.participants.girls || 0},
            आशा सहयोगी: ${data.participants.supervisor || 0},
            आशा: ${data.participants.asha || 0},
            CHO: ${data.participants.cho || 0},
            आंगनवाड़ी: ${data.participants.awc || 0}
                `.trim()
    }, [data.participants])

    return (
        <CustomContainer>
            <CustomHeader
                title="Brigade Details"
                onBackPress={() => navigation.goBack()}
            />

            <CustomContent>
                <View style={st.card}> 
                {data.id == -1 &&
                    <View style={st.warningBox}>
                        <Icon name="alert-circle" size={16} color="#E59E0B" />
                        <Text style={st.tx12}>
                            {"  Already submitted entry for this date."}
                        </Text>
                    </View>
                }          
                    <PeerField label={'Id'} value={data.id} />
                    <PeerField label="District/जिला" value={data.districtName} />
                    <PeerField label="विकासखंड / ब्लॉक" value={data.blockName} />
                    <PeerField label="आशा सुपरवाइजर का नाम" value={
                        data?.ashA_Facilitator_Id == 0 ? 'Not available' :
                        data.supervisorNameText || data.ashaSahyogi_Name
                    } />
                    <PeerField label="आशा का नाम" value={data.ashaNameText || data.ashaName} />
                    <PeerField label="ग्राम का नाम" value={data.villageName} />
                    <PeerField label="साथिया का नाम" value={data.sathiyaNameText || data.sathiyaName} />
                    <PeerField label="Name/ब्रिगेड सदस्य का नाम" value={data.genderText || data.gender} />
                    <PeerField label="Registration Date" value={formatDate(data.activityDate)} />
                    <PeerField label="लिंग  " value={data.locationText || data.location} />
                    <PeerField label="Age/आयु *" value={data.activityTypeText || data.activityType} />
                    <PeerField label="मोबाइल नंबर " value={data.moduleText || data.module} />
                    <PeerField label="पिता /अभिभावक का नाम" value={data.comicBookText || data.comicBook} />
                    <PeerField label="शैक्षणिक योग्यता" value={data.activityMethodText || data.activityMethod} />
                    <PeerField label="विद्यालय जाने की स्थिति" value={participantsText} />
                    <PeerField label="विद्यालय जाने की स्थिति का प्रकार" value={getLabelsFromValues(data.duration, activityDuration)}/>
                    <PeerField label="Entry by (Designation)" value={(data.materialUsedText || data.matterialUsed)} />  
                    <PeerField label="Entry by (Name)" value={data.questions} />
                    <PeerField label="Entry date" value={data.challenges || data.challanges} />
                    </View>

            </CustomContent>
        </CustomContainer>
    )
}

export default PeerDetails
