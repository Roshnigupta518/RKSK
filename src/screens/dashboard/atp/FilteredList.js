import { StyleSheet, FlatList } from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import { CustomContainer } from '../../../components/container'
import EmptyItem from '../../../components/emptyItem'
import AcitivityComponent from '../../../components/AcitivityComponent'
import { useAppSelector } from '../../../hooks'
import { getPlanStatus } from '../../../utils/helper'
import CustomHeader from '../../../components/customHeader'
import st from '../../../global/styles'

const FilteredList = ({ navigation, route }) => {
    const [title, setTitle] = useState()

    const { filterType } = route.params;

    const activityPlanList = useAppSelector(state => state.activityPlan.data);

    const filteredList = useMemo(() => {
        return activityPlanList.filter(item => {
            const status = getPlanStatus(item);

            if (filterType === "COMPLETED") return status === "Completed";

            if (filterType === "TODAY") {
                return status === "Pending"; // today pending
            }

            if (filterType === "OVERDUE") return status === "Overdue";

            if (filterType === "SCHEDULED") return status === "Scheduled";

            return true;
        });
    }, [activityPlanList, filterType]);

    useEffect(() => {
        if (filterType === "COMPLETED") setTitle("Completed Activities");
        if (filterType === "TODAY") setTitle("Today's Activities");
        if (filterType === "OVERDUE") setTitle("Overdue Activities");
        if (filterType === "SCHEDULED") setTitle("On-Schedule Activities");
    }, []);


    return (
        <CustomContainer>
            <CustomHeader title={title} onBackPress={() => navigation.goBack()} />
            <FlatList
                data={filteredList}
                keyExtractor={(item) => item.atP_Id.toString()}
                renderItem={({ item }) => <AcitivityComponent
                    item={item}
                    onPress={() =>
                        navigation.navigate('ATPLogin',
                            { atP_Id: item.atP_Id, animation: 'none', filterType:filterType }
                        )
                    }
                />
                }
                ListEmptyComponent={() => <EmptyItem />}
                contentContainerStyle={st.pd20}
            />
        </CustomContainer>
    )
}

export default FilteredList

const styles = StyleSheet.create({})