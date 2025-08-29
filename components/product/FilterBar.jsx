import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Books', 'Clothing', 'Swap Only'];

export default function FilterBar({ onApply }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
    });
  };

  return (
    <View className="bg-white p-4 border-b border-gray-200">
      {/* Category Dropdown */}
      <View className="mb-3">
        <Text className="text-gray-700 mb-1 font-medium">Category</Text>
        <View className="border border-gray-300 rounded-lg bg-white">
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          >
            {CATEGORIES.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Price Range */}
      <View className="flex-row justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-gray-700 mb-1 font-medium">Min Price</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0"
            value={minPrice}
            onChangeText={setMinPrice}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          />
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-gray-700 mb-1 font-medium">Max Price</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="1000"
            value={maxPrice}
            onChangeText={setMaxPrice}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          />
        </View>
      </View>

      {/* Apply Button */}
      <TouchableOpacity
        onPress={handleApply}
        className="bg-black rounded-lg py-3 flex-row items-center justify-center"
      >
        <Ionicons name="filter" size={18} color="white" className="mr-2" />
        <Text className="text-white font-medium">Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );
}
