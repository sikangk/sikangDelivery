import React, { useCallback, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import DismissKeyboardView from '../components/DismissKeyboardView';


type SignInScreenProps = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

function SignIn({ navigation }: SignInScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const emailRef = useRef<TextInput | null>(null);
    const passwordRef = useRef<TextInput | null>(null);

    const onChangeEmail = useCallback((text) => {
        setEmail(text);
    }, []);

    const onChangePassword = useCallback((text) => {
        setPassword(text);
    }, [])

    const onSubmit = useCallback(() => {
        if (!email || !email.trim()) {
            return Alert.alert('알림', '이메일을 입력해주세요.');
        }
        if (!password || !password.trim()) {
            return Alert.alert('알림', '비밀번호를 입력해주세요.');
        }

        Alert.alert('알림', '로그인 되었습니다.');
    }, [email, password])

    const canGoNext = email && password;

    const toSignUp = useCallback(() => {
        navigation.navigate('SignUp');
    }, [navigation])


    return (
        <DismissKeyboardView>
            <View style={styles.inputWrapper}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder='이메일을 입력해주세요.'
                    value={email}
                    onChangeText={onChangeEmail}
                    importantForAutofill='yes'
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType='next'
                    onSubmitEditing={() => {
                        passwordRef.current?.focus();
                    }}
                    blurOnSubmit={false}
                    ref={emailRef}
                    keyboardType='email-address'
                    clearButtonMode="while-editing"
                />
            </View>
            <View style={styles.inputWrapper}>
                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder='비밀번호를 입력해주세요.'
                    value={password}
                    onChangeText={onChangePassword}
                    secureTextEntry
                    importantForAutofill='yes'
                    autoComplete="password"
                    textContentType="password"
                    ref={passwordRef}
                    onSubmitEditing={onSubmit}

                />
            </View>
            <View style={styles.buttonZone}>
                <Pressable
                    style={!canGoNext ? styles.loginButton : StyleSheet.compose(styles.loginButton, styles.loginButtonActive)}
                    onPress={onSubmit}
                    disabled={!canGoNext}
                >
                    <Text style={styles.loginButtonText}>로그인</Text>
                </Pressable>
                <Pressable onPress={toSignUp}>
                    <Text>회원가입하기</Text>
                </Pressable>
            </View>
        </DismissKeyboardView>
    )
}

const styles = StyleSheet.create({
    inputWrapper: {
        padding: 20,
    },
    textInput: {
        padding: 5,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 20
    },

    loginButton: {
        backgroundColor: 'gray',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    loginButtonActive: {
        backgroundColor: 'blue'
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16
    },
    buttonZone: {
        alignItems: 'center',
    }
})

export default SignIn;