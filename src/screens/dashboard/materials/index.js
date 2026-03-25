import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native'
import React,{useState} from 'react'
import CustomHeader from '../../../components/customHeader'
import { CustomContainer } from '../../../components/container'
import MagazinesItem from '../../../components/MagazinesItem'
import { useAppSelector } from '../../../hooks'
import { startBackgroundService } from '../../../utils/bgservices/backgroundService'
import { syncTaskName } from '../../../utils/bgservices/backgroundTaskEnum'
import EmptyItem from '../../../components/emptyItem'

const Materials = ({navigation}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const magList = useAppSelector(state => state.iecMaterialList.data);

    const renderItem_magazines = ({item, index}) => {
        return (
          <MagazinesItem
            item={item}
            onClickPdf={() => navigation.navigate('ViewPdf', {url: item.url})}
          />
        );
      };

      const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        startBackgroundService(syncTaskName.syncIecMaterialList)
        setRefreshing(false);
      }, []);
    
    
  return (
    <CustomContainer>
        <FlatList
        data={magList}
        renderItem={renderItem_magazines}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => <EmptyItem/>}
      />

    </CustomContainer>
  )
}

export default Materials

const styles = StyleSheet.create({})