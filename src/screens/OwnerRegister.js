import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { registerOwner } from '../services/firebaseActions';

const OwnerRegister = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    setLoading(true);
    const res = await registerOwner(email, password, name, phone);
    setLoading(false);

    if (res.success) {
      Alert.alert("Success", "Account created! Welcome to PawSOS.");
      navigation.navigate('OwnerDashboard', { user: { displayName: name } });
    } else {
      Alert.alert("Registration Failed", res.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Owner Account</Text>
      
      <TextInput style={styles.input} placeholder="Full Name" onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Phone Number" onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>REGISTER</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#d63031', marginBottom: 25 },
  input: { backgroundColor: '#f1f2f6', padding: 15, borderRadius: 10, marginBottom: 15 },
  btn: { backgroundColor: '#d63031', padding: 20, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default OwnerRegister;