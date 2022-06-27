import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	FlatList,
	Pressable,
	Text
} from "react-native";
import { Auth, DataStore } from "aws-amplify";
import { ChatRoom, ChatRoomUser } from "../src/models";
import ChatRoomItem from "../components/ChatRoomItem";

export default function TabOneScreen() {
	const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

	useEffect(() => {
		const subscription = DataStore.observe(ChatRoom).subscribe(msg => {
			const fetchChatRooms = async () => {
				const userData = await Auth.currentAuthenticatedUser();
	  
				 const chatRooms = (await DataStore.query(ChatRoomUser))
					  .filter(
					   (chatRoomUser) => chatRoomUser.user.id === userData.attributes.sub)
						.map((chatRoomUser) => chatRoomUser.chatRoom);
				   setChatRooms(chatRooms);
			  };
			  fetchChatRooms();
		});
		subscription
	  }, []);

	const logOut = async () => {
		await DataStore.clear();
		Auth.signOut();
	};

	return (
		<View style={styles.page}>
        	 <FlatList
				data={chatRooms.sort((a, b) => b.updatedAt > a.updatedAt)}
				renderItem={({ item }) => <ChatRoomItem chatRoom={item} />}
				showsVerticalScrollIndicator={false}
      		/>   
			{/* <Pressable
				onPress={logOut}
				style={{ backgroundColor: "red", height: 50, margin: 10,borderRadius: 50, alignItems:'center', justifyContent: 'center', }}
			>
				<Text>Logout</Text>
			</Pressable> */}
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		backgroundColor: "white",
	},
});
