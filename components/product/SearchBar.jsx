import { Ionicons } from '@expo/vector-icons';
import { TextInput, TouchableOpacity, View } from 'react-native';

export default function SearchBar({ value, onChangeText, onClear, onToggleFilters }) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
      <Ionicons name="search" size={20} color="gray" className="mr-2" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search products..."
        className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} className="ml-2">
          <Ionicons name="close-circle" size={20} color="gray" />
        </TouchableOpacity>
      )}

      {/* Toggle Filters Button */}
      <TouchableOpacity onPress={onToggleFilters} className="ml-2">
        <Ionicons name="filter-outline" size={24} color="#2f6feb" />
      </TouchableOpacity>
    </View>
  );
}
