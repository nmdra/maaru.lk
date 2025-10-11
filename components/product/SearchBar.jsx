import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getPopularTags, getSearchSuggestions } from '../../services/searchKeywordService';

export default function SearchBar({ value, onChangeText, onClear, onToggleFilters }) {
  const [suggestions, setSuggestions] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Load popular tags on mount
  useEffect(() => {
    loadPopularTags();
  }, []);

  const loadPopularTags = async () => {
    try {
      const tags = await getPopularTags(10);
      setPopularTags(tags);
    } catch (error) {
      console.error('Error loading popular tags:', error);
    }
  };

  // Debounced search suggestions
  const fetchSuggestions = useCallback(
    debounce(async (text) => {
      if (text.trim().length >= 2) {
        try {
          const results = await getSearchSuggestions(text, 8);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  const handleTextChange = (text) => {
    onChangeText(text);
    fetchSuggestions(text);
  };

  const handleSuggestionPress = (suggestion) => {
    onChangeText(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow tap
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleClear = () => {
    onClear();
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View className="bg-white border-b border-gray-200">
      {/* Search Input Row */}
      <View className="flex-row items-center px-4 py-3">
        <Ionicons name="search" size={20} color="gray" className="mr-2" />
        <TextInput
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search by name, tag, keyword..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} className="ml-2">
            <Ionicons name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}

        {/* Toggle Filters Button */}
        <TouchableOpacity onPress={onToggleFilters} className="ml-2">
          <Ionicons name="filter-outline" size={24} color="#2f6feb" />
        </TouchableOpacity>
      </View>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View className="px-4 pb-2 bg-gray-50 border-t border-gray-100">
          <Text className="text-xs text-gray-500 mb-2 mt-1">Suggestions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSuggestionPress(suggestion)}
                className="bg-white px-3 py-1.5 rounded-full mr-2 border border-gray-200"
              >
                <Text className="text-sm text-gray-700">{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Popular Tags - Show when input is empty and focused */}
      {isFocused && value.length === 0 && popularTags.length > 0 && (
        <View className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
          <Text className="text-xs text-gray-500 mb-2">Popular tags:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularTags.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSuggestionPress(item.tag)}
                className="bg-blue-50 px-3 py-1.5 rounded-full mr-2 border border-blue-200"
              >
                <View className="flex-row items-center">
                  <Ionicons name="pricetag" size={12} color="#2f6feb" />
                  <Text className="text-sm text-blue-700 ml-1">{item.tag}</Text>
                  <Text className="text-xs text-blue-500 ml-1">({item.count})</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
