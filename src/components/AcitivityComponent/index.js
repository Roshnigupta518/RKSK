import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import Field from '../field'
import st from '../../global/styles'
import { colors } from '../../global'
import FieldRow from '../FieldRow'
import { getClockInUI, getPlanStatus, getSyncUI } from '../../utils/helper'
import { ENUM } from '../../utils/bgservices/enum'

const AcitivityComponent = ({ item, index, onPress }) => {

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return colors.completed;
      case "In Progress":
        return colors.inprogress;
      case "Pending":
        return colors.pending;
      case "Scheduled":
        return colors.schedule;
      case "Overdue":
        return colors.overdue;
      default:
        return colors.grey;
    }
  };

  const status = getPlanStatus(item);
  const clockInUI = getSyncUI(item.clockinSyncStatus);
  const formUI = getSyncUI(item.formSyncStatus);
  const clockOutUI = getSyncUI(item.clockoutSyncStatus);

  const isSubActivityPlan = item.visit_PurposeId_Id == 2;

  let allFilledSynced = false;

  if (isSubActivityPlan && item.subacitivity?.length > 0) {

    const filledSubs = item.subacitivity.filter(sub =>
      sub.photo_Path ||
      sub.video_Path ||
      sub.meeting_Participant ||
      sub.activity_Details ||
      sub.activity_DateTime ||
      sub.visit_Completion
    );

    allFilledSynced =
      filledSubs.length > 0 &&
      filledSubs.every(sub => sub.isSynced === true);
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[st.card]}>
      <View style={st.mt_5} />
      <Text style={styles.title}>{index+1}. {item.visit_Purpose}</Text>

       <FieldRow>
        <Field label="Atp Id" value={item.atP_Id} />
      </FieldRow>

      <FieldRow>
        <Field label="Asha" value={item.ashaNameEnglish} />
        <Field label="Village" value={item.villageName} alignRight />
      </FieldRow>

      <FieldRow>
        <Field label="Start Date and Time" value={item.visit_Start_Date} />
        <Field label="End Date and Time" value={item.visit_End_Date} alignRight />
      </FieldRow>

      <View style={[styles.ribbon, { backgroundColor: getStatusColor(status) }]}>
        <Text style={[st.tx12, { color: colors.white }]}>
          {status}
        </Text>
      </View>

      {(item.clockinTime || item.clockoutTime || item.activity_Id) && (
        <View style={styles.syncContainer}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Clock-In:</Text>
            <Text style={[styles.syncStatus, { color: clockInUI.color }]}>
              {clockInUI.text}
            </Text>

          </View>

          {/* {(item.activity_Id || item.clientId) && (
            <View style={styles.syncRow}>
              <Text style={styles.syncLabel}>Form:</Text>
              <Text style={[styles.syncStatus, { color: formUI.color }]}>
              {formUI.text}
            </Text>
            </View>
          )} */}

            {(item.activity_Id || item.clientId || isSubActivityPlan) && (
              <View style={styles.syncRow}>
                <Text style={styles.syncLabel}>Form:</Text>

                {isSubActivityPlan ? (
                  allFilledSynced ? (
                    <Text style={[styles.syncStatus, { color: colors.completed }]}>
                      ✔ 
                    </Text>
                  ) : (
                    <Text style={[styles.syncStatus, { color: colors.orange }]}>
                      ⟳ 
                    </Text>
                  )
                ) : (
                  <Text style={[styles.syncStatus, { color: formUI.color }]}>
                    {formUI.text}
                  </Text>
                )}
              </View>
            )}

          {item.clockoutTime && (
            <View style={styles.syncRow}>
              <Text style={styles.syncLabel}>Clock-Out:</Text>
              <Text style={[styles.syncStatus, { color: clockOutUI.color }]}>
              {clockOutUI.text}
            </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

export default AcitivityComponent

const styles = StyleSheet.create({
  title: {
    ...st.tx14,
    ...st.txbold,
    color: colors.blue,
    marginBottom: 10,
  },
  ribbon: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 10,
  },
  syncContainer: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },

  syncLabel: {
    ...st.tx12,
    marginRight: 5
  },

  syncStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});