import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { CustomContainer, CustomContent } from '../../../components/container'
import st from '../../../global/styles'
import { colors, wp } from '../../../global'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Octicons';

const Profile = () => {
  const onBoarding = useSelector(state => state.login.data);
  const profileDetails = useSelector(state => state.getProfile.data);

  // console.log({profileDetails})

  const renderCard = (label, value) => {
    return(
      <View style={[st.row,{marginBottom:7}]}>
         <View style={st.wdh50}>
            <View style={[st.row, st.align_C]}>
                 <View style={st.wdh20}>
                 <Icon name={'dot-fill'} size={20} color={colors.schedule} />
                 </View>
                 <View style={st.wdh80}>
                  <Text style={st.tx14}>{label}</Text>
                 </View>
            </View>
         </View>
         <View style={st.wdh50}>
            <Text style={[st.tx14, st.txbold, st.txAlignR,{color:colors.blue}]}>{value}</Text>
         </View>
      </View>
    )
  }

  return (
    <CustomContainer>
      <CustomContent>
        <View style={[st.card,{backgroundColor:colors.blue}]}>
         <View style={st.row}>
         <View style={st.wdh25}>
        <View style={styles.profileAvatar}>
          <Icon name="person" size={30} color={'#FB6F3D'} />
        </View>
        </View>
        <View style={st.wdh75}>
          <Text style={[st.tx16,{color:colors.white}]} numberOfLines={1}>{onBoarding.email}</Text>
          <Text style={[st.tx14,{color:colors.white}]}>{onBoarding.role}</Text>
        </View>
         </View>
        </View>
        
        <View style={st.card}>
         {renderCard('State',profileDetails.state)}
         {renderCard('District',profileDetails.districtName)}
         {renderCard('Block',profileDetails.blockName)}
        </View>

        <View style={st.card}>
         {renderCard('Trainer type', profileDetails.Trainer_Type)}
         {renderCard('Name of Trainer',profileDetails.Trainer_Name)}
        </View>

        {/* <View style={st.card}>
         {renderCard('Date of Birth',profileDetails.dob)}
         {renderCard('Age',profileDetails.age)}
        </View> */}

        <View style={st.card}>
         {/* {renderCard('Qualification',profileDetails.qualification)} */}
         {renderCard('Experience',profileDetails.experience)}
        </View>
      </CustomContent>
    </CustomContainer>
  )
}

export default Profile

const styles = StyleSheet.create({
  profileAvatar: {
    width: wp(55),
    height: wp(55),
    borderRadius: 50,
    backgroundColor: '#FFE5D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
})