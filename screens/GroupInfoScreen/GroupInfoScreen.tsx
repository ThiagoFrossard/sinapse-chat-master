import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { DataStore, Auth } from "aws-amplify";
import { ChatRoom, ChatRoomUser, User } from "../../src/models";
import { useRoute } from "@react-navigation/native";
import UserItem from "../../components/UsersItem";

const GroupInfoScreen = () => {
	const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
	const [allUsers, setAllUsers] = useState<User[]>([]);

	const route = useRoute();

	useEffect(() => {
		fetchChatRoom();
		fetchUsers();
	}, []);

	const fetchChatRoom = async () => {
		if (!route.params?.id) {
			console.warn("No chatroom id provided");
			return;
		}
		const chatRoom = await DataStore.query(ChatRoom, route.params.id);
		if (!chatRoom) {
			console.error("Couldn't find a chat room with this id");
		} else {
			setChatRoom(chatRoom);
		}
	};

	const fetchUsers = async () => {
		const fetchedUsers = await (await DataStore.query(ChatRoomUser))
			.filter((chatRoomUser) => chatRoomUser.chatRoom.id === route.params?.id)
			.map((chatRoomUser) => chatRoomUser.user);

		setAllUsers(fetchedUsers);
	};

	const confirmDelete = async (user) => {

    const authData = await Auth.currentAuthenticatedUser()
    if(chatRoom?.Admin?.id !== authData.attributes.sub) {
      Alert.alert('Você não é o Administrador desse grupo')
      return;
    }

		if (user.id === chatRoom?.Admin?.id) {
			Alert.alert("Você é o administrador, você não pode se deletar");
			return;
		}

		Alert.alert(
			"Confirmar",
			`Você tem certeza que quer deletar ${user.name} do grupo ?`,
			[
				{
					text: "Delete",
					onPress: () => deleteUser(user),
					style: "destructive",
				},
				{
					text: "Cancelar",
				},
			]
		);
	};

	const deleteUser = async (user) => {
		const chatRoomUsersToDelete = (await DataStore.query(ChatRoomUser)).filter(
			(cru) => cru.chatRoom.id === chatRoom?.id && cru.user.id === user.id
		)

    if(chatRoomUsersToDelete.length > 0){
      await DataStore.delete(chatRoomUsersToDelete[0])
    }
    setAllUsers(allUsers.filter((u) => u.id !== user.id))
	};

	return (
		<View style={styles.root}>
			<Text style={styles.title}>{chatRoom?.name}</Text>

			<Text style={styles.title}>Users ({allUsers.length})</Text>
			<FlatList
				data={allUsers}
				renderItem={({ item }) => (
					<UserItem user={item} isAdmin={chatRoom?.Admin?.id === item.id} onLongPress={() => confirmDelete(item)}/>
				)}
				
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		backgroundColor: "white",
		padding: 10,
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
	},
});

export default GroupInfoScreen;
function item(item: any) {
	throw new Error("Function not implemented.");
}

