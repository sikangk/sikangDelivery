import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Settings from './src/pages/Settings';
import Orders from './src/pages/Orders';
import Delivery from './src/pages/Delivery';
import SignIn from './src/pages/SignIn';
import SignUp from './src/pages/SignUp';
import { useSelector } from 'react-redux';
import { RootState } from './src/store/reducer';
import { useEffect } from 'react';
import useSocket from './src/hooks/useSocket';
import EncryptedStorage from 'react-native-encrypted-storage';
import Config from 'react-native-config';
import axios, { AxiosError } from 'axios';
import userSlice from './src/slices/user';
import { useAppDispatch } from './src/store';
import { Alert } from 'react-native';
import orderSlice from './src/slices/order';
import usePermissions from './src/hooks/usePermissions';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export type RootStackParamList = {
    SignIn: undefined;
    SignUp: undefined;
};

export type LoggedInParamList = {
    Orders: undefined;
    Settings: undefined;
    Delivery: undefined;
    Complete: { orderId: string };
};

function AppInner() {
    const isLoggedIn = useSelector((state: RootState) => !!state.user.email);
    const [socket, disconnect] = useSocket();

    const dispatch = useAppDispatch();

    usePermissions();


    useEffect(() => {
        axios.interceptors.response.use(
            response => {
                return response;
            },
            async error => {
                const {
                    config,
                    response: { status },
                } = error;
                if (status === 419) {
                    if (error.response.data.code === 'expired') {
                        const originalRequest = config;
                        const refreshToken = await EncryptedStorage.getItem('refreshToken');
                        // token refresh 요청
                        const { data } = await axios.post(
                            `${Config.API_URL}/refreshToken`, // token refresh api
                            {},
                            { headers: { authorization: `Bearer ${refreshToken}` } },
                        );
                        // 새로운 토큰 저장
                        dispatch(userSlice.actions.setAccessToken(data.data.accessToken));
                        originalRequest.headers.authorization = `Bearer ${data.data.accessToken}`;
                        // 419로 요청 실패했던 요청 새로운 토큰으로 재요청
                        console.log(originalRequest, 'originalRequest');
                        return axios(originalRequest);
                    }
                }
                return Promise.reject(error);
            },
        );
    }, [dispatch]);

    useEffect(() => {
        const getTokenAndRefresh = async () => {
            try {
                const token = await EncryptedStorage.getItem('refreshToken');
                if (!token) {
                    return;
                }
                const response = await axios.post(
                    `${Config.API_URL}/refreshToken`,
                    {},
                    {
                        headers: {
                            authorization: `Bearer ${token}`,
                        },
                    },
                );
                dispatch(
                    userSlice.actions.setUser({
                        name: response.data.data.name,
                        email: response.data.data.email,
                        accessToken: response.data.data.accessToken,
                    }),
                );
            } catch (error: any) {
                console.error(error);
                if ((error as AxiosError<any>).response?.data.code === 'expired') {
                    Alert.alert('알림', '다시 로그인 해주세요.');
                }
            } finally {
                //스플래시 스크린 없애기
            }
        };
        getTokenAndRefresh();
    }, [dispatch]);

    useEffect(() => {
        const helloCallback = (data: any) => {
            console.log(data, '222');
            dispatch(orderSlice.actions.addOrder(data));
        };
        if (socket && isLoggedIn) {
            console.log(socket);
            socket.emit('acceptOrder', 'hello'); //서버로 요청할때,
            socket.on('order', helloCallback); //서버에서 받을때,
        }
        return () => {
            if (socket) {
                socket.off('order', helloCallback);
            }
        };
    }, [isLoggedIn, socket]);

    useEffect(() => {
        if (!isLoggedIn) {
            console.log('!isLoggedIn', !isLoggedIn);
            disconnect();
        }
    }, [dispatch, isLoggedIn, disconnect]);


    return (
        <NavigationContainer>
            {isLoggedIn ? (
                <Tab.Navigator>
                    <Tab.Screen
                        name="Orders"
                        component={Orders}
                        options={{ title: '오더 목록' }}
                    />
                    <Tab.Screen
                        name="Delivery"
                        component={Delivery}
                        options={{ headerShown: false }}
                    />
                    <Tab.Screen
                        name="Settings"
                        component={Settings}
                        options={{ title: '내 정보' }}
                    />
                </Tab.Navigator>
            ) : (
                <Stack.Navigator>
                    <Stack.Screen
                        name="SignIn"
                        component={SignIn}
                        options={{ title: '로그인' }}
                    />
                    <Stack.Screen
                        name="SignUp"
                        component={SignUp}
                        options={{ title: '회원가입' }}
                    />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    )
}

export default AppInner;