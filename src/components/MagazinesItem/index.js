import {StyleSheet, Text, Image, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Icon from 'react-native-vector-icons/Foundation';
import PopUpMessage from '../customPopup';
import { colors } from '../../global';
import { downloadFile } from '../../utils/helper';
import st from '../../global/styles';
import CustomLoader from '../loader/Loader';
import ImageConstants from '../../global/images';

const MagazinesItem = ({item, onClickPdf}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [popupMessageVisibility, setPopupMessageVisibility] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const getpdfFile = async (title, url) => {
    try {
      setIsLoading(true);
      const result = await downloadFile(title, url);
      if (result) {
        setIsLoading(false);
        onPopupMessageModalClick(true);
        setTitle(('Congratulations'));
        setSubtitle('PDF has been downloaded successfully');
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  const onPopupMessageModalClick = value => {
    setPopupMessageVisibility(value);
  };

  const show_alert_msg = () => {
    return (
        <PopUpMessage
            visible={popupMessageVisibility}
            title={title}
            message={subtitle}
            onClose={() => setPopupMessageVisibility(false)}
            onConfirm={()=>setPopupMessageVisibility(false)}
            showCancel={true}
        />

    );
  };

  return (
    <View>
      <View style={[styles.cardMags]}>
        <View style={[st.row]}>
          <View style={st.wdh30}>
            <Image source={item.thumbnail ? {uri: item.thumbnail} : ImageConstants.pdfthumbnail } style={styles.thumbnailSty} />
          </View>
          <View style={st.wdh70}>
            <View>
              <Text style={st.tx14} numberOfLines={2}>
                {item.discription}
              </Text>
            </View>
            <View style={[st.row, st.justify_S, st.mt_10]}>
              <TouchableOpacity
                onPress={() => onClickPdf()}
                style={styles.pdf_read}>
                <Text style={[st.tx12, {color: colors.white}]}>{"Read Now"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => getpdfFile(item.discription, item.url)}
                style={[styles.pdf_read, st.ml_15]}>
                <Icon name={'download'} size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {show_alert_msg()}
      {isLoading && <CustomLoader visible={isLoading} />}
    </View>
  );
};

export default MagazinesItem;

const styles = StyleSheet.create({
  cardMags: {
    padding: 10,
    borderColor: colors.lightGrey,
    borderWidth: 1,
    borderRadius: 15,
    margin: 10,
    backgroundColor:colors.white
  },
  pdf_read: {
    backgroundColor: colors.blue,
    paddingHorizontal: 10,
    borderRadius: 50,
    paddingVertical: 3,
  },
  thumbnailSty:{
    borderColor: colors.white,
    borderWidth: 1,
    width:'90%',
    height:100,
  }
});
