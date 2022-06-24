import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	FlatList,
	Pressable,
	Text,
	SafeAreaView,
} from "react-native";
import UserItem from "../components/UsersItem/UserItem";
import { ChatRoom, ChatRoomUser, User } from "../src/models";
import { Auth, DataStore } from "aws-amplify";

import NewGroupButton from "../components/NewGroupButton/NewGroupButton";
import { useNavigation } from "@react-navigation/native";

export default function UsersScreen() {
	const [users, setUsers] = useState<User[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
	const [isNewGroup, setIsNewGroup] = useState(false);

	useEffect(() => {
		const myContacts = async () => {
			const authUser = await Auth.currentAuthenticatedUser();
			const dbUser = await DataStore.query(User, authUser.attributes.sub);
			DataStore.query(User, user => user.id("ne", dbUser?.id)).then(setUsers);
		}
		myContacts();
	}, []);

	// useEffect(() => {
	//   // query users
	//   const fetchUsers = async () => {
	// 	  const fetchedUsers = await DataStore.query(User)
	// 	  setUsers(fetchedUsers)
	//   }
	//   fetchUsers()
	// }, [])

	const navigation = useNavigation();

	const addUserToChatRoom = async (user, chatRoom) => {
		DataStore.save(
			new ChatRoomUser({
				user,
				chatRoom,
			})
		);
	};

	const existChatRoom = async (users, chatRoom, vdd) => {
		const authUser = await Auth.currentAuthenticatedUser()
		const dbUser = authUser.attributes.sub;

		// const fetchedUsers = await (await DataStore.query(ChatRoomUser))
		// .filter(chatRoomUser => chatRoomUser.chatRoom.id === chatRoom.id)
		// .map(chatRoomUser => chatRoomUser.user)

		const fetchedUsers2 = await (await DataStore.query(ChatRoomUser))
		.filter(chatRoomUser => chatRoomUser.chatRoom.id === chatRoom.id)
		.map(chatRoomUser => chatRoomUser.user.id == users.id)

		const fetchedUsers3 = await (await DataStore.query(ChatRoomUser))
		.filter(chatRoomUser => chatRoomUser.chatRoom.id === chatRoom.id)
		.map(chatRoomUser => chatRoomUser.user.id == dbUser)

		if((fetchedUsers2[0] && !fetchedUsers2[1]) && (fetchedUsers3[1] && !fetchedUsers3[0])){
			navigation.navigate("ChatRoom", { id: chatRoom.id });
			vdd = true
			return vdd
		}else if((fetchedUsers2[1] && !fetchedUsers2[0]) && (fetchedUsers3[0] && !fetchedUsers3[1])){
			navigation.navigate("ChatRoom", { id: chatRoom.id });		
			vdd = true
			return vdd
		}else{
			return vdd
		}

	}

	const createChatRoom = async (users) => {
		// Create a chat room
		const newChatRoom = await DataStore.save(new ChatRoom({ newMessages: 0 }));

		// Connect auth user with the chat room
		const authUser = await Auth.currentAuthenticatedUser();

		const dbUser = await DataStore.query(User, authUser.attributes.sub);
		if (dbUser) {
			await addUserToChatRoom(dbUser, newChatRoom);
		}

		const newChatRoomData = {
			newMessages: 0,
			Admin: dbUser,
		};

		if (users.length > 1) {
			newChatRoomData.name = "Novo Grupo";
			newChatRoomData.imageUri = "";
		}

		// connect clicked user with the chat room
		await Promise.all(
			users.map((user) => addUserToChatRoom(user, newChatRoom))
		);

		navigation.navigate("ChatRoom", { id: newChatRoom.id });
	};

	const isUserSelected = (user) => {
		return selectedUsers.some((selectedUser) => selectedUser.id === user.id);
	};

	const onUserPress = async (user) => {
		if (isNewGroup) {
			if (isUserSelected(user)) {
				setSelectedUsers(
					selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
				);
			} else {
				setSelectedUsers([...selectedUsers, user]);
			}
		} else {
			const chatRooms = await DataStore.query(ChatRoom)
			if(chatRooms.length != 0){
				let verdade = false
				let teste = false
				for(const element of chatRooms){
					const avdd = await existChatRoom(user, element, verdade)
					if(avdd){
						teste = true
						break;
					}
				}
				if(!teste){
					await createChatRoom([user]);
				}
			}else{
				await createChatRoom([user]);
			}
		}
	};

	const saveGroup = async () => {
		await createChatRoom(selectedUsers);
	};

	return (
		<SafeAreaView style={styles.page}>
			<FlatList
				data={users}
				renderItem={({ item }) => (
					<UserItem
						user={item}
						onPress={() => onUserPress(item)}
						isSelected={isNewGroup ? isUserSelected(item) : undefined} onLongPress={undefined}	/>
				)}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={() => (
					<NewGroupButton onPress={() => setIsNewGroup(!isNewGroup)} />
				)}
			/>
			{isNewGroup && (
				<Pressable style={styles.button} onPress={saveGroup}>
					<Text style={styles.buttonText}>
						Salvar Grupo ({selectedUsers.length})
					</Text>
				</Pressable>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		backgroundColor: "white",
	},
	button: {
		backgroundColor: "#3777f0",
		marginHorizontal: 10,
		padding: 10,
		alignItems: "center",
		borderRadius: 10,
	},
	buttonText: {
		color: "white",
		fontWeight: "bold",
	},
});
