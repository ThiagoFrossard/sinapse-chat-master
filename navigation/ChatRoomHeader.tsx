import React, { useEffect, useState } from "react";
import { View, Image, Text, useWindowDimensions, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DataStore, Auth } from "aws-amplify";
import { User, ChatRoomUser, ChatRoom } from "../src/models";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";

const ChatRoomHeader = ({ id, children }) => {
	const { width } = useWindowDimensions();

	const [user, setUser] = useState<User | null>(null);
	const [allUsers, setAllUsers] = useState<User[]>([]);
	const [chatRoom, setChatRoom] = useState<ChatRoom | undefined>(undefined);

	const navigation = useNavigation()

	const fetchUsers = async () => {
		const fetchedUsers = await (await DataStore.query(ChatRoomUser))
			.filter((chatRoomUser) => chatRoomUser.chatRoom.id === id)
			.map((chatRoomUser) => chatRoomUser.user);

		setAllUsers(fetchedUsers);

		const authUser = await Auth.currentAuthenticatedUser();
		setUser(
			fetchedUsers.find((user) => user.id !== authUser.attributes.sub) || null
		);
	};

	const fetchChatRoom = async () => {
		DataStore.query(ChatRoom, id).then(setChatRoom);
	};

	useEffect(() => {
		if (!id) {
			return;
		}

		fetchUsers();
		fetchChatRoom();
	}, []);



	const getLastOnlineText = () => {
		if (!user?.LastOnlineAt) {
			return null;
		}
		const lastOnlineDiffMS = moment().diff(moment(user.LastOnlineAt));
		if (lastOnlineDiffMS < 5 * 60 * 1000) {
			return "online";
		} else {
			return `Última vez online ${moment(user.LastOnlineAt).fromNow()}`;
		}
	};

	const getUserNames = () => {
   return allUsers.map((user) => user.name).join(', ')
  };

  const openInfo = () => {
	//redirecionar para Info Page
	navigation.navigate('GroupInfoScreen', { id })

  }

  const isGroup =  allUsers.length > 2;



	return (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "space-between",
				width: width - 60,
				padding: 10,
				alignItems: "center",
			}}
		>
			<Image
				source={{uri: chatRoom?.imageUri || user?.imageUri}}
				style={{ width: 30, height: 30, borderRadius: 30 }}
			/>
			<Pressable onPress={openInfo} style={{ flex: 1, marginLeft: 10 }}>
				<Text
					style={{ flex: 1, marginLeft: 5, fontSize: 18, fontWeight: "bold" }}
				>
					{chatRoom?.name || user?.name}
				</Text>
				<Text numberOfLines={1}>{isGroup ? getUserNames() : getLastOnlineText()}</Text>
			</Pressable>

			<Feather
				name="camera"
				size={24}
				color="grey"
				style={{ marginHorizontal: 10 }}
			/>
			<Feather
				name="edit"
				size={24}
				color="grey"
				style={{ marginHorizontal: 10 }}
			/>
		</View>
	);
};

export default ChatRoomHeader;
