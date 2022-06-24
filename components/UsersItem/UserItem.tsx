import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View, Image, Pressable } from "react-native";
import styles from './styles'


export default function UserItem ({
	user, 
	onPress,
	onLongPress,
	isSelected,
	isAdmin= false
}) {

	return (
		<Pressable onPress={onPress} onLongPress={onLongPress} style={styles.container}>
			<Image
				style={styles.image}
				source={{
					uri: user.imageUri
				}}
			/>
			<View style={styles.rightContainer}>
					<Text style={styles.name}>{user.name}</Text>
					{isAdmin && <Text>Admin</Text>}
			</View>
			{isSelected !== undefined && (<Feather 
			name={isSelected ? 'check-circle' : 'circle'}
			size={20} 
			color="black" 
			/>)}
		</Pressable>
	);
}


