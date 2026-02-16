import { View, Image } from 'react-native'
import React, { useMemo } from 'react'
import CustomHeader from '../../../../components/customHeader'
import { CustomContainer, CustomContent } from '../../../../components/container'
import PeerField from '../../../../components/peerField'
import st from '../../../../global/styles'
import { getLabelsFromValues } from '../../../../utils/helper'
import { activityDuration, genderData } from '../../../../utils/staticJson'
import { environment } from '../../../../utils/constant'

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
                title="Reporting Data Details"
                onBackPress={() => navigation.goBack()}
            />

            <CustomContent>
                <View style={st.card}>                  
                    <PeerField label="जिला" value={data.districtName} />
                    <PeerField label="विकासखंड/ब्लॉक" value={data.blockName} />
                    <PeerField label="आशा सुपरवाइजर का नाम" value={data.supervisorNameText || data.ashaSahyogi_Name} />
                    <PeerField label="आशा का नाम" value={data.ashaNameText || data.ashaName} />
                    <PeerField label="ग्राम का नाम" value={data.villageName} />
                    <PeerField label="साथिया का नाम" value={data.sathiyaNameText || data.sathiyaName} />
                    <PeerField label="लिंग" value={data.genderText || data.gender} />
                    <PeerField label="गतिविधि की तारीख" value={formatDate(data.activityDate)} />
                    <PeerField label="गतिविधि का स्थान" value={data.locationText || data.location} />
                    <PeerField label="गतिविधि का प्रकार" value={data.activityTypeText || data.activityType} />
                    <PeerField label="कौन-सा मॉड्यूल/विषय लिया गया?" value={data.moduleText || data.module} />
                    <PeerField label="कौन-सी कॉमिक्स बुक का उपयोग किया गया?" value={data.comicBookText || data.comicBook} />
                    <PeerField label="गतिविधि कैसे की?" value={data.activityMethodText || data.activityMethod} />
                    <PeerField label="प्रतिभागियों की संख्या" value={participantsText} />
                    <PeerField label="गतिविधि की अवधि" value={getLabelsFromValues(data.duration, activityDuration)}/>
                    <PeerField label="सामग्री उपयोग" value={(data.materialUsedText || data.matterialUsed)} />  
                    <PeerField label="किशोर-किशोरियों द्वारा पूछे गए प्रमुख प्रश्न" value={data.questions} />
                    <PeerField label="गतिविधि के दौरान आई चुनौतियां" value={data.challenges || data.challanges} />
                    <PeerField label="सफलता/अच्छा अनुभव" value={data.successStory} />
                    <PeerField label="फोटो" value={data.attachment?.length ? `${data.attachment?.length} फोटो` : 'कोई फोटो नहीं'}/>
                    {data?.attachment?.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                            {data.attachment.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img.uri }}
                                    style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: 6,
                                        marginRight: 8,
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: '#ddd',
                                    }}
                                />
                            ))}
                        </View>
                    )}

                    {data?.photo?.length>0 && (
                         <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                            {data?.photo.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri:environment.imageUrl+img }}
                                    style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: 6,
                                        marginRight: 8,
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: '#ddd',
                                    }}
                                />
                            ))}
                        </View>
                    )}
                </View>

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
            </CustomContent>
        </CustomContainer>
    )
}

export default PeerDetails
