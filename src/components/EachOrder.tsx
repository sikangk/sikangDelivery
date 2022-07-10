import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import orderSlice, { Order } from '../slices/order';
import { useAppDispatch } from '../store';
import axios, { AxiosError } from 'axios'
import Config from 'react-native-config';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { LoggedInParamList } from '../../AppInner';
import EncryptedStorage from 'react-native-encrypted-storage';
import NaverMapView, { Marker, Path, NaverMapViewProps } from 'react-native-nmap';
import getDistanceFromLatLonInKm from '../util';


function EachOrder({ item }: { item: Order }) {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp<LoggedInParamList>>();
    const [detail, showDetail] = useState(false);
    const [loading, setLoading] = useState(false);
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const { start, end } = item;

    const toggleDetail = useCallback(() => {
        showDetail(prevState => !prevState);
    }, []);

    const onAccept = useCallback(async () => {
        setLoading(true);
        try {
            await axios.post(
                `${Config.API_URL}/accept`,
                { orderId: item.orderId },
                { headers: { authorization: `Bearer ${accessToken}` } },
            );
            dispatch(orderSlice.actions.acceptOrder(item.orderId));
            setLoading(false);
            navigation.navigate('Delivery');
        } catch (e) {

            let errorResponse = (e as AxiosError<any>).response;
            console.log(errorResponse, 'errorResponse');
            if (errorResponse?.status === 400) {
                // 타인이 이미 수락한 경우
                Alert.alert('알림', errorResponse.data.message);
                dispatch(orderSlice.actions.rejectOrder(item.orderId));
            }

        } finally {

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
                <Text style={styles.eachInfo}>
                    {getDistanceFromLatLonInKm(start.latitude, start.longitude, end.latitude, end.longitude).toFixed(1)}
                </Text>
                <Text>남산동</Text>
                <Text>두실</Text>
            </Pressable>
            {detail && (
                <View>
                    <View>
                        <View
                            style={{
                                width: Dimensions.get('window').width - 30,
                                height: 200,
                                marginTop: 10,
                            }}>
                            <NaverMapView
                                style={{ width: '100%', height: '100%' }}
                                zoomControl={false}
                                center={{
                                    zoom: 10,
                                    tilt: 50,
                                    latitude: (start.latitude + end.latitude) / 2,
                                    longitude: (start.longitude + end.longitude) / 2,
                                }}>
                                <Marker
                                    coordinate={{
                                        latitude: start.latitude,
                                        longitude: start.longitude,
                                    }}
                                    pinColor="blue"
                                />
                                <Path
                                    coordinates={[
                                        {
                                            latitude: start.latitude,
                                            longitude: start.longitude,
                                        },
                                        { latitude: end.latitude, longitude: end.longitude },
                                    ]}
                                />
                                <Marker
                                    coordinate={{ latitude: end.latitude, longitude: end.longitude }}
                                />
                            </NaverMapView>
                        </View>
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