import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import orderSlice, { Order } from '../slices/order';
import { useAppDispatch } from '../store';
import axios, { AxiosError } from 'axios'
import Config from 'react-native-config';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { LoggedInParamList } from '../../AppInner';

function EachOrder({ item }: { item: Order }) {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp<LoggedInParamList>>();
    const [detail, showDetail] = useState(false);
    const [loading, setLoading] = useState(false);
    const accessToken = useSelector((state: RootState) => state.user.accessToken);

    const toggleDetail = useCallback(() => {
        showDetail(prevState => !prevState);
    }, []);

    const onAccept = useCallback(async () => {
        try {
            setLoading(true);
            await axios.post(
                `${Config.API_URL}/accept`,
                { orderId: item.orderId },
                { headers: { authorization: `Bearer ${accessToken}` } },
            );
            dispatch(orderSlice.actions.acceptOrder(item.orderId));
            navigation.navigate('Delivery');
        } catch (e) {
            let errorResponse = (e as AxiosError<any>).response;
            if (errorResponse?.status === 400) {
                // 타인이 이미 수락한 경우
                Alert.alert('알림', errorResponse.data.message);
                dispatch(orderSlice.actions.rejectOrder(item.orderId));
            }
        } finally {
            setLoading(false);
        }
        dispatch(orderSlice.actions.acceptOrder(item.orderId));
    }, [accessToken, navigation, dispatch, item.orderId]);

    const onReject = useCallback(() => {
        dispatch(orderSlice.actions.rejectOrder(item.orderId));
    }, [dispatch, item.orderId]);

    return (
        <View key={item.orderId} style={styles.orderContainer}>
            <Pressable onPress={toggleDetail} style={styles.info} disabled={loading}>
                <Text style={styles.eachInfo}>
                    {item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원
                </Text>
                <Text>남산동</Text>
                <Text>두실</Text>
            </Pressable>
            {detail && (
                <View>
                    <View>
                        <Text>네이버맵이 들어갈 장소</Text>
                    </View>
                    <View style={styles.buttonWrapper}>
                        <Pressable onPress={onAccept} style={styles.acceptButton} disabled={loading}>
                            <Text style={styles.buttonText}>수락</Text>
                        </Pressable>
                        <Pressable onPress={onReject} style={styles.rejectButton} disabled={loading}>
                            <Text style={styles.buttonText}>거절</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    )

}

const styles = StyleSheet.create({
    orderContainer: {
        borderRadius: 5,
        margin: 5,
        padding: 10,
        backgroundColor: 'lightgray',
    },
    info: {
        flexDirection: 'row',
        justifyContent: 'space-around',

    },
    eachInfo: {
        // flex: 1,
    },
    buttonWrapper: {
        flexDirection: 'row',
    },
    acceptButton: {
        backgroundColor: 'blue',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomLeftRadius: 5,
        borderTopLeftRadius: 5,
        flex: 1,
    },
    rejectButton: {
        backgroundColor: 'red',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomRightRadius: 5,
        borderTopRightRadius: 5,
        flex: 1,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});


export default EachOrder;