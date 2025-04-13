import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  StyleSheet,
} from 'react-native';
import { styled } from 'nativewind';
import useStore from '../store/useStore';
import { db } from '../firebaseConfig'; // Import Firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Sentiment from 'sentiment';
import { StarIcon, ClockIcon, ArrowUpCircleIcon, ShareIcon } from 'react-native-heroicons/outline'; // Example icons
import Share from 'react-native-share'; // Import Share

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

const sentiment = new Sentiment();

// Define the structure for a quote from the API
interface Quote {
  _id: string;
  content: string;
  author: string;
  tags: string[];
  authorSlug: string;
  length: number;
  dateAdded: string;
  dateModified: string;
}

// Define the structure for the history entry
interface HistoryEntry {
  userId: string;
  timestamp: any; // Firestore server timestamp
  role: string | null;
  inputText?: string; // Optional based on consent
  sentimentScore: number;
  emotionLabel: string; // Comparative score label
  quoteText: string;
  quoteAuthor: string;
  keywordsUsed: string[]; // Keywords used for API search/filtering
}

const HomeScreen = () => {
  const [userInput, setUserInput] = useState('');
  const {
    user,
    role,
    consentGiven,
    dailyQuoteCount,
    decrementQuoteCount,
    currentQuote,
    currentAuthor,
    setCurrentQuote,
    isLoadingQuote,
    setLoadingQuote,
  } = useStore();

  const isPremium = false; // Placeholder for premium status

  const extractKeywords = (text: string): string[] => {
    // Basic keyword extraction (split by space, filter short words)
    // Could be improved with more sophisticated NLP techniques
    return text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  };

  const getSentimentLabel = (score: number): string => {
    if (score > 2) return 'very positive';
    if (score > 0) return 'positive';
    if (score === 0) return 'neutral';
    if (score < -2) return 'very negative';
    return 'negative';
  };

  const logHistory = async (entryData: Omit<HistoryEntry, 'userId' | 'timestamp'>) => {
    if (!user || !consentGiven) {
      console.log('User not logged in or consent not given for history logging.');
      return;
    }

    try {
      const historyCollectionRef = collection(db, 'user_history');
      const docData: HistoryEntry = {
        ...entryData,
        userId: user.uid,
        timestamp: serverTimestamp(), // Use Firestore server timestamp
        role: role, // Log the role at the time of entry
      };

      // Conditionally include inputText based on consent
      if (!consentGiven) {
        delete docData.inputText; // Ensure inputText is not stored if consent is false
      }

      await addDoc(historyCollectionRef, docData);
      console.log('History entry added successfully.');
    } catch (error) {
      console.error('Error logging history to Firestore:', error);
      // Optionally show an error message to the user
    }
  };

  // Placeholder for advanced AI function
  const getAdvancedQuote = async (input: string, userRole: string | null, history: any[]) => {
    console.log("Simulating advanced AI quote fetch with history:", history);
    // Hypothetically use input, role, and history for a better quote
    // For now, return a placeholder or call the standard API as fallback
    const randomResponse = await fetch('https://api.quotable.io/random');
    if (!randomResponse.ok) throw new Error('Failed to fetch fallback random quote');
    const quote: Quote = await randomResponse.json();
    return quote;
  };

  const handleGetInsight = async () => {
    if (dailyQuoteCount <= 0 && !isPremium) {
      Alert.alert('Limit Reached', 'You have used all your daily quotes. Upgrade to Premium for unlimited insights!');
      return;
    }
    if (!userInput.trim()) {
        Alert.alert('Input Required', 'Please enter how you are feeling or what you are thinking about.');
        return;
    }

    setLoadingQuote(true);
    setCurrentQuote('', '');

    const keywords = extractKeywords(userInput);
    const sentimentResult = sentiment.analyze(userInput);
    const sentimentScore = sentimentResult.score;
    const emotionLabel = getSentimentLabel(sentimentScore);
    const searchKeywords = role ? [...keywords, role.toLowerCase()] : keywords;

    try {
      let selectedQuote: Quote | null = null;

      if (isPremium) {
        // Fetch hypothetical user history (replace with actual DB query later)
        const userHistory: any[] = [];
        selectedQuote = await getAdvancedQuote(userInput, role, userHistory);
      } else {
        // Standard fetching logic
        const queryParams = searchKeywords.length > 0 ? `tags=${searchKeywords.join('|')}` : 'random';
        const apiUrl = `https://api.quotable.io/quotes/random?limit=5&${queryParams === 'random' ? '' : queryParams}`;
        console.log(`Fetching quotes with URL: ${apiUrl}`);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          // Improved error message for HTTP errors
          throw new Error(`Quote API request failed: ${response.status} ${response.statusText}`);
        }

        const quotes: Quote[] = await response.json();

        if (quotes && quotes.length > 0) {
          selectedQuote = quotes[0]; // Simple selection for now
        } else {
          console.log('Tag search yielded no results, fetching random quote...');
          const randomResponse = await fetch('https://api.quotable.io/random');
          if (!randomResponse.ok) throw new Error(`Fallback Quote API request failed: ${randomResponse.status} ${randomResponse.statusText}`);
          selectedQuote = await randomResponse.json();
        }
      }

      if (selectedQuote) {
        console.log('Selected Quote:', selectedQuote.content);
        setCurrentQuote(selectedQuote.content, selectedQuote.author);
        if (!isPremium) {
          decrementQuoteCount(); // Only decrement if not premium
        }

        // Log to Firestore
        logHistory({
          inputText: userInput,
          sentimentScore: sentimentScore,
          emotionLabel: emotionLabel,
          quoteText: selectedQuote.content,
          quoteAuthor: selectedQuote.author,
          keywordsUsed: searchKeywords,
          role: role
        });
      } else {
          Alert.alert('Error', 'Could not fetch a quote at this time. Please try again.');
      }

    } catch (error: any) {
      console.error('Error in handleGetInsight:', error);
      // More user-friendly error message
      Alert.alert('Request Failed', `An error occurred: ${error.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleShareQuote = async () => {
    if (!currentQuote || !currentAuthor) return;

    const shareOptions = {
      title: 'Quote from Tenacio.ai',
      message: `"${currentQuote}" - ${currentAuthor}\n\nShared via Tenacio.ai`,
      // url: 'YOUR_APP_LINK', // Optional: Link to your app in app stores
      // social: Share.Social.WHATSAPP, // Example: Direct share to WhatsApp
    };

    try {
      const shareResponse = await Share.open(shareOptions);
      console.log('Share Response:', shareResponse);
      // Handle specific actions based on shareResponse.app if needed
    } catch (error: any) {
      console.error('Error sharing quote:', error);
      // Don't show alert for user cancellation (error.message.includes('User cancelled'))
      if (!error.message || !error.message.toLowerCase().includes('cancelled')) {
          Alert.alert('Share Error', 'Could not share the quote at this time.');
      }
    }
  };

  return (
    <StyledView className="flex-1 justify-center items-center bg-gray-100 p-5">
      <SafeAreaView style={StyleSheet.absoluteFillObject} />
        <StyledText className="text-3xl font-bold mb-6 text-center text-blue-800">Tenacio.ai</StyledText>

        <StyledText className="text-lg mb-4 text-center text-gray-700">How are you feeling today?</StyledText>
        <StyledTextInput
          className="w-full h-24 border border-gray-300 rounded-lg p-3 mb-5 bg-white text-base leading-relaxed"
          placeholder="Share a problem, feeling, or goal..."
          value={userInput}
          onChangeText={setUserInput}
          multiline
          textAlignVertical="top"
        />

        <StyledTouchableOpacity
          className={`w-full py-3 rounded-lg mb-6 ${(!isPremium && dailyQuoteCount <= 0) || isLoadingQuote ? 'bg-gray-400' : 'bg-blue-600'}`}
          onPress={handleGetInsight}
          disabled={(!isPremium && dailyQuoteCount <= 0) || isLoadingQuote}
        >
          <StyledText className="text-white text-center font-bold text-lg">
            {isLoadingQuote ? 'Getting Insight...' : 'Get Insight'}
          </StyledText>
        </StyledTouchableOpacity>

        <StyledView className="w-full p-4 bg-white rounded-lg shadow min-h-[150px] justify-center items-center mb-5 relative">
          {isLoadingQuote ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : currentQuote ? (
            <StyledView className="items-center w-full">
              <StyledView className="mb-3 px-8">
                <StyledText className="text-lg italic text-center text-gray-800 mb-2">"{currentQuote}"</StyledText>
                <StyledText className="text-base font-semibold text-right w-full text-gray-600">- {currentAuthor}</StyledText>
              </StyledView>

              <StyledView className="absolute top-2 right-2 flex-row space-x-2">
                <StyledTouchableOpacity
                    className="p-1 bg-gray-200 rounded-full"
                    onPress={() => Alert.alert('Premium Feature', 'Save favorites is available for premium users.')}
                >
                    <StarIcon size={24} color="#6b7280" />
                </StyledTouchableOpacity>
                <StyledTouchableOpacity
                  className="p-1 bg-blue-100 rounded-full"
                  onPress={handleShareQuote}
                >
                  <ShareIcon size={24} color="#2563eb" />
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>
          ) : (
            <StyledText className="text-gray-500 text-center">Your insightful quote will appear here.</StyledText>
          )}
        </StyledView>

        {!isPremium && (
            <StyledText className="text-base text-gray-600 mb-4">
              Quotes remaining today: {dailyQuoteCount}
            </StyledText>
        )}

        <StyledView className="w-full items-center mt-4 border-t border-gray-300 pt-4">
            <StyledTouchableOpacity
                className="flex-row items-center justify-center bg-yellow-400 py-2 px-4 rounded-lg mb-2 shadow"
                onPress={() => Alert.alert('Upgrade', 'Unlock unlimited quotes, advanced AI, history, favorites, and ad-free experience!')}
            >
                <ArrowUpCircleIcon size={20} color="#374151" style={{ marginRight: 8 }} />
                <StyledText className="text-gray-800 font-semibold">Upgrade to Premium</StyledText>
            </StyledTouchableOpacity>
             <StyledTouchableOpacity
                onPress={() => Alert.alert('Premium Feature', 'View history is available for premium users.')}
            >
                <StyledText className="text-blue-600 underline">View Quote History</StyledText>
            </StyledTouchableOpacity>
        </StyledView>

    </StyledView>
  );
};

export default HomeScreen; 