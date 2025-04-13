import './global.css'; // Import NativeWind global styles
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore
import firebaseConfig from './firebaseConfig';
import useStore from './store/useStore';

// Import Screens
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Export Firestore instance

const Stack = createNativeStackNavigator();

export default function App() {
  const setUser = useStore((state) => state.setUser);
  const user = useStore((state) => state.user);
  const role = useStore((state) => state.role);
  const checkAndResetQuoteCount = useStore((state) => state.checkAndResetQuoteCount);

  useEffect(() => {
    // Initialize state and check quote count on app load
    useStore.persist.rehydrate(); // Rehydrate persisted state
    checkAndResetQuoteCount(); // Check if quote count needs reset

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log('User is signed in:', firebaseUser.uid);
        // Map Firebase user to our app user structure
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        // TODO: Fetch user role from Firestore if needed after login/signup
      } else {
        console.log('User is signed out');
        setUser(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setUser, checkAndResetQuoteCount]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          role ? (
            // User logged in and onboarded
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </>
          ) : (
            // User logged in but not onboarded
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )
        ) : (
          // User not logged in
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// Remove default StyleSheet if not needed or modify for base container
// const styles = StyleSheet.create({...});
