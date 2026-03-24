import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native'
import React,{useState} from 'react'
import { CustomContainer } from '../../../components/container'
import VideoItem from '../../../components/VideoItem'
import { useAppSelector } from '../../../hooks'
import { startBackgroundService } from '../../../utils/bgservices/backgroundService'
import { syncTaskName } from '../../../utils/bgservices/backgroundTaskEnum'

const AwarenessVideo = ({navigation}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const magList = useAppSelector(state => state.awarenessVideoList.data);

    console.log({magList})

    const renderItem_magazines = ({item, index}) => {
        return (
            <VideoItem
            item={item}
            index={index}
            onPress={() => navigation.navigate('ViewVdo', {item: item})}
          />
    
        );
      };

      const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        startBackgroundService(syncTaskName.syncAwarenessVideo)
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
      />

    </CustomContainer>
  )
}

export default AwarenessVideo

const styles = StyleSheet.create({})