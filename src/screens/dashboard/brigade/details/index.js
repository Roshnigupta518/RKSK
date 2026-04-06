import { View, Image, Text } from 'react-native'
import React, { useMemo } from 'react'
import CustomHeader from '../../../../components/customHeader'
import { CustomContainer, CustomContent } from '../../../../components/container'
import PeerField from '../../../../components/peerField'
import st from '../../../../global/styles'
import { getLabelsFromValues } from '../../../../utils/helper'
import { activityDuration, booleanData, genderData, qualificationData, schStatusOption } from '../../../../utils/staticJson'
import { environment } from '../../../../utils/constant'
import Icon from 'react-native-vector-icons/Feather'
import { useSelector } from 'react-redux'

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
    const onBoarding = useSelector(state => state.login.data);
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
                     
                    <PeerField label={'Id'} value={data.id} />
                    <PeerField label="District/जिला" value={data.districtName} />
                    <PeerField label="Block/विकासखंड" value={data.blockNameE} />
                    <PeerField label="ASHA Supervisor/आशा सुपरवाइजर का नाम" value={
                        data?.ashaSahyogiID == 0 ? 'Not available' :
                        data.ashaSahyogi
                    } />
                    <PeerField label="ASHA/आशा का नाम" value={data.asha} />
                    <PeerField label="Village/ग्राम का नाम" value={data.villageName} />
                    <PeerField label="Peer educator/साथिया का नाम" value={data.peerEducatorName} />
                    <PeerField label="Name/ब्रिगेड सदस्य का नाम" value={data.brigadeMemberName} />
                    <PeerField label="Registration Date" value={formatDate(data.createdOn)} />
                    <PeerField label="Gender/लिंग " value={data.brigadeMemberGender} />
                    <PeerField label="Age/आयु *" value={data.brigadeMemberAge} />
                    <PeerField label="Mobile Number/मोबाइल नंबर " value={data.brigadeMemberMobile} />
                    <PeerField label="Father/Guardian Name पिता/अभिभावक का नाम" value={data.brigadeMemberGuardianName || data.brigadeMembergardianName} />
                    <PeerField label="Educator Qualification/शैक्षणिक योग्यता" value={data.brigadeMemberEducation} />
                   {data.isSchoolGoing != 0 &&  <PeerField label="School Status Options/विद्यालय जाने की स्थिति का प्रकार" value={getLabelsFromValues(data.isSchoolGoing, schStatusOption)}/>}
                    <PeerField label="Entry by (Designation)" value={(onBoarding.role)} />  
                    <PeerField label="Entry by (Name)" value={onBoarding.email} />
                    {/* <PeerField label="Entry date"  value={formatDate(data.createdOn)}/> */}
                    </View>

            </CustomContent>
        </CustomContainer>
    )
}

export default PeerDetails
