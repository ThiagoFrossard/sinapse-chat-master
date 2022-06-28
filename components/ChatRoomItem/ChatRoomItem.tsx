import React, {useState, useEffect} from "react";
import { Text, View, Image, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DataStore } from "@aws-amplify/datastore";
import { ChatRoomUser, User, Message } from "../../src/models";
import { Auth } from "aws-amplify";
import styles from './styles'
import moment from "moment";
import 'moment/locale/pt-br'


export default function ({ chatRoom }) {
	// const [users, setUsers] = useState<User[]>([]) // all users in this chatroom
	const [user, setUser] = useState<User|null>(null) // display user
	const [lastMessage, setLastMessage] = useState<Message|undefined>() // show lastMessage
	const [isLoading, setisLoading] = useState(true)

	const navigation = useNavigation()

	useEffect(() => {
	  const fetchUsers = async () => {
		const fetchedUsers = await (await DataStore.query(ChatRoomUser))
		.filter(chatRoomUser => chatRoomUser.chatRoom.id === chatRoom.id)
		.map(chatRoomUser => chatRoomUser.user)
		// setUsers(fetchedUsers)

		const authUser = await Auth.currentAuthenticatedUser()
		setUser(fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null)

		setisLoading(true)
	  }
	  fetchUsers()
	}, [])
	
	useEffect(() => {
	  if(!chatRoom.chatRoomLastMessageId){
		  return
	  }
		 DataStore.query(Message, chatRoom.chatRoomLastMessageId).then(setLastMessage)
	}, [chatRoom.chatRoomLastMessageId])
	
	const onPress = () => {
		navigation.navigate('ChatRoom', {id: chatRoom.id})
	}

	if (!isLoading) {
		return <ActivityIndicator/>
	}

	moment.locale('pt-br');
	const time = moment(lastMessage?.createdAt).from(moment())


	return (
		<Pressable onPress={onPress} style={styles.container}>
			<Image
				style={styles.image}
				source={{
					uri: chatRoom.imageUri || user?.imageUri
				}}
			/>

			{!!chatRoom.newMessages && <View style={styles.badgeContainer}>
				<Text style={styles.badgeText}>{chatRoom.newMessages}</Text>
			</View> }

			<View style={styles.rightContainer}>
				<View style={styles.row}>
					<Text style={styles.name}>{chatRoom.name || user?.name}</Text>
					<Text style={styles.text}>{time}</Text>
				</View>
				<Text numberOfLines={1} style={styles.text}>
					{lastMessage?.content}
				</Text>
			</View>
		</Pressable>
	);
}


