import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	useWindowDimensions,
	Pressable,
	Alert,
	Image
} from "react-native";
import React, { useState, useEffect } from "react";
import { Auth, DataStore, Storage } from "aws-amplify";
import { User } from "../../src/models";
import { S3Image } from "aws-amplify-react-native";
import AudioPlayer from "../AudioPlayer";
import { Ionicons } from "@expo/vector-icons";
import { Message as MessageModel } from "../../src/models";
import MessageReply from "../MessageReply";
import { useActionSheet } from "@expo/react-native-action-sheet";

const blue = "#3872e9";
const grey = "lightgrey";

export default function Message(props) {
	const { setAsMessageReply, message: propMessage } = props;

	const [message, setMessage] = useState<MessageModel>(propMessage);
	const [repliedTo, setRepliedTo] = useState<MessageModel | undefined>(
		undefined
	);
	const [user, setUser] = useState<User | undefined>();
	const [isMe, setIsMe] = useState<boolean | null>(null);
	const [soundURI, setSoundURI] = useState<any>(null);
	const [isDeleted, setIsDeleted] = useState(false);

	const { width } = useWindowDimensions();
	const { showActionSheetWithOptions } = useActionSheet();

	useEffect(() => {
		DataStore.query(User, message.userID).then(setUser);
	}, []);

	useEffect(() => {
		setMessage(propMessage);
	}, [propMessage]);

	useEffect(() => {
		if (message?.replyToMessageID) {
			DataStore.query(MessageModel, message.replyToMessageID).then(
				setRepliedTo
			);
		}
	}, [message]);

	useEffect(() => {
		const subscription = DataStore.observe(MessageModel, message.id).subscribe(
			(msg) => {
				if (msg.model === MessageModel) {
					if (msg.opType === "UPDATE") {
						setMessage((message) => ({ ...message, ...msg.element }));
					} else if ( msg.opType === 'DELETE'){
						setIsDeleted(true)
					}
				}
			}
		);

		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		setAsRead();
	}, [isMe, message]);

	useEffect(() => {
		if (message.audio) {
			Storage.get(message.audio).then(setSoundURI);
		}
	}, [message]);

	useEffect(() => {
		const checkIfMe = async () => {
			if (!user) {
				return;
			}
			const authUser = await Auth.currentAuthenticatedUser();
			setIsMe(user.id === authUser.attributes.sub);
		};
		checkIfMe();
	}, [user]);

	const setAsRead = async () => {
		if (isMe === false && message.status !== "READ") {
			await DataStore.save(
				MessageModel.copyOf(message, (updated) => {
					updated.status = "READ";
				})
			);
		}
	};

	const deleteMessage = async () => {
		await DataStore.delete(message);
	};

	const confirmDelete = () => {
		Alert.alert(
			"Deletar",
			"Você tem certeza de que deseja deletar essa mensagem ?",
			[
				{
					text: "Delete",
					onPress: deleteMessage,
				},
				{
					text: "Cancel",
				},
			]
		);
	};

	const ActionPress = (index) => {
		if (index === 0) {
			setAsMessageReply();
		} else if (index === 1) {
			confirmDelete();
		} else {
			Alert.alert("Não pode fazer essa ação", "Essa não é sua mensagem");
		}
	};

	const openActionMenu = () => {
		const options = ["Reply", "Delete", "Cancel"];
		if (isMe) {
			options.push("Delete");
		}

		const destructiveButtonIndex = 1;
		const cancelButtonIndex = 2;

		showActionSheetWithOptions(
			{
				options,
				destructiveButtonIndex,
				cancelButtonIndex,
			},
			ActionPress
		);
	};

	if (!user) {
		return <ActivityIndicator />;
	}

	return (
		<Pressable
			onLongPress={openActionMenu}
			style={[
				styles.container,
				isMe ? styles.rightContainer : styles.leftContainer,
				{ width: soundURI ? "75%" : "auto" },
			]}
		>
			{repliedTo && <MessageReply message={repliedTo} />}

			<View style={styles.row}>
				{message.image && (
					<View style={{ marginBottom: message.content ? 10 : 0 }}>
						<S3Image
							imgKey={message.image}
							style={{ width: width * 0.65, aspectRatio: 4 / 3 }}
							resizeMode="contain"
						/>
					</View>
				)}

				{message.document && (
					<View style={{ marginBottom: message.content ? 10 : 0 }}>
						<Image
						source={{ uri: 'https://th.bing.com/th/id/R.148ee6940b3beecb1fff34e6cf469749?rik=GWR9Noq2FBN%2fAQ&riu=http%3a%2f%2fopenclipart.org%2fimage%2f2400px%2fsvg_to_png%2f188817%2fpdf-icon.png&ehk=K9rMzs5XV05gVZYLAnpt4voQyEPeCOYZ4InDf9QI9Zg%3d&risl=&pid=ImgRaw&r=0' }}
						style={{ width: 100, height: 100, borderRadius: 10 }}
					/>
					</View>
				)}

				{soundURI && <AudioPlayer soundURI={soundURI} />}

				{!!message.content && (
					<Text style={[{ color: isMe ? "white" : "black" }]}>
						{isDeleted ? "Mensagem Deletada" : message.content}
					</Text>
				)}

				{isMe && !!message.status && message.status !== "SENT" && (
					<Ionicons
						name={
							message.status === "DELIVERED" ? "checkmark" : "checkmark-done"
						}
						size={16}
						color="white"
						style={{ marginHorizontal: 5 }}
					/>
				)}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
		margin: 10,
		borderRadius: 10,
		maxWidth: "75%",
	},
	text: {
		color: "white",
	},
	row: {
		flexDirection: "row",
		alignItems: "flex-end",
	},
	messageReply: {
		backgroundColor: "grey",
		padding: 5,
		borderRadius: 5,
	},
	leftContainer: {
		backgroundColor: grey,
		marginLeft: 10,
		marginRight: "auto",
	},
	rightContainer: {
		backgroundColor: blue,
		marginLeft: "auto",
		marginRight: 10,
		alignItems: "flex-end",
	},
});
