import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import st from '../../../global/styles'
import { colors } from '../../../global'
import { CustomContainer, CustomContent } from '../../../components/container';

const PrivacyPolicy = () => {
  return (
    <CustomContainer>
      <CustomContent>
        <View>
        {/* <Text style={[st.tx16, { color: colors.blue }]}>Privacy Policy for RKSK MP Mobile App </Text> */}
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`The RKSK MP Mobile App is developed under the Rashtriya Kishor Swasthya Karyakram (RKSK) initiative of the National Health Mission (NHM), Madhya Pradesh. 

This app supports the management, reporting, and monitoring of adolescent health and wellness programs such as the Peer Educator Program, Umang Higher Education Health and Wellness Program, and other community activities across Madhya Pradesh. 

Your privacy is important to us. This policy explains what information we collect, how we use it, and how we protect it. `}
        </Text>
        </View>
        <View style={st.mt_5}>
        <Text style={[st.tx14, { color: colors.blue }]}>1. Information We Collect</Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`We collect only the information needed to manage health program activities effectively:  
•	User details: name, role, organization, and contact information for registered users (e.g., counselors, trainers, NGO functionaries). 
•	Program data: session records, attendance, training reports, and activity updates. 
•	Location data: limited geographic information to map program coverage. 
•	Device and usage data: non-personal information such as device type and operating system for security and performance improvement. 

The app does not collect or store personal data of adolescents. All beneficiary information is recorded in an anonymized form for program reporting only. 
 `}
        </Text>
        </View>

        <View>
        <Text style={[st.tx14, { color: colors.blue }]}>2. How We Use the Information</Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`The collected data is used only for: 
•	Monitoring and improving adolescent health and wellness programs. 
•	Generating reports and dashboards for district and state-level planning. 
•	Supporting training, evaluation, and performance tracking. 
•	Ensuring transparency and accountability under NHM Madhya Pradesh. 

We do not sell, rent, or use your information for advertising or commercial purposes. 
 `}
        </Text>


        <Text style={[st.tx14, { color: colors.blue }]}>3. Data Security </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`We take your data security seriously. 
•	All information is stored on secure servers managed under NHM MP supervision. 
•	Data transmission is encrypted using standard security protocols. 
•	Only authorized users with role-based access can view or update information. 
•	Regular audits are conducted to ensure compliance with NHM data-protection guidelines.  
 `}
        </Text>


        <Text style={[st.tx14, { color: colors.blue }]}>4. Data Sharing </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`Data is shared only with authorized NHM MP officials and approved program partners for official monitoring and evaluation. 
Information may also be used in aggregated or anonymized form for research and reporting. 
We never share your personal data with third parties for marketing or profit.   
 `}
        </Text>

        <Text style={[st.tx14, { color: colors.blue }]}>5. Your Responsibilities </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`Users are responsible for: 
•	Keeping their login credentials confidential. 
•	Entering accurate data while using the app. 
•	Reporting any suspected misuse or security issue to the NHM MP technical team.  
 `}
        </Text>



        <Text style={[st.tx14, { color: colors.blue }]}>6. Data Retention </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`Your data is retained only as long as needed for program monitoring and reporting. 
When no longer required, it will be securely archived or deleted according to NHM data-retention guidelines.  
 `}
        </Text>


        <Text style={[st.tx14, { color: colors.blue }]}>7. Children’s Privacy </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`This app does not collect personal information directly from children or adolescents. 
All adolescent-related data is recorded only by authorized health workers in anonymized formats. 
 `}
        </Text>


        <Text style={[st.tx14, { color: colors.blue }]}>8. Policy Updates </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`We may update this Privacy Policy from time to time. 
Any updates will be shown within the app and on the official NHM Madhya Pradesh website. 
By continuing to use the app, you agree to the updated policy. 
 `}
        </Text>

        <Text style={[st.tx14, { color: colors.blue }]}>9. Contact Us  </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`If you have any questions or concerns about this Privacy Policy, please contact:  
National Health Mission,  
Madhya Pradesh 
 `}
        </Text>

        {/* <Text style={[st.tx14, { color: colors.blue }]}>Disclaimer: </Text>
        <Text style={[st.tx12, { lineHeight: 30 }]}>
         {`The RKSK MP Mobile App is for official use under NHM Madhya Pradesh. While every effort is made to secure and protect your data, NHM MP is not responsible for unauthorized access caused by external factors beyond its control. 
 `}
        </Text> */}
        </View>
      </CustomContent>
    </CustomContainer>
  )
}

export default PrivacyPolicy

const styles = StyleSheet.create({})