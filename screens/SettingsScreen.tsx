import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { styled } from 'nativewind';
import useStore from '../store/useStore';
// Import Checkbox if using a library, or use a simple TouchableOpacity
import Checkbox from 'expo-checkbox'; // Make sure expo-checkbox is installed

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const roles = [
  'Student', 'Professional', 'Athlete', 'Creative',
  'Entrepreneur', 'Parent', 'Partner', 'General User'
];

const SettingsScreen = () => {
  const {
    role: currentRole,
    consentGiven: currentConsent,
    setRole,
    setConsent,
  } = useStore();

  const handleRoleSelect = (newRole: string) => {
    setRole(newRole);
    Alert.alert('Role Updated', `Your role has been set to ${newRole}.`);
    // TODO: Optionally persist this change to user profile in Firestore
  };

  const handleConsentChange = (newValue: boolean) => {
    setConsent(newValue);
    Alert.alert(
      'Preference Updated',
      newValue
        ? 'Your history will be stored for personalized suggestions.'
        : 'Your history will not be stored.'
    );
    // TODO: Optionally persist this change to user profile in Firestore
  };

  return (
    <StyledView className="flex-1 bg-gray-100">
      <SafeAreaView style={styles.safeArea}>
        <StyledScrollView contentContainerStyle={styles.scrollViewContent}>
          <StyledText className="text-3xl font-bold mb-8 text-center text-blue-800">Settings</StyledText>

          {/* --- Role Selection --- */}
          <StyledView className="mb-8 p-4 bg-white rounded-lg shadow">
            <StyledText className="text-xl font-semibold mb-4 text-gray-800">Your Role</StyledText>
            <StyledText className="text-base mb-4 text-gray-600">
              Select the role that best describes you. This helps tailor insights (optional).
            </StyledText>
            <StyledView className="flex-row flex-wrap justify-center">
              {roles.map((r) => (
                <StyledTouchableOpacity
                  key={r}
                  className={`py-2 px-4 m-1 rounded-full border ${currentRole === r ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                  onPress={() => handleRoleSelect(r)}
                >
                  <StyledText className={`${currentRole === r ? 'text-white' : 'text-gray-700'}`}>{r}</StyledText>
                </StyledTouchableOpacity>
              ))}
            </StyledView>
          </StyledView>

          {/* --- Data Privacy --- */}
          <StyledView className="mb-8 p-4 bg-white rounded-lg shadow">
            <StyledText className="text-xl font-semibold mb-4 text-gray-800">Data & Privacy</StyledText>
            <StyledText className="text-base mb-4 text-gray-600">
              Allow storing your input history (anonymously to improve AI, personally for personalized suggestions)?
            </StyledText>
            <StyledTouchableOpacity
              className="flex-row items-center p-2"
              onPress={() => handleConsentChange(!currentConsent)}
            >
              <Checkbox
                value={currentConsent}
                onValueChange={handleConsentChange}
                color={currentConsent ? '#2563eb' : undefined}
                style={styles.checkbox}
              />
              <StyledText className="ml-3 text-base text-gray-700">Allow storing history for personalized quote suggestions</StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          {/* --- Future Settings (e.g., Account, Notifications) --- */} 
          {/* <StyledView className="mb-8 p-4 bg-white rounded-lg shadow">
            <StyledText className="text-xl font-semibold mb-4 text-gray-800">Account</StyledText>
             Add account management options here 
          </StyledView> */}

        </StyledScrollView>
      </SafeAreaView>
    </StyledView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  checkbox: {
    margin: 8,
    width: 24, // Adjust size as needed
    height: 24, // Adjust size as needed
  },
});

export default SettingsScreen; 